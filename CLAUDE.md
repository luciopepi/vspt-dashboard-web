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

## Conexión con los datos — NO ROMPER (regla permanente)

Error que no tiene que volver:
"No se pudo cargar el detalle · Unexpected token '<', "<!DOCTYPE "... is not valid JSON".

**Causa (28-sep-2026):** al abrir v15 salen ~14 pedidos a la API a la vez: v15 más las
pestañas que precarga (Programas, Calidad, Personal). Los pedidos que tardan pierden la
respuesta en Google: la redirección `script.googleusercontent.com/macros/echo` da 404 con una
página HTML, y el tablero falla al leerla como JSON. Se resolvió en la API (repo privado
`luciopepi/Dashboard`): OPINONA y PLAN salen de una foto ya armada y responden en 1-2 s.
Las reglas completas, el diagnóstico y el verificador `DASHBOARD/tests/verificar_api.js`
están en el `CLAUDE.md` de ese repo.

Reglas para el HTML:
1. No sumar pedidos a la API en la carga inicial ni en las pestañas que se precargan. Lo nuevo
   se pide a demanda: al abrir la pestaña o al tocar el botón.
2. OPINONA se pide una sola vez (`pedirOpinona` de v15, en 4 partes). Programas embebido la
   toma de `window.VSPT_OPINONA`. No volver a pedirla por otro camino ni en otro formato.
3. No cambiar `API_URL`, ni `OPI_PARTES` (tiene que coincidir con la foto de la API), ni cómo
   se unen las partes, sin cambiar también la API.
4. Si una pestaña necesita datos pesados, se agregan a la foto de la API o a un pedido
   liviano. Nunca se lee en vivo una tabla grande al abrir.
5. Si el cambio del HTML viene con un cambio de la API, correr el verificador del repo
   Dashboard antes de entregar.
6. Para diagnosticar: `?tabla=ping` de la API y F12 → Red → filtro `echo`. Los 404 muestran
   qué pedido perdió la respuesta. No se gastan deploys de Netlify para probar.
7. Los commits que solo tocan documentación llevan `[skip netlify]` en el mensaje, para no
   gastar un deploy.
8. **Todo GET a la API pasa por `pedirJson`** (en v15, Programas, Calidad y Personal; en
   Mantenimiento, `pedirMant`). Si Google pierde la respuesta (404 con HTML, texto que no es
   JSON o corte de red), reintenta 3 veces con espera creciente. Nunca `fetch(...)` +
   `res.json()` directo. Los POST (guardar, asistente) no se reintentan: podrían duplicar
   una acción.
9. Visto el 29-sep-2026: aun con cada `doGet` respondiendo en 1-2 s, Google redirigía el `echo`
   de vuelta a `/exec` y terminaba en 404 casi todo lo que no era chico, cuando salían ~14
   pedidos juntos. Por eso:
   - las partes de OPINONA salen de a una;
   - las pestañas embebidas se precargan recién cuando termina el detalle, una cada 4,5 s
     (`detalleListo` en v15).
   No volver a lanzar todo en paralelo.
10. Si la API falla, se avisa. **Nunca** se pasa a datos de ejemplo: se ven como reales y, en
    Personal, se podían guardar encima de la asignación real.
