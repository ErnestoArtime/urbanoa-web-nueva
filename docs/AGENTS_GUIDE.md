# Guía de trabajo para agentes

## Antes de editar

1. Leer `AGENT.md`, `FRONTEND_GUIDE.md` y la documentación de `docs/` relacionada.
2. Identificar el feature y el componente responsable; no modificar una pantalla desde un duplicado antiguo.
3. Revisar servicios y señales existentes antes de crear estado nuevo.
4. Confirmar si el cambio afecta móvil, escritorio, idiomas, accesibilidad o rutas directas.

## Durante el cambio

- Mantener el alcance solicitado y conservar cambios previos del usuario.
- Preferir `apply_patch` para ediciones pequeñas y revisables.
- Reutilizar tokens, componentes compartidos y traducciones.
- Validar tanto el estado con datos como el estado vacío/deshabilitado.
- Añadir una comprobación secundaria en acciones sensibles (pago, eliminación, recarga, aparcamiento).
- No introducir backend, dependencias UI pesadas o cambios de arquitectura sin autorización.

## Verificación mínima

```bash
npm run i18n:check
npx ng build
```

Si existe servidor local, verificar rutas afectadas en móvil y escritorio. Para cambios visuales, revisar al menos `390×844` y `1440×900`.

## Entrega

Indicar qué archivos se tocaron, qué estados se cubrieron y qué comandos pasaron. Si queda una limitación conocida, documentarla explícitamente.

## No hacer

- No dejar literales visibles nuevos en `.html` o `.ts`.
- No usar `any` para evitar un error de tipos.
- No poner lógica de negocio compleja en la plantilla.
- No duplicar el mismo botón o tarjeta para resolver un estado vacío.
- No eliminar `_apk-analysis/` ni alterar recursos de referencia sin motivo.
