# Ticketing Mundial 2026 — BDII UCU

Sistema de ticketing para los partidos del Mundial FIFA 2026. Trabajo obligatorio de Bases de Datos II, Universidad Católica del Uruguay, primer semestre 2026.

**Valentín Barrios · Valentín Hernández**

---

## De qué se trata

La idea es simple: un sistema para comprar, transferir y validar entradas para los partidos del mundial. Lo que lo hace diferente a un sistema de tickets normal es que los códigos QR son dinámicos — se renuevan cada 30 segundos para evitar que alguien saque una captura de pantalla y la use para entrar.

Hay tres tipos de usuarios: el que compra entradas, el admin que gestiona los estadios y eventos, y el funcionario que valida en la puerta.

---

## Requerimiento de Linux (consigna)

La consigna pide que la base de datos resida en Linux. Esto está cubierto por Docker: el contenedor `postgres:16-alpine` corre sobre **Alpine Linux** real, gestionado por el motor WSL2 de Docker Desktop. La base de datos no toca Windows en ningún momento — vive y opera completamente en Linux dentro del contenedor.

Para verificarlo podés correr:
```bash
docker exec ticketing_db uname -a
# Linux ... (muestra el kernel de Linux del contenedor)
```

---

## Stack

- **Base de datos**: PostgreSQL 16 sobre Alpine Linux (Docker)
- **Backend**: Spring Boot 3.3 / Java 21, JdbcTemplate (sin ORM)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Seguridad**: JWT
- **Deploy**: Docker + Docker Compose

---

## Cómo correrlo

Lo único que necesitás tener instalado es **Docker Desktop**.

```bash
git clone https://github.com/valentinhernandez1/ticketing-mundial-2026.git
cd ticketing-mundial-2026
docker compose up --build -d
```

La primera vez tarda un rato porque descarga las imágenes y compila el proyecto. Cuando termina, abrís el navegador en:

```
http://localhost:8080
```

La base de datos se crea sola con todos los datos de prueba incluidos.

Para parar todo:
```bash
docker compose down
```

---

## Usuarios de prueba

Todos tienen contraseña `test1234`.

| Email | Rol | Qué puede hacer |
|---|---|---|
| `valentin@ucu.edu.uy` | Usuario general | Comprar entradas, ver QR, transferir |
| `ana@ucu.edu.uy` | Usuario general | Recibir transferencias |
| `admin.mex@fifa.org` | Administrador | Crear estadios/eventos, ver reportes |
| `func@fifa.org` | Funcionario | Validar entradas en puerta |

---

## Cómo probar el flujo completo

**Comprar una entrada:**
1. Login con `valentin@ucu.edu.uy`
2. Ir a "Comprar entradas" → elegir sector → carrito → Comprar
3. En "Mis compras" aparece la venta en PENDIENTE → Confirmar → Pagar

**Ver el QR dinámico:**
1. Ir a "Mis entradas"
2. Click en "Ver QR" — el código se renueva cada 30 segundos

**Transferir una entrada:**
1. En "Transferencias" → elegís la entrada → ingresás el email del destinatario (`ana@ucu.edu.uy`)
2. Login con `ana@ucu.edu.uy` → Transferencias → Aceptar

**Validar en la puerta:**
1. Login con `func@fifa.org`
2. Ir a "Validar acceso" → configurar dispositivo con ID `1`
3. Podés usar la cámara para escanear el QR, o copiar el código de "Mis entradas" y pegarlo en modo manual
4. El código tiene formato `idEntrada:codigoHex` (ej: `1:bf67ff407a...`)

---

## Estructura del proyecto

```
entrega/
├── sql/
│   ├── 01_ddl.sql          — tablas, dominios, constraints, índices
│   ├── 02_triggers.sql     — reglas de negocio en la BD
│   ├── 03_procedures.sql   — stored procedures y funciones de reporte
│   ├── 04_queries.sql      — consultas avanzadas
│   └── 05_seed.sql         — datos de prueba
├── springboot/             — backend Java
├── frontend/               — React + Vite
├── Dockerfile              — build multi-stage: compila React + Java juntos
└── docker-compose.yml
```

---

## Desarrollo local (sin Docker completo)

Si querés correr el frontend con hot reload mientras desarrollás:

```bash
# Levantás solo la base de datos
docker compose up postgres -d

# Frontend en modo dev (http://localhost:5173)
cd frontend
npm install
npm run dev
```

El backend lo podés correr desde IntelliJ o VS Code apuntando a `localhost:5432`.

---

## Notas varias

- El QR usa el formato `{idEntrada}:{tokenHex}` — eso es lo que escanea el validador
- Los scripts SQL se ejecutan en orden al levantar Docker por primera vez
- Si la BD queda en mal estado: `docker compose down -v` borra todo y `docker compose up --build` la recrea limpia
- El seed (`05_seed.sql`) ya está incluido, no hace falta correrlo manualmente
