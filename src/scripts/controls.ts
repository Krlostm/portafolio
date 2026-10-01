export function initNavigation() {
  const menu = document.querySelector<HTMLButtonElement>(".menu-toggle");
  const nav = document.querySelector<HTMLElement>("#main-nav");
  const close = () => {
    menu?.setAttribute("aria-expanded", "false");
    menu?.setAttribute("aria-label", "Abrir navegación");
    nav?.classList.remove("is-open");
  };
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute(
      "aria-label",
      open ? "Cerrar navegación" : "Abrir navegación",
    );
    nav?.classList.toggle("is-open", open);
  });
  nav
    ?.querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu?.getAttribute("aria-expanded") === "true"
    ) {
      close();
      menu.focus();
    }
  });
}

export function initCarousels() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((root) => {
    const track = root.querySelector<HTMLElement>(".carousel-track");
    const slides = Array.from(
      root.querySelectorAll<HTMLElement>(".carousel-slide"),
    );
    const count = root.querySelector<HTMLElement>("[data-carousel-count]");
    const dots = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-slide-to]"),
    );
    const toggle = root.querySelector<HTMLButtonElement>(
      "[data-slider-toggle]",
    );
    if (!track || !slides.length) return;
    let index = 0;
    let visible = false;
    let hovered = false;
    let focused = false;
    let userPaused = reduced.matches;
    let explicitRunning = false;
    let timer: number | undefined;
    const stop = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };
    const update = (manual = false) => {
      if (count) {
        count.setAttribute("aria-live", manual ? "polite" : "off");
        count.textContent =
          String(index + 1).padStart(2, "0") +
          " / " +
          String(slides.length).padStart(2, "0");
      }
      dots.forEach((dot, i) =>
        dot.setAttribute("aria-pressed", String(i === index)),
      );
      if (toggle) {
        toggle.innerHTML = userPaused
          ? '<span aria-hidden="true">▶</span>'
          : '<span aria-hidden="true">Ⅱ</span>';
        toggle.setAttribute(
          "aria-label",
          userPaused
            ? "Reproducir desplazamiento automático"
            : "Pausar desplazamiento automático",
        );
        toggle.setAttribute("aria-pressed", String(userPaused));
      }
    };
    const schedule = () => {
      stop();
      if (
        !visible ||
        document.hidden ||
        userPaused ||
        (!explicitRunning && (hovered || focused))
      )
        return;
      timer = window.setTimeout(() => go(index + 1, false), 4500);
    };
    const go = (next: number, manual = true) => {
      index = (next + slides.length) % slides.length;
      if (manual) explicitRunning = false;
      track.scrollTo({
        left: index * track.clientWidth,
        behavior: reduced.matches ? "instant" : "smooth",
      });
      update(manual);
      schedule();
    };
    root
      .querySelector<HTMLButtonElement>("[data-prev]")
      ?.addEventListener("click", () => go(index - 1));
    root
      .querySelector<HTMLButtonElement>("[data-next]")
      ?.addEventListener("click", () => go(index + 1));
    dots.forEach((dot) =>
      dot.addEventListener("click", () => go(Number(dot.dataset.slideTo))),
    );
    toggle?.addEventListener("click", () => {
      userPaused = !userPaused;
      explicitRunning = !userPaused;
      update();
      schedule();
    });
    track.addEventListener("keydown", (event) => {
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
    track.addEventListener(
      "scroll",
      () => {
        const next = Math.max(
          0,
          Math.min(
            slides.length - 1,
            Math.round(track.scrollLeft / Math.max(1, track.clientWidth)),
          ),
        );
        if (next !== index) {
          index = next;
          update();
        }
      },
      { passive: true },
    );
    track.addEventListener(
      "pointerdown",
      () => {
        explicitRunning = false;
        stop();
      },
      { passive: true },
    );
    track.addEventListener("pointerup", schedule, { passive: true });
    root.addEventListener("pointerenter", () => {
      hovered = true;
      schedule();
    });
    root.addEventListener("pointerleave", () => {
      hovered = false;
      schedule();
    });
    root.addEventListener("focusin", () => {
      focused = true;
      schedule();
    });
    root.addEventListener("focusout", (event) => {
      focused = root.contains(event.relatedTarget as Node | null);
      schedule();
    });
    new IntersectionObserver(
      (entries) => {
        visible =
          !!entries[0]?.isIntersecting && entries[0].intersectionRatio >= 0.45;
        schedule();
      },
      { threshold: 0.45 },
    ).observe(root);
    new ResizeObserver(() => {
      track.scrollTo({ left: index * track.clientWidth, behavior: "instant" });
    }).observe(track);
    reduced.addEventListener("change", () => {
      userPaused = reduced.matches;
      explicitRunning = false;
      update();
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);
    update();
  });
}

export function initProducts() {
  document.querySelectorAll<HTMLElement>("[data-product]").forEach((root) => {
    const tabs = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-feature]"),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>(".feature-panel"),
    );
    const description = root.querySelector<HTMLElement>(
      "[data-feature-description]",
    );
    const select = (index: number) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        if (panel.hidden)
          panel
            .querySelectorAll<HTMLVideoElement>("video")
            .forEach((video) => video.pause());
      });
      if (description)
        description.textContent =
          root.querySelector<HTMLElement>('[data-feature-copy="' + index + '"]')
            ?.textContent || "";
      document.dispatchEvent(new Event("portfolio:media-refresh"));
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        select(next);
        tabs[next]?.focus();
      });
    });
  });
}

export function initScreenProgress() {
  const progress = document.querySelector<HTMLElement>(".reading-progress");
  let frame = 0;
  const update = () => {
    frame = 0;
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    if (progress)
      progress.style.transform =
        "scaleX(" + (maximum > 0 ? window.scrollY / maximum : 0) + ")";
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}
