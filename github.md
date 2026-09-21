repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-21T16:20:00Z
### Updated in this project
- **Tiempo de Fallas de Equipos**: nuevo switch `Horas` / `% T. Efectivo`. El porcentaje divide las horas de falla por el Tiempo Efectivo del mismo bucket, para separar "fallan más" de "trabajan más". El tooltip muestra horas de falla y horas efectivas detrás del %.
- Nuevo acumulador `efectivoPorFecha` en `procesarMetricas` (todo menos No Uso y NoNa, misma fórmula que `tEfectivo`).
- El eje X de las series de tiempo ahora usa el dominio del filtro vigente (año, mes o rango desde/hasta) en vez del rango de los datos; `Reset` vuelve a ese dominio.
- Las series de fallas y de lote promedio ya no exigen 2 buckets: con un solo punto se dibuja la barra/línea, sin línea de tendencia.


## Screen map
| Pantalla | Archivo |
|---|---|
| Dashboard completo (todas las pestañas) | Dashboard_v15.html |
| Fallas de equipos: Horas vs % T. Efectivo | Dashboard_v15.html · fallaModeHTML / setFallaMode / drawFallaSemana / serieDomain |
| Reporte Diario (pestaña) | Dashboard_v15.html · renderDiario / drawDiarioDonut / drawDiarioPareto / drawDiarioSemana / openModalDiarioClasif / openModalDiarioVel |
| Control de acceso Google | auth.js |
| Portada | index.html |
