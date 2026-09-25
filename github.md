repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-25T18:00:00Z
### Updated in this project
- **Mantenimiento · Indicadores** (pestaña nueva): cumplimiento del plan de lubricación y **OTIF por equipo**, semana a semana. Filtros de línea y período (8/12/26 semanas). Tarjetas con el OTIF de la última semana cerrada (cifra principal, delta en pp y etiqueta de meta), el cumplimiento, el promedio ponderado del período y el avance de la semana en curso.
- Gráficos: columnas 100 % apiladas por resultado (en término · fuera de término · no se hizo · sin cargar/pendiente) con la meta punteada, y líneas de OTIF con a tiempo (On Time) y completas (In Full) de contexto. Tooltips con mouse, dedo o flechas del teclado, y vista de tabla en cada gráfico. Tabla por línea, motivos de no realización y "Cómo se calcula".
- Metas `meta_cumplimiento` y `meta_otif` (90 % por defecto) editables en Ajustes. Requiere la versión nueva de `07_MANTENIMIENTO.gs` en la API; con la versión anterior la pestaña avisa que falta publicarla.
- Arreglo: con la barra "cambios sin guardar" visible, el primer clic en "Guardar cambios" después de editar otro campo se perdía (la barra se rehacía al salir del campo). Ahora solo se actualiza el contador.


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
| Mantenimiento · Indicadores (cumplimiento y OTIF) | Dashboard_mantenimiento.html · renderIndicadores / indSerie / indColumnas / indLineas / indTip / indPorLinea / indDibujar |
| Mantenimiento · Planta 3D (semáforo, capas, panel) | Dashboard_mantenimiento.html · renderPlanta / p3Iniciar / p3Crear / p3Sincronizar / p3Aplicar / p3Panel / p3Encuadre |
| Mantenimiento · Planta 3D, modelos y ubicación | Dashboard_mantenimiento.html · P3_MODELOS / p3Forma / p3Maquina / p3Punteros / p3Guardar · assets/plano_fraccionamiento.json |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantIndicadores_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
