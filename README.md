# Carlos Toa — Portafolio

Astro, TypeScript, GSAP/ScrollTrigger y CSS. Toda la implementación y los derivados están en `site`; los 169 archivos originales se conservan intactos.

## Revisión final por escenas

La portada contiene 29 escenas:
Inicio → Kike (2) → Opermundo (4) → Top Media (3) → Theraudio (2) → Ferretería (6) → Producto / Publicidad → Animación y edición → Afiches para creadores → Producciones → Fotografía → Desarrollo (2) → Más trabajos → Marcas → Sobre mí → Contacto.

En escritorio con puntero preciso, ancho de al menos 1024 px y alto de al menos 600 px, cada gesto corto de rueda avanza una vista. La inercia del trackpad no encadena varias escenas. El movimiento dura 520 ms; los saltos largos de capítulos aterrizan directamente para evitar cargar todos los videos intermedios. Page Up / Page Down, Home / End y los controles inferiores permiten navegar; el modo **Desplazamiento libre** devuelve la rueda al comportamiento nativo. El scrollbar permanece disponible. Galerías horizontales, zoom, campos editables y el reproductor modal conservan su interacción propia.

Cada escena de escritorio usa una cuadrícula de tres filas: encabezado, contenido flexible y pie. Reserva espacio para el header y la navegación inferior. Los medios se ajustan al espacio restante con `object-fit: contain`. Las tarjetas inclinadas tienen margen reservado para sus rotaciones. Los títulos y textos permanecen separados de las imágenes.

En móvil, tablet y ventanas con menos de 600 px de alto se usa scroll natural, alturas automáticas, imágenes completas y composiciones más simples. Movimiento reducido conserva la navegación por escenas con saltos instantáneos y desactiva autoplay/animaciones.

Kike tiene dos vistas completas, sin pin de GSAP, sticky de 200svh ni timeline que esconda las piezas: presentación con flyer y comparación DISEÑO → ANIMACIÓN con los dos medios visibles desde el estado inicial. El video mantiene 9:16, se carga cuando está visible, se reproduce muted/playsinline y se pausa al salir.

Opermundo abre con Eje Cafetero estudiantil 2027, México/Copa del Mundo y Eje Cafetero con LATAM. Tiene una colección estudiantil, otra de destinos y una escena propia de impresos y maquetas que aparece al desplazarse, sin pestañas. La portada inicial muestra Panamá Black Friday. Top Media añade una segunda secuencia completa de cinco láminas sobre identificación exterior. Theraudio conserva sus composiciones y colecciones. Ferretería sustituye el personaje por el soplahojas y muestra cinco carruseles completos: errores al pintar, herramientas para pintar, carretilla, lavandería y soldadora.

Animación y edición presenta siete videos en una fila automática que se pausa al pasar el cursor o enfocar un control. Cada vista previa se carga y reproduce solo al entrar en pantalla; el video completo se abre con sonido. Después aparece una sección de afiches para creadores. Producciones conserva Doble R y muestra el proceso idea → guion → rodaje → edición → entrega. Todos los videos completos se abren desde la principal mediante botones circulares blancos que dicen «Ver», incluido Kike. Fotografía reúne los nueve retratos JPG originales en una fila con movimiento y deslizador. Opermundo presenta siete piezas estudiantiles, quince campañas y nueve impresos/maquetas. Las capturas adicionales de MMA siguen retiradas. Inmobiliaria y la aplicación infantil mantienen sus interfaces interactivas.

Las filas MediaRail presentan varias imágenes juntas y se mueven suavemente cuando desbordan, a 28 px/s. Un deslizador inferior permite recorrer imágenes o videos rápidamente; se oculta si la fila cabe completa. El control sigue la posición de la fila al avanzar automáticamente, usar teclado o desplazarla manualmente. Reversan con una pausa en los extremos y permiten pausa explícita, teclado y desplazamiento manual. Pausan al enfocar, pasar el cursor, salir de pantalla u ocultar la pestaña.

Los logos comienzan en monocromo y recuperan sus colores originales al hover y al foco por teclado. El marquee se pausa mientras se interactúa. **Artex, Astral y Operecuador permanecen blancos, por indicación del usuario**, ya que las versiones aportadas son blancas. Los logos identifican marcas con las que se ha trabajado; no se afirma su autoría.

Sobre mí incorpora el retrato real aportado por Carlos, en la sección de la página principal. Reúne Photoshop, Illustrator, Canva, After Effects, Figma, Premiere Pro, Lightroom y CapCut; HTML, CSS, JavaScript, TypeScript, Python y Node.js, junto con React, Astro, Tailwind CSS, SQL y Git, aparecen como lenguajes y tecnologías, con una nota de aprendizaje continuo. Las interfaces, textos y metadatos están en español; las marcas y los nombres de programas conservan sus nombres propios. Instagram fue retirado de contactos, configuración y datos estructurados. La foto circular sustituye al monograma CT en la cabecera y el pie; la portada ya no incluye asterisco y el contacto recupera el morado suave (#bea2e8), con el titular a la izquierda y tarjetas de correo en morado oscuro y WhatsApp en lila claro a la derecha. Incluyen iconos y flechas circulares; en móvil se apilan.

TRABAJOS / SOBRE MÍ / CONTACTO y SIGUIENTE apuntan a los anchors reales del index. El portafolio tiene una sola página de contenido. Las rutas `/work/`, `/about/` y `/contact/` fueron retiradas; se conserva únicamente la página técnica de error 404. Los enlaces del menú y la navegación siguen siendo internos. Los antiguos archivos están respaldados en `.qa/backups/before-single-page-20261001.zip`.

## Ejecutar

Node global 22.16.0 resulta insuficiente. Usa el runtime Node 24 disponible:

```powershell
cd C:\Users\User\Documents\portafolio_web\site
$env:PATH = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;" + $env:PATH
npm run dev
```

Vista local: http://127.0.0.1:4321/. Si Astro indica otro puerto, usa ese puerto. Recarga una pestaña antigua con Ctrl+F5. En otra computadora: Node 24 LTS, `npm ci` y `npm run dev`.

## Verificación

```powershell
npm run build
npm run test
python scripts/verify_site.py --originals --http http://127.0.0.1:4321
```

Build ejecuta Astro Check y genera la principal y la página técnica 404. Test ejecuta 33 pruebas DOM/controladores contra el HTML de producción: escenas, rueda e inercia, scroll libre, teclado, cambios de viewport, NEXT, pestañas, filas, autoplay de previews, salida/reentrada, pausas, modal con sonido, menú y fallo de GSAP. Incluye una comprobación de la cascada CSS para evitar que la primera escena de Kike herede el max-width de 410 px del wrapper antiguo. Las pruebas del controlador usan **geometría simulada**, no medidas de layout real.

El verificador comprueba referencias locales, anchors, imágenes responsive, metadatos, IDs, rutas HTTP y fast start de MP4. `--originals` compara hash, tamaño y fecha de los 169 originales.

**La revisión visual en navegador sigue pendiente.** La herramienta rechazó la vista local por una preferencia guardada. Las herramientas disponibles no pueden modificar esa lista. El usuario no encontró la entrada en Configuración → Navegador y no se ha recibido un cambio confirmado en ese permiso. No se intentó otro navegador ni automatización alternativa para eludir la denegación. No se han probado visualmente 1920×1080, 1440×900 ni 390×844. Los tests DOM, HTTP y la revisión de CSS no sustituyen esa comprobación.

Los archivos `.qa/check-kike-static.mjs` y `.qa/kike-static-layout.json` corresponden a la versión sticky anterior; sus cálculos no describen esta revisión por escenas.

## Editar

- `src/data/site.ts`: nombre, biografía, contactos, herramientas, stack web y marcas.
- `src/data/chapters.ts`: orden, anchors, nombres y colores de NEXT.
- `src/components/sections/Hero.astro`: portada.
- `src/components/story/`: contenido y composiciones de cada capítulo.
- `src/components/story/Scene.astro`: estructura común de las escenas.
- `src/components/story/SceneSwitch.astro`: colecciones y videos dentro de una escena.
- `src/styles/scenes.css`: encuadre, responsive, logos y controles de escenas.
- `src/styles/story.css`: colores y estilos editoriales compartidos.
- `src/scripts/scene-controls.ts`: navegación por gesto, modo libre, teclado y pestañas.
- `src/scripts/story-controls.ts`: NEXT, explorador inmobiliario y pausa del marquee.
- `src/scripts/gallery-controls.ts`: filas horizontales automáticas.
- `src/components/media/VideoRail.astro`: fila horizontal de videos.
- `src/components/media/RailControls.astro`: deslizador y pausa compartidos por todas las filas.
- `src/components/media/Avatar.astro`: foto circular de navegación.
- `src/scripts/media-controls.ts`: previews y reproductor con sonido.
- `src/scripts/animations.ts`: entradas pequeñas, parallax y cursor.
- `src/components/media/VideoButton.astro`: botón circular compartido para abrir los videos con sonido.
- `src/data/projects.ts`: datos de interfaces y medios. Las páginas de casos están retiradas.

## Medios

111 fuentes seleccionadas: 100 imágenes y once videos. 121 activos de imagen contando posters/capturas; 369 derivados en `public/media`. Inventario: `MEDIA_SOURCES.md` y `src/data/media-report.json`.

- WebP responsive de 480, 960 y 1600 px sin ampliar originales; logos con transparencia.
- Once previews H.264 sin audio y versiones completas con fast start y AAC cuando el original tiene audio.
- Lazy loading fuera del hero; videos sin src inicial; los completos se cargan al abrir el modal.
- GSAP se carga después de los controles, que funcionan de forma independiente.
- `scripts/prepare_media.py` requiere Pillow, OpenCV y FFmpeg en `.tools/ffmpeg/package/ffmpeg.exe`; no hace falta para compilar. La foto aportada se conserva en `assets/source/carlos-toa.jpeg`; las nuevas imágenes y videos se registran en `additional-media.json` y `additional-videos.json`.
- `--images-only` y `--video-only` generan únicamente derivados nuevos o faltantes.

## Respaldo y publicación

El proyecto no era un repositorio Git. Antes de esta revisión se guardó código, README y pruebas en `.qa/backups/before-final-scenes-20261001.zip`; se conservan los respaldos anteriores. Esta ampliación también tiene respaldo en `.qa/backups/before-top-slider-20261001.zip`.

No se ha publicado el sitio. `SITE_URL` y `BASE_PATH` permiten GitHub Pages. El workflow `.github/workflows/pages.yml` es manual y no publica al hacer push. Los links y medios respetan el prefijo del repositorio.

```powershell
$env:SITE_URL = "https://TU-USUARIO.github.io"
$env:BASE_PATH = "/TU-REPOSITORIO/"
npm run build
```

Elimina esas variables antes de volver a dev/build local. Siguen pendientes la URL pública, GitHub y subtítulos/transcripciones revisados.
