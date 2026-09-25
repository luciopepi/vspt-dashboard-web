repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-25T00:15:00Z
### Updated in this project
- **Pestaña Mantenimiento** (nueva): plan de lubricación por **horas de uso** con los códigos de SAP. `Dashboard_mantenimiento.html`, embebida en v15 como iframe; se carga al abrir la pestaña (no se precarga).
- Vistas: **OT semanal** (resumen por línea, "Imprimir planillas", carga de lo realizado con fecha real, motivo, anomalía y lote por lubricante), **Alertas** (vencidos y próximos, registro fuera de la OT), **Calendario** (vencimientos proyectados 8 semanas con PLAN o ritmo), **Equipos** (árbol SAP y edición del maestro), **Avisos SAP** (anomalías pendientes, se cierran con el N° de aviso) y **Ajustes** (solo editores).
- Edición del maestro solo para correos de `MANT_EDITORES` (lo decide la API). Los cambios se acumulan en una barra "cambios sin guardar" y se envían juntos: entran todos o ninguno.
- v15: botón y panel `mantenimiento`, entrada en `EMBED`, `render()` la saltea, `broadcastTheme()` le pasa el tema.
- Requiere la API con `07_MANTENIMIENTO.gs` + `08_MANT_SEED.gs` y el ETL con `USO_LINEA_DIARIO` (repo luciopepi/Dashboard).


## Screen map
| Pantalla | Archivo |
|---|---|
| Dashboard completo (todas las pestañas) | Dashboard_v15.html |
| Fallas de equipos: Horas vs % T. Efectivo | Dashboard_v15.html · fallaModeHTML / setFallaMode / drawFallaSemana / serieDomain |
| Reporte Diario (pestaña) | Dashboard_v15.html · renderDiario / drawDiarioDonut / drawDiarioPareto / drawDiarioSemana / openModalDiarioClasif / openModalDiarioVel |
| Carga de datos en dos fases · formato compacto | Dashboard_v15.html · init / rehidratarOpinona / marcarDetalleCaido |
| Mantenimiento (pestaña embebida) | Dashboard_mantenimiento.html · cargar / renderOT / formCarga / renderAlertas / renderCal / renderEquipos / renderAvisos / renderAjustes |
| Mantenimiento · edición del maestro | Dashboard_mantenimiento.html · campo / filaEdicion / marcarCambio / barraCambios / guardarPend |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantHtmlApi_ / mantPost_ / mantGenerarOT_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
