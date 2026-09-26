repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-26T21:00:00Z
### Updated in this project
- **Mantenimiento · Planta en el celular**: la vista Planta del teléfono es un plano 2D liviano (canvas, sin WebGL) con el color de cada equipo, cintas, nombres, selección, pellizco y doble toque, y "Ubicar equipos" arrastrando. El 3D en el celular va más liviano. Si el 3D no arranca o se corta, queda el plano 2D con un cartel y "Reintentar 3D".
- **Mantenimiento · Pantalla completa** de la planta (botón en la esquina del cuadro). Dashboard_v15: el iframe de Mantenimiento tiene `allow="fullscreen"` y, si el navegador no la permite (iPhone), agranda el iframe a toda la ventana cuando la página se lo pide (mensaje `vspt-mant-completa`, solo desde ese iframe).
- **Mantenimiento · Ayuda (recorrido guiado)**: botón **?** arriba a la derecha; pregunta el rol (Mantenimiento · editor, Lubricador o Solo consulta) y recorre la página paso a paso con el resto difuminado.
- **Mantenimiento · Planta 3D, diseño v4** (hecho en Design): modelos relevados de fotos, acero inoxidable, producto Colon Selecto Tinto, baliza de torre y botón **En marcha**.


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
| Mantenimiento · Planta 3D, línea en marcha y baliza | Dashboard_mantenimiento.html · p3Flujo / p3MarchaCuadro / p3AnimMaquina / p3AutoCuadro / p3Baliza / p3Encender |
| Mantenimiento · Planta, plano 2D (celular y respaldo del 3D) | Dashboard_mantenimiento.html · p3Motor / p3Aviso / p2Montar / p2Aplicar / p2Dibujar / p2Punteros / p2Tocar / p2Encuadre |
| Mantenimiento · Planta, pantalla completa | Dashboard_mantenimiento.html · p3Completa / p3CompletaCss · Dashboard_v15.html (iframeMantenimiento allow=fullscreen, mensaje vspt-mant-completa) |
| Mantenimiento · Ayuda (botón ?, recorrido guiado) | Dashboard_mantenimiento.html · ayudaAbrir / ayudaRoles / ayudaPasos / ayudaPasosCarga / ayudaIr / ayudaCuadro / ayudaHueco / ayudaUbicar |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantIndicadores_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
