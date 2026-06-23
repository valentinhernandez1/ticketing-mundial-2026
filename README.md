# Ticketing Mundial FIFA 2026

Sistema de venta, transferencia y validación de entradas para el Mundial FIFA 2026 (USA · Canadá · México). Trabajo obligatorio de Bases de Datos II — UCU, primer semestre 2026.

## Integrantes

- Valentín Barrios
- Valentín Hernández

---

## Descripción General

Los sistemas de ticketing tradicionales emiten imágenes estáticas que pueden capturarse y reutilizarse. Este sistema implementa **entradas dinámicas**: el código QR de cada boleto se regenera cada 30 segundos, haciendo inútil cualquier captura de pantalla para ingresar a un partido.

El sistema maneja el ciclo de vida completo de una entrada: compra en hasta 5 boletos por transacción, transferencia entre usuarios (máximo 3 veces), presentación del QR en puerta y validación por un funcionario autorizado con un dispositivo registrado.

---

## Tecnologías

### Backend
- Java 21
- Spring Boot 3.3.2
- Spring Security + JWT (JJWT 0.12.6, algoritmo HS384)
- JdbcTemplate — se eligió sobre Hibernate para escribir SQL directamente y aprovechar características específicas de PostgreSQL (EXCLUDE, funciones de ventana, etc.)

### Frontend
- React 18
- Vite 5
- Tailwind CSS 3
- React Router v6
- Axios (con interceptor para 401 → /login)
- html5-qrcode (escaneo con cámara)
- qrcode (generación visual del QR)

### Base de Datos
- PostgreSQL 16 Alpine (Linux, via Docker)
- Extensiones: `citext`, `btree_gist`, `pgcrypto`

### Herramientas
- Docker + Docker Compose
- Maven 3.9
- Node.js 20
- Vitest + React Testing Library (22 tests de frontend)

---

## Arquitectura

El backend sigue una arquitectura de cuatro capas estricta. Ningún Controller accede a un Repository directamente.

```
Controller (@RestController)
    ↓  valida formato HTTP, delega
Service (@Service + @Transactional)
    ↓  aplica reglas de negocio
Repository (@Repository + JdbcTemplate)
    ↓  SQL parametrizado puro
PostgreSQL 16
    ↓  triggers, constraints, procedures
```

La seguridad es stateless: `JwtAuthFilter` extrae el token de cada request, verifica la firma HMAC-SHA384 y carga el usuario en el `SecurityContext`. Los endpoints se protegen con `@PreAuthorize("hasRole('...')")` por método.

En producción, el frontend compilado (`npm run build`) se copia dentro de `src/main/resources/static/` durante el build Docker y Spring Boot lo sirve en el puerto 8080. En desarrollo, Vite corre en el 5173 con un proxy hacia 8080 configurado en `vite.config.js`.

---

## Estructura del Proyecto

```
entrega/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js          # instancia Axios con interceptor JWT
│   │   │   └── index.js           # funciones exportadas por módulo
│   │   ├── components/
│   │   │   ├── QRModal.jsx        # modal con QR + countdown 30s
│   │   │   └── ui/                # Alert, PageHeader, LoadingSpinner, EmptyState
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT en localStorage, expone user/login/logout
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Comprar.jsx        # listado de eventos con sectores y carrito
│   │   │   ├── MisEntradas.jsx    # entradas del usuario + botón QR
│   │   │   ├── MisCompras.jsx     # historial con flujo confirmar → pagar
│   │   │   ├── Transferencias.jsx # enviar, aceptar y rechazar transferencias
│   │   │   ├── admin/             # Estadios, Eventos, Usuarios, Dispositivos, Asignaciones, Reportes
│   │   │   └── validador/         # Validador.jsx con cámara y modo manual
│   │   └── __tests__/             # suite Vitest (22 tests)
│   ├── package.json
│   └── vite.config.js
│
├── springboot/
│   └── src/main/java/uy/edu/ucu/ticketing/
│       ├── config/
│       │   └── GlobalExceptionHandler.java   # traduce excepciones DB a HTTP
│       ├── controller/                        # 14 controllers REST
│       ├── dto/                               # request/response records
│       ├── model/                             # POJOs + enums de dominio
│       ├── repository/                        # 19 repositories con JdbcTemplate
│       ├── security/                          # JwtService, JwtAuthFilter, SecurityConfig
│       └── service/                           # 15 services con lógica de negocio
│
├── sql/
│   ├── 01_ddl.sql         # tablas, dominios, constraints, índices
│   ├── 02_triggers.sql    # 12 triggers PL/pgSQL
│   ├── 03_procedures.sql  # 13 stored procedures
│   ├── 04_queries.sql     # consultas de reporte de referencia
│   └── 05_seed.sql        # datos de prueba (usuarios, estadio, evento)
│
├── Dockerfile             # build multi-stage: Node → Maven → JRE Alpine
├── docker-compose.yml     # postgres + app
└── README.md
```

---

## Modelo de Datos

El modelo tiene 23 tablas organizadas en cinco dominios:

| Dominio | Tablas |
|---------|--------|
| Geografía | `pais`, `pais_sede` |
| Usuarios | `direccion`, `usuario`, `documento`, `telefono`, `usuario_general`, `administrador_pais`, `funcionario_validacion`, `dispositivo` |
| Eventos | `estadio`, `sector`, `seleccion`, `evento`, `evento_sector`, `asignacion_funcionario_sector` |
| Ventas | `comision`, `venta`, `entrada`, `transferencia` |
| Validación | `token_qr`, `validacion`, `auditoria_transferencia` |

Decisiones que vale la pena conocer para la defensa:

- **Especialización disjunta de USUARIO**: tabla por subtipo — `usuario_general`, `administrador_pais` y `funcionario_validacion` tienen su propia tabla con PK=FK a `usuario`.
- **Precio snapshot en ENTRADA**: se congela al comprar para que cambios futuros de precio no afecten historial.
- **Comisión snapshot en VENTA**: la tasa vigente queda en `porcentaje_aplicado` al momento de la venta.
- **EXCLUDE USING gist**: previene solapamiento de eventos en el mismo estadio a nivel de motor — atómico, sin condición de carrera. El campo `periodo` es `tstzrange` calculado por trigger.
- **Índice único parcial para QR**: `ON token_qr(id_entrada) WHERE activo = TRUE` — garantiza un solo token activo por entrada.
- **Índice único parcial para validación**: `WHERE resultado = 'ACEPTADO'` — hace imposible consumir la misma entrada dos veces.

Los diagramas MER (versiones 1, 2 y 3) y el modelo lógico se encuentran en el informe del proyecto.

---

## Funcionalidades

### Registro y Autenticación
- Registro con email, documento (país + tipo + número), dirección y teléfonos múltiples
- Login con JWT de 1 hora (HS384)
- Tres roles: `USUARIO_GENERAL`, `ADMINISTRADOR_PAIS`, `FUNCIONARIO_VALIDACION`

### Compra de Entradas
- Listado de eventos con sectores disponibles y precios en tiempo real
- Carrito con hasta 5 entradas por transacción
- Flujo: PENDIENTE → CONFIRMADA → PAGA
- Comisión del 5% calculada automáticamente (tasa variable en el tiempo)

### Entradas y QR Dinámico
- Cada entrada tiene UUID único generado al momento de la compra
- QR que codifica `{idEntrada}:{tokenHex32}` — el token expira en 35 segundos
- El frontend renueva automáticamente cada 30 segundos
- El botón QR solo aparece cuando la venta está PAGA

### Transferencias
- Transferir por email con aceptación explícita del destinatario
- Durante la transferencia pendiente, la entrada queda bloqueada (no se puede usar el QR)
- Al aceptar, la entrada vuelve a EMITIDA para el nuevo titular
- Máximo 3 transferencias por entrada antes de validación

### Validación en Puerta
- Escáner QR con cámara o ingreso manual del código
- Verifica token vigente, entrada disponible, funcionario asignado al sector y dispositivo del funcionario
- Registra todos los intentos (aceptados y rechazados) para auditoría completa

### Administración
- Crear estadios con sectores y habilitar sectores por evento
- Programar eventos con anti-solapamiento automático
- Crear administradores y funcionarios con todos sus datos personales
- Registrar dispositivos de escaneo y asignar funcionarios a sectores
- Tres reportes: ranking de compradores, eventos por recaudación y estadísticas por estadio

---

## Base de Datos

Los scripts se ejecutan en orden; Docker Compose los monta como init files de PostgreSQL.

**`01_ddl.sql`** — Extensiones, tipos de dominio (`dom_estado_venta`, `dom_estado_entrada`, `dom_estado_transf`, `dom_resultado_val`), 23 tablas con constraints e índices.

**`02_triggers.sql`** — 12 triggers PL/pgSQL:
- `trg_venta_before_insert`: congela la comisión vigente
- `trg_entrada_before_insert`: controla aforo, aplica precio del sector y límite de 5 por compra
- `trg_recalc_venta`: recalcula totales al agregar o anular entradas
- `trg_evento_no_superpuesto` + EXCLUDE: doble protección contra solapamiento
- `trg_evento_cancelar`: anula entradas y desactiva tokens al cancelar un evento
- `trg_transferencia_before`: valida titularidad, límite de 3 y no duplicar pendientes
- `trg_transferencia_aceptar`: cambia el titular y restaura la entrada a EMITIDA
- `trg_auditar_transferencia`: log automático de cada cambio de estado
- `trg_validacion_before`: verifica token, dispositivo, estado de la entrada y asignación del funcionario
- `trg_validacion_after`: marca la entrada como CONSUMIDA al aceptar
- `trg_token_unico_activo`: desactiva el token anterior al generar uno nuevo

**`03_procedures.sql`** — 13 stored procedures para las operaciones principales: registro de usuarios, compra, confirmación, pago, transferencia, generación de token, validación, gestión de estadios y eventos. Incluye las funciones de reporte.

**`05_seed.sql`** — Países, selecciones, comisión del 5%, tres usuarios de prueba, un estadio en México con cuatro sectores, un evento y asignaciones.

---

## Instalación

### Opción 1 — Docker (recomendada)

Construye el frontend, lo embebe en el JAR y levanta todo con un solo comando.

```bash
git clone https://github.com/valentinhernandez1/ticketing-mundial-2026.git
cd ticketing-mundial-2026

docker compose up --build
```

La aplicación queda en `http://localhost:8080`. El primer arranque tarda más porque descarga dependencias de Maven y npm.

### Opción 2 — Desarrollo local

Para trabajar con hot-reload en el frontend.

**Base de datos:**
```bash
docker compose up postgres -d
```

**Backend** (desde `springboot/`):
```bash
mvn spring-boot:run
```

**Frontend** (desde `frontend/`):
```bash
npm install
npm run dev
```

El frontend en `http://localhost:5173` proxea `/api` hacia `http://localhost:8080`.

### Cuentas de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| valentin@ucu.edu.uy | test1234 | Usuario general |
| admin.mex@fifa.org | test1234 | Administrador (México) |
| func@fifa.org | test1234 | Funcionario de validación |

---

## Variables de Entorno

El proyecto funciona con los defaults de `application.yml`. Solo hace falta cambiarlos fuera de Docker.

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/ticketing` | URL de conexión |
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `postgres123` | Contraseña |
| `JWT_SECRET` | (valor en docker-compose.yml) | Clave HMAC para los JWT |

---

## API

### Público
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario general |
| POST | `/api/auth/login` | Login, retorna JWT |
| GET | `/api/paises` | Países para formularios |

### Autenticado (cualquier rol)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/consulta/eventos` | Eventos con sectores y disponibilidad |
| GET | `/api/consulta/catalogos` | Estadios y selecciones |
| GET | `/api/comisiones` | Tasa vigente |

### USUARIO_GENERAL
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/compras` | Comprar hasta 5 entradas |
| POST | `/api/compras/{id}/confirmar` | Confirmar venta |
| POST | `/api/compras/{id}/pagar` | Marcar como pagada |
| GET | `/api/usuarios/{id}/compras` | Historial con detalle de entradas |
| GET | `/api/usuarios/{id}/entradas` | Entradas actuales |
| GET | `/api/usuarios/{id}/transferencias` | Historial de transferencias |
| POST | `/api/entradas/{id}/token` | Generar token QR (35 segundos) |
| POST | `/api/transferencias` | Iniciar transferencia |
| POST | `/api/transferencias/{id}/aceptar` | Aceptar |
| POST | `/api/transferencias/{id}/rechazar` | Rechazar |

### FUNCIONARIO_VALIDACION
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/validaciones` | Validar QR en puerta |

### ADMINISTRADOR_PAIS
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/estadios` | Crear estadio |
| POST | `/api/estadios/{id}/sectores` | Agregar sector |
| POST | `/api/eventos` | Programar partido |
| POST | `/api/eventos/{id}/sectores` | Habilitar sector en evento |
| POST | `/api/eventos/{id}/cancelar` | Cancelar evento |
| GET/POST | `/api/dispositivos` | Dispositivos de escaneo |
| GET/POST/DELETE | `/api/asignaciones` | Asignaciones de funcionarios a sectores |
| GET/POST | `/api/usuarios/admins` | Administradores |
| GET/POST | `/api/usuarios/funcionarios` | Funcionarios |
| GET | `/api/reportes/ranking-compradores` | Top compradores |
| GET | `/api/reportes/eventos-top` | Eventos por recaudación |
| GET | `/api/reportes/estadisticas-estadio` | Estadísticas por estadio |

---

## Seguridad

- **JWT stateless**: token con id, email y rol. Header `Authorization: Bearer <token>`. Validez de 1 hora.
- **Autorización por método**: `@PreAuthorize` en cada endpoint con el rol requerido.
- **Aislamiento de datos**: el controller verifica que el `id` del path coincida con el usuario autenticado.
- **Integridad en BD**: los triggers validan asignaciones y dispositivos incluso con acceso directo a PostgreSQL.

---

## Consideraciones Técnicas

**EXCLUDE USING gist**: el constraint `EXCLUDE USING gist (id_estadio WITH =, periodo WITH &&)` impide solapamiento de eventos de forma atómica. Sin ventana de condición de carrera, a diferencia de un SELECT+INSERT en la aplicación. Requiere `btree_gist`.

**Tokens QR**: el índice `UNIQUE ... WHERE activo = TRUE` garantiza un solo token activo por entrada. El trigger desactiva el anterior al generar uno nuevo. El frontend pide renovación cada 30 segundos; el token dura 35 para tolerar latencia de red.

**Snapshots de precio y comisión**: `entrada.precio` y `venta.porcentaje_aplicado` se congelen al momento de la transacción. Cambios futuros de precio no afectan el historial.

**Distribución de lógica**: las restricciones de integridad que deben cumplirse siempre (aforo, anti-solapamiento, consumo único, token único) van en la BD. Las reglas que requieren contexto de sesión (el usuario opera sobre sus recursos) van en los services Java.

---

## Tests

```bash
cd frontend
npm test
```

22 tests con Vitest + React Testing Library que cubren los componentes de UI (`Alert`, `PageHeader`, `LoadingSpinner`, `EmptyState`), el formulario de login, la pantalla de entradas, la pantalla de compras y los reportes del administrador.

---

## Documentación

- **Informe del proyecto**: `Informe_Final_BDII_Ticketing_Mundial2026.docx` — incluye marco teórico, MER en tres versiones, modelo lógico, arquitectura, endpoints y conclusiones.
- **Scripts SQL**: carpeta `sql/` — DDL, triggers, procedures, queries de reporte y seed.
- **Diagramas de arquitectura**: embebidos en el informe.

---

## Estado del Proyecto

**Completo:**
- Registro, login y gestión de roles
- Compra con control de aforo y comisión variable
- QR dinámico con renovación cada 30 segundos
- Transferencias entre usuarios
- Validación en puerta con cámara y modo manual
- Panel de administración completo
- Reportes estadísticos
- Tests de frontend
- Despliegue con Docker (build multi-stage)

**Limitaciones conocidas:**
- El pago es simbólico — botón "Pagar" sin integración con gateway real
- No hay notificaciones por email al aceptar o rechazar transferencias
- `identidad_verificada` existe en la BD pero no hay flujo de verificación implementado (diseñado para integración KYC futura)

---

Valentín Barrios · Valentín Hernández — UCU BDII 2026
