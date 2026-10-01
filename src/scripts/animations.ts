import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const heroLines = document.querySelectorAll("[data-hero-line]");
    if (heroLines.length)
      gsap.fromTo(
        heroLines,
        { y: 8 },
        { y: 0, duration: 0.75, stagger: 0.1, ease: "power3.out" },
      );
    document
      .querySelectorAll<HTMLElement>(
        "[data-type-reveal],.case-intro h1,[data-scene] .scene-heading h2",
      )
      .forEach((title) => {
        gsap.fromTo(
          title,
          { y: 6 },
          {
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: title, start: "top 92%", once: true },
          },
        );
      });
  });
  mm.add(
    "(min-width:1024px) and (prefers-reduced-motion:no-preference)",
    () => {
      document
        .querySelectorAll<HTMLElement>("[data-parallax]")
        .forEach((piece) => {
          // Only a small shift; the composition remains in its normal grid cell.
          const distance = Math.max(
            -8,
            Math.min(8, Number(piece.dataset.parallax || 0) * 0.1),
          );
          gsap.fromTo(
            piece,
            { y: -distance * 0.5 },
            {
              y: distance * 0.5,
              ease: "none",
              scrollTrigger: {
                trigger: piece,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            },
          );
        });
    },
  );
  mm.add(
    "(min-width:1024px) and (pointer:fine) and (prefers-reduced-motion:no-preference)",
    () => {
      const cleanup: Array<() => void> = [];
      document
        .querySelectorAll<HTMLElement>("[data-pointer-scene]")
        .forEach((scene) => {
          const layers = Array.from(
            scene.querySelectorAll<HTMLElement>("[data-pointer]"),
          );
          const move = (event: PointerEvent) => {
            const bounds = scene.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            layers.forEach((layer) =>
              gsap.to(layer, {
                x: x * 12 * Number(layer.dataset.pointer),
                y: y * 8 * Number(layer.dataset.pointer),
                duration: 0.6,
                overwrite: "auto",
              }),
            );
          };
          const reset = () =>
            layers.forEach((layer) =>
              gsap.to(layer, { x: 0, y: 0, duration: 0.6 }),
            );
          scene.addEventListener("pointermove", move);
          scene.addEventListener("pointerleave", reset);
          cleanup.push(() => {
            scene.removeEventListener("pointermove", move);
            scene.removeEventListener("pointerleave", reset);
          });
        });
      const cursor = document.querySelector<HTMLElement>(".cursor-label");
      const moveCursor = (event: PointerEvent) => {
        if (!cursor) return;
        const target = (event.target as Element)?.closest<HTMLElement>(
          "[data-cursor]",
        );
        cursor.textContent = target?.dataset.cursor || "";
        cursor.style.opacity = target ? "1" : "0";
        gsap.set(cursor, { x: event.clientX + 17, y: event.clientY + 17 });
      };
      const hideCursor = () => {
        if (cursor) cursor.style.opacity = "0";
      };
      document.addEventListener("pointermove", moveCursor);
      document.addEventListener("pointerleave", hideCursor);
      return () => {
        cleanup.forEach((dispose) => dispose());
        document.removeEventListener("pointermove", moveCursor);
        document.removeEventListener("pointerleave", hideCursor);
        hideCursor();
      };
    },
  );
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
