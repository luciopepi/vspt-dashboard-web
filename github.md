repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-12T16:05:00Z
### Updated in this project
- Nueva pestaña **Reporte Diario** (entre Línea 3 y Programas): OPINONA del día con selector de fecha y de línea (Planta/L1/L2/L3), independiente de los filtros laterales.
- Composición del Tiempo Efectivo por las 5 categorías, donut de paros, paros por máquina agrupados con subtotal, paradas externas, tiempos de cambio, pareto del mes y minigráfico OPINONA de 7 días con meta punteada. Todo clickeable al detalle.
- Corregido un error de fechas que afectaba todo el tablero: `YYYY-MM-DD` se interpretaba como UTC y en UTC-3 cada registro caía un día antes.
- La API ahora tiene timeout (5s KPI / 6s OPINONA) y cae a caché o a datos de ejemplo en vez de quedar en "SINCRONIZANDO".
- Verde y rojo del OPINONA unificados con los del donut (oliva #98A040 / crimson #D81840) en todas las pestañas.

## Screen map
| Pantalla | Archivo |
|---|---|
| Dashboard completo (todas las pestañas) | Dashboard_v15.html |
| Reporte Diario (pestaña) | Dashboard_v15.html · renderDiario / drawDiarioDonut / drawDiarioPareto / drawDiarioSemana / openModalDiarioClasif / openModalDiarioVel |
| Control de acceso Google | auth.js |
| Portada | index.html |
