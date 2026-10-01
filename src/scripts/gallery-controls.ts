// A native horizontal row. Automatic motion never replaces manual scrolling.
export function initMediaRails() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  document
    .querySelectorAll<HTMLElement>("[data-media-rail]")
    .forEach((root) => {
      const viewport = root.querySelector<HTMLElement>("[data-rail-viewport]");
      const track = root.querySelector<HTMLElement>("[data-rail-track]");
      const pause = root.querySelector<HTMLButtonElement>("[data-rail-pause]");
      const hint = root.querySelector<HTMLElement>("[data-rail-hint]");
      const seek = root.querySelector<HTMLInputElement>("[data-rail-seek]");
      if (!viewport || !track) return;
      let visible = false,
        hovered = false,
        focused = false,
        manualHold = false;
      let userPaused = reduced.matches,
        direction = 1;
      let frame = 0,
        lastTime = 0,
        logicalPosition = viewport.scrollLeft,
        holdUntil = 0,
        resumeTimer = 0;
      const extent = () =>
        Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const updatePosition = () => {
        if (!seek) return;
        const max = extent();
        const percentage = max
          ? Math.max(0, Math.min(100, (viewport.scrollLeft / max) * 100))
          : 0;
        seek.value = percentage.toFixed(1);
        seek.style.setProperty("--rail-position", percentage + "%");
        seek.setAttribute(
          "aria-valuetext",
          Math.round(percentage) + " % del recorrido",
        );
      };
      const stop = () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      };
      const canMove = () =>
        visible &&
        !document.hidden &&
        !hovered &&
        !focused &&
        !manualHold &&
        !userPaused &&
        extent() > 2;
      const advance = (time: number) => {
        frame = 0;
        if (!canMove()) {
          lastTime = 0;
          return;
        }
        const delta = lastTime ? Math.min(50, time - lastTime) : 0;
        if (!lastTime) logicalPosition = viewport.scrollLeft;
        lastTime = time;
        if (time >= holdUntil) {
          const max = extent();
          logicalPosition = Math.max(
            0,
            Math.min(max, logicalPosition + (direction * 28 * delta) / 1000),
          );
          viewport.scrollLeft = logicalPosition;
          updatePosition();
          if (
            (direction > 0 && logicalPosition >= max) ||
            (direction < 0 && logicalPosition <= 0)
          ) {
            direction *= -1;
            holdUntil = time + 1400;
          }
        }
        frame = window.requestAnimationFrame(advance);
      };
      const sync = () => {
        const overflow = extent() > 2;
        if (pause) {
          pause.hidden = !overflow;
          pause.setAttribute("aria-pressed", String(userPaused));
          pause.textContent = userPaused
            ? "Reanudar movimiento ▶"
            : "Pausar movimiento Ⅱ";
        }
        if (hint) hint.hidden = !overflow;
        if (seek) seek.disabled = !overflow;
        updatePosition();
        viewport.tabIndex = overflow ? 0 : -1;
        if (canMove()) {
          if (!frame) frame = window.requestAnimationFrame(advance);
        } else stop();
      };
      const postpone = () => {
        manualHold = true;
        stop();
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(() => {
          manualHold = false;
          sync();
        }, 3500);
      };
      pause?.addEventListener("click", () => {
        userPaused = !userPaused;
        sync();
      });
      seek?.addEventListener("input", () => {
        postpone();
        const max = extent();
        viewport.scrollTo({
          left: (Math.max(0, Math.min(100, Number(seek.value))) / 100) * max,
          behavior: "instant",
        });
        logicalPosition = viewport.scrollLeft;
        if (logicalPosition <= 0) direction = 1;
        else if (logicalPosition >= max) direction = -1;
        holdUntil = 0;
        updatePosition();
      });
      viewport.addEventListener("scroll", updatePosition, { passive: true });
      root.addEventListener("pointerenter", () => {
        hovered = true;
        sync();
      });
      root.addEventListener("pointerleave", () => {
        hovered = false;
        sync();
      });
      root.addEventListener("focusin", (event) => {
        focused = root.contains(event.target as Node);
        sync();
      });
      root.addEventListener("focusout", (event) => {
        focused = root.contains(event.relatedTarget as Node | null);
        sync();
      });
      viewport.addEventListener("wheel", postpone, { passive: true });
      viewport.addEventListener("pointerdown", postpone, { passive: true });
      viewport.addEventListener("touchmove", postpone, { passive: true });
      viewport.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        postpone();
        viewport.scrollTo({
          left:
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? extent()
                : viewport.scrollLeft +
                  (event.key === "ArrowRight" ? 1 : -1) *
                    viewport.clientWidth *
                    0.45,
          behavior: reduced.matches ? "instant" : "smooth",
        });
      });
      new IntersectionObserver(
        (entries) => {
          visible =
            !!entries[0]?.isIntersecting &&
            entries[0].intersectionRatio >= 0.15;
          sync();
        },
        { threshold: 0.15 },
      ).observe(root);
      const resize = new ResizeObserver(sync);
      resize.observe(viewport);
      resize.observe(track);
      document.addEventListener("visibilitychange", sync);
      reduced.addEventListener("change", () => {
        if (reduced.matches) userPaused = true;
        sync();
      });
      sync();
    });
}
