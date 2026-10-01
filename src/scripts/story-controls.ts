export function initChapterNavigation() {
  const navigation = document.querySelector<HTMLElement>(
    "[data-chapter-navigation]",
  );
  const next = navigation?.querySelector<HTMLAnchorElement>(
    "[data-chapter-next]",
  );
  const label = navigation?.querySelector<HTMLElement>("[data-next-label]");
  const current = navigation?.querySelector<HTMLElement>(
    "[data-current-chapter]",
  );
  const chapters = Array.from(
    document.querySelectorAll<HTMLElement>("[data-chapter]"),
  );
  if (!navigation || !next || !chapters.length) return;
  const prefix = (next.getAttribute("href") || "/").split("#")[0];
  let frame = 0;
  const update = () => {
    frame = 0;
    const line = window.innerHeight * 0.38;
    const active = chapters.find((chapter) => {
      const bounds = chapter.getBoundingClientRect();
      return bounds.top <= line && bounds.bottom > line;
    });
    navigation.hidden = !active?.dataset.nextId;
    if (!active?.dataset.nextId) return;
    next.href = prefix + "#" + active.dataset.nextId;
    next.style.setProperty(
      "--next-accent",
      active.dataset.nextColor || "#bfa1ed",
    );
    next.setAttribute(
      "aria-label",
      "Siguiente capítulo: " + active.dataset.nextName,
    );
    if (label) label.textContent = active.dataset.nextName || "";
    if (current)
      current.textContent =
        active.dataset.chapterNumber + " — " + active.dataset.chapterName;
    navigation.dataset.currentId = active.id;
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.fonts?.ready.then(schedule);
  update();
}

export function initStoryStrips() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  document
    .querySelectorAll<HTMLElement>("[data-story-strip]")
    .forEach((root) => {
      const viewport = root.querySelector<HTMLElement>(".strip-viewport");
      const slides = Array.from(
        root.querySelectorAll<HTMLElement>(".strip-piece"),
      );
      const journey = root.closest<HTMLElement>("[data-scroll-journey]");
      if (!viewport || !slides.length) return;
      let index = 0;
      const go = (requested: number) => {
        index = Math.max(0, Math.min(slides.length - 1, requested));
        const start = Number(journey?.dataset.scrollStart);
        const end = Number(journey?.dataset.scrollEnd);
        if (
          journey?.classList.contains("scroll-linked") &&
          Number.isFinite(start) &&
          Number.isFinite(end)
        ) {
          window.scrollTo({
            top:
              start + ((end - start) * index) / Math.max(1, slides.length - 1),
            behavior: reduced.matches ? "instant" : "smooth",
          });
        } else {
          viewport.scrollTo({
            left: slides[index]!.offsetLeft - slides[0]!.offsetLeft,
            behavior: reduced.matches ? "instant" : "smooth",
          });
        }
      };
      root
        .querySelector("[data-strip-prev]")
        ?.addEventListener("click", () => go(index - 1));
      root
        .querySelector("[data-strip-next]")
        ?.addEventListener("click", () => go(index + 1));
      viewport.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        go(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? slides.length - 1
              : index + (event.key === "ArrowRight" ? 1 : -1),
        );
      });
      viewport.addEventListener(
        "scroll",
        () => {
          if (journey?.classList.contains("scroll-linked")) return;
          const distance = slides[1]
            ? slides[1].offsetLeft - slides[0]!.offsetLeft
            : viewport.clientWidth;
          index = Math.min(
            slides.length - 1,
            Math.round(viewport.scrollLeft / Math.max(1, distance)),
          );
        },
        { passive: true },
      );
      root.addEventListener("portfolio:strip-progress", () => {
        index = Math.round(
          Number(root.dataset.progress || 0) * (slides.length - 1),
        );
      });
    });
}

export function initClientMarquee() {
  const track = document.querySelector<HTMLElement>(".clients-track");
  const button = document.querySelector<HTMLButtonElement>(
    "[data-brands-pause]",
  );
  if (!track || !button) return;
  button.addEventListener("click", () => {
    const paused = button.getAttribute("aria-pressed") !== "true";
    track.style.animationPlayState = paused ? "paused" : "";
    button.setAttribute("aria-pressed", String(paused));
    button.textContent = paused ? "Reanudar marcas ▶" : "Pausar marcas Ⅱ";
  });
}

export function initInterfaceStories() {
  document
    .querySelectorAll<HTMLElement>("[data-interface-story]")
    .forEach((root) => {
      const tabs = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-interface-tab]"),
      );
      const panels = Array.from(
        root.querySelectorAll<HTMLElement>("[data-interface-panel]"),
      );
      const steps = Array.from(
        root.querySelectorAll<HTMLElement>("[data-interface-step]"),
      );
      const description = root.querySelector<HTMLElement>(
        "[data-interface-description]",
      );
      const select = (index: number) => {
        tabs.forEach((tab, i) => {
          tab.setAttribute("aria-selected", String(i === index));
          tab.tabIndex = i === index ? 0 : -1;
        });
        panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
        if (description)
          description.textContent = steps[index]?.dataset.interfaceCopy || "";
        root.dataset.activePanel = String(index);
      };
      const manual = (index: number) => {
        select(index);
        if (root.dataset.interfaceMode === "compact") return;
        steps[index]?.scrollIntoView({
          block: "center",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => manual(i));
        tab.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? tabs.length - 1
                : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                  tabs.length;
          manual(next);
          tabs[next]?.focus();
        });
      });
      const onIntersection: IntersectionObserverCallback = (entries) => {
        const entered = entries.filter((entry) => entry.isIntersecting).at(-1);
        if (entered)
          select(Number((entered.target as HTMLElement).dataset.interfaceStep));
      };
      let observer: IntersectionObserver;
      const observeSteps = () => {
        observer?.disconnect();
        const inset = Math.round(window.innerHeight * 0.44);
        observer = new IntersectionObserver(onIntersection, {
          rootMargin: "-" + inset + "px 0px -" + inset + "px 0px",
          threshold: 0,
        });
        steps.forEach((step) => observer.observe(step));
      };
      if (root.dataset.interfaceMode !== "compact") {
        window.addEventListener("resize", observeSteps);
        observeSteps();
      }
      select(0);
    });
}
