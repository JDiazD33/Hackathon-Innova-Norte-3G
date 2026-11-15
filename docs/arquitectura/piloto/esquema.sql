-- Esquema de PostgreSQL del piloto de Prisma (diseño).
-- Detalle en docs/arquitectura/piloto/README.md; decisión en docs/adr/0009-backend-del-piloto.md.
--
-- - Requiere PostgreSQL 16 o superior. No usa extensiones: sha256() y gen_random_uuid() son nativas.
-- - Se ejecuta como superusuario, o como un rol que pueda crear roles y sea miembro de prisma_migraciones.
-- - Todavía no se ha ejecutado contra un PostgreSQL real: es la primera tarea cuando empiece el piloto.
-- - Es un diseño ejecutable, no una migración definitiva: en el piloto se divide en migraciones versionadas.
-- - Tablas y columnas en español, como los datos derivados (ADR 0006).
-- - Contexto de cada transacción: la API ejecuta
--     select set_config('prisma.cuenta_id', '<uuid de la cuenta de la sesión>', true);
--   antes de cualquier consulta. Con `true`, el valor dura solo esa transacción, así que es seguro
--   con un pool de conexiones. Las políticas de Row Level Security y las funciones leen ese valor.
-- - Lo que este esquema garantiza: nadie con los permisos de la API puede editar ni borrar revisiones o
--   filas de la bitácora, y cualquier cambio hecho por fuera, con permisos de dueño, rompe la cadena de
--   hashes. Lo que no garantiza: si alguien toma el control de la API, puede actuar con cualquier cuenta.
--   Por eso la API valida la sesión y cada acción queda atribuida en la bitácora.

begin;

-- 0. Roles de la base -------------------------------------------------------------------------------
-- Sin inicio de sesión. Las credenciales se configuran fuera del repositorio, al desplegar.
--   prisma_migraciones  dueño de todos los objetos; solo lo usan las migraciones
--   prisma_api          la API: lee y escribe solo mediante funciones
--   prisma_carga        el paso de carga del pipeline: solo el esquema datos
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'prisma_migraciones') then
    create role prisma_migraciones nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'prisma_api') then
    create role prisma_api nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'prisma_carga') then
    create role prisma_carga nologin;
  end if;
  execute format('grant create on database %I to prisma_migraciones', current_database());
end $$;

set local role prisma_migraciones;

create schema datos;      -- paquete de datos cargado cada mes (lectura)
create schema seguridad;  -- cuentas, sesiones y passkeys
create schema revision;   -- decisiones y asignaciones
create schema auditoria;  -- bitácora encadenada

-- 1. Datos del paquete (equivale a StaticDataSource) ------------------------------------------------
-- Cada carga es un paquete nuevo. Solo uno está vigente; los anteriores se conservan mientras alguna
-- revisión los cite, para saber con qué datos se tomó cada decisión.
-- `contenido` guarda el objeto tal como lo define contracts/paquete-de-datos.schema.json.

create table datos.paquetes (
  id               bigint generated always as identity primary key,
  generado         timestamptz not null,
  fecha_corte      date not null,
  version_contrato text not null,
  version_reglas   text not null,
  manifiesto       jsonb not null,
  cargado_en       timestamptz not null default now(),
  vigente          boolean not null default false
);
create unique index paquetes_un_solo_vigente on datos.paquetes (vigente) where vigente;

create table datos.entidades (
  paquete_id bigint not null references datos.paquetes on delete cascade,
  entidad_id text not null,
  contenido  jsonb not null,
  primary key (paquete_id, entidad_id)
);

create table datos.procesos (
  paquete_id bigint not null references datos.paquetes on delete cascade,
  ocid       text not null,
  entidad_id text not null,
  contenido  jsonb not null,
  primary key (paquete_id, ocid)
);
create index procesos_por_entidad on datos.procesos (paquete_id, entidad_id);

create table datos.senales (
  paquete_id bigint not null references datos.paquetes on delete cascade,
  senal_id   text not null,
  contenido  jsonb not null,
  primary key (paquete_id, senal_id)
);
create index senales_por_ocid on datos.senales using gin ((contenido -> 'ocids'));

create table datos.proveedores (
  paquete_id   bigint not null references datos.paquetes on delete cascade,
  proveedor_id text not null,
  contenido    jsonb not null,
  primary key (paquete_id, proveedor_id)
);

create table datos.expedientes (
  paquete_id bigint not null references datos.paquetes on delete cascade,
  ocid       text not null,
  contenido  jsonb not null,
  primary key (paquete_id, ocid)
);

-- Cambia el paquete vigente en una sola transacción, sin cortar el servicio.
create function datos.publicar_paquete(p_paquete_id bigint) returns void
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  if not exists (select 1 from datos.paquetes where id = p_paquete_id) then
    raise exception 'no_encontrado' using errcode = 'no_data_found';
  end if;
  update datos.paquetes set vigente = false where vigente and id <> p_paquete_id;
  update datos.paquetes set vigente = true where id = p_paquete_id;
end $$;

-- 2. Cuentas y contexto -----------------------------------------------------------------------------
-- Datos personales mínimos: nombre, correo institucional, cargo, entidad y rol.
-- Sin DNI, foto ni datos biométricos. `emisor` y `sujeto` son los claims iss y sub del proveedor OIDC.

create table seguridad.cuentas (
  id         uuid primary key default gen_random_uuid(),
  entidad_id text not null,  -- el mismo identificador que datos.entidades.entidad_id
  nombre     text not null check (length(btrim(nombre)) between 1 and 200),
  correo     text not null check (correo ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  cargo      text not null check (length(btrim(cargo)) between 1 and 200),
  rol        text not null check (rol in ('analista', 'jefatura', 'auditor', 'administrador')),
  activa     boolean not null default true,
  emisor     text,
  sujeto     text,
  creada_en  timestamptz not null default now(),
  unique (emisor, sujeto),
  check ((emisor is null) = (sujeto is null))
);
create unique index cuentas_correo_unico on seguridad.cuentas (lower(correo));

create function seguridad.cuenta_actual() returns uuid
language sql stable set search_path = pg_catalog, pg_temp as $$
  select nullif(current_setting('prisma.cuenta_id', true), '')::uuid
$$;

-- Entidad y rol de la cuenta del contexto, solo si está activa. Son SECURITY DEFINER para que las
-- políticas de Row Level Security de seguridad.cuentas no se llamen a sí mismas.
create function seguridad.entidad_actual() returns text
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select entidad_id from seguridad.cuentas where id = seguridad.cuenta_actual() and activa
$$;

create function seguridad.rol_actual() returns text
language sql stable security definer set search_path = pg_catalog, pg_temp as $$
  select rol from seguridad.cuentas where id = seguridad.cuenta_actual() and activa
$$;

-- Cuenta activa del contexto con uno de los roles indicados. La misma tabla de permisos que
-- canReview(rol, accion) en la web, aplicada en la base.
create function seguridad.exigir_cuenta(p_roles text[]) returns seguridad.cuentas
language plpgsql stable security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta seguridad.cuentas;
begin
  select * into v_cuenta from seguridad.cuentas where id = seguridad.cuenta_actual() and activa;
  if not found then
    raise exception 'sesion_requerida' using errcode = 'insufficient_privilege';
  end if;
  if not (v_cuenta.rol = any (p_roles)) then
    raise exception 'sin_permiso' using errcode = 'insufficient_privilege';
  end if;
  return v_cuenta;
end $$;

-- Sesiones del servidor. Se guarda el SHA-256 del token de la cookie, nunca el token.
-- El token CSRF no se guarda: la API lo deriva con HMAC del token de sesión y un secreto del servidor.
create table seguridad.sesiones (
  token_sha256   bytea primary key check (length(token_sha256) = 32),
  cuenta_id      uuid not null references seguridad.cuentas,
  creada_en      timestamptz not null default now(),
  expira_en      timestamptz not null,
  verificado_en  timestamptz not null,
  segundo_factor text not null check (segundo_factor in ('proveedor_de_identidad', 'passkey', 'pendiente')),
  revocada_en    timestamptz,
  check (expira_en > creada_en)
);
create index sesiones_por_cuenta on seguridad.sesiones (cuenta_id) where revocada_en is null;

-- Passkeys (WebAuthn). Solo la clave pública y su contador; ningún dato biométrico.
create table seguridad.passkeys (
  id            uuid primary key default gen_random_uuid(),
  cuenta_id     uuid not null references seguridad.cuentas,
  credencial_id bytea not null unique,
  clave_publica bytea not null,  -- clave pública COSE
  contador      bigint not null default 0 check (contador >= 0),
  transportes   text[] not null default '{}',
  nombre        text not null check (length(btrim(nombre)) between 1 and 80),
  creada_en     timestamptz not null default now(),
  usada_en      timestamptz
);

-- 3. Bitácora encadenada ----------------------------------------------------------------------------
-- Una cadena por entidad. hash = SHA-256(hash_anterior || contenido canónico de la fila).
-- La primera fila de cada cadena usa 32 bytes en cero como hash_anterior.

create table auditoria.cadenas (
  entidad_id       text primary key,
  ultima_secuencia bigint not null default 0 check (ultima_secuencia >= 0),
  ultimo_hash      bytea not null default decode(repeat('00', 32), 'hex') check (length(ultimo_hash) = 32)
);

create table auditoria.bitacora (
  entidad_id    text not null references auditoria.cadenas,
  secuencia     bigint not null check (secuencia >= 1),
  ocurrido_en   timestamptz not null,
  cuenta_id     uuid not null references seguridad.cuentas,
  rol           text not null,  -- rol de la cuenta en ese momento
  accion        text not null check (accion in (
                  'sesion_iniciada', 'sesion_rechazada', 'sesion_cerrada', 'identidad_verificada',
                  'passkey_registrada', 'decision_registrada', 'asignacion_registrada',
                  'revision_importada', 'revisiones_importadas', 'revisiones_exportadas',
                  'cuenta_registrada', 'cuenta_actualizada', 'bitacora_verificada')),
  objeto_tipo   text check (objeto_tipo in ('proceso', 'cuenta', 'archivo', 'sesion', 'bitacora')),
  objeto_id     text,
  datos         jsonb not null default '{}'::jsonb,
  hash_anterior bytea not null check (length(hash_anterior) = 32),
  hash          bytea not null check (length(hash) = 32),
  primary key (entidad_id, secuencia)
);

-- Contenido canónico: un objeto jsonb con claves fijas. La salida de jsonb::text es determinista
-- (orden de claves y espacios fijos), y la fecha se normaliza a UTC con microsegundos para que no
-- dependa del huso horario de la sesión. Cualquier PostgreSQL puede recalcularlo desde un respaldo.
create function auditoria.calcular_hash(f auditoria.bitacora) returns bytea
language sql stable set search_path = pg_catalog, pg_temp as $$
  select sha256(f.hash_anterior || convert_to(jsonb_build_object(
    'entidad_id',  f.entidad_id,
    'secuencia',   f.secuencia,
    'ocurrido_en', to_char(f.ocurrido_en at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'cuenta_id',   f.cuenta_id,
    'rol',         f.rol,
    'accion',      f.accion,
    'objeto_tipo', f.objeto_tipo,
    'objeto_id',   f.objeto_id,
    'datos',       f.datos
  )::text, 'UTF8'))
$$;

-- Única forma de escribir en la bitácora. Bloquea la cadena de la entidad para que dos
-- transacciones no tomen la misma secuencia, y atribuye la fila a la cuenta del contexto.
create function auditoria.registrar(
  p_accion      text,
  p_objeto_tipo text default null,
  p_objeto_id   text default null,
  p_datos       jsonb default '{}'::jsonb
) returns auditoria.bitacora
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta seguridad.cuentas;
  v_cadena auditoria.cadenas;
  v_fila   auditoria.bitacora;
begin
  -- No exige que la cuenta esté activa: un inicio de sesión rechazado también se registra.
  select * into v_cuenta from seguridad.cuentas where id = seguridad.cuenta_actual();
  if not found then
    raise exception 'sesion_requerida' using errcode = 'insufficient_privilege';
  end if;

  insert into auditoria.cadenas (entidad_id) values (v_cuenta.entidad_id) on conflict do nothing;
  select * into v_cadena from auditoria.cadenas where entidad_id = v_cuenta.entidad_id for update;

  v_fila.entidad_id    := v_cuenta.entidad_id;
  v_fila.secuencia     := v_cadena.ultima_secuencia + 1;
  v_fila.ocurrido_en   := clock_timestamp();
  v_fila.cuenta_id     := v_cuenta.id;
  v_fila.rol           := v_cuenta.rol;
  v_fila.accion        := p_accion;
  v_fila.objeto_tipo   := p_objeto_tipo;
  v_fila.objeto_id     := p_objeto_id;
  v_fila.datos         := coalesce(p_datos, '{}'::jsonb);
  v_fila.hash_anterior := v_cadena.ultimo_hash;
  v_fila.hash          := auditoria.calcular_hash(v_fila);

  insert into auditoria.bitacora values (v_fila.*);
  update auditoria.cadenas
     set ultima_secuencia = v_fila.secuencia, ultimo_hash = v_fila.hash
   where entidad_id = v_fila.entidad_id;
  return v_fila;
end $$;

-- Sello diario: el hash de la última fila de cada día (hora de Lima). Se imprime en el reporte de
-- trazabilidad y lo guarda el auditor fuera de la base.
create view auditoria.sellos_diarios with (security_invoker = true) as
select distinct on (entidad_id, (ocurrido_en at time zone 'America/Lima')::date)
       entidad_id,
       (ocurrido_en at time zone 'America/Lima')::date as fecha,
       secuencia,
       encode(hash, 'hex') as hash
  from auditoria.bitacora
 order by entidad_id, (ocurrido_en at time zone 'America/Lima')::date, secuencia desc;

-- 4. Revisiones (equivale a ReviewStore) ------------------------------------------------------------
-- Registro de eventos de solo inserción, como LocalReviewStore. El estado vigente de un proceso se
-- deriva de su última decisión. Cada evento tiene su propia fila en la bitácora, que guarda la huella
-- del evento: así la cadena también protege los comentarios y las notas.

create table revision.eventos (
  entidad_id         text not null,
  id                 text not null,  -- uuid de la API o id del archivo importado
  ocid               text not null,
  tipo               text not null check (tipo in ('decision', 'asignacion')),
  rol                text not null check (rol in ('analista', 'jefatura', 'auditor')),
  fecha              timestamptz not null,
  autor_id           uuid references seguridad.cuentas,
  origen             text not null check (origen in ('prisma', 'importado')),
  importado_por      uuid references seguridad.cuentas,
  estado             text check (estado in ('en_revision', 'justificada', 'requiere_atencion')),
  comentario         text check (length(comentario) <= 2000),
  asignado_a         text check (asignado_a in ('analista', 'jefatura', 'auditor')),
  asignado_a_cuenta  uuid references seguridad.cuentas,
  nota               text check (length(nota) <= 2000),
  paquete_id         bigint references datos.paquetes,  -- datos vigentes al decidir; null si se importó
  bitacora_secuencia bigint not null,
  primary key (entidad_id, id),
  unique (entidad_id, bitacora_secuencia),
  foreign key (entidad_id, bitacora_secuencia) references auditoria.bitacora (entidad_id, secuencia),
  check (case tipo
           when 'decision' then estado is not null and comentario is not null
                and asignado_a is null and asignado_a_cuenta is null and nota is null
           when 'asignacion' then asignado_a is not null and nota is not null and length(btrim(nota)) > 0
                and estado is null and comentario is null
         end),
  check (estado is null or estado = 'en_revision' or length(btrim(comentario)) > 0),
  check ((origen = 'prisma') = (autor_id is not null and importado_por is null)),
  check ((origen = 'importado') = (autor_id is null and importado_por is not null))
);
create index eventos_por_proceso on revision.eventos (entidad_id, ocid, fecha);

create function revision.huella_evento(e revision.eventos) returns text
language sql stable set search_path = pg_catalog, pg_temp as $$
  select encode(sha256(convert_to(jsonb_build_object(
    'entidad_id',        e.entidad_id,
    'id',                e.id,
    'ocid',              e.ocid,
    'tipo',              e.tipo,
    'rol',               e.rol,
    'fecha',             to_char(e.fecha at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'autor_id',          e.autor_id,
    'origen',            e.origen,
    'importado_por',     e.importado_por,
    'estado',            e.estado,
    'comentario',        e.comentario,
    'asignado_a',        e.asignado_a,
    'asignado_a_cuenta', e.asignado_a_cuenta,
    'nota',              e.nota,
    'paquete_id',        e.paquete_id
  )::text, 'UTF8')), 'hex')
$$;

-- Estado vigente de cada proceso revisado, como getState(ocid).
create view revision.estado_vigente with (security_invoker = true) as
select distinct on (entidad_id, ocid) entidad_id, ocid, estado, fecha
  from revision.eventos
 where tipo = 'decision'
 order by entidad_id, ocid, fecha desc, bitacora_secuencia desc;

-- Inserta un evento y su fila de bitácora en la misma transacción.
create function revision.insertar_evento(p_evento revision.eventos, p_accion text, p_datos jsonb)
returns revision.eventos
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_evento revision.eventos := p_evento;
  v_fila   auditoria.bitacora;
begin
  v_fila := auditoria.registrar(p_accion, 'proceso', v_evento.ocid,
              coalesce(p_datos, '{}'::jsonb)
              || jsonb_build_object('evento_id', v_evento.id, 'huella_evento', revision.huella_evento(v_evento)));
  v_evento.bitacora_secuencia := v_fila.secuencia;
  insert into revision.eventos values (v_evento.*);
  return v_evento;
end $$;

create function revision.registrar_decision(p_ocid text, p_estado text, p_comentario text default '')
returns revision.eventos
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta   seguridad.cuentas := seguridad.exigir_cuenta(array['analista', 'jefatura']);
  v_paquete  bigint;
  v_anterior text;
  v_evento   revision.eventos;
begin
  if p_estado is null or p_estado not in ('en_revision', 'justificada', 'requiere_atencion') then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'estado';
  end if;
  if p_estado <> 'en_revision' and btrim(coalesce(p_comentario, '')) = '' then
    raise exception 'comentario_requerido' using errcode = 'check_violation';
  end if;

  select k.id into v_paquete
    from datos.paquetes k
    join datos.procesos p on p.paquete_id = k.id
   where k.vigente and p.ocid = p_ocid and p.entidad_id = v_cuenta.entidad_id;
  if not found then
    raise exception 'no_encontrado' using errcode = 'no_data_found';
  end if;

  select estado into v_anterior
    from revision.estado_vigente
   where entidad_id = v_cuenta.entidad_id and ocid = p_ocid;

  v_evento.entidad_id := v_cuenta.entidad_id;
  v_evento.id         := gen_random_uuid()::text;
  v_evento.ocid       := p_ocid;
  v_evento.tipo       := 'decision';
  v_evento.rol        := v_cuenta.rol;
  v_evento.fecha      := clock_timestamp();
  v_evento.autor_id   := v_cuenta.id;
  v_evento.origen     := 'prisma';
  v_evento.estado     := p_estado;
  v_evento.comentario := btrim(coalesce(p_comentario, ''));
  v_evento.paquete_id := v_paquete;

  return revision.insertar_evento(v_evento, 'decision_registrada',
           jsonb_build_object('estado_anterior', coalesce(v_anterior, 'sin_revisar'), 'estado', p_estado));
end $$;

-- Igual que en el MVP: se asigna a otro rol y la nota es obligatoria. Opcionalmente, a una persona.
create function revision.registrar_asignacion(
  p_ocid text, p_asignado_a text, p_nota text, p_asignado_a_cuenta uuid default null
) returns revision.eventos
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta  seguridad.cuentas := seguridad.exigir_cuenta(array['analista', 'jefatura']);
  v_paquete bigint;
  v_evento  revision.eventos;
begin
  if p_asignado_a is null or p_asignado_a not in ('analista', 'jefatura', 'auditor')
     or p_asignado_a = v_cuenta.rol then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'asignado_a';
  end if;
  if btrim(coalesce(p_nota, '')) = '' then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'nota';
  end if;
  if p_asignado_a_cuenta is not null and not exists (
       select 1 from seguridad.cuentas
        where id = p_asignado_a_cuenta and activa
          and entidad_id = v_cuenta.entidad_id and rol = p_asignado_a) then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'asignado_a_cuenta';
  end if;

  select k.id into v_paquete
    from datos.paquetes k
    join datos.procesos p on p.paquete_id = k.id
   where k.vigente and p.ocid = p_ocid and p.entidad_id = v_cuenta.entidad_id;
  if not found then
    raise exception 'no_encontrado' using errcode = 'no_data_found';
  end if;

  v_evento.entidad_id        := v_cuenta.entidad_id;
  v_evento.id                := gen_random_uuid()::text;
  v_evento.ocid              := p_ocid;
  v_evento.tipo              := 'asignacion';
  v_evento.rol               := v_cuenta.rol;
  v_evento.fecha             := clock_timestamp();
  v_evento.autor_id          := v_cuenta.id;
  v_evento.origen            := 'prisma';
  v_evento.asignado_a        := p_asignado_a;
  v_evento.asignado_a_cuenta := p_asignado_a_cuenta;
  v_evento.nota              := btrim(p_nota);
  v_evento.paquete_id        := v_paquete;

  return revision.insertar_evento(v_evento, 'asignacion_registrada',
           jsonb_build_object('asignado_a', p_asignado_a, 'asignado_a_cuenta', p_asignado_a_cuenta));
end $$;

-- Importa el archivo versión 1 que exporta LocalReviewStore. Todo o nada: valida cada entrada, fusiona
-- por id, cuenta los duplicados exactos y rechaza los conflictos sin guardar nada.
create function revision.importar(p_archivo jsonb, out agregadas integer, out duplicadas integer)
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta    seguridad.cuentas := seguridad.exigir_cuenta(array['analista', 'jefatura']);
  v_entrada   jsonb;
  v_evento    revision.eventos;
  v_existente revision.eventos;
begin
  agregadas := 0;
  duplicadas := 0;
  if jsonb_typeof(p_archivo) is distinct from 'object'
     or (p_archivo -> 'version') is distinct from '1'::jsonb
     or jsonb_typeof(p_archivo -> 'entradas') is distinct from 'array' then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'archivo';
  end if;
  if jsonb_array_length(p_archivo -> 'entradas') > 5000 then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'demasiadas entradas';
  end if;

  for v_entrada in select value from jsonb_array_elements(p_archivo -> 'entradas') loop
    v_evento := null;
    v_evento.entidad_id    := v_cuenta.entidad_id;
    v_evento.id            := v_entrada ->> 'id';
    v_evento.ocid          := v_entrada ->> 'ocid';
    v_evento.tipo          := v_entrada ->> 'tipo';
    v_evento.rol           := v_entrada ->> 'rol';
    v_evento.fecha         := (v_entrada ->> 'fecha')::timestamptz;
    v_evento.origen        := 'importado';
    v_evento.importado_por := v_cuenta.id;
    v_evento.estado        := v_entrada ->> 'estado';
    v_evento.comentario    := btrim(v_entrada ->> 'comentario');
    v_evento.asignado_a    := v_entrada ->> 'asignado_a';
    v_evento.nota          := btrim(v_entrada ->> 'nota');
    if v_evento.id is null or v_evento.ocid is null or v_evento.tipo is null
       or v_evento.rol is null or v_evento.fecha is null then
      raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'entrada incompleta';
    end if;
    if v_evento.tipo = 'decision' then
      v_evento.comentario := coalesce(v_evento.comentario, '');
    end if;

    select * into v_existente from revision.eventos
     where entidad_id = v_evento.entidad_id and id = v_evento.id;
    if found then
      if (v_existente.ocid, v_existente.tipo, v_existente.rol, v_existente.fecha,
          v_existente.estado, v_existente.comentario, v_existente.asignado_a, v_existente.nota)
         is not distinct from
         (v_evento.ocid, v_evento.tipo, v_evento.rol, v_evento.fecha,
          v_evento.estado, v_evento.comentario, v_evento.asignado_a, v_evento.nota) then
        duplicadas := duplicadas + 1;
        continue;
      end if;
      raise exception 'conflicto_de_importacion' using errcode = 'unique_violation', detail = v_evento.id;
    end if;

    -- Las restricciones de la tabla validan tipo, rol, estado, comentario y nota.
    perform revision.insertar_evento(v_evento, 'revision_importada', '{}'::jsonb);
    agregadas := agregadas + 1;
  end loop;

  perform auditoria.registrar('revisiones_importadas', 'archivo', null,
            jsonb_build_object('agregadas', agregadas, 'duplicadas', duplicadas));
end $$;

-- 5. Cuentas: registro, cambios e inicio de sesión ---------------------------------------------------

-- Solo para quien opera la base, una vez por entidad: crea la primera cuenta de administración y
-- deja ese alta en la bitácora. La API no puede ejecutarla.
create function seguridad.registrar_primera_cuenta(
  p_entidad_id text, p_nombre text, p_correo text, p_cargo text
) returns seguridad.cuentas
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta seguridad.cuentas;
begin
  if exists (select 1 from seguridad.cuentas where entidad_id = p_entidad_id) then
    raise exception 'La entidad % ya tiene cuentas', p_entidad_id using errcode = 'unique_violation';
  end if;
  insert into seguridad.cuentas (entidad_id, nombre, correo, cargo, rol)
  values (p_entidad_id, btrim(p_nombre), btrim(p_correo), btrim(p_cargo), 'administrador')
  returning * into v_cuenta;
  perform set_config('prisma.cuenta_id', v_cuenta.id::text, true);
  perform auditoria.registrar('cuenta_registrada', 'cuenta', v_cuenta.id::text,
            jsonb_build_object('rol', v_cuenta.rol, 'cargo', v_cuenta.cargo, 'primera_cuenta', true));
  return v_cuenta;
end $$;

create function seguridad.registrar_cuenta(p_nombre text, p_correo text, p_cargo text, p_rol text)
returns seguridad.cuentas
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_admin  seguridad.cuentas := seguridad.exigir_cuenta(array['administrador']);
  v_cuenta seguridad.cuentas;
begin
  if exists (select 1 from seguridad.cuentas where lower(correo) = lower(btrim(p_correo))) then
    raise exception 'cuenta_duplicada' using errcode = 'unique_violation';
  end if;
  insert into seguridad.cuentas (entidad_id, nombre, correo, cargo, rol)
  values (v_admin.entidad_id, btrim(p_nombre), btrim(p_correo), btrim(p_cargo), p_rol)
  returning * into v_cuenta;
  perform auditoria.registrar('cuenta_registrada', 'cuenta', v_cuenta.id::text,
            jsonb_build_object('rol', v_cuenta.rol, 'cargo', v_cuenta.cargo));
  return v_cuenta;
end $$;

-- Nadie cambia su propia cuenta. Desactivar una cuenta revoca sus sesiones al instante.
create function seguridad.actualizar_cuenta(
  p_cuenta_id uuid, p_rol text default null, p_cargo text default null, p_activa boolean default null
) returns seguridad.cuentas
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_admin   seguridad.cuentas := seguridad.exigir_cuenta(array['administrador']);
  v_antes   seguridad.cuentas;
  v_despues seguridad.cuentas;
begin
  if p_cuenta_id = v_admin.id then
    raise exception 'cuenta_propia' using errcode = 'insufficient_privilege';
  end if;
  select * into v_antes from seguridad.cuentas
   where id = p_cuenta_id and entidad_id = v_admin.entidad_id
   for update;
  if not found then
    raise exception 'no_encontrado' using errcode = 'no_data_found';
  end if;
  if p_rol is null and p_cargo is null and p_activa is null then
    raise exception 'datos_invalidos' using errcode = 'check_violation', detail = 'sin cambios';
  end if;

  update seguridad.cuentas
     set rol    = coalesce(p_rol, rol),
         cargo  = coalesce(btrim(p_cargo), cargo),
         activa = coalesce(p_activa, activa)
   where id = p_cuenta_id
  returning * into v_despues;

  if v_antes.activa and not v_despues.activa then
    update seguridad.sesiones set revocada_en = now()
     where cuenta_id = p_cuenta_id and revocada_en is null;
  end if;

  perform auditoria.registrar('cuenta_actualizada', 'cuenta', p_cuenta_id::text, jsonb_build_object(
    'antes',   jsonb_build_object('rol', v_antes.rol, 'cargo', v_antes.cargo, 'activa', v_antes.activa),
    'despues', jsonb_build_object('rol', v_despues.rol, 'cargo', v_despues.cargo, 'activa', v_despues.activa)));
  return v_despues;
end $$;

-- Busca la cuenta de quien vuelve del proveedor de identidad. La primera vez la enlaza por correo
-- verificado; después, solo por emisor y sujeto. Devuelve null si no hay cuenta.
create function seguridad.cuenta_para_inicio(
  p_emisor text, p_sujeto text, p_correo text, p_correo_verificado boolean
) returns seguridad.cuentas
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta seguridad.cuentas;
begin
  select * into v_cuenta from seguridad.cuentas where emisor = p_emisor and sujeto = p_sujeto;
  if found then
    return v_cuenta;
  end if;
  if not coalesce(p_correo_verificado, false) then
    return null;
  end if;
  update seguridad.cuentas
     set emisor = p_emisor, sujeto = p_sujeto
   where lower(correo) = lower(btrim(p_correo)) and emisor is null
  returning * into v_cuenta;
  if not found then
    return null;
  end if;
  return v_cuenta;
end $$;

-- Abre la sesión de la cuenta del contexto, o registra el rechazo si la cuenta está desactivada.
create function seguridad.abrir_sesion(
  p_token_sha256 bytea, p_segundo_factor text, p_primer_inicio boolean default false
) returns boolean
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_cuenta seguridad.cuentas;
begin
  select * into v_cuenta from seguridad.cuentas where id = seguridad.cuenta_actual();
  if not found then
    raise exception 'sesion_requerida' using errcode = 'insufficient_privilege';
  end if;
  if not v_cuenta.activa then
    perform auditoria.registrar('sesion_rechazada', 'sesion', null,
              jsonb_build_object('motivo', 'cuenta_desactivada'));
    return false;
  end if;
  insert into seguridad.sesiones (token_sha256, cuenta_id, expira_en, verificado_en, segundo_factor)
  values (p_token_sha256, v_cuenta.id, now() + interval '8 hours', now(), p_segundo_factor);
  perform auditoria.registrar('sesion_iniciada', 'sesion', null,
            jsonb_build_object('segundo_factor', p_segundo_factor, 'primer_inicio', p_primer_inicio));
  return true;
end $$;

create function seguridad.cerrar_sesion(p_token_sha256 bytea) returns void
language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
begin
  update seguridad.sesiones set revocada_en = now()
   where token_sha256 = p_token_sha256 and cuenta_id = seguridad.cuenta_actual() and revocada_en is null;
  if found then
    perform auditoria.registrar('sesion_cerrada', 'sesion', null, '{}'::jsonb);
  end if;
end $$;

-- 6. Verificación de la cadena ----------------------------------------------------------------------
-- Recalcula cada hash en orden, comprueba que la secuencia no salte, que la cabeza de la cadena
-- coincida con la última fila (detecta filas borradas al final) y que cada evento de revisión tenga
-- la huella guardada en su fila. Devuelve la primera secuencia que falla, o null.
create function auditoria.verificar(
  p_entidad_id text default seguridad.entidad_actual(),
  out valida boolean, out filas_verificadas bigint, out primera_falla bigint
)
language plpgsql stable security definer set search_path = pg_catalog, pg_temp as $$
declare
  v_fila     auditoria.bitacora;
  v_anterior bytea := decode(repeat('00', 32), 'hex');
  v_esperada bigint := 1;
  v_evento   revision.eventos;
begin
  valida := false;
  filas_verificadas := 0;
  primera_falla := null;

  for v_fila in select * from auditoria.bitacora where entidad_id = p_entidad_id order by secuencia loop
    if v_fila.secuencia <> v_esperada
       or v_fila.hash_anterior <> v_anterior
       or v_fila.hash <> auditoria.calcular_hash(v_fila) then
      primera_falla := v_esperada;
      return;
    end if;
    v_anterior := v_fila.hash;
    v_esperada := v_esperada + 1;
    filas_verificadas := filas_verificadas + 1;
  end loop;

  if exists (select 1 from auditoria.cadenas c
              where c.entidad_id = p_entidad_id
                and (c.ultima_secuencia <> v_esperada - 1 or c.ultimo_hash <> v_anterior)) then
    primera_falla := v_esperada;
    return;
  end if;

  for v_evento in select * from revision.eventos where entidad_id = p_entidad_id order by bitacora_secuencia loop
    if not exists (select 1 from auditoria.bitacora b
                    where b.entidad_id = v_evento.entidad_id
                      and b.secuencia = v_evento.bitacora_secuencia
                      and b.datos ->> 'evento_id' = v_evento.id
                      and b.datos ->> 'huella_evento' = revision.huella_evento(v_evento)) then
      primera_falla := v_evento.bitacora_secuencia;
      return;
    end if;
  end loop;

  valida := true;
end $$;

-- 7. Solo inserción ---------------------------------------------------------------------------------
-- Además de no dar permisos de UPDATE ni DELETE a la API, un trigger rechaza esos cambios para
-- cualquier rol. Quien desactive el trigger con permisos de dueño rompe la cadena o la huella, y
-- auditoria.verificar lo detecta.
create function auditoria.impedir_cambios() returns trigger
language plpgsql set search_path = pg_catalog, pg_temp as $$
begin
  raise exception 'La tabla %.% es de solo inserción', tg_table_schema, tg_table_name
    using errcode = 'insufficient_privilege';
end $$;

create trigger solo_insercion before update or delete on auditoria.bitacora
  for each row execute function auditoria.impedir_cambios();
create trigger solo_insercion_truncate before truncate on auditoria.bitacora
  for each statement execute function auditoria.impedir_cambios();
create trigger solo_insercion before update or delete on revision.eventos
  for each row execute function auditoria.impedir_cambios();
create trigger solo_insercion_truncate before truncate on revision.eventos
  for each statement execute function auditoria.impedir_cambios();

-- 8. Row Level Security -----------------------------------------------------------------------------
-- Cada entidad ve solo lo suyo. La bitácora completa, solo el auditor y el administrador.
-- Las funciones SECURITY DEFINER las ejecuta el dueño, que no está sujeto a estas políticas.
alter table seguridad.cuentas enable row level security;
alter table revision.eventos enable row level security;
alter table auditoria.bitacora enable row level security;

create policy misma_entidad on seguridad.cuentas for select to prisma_api
  using (entidad_id = seguridad.entidad_actual());
create policy misma_entidad on revision.eventos for select to prisma_api
  using (entidad_id = seguridad.entidad_actual());
create policy auditoria_de_la_entidad on auditoria.bitacora for select to prisma_api
  using (entidad_id = seguridad.entidad_actual() and seguridad.rol_actual() in ('auditor', 'administrador'));

-- 9. Permisos ---------------------------------------------------------------------------------------
revoke all on schema datos, seguridad, revision, auditoria from public;
revoke execute on all functions in schema datos, seguridad, revision, auditoria from public;

grant usage on schema datos, seguridad, revision, auditoria to prisma_api;
grant select on all tables in schema datos to prisma_api;
grant select on seguridad.cuentas, revision.eventos, revision.estado_vigente,
                auditoria.bitacora, auditoria.sellos_diarios to prisma_api;
grant select on seguridad.sesiones to prisma_api;
grant update (verificado_en, segundo_factor) on seguridad.sesiones to prisma_api;
grant select, insert on seguridad.passkeys to prisma_api;
grant update (contador, usada_en) on seguridad.passkeys to prisma_api;
-- Las políticas de Row Level Security llaman estas funciones con los permisos de quien consulta.
grant execute on function
  seguridad.cuenta_actual(),
  seguridad.entidad_actual(),
  seguridad.rol_actual(),
  seguridad.cuenta_para_inicio(text, text, text, boolean),
  seguridad.abrir_sesion(bytea, text, boolean),
  seguridad.cerrar_sesion(bytea),
  seguridad.registrar_cuenta(text, text, text, text),
  seguridad.actualizar_cuenta(uuid, text, text, boolean),
  revision.registrar_decision(text, text, text),
  revision.registrar_asignacion(text, text, text, uuid),
  revision.importar(jsonb),
  auditoria.registrar(text, text, text, jsonb),
  auditoria.verificar(text)
to prisma_api;

grant usage on schema datos to prisma_carga;
grant select, insert, update, delete on all tables in schema datos to prisma_carga;
grant execute on function datos.publicar_paquete(bigint) to prisma_carga;

commit;
