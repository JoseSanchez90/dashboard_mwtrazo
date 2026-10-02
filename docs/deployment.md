# Despliegue de MWTRAZO

Esta guía prepara un despliegue de producción con Vercel y Supabase. No contiene secretos reales. Producción debe usar un proyecto Supabase distinto de desarrollo y credenciales generadas específicamente para ese entorno.

## 1. Variables de entorno

Configurar en Vercel, con alcance **Production**, las siguientes variables:

| Variable | Exposición | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Navegador y servidor | URL HTTPS del proyecto Supabase de producción |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Navegador y servidor | Clave publicable de Supabase; su seguridad depende de RLS |
| `SUPABASE_URL` | Solo servidor | URL del proyecto para operaciones administrativas |
| `SUPABASE_SECRET_KEY` | Solo servidor | Clave secreta para Auth Admin y operaciones indispensables |

`SUPABASE_SECRET_KEY` nunca debe usar el prefijo `NEXT_PUBLIC_`, aparecer en logs, incluirse en el repositorio ni configurarse para entornos Preview que no deban acceder a datos productivos.

Las siguientes variables se usan únicamente durante el alta inicial local y deben retirarse al terminar:

- `MWTRAZO_ADMIN_EMAIL`
- `MWTRAZO_ADMIN_PASSWORD`
- `MWTRAZO_ASSISTANT_EMAIL`
- `MWTRAZO_ASSISTANT_PASSWORD`

## 2. Supabase Production

1. Crear un proyecto exclusivo para producción en la región más próxima a Perú disponible para la organización.
2. Activar protección de cuenta, MFA para administradores del proyecto y acceso de mínimo privilegio al panel.
3. En **Authentication > URL Configuration**, establecer como Site URL el dominio final HTTPS de MWTRAZO. Añadir solo los dominios Preview que realmente necesiten autenticación y nunca apuntarlos accidentalmente a datos productivos.
4. Revisar el proveedor Email. Para uso real, configurar SMTP propio, remitente verificado y límites adecuados; no depender del servicio de prueba.
5. Mantener deshabilitados los proveedores de autenticación no utilizados y decidir explícitamente si se permite alta pública. MWTRAZO crea usuarios desde el servidor, por lo que el registro público debe permanecer deshabilitado.
6. Configurar copias de seguridad, retención y un procedimiento probado de restauración antes de cargar información contractual o financiera.
7. Habilitar alertas y revisar periódicamente logs de Auth, API, Postgres y Storage.

## 3. Migraciones

Aplicar en orden todos los archivos de `supabase/migrations` sobre una base vacía de producción:

1. `20261001000000_create_profiles.sql`
2. `20261002000000_create_clients.sql`
3. `20261003000000_create_projects.sql`
4. `20261004000000_create_project_phases.sql`
5. `20261005000000_create_tasks.sql`
6. `20261006000000_create_events.sql`
7. `20261007000000_create_project_files.sql`
8. `20261008000000_create_project_finances.sql`
9. `20261009000000_create_activity_logs.sql`
10. `20261010000000_harden_security.sql`
11. `20261011000000_create_profile_self_service.sql`

Usar el flujo de migraciones de Supabase CLI o la integración CI aprobada para el equipo. No ejecutar migraciones destructivas directamente en producción sin respaldo, revisión del diff y ensayo previo en staging.

Después de migrar, comprobar que RLS está habilitado en todas las tablas empresariales, que `anon` no tiene acceso, que las políticas coinciden con `docs/security.md` y que solo las RPC previstas son ejecutables por `authenticated`.

## 4. Storage

La migración crea o actualiza el bucket privado `project-files` con límite de 25 MB y MIME permitidos. Verificar en producción:

- `public = false`.
- Políticas de lectura y subida solo para usuarios activos.
- Rutas con el patrón `<project_uuid>/<object_uuid>.<extensión>`.
- Borrado exclusivo para admin.
- Ausencia de políticas de actualización de objetos.
- Signed URLs con vencimiento breve; la aplicación usa 60 segundos.

La migración de perfil crea también `avatars`, privado, limitado a 2 MB y a JPG, PNG o WebP. Cada objeto debe residir bajo el UUID del usuario propietario y las imágenes se muestran mediante signed URLs temporales.

Antes de aceptar archivos de personas no confiables debe añadirse un proceso de análisis antimalware y cuarentena. El MIME declarado y la extensión no validan por sí solos el contenido binario.

## 5. Usuarios iniciales

Con las migraciones aplicadas, ejecutar `pnpm bootstrap:users` desde un entorno administrativo seguro usando variables temporales. El script crea las cuentas reales de Alexis y Eusebia y asigna sus perfiles. Después:

1. Confirmar un admin activo y un assistant activo en `profiles`.
2. Probar el inicio de sesión de ambas cuentas.
3. Cambiar las contraseñas temporales por canales seguros.
4. Retirar las cuatro variables `MWTRAZO_*`.
5. Confirmar que no se imprimieron credenciales en logs del shell o CI.

## 6. Vercel

1. Importar el repositorio existente como proyecto Next.js; no crear otra aplicación.
2. Usar pnpm, respetando `packageManager: pnpm@12.3.4` y `pnpm-lock.yaml`.
3. Comando de instalación: `pnpm install --frozen-lockfile`.
4. Comando de build: `pnpm build`.
5. Configurar las cuatro variables de entorno y revisar su alcance antes de desplegar.
6. Desplegar primero a Preview conectado a un proyecto Supabase de staging, nunca a la base productiva por defecto.
7. Asociar el dominio final, forzar HTTPS y configurar HSTS en la plataforma únicamente cuando todos los dominios y subdominios funcionen exclusivamente por HTTPS.
8. Mantener deshabilitados los source maps públicos salvo necesidad controlada de observabilidad.

La aplicación ya elimina `X-Powered-By`, bloquea iframes, aplica `nosniff`, limita capacidades del navegador y marca respuestas API como privadas y no almacenables. Una CSP estricta debe probarse primero en `Report-Only` con los orígenes reales de Vercel y Supabase.

## 7. Validación previa al deploy

Ejecutar desde un checkout limpio:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

Realizar pruebas funcionales con cuatro contextos: admin, assistant, usuario inactivo y sesión anónima. Verificar al menos login/logout, CRUD autorizado, rechazos de permisos mediante requests manuales, archivos privados, signed URLs, cálculos financieros y dashboard diferenciado.

Revisar responsive a 1440, 1280, 1024, 768 y 390 px, incluyendo navegación, tablas con desplazamiento interno, formularios, diálogos, calendario y Kanban. Validar navegación por teclado, foco visible, labels, anuncios de error y contraste.

## 8. Checklist de salida

- [ ] Build, lint y typecheck sin errores.
- [ ] Único lockfile: `pnpm-lock.yaml`.
- [ ] Variables de producción configuradas y sin secretos en Git.
- [ ] Migraciones aplicadas y registradas en orden.
- [ ] RLS y grants comprobados con admin, assistant, inactivo y anónimo.
- [ ] Bucket `project-files` privado y políticas verificadas.
- [ ] Usuarios iniciales creados; contraseñas temporales rotadas.
- [ ] Registro público deshabilitado y SMTP de producción configurado.
- [ ] Site URL y redirect URLs apuntan al dominio correcto.
- [ ] Preview utiliza Supabase staging.
- [ ] Backups, retención y restauración documentados y probados.
- [ ] Dominio, TLS y cabeceras de seguridad verificados.
- [ ] Flujos críticos y responsive aprobados en navegadores objetivo.
- [ ] Monitoreo de errores, logs y alertas habilitado sin datos sensibles.
- [ ] Plan de rollback definido para aplicación y base de datos.

## 9. Después del despliegue

Ejecutar un smoke test sobre el dominio final, comprobar que no existen errores 5xx y revisar logs de Vercel/Supabase. Confirmar que una signed URL expira, que assistant no recibe datos financieros y que un usuario desactivado pierde acceso aunque conserve cookies anteriores. Registrar la versión desplegada y conservar una referencia al commit y al conjunto de migraciones aplicado.
