# Especificación oficial de MWTRAZO

**Estado:** especificación base  
**Fase:** 0 — definición general  
**Última actualización:** 1 de octubre de 2026  
**Alcance:** producto, arquitectura prevista, autorización y reglas de negocio iniciales

## 1. Descripción

MWTRAZO es una aplicación web interna para gestionar la operación de un pequeño estudio de arquitectura. Centralizará clientes, proyectos, tareas, calendario, archivos, finanzas, usuarios y configuración en un único sistema, con acceso controlado según el rol de cada integrante.

El sistema se diseña inicialmente para dos personas, pero su modelo de datos, autorización y navegación deberá admitir nuevos usuarios sin depender de nombres, correos o cantidades fijas.

## 2. Objetivo

El objetivo de MWTRAZO es proporcionar una fuente única, segura y trazable de la información operativa y administrativa del estudio. Debe facilitar el seguimiento de proyectos, la coordinación del trabajo, la consulta de documentos y, para usuarios autorizados, la gestión financiera y del sistema.

Esta fase solo establece la especificación oficial. No incluye implementación, conexión con servicios externos, autenticación, persistencia, interfaces visuales ni operaciones CRUD.

## 3. Usuarios iniciales

| Usuario | Cargo | Rol inicial |
| --- | --- | --- |
| Alexis Wilfredo Trujillo Caro | Arquitecto y propietario del estudio | `admin` |
| Eusebia Florentina Meza | Arquitecta asistente | `assistant` |

Los usuarios iniciales son datos de negocio previstos, no valores que deban codificarse directamente en componentes, permisos o lógica de aplicación. Su alta deberá realizarse mediante un procedimiento seguro en una fase posterior.

## 4. Roles y permisos

Los roles iniciales son exclusivamente `admin` y `assistant`. La autorización se define por capacidades; ocultar un control en la interfaz no sustituye la validación en el servidor ni las políticas de acceso a datos.

### 4.1. Administrador (`admin`)

Puede:

- Crear y editar usuarios.
- Cambiar roles.
- Activar y desactivar usuarios.
- Eliminar usuarios cuando sea técnicamente seguro.
- Crear, editar y eliminar clientes y proyectos.
- Asignar usuarios a proyectos.
- Crear, editar, asignar y eliminar tareas.
- Crear, editar y eliminar eventos.
- Subir y eliminar archivos.
- Crear, consultar, modificar y eliminar información financiera.
- Administrar las configuraciones del sistema.

### 4.2. Asistente (`assistant`)

Puede:

- Consultar, crear y editar clientes.
- Consultar proyectos y editar su información operativa.
- Crear, editar y completar tareas.
- Crear y editar eventos.
- Consultar y subir archivos.

No puede:

- Administrar usuarios, crear administradores ni cambiar roles.
- Eliminar clientes o proyectos.
- Eliminar archivos, salvo que una ampliación futura lo autorice expresamente.
- Acceder a configuraciones administrativas sensibles.
- Crear, modificar o eliminar información financiera, salvo habilitación expresa en una ampliación futura.

### 4.3. Matriz resumida

| Capacidad | `admin` | `assistant` |
| --- | :---: | :---: |
| Administrar usuarios y roles | Sí | No |
| Consultar, crear y editar clientes | Sí | Sí |
| Eliminar clientes | Sí | No |
| Consultar y editar proyectos | Sí | Sí, solo información operativa |
| Crear o eliminar proyectos | Sí | No |
| Asignar usuarios a proyectos | Sí | No |
| Crear y editar tareas | Sí | Sí |
| Asignar o eliminar tareas | Sí | No |
| Completar tareas | Sí | Sí |
| Crear y editar eventos | Sí | Sí |
| Eliminar eventos | Sí | No |
| Consultar y subir archivos | Sí | Sí |
| Eliminar archivos | Sí | No |
| Gestionar finanzas | Sí | No |
| Administrar configuración sensible | Sí | No |

Toda acción no concedida de forma explícita se considera denegada.

## 5. Módulos

- **Dashboard:** resumen de actividad, tareas, proyectos, eventos e indicadores permitidos para el usuario.
- **Clientes:** registro y mantenimiento de personas u organizaciones clientes y sus datos de contacto.
- **Proyectos:** información general y operativa, estado, cliente, responsables, fechas y asociaciones del proyecto.
- **Tareas:** planificación, asignación, prioridad, vencimiento y seguimiento de trabajo.
- **Calendario:** consulta y mantenimiento de eventos vinculados o no a proyectos.
- **Archivos:** carga, clasificación y consulta de documentos asociados a entidades del sistema.
- **Finanzas:** control financiero del estudio y de los proyectos, exclusivo inicialmente para administradores.
- **Usuarios:** administración de cuentas, roles y estado, exclusiva para administradores.
- **Configuración:** parámetros operativos y administrativos del sistema según autorización.

El Dashboard debe respetar los mismos permisos que los módulos fuente: no debe exponer por agregación datos que el usuario no pueda consultar directamente.

## 6. Stack tecnológico

- Next.js 16.3.8 con App Router.
- React 19.
- TypeScript en modo estricto.
- Tailwind CSS 4.
- shadcn/ui.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Zod.
- React Hook Form.
- TanStack Table.
- Lucide React.
- Recharts cuando una visualización aporte valor.
- pnpm como único gestor de paquetes (`pnpm@12.3.4` en el proyecto actual).

`pnpm-lock.yaml` será el único lockfile. No se utilizarán npm, npx, yarn o bun, ni se generarán lockfiles pertenecientes a esos gestores.

Las bibliotecas todavía ausentes se instalarán únicamente en la fase que requiera su uso real.

## 7. Arquitectura general prevista

### 7.1. Aplicación

- Se mantendrá una sola aplicación Next.js existente; no se creará otro proyecto ni otra carpeta raíz.
- El enrutamiento residirá en `src/app` mediante App Router.
- Se preferirán Server Components para lectura y composición de páginas. Los Client Components se limitarán a interacción, estado del navegador o bibliotecas que los necesiten.
- Las mutaciones se ejecutarán en el servidor mediante el mecanismo soportado por la versión instalada de Next.js, con validación, autenticación y autorización antes de acceder a datos.
- La lógica de dominio y acceso a datos no se colocará directamente en componentes visuales.
- Los límites entre presentación, validación, autorización, dominio y persistencia deberán permanecer explícitos.

Antes de implementar APIs, convenciones o estructura específica de Next.js, se consultará la documentación incluida en `node_modules/next/dist/docs/`, porque la versión instalada puede contener cambios incompatibles con versiones anteriores.

### 7.2. Organización orientativa

La estructura exacta se validará durante la implementación. Como criterio inicial:

```text
src/
  app/                 # rutas, layouts y límites de carga/error
  components/          # componentes compartidos y UI
  features/            # lógica y UI agrupadas por módulo
  lib/                 # clientes de infraestructura y utilidades
  server/              # autorización, servicios y acceso a datos
  types/               # tipos compartidos cuando sean necesarios
```

Se utilizará el alias existente `@/*` para imports desde `src`. Esta propuesta no obliga a crear carpetas vacías ni a anticipar abstracciones.

### 7.3. Datos y servicios

- Supabase PostgreSQL será la fuente de verdad para datos estructurados.
- Supabase Auth gestionará identidad y sesiones; el perfil de negocio complementará la identidad autenticada.
- Supabase Storage almacenará archivos; la base de datos conservará sus metadatos y asociaciones.
- El acceso privilegiado y las credenciales de servicio permanecerán exclusivamente en el servidor.
- Las políticas Row Level Security (RLS) formarán parte de la autorización y deberán alinearse con las reglas de la aplicación.

## 8. Convenciones de código

- TypeScript estricto; evitar `any` y conversiones inseguras. Los datos externos se tratarán como desconocidos hasta validarlos.
- Nombres de componentes y tipos en `PascalCase`; funciones, variables y archivos utilitarios en `camelCase` o la convención establecida para su categoría; rutas en minúsculas y `kebab-case` cuando contengan varias palabras.
- Identificadores, nombres técnicos, tipos y código en inglés. Textos visibles y documentación funcional en español, salvo decisión posterior de internacionalización.
- Imports internos mediante `@/*` cuando mejoren la claridad.
- Validación de entradas en los límites del sistema con esquemas Zod compartibles cuando corresponda.
- Formularios complejos con React Hook Form y Zod; la validación del cliente será complementaria, nunca suficiente para autorizar una operación.
- Tablas de datos con TanStack Table; iconografía con Lucide React; gráficos con Recharts solo cuando exista una necesidad informativa concreta.
- Componentes pequeños y cohesionados; lógica de negocio reutilizable fuera de la capa visual.
- Operaciones asíncronas con estados explícitos de carga, éxito, ausencia de datos y error.
- Fechas almacenadas en UTC y presentadas en la zona horaria configurada para el estudio. El formato visible será consistente y localizado.
- Importes almacenados con tipos decimales adecuados y acompañados por una moneda explícita; no usar punto flotante para cálculos financieros.
- No incorporar secretos, claves, correos privados o credenciales al repositorio ni exponer variables exclusivas del servidor al cliente.

## 9. Reglas de negocio iniciales

1. Todo usuario debe tener exactamente un rol activo: `admin` o `assistant`.
2. Un usuario inactivo no puede iniciar una nueva sesión ni ejecutar operaciones protegidas. La política sobre sesiones ya abiertas deberá cerrarlas o invalidarlas de forma segura.
3. Debe existir al menos un administrador activo. No se permitirá desactivar, degradar o eliminar al último administrador activo.
4. Los cambios de rol, activación y desactivación solo pueden realizarlos administradores.
5. La eliminación de un usuario solo será posible si no rompe historial, auditoría o relaciones obligatorias. Cuando exista riesgo, se preferirá desactivación o eliminación lógica.
6. Todo proyecto pertenece a un cliente. Un cliente puede tener cero o más proyectos.
7. Un proyecto puede tener varios usuarios asignados y un usuario puede participar en varios proyectos.
8. Una tarea puede estar vinculada a un proyecto y puede tener una persona asignada. La obligatoriedad de esos vínculos se definirá según el flujo aprobado en la fase de implementación.
9. Completar una tarea debe conservar quién la completó y cuándo.
10. Los asistentes pueden editar únicamente información operativa de proyectos; campos financieros, de propiedad, permisos o administración quedan fuera de su alcance.
11. Los eventos pueden asociarse con un proyecto y, si el diseño funcional lo requiere, con participantes. El acceso al evento no debe ampliar implícitamente el acceso al proyecto relacionado.
12. Todo archivo debe registrar propietario lógico, autor de carga, fecha, ubicación de Storage, tipo y entidad asociada cuando corresponda.
13. La eliminación de archivos por administradores debe coordinar el objeto de Storage con sus metadatos y preservar auditoría cuando sea necesaria.
14. La información financiera está denegada a asistentes por defecto, incluso en búsquedas, Dashboard, exportaciones, logs y respuestas de API.
15. La eliminación de clientes o proyectos solo podrá realizarla un administrador y deberá impedirse cuando cause pérdida incoherente de información relacionada. Se definirá por entidad si corresponde restricción, archivo o eliminación lógica.
16. Las operaciones sensibles deberán quedar registradas en una auditoría inmutable o suficientemente protegida.

## 10. Entidades principales

### Usuario y acceso

- **Auth User:** identidad mantenida por Supabase Auth.
- **Profile:** nombre, cargo, rol, estado y datos de negocio del usuario.
- **Audit Log:** actor, acción, entidad, instante y contexto mínimo de operaciones sensibles.

### Operación

- **Client:** persona u organización que contrata al estudio.
- **Project:** trabajo arquitectónico asociado a un cliente.
- **Project Member:** asociación entre un proyecto y un usuario, preparada para atributos futuros de participación.
- **Task:** unidad de trabajo, estado, prioridad, fechas, creador, responsable y proyecto opcional según el flujo final.
- **Event:** actividad de calendario con fechas, descripción y asociaciones opcionales.
- **Event Participant:** asociación prevista entre eventos y usuarios cuando se requieran participantes múltiples.

### Documentos

- **File Record:** metadatos del archivo almacenado, autor de carga, ruta segura y asociación lógica.

### Finanzas

- **Financial Record:** concepto financiero, tipo, importe, moneda, fecha y relación opcional con proyecto o cliente. Su taxonomía definitiva —por ejemplo ingreso, egreso, presupuesto o pago— se decidirá antes de implementar el módulo.

### Configuración

- **System Setting:** configuración global o administrativa.

Todas las entidades persistentes deberán prever identificador estable, fechas de creación y actualización y, cuando corresponda, autoría, archivado o eliminación lógica.

## 11. Relaciones previstas

```text
Auth User 1 ── 1 Profile
Client    1 ── N Project
Profile   N ── N Project       (mediante Project Member)
Project   1 ── N Task          (vínculo potencialmente opcional en Task)
Profile   1 ── N Task          (como creador y/o responsable)
Project   1 ── N Event         (asociación opcional)
Profile   N ── N Event         (mediante Event Participant, si se habilita)
Client/Project/Task/Event ── N File Record
Client/Project ── N Financial Record
Profile   1 ── N Audit Log     (como actor)
```

Para archivos asociados a distintas clases de entidad se elegirá en el diseño de datos una estrategia que mantenga integridad referencial; no se asumirá una relación polimórfica sin restricciones.

## 12. Seguridad

- Autenticación con Supabase Auth y autorización por capacidad en cada operación del servidor.
- RLS habilitada en todas las tablas expuestas mediante las APIs de Supabase, con denegación por defecto.
- Verificación de rol y estado activo a partir de datos confiables del servidor, no de valores enviados por el cliente.
- Separación entre clientes de Supabase para navegador y servidor; la service role key nunca llegará al navegador.
- Validación y normalización de toda entrada antes de persistirla.
- Storage con buckets privados por defecto, políticas coherentes con RLS y URLs firmadas de duración limitada cuando sean necesarias.
- Restricciones de tamaño, tipo MIME y extensión para cargas; nombres de objeto generados por el sistema y no confiados al nombre original.
- Protección frente a acceso horizontal: conocer un identificador no concede acceso a la entidad.
- Auditoría de administración de usuarios, cambios de rol/estado, eliminaciones, archivos, configuración y operaciones financieras.
- Mensajes de error sin secretos ni detalles internos; logs sin credenciales ni datos personales innecesarios.
- Variables de entorno separadas por entorno y principio de mínimo privilegio.
- Copias de seguridad, recuperación y retención definidas antes de usar el sistema con datos de producción.
- Revisión específica de privacidad y normativa aplicable antes de almacenar documentos personales, contractuales o financieros reales.

La autorización debe aplicarse en profundidad: interfaz, operación de servidor, consulta a datos y políticas RLS. La capa más permisiva nunca debe invalidar una restricción de otra capa.

## 13. Criterios para futuras ampliaciones

Una ampliación deberá:

1. Mantener compatibilidad con los roles existentes o incluir una migración y una matriz de permisos explícitas.
2. Incorporar permisos como capacidades configurables en lugar de condicionales dispersos por nombre de usuario.
3. Definir propietario, visibilidad, ciclo de vida, auditoría y política de eliminación de cada nueva entidad.
4. Incluir migraciones de base de datos versionadas, reversibles cuando sea viable y probadas con datos representativos.
5. Actualizar conjuntamente esta especificación, las políticas RLS, las validaciones del servidor y las pruebas de autorización.
6. Evitar dependencias nuevas si la plataforma o una dependencia existente resuelven adecuadamente el caso; toda incorporación debe justificar mantenimiento y seguridad.
7. Conservar accesibilidad, diseño adaptable, rendimiento y estados completos de interfaz.
8. Diseñar integraciones externas con credenciales de mínimo privilegio, manejo de fallos, idempotencia y trazabilidad.
9. Evaluar la necesidad de nuevos roles frente a permisos más granulares. Ningún rol futuro recibirá permisos por omisión.
10. Mantener compatibilidad con múltiples usuarios, clientes y proyectos sin límites codificados.
11. Definir antes de implementar cualquier cambio financiero su moneda, precisión, estados, aprobaciones, correcciones y auditoría.
12. Añadir pruebas que demuestren tanto las acciones permitidas como las denegadas para cada rol afectado.

## 14. Decisiones pendientes para fases posteriores

Antes de implementar cada módulo deberán concretarse, como mínimo:

- Estados y campos exactos de clientes, proyectos, tareas y eventos.
- Reglas de asignación, responsables múltiples y visibilidad por proyecto.
- Zona horaria oficial del estudio y estrategia para eventos de día completo o recurrentes.
- Moneda base, categorías y flujo de aprobación de finanzas.
- Límites, tipos aceptados, retención y versionado de archivos.
- Estrategia por entidad para archivo, eliminación lógica y eliminación definitiva.
- Requisitos de búsqueda, paginación, exportación y notificaciones.
- Alcance y retención del registro de auditoría.
- Entornos, despliegue, copias de seguridad, recuperación y observabilidad.

Estas decisiones pendientes no amplían permisos ni habilitan funcionalidades por sí mismas. Hasta que se aprueben, rige el principio de mínimo privilegio y denegación por defecto.
