-- datos de prueba para poder probar el sistema
-- ejecutar despues de los scripts 01, 02 y 03
INSERT INTO pais(codigo_iso,nombre) VALUES
 ('USA','Estados Unidos'),('CAN','Canada'),('MEX','Mexico'),('URY','Uruguay'),
 ('ARG','Argentina'),('BRA','Brasil'),('ESP','España'),('FRA','Francia'),
 ('DEU','Alemania'),('ITA','Italia'),('PRT','Portugal'),('GBR','Reino Unido'),
 ('COL','Colombia'),('CHL','Chile'),('PER','Peru'),('VEN','Venezuela'),
 ('PRY','Paraguay'),('BOL','Bolivia'),('ECU','Ecuador');
INSERT INTO pais_sede(id_pais) SELECT id_pais FROM pais WHERE codigo_iso IN ('USA','CAN','MEX');

INSERT INTO seleccion(nombre,codigo_fifa) VALUES
 ('Uruguay','URU'),('Argentina','ARG'),('Brasil','BRA'),('Mexico','MEX'),('Estados Unidos','USA');

-- Comision vigente (5%)
INSERT INTO comision(porcentaje,fecha_inicio,fecha_fin) VALUES (5.00,'2026-01-01',NULL);

-- Direcciones + usuarios
INSERT INTO direccion(id_pais,localidad,calle,numero,codigo_postal)
 SELECT id_pais,'Montevideo','18 de Julio','1234','11200' FROM pais WHERE codigo_iso='URY';
INSERT INTO direccion(id_pais,localidad,calle,numero,codigo_postal)
 SELECT id_pais,'Montevideo','Rivera','5678','11300' FROM pais WHERE codigo_iso='URY';
INSERT INTO direccion(id_pais,localidad,calle,numero,codigo_postal)
 SELECT id_pais,'Ciudad de Mexico','Reforma','100','06000' FROM pais WHERE codigo_iso='MEX';

-- Contrasena de todos los usuarios de demo: "test1234" (bcrypt via pgcrypto)
INSERT INTO usuario(email,nombre,apellido,id_direccion,password_hash) VALUES
 ('valentin@ucu.edu.uy','Valentin','Perez',1, crypt('test1234', gen_salt('bf'))),
 ('ana@ucu.edu.uy','Ana','Gomez',2,            crypt('test1234', gen_salt('bf'))),
 ('admin.mex@fifa.org','Carlos','Ruiz',3,       crypt('test1234', gen_salt('bf')));

INSERT INTO documento(id_usuario,id_pais,tipo_documento,numero)
 SELECT 1,id_pais,'CI','55512345' FROM pais WHERE codigo_iso='URY';
INSERT INTO documento(id_usuario,id_pais,tipo_documento,numero)
 SELECT 2,id_pais,'CI','44498765' FROM pais WHERE codigo_iso='URY';

INSERT INTO usuario_general(id_usuario,identidad_verificada) VALUES (1,TRUE),(2,TRUE);
INSERT INTO administrador_pais(id_usuario,id_pais)
 SELECT 3,id_pais FROM pais WHERE codigo_iso='MEX';

-- Funcionario de validacion (direccion propia para evitar conflicto de UNIQUE)
INSERT INTO direccion(id_pais,localidad,calle,numero,codigo_postal)
 SELECT id_pais,'Ciudad de Mexico','Insurgentes','200','06010' FROM pais WHERE codigo_iso='MEX';
INSERT INTO usuario(email,nombre,apellido,id_direccion,password_hash) VALUES ('func@fifa.org','Luis','Diaz',4, crypt('test1234', gen_salt('bf')));
INSERT INTO funcionario_validacion(id_usuario,numero_legajo) VALUES (4,'LEG-001');
INSERT INTO dispositivo(identificador_fisico,id_funcionario) VALUES ('SCAN-AZTECA-01',4);

-- Estadio + sectores (en Mexico)
INSERT INTO estadio(nombre,id_pais,ciudad,direccion)
 SELECT 'Estadio Azteca',id_pais,'Ciudad de Mexico','Calz. de Tlalpan 3465' FROM pais WHERE codigo_iso='MEX';
INSERT INTO sector(id_estadio,nombre_sector,capacidad_maxima,precio_base) VALUES
 (1,'A',100,300.00),(1,'B',100,200.00),(1,'C',150,120.00),(1,'D',200,80.00);

-- Evento (alta por el administrador id_usuario=3)
INSERT INTO evento(id_estadio,id_seleccion_local,id_seleccion_visitante,fecha_hora_inicio,id_administrador)
 VALUES (1,1,2,'2026-06-20 18:00-03',3);
INSERT INTO evento_sector(id_evento,id_sector,cupo_habilitado,precio) VALUES
 (1,1,100,300.00),(1,2,100,200.00),(1,3,150,120.00),(1,4,200,80.00);

-- Asignacion del funcionario a los sectores A y B del evento 1
-- (necesario para que el trigger de validacion permita el ingreso)
INSERT INTO asignacion_funcionario_sector(id_funcionario,id_evento,id_sector) VALUES
 (4,1,1),(4,1,2),(4,1,3),(4,1,4);

-- Compra de 3 entradas por el usuario 1
DO $$
DECLARE v BIGINT;
BEGIN
    CALL sp_registrar_compra(1, ARRAY[1,1,2]::bigint[], v);
    RAISE NOTICE 'Venta creada: %', v;
END $$;

-- Token QR de prueba para la entrada 1 (valido hasta 2026-12-31)
INSERT INTO token_qr(id_entrada,codigo_token,fecha_expiracion,activo)
 VALUES (1,'TOKEN-DEMO-ENTRADA-1','2026-12-31 23:59:59+00',TRUE);
