repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-25T07:00:00Z
### Updated in this project
- **Mantenimiento · Planta 3D** (pestaña nueva): la planta en 3D sobre el plano del DWG con un modelo simple por equipo y **semáforo** (halo en el piso y baliza) según el peor punto de cada equipo. Capas: Semáforo, OT de la semana (tareas por cargar / cargadas) y Horas de uso de 28 días. Filtro por línea con encuadre automático, vista 3D o Planta, nombres, panel con los puntos del equipo elegido y lista de equipos vencidos.
- **Ubicar equipos** (solo editores): arrastrar y girar equipos sobre el plano y guardar `pos_x`/`pos_y`/`rot` en `MANT_EQUIPOS` con `mant_editar` (queda en el historial). Los equipos sin posición esperan en la zona "Equipos sin ubicar".
- three.js 0.160 se importa desde jsdelivr (import map) recién al abrir la pestaña; el plano va en `assets/plano_fraccionamiento.json` (504 KB, 94 KB comprimido), que también se carga recién ahí.
- Arreglo: `peor()` siempre devolvía "sin puntos" (comparaba con un rango indefinido); ahora el árbol de Equipos muestra el color del peor estado.


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
| Mantenimiento · Planta 3D (semáforo, capas, panel) | Dashboard_mantenimiento.html · renderPlanta / p3Iniciar / p3Crear / p3Sincronizar / p3Aplicar / p3Panel / p3Encuadre |
| Mantenimiento · Planta 3D, modelos y ubicación | Dashboard_mantenimiento.html · P3_MODELOS / p3Forma / p3Maquina / p3Punteros / p3Guardar · assets/plano_fraccionamiento.json |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
