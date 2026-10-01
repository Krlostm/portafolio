type VideoRoot = HTMLElement;
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)");
const dialogOpen = () => !!document.querySelector("dialog[open]");
const refreshMedia = () =>
  document.dispatchEvent(new Event("portfolio:media-refresh"));

function loadVideo(video: HTMLVideoElement) {
  video.muted = true;
  video.playsInline = true;
  if (!video.getAttribute("src")) {
    video.src = video.dataset.src || "";
    video.load();
  } else if (video.error) {
    video.load();
  }
}

function playVideo(video: HTMLVideoElement, failed: () => void) {
  loadVideo(video);
  void video.play().catch((error) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    failed();
  });
}

function setToggle(
  button: HTMLButtonElement | null,
  playing: boolean,
  label: string,
) {
  if (!button) return;
  button.innerHTML = playing
    ? '<span aria-hidden="true">Ⅱ</span>'
    : '<span aria-hidden="true">▶</span>';
  button.setAttribute(
    "aria-label",
    (playing ? "Pausar " : "Reproducir ") + label,
  );
}

export function initPreviewVideos() {
  const reduced = reducedMotion();
  document
    .querySelectorAll<VideoRoot>("[data-video-preview]")
    .forEach((root) => {
      const video = root.querySelector<HTMLVideoElement>(
        "[data-visible-video]",
      );
      const toggle = root.querySelector<HTMLButtonElement>(
        "[data-preview-toggle]",
      );
      const status = root.querySelector<HTMLElement>("[data-media-status]");
      if (!video) return;
      let visible = false;
      let userPaused = false;
      const fail = () => {
        root.classList.remove("has-frame");
        if (status)
          status.textContent = "Pulsa reproducir para volver a intentarlo.";
        setToggle(toggle, false, "vista previa");
      };
      const play = () => {
        if (status) status.textContent = "";
        playVideo(video, fail);
      };
      const sync = () => {
        if (
          !visible ||
          document.hidden ||
          dialogOpen() ||
          root.closest("[hidden]")
        )
          video.pause();
        else if (!reduced.matches && !userPaused) play();
      };
      new IntersectionObserver(
        (entries) => {
          visible =
            !!entries[0]?.isIntersecting && entries[0].intersectionRatio >= 0.4;
          sync();
        },
        { threshold: 0.4 },
      ).observe(root);
      toggle?.addEventListener("click", () => {
        if (video.paused) {
          userPaused = false;
          play();
        } else {
          userPaused = true;
          video.pause();
        }
      });
      video.addEventListener("playing", () => {
        root.classList.add("has-frame");
        if (status) status.textContent = "";
        setToggle(toggle, true, "vista previa");
      });
      video.addEventListener("pause", () =>
        setToggle(toggle, false, "vista previa"),
      );
      video.addEventListener("error", fail);
      document.addEventListener("visibilitychange", sync);
      document.addEventListener("portfolio:media-refresh", sync);
      reduced.addEventListener("change", () => {
        if (reduced.matches) video.pause();
        else sync();
      });
    });
}

export function initVideoDialog() {
  const dialog = document.querySelector<HTMLDialogElement>(".video-dialog");
  const player = dialog?.querySelector<HTMLVideoElement>("video");
  const status = dialog?.querySelector<HTMLElement>("[data-player-status]");
  if (!dialog || !player) return;
  let opener: HTMLElement | null = null;
  document
    .querySelectorAll<HTMLElement>("[data-video-src]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const source = button.dataset.videoSrc;
        if (!source) return;
        opener = button;
        document
          .querySelectorAll<HTMLVideoElement>("video")
          .forEach((video) => video.pause());
        const title = dialog.querySelector<HTMLElement>("#video-dialog-title");
        if (title) title.textContent = button.dataset.videoTitle || "Video";
        player.src = source;
        player.muted = false;
        player.load();
        if (!dialog.open) dialog.showModal();
        refreshMedia();
        if (status) status.textContent = "Cargando video…";
        void player.play().catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
          if (status)
            status.textContent = "Pulsa reproducir en los controles del video.";
        });
      });
    });
  player.addEventListener("playing", () => {
    if (status) status.textContent = "Sonido y reproducción bajo tu control.";
  });
  player.addEventListener("error", () => {
    if (status)
      status.textContent =
        "No se pudo cargar el video. Cierra y vuelve a abrir el reproductor.";
  });
  dialog
    .querySelector<HTMLButtonElement>("[data-video-close]")
    ?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    player.pause();
    player.removeAttribute("src");
    player.load();
    opener?.focus();
    refreshMedia();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
}
