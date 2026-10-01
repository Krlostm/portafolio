/** One short desktop wheel gesture advances one complete view.
 * Scrollbars, touch, horizontal galleries and an explicit free mode remain native. */
export function initSceneNavigation() {
  const navigation = document.querySelector<HTMLElement>(
    "[data-scene-navigation]",
  );
  const scenes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-scene]"),
  );
  if (!navigation || !scenes.length) return;
  const previous =
    navigation.querySelector<HTMLButtonElement>("[data-scene-prev]");
  const next = navigation.querySelector<HTMLButtonElement>("[data-scene-next]");
  const toggle = navigation.querySelector<HTMLButtonElement>(
    "[data-scene-toggle]",
  );
  const announcement = navigation.querySelector<HTMLElement>(
    "[data-scene-announcement]",
  );
  const desktop = window.matchMedia(
    "(min-width:1024px) and (min-height:600px) and (pointer:fine)",
  );
  const reduced = window.matchMedia("(prefers-reduced-motion:reduce)");
  let free = false,
    index = 0,
    animation = 0,
    updateFrame = 0;
  let lastWheel = -Infinity,
    wheelAmount = 0,
    usedGesture = false;
  scenes.forEach((scene, i) => {
    if (!scene.id) scene.id = "scene-" + (i + 1);
  });
  const enabled = () => desktop.matches && !free;
  const stop = () => {
    window.cancelAnimationFrame(animation);
    animation = 0;
  };
  const update = () => {
    updateFrame = 0;
    let distance = Infinity;
    scenes.forEach((scene, i) => {
      const candidate = Math.abs(scene.getBoundingClientRect().top);
      if (candidate < distance) {
        distance = candidate;
        index = i;
      }
    });
    scenes.forEach((scene, i) => {
      scene.dataset.sceneActive = String(i === index);
    });
    if (previous) previous.disabled = index === 0;
    if (next) next.disabled = index === scenes.length - 1;
    document.documentElement.dataset.sceneId = scenes[index]?.id;
  };
  const schedule = () => {
    if (!updateFrame) updateFrame = window.requestAnimationFrame(update);
  };
  const go = (requested: number, focus = false) => {
    const target = scenes[Math.max(0, Math.min(scenes.length - 1, requested))];
    if (!target) return;
    stop();
    const start = window.scrollY;
    const top = target.getBoundingClientRect().top + start;
    const finish = () => {
      animation = 0;
      update();
      if (announcement)
        announcement.textContent = target.getAttribute("aria-label") || "";
      if (focus) target.focus({ preventScroll: true });
    };
    // Long chapter jumps land directly, so intermediate videos do not all load.
    if (
      reduced.matches ||
      Math.abs(top - start) < 2 ||
      Math.abs(top - start) > window.innerHeight * 2.1
    ) {
      window.scrollTo({ top, behavior: "instant" });
      finish();
      return;
    }
    const began = window.performance.now();
    const animate = (time: number) => {
      const progress = Math.min(1, (time - began) / 520);
      const eased =
        progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({
        top: start + (top - start) * eased,
        behavior: "instant",
      });
      if (progress < 1) animation = window.requestAnimationFrame(animate);
      else finish();
    };
    animation = window.requestAnimationFrame(animate);
  };
  const syncMode = () => {
    stop();
    usedGesture = false;
    wheelAmount = 0;
    lastWheel = -Infinity;
    navigation.hidden = !desktop.matches;
    document.documentElement.classList.toggle("scene-mode", enabled());
    document.documentElement.dataset.scrollMode = enabled() ? "scenes" : "free";
    toggle?.setAttribute("aria-pressed", String(enabled()));
    if (toggle)
      toggle.textContent = enabled()
        ? "Desplazamiento libre"
        : "Activar escenas";
    update();
  };
  const inControl = (target: Element) =>
    !!target.closest("input,textarea,select,[contenteditable='true']");
  const nestedCanScroll = (target: Element, direction: number) => {
    for (
      let node: Element | null = target;
      node && node !== document.body;
      node = node.parentElement
    ) {
      const element = node as HTMLElement;
      if (element.scrollHeight <= element.clientHeight + 2) continue;
      const overflow = window.getComputedStyle(element).overflowY;
      if (!["auto", "scroll"].includes(overflow)) continue;
      if (
        (direction > 0 &&
          element.scrollTop + element.clientHeight <
            element.scrollHeight - 2) ||
        (direction < 0 && element.scrollTop > 2)
      )
        return true;
    }
    return false;
  };
  window.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      if (
        !enabled() ||
        !event.cancelable ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        document.querySelector("dialog[open]")
      )
        return;
      const target =
        event.target instanceof Element ? event.target : document.body;
      if (inControl(target) || nestedCanScroll(target, Math.sign(event.deltaY)))
        return;
      update();
      const bounds = scenes[index]!.getBoundingClientRect();
      if (
        bounds.height > window.innerHeight + 8 &&
        ((event.deltaY > 0 && bounds.bottom > window.innerHeight + 4) ||
          (event.deltaY < 0 && bounds.top < -4))
      )
        return;
      event.preventDefault();
      const now = window.performance.now();
      if (now - lastWheel > 180) {
        usedGesture = false;
        wheelAmount = 0;
      }
      lastWheel = now;
      if (usedGesture || animation) return;
      const multiplier =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      wheelAmount += event.deltaY * multiplier;
      if (Math.abs(wheelAmount) < 12) return;
      usedGesture = true;
      go(index + Math.sign(wheelAmount));
    },
    { passive: false },
  );
  document.addEventListener("keydown", (event) => {
    if (
      !enabled() ||
      document.querySelector("dialog[open]") ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const target = event.target as Element;
    if (
      inControl(target) ||
      target.closest("[data-rail-viewport],[role='tablist'],button,a")
    )
      return;
    if (!["PageDown", "PageUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    go(
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? scenes.length - 1
          : index + (event.key === "PageDown" ? 1 : -1),
      true,
    );
  });
  document.addEventListener("click", (event) => {
    if (
      !enabled() ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (
      !anchor ||
      anchor.target === "_blank" ||
      anchor.classList.contains("skip-link")
    )
      return;
    const address = new URL(anchor.href, window.location.href);
    if (
      address.origin !== window.location.origin ||
      address.pathname !== window.location.pathname ||
      !address.hash
    )
      return;
    let id: string;
    try {
      id = decodeURIComponent(address.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    const scene = target?.matches("[data-scene]")
      ? target
      : target?.querySelector("[data-scene]") ||
        target?.closest("[data-scene]");
    if (!scene) return;
    event.preventDefault();
    const targetIndex = scenes.indexOf(scene as HTMLElement);
    if (targetIndex < 0) return;
    window.history.pushState(null, "", address.hash);
    go(targetIndex);
  });
  previous?.addEventListener("click", () => {
    update();
    go(index - 1);
  });
  next?.addEventListener("click", () => {
    update();
    go(index + 1);
  });
  toggle?.addEventListener("click", () => {
    free = !free;
    syncMode();
  });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", () => {
    stop();
    schedule();
  });
  window.addEventListener("popstate", () => {
    stop();
    schedule();
  });
  window.addEventListener("pointerdown", (event) => {
    if (event.clientX >= document.documentElement.clientWidth) stop();
  });
  desktop.addEventListener("change", syncMode);
  reduced.addEventListener("change", () => {
    if (reduced.matches) stop();
  });
  document.fonts?.ready.then(schedule);
  syncMode();
}
export function initSceneSwitches() {
  document
    .querySelectorAll<HTMLElement>("[data-scene-switch]")
    .forEach((root) => {
      const tabs = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-scene-tab]"),
      );
      const panels = Array.from(
        root.querySelectorAll<HTMLElement>("[data-scene-panel]"),
      );
      const select = (index: number) => {
        tabs.forEach((tab, i) => {
          tab.setAttribute("aria-selected", String(i === index));
          tab.tabIndex = i === index ? 0 : -1;
        });
        panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(i));
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
          select(next);
          tabs[next]?.focus();
        });
      });
      select(0);
    });
}
