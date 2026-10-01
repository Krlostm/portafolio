// DOM unit tests against the production HTML. No browser or media decoding.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { transform, build } from "esbuild";
const home = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
async function module(name) {
  const { code } = await transform(
    await readFile(
      new URL("../src/scripts/" + name + ".ts", import.meta.url),
      "utf8",
    ),
    { loader: "ts", format: "esm" },
  );
  return import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
}
const controls = await module("controls"),
  media = await module("media-controls"),
  story = await module("story-controls"),
  gallery = await module("gallery-controls");
function fixture(reduced = false) {
  const dom = new JSDOM(home, {
    url: "https://portfolio.test/",
    pretendToBeVisual: true,
  });
  const w = dom.window,
    doc = w.document;
  Object.assign(globalThis, {
    window: w,
    document: doc,
    Event: w.Event,
    DOMException: w.DOMException,
    Node: w.Node,
    Element: w.Element,
  });
  let now = 0,
    serial = 0;
  const timers = new Map(),
    observers = [],
    resizes = [];
  w.setTimeout = (fn, delay) => {
    const id = ++serial;
    timers.set(id, { fn, at: now + delay });
    return id;
  };
  w.clearTimeout = (id) => timers.delete(id);
  w.requestAnimationFrame = (fn) => w.setTimeout(() => fn(now), 16);
  w.cancelAnimationFrame = (id) => timers.delete(id);
  w.scrollTo = (options) => {
    w.lastScroll = options;
  };
  w.HTMLElement.prototype.scrollIntoView = function (options) {
    this.lastScroll = options;
  };
  const motion = {
    matches: reduced,
    listeners: [],
    addEventListener(_type, fn) {
      this.listeners.push(fn);
    },
  };
  w.matchMedia = () => motion;
  class IO {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observers.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    disconnect() {
      this.targets = [];
    }
  }
  class RO {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      resizes.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
  }
  Object.assign(globalThis, { IntersectionObserver: IO, ResizeObserver: RO });
  for (const chapter of doc.querySelectorAll("[data-chapter]"))
    chapter.getBoundingClientRect = () =>
      chapter.testRect || { top: 999999, bottom: 1009999 };
  for (const video of doc.querySelectorAll("video")) {
    video.state = { paused: true, plays: 0, loads: 0, rejected: false };
    Object.defineProperties(video, {
      paused: { get: () => video.state.paused },
      readyState: { get: () => 4 },
    });
    video.load = () => video.state.loads++;
    video.play = () => {
      video.state.plays++;
      if (video.state.rejected)
        return Promise.reject(
          new w.DOMException("Playback blocked", "NotAllowedError"),
        );
      video.state.paused = false;
      video.dispatchEvent(new w.Event("playing"));
      return Promise.resolve();
    };
    video.pause = () => {
      if (!video.state.paused) {
        video.state.paused = true;
        video.dispatchEvent(new w.Event("pause"));
      }
    };
  }
  for (const track of doc.querySelectorAll("[data-rail-viewport]")) {
    track.testWidth = 800;
    track.testContentWidth = 1800;
    Object.defineProperty(track, "clientWidth", { get: () => track.testWidth });
    Object.defineProperty(track, "scrollWidth", {
      get: () => track.testContentWidth,
    });
    track.scrollTo = ({ left }) => {
      track.scrollLeft = Math.max(
        0,
        Math.min(track.testContentWidth - track.testWidth, left),
      );
      track.dispatchEvent(new w.Event("scroll"));
    };
  }
  const dialog = doc.querySelector("dialog");
  dialog.showModal = () => dialog.setAttribute("open", "");
  dialog.close = () => {
    dialog.removeAttribute("open");
    dialog.dispatchEvent(new w.Event("close"));
  };
  return {
    w,
    doc,
    motion,
    visible(target, ratio = 1) {
      observers
        .filter((o) => o.targets.includes(target))
        .forEach((o) =>
          o.callback([
            { target, isIntersecting: ratio > 0, intersectionRatio: ratio },
          ]),
        );
    },
    resize(target) {
      resizes
        .filter((o) => o.targets.includes(target))
        .forEach((o) => o.callback());
    },
    advance(duration) {
      const end = now + duration;
      for (let i = 0; i < 2000; i++) {
        const pair = [...timers]
          .filter(([, t]) => t.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!pair) break;
        const [id, t] = pair;
        now = t.at;
        timers.delete(id);
        t.fn();
      }
      now = end;
    },
    hidden(value) {
      Object.defineProperty(doc, "hidden", { configurable: true, value });
      doc.dispatchEvent(new w.Event("visibilitychange"));
    },
    key(target, key) {
      target.dispatchEvent(
        new w.KeyboardEvent("keydown", { key, bubbles: true }),
      );
    },
    chapter(id) {
      doc
        .querySelectorAll("[data-chapter]")
        .forEach((ch) => (ch.testRect = { top: 999999, bottom: 1009999 }));
      if (id) doc.getElementById(id).testRect = { top: 100, bottom: 1500 };
      w.dispatchEvent(new w.Event("scroll"));
    },
    close() {
      dom.window.close();
    },
  };
}

test("complete home starts Hero, Kike, Opermundo, Top Media and includes every chapter", () => {
  const f = fixture(),
    ids = [...f.doc.querySelectorAll("[data-chapter]")].map((ch) => ch.id);
  assert.deepEqual(ids, [
    "work",
    "opermundo",
    "top-media",
    "theraudio",
    "ferreteria",
    "product",
    "motion",
    "influencers",
    "producciones",
    "fotografia",
    "development",
    "playground",
    "clients",
    "about",
    "contact",
  ]);
  assert.match(f.doc.querySelector("h1").textContent, /CARLOS.*TOA/);
  assert.equal(f.doc.querySelectorAll(".home-screen").length, 0);
  assert.equal(f.doc.querySelectorAll("[data-mode]").length, 0);
  assert.equal(f.doc.querySelectorAll(".production-frames").length, 0);
  assert.equal(
    f.doc.querySelectorAll("[data-carousel],[data-story-strip]").length,
    0,
  );
  assert.match(
    f.doc.querySelector("#producciones h2").textContent,
    /PRODUCCIONES/i,
  );
  assert.equal(f.doc.querySelectorAll('a[href*="/work/mma/"]').length, 0);
  for (const video of f.doc.querySelectorAll("video")) {
    assert.equal(video.getAttribute("preload"), "none");
    assert.equal(video.hasAttribute("src"), false);
  }
  assert.equal(
    f.doc.querySelector("#main-nav a:nth-child(2)").getAttribute("href"),
    "/#about",
  );
  assert.equal(
    f.doc.querySelector("#main-nav a:nth-child(3)").getAttribute("href"),
    "/#contact",
  );
  f.close();
});
test("NEXT follows active chapter, required sequence and next client accent", () => {
  const f = fixture();
  f.chapter("work");
  story.initChapterNavigation();
  const nav = f.doc.querySelector("[data-chapter-navigation]"),
    next = nav.querySelector("a");
  assert.equal(nav.hidden, false);
  assert.equal(next.getAttribute("href"), "/#opermundo");
  assert.equal(next.style.getPropertyValue("--next-accent"), "#3989ff");
  assert.match(nav.textContent, /01 — Kike/);
  f.chapter("opermundo");
  f.advance(16);
  assert.equal(next.getAttribute("href"), "/#top-media");
  assert.equal(next.style.getPropertyValue("--next-accent"), "#f4d51c");
  f.chapter("top-media");
  f.advance(16);
  assert.equal(next.getAttribute("href"), "/#theraudio");
  assert.equal(nav.dataset.currentId, "top-media");
  f.close();
});
test("NEXT hides at intro and contact and preserves a deployment prefix", () => {
  const f = fixture();
  const nav = f.doc.querySelector("[data-chapter-navigation]"),
    next = nav.querySelector("a");
  next.setAttribute("href", "/portafolio/#opermundo");
  story.initChapterNavigation();
  assert.equal(nav.hidden, true);
  f.chapter("fotografia");
  f.advance(16);
  assert.equal(next.getAttribute("href"), "/portafolio/#development");
  f.chapter("contact");
  f.advance(16);
  assert.equal(nav.hidden, true);
  f.close();
});
test("Top Media row retains all four pieces, supports keyboard and does not scroll the document", () => {
  const f = fixture();
  gallery.initMediaRails();
  const root = f.doc.querySelector("#top-media [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]");
  assert.deepEqual(
    [...root.querySelectorAll(".media-rail-piece img")].map(
      (im) => /top-(\d+)/.exec(im.src)[1],
    ),
    ["01", "02", "03", "04"],
  );
  assert.equal(root.querySelector("[data-next],[data-slide-to]"), null);
  f.key(viewport, "ArrowRight");
  assert.equal(viewport.scrollLeft, 360);
  f.key(viewport, "End");
  assert.equal(viewport.scrollLeft, 1000);
  f.key(viewport, "Home");
  assert.equal(viewport.scrollLeft, 0);
  assert.equal(f.w.lastScroll, undefined);
  f.close();
});
test("overflowing row moves continuously, reverses at the edge and stops offscreen", () => {
  const f = fixture();
  gallery.initMediaRails();
  const root = f.doc.querySelector("#top-media [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]");
  f.advance(1000);
  assert.equal(viewport.scrollLeft, 0);
  f.visible(root);
  f.advance(1000);
  assert.ok(viewport.scrollLeft > 25 && viewport.scrollLeft < 32);
  viewport.testContentWidth = viewport.testWidth + 44;
  let reversed = false,
    previous = viewport.scrollLeft;
  for (let i = 0; i < 8; i++) {
    f.advance(1000);
    assert.ok(viewport.scrollLeft >= 0 && viewport.scrollLeft <= 44);
    if (viewport.scrollLeft < previous) reversed = true;
    previous = viewport.scrollLeft;
  }
  assert.ok(reversed);
  f.visible(root, 0);
  const stopped = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, stopped);
  f.close();
});
test("video row moves automatically and pauses for pointer and keyboard interaction", () => {
  const f = fixture();
  gallery.initMediaRails();
  const root = f.doc.querySelector("#motion [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]");
  assert.equal(root.querySelectorAll(".story-reel").length, 7);
  f.visible(root);
  f.advance(1000);
  assert.ok(viewport.scrollLeft > 20);
  root.dispatchEvent(new f.w.Event("pointerenter"));
  const stopped = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, stopped);
  root.dispatchEvent(new f.w.Event("pointerleave"));
  f.advance(1000);
  assert.ok(viewport.scrollLeft > stopped);
  const button = root.querySelector("[data-video-src]");
  button.focus();
  const focused = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, focused);
  button.blur();
  f.advance(1000);
  assert.ok(viewport.scrollLeft > focused);
  f.close();
});

test("horizontal video previews load individually and pause when their piece leaves the viewport", () => {
  const f = fixture();
  media.initPreviewVideos();
  const pieces = [...f.doc.querySelectorAll("#motion [data-video-preview]")];
  assert.equal(pieces.length, 7);
  f.visible(pieces[0]);
  assert.equal(pieces[0].querySelector("video").paused, false);
  assert.equal(
    pieces.filter((piece) => piece.querySelector("video").hasAttribute("src"))
      .length,
    1,
  );
  f.visible(pieces[0], 0);
  assert.equal(pieces[0].querySelector("video").paused, true);
  f.visible(pieces[3]);
  assert.match(pieces[3].querySelector("video").src, /top-brand-preview\.mp4$/);
  assert.equal(pieces[3].querySelector("video").paused, false);
  assert.equal(
    pieces.filter((piece) => piece.querySelector("video").hasAttribute("src"))
      .length,
    2,
  );
  f.close();
});

test("rail slider seeks immediately, follows scrolling and holds auto movement while focused", () => {
  const f = fixture();
  gallery.initMediaRails();
  const root = f.doc.querySelector("#top-media [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]"),
    seek = root.querySelector("[data-rail-seek]");
  f.visible(root);
  f.advance(1000);
  assert.ok(Number(seek.value) > 2.5);
  seek.focus();
  const stopped = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, stopped);
  seek.value = "75";
  seek.dispatchEvent(new f.w.Event("input", { bubbles: true }));
  assert.equal(viewport.scrollLeft, 750);
  assert.match(seek.getAttribute("aria-valuetext"), /75 %/);
  assert.equal(f.w.lastScroll, undefined);
  f.advance(5000);
  assert.equal(viewport.scrollLeft, 750);
  seek.blur();
  f.advance(1000);
  assert.ok(viewport.scrollLeft > 750 && viewport.scrollLeft < 782);
  viewport.scrollTo({ left: 250 });
  assert.equal(Number(seek.value), 25);
  viewport.testContentWidth = 2800;
  f.resize(viewport);
  assert.equal(Number(seek.value), 12.5);
  seek.value = "100";
  seek.dispatchEvent(new f.w.Event("input", { bubbles: true }));
  assert.equal(viewport.scrollLeft, 2000);
  f.advance(4500);
  assert.ok(viewport.scrollLeft < 2000);
  f.close();
});

test("slow row movement accumulates even when scroll offsets round to integer pixels", () => {
  const f = fixture();
  const root = f.doc.querySelector("#top-media [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]");
  let position = 0;
  Object.defineProperty(viewport, "scrollLeft", {
    get: () => position,
    set: (value) => {
      position = Math.round(value);
    },
  });
  gallery.initMediaRails();
  f.visible(root);
  f.advance(1000);
  assert.ok(position >= 26 && position <= 30);
  f.close();
});
test("compact property explorer changes screenshots without scrolling the document", () => {
  const f = fixture();
  story.initInterfaceStories();
  const root = f.doc.querySelector("[data-interface-story]"),
    tabs = root.querySelectorAll("[data-interface-tab]"),
    panels = root.querySelectorAll("[data-interface-panel]"),
    steps = root.querySelectorAll("[data-interface-step]");
  assert.equal(panels[0].hidden, false);
  tabs[2].click();
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[2].hidden, false);
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  assert.equal(
    root.querySelector("[data-interface-description]").textContent,
    steps[2].dataset.interfaceCopy,
  );
  tabs[1].click();
  assert.equal(panels[1].hidden, false);
  assert.equal(steps[1].lastScroll, undefined);
  f.key(tabs[1], "End");
  assert.equal(panels[4].hidden, false);
  assert.equal(f.doc.activeElement, tabs[4]);
  f.key(tabs[4], "Home");
  assert.equal(panels[0].hidden, false);
  f.close();
});
test("Kike has a presentation and a complete static-to-motion scene before Opermundo", () => {
  const f = fixture();
  const chapter = f.doc.querySelector("#work"),
    scenes = chapter.querySelectorAll("[data-scene]"),
    stage = chapter.querySelector("#kike-motion");
  assert.equal(scenes.length, 2);
  assert.match(scenes[0].querySelector("h2").textContent, /KIKE/);
  assert.match(
    stage.querySelector("h2").textContent,
    /DEL\s+DISEÑO\s+AL MOVIMIENTO/,
  );
  assert.ok(stage.querySelector("[data-kike-static] img"));
  assert.ok(stage.querySelector("[data-kike-motion] video"));
  assert.equal(stage.querySelector("[data-kike-static]").hidden, false);
  assert.equal(stage.querySelector("[data-kike-motion]").hidden, false);
  assert.equal(chapter.nextElementSibling.id, "opermundo");
  assert.equal(chapter.children.length, 2);
  assert.equal(chapter.querySelector(".kike-after"), null);
  f.close();
});
test("Kike lazy preview pauses and resumes on repeated exit and re-entry", () => {
  const f = fixture();
  media.initPreviewVideos();
  const root = f.doc.querySelector("#work [data-video-preview]"),
    video = root.querySelector("video");
  assert.ok(f.doc.querySelector("#work .kike-static-piece img"));
  f.visible(root, 0.2);
  assert.equal(video.hasAttribute("src"), false);
  f.visible(root);
  assert.match(video.getAttribute("src"), /kike-preview\.mp4$/);
  assert.equal(video.paused, false);
  assert.ok(root.classList.contains("has-frame"));
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  assert.equal(video.loop, true);
  for (let i = 0; i < 3; i++) {
    f.visible(root, 0);
    assert.equal(video.paused, true);
    f.visible(root);
    assert.equal(video.paused, false);
    assert.ok(root.classList.contains("has-frame"));
  }
  assert.equal(video.state.loads, 1);
  f.visible(root, 0);
  assert.equal(video.paused, true);
  f.close();
});
test("cinematic preview pauses offscreen, honors manual pause and hidden tab", () => {
  const f = fixture();
  media.initPreviewVideos();
  const root = f.doc.querySelector("#producciones [data-video-preview]"),
    video = root.querySelector("video");
  f.visible(root);
  assert.equal(video.paused, false);
  f.visible(root, 0.3);
  assert.equal(video.paused, true);
  f.visible(root);
  root.querySelector("[data-preview-toggle]").click();
  assert.equal(video.paused, true);
  f.visible(root, 0);
  f.visible(root);
  assert.equal(video.paused, true);
  root.querySelector("[data-preview-toggle]").click();
  assert.equal(video.paused, false);
  f.hidden(true);
  assert.equal(video.paused, true);
  f.hidden(false);
  assert.equal(video.paused, false);
  f.close();
});
test("reduced motion and failed playback keep the poster until explicit successful retry", async () => {
  const f = fixture(true);
  media.initPreviewVideos();
  const root = f.doc.querySelector("#motion [data-video-preview]"),
    video = root.querySelector("video");
  f.visible(root);
  assert.equal(video.hasAttribute("src"), false);
  video.state.rejected = true;
  root.querySelector("[data-preview-toggle]").click();
  await Promise.resolve();
  assert.equal(root.classList.contains("has-frame"), false);
  assert.match(
    root.querySelector("[data-media-status]").textContent,
    /intentarlo/,
  );
  video.state.rejected = false;
  root.querySelector("[data-preview-toggle]").click();
  assert.equal(video.paused, false);
  assert.ok(root.classList.contains("has-frame"));
  f.close();
});
test("full video opens with sound, pauses inline previews and restores focus on close", () => {
  const f = fixture();
  media.initVideoDialog();
  media.initPreviewVideos();
  const root = f.doc.querySelector("#producciones [data-video-preview]");
  f.visible(root);
  const preview = root.querySelector("video"),
    opener = f.doc.querySelector("#producciones [data-video-src]"),
    dialog = f.doc.querySelector("dialog"),
    player = dialog.querySelector("video");
  opener.click();
  assert.equal(dialog.open, true);
  assert.match(player.getAttribute("src"), /mma-full\.mp4$/);
  assert.equal(player.muted, false);
  assert.equal(preview.paused, true);
  dialog.querySelector("[data-video-close]").click();
  assert.equal(dialog.open, false);
  assert.equal(player.hasAttribute("src"), false);
  assert.equal(f.doc.activeElement, opener);
  assert.equal(preview.paused, false);
  f.close();
});
test("Ferreteria row preserves five original pages and reacts to available width", () => {
  const f = fixture();
  gallery.initMediaRails();
  const root = f.doc.querySelector("#ferreteria [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]"),
    pause = root.querySelector("[data-rail-pause]");
  assert.deepEqual(
    [...root.querySelectorAll(".media-rail-piece img")].map(
      (im) => /ferre-(\d+)/.exec(im.src)[1],
    ),
    ["01", "02", "03", "04", "05"],
  );
  viewport.testContentWidth = viewport.testWidth;
  f.resize(viewport);
  f.visible(root);
  assert.equal(pause.hidden, true);
  assert.equal(root.querySelector("[data-rail-hint]").hidden, true);
  assert.equal(root.querySelector("[data-rail-seek]").disabled, true);
  assert.equal(viewport.tabIndex, -1);
  f.advance(1000);
  assert.equal(viewport.scrollLeft, 0);
  viewport.testContentWidth = 1800;
  f.resize(viewport);
  assert.equal(pause.hidden, false);
  assert.equal(root.querySelector("[data-rail-hint]").hidden, false);
  assert.equal(root.querySelector("[data-rail-seek]").disabled, false);
  assert.equal(viewport.tabIndex, 0);
  f.advance(1000);
  assert.ok(viewport.scrollLeft > 0);
  f.close();
});
test("automatic rows pause on hover, focus, explicit pause, hidden tab and manual scrolling", () => {
  const f = fixture();
  gallery.initMediaRails();
  const root = f.doc.querySelector("#ferreteria [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]"),
    pause = root.querySelector("[data-rail-pause]");
  f.visible(root);
  f.advance(1000);
  let position = viewport.scrollLeft;
  root.dispatchEvent(new f.w.Event("pointerenter"));
  f.advance(1000);
  assert.equal(viewport.scrollLeft, position);
  root.dispatchEvent(new f.w.Event("pointerleave"));
  f.advance(1000);
  assert.ok(viewport.scrollLeft > position);
  pause.click();
  position = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, position);
  pause.click();
  f.hidden(true);
  f.advance(1000);
  assert.equal(viewport.scrollLeft, position);
  f.hidden(false);
  f.advance(1000);
  assert.ok(viewport.scrollLeft > position);
  viewport.focus();
  position = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, position);
  viewport.blur();
  viewport.dispatchEvent(new f.w.Event("wheel"));
  f.advance(3000);
  assert.equal(viewport.scrollLeft, position);
  f.advance(1000);
  assert.ok(viewport.scrollLeft > position);
  f.close();
});
test("reduced motion keeps rows still until explicitly enabled", () => {
  const f = fixture(true);
  gallery.initMediaRails();
  const root = f.doc.querySelector("#top-media [data-media-rail]"),
    viewport = root.querySelector("[data-rail-viewport]"),
    pause = root.querySelector("[data-rail-pause]");
  f.visible(root);
  f.advance(1000);
  assert.equal(viewport.scrollLeft, 0);
  assert.equal(pause.getAttribute("aria-pressed"), "true");
  pause.click();
  f.advance(1000);
  assert.ok(viewport.scrollLeft > 0);
  f.motion.listeners.forEach((fn) => fn());
  const position = viewport.scrollLeft;
  f.advance(1000);
  assert.equal(viewport.scrollLeft, position);
  f.close();
});
test("portfolio has one content page and the complete photography rail", async () => {
  const files = await readdir(new URL("../dist/", import.meta.url), {
    recursive: true,
  });
  assert.deepEqual(files.filter((file) => file.endsWith(".html")).sort(), [
    "404.html",
    "index.html",
  ]);
  const f = fixture();
  assert.equal(
    f.doc.querySelector(
      'a[href*="/work/"],a[href*="/about/"],a[href*="/contact/"]',
    ),
    null,
  );
  const photos = f.doc.querySelector("#fotografia [data-media-rail]");
  assert.equal(photos.querySelectorAll(".media-rail-piece img").length, 9);
  assert.ok(photos.querySelector("[data-rail-seek]"));
  f.close();
});

test("mobile menu closes on anchor click and Escape", () => {
  const f = fixture();
  controls.initNavigation();
  const button = f.doc.querySelector(".menu-toggle"),
    nav = f.doc.querySelector("#main-nav");
  button.click();
  assert.equal(button.getAttribute("aria-expanded"), "true");
  nav.querySelector("a").click();
  assert.equal(button.getAttribute("aria-expanded"), "false");
  button.click();
  f.key(button, "Escape");
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(f.doc.activeElement, button);
  f.close();
});

test("client marquee has an explicit pause and resume control", () => {
  const f = fixture();
  story.initClientMarquee();
  const button = f.doc.querySelector("[data-brands-pause]");
  const track = f.doc.querySelector(".clients-track");
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(track.style.animationPlayState, "paused");
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.equal(track.style.animationPlayState, "");
  f.close();
});
test("chapter navigation, multi-image rows and videos still work when the animation download fails", async () => {
  const source = await readFile(
    new URL("../src/scripts/interactions.ts", import.meta.url),
    "utf8",
  );
  const { outputFiles } = await build({
    stdin: {
      contents: source,
      resolveDir: fileURLToPath(new URL("../src/scripts/", import.meta.url)),
      sourcefile: "interactions.ts",
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    write: false,
    plugins: [
      {
        name: "unavailable-animation",
        setup(builder) {
          builder.onResolve({ filter: /^\.\/animations$/ }, () => ({
            path: "failed",
            namespace: "unavailable-animation",
          }));
          builder.onLoad(
            { filter: /.*/, namespace: "unavailable-animation" },
            () => ({
              contents:
                'throw new Error("Animation request failed"); export function initAnimations() {}',
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const entry = await import(
    "data:text/javascript;base64," +
      Buffer.from(outputFiles[0].text).toString("base64")
  );
  const f = fixture();
  f.chapter("work");
  const warnings = [],
    warn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    entry.initInteractions();
    f.doc.dispatchEvent(new f.w.Event("DOMContentLoaded"));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(warnings.length, 1);
    assert.equal(f.doc.documentElement.dataset.interactions, "ready");
    assert.equal(
      f.doc.querySelector("[data-chapter-next]").getAttribute("href"),
      "/#opermundo",
    );
    const rail = f.doc.querySelector("#top-media [data-media-rail]");
    f.key(rail.querySelector("[data-rail-viewport]"), "ArrowRight");
    assert.equal(rail.querySelector("[data-rail-viewport]").scrollLeft, 360);
    f.doc.querySelector("#producciones [data-video-src]").click();
    assert.equal(f.doc.querySelector("dialog").open, true);
  } finally {
    console.warn = warn;
    f.close();
  }
});
