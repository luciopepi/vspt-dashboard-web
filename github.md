repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-28T21:30:00Z
### Updated in this project
- **Calidad · destino y pedido de cada desvío** (diseño hecho en Design): filtros **Destino** y **Pedido** (texto con sugerencias), sección colapsable **Desvíos por destino del pedido** con mapamundi (una burbuja por país, tamaño = desvíos), ranking y zoom; tocar un país o una fila filtra todo el tablero (un destino por vez; tocar el mismo lo quita). Columnas Pedido y Destino en la tabla de detalle y en la ventana de detalle de los gráficos. "Inteligencia Automática" pasa a colapsable. Requiere el `01_API.gs` con `agregarPlanCalidad_` (repo Dashboard, `API_VERSION` 2026-09-28d).
- **Calidad · datos**: el destino es `destino_pais` (nombre unificado: EE.UU. → Estados Unidos, COTO → Argentina); el texto del plan (`Destino`) queda en el tooltip de la celda y en el buscador. Burbujas con `destino_lat`/`destino_lon` de la API. Caché `vspt_cal_cache_v4`.
- **Calidad · asistente**: entiende filtros por destino ("filtrá Brasil") y por N° de pedido ("pedido 110001713"); el análisis por pregunta incluye desvíos por destino.
- Mapas base `assets/mapa-mundo-claro.svg` y `assets/mapa-mundo-oscuro.svg` (Natural Earth 110m, proyección Natural Earth 1, 1000 × 438, sin Antártida).


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
| Calidad · filtros Destino y Pedido | Dashboard_calidad.html · populateFilters / applyFilters (BASE_ROWS, FILTERED_ROWS) / destinoDe / pedidoDe |
| Calidad · mapa de destinos (burbujas, ranking, zoom) | Dashboard_calidad.html · renderMapa / mapaElegir / mapaZoom / mapaColapsar / posDe / proyectar · assets/mapa-mundo-*.svg |
| Calidad · tabla y detalle con Pedido y Destino | Dashboard_calidad.html · renderTable / openDrill |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / leerPestanaParte_ / normalizarFilas_ / agregarPlanCalidad_ (pedido y destino, DESTINOS_GEO) |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantIndicadores_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
