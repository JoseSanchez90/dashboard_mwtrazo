# Seguridad de MWTRAZO

Este documento describe el modelo de seguridad vigente después de la auditoría de la fase 13. La autorización se aplica en capas: interfaz, servidor y base de datos. Ocultar controles visuales nunca se considera una medida de seguridad.

## Identidad y roles

Supabase Auth es la fuente de identidad. El servidor obtiene la sesión con `auth.getUser()` y relaciona `auth.users.id` uno a uno con `public.profiles.id`. Los únicos roles son `admin` y `assistant`, representados por el enum PostgreSQL `user_role` y por el tipo TypeScript centralizado `UserRole`.

El rol, el estado activo y el identificador nunca se aceptan como autoridad desde formularios, metadatos del navegador, parámetros de URL ni cuerpos HTTP. Un usuario sin perfil válido o con `is_active = false` no puede operar: el acceso de aplicación se bloquea y las políticas de datos exigen `current_user_is_active()`.

| Capacidad | admin | assistant |
| --- | --- | --- |
| Perfiles y roles | Administrar | Sin acceso administrativo |
| Clientes | Ver, crear, editar y eliminar | Ver, crear y editar |
| Proyectos | Gestión completa y miembros | Ver y editar datos operativos |
| Fases y tareas | Gestión completa | Gestión operativa, sin asignar responsables ni eliminar tareas |
| Eventos | Gestión completa | Ver, crear y editar |
| Archivos | Ver, subir, descargar y eliminar | Ver, subir y descargar |
| Finanzas y honorarios | Gestión completa | Sin acceso |
| Actividad | Ver, incluida actividad financiera | Ver actividad no financiera |
| Notificaciones | Ver y marcar las propias, incluidas financieras | Ver y marcar las propias, sin información financiera |
| Preferencias personales y de notificación | Leer y modificar únicamente las propias, incluidas opciones financieras | Leer y modificar únicamente las propias, sin opciones financieras |
| Configuración del estudio | Ver y administrar | Ver datos necesarios para la interfaz, sin modificar |

## Autorización en servidor

Las páginas y Server Actions sensibles llaman a `requireAuthenticatedUser()` o `requirePermission()`. Estas funciones recuperan al usuario autenticado y su perfil desde Supabase; no leen un rol suministrado por el cliente. Cada mutación vuelve a validar su entrada con Zod antes de consultar la base de datos.

Los Route Handlers de búsqueda y archivos repiten la comprobación de usuario activo y permiso correspondiente. El handler de archivos limita el tamaño antes de procesar el formulario, valida extensión, MIME, nombre y proyecto, y usa una ruta aleatoria no elegida por el navegador. Las respuestas `/api/*` se marcan `private, no-store`.

`SUPABASE_SECRET_KEY` solo se lee desde módulos con `server-only` y se utiliza para administración de Auth, consultas financieras que requieren la columna restringida `fee` y compensaciones de Storage. Nunca lleva el prefijo `NEXT_PUBLIC_`, nunca se entrega al navegador y no debe registrarse en logs. Las operaciones normales usan la clave publicable y quedan sujetas a RLS.

## Row Level Security

RLS está habilitado en todas las tablas empresariales. `anon` no recibe privilegios sobre ellas. El rol `authenticated` recibe únicamente los privilegios SQL necesarios y cada operación se filtra mediante políticas.

- `profiles`: cada usuario puede leer su perfil; los usuarios activos pueden leer perfiles activos para asignaciones. La administración de roles y estados utiliza exclusivamente el servidor. Un trigger impide eliminar, desactivar o degradar el último admin activo y serializa operaciones concurrentes.
- `profiles` permite además autoedición limitada a `full_name` y `avatar_url`. La política exige que `auth.uid()` coincida con la fila y un trigger impide modificar `id`, `role`, `is_active` o `created_at`; los cambios administrativos continúan siendo exclusivamente de servidor.
- `clients`: usuarios activos pueden leer, crear y editar; `created_by` debe ser `auth.uid()` y no tiene grant de actualización. Solo admin puede eliminar.
- `projects`: usuarios activos leen y editan. Solo admin crea o elimina y administra `project_members`. Un trigger impide que assistant cambie cliente, código, honorarios o creador; además `fee` no tiene grant de lectura para el cliente autenticado.
- `project_phase_templates`: usuarios activos pueden leer las plantillas y solo admin puede crearlas, renombrarlas, ordenarlas o activarlas/desactivarlas. No existe borrado mediante la API. `project_phases` conserva una copia con nombre y orden por proyecto; se instancia mediante un trigger protegido y los usuarios autenticados solo reciben privilegios de columna para actualizar progreso, fase actual y fecha de finalización. Los cambios de plantilla nunca reescriben proyectos históricos.
- `tasks`: usuarios activos leen, crean y editan; el creador se fija con `auth.uid()`. Solo admin asigna responsables o elimina. El trigger calcula autor y fecha de finalización.
- `events`: usuarios activos leen, crean y editan; el creador es inmutable. Solo admin elimina.
- `project_files`: usuarios activos leen y registran sus propias subidas; solo admin elimina. La ruta debe seguir el formato canónico de proyecto y UUID de objeto.
- `project_payments` y `project_expenses`: todas las operaciones requieren admin. Los triggers vuelven a comprobar el rol y protegen el creador.
- `activity_logs`: los clientes solo pueden leer. Se generan mediante triggers; no hay grants de inserción, edición ni borrado. La actividad de pagos solo es visible para admin y `metadata` contiene únicamente contexto mínimo no secreto.
- `notifications`: cada usuario activo solo puede leer y marcar como leídas las filas cuyo `user_id` coincide con `auth.uid()`. El cliente no tiene permisos de inserción ni borrado y solo recibe grant de actualización sobre `read_at`. Los tipos financieros requieren además rol admin en las políticas de lectura y actualización.
- `notification_preferences`: existe una sola fila por perfil. Cada usuario activo puede leer, crear y actualizar exclusivamente sus propios indicadores booleanos; no hay permiso de borrado ni acceso a filas ajenas. Las opciones financieras no se presentan a assistant y la función de generación descarta siempre destinatarios sin permiso financiero.
- `user_preferences`: cada usuario activo puede leer, crear y actualizar exclusivamente la fila cuyo `user_id` coincide con `auth.uid()`. No existe permiso de borrado ni acceso horizontal a preferencias ajenas; los valores están limitados por constraints y se validan nuevamente con Zod en la Server Action.
- `workspace_settings`: existe una sola fila global (`id = 1`). Los usuarios activos pueden leerla para presentar la identidad del estudio; únicamente admin puede actualizar sus columnas editables. Un trigger fija `updated_by` desde `auth.uid()` y evita depender de identidad proporcionada por el navegador. No se conceden permisos de inserción ni eliminación a roles API.

Las funciones `SECURITY DEFINER` tienen `search_path = ''`, referencias de esquema explícitas y permisos de ejecución revocados para `public`, `anon` y `authenticated` cuando son funciones internas de trigger. Las RPC expuestas usan `SECURITY INVOKER` y verifican el rol o estado activo dentro de la función.

Las notificaciones inmediatas se generan dentro de PostgreSQL después de la mutación empresarial confirmada. `enqueue_notification()` no es ejecutable por roles API, consulta la preferencia del destinatario antes de insertar, descarta destinatarios inactivos, impide notificaciones financieras a no administradores y utiliza una clave única de deduplicación. La ausencia excepcional de una fila de preferencias conserva los valores predeterminados activos. Los tipos de vencimiento quedan disponibles para un futuro proceso programado, pero no existe un scheduler público ni una ruta que permita al navegador producir avisos arbitrarios.

## Operaciones sensibles

La creación y edición de usuarios se ejecuta en Server Actions protegidas por `users:manage` y mediante la API administrativa de Supabase. Un assistant no puede cambiar su rol, desactivar cuentas ni reproducir estas operaciones con una petición manual: falla la guarda de servidor y tampoco posee grants RLS de mutación sobre `profiles`.

La gestión de miembros, eliminación de entidades y finanzas se comprueba en Server Actions y nuevamente mediante RLS o triggers. Los IDs del cliente solo sirven para seleccionar la fila; no conceden acceso. Los errores enviados a la interfaz son genéricos y no revelan secretos ni detalles internos.

## Storage privado

`project-files` es un bucket privado con límite de 25 MB y lista permitida de MIME. La política de subida exige usuario activo, proyecto existente y ruta canónica `<project_uuid>/<object_uuid>.<extensión permitida>`. No existe política de actualización de objetos. Solo admin puede borrar.

`avatars` es un bucket privado con límite de 2 MB y admite únicamente JPG, PNG y WebP. Cada usuario activo solo puede leer, subir y eliminar objetos dentro de su propia carpeta `<user_uuid>/`; la aplicación valida además extensión, MIME y firma binaria básica. El perfil conserva únicamente la ruta privada y presenta la imagen mediante una signed URL breve.

`studio-assets` es un bucket privado con límite de 2 MB para la identidad visual global. Los usuarios activos pueden leer el logo mediante URL firmada; solo admin puede subir o eliminar objetos bajo la ruta canónica `branding/<uuid>.<extensión>`. El Route Handler repite autenticación, permiso, tamaño, extensión, MIME y firma binaria antes de actualizar `workspace_settings.logo_path`.

Las descargas parten de un registro visible por RLS y generan una signed URL de 60 segundos. No se almacenan ni publican URLs permanentes. La validación de MIME del navegador y del bucket reduce riesgo, pero no sustituye un análisis antimalware; antes de admitir archivos de terceros no confiables deberá añadirse escaneo de contenido y cuarentena.

## Cabeceras y exposición

Next.js no publica `X-Powered-By`. Todas las rutas envían `nosniff`, bloqueo de iframes, política de referente `same-origin`, aislamiento de recursos del mismo origen y deshabilitación de cámara, micrófono, geolocalización y pagos. HSTS debe configurarse en la plataforma de producción una vez confirmado que todo dominio y subdominio funciona exclusivamente sobre HTTPS.

No se definió todavía una CSP estricta: Next.js y los componentes actuales requieren inventariar scripts, estilos y orígenes de Supabase antes de desplegarla con nonces. Debe incorporarse primero en modo `Report-Only`, corregir violaciones y después aplicarse.

## Gestión y operación

- Mantener `SUPABASE_SECRET_KEY`, contraseñas iniciales y secretos fuera del repositorio y rotarlos ante cualquier exposición.
- Aplicar migraciones en orden y comprobar políticas en el entorno de Supabase antes del despliegue.
- Probar cada operación con una cuenta admin, una assistant activa, una assistant inactiva y una sesión anónima.
- Revisar periódicamente usuarios activos, administradores, eventos de Auth y logs de aplicación.
- No añadir nuevas tablas, buckets o RPC sin RLS, grants mínimos, validación de servidor y actualización de este documento.
- Evitar datos personales o financieros en logs; conservar solo identificadores y etiquetas operativas mínimas.

## Pruebas de regresión recomendadas

Como assistant, las peticiones directas deben fallar al actualizar `profiles`, cambiar `projects.fee`, modificar `project_members`, asignar `tasks.assigned_to`, borrar clientes/proyectos/tareas/eventos/archivos y realizar cualquier operación financiera. Como usuario inactivo deben fallar todas las lecturas y mutaciones empresariales. Como anónimo no debe poder consultarse ninguna tabla ni objeto privado.

La aplicación debe verificar además que un admin no pueda dejar el sistema sin otro admin activo, que una ruta de Storage manipulada sea rechazada y que una signed URL deje de funcionar al expirar.
