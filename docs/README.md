# Base de conocimiento de UrbanOA

Referencia operativa para mantener y ampliar la web.

## Documentos

- [Arquitectura y flujos](./ARCHITECTURE.md)
- [Sistema visual](./DESIGN_SYSTEM.md)
- [Responsive y accesibilidad](./RESPONSIVE.md)
- [Contenido e internacionalización](./I18N_AND_CONTENT.md)
- [Guía para agentes](./AGENTS_GUIDE.md)

## Contexto rápido

- Angular 20.0.3, standalone y rutas lazy.
- Frontend navegable con datos mock y persistencia local; no hay backend de negocio conectado.
- Entrada pública: `/auth/login`. Entrada autenticada de maqueta: `/app/home`.
- Fuentes visuales: `src/styles.css` y componentes compartidos de `src/app/shared`.
- Diccionarios: `public/assets/i18n/{es,eu,fr,uk}.json`.

Si una decisión nueva contradice estos documentos, actualizar primero la documentación y después el código.
