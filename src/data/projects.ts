export type GalleryBlock = {
  type: "gallery";
  title?: string;
  images: string[];
  layout: "wide" | "pair" | "editorial" | "portraits";
  caption?: string;
};
export type CarouselBlock = {
  type: "carousel";
  title: string;
  images: string[];
  caption?: string;
};
export type VideoBlock = {
  type: "videos";
  title: string;
  videos: { id: string; title: string; description: string }[];
};
export type Feature = { label: string; image: string; description: string };
export type ProductBlock = {
  type: "product";
  title: string;
  features: Feature[];
  video: string;
  caption: string;
};
export type ProjectBlock =
  GalleryBlock | CarouselBlock | VideoBlock | ProductBlock;
export interface Project {
  slug: string;
  casePage?: boolean;
  name: string;
  client?: string;
  category: "Design" | "Audiovisual" | "Development";
  disciplines: string[];
  summary: string;
  headline: string;
  cover: string;
  theme: string;
  blocks: ProjectBlock[];
}
export const projects: Project[] = [
  {
    slug: "kike",
    name: "Kike — Cuarto de milla",
    client: "Kike",
    category: "Design",
    disciplines: ["Diseño gráfico", "Afiches", "Diseño animado"],
    summary:
      "Una misma composición, dos maneras de captar la atención. El afiche de cuarto de milla es el punto de partida de una pieza animada, acompañado por una selección de diseños para otras activaciones.",
    headline: "Del impacto visual al movimiento.",
    cover: "kike-static",
    theme: "kike",
    blocks: [
      {
        type: "videos",
        title: "El diseño cobra vida.",
        videos: [
          {
            id: "kike",
            title: "Cuarto de milla / Animación",
            description:
              "Versión animada de la pieza gráfica. Reproducción completa con sonido bajo tu control.",
          },
        ],
      },
      {
        type: "gallery",
        title: "Una identidad que cambia de escenario.",
        images: ["kike-static", "kike-quito", "kike-playa"],
        layout: "editorial",
        caption:
          "Cuarto de milla, fiestas de Quito y transmisión playera. Selección de afiches.",
      },
    ],
  },
  {
    slug: "top-media",
    name: "Top Media",
    client: "Top Media",
    category: "Design",
    disciplines: [
      "Diseño gráfico",
      "Redes sociales",
      "Carruseles",
      "Edición de video",
    ],
    summary:
      "Amarillo, negro y mensajes directos. Una selección de piezas comerciales, un carrusel completo y dos videos muestran cómo una identidad reconocible se adapta a distintos contenidos.",
    headline: "Una marca que se hace ver.",
    cover: "top-01",
    theme: "top",
    blocks: [
      {
        type: "carousel",
        title: "Una idea, cuatro pasos.",
        images: ["top-01", "top-02", "top-03", "top-04"],
        caption:
          "Carrusel completo. Se conserva el orden de las cuatro láminas originales.",
      },
      {
        type: "carousel",
        title: "Que tu negocio se haga ver.",
        images: [
          "top-exterior-1",
          "top-exterior-2",
          "top-exterior-3",
          "top-exterior-4",
          "top-exterior-5",
        ],
        caption:
          "Una segunda secuencia completa: identificación exterior en cinco piezas.",
      },
      {
        type: "gallery",
        title: "El mismo lenguaje. Distintos mensajes.",
        images: ["top-store", "top-burger", "top-sign"],
        layout: "editorial",
      },
      {
        type: "videos",
        title: "De la publicación al video.",
        videos: [
          {
            id: "top-event",
            title: "Top Media / Video comercial",
            description: "Edición de video para contenido de marca.",
          },
          {
            id: "top-tebis",
            title: "Top Media / Tebis",
            description:
              "Un segundo ejemplo de ritmo, montaje y contenido comercial.",
          },
        ],
      },
    ],
  },
  {
    slug: "opermundo",
    name: "Opermundo",
    client: "Opermundo",
    category: "Design",
    disciplines: [
      "Diseño gráfico",
      "Campañas turísticas",
      "Diseño editorial",
      "Impresos",
    ],
    summary:
      "Viajes estudiantiles, campañas turísticas e identidad impresa. Eje Cafetero, México y otros destinos conviven con folletos, carpetas y trípticos.",
    headline: "Ideas que viajan entre formatos.",
    cover: "oper-brochure",
    theme: "oper",
    blocks: [
      {
        type: "gallery",
        title: "Viajes que empiezan en una imagen.",
        images: [
          "oper-eje-student",
          "oper-mexico",
          "oper-eje-latam",
          "oper-galapagos-student",
          "oper-olon-student",
        ],
        layout: "editorial",
      },
      {
        type: "gallery",
        title: "Del destino al papel.",
        images: ["oper-brochure"],
        layout: "wide",
        caption: "Folleto de Galápagos. Presentación mediante maqueta.",
      },
      {
        type: "gallery",
        images: [
          "oper-folder",
          "oper-trifold",
          "oper-rollup",
          "oper-eje-student-back",
        ],
        layout: "pair",
        caption: "Carpeta corporativa y tríptico turístico de Ecuador.",
      },
      {
        type: "gallery",
        title: "Cada destino tiene su propia imagen.",
        images: [
          "oper-galapagos",
          "oper-eje",
          "oper-turquia",
          "oper-anniversary",
        ],
        layout: "editorial",
      },
    ],
  },
  {
    slug: "theraudio",
    name: "Theraudio",
    client: "Theraudio",
    category: "Design",
    disciplines: [
      "Diseño gráfico",
      "Contenido de marca",
      "Redes sociales",
      "Edición de video",
    ],
    summary:
      "Una selección de contenido visual para redes: publicaciones, portadas de carrusel y videos. El foco de este caso está en la composición, la continuidad de marca y la adaptación al formato.",
    headline: "Contenido con una voz visual propia.",
    cover: "thera-gateo",
    theme: "thera",
    blocks: [
      {
        type: "gallery",
        title: "Un sistema para comunicar.",
        images: ["thera-gateo", "thera-r", "thera-juguete", "thera-brand"],
        layout: "editorial",
        caption:
          "Publicaciones estáticas y portadas seleccionadas para redes sociales.",
      },
      {
        type: "videos",
        title: "Contenido en movimiento.",
        videos: [
          {
            id: "thera-language",
            title: "Theraudio / Contenido de marca",
            description: "Video editado para comunicación en redes sociales.",
          },
          {
            id: "thera-psych",
            title: "Theraudio / Contenido editorial",
            description:
              "Segundo ejemplo de edición y presentación de contenido.",
          },
        ],
      },
    ],
  },
  {
    slug: "diseno-comercial",
    name: "Diseño comercial",
    client: "Ferretería Reina del Cisne / Edu Nutrition",
    category: "Design",
    disciplines: ["Diseño gráfico", "Carruseles", "Publicidad de producto"],
    summary:
      "Contenido útil y presencia comercial. Carruseles sobre pintura, carretillas, lavandería y soldadura, publicidad para Ferretería Reina del Cisne y una composición para Edu Nutrition.",
    headline: "Información útil. Presencia visual.",
    cover: "ferre-01",
    theme: "commercial",
    blocks: [
      {
        type: "carousel",
        title: "Errores al pintar.",
        images: ["ferre-01", "ferre-02", "ferre-03", "ferre-04", "ferre-05"],
        caption:
          "Carrusel completo de cinco láminas para Ferretería Reina del Cisne.",
      },
      {
        type: "carousel",
        title: "Lo que necesitas para pintar.",
        images: ["ferre-paint-kit-1", "ferre-paint-kit-2", "ferre-paint-kit-3"],
        caption: "Secuencia original para Ferretería Reina del Cisne.",
      },
      {
        type: "carousel",
        title: "Carretilla.",
        images: ["ferre-cart-1", "ferre-cart-2", "ferre-cart-3"],
        caption: "Secuencia original para Ferretería Reina del Cisne.",
      },
      {
        type: "carousel",
        title: "Soluciones para la lavandería.",
        images: ["ferre-laundry-1", "ferre-laundry-2", "ferre-laundry-3"],
        caption: "Secuencia original para Ferretería Reina del Cisne.",
      },
      {
        type: "carousel",
        title: "Soldadora.",
        images: ["ferre-weld-1", "ferre-weld-2"],
        caption: "Secuencia original para Ferretería Reina del Cisne.",
      },
      {
        type: "gallery",
        title: "Publicidad de producto.",
        images: ["ferre-cement", "ferre-wheelbarrow", "ferre-leafblower"],
        layout: "editorial",
      },
      {
        type: "gallery",
        title: "El producto al centro.",
        images: ["product-creatina"],
        layout: "wide",
        caption: "Composición publicitaria para Edu Nutrition.",
      },
    ],
  },
  {
    slug: "mma",
    casePage: false,
    name: "MMA — Producción audiovisual",
    category: "Audiovisual",
    disciplines: ["Producción audiovisual", "Edición de video"],
    summary:
      "Una pieza audiovisual alrededor del entrenamiento de MMA. Entrevista, detalles y acción se alternan en una secuencia que cambia de escala y ritmo.",
    headline: "La energía también se cuenta.",
    cover: "mma-poster",
    theme: "mma",
    blocks: [
      {
        type: "videos",
        title: "Ver la pieza completa.",
        videos: [
          {
            id: "mma",
            title: "Producción MMA",
            description:
              "Video completo. Activa el sonido desde los controles del reproductor.",
          },
        ],
      },
      {
        type: "gallery",
        title: "Dentro de la secuencia.",
        images: ["mma-interview", "mma-detail", "mma-action"],
        layout: "editorial",
        caption: "Fotogramas extraídos del video original.",
      },
    ],
  },
  {
    slug: "fotografia",
    name: "Retratos — Fotografía",
    category: "Audiovisual",
    disciplines: ["Fotografía", "Retrato"],
    summary:
      "Luz, gesto y presencia. Una selección de cinco retratos explora distintas distancias, contrastes y maneras de ocupar el encuadre.",
    headline: "Mirar un poco más cerca.",
    cover: "photo-01",
    theme: "photo",
    blocks: [
      {
        type: "gallery",
        images: ["photo-01", "photo-02", "photo-03", "photo-04", "photo-05"],
        layout: "portraits",
        caption: "Una serie de retratos: luz, gesto y composición.",
      },
    ],
  },
  {
    slug: "inmobiliaria",
    name: "Web inmobiliaria",
    category: "Development",
    disciplines: ["Desarrollo web", "Interfaz", "Producto digital"],
    summary:
      "Una interfaz para explorar propiedades y consultar información. La grabación del proyecto muestra filtros de búsqueda, ficha de propiedad, ubicación/plano y calculadora.",
    headline: "De explorar a encontrar.",
    cover: "inmo-cover",
    theme: "digital",
    blocks: [
      {
        type: "product",
        title: "Una experiencia para decidir.",
        video: "inmobiliaria",
        caption:
          "Una selección de interfaces: búsqueda, propiedad, ubicación y cálculo.",
        features: [
          {
            label: "Filtros",
            image: "inmo-filters",
            description:
              "Controles para acotar la búsqueda y explorar el catálogo.",
          },
          {
            label: "Propiedad",
            image: "inmo-property",
            description: "Información de una propiedad reunida en una ficha.",
          },
          {
            label: "Ubicación",
            image: "inmo-location",
            description: "Consulta del plano y la ubicación desde la interfaz.",
          },
          {
            label: "Calculadora",
            image: "inmo-calculator",
            description:
              "Una herramienta de cálculo integrada en el recorrido.",
          },
        ],
      },
    ],
  },
  {
    slug: "aplicacion-infantil",
    name: "Aplicación infantil",
    category: "Development",
    disciplines: ["Programación", "Interfaz", "Producto digital"],
    summary:
      "Un producto digital que reúne tareas, rutinas, temporizador, juegos y un panel. Esta presentación se concentra en las funciones visibles en la grabación del proyecto.",
    headline: "Pequeñas acciones. Una experiencia completa.",
    cover: "app-cover",
    theme: "app",
    blocks: [
      {
        type: "product",
        title: "Una interfaz, varias maneras de interactuar.",
        video: "aplicacion",
        caption:
          "Rutinas, temporizador, juegos y panel en una misma experiencia.",
        features: [
          {
            label: "Rutinas",
            image: "app-routines",
            description:
              "Organización visual de actividades, tareas y rutinas.",
          },
          {
            label: "Tiempo",
            image: "app-timer",
            description: "Un temporizador integrado en la experiencia.",
          },
          {
            label: "Juegos",
            image: "app-games",
            description: "Actividades y juegos dentro de la aplicación.",
          },
          {
            label: "Panel",
            image: "app-panel",
            description:
              "Una vista de panel que reúne información de la aplicación.",
          },
        ],
      },
    ],
  },
];
export const caseProjects = projects.filter(
  (project) => project.casePage !== false,
);
export function projectBySlug(slug: string) {
  const p = projects.find((p) => p.slug === slug);
  if (!p) throw new Error("Unknown project: " + slug);
  return p;
}
export const projectHref = (p: Project) => "work/" + p.slug + "/";
