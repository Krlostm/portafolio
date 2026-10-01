export const siteConfig = {
  name: "Carlos Toa",
  title: "Carlos Toa — Diseño, producción audiovisual y desarrollo",
  description:
    "Diseño gráfico, animación, fotografía, producción audiovisual y productos digitales. Una selección de proyectos de Carlos Toa.",
  email: "carloseditort@gmail.com",
  phone: "0995416051",
  whatsapp: "593995416051",
  github: "",
  heroBio:
    "Diseño ideas, creo contenido y construyo experiencias visuales y digitales.",
  bio: "Trabajo entre diseño, producción audiovisual y desarrollo para convertir ideas en experiencias visuales y digitales. El diseño es mi punto de partida: una forma de dar intención, claridad y carácter a lo que una marca quiere decir.",
  bioIsDraft: true,
  tools: [
    "Photoshop",
    "Illustrator",
    "Canva",
    "After Effects",
    "Figma",
    "Premiere Pro",
    "Lightroom",
    "CapCut",
  ],
  webStack: [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "Python",
    "Node.js",
    "React",
    "Astro",
    "Tailwind CSS",
    "SQL",
    "Git",
  ],
  learningNote:
    "Sigo aprendiendo y poniendo en práctica nuevas herramientas de programación.",
};
export function url(path = "") {
  return (
    import.meta.env.BASE_URL.replace(/\/?$/, "/") + path.replace(/^\/+/, "")
  );
}
export const contactLinks = {
  email: "mailto:" + siteConfig.email,
  whatsapp: "https://wa.me/" + siteConfig.whatsapp,
};
export const brands = [
  { name: "Top Media", image: "logo-top" },
  { name: "Opermundo", image: "logo-opermundo" },
  { name: "Theraudio", image: "logo-thera" },
  { name: "Artex", image: "logo-artex" },
  { name: "Astral", image: "logo-astral" },
  { name: "Incógnito", image: "logo-incognito" },
  { name: "Operecuador", image: "logo-operecuador" },
  { name: "Ferretería Reina del Cisne", image: "logo-ferreteria" },
];
