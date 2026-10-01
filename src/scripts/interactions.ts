import { initNavigation, initProducts, initScreenProgress } from "./controls";
import { initPreviewVideos, initVideoDialog } from "./media-controls";
import { initMediaRails } from "./gallery-controls";
import { initSceneNavigation, initSceneSwitches } from "./scene-controls";
import {
  initChapterNavigation,
  initInterfaceStories,
  initClientMarquee,
} from "./story-controls";

export function initInteractions() {
  const start = () => {
    if (document.documentElement.dataset.interactions === "ready") return;
    // Controls do not depend on the animation library or its network request.
    [
      initNavigation,
      initVideoDialog,
      initSceneSwitches,
      initSceneNavigation,
      initPreviewVideos,
      initMediaRails,
      initProducts,
      initScreenProgress,
      initChapterNavigation,
      initInterfaceStories,
      initClientMarquee,
    ].forEach((initialize) => {
      try {
        initialize();
      } catch (error) {
        console.error("No se pudo iniciar " + initialize.name, error);
      }
    });
    document.documentElement.dataset.interactions = "ready";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void import("./animations")
        .then((module) => module.initAnimations())
        .catch((error) =>
          console.warn(
            "Las animaciones no están disponibles; los controles siguen activos.",
            error,
          ),
        );
    }
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
