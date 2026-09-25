repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-25T02:00:00Z
### Updated in this project
- **Mantenimiento · carga desde el celular**: cada planilla impresa trae un QR que abre `Dashboard_mantenimiento.html?carga=OT-…-Lx`. La página muestra solo esa planilla en tarjetas (Hecho / No se hizo con botones grandes, motivo, observación, anomalía, otra fecha y lotes). Entra con la cuenta VSPT de siempre. Lo marcado queda como borrador en el teléfono y se guarda de a partes. En pantallas angostas, "Cargar" de la OT abre el mismo formulario.
- **Lubricador de la lista** (Ajustes → Lubricadores) en la carga de escritorio, en el celular y en el registro suelto de Alertas. La API rechaza registros sin lubricador cuando la lista existe.
- **Equipos**: filtro "Por validar" (puntos con la parte asignada por defecto) con contador por equipo; partes editables (nombre y código SAP); botón "Asignar código SAP" en equipos locales (ej. Zalkin L2) que cambia el número en todo el maestro e historial.
- Ajustes: campo "Página que abre el QR" (`url_carga`).
- Requiere la API con la versión nueva de `07_MANTENIMIENTO.gs` y la ruta `mant_carga` en `01_API.gs` (repo luciopepi/Dashboard).


## Screen map
| Pantalla | Archivo |
|---|---|
| Dashboard completo (todas las pestañas) | Dashboard_v15.html |
| Fallas de equipos: Horas vs % T. Efectivo | Dashboard_v15.html · fallaModeHTML / setFallaMode / drawFallaSemana / serieDomain |
| Reporte Diario (pestaña) | Dashboard_v15.html · renderDiario / drawDiarioDonut / drawDiarioPareto / drawDiarioSemana / openModalDiarioClasif / openModalDiarioVel |
| Carga de datos en dos fases · formato compacto | Dashboard_v15.html · init / rehidratarOpinona / marcarDetalleCaido |
| Mantenimiento (pestaña embebida) | Dashboard_mantenimiento.html · cargar / renderOT / formCarga / renderAlertas / renderCal / renderEquipos / renderAvisos / renderAjustes |
| Mantenimiento · edición del maestro | Dashboard_mantenimiento.html · campo / filaEdicion / marcarCambio / barraCambios / guardarPend |
| Mantenimiento · carga desde el celular (QR) | Dashboard_mantenimiento.html · CARGA / abrirCarga / renderCarga / bindCarga / guardarCg / leerBorrador |
| Mantenimiento · equipo local → SAP, partes, por validar | Dashboard_mantenimiento.html · detalleEquipo (#eqSapOk) / edicionParte / nVal / eqVal |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
