export const chapters = [
  { id: "work", name: "Kike", color: "#b6d952" },
  { id: "opermundo", name: "Opermundo", color: "#3989ff" },
  { id: "top-media", name: "Top Media", color: "#f4d51c" },
  { id: "theraudio", name: "Theraudio", color: "#8fd5ed" },
  { id: "ferreteria", name: "Ferretería", color: "#ff8949" },
  { id: "product", name: "Producto / Publicidad", color: "#ef5448" },
  { id: "motion", name: "Animación y edición", color: "#c7a8fb" },
  { id: "influencers", name: "Afiches para creadores", color: "#b6d952" },
  { id: "producciones", name: "Producciones", color: "#d5ccc1" },
  { id: "fotografia", name: "Fotografía", color: "#d4d0c9" },
  { id: "development", name: "Desarrollo", color: "#bba5df" },
  { id: "playground", name: "Más trabajos", color: "#a5b9ac" },
  { id: "clients", name: "Marcas", color: "#dfded8" },
  { id: "about", name: "Sobre mí", color: "#cebfdf" },
  { id: "contact", name: "Contacto", color: "#bea2e8" },
];
export function chapterFor(id: string) {
  const index = chapters.findIndex((chapter) => chapter.id === id);
  if (index < 0) throw new Error("Unknown chapter: " + id);
  return {
    ...chapters[index]!,
    number: String(index + 1).padStart(2, "0"),
    next: chapters[index + 1],
  };
}
export const screenId = (slug: string) =>
  ({ kike: "work", "diseno-comercial": "ferreteria", mma: "producciones" })[
    slug
  ] ?? slug;
