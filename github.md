repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-22T14:10:00Z
### Updated in this project
- **Tiempo de Fallas de Equipos**: nuevo switch `Horas` / `% T. Efectivo`. El porcentaje divide las horas de falla por el Tiempo Efectivo del mismo bucket, para separar "fallan más" de "trabajan más". El tooltip muestra horas de falla y horas efectivas detrás del %.
- Nuevo acumulador `efectivoPorFecha` en `procesarMetricas` (todo menos No Uso y NoNa, misma fórmula que `tEfectivo`).
- El eje X de las series de tiempo ahora usa el dominio del filtro vigente (año, mes o rango desde/hasta) en vez del rango de los datos; `Reset` vuelve a ese dominio.
- Las series de fallas y de lote promedio ya no exigen 2 buckets: con un solo punto se dibuja la barra/línea, sin línea de tendencia.
- **Carga de OPINONA**: el tablero quedaba para siempre en "Cargando datos detallados...". La API devolvía un objeto por fila, repitiendo los 50 nombres de columna en cada una (~754 bytes por fila, ~21 MB sobre 30.000 filas) y el pedido pasaba el tope de 60 s. Ahora se pide `?tabla=opinona&formato=compacto` y `rehidratarOpinona()` rearma los objetos. Compatible con la API vieja: si responde el array de siempre, se usa tal cual.
- `TIMEOUT_OPINONA` de 60 s a 180 s, como red de seguridad.
- La caché guarda el payload compacto, que **sí entra** en localStorage (el formato de objetos superaba la cuota y la caché nunca servía).
- Si falla la carga del detalle, el cartel "Cargando datos detallados..." se reemplaza por el motivo real y un botón Reintentar, en vez de aparentar que sigue cargando.


## Screen map
| Pantalla | Archivo |
|---|---|
| Dashboard completo (todas las pestañas) | Dashboard_v15.html |
| Fallas de equipos: Horas vs % T. Efectivo | Dashboard_v15.html · fallaModeHTML / setFallaMode / drawFallaSemana / serieDomain |
| Reporte Diario (pestaña) | Dashboard_v15.html · renderDiario / drawDiarioDonut / drawDiarioPareto / drawDiarioSemana / openModalDiarioClasif / openModalDiarioVel |
| Carga de datos en dos fases · formato compacto | Dashboard_v15.html · init / rehidratarOpinona / marcarDetalleCaido |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
