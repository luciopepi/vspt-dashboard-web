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
2. OPINONA se pide una sola vez (`cargarDetalle` de v15: por mes, ver regla 11; con una API
   anterior, las 4 partes de `pedirOpinona`). Programas embebido la toma de
   `window.VSPT_OPINONA`. No volver a pedirla por otro camino ni en otro formato.
3. No cambiar `API_URL`, ni `OPI_PARTES` (tiene que coincidir con la foto de la API), ni cómo
   se unen las partes o los meses, sin cambiar también la API.
4. Si una pestaña necesita datos pesados, se agregan a la foto de la API o a un pedido
   liviano. Nunca se lee en vivo una tabla grande al abrir.
5. Si el cambio del HTML viene con un cambio de la API, correr el verificador del repo
   Dashboard antes de entregar.
6. Para diagnosticar: `?tabla=ping` de la API y F12 → Red → filtro `echo`. Los 404 muestran
   qué pedido perdió la respuesta. No se gastan deploys de Netlify para probar.
7. Los commits que solo tocan documentación llevan `[skip netlify]` en el mensaje, para no
   gastar un deploy. El deploy lo decide el mensaje del último commit que llega a `main`: el
   merge que publica un HTML no lleva `[skip netlify]` (si lo lleva, no se publica). Si el
   HTML depende de una API nueva, tiene que andar también con la anterior y se mergea después
   de publicar y comprobar la API (un solo deploy).
8. **Todo GET a la API pasa por `pedirJson`** (en v15, Programas, Calidad y Personal; en
   Mantenimiento, `pedirMant`; en Planta 3D, `pedirApi`). Planta 3D (sólo en el tablero de
   Google) pide `?tabla=mant` al abrir la pestaña y `planta3d`, `planta3d_otif`,
   `planta3d_tarjetas` y `planta3d_fotos` recién al elegir Limpieza, Zonas 5S o Tarjetas 5S.
   Los nombres y fotos de los responsables nunca van en este repo (es público): llegan por la API.
   Si Google pierde la respuesta (404 con HTML, texto que no es JSON o corte de red), reintenta
   3 veces con espera creciente. Nunca `fetch(...)` +
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
11. **OPINONA por mes (29-sep, API 2026-09-29b o posterior).** Aun de a una, las partes de
    1,4 MB se perdían (~30 s cada vez) y el detalle tardaba hasta 4 minutos. Lo que llega
    siempre son las respuestas chicas. v15 (`cargarOpinonaPorMes`):
    - pide el índice (`?tabla=opinona_meses`) y cada mes (`?tabla=opinona_mes&mes=AAAA-MM`,
      gzip + base64, 12-45 KB), de a 2, cada intento cortado a los 15 s (`pedirJson` con
      `reintentarSiVence`);
    - guarda cada mes en `localStorage` (`vspt_opi_mes_v1:AAAA-MM` + índice `vspt_opi_meses_v1`,
      ~600 KB): al abrir dibuja lo guardado y baja sólo los meses cuya huella cambió;
    - orden: el año activo primero, del mes en curso hacia enero; después el resto;
    - el detalle de un año se dibuja con **todos** sus meses (nunca YTD parcial); mientras,
      quedan los KPI de la hoja mensual con el avance;
    - sin `DecompressionStream` pide `&gz=0` y no guarda nada.
    Si cambia el formato de lo guardado, cambiar la versión de las claves (`_v2`). Lo nuevo que
    se pida al abrir, también chico (hasta ~100 KB por respuesta).
