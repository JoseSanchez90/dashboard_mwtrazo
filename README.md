# MWTRAZO

Aplicación web interna para la gestión de un estudio de arquitectura.

La especificación funcional y técnica se encuentra en
[`docs/project-spec.md`](docs/project-spec.md).

## Desarrollo local

Requisitos:

- Node.js 20.9 o superior.
- pnpm 12.3.4.

Instala las dependencias y crea tu archivo local de variables de entorno a
partir de `.env.local.example`. No incluyas credenciales reales en el
repositorio.

```bash
pnpm install
pnpm dev
```

## Verificación

```bash
pnpm typecheck
pnpm lint
pnpm build
```
