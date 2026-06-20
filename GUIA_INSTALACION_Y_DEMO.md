# Guía de Instalación, Ejecución y Demostración
## Sistema de Ticketing Mundial 2026 — BDII UCU 2026
### Valentín Barrios y Valentín Hernández

---

## PASO 1 — Instalar Java 21 en la VM Linux

Abrí la terminal en tu VM y ejecutá:

```bash
sudo apt update
sudo apt install openjdk-17-jdk maven -y
```

Verificá que quedó bien:
```bash
java -version
# Debe mostrar: openjdk version "17..."

mvn -version
# Debe mostrar: Apache Maven 3.x...
```

---

## PASO 2 — Verificar que PostgreSQL está corriendo

```bash
sudo service postgresql status
# Si dice "inactive", arrancalo:
sudo service postgresql start
```

Verificá que la BD ticketing ya existe (la creaste antes):
```bash
sudo -u postgres psql -c "\l" | grep ticketing
# Debe aparecer: ticketing | postgres | UTF8 ...
```

Si no existe, créala y ejecutá los scripts:
```bash
sudo -u postgres createdb ticketing
mkdir -p /tmp/sql
chmod -R 777 /tmp/sql
cp /media/sf_entrega/sql/*.sql /tmp/sql/
sudo -u postgres psql -d ticketing -f /tmp/sql/01_ddl.sql
sudo -u postgres psql -d ticketing -f /tmp/sql/02_triggers.sql
sudo -u postgres psql -d ticketing -f /tmp/sql/03_procedures.sql
sudo -u postgres psql -d ticketing -f /tmp/sql/05_seed.sql
```

---

## PASO 3 — Copiar el proyecto Spring Boot a la VM

```bash
# Copiar la carpeta springboot desde la carpeta compartida
cp -r /media/sf_entrega/springboot /home/vboxuser/ticketing
cd /home/vboxuser/ticketing
```

---

## PASO 4 — Configurar la contraseña de PostgreSQL

El usuario postgres en Ubuntu recién instalado no tiene contraseña por defecto. Hay que setearla:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres123';"
```

---

## PASO 5 — Correr el backend Spring Boot

```bash
cd /home/vboxuser/ticketing

export DB_PASSWORD=postgres123
export JWT_SECRET=claveSuperSecretaParaJWT2026Mundial

mvn spring-boot:run
```

La primera vez tarda unos minutos porque descarga las dependencias.
Cuando veas esto, está listo:
```
Started TicketingApplication in X.XXX seconds
```

---

## PASO 5b — Abrir la aplicación web (frontend)

El backend sirve el **frontend** en la misma dirección. Una vez levantado, abrí en el navegador:

```
http://localhost:8080
```

La app cubre los tres roles (se usa la contraseña de demo `test1234`):

- **Usuario general** (`valentin@ucu.edu.uy`): comprar entradas (carrito, máx. 5), ver el **QR dinámico** que rota cada 30 s, listar compras (y pagarlas), transferir entradas y aceptar transferencias.
- **Administrador** (`admin.mex@fifa.org`): crear estadios y sectores, programar/cancelar eventos, habilitar sectores y ver los reportes (ranking de compradores, eventos más vendidos, estadísticas por estadio).
- **Funcionario** (`func@fifa.org`): validar el ingreso de una entrada (entrada + token + dispositivo).

> El frontend es estático (HTML/CSS/JS) servido por Spring Boot desde `resources/static/`, por
> lo que comparte origen con la API (no requiere CORS ni un build aparte). El generador de QR usa
> una librería por CDN; sin internet, la app muestra igual el código del token rotando cada 30 s.

---

## PASO 6 — Probar que todo funciona

Abrí OTRA terminal (sin cerrar la del servidor) y ejecutá:

```bash
# 1. Login (contraseña de demo: "test1234")
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"valentin@ucu.edu.uy","password":"test1234"}' \
  | python3 -m json.tool

# 2. Ver las tablas de la BD
sudo -u postgres psql -d ticketing -c "SELECT * FROM usuario;"
sudo -u postgres psql -d ticketing -c "SELECT * FROM entrada;"
sudo -u postgres psql -d ticketing -c "SELECT * FROM venta;"

# 3. Ver las 23 tablas creadas
sudo -u postgres psql -d ticketing -c "\dt"
```

---

## PASO 7 — Demostración para el profesor

### Mostrar la BD funcionando:

```bash
# Mostrar todas las tablas
sudo -u postgres psql -d ticketing -c "\dt"

# Mostrar los datos de prueba cargados
sudo -u postgres psql -d ticketing -c "SELECT * FROM usuario;"
sudo -u postgres psql -d ticketing -c "SELECT * FROM entrada;"
sudo -u postgres psql -d ticketing -c "SELECT * FROM venta;"
sudo -u postgres psql -d ticketing -c "SELECT * FROM evento;"

# Ranking de compradores (consulta avanzada 1)
sudo -u postgres psql -d ticketing -f /tmp/sql/04_queries.sql 2>&1 | head -30

# Mostrar un trigger funcionando — intentar insertar más de 5 entradas:
sudo -u postgres psql -d ticketing -c "
DO \$\$
DECLARE v BIGINT;
BEGIN
  -- Intentar comprar 6 entradas (debe fallar)
  CALL sp_registrar_compra(1, ARRAY[1,1,1,1,1,1]::bigint[], v);
END \$\$;"
# Debe mostrar: ERROR: Limite excedido: una compra no puede tener mas de 5 entradas (venta X)
```

### Mostrar la anti-superposición de eventos:

```bash
sudo -u postgres psql -d ticketing -c "
INSERT INTO evento(id_estadio, id_seleccion_local, id_seleccion_visitante,
                   fecha_hora_inicio, id_administrador)
VALUES (1, 2, 3, '2026-06-20 19:00-03', 3);"
# Debe mostrar: ERROR: Conflicto de agenda: ya existe un evento solapado en el estadio 1 en ese horario
# (el trigger BEFORE corre primero y da el mensaje claro de negocio)
```

### Mostrar la transferencia de una entrada (cambio de titular):

```bash
sudo -u postgres psql -d ticketing -c "
DO \$\$ DECLARE t BIGINT;
BEGIN
  CALL sp_transferir_entrada(1, 2, 1, t);   -- entrada 1, destino usuario 2, solicitante usuario 1 (el titular)
  CALL sp_aceptar_transferencia(t, 2);      -- la acepta el usuario 2 (el destinatario)
END \$\$;"

# Verificar el nuevo titular y el contador de transferencias:
sudo -u postgres psql -d ticketing -c \
  "SELECT id_entrada, id_usuario_actual, estado, cantidad_transferencias FROM entrada WHERE id_entrada = 1;"
# id_usuario_actual pasa de 1 a 2, estado = TRANSFERIDA, cantidad_transferencias = 1
```

### Mostrar la validación del QR (consumo irreversible + auditoría):

```bash
# Validar la entrada 1 con su token activo (token 1), el funcionario 4 y su dispositivo 1
sudo -u postgres psql -d ticketing -c "
DO \$\$ DECLARE r VARCHAR;
BEGIN
  CALL sp_validar_acceso(1, 1, 4, 1, r);
  RAISE NOTICE 'Resultado: %', r;
END \$\$;"
# Debe mostrar: NOTICE: Resultado: ACEPTADO

# La entrada queda CONSUMIDA y el token se desactiva:
sudo -u postgres psql -d ticketing -c "SELECT id_entrada, estado FROM entrada WHERE id_entrada = 1;"

# Intentar validar de nuevo registra un intento RECHAZADO (auditoría de seguridad):
sudo -u postgres psql -d ticketing -c "
DO \$\$ DECLARE r VARCHAR;
BEGIN CALL sp_validar_acceso(1, 1, 4, 1, r); RAISE NOTICE '%', r; END \$\$;"
sudo -u postgres psql -d ticketing -c "SELECT id_entrada, resultado, fecha_hora FROM validacion ORDER BY id_validacion;"
# Se ven dos filas: una ACEPTADO y una RECHAZADO
```

### Probar la API REST (registro, compra y administración):

```bash
# 1. Registrar un usuario nuevo (devuelve un token de auto-login)
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nuevo@ucu.edu.uy","password":"test1234","nombre":"Nuevo","apellido":"Usuario",
       "dirIdPais":4,"localidad":"Montevideo","calle":"Colonia","numero":"1500","codigoPostal":"11100",
       "docIdPais":4,"tipoDocumento":"CI","docNumero":"99887766"}' | python3 -m json.tool

# 2. Login como administrador y guardar el token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin.mex@fifa.org","password":"test1234"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 3. Crear un estadio (solo el rol ADMINISTRADOR_PAIS puede)
curl -s -X POST http://localhost:8080/api/estadios \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nombre":"Estadio BBVA","idPais":3,"ciudad":"Monterrey","direccion":"Av. Pablo Livas 2011"}' \
  | python3 -m json.tool

# 4. Ver las compras del usuario 1 (necesita token de un USUARIO_GENERAL)
TOKEN_U=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"valentin@ucu.edu.uy","password":"test1234"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s http://localhost:8080/api/usuarios/1/compras -H "Authorization: Bearer $TOKEN_U" | python3 -m json.tool
```

> Nota: la demo de transferencia/validación por psql modifica los datos del seed.
> Si querés repetir la demostración desde cero, recreá la BD ejecutando de nuevo
> los scripts `01`→`03` y `05`.

---

## ENTREGABLES — Qué subir a WebAsignatura

### Fechas:
- **22 junio** → Informe en PDF
- **24 junio** → ZIP del código + URL de GitHub

### Cómo preparar el PDF del informe:

```bash
# En la VM Linux, instalar LibreOffice si no está:
sudo apt install libreoffice -y

# Convertir el Word a PDF:
soffice --headless --convert-to pdf \
  /media/sf_entrega/Informe_BDII_Ticketing_Mundial2026.docx \
  --outdir /media/sf_entrega/
```

El PDF quedará en la carpeta compartida, visible desde Windows.

### Cómo preparar el ZIP del código:

En Windows, en la carpeta `entrega\`, seleccioná las carpetas `sql\` y `springboot\` + el `README.md`, click derecho → Comprimir en ZIP.

### GitHub (obligatorio):

1. Crear cuenta en https://github.com si no tienen
2. Crear un repositorio público llamado `ticketing-mundial-2026`
3. Subir el contenido de la carpeta `entrega\`:
```bash
# En Windows, abrir Git Bash o PowerShell en la carpeta entrega\
git init
git add .
git commit -m "Entrega final BDII - Ticketing Mundial 2026"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ticketing-mundial-2026.git
git push -u origin main
```

---

## RESUMEN RÁPIDO — Comandos del día de entrega

```bash
# 1. Arrancar PostgreSQL
sudo service postgresql start

# 2. Verificar BD
sudo -u postgres psql -d ticketing -c "\dt"

# 3. Correr Spring Boot
cd /home/vboxuser/ticketing
export DB_PASSWORD=postgres123
export JWT_SECRET=claveSuperSecretaParaJWT2026Mundial
mvn spring-boot:run

# 4. Demostrar trigger de límite (esperar: ERROR: Limite excedido...)
sudo -u postgres psql -d ticketing -c "
DO \$\$ DECLARE v BIGINT;
BEGIN CALL sp_registrar_compra(1, ARRAY[1,1,1,1,1,1]::bigint[], v);
END \$\$;"

# 5. Convertir informe a PDF
soffice --headless --convert-to pdf /media/sf_entrega/Informe_BDII_Ticketing_Mundial2026.docx --outdir /media/sf_entrega/
```
