# Instrucciones del proyecto

## Login de Google durante retoques al HTML (regla permanente)

Mientras trabajamos/retocamos cualquier HTML del dashboard, **el acceso de Google
va desactivado**. Se reactiva **solo al terminar el trabajo**, antes de exportar a GitHub.

**Desactivar (al empezar a editar):** comentar la carga de `auth.js` en el `<head>`
del HTML, dejando el marcador `AUTH-OFF`:

```html
<!-- AUTH-OFF · login de Google desactivado mientras retocamos el HTML.
     REACTIVAR antes de exportar a GitHub (descomentar esta línea).
<script src="auth.js"></script>
-->
```

**Reactivar (al cerrar el trabajo / antes de publicar):** volver a dejar
`<script src="auth.js"></script>` activo y borrar el bloque `AUTH-OFF`.

Aplica a `Dashboard_v15.html` y a cualquier otro HTML del proyecto que cargue `auth.js`.
No hay que preguntar cada vez: al empezar a editar, desactivar; al terminar, reactivar
y avisar en el resumen que quedó reactivado para exportar.
