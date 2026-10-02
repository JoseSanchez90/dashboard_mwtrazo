# Configuración de autenticación

La implementación de autenticación requiere un proyecto de Supabase. No guardes claves ni contraseñas en Git.

1. Copia `.env.local.example` como `.env.local` y completa las variables.
2. Aplica `supabase/migrations/20261001000000_create_profiles.sql` en el proyecto de Supabase.
3. Define correos y contraseñas temporales para Alexis y Eusebia en `.env.local`.
4. Ejecuta una sola vez `pnpm bootstrap:users`.
5. Retira de `.env.local` las cuatro variables `MWTRAZO_*` usadas por el bootstrap si ya no son necesarias.

`SUPABASE_SECRET_KEY` es exclusivamente de servidor. Nunca debe llevar el prefijo `NEXT_PUBLIC_`, importarse desde un Client Component ni enviarse al navegador.

La eliminación física no forma parte de la interfaz. MWTRAZO conserva los perfiles y permite desactivar cuentas; además, la base de datos impide que desaparezca el último administrador activo.

