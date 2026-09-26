repo: luciopepi/vspt-dashboard-web
branch: main
publica: Netlify (deploy desde main)

## Last sync
date: 2026-09-26T18:00:00Z
### Updated in this project
- **Mantenimiento · Ayuda (recorrido guiado)**: botón **?** arriba a la derecha del encabezado (también la tecla ?). Primero pregunta el rol (Mantenimiento · editor, Lubricador o Solo consulta) y después recorre la página paso a paso: abre cada pestaña, resalta la parte que explica y difumina el resto. Anterior / Siguiente, flechas del teclado y Esc; en el celular la tarjeta va arriba o abajo de lo resaltado. En el formulario del QR recorre la planilla sin preguntar el rol. No arranca si hay una planilla de "Cargar lo realizado" a medio pasar.
- **Mantenimiento · Planta 3D, diseño v4** (hecho en Design): modelos relevados de fotos, acero inoxidable, producto Colon Selecto Tinto, baliza de torre roja/ámbar/verde y botón **En marcha** (botellas, cajas, palets y autoelevadores en movimiento; se recuerda por navegador).


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
| Mantenimiento · Ayuda (botón ?, recorrido guiado) | Dashboard_mantenimiento.html · ayudaAbrir / ayudaRoles / ayudaPasos / ayudaPasosCarga / ayudaIr / ayudaCuadro / ayudaHueco / ayudaUbicar |
| Mantenimiento · pestaña en v15 | Dashboard_v15.html · changeTab (EMBED.mantenimiento) / broadcastTheme |
| API (Apps Script, repo luciopepi/Dashboard) | 01_API.gs · doGet / leerPestanaFmt_ / leerPestanaCompacta_ / normalizarFilas_ |
| API de mantenimiento | 07_MANTENIMIENTO.gs · mantEstadoApi_ / mantIndicadores_ / mantHtmlApi_ / mantCargaApi_ / mantPost_ / mantGenerarOT_ / mantAsignarSap_ / mantQR_ |
| Control de acceso Google | auth.js |
| Portada | index.html |
