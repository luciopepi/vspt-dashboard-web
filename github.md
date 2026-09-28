repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-28T15:30:00Z
### Updated in this project
- **Carga del detalle (OPINONA) por partes**: v15 pide OPINONA en 4 partes en paralelo (`?tabla=opinona_parte`, requiere el `01_API.gs` nuevo) y las une controlando columnas y total; con una API sin esa ruta vuelve al pedido único. Motivo: el detalle mostraba "No se pudo cargar el detalle · Failed to fetch".
- **Programas**: embebido en v15 usa la OPINONA que ya bajó el tablero (antes la volvía a pedir entera, en el formato más pesado); suelto, la pide por partes.


## Screen map
| Pantalla | Archivo |
|---|---|
| Dashboard completo (todas las pestañas) | Dashboard_v15.html |
| Fallas de equipos: Horas vs % T. Efectivo | Dashboard_v15.html · fallaModeHTML / setFallaMode / drawFallaSemana / serieDomain |
| Reporte Diario (pestaña) | Dashboard_v15.html · renderDiario / drawDiarioDonut / drawDiarioPareto / drawDiarioSemana / openModalDiarioClasif / openModalDiarioVel |
| Carga de datos en dos fases · compacto y por partes | Dashboard_v15.html · init / pedirOpinona / rehidratarOpinona / marcarDetalleCaido |
| Programas · OPINONA (la del tablero o por partes) | Dashboard_programas.html · fetchFresh / opinonaDelTablero / pedirOpinona / rehidratarOpinona |
| Mantenimiento (pestaña embebida) | Dashboard_mantenimiento.html · cargar / renderOT / formCarga / renderAlertas / renderCal / renderEquipos / renderAvisos / renderAjustes |
| Mantenimiento · edición del maestro | Dashboard_mantenimiento.html · campo / filaEdicion / marcarCambio / barraCambios / guardarPend |
| Mantenimiento · carga desde el celular (QR) | Dashboard_mantenimiento.html · CARGA / abrirCarga / renderCarga / bindCarga / guardarCg / leerBorrador |
| Mantenimiento · equipo local → SAP, partes, por validar | Dashboard_mantenimiento.html · detalleEquipo (#eqSapOk) / edicionParte / nVal / eqVal |
| Mantenimiento · Indicadores (cumplimiento y OTIF) | Dashboard_mantenimiento.html · renderIndicadores / indSerie / indColumnas / indLineas / indTip / indPorLinea / indDibujar |
| Mantenimiento · Planta 3D (semáforo, capas, panel) | Dashboard_mantenimiento.html · renderPlanta / p3Iniciar / p3Crear / p3Sincronizar / p3Aplicar / p3Panel / p3Encuadre |
| Mantenimiento · Planta 3D, modelos y ubicación | Dashboard_mantenimiento.html · P3_MODELOS / p3Forma / p3Maquina / p3Punteros / p3Guardar · assets/plano_fraccionamiento.json |
| Mantenimiento · Planta 3D, línea en marcha y baliza | Dashboard_mantenimiento.html · p3Flujo / p3MarchaCuadro / p3AnimMaquina / p3AutoCuadro / p3Baliza / p3Encender |
| Mantenimiento · Planta, plano 2D (celular y respaldo del 3D) | Dashboard_mantenimiento.html · p3Motor / p3Aviso / p2Montar / p2Aplicar / p2Dibujar / p2Punteros / p2Tocar / p2Encuadre |
| Mantenimiento · Planta, pantalla completa | Dashboard_mantenimiento.html · p3Completa / p3CompletaCss · Dashboard_v15.html (iframeMantenimiento allow=fullscreen, mensaje vspt-mant-completa) |
| Mantenimiento · Ayuda (botón ?, recorrido guiado) | Dashboard_mantenimiento.html · ayudaAbrir / ayudaRoles / ayudaPasos / ayudaPasosCarga / ayudaIr / ayudaCuadro / ayudaHueco / ayudaUbicar |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / leerPestanaParte_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantIndicadores_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
