// Controller tests with simulated geometry, not browser layout/visual checks.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { transform } from "esbuild";
const home = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const { code } = await transform(
  await readFile(
    new URL("../src/scripts/scene-controls.ts", import.meta.url),
    "utf8",
  ),
  { loader: "ts", format: "esm" },
);
const sceneControls = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
test("Kike intro no longer inherits the legacy 410px presentation constraint", async () => {
  // CSS cascade check only; JSDOM does not render viewport geometry.
  const dom = new JSDOM(home),
    doc = dom.window.document;
  const style = doc.createElement("style");
  style.textContent =
    (await readFile(
      new URL("../src/styles/global.css", import.meta.url),
      "utf8",
    )) +
    (await readFile(
      new URL("../src/styles/scenes.css", import.meta.url),
      "utf8",
    ));
  doc.head.append(style);
  const legacy = doc.createElement("div");
  legacy.className = "kike-presentation";
  doc.body.append(legacy);
  assert.equal(dom.window.getComputedStyle(legacy).maxWidth, "410px");
  const intro = doc.querySelector("#work [data-scene]");
  assert.equal(dom.window.getComputedStyle(intro).maxWidth, "none");
  assert.equal(dom.window.getComputedStyle(intro).width, "100%");
  assert.equal(dom.window.getComputedStyle(intro).marginLeft, "0px");
  dom.window.close();
});
function fixture({ desktop = true, reduced = false } = {}) {
  const dom = new JSDOM(home, {
    url: "https://portfolio.test/",
    pretendToBeVisual: true,
  });
  const w = dom.window,
    doc = w.document;
  Object.assign(globalThis, { window: w, document: doc, Element: w.Element });
  let now = 0,
    y = 0,
    serial = 0;
  const queue = new Map();
  const scenes = [...doc.querySelectorAll("[data-scene]")];
  Object.defineProperty(w, "innerHeight", { value: 900 });
  Object.defineProperty(w, "scrollY", { get: () => y });
  Object.defineProperty(w.performance, "now", { value: () => now });
  w.requestAnimationFrame = (fn) => {
    const id = ++serial;
    queue.set(id, { at: now + 16, fn });
    return id;
  };
  w.cancelAnimationFrame = (id) => queue.delete(id);
  w.scrollTo = ({ top }) => {
    y = top;
    w.dispatchEvent(new w.Event("scroll"));
  };
  const modes = {
    desktop: {
      matches: desktop,
      listeners: [],
      addEventListener(_type, fn) {
        this.listeners.push(fn);
      },
    },
    reduced: {
      matches: reduced,
      listeners: [],
      addEventListener(_type, fn) {
        this.listeners.push(fn);
      },
    },
  };
  w.matchMedia = (query) =>
    query.includes("prefers-reduced") ? modes.reduced : modes.desktop;
  scenes.forEach(
    (scene, i) =>
      (scene.getBoundingClientRect = () => ({
        top: i * 900 - y,
        bottom: (i + 1) * 900 - y,
        height: 900,
      })),
  );
  function advance(ms) {
    const end = now + ms;
    for (let i = 0; i < 2000; i++) {
      const pair = [...queue]
        .filter(([, v]) => v.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!pair) break;
      const [id, item] = pair;
      now = item.at;
      queue.delete(id);
      item.fn(now);
    }
    now = end;
  }
  function wheel(deltaY, options = {}, target = doc.body) {
    const event = new w.WheelEvent("wheel", {
      deltaY,
      deltaX: 0,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    target.dispatchEvent(event);
    return event;
  }
  function key(key, target = doc.body) {
    const event = new w.KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
  }
  return {
    w,
    doc,
    scenes,
    modes,
    advance,
    wheel,
    key,
    get y() {
      return y;
    },
    close() {
      dom.window.close();
    },
  };
}
test("expanded home retains complete scene groups and separate collections", () => {
  const f = fixture();
  assert.equal(f.scenes.length, 28);
  for (const id of ["work", "theraudio", "development"])
    assert.equal(
      f.doc.getElementById(id).querySelectorAll("[data-scene]").length,
      2,
      id,
    );
  for (const id of [
    "product",
    "motion",
    "influencers",
    "producciones",
    "fotografia",
    "clients",
    "about",
    "contact",
  ])
    assert.equal(
      f.doc.getElementById(id).querySelectorAll("[data-scene]").length,
      1,
      id,
    );
  assert.equal(
    f.doc.getElementById("top-media").querySelectorAll("[data-scene]").length,
    2,
  );
  assert.equal(
    f.doc.getElementById("opermundo").querySelectorAll("[data-scene]").length,
    4,
  );
  assert.equal(
    f.doc.getElementById("ferreteria").querySelectorAll("[data-scene]").length,
    6,
  );
  assert.equal(f.doc.querySelectorAll(".scene-art-deck").length, 4);
  for (const deck of f.doc.querySelectorAll(".scene-art-deck"))
    assert.equal(deck.querySelectorAll("img").length, 3);
  assert.equal(
    f.doc.querySelector("[data-kike-journey],#oper-collection"),
    null,
  );
  assert.doesNotMatch(
    f.doc.querySelector("#about").textContent,
    /por añadir|por completar/i,
  );
  assert.doesNotMatch(
    f.doc.querySelector("#contact").textContent,
    /Enlace por añadir/,
  );
  assert.equal(
    f.doc.querySelectorAll(
      ".clients-set:first-child .client-logo[tabindex='0']",
    ).length,
    8,
  );
  assert.equal(
    f.doc.querySelectorAll(".clients-set[aria-hidden='true'] [tabindex]")
      .length,
    0,
  );
  f.close();
});
test("a short wheel gesture moves one scene and trackpad momentum cannot skip views", () => {
  const f = fixture();
  sceneControls.initSceneNavigation();
  assert.equal(f.doc.documentElement.dataset.scrollMode, "scenes");
  assert.equal(f.wheel(4).defaultPrevented, true);
  f.advance(20);
  assert.equal(f.y, 0);
  f.wheel(8);
  f.advance(100);
  for (let i = 0; i < 30; i++) {
    f.wheel(20);
    f.advance(20);
  }
  f.advance(1000);
  assert.equal(f.y, 900);
  f.wheel(16);
  f.advance(600);
  assert.equal(f.y, 1800);
  f.wheel(-16);
  f.advance(600);
  assert.equal(f.y, 900);
  f.close();
});
test("horizontal galleries, pinch zoom, shift wheel and editable controls stay native", () => {
  const f = fixture();
  sceneControls.initSceneNavigation();
  assert.equal(f.wheel(10, { deltaX: 50 }).defaultPrevented, false);
  assert.equal(f.wheel(30, { ctrlKey: true }).defaultPrevented, false);
  assert.equal(f.wheel(30, { shiftKey: true }).defaultPrevented, false);
  const textarea = f.doc.createElement("textarea");
  f.doc.body.append(textarea);
  assert.equal(f.wheel(30, {}, textarea).defaultPrevented, false);
  assert.equal(f.key("PageDown", textarea).defaultPrevented, false);
  f.advance(700);
  assert.equal(f.y, 0);
  const scroller = f.doc.createElement("div");
  scroller.style.overflowY = "auto";
  f.doc.body.append(scroller);
  Object.defineProperties(scroller, {
    clientHeight: { value: 100 },
    scrollHeight: { value: 400 },
  });
  assert.equal(f.wheel(30, {}, scroller).defaultPrevented, false);
  scroller.scrollTop = 300;
  assert.equal(f.wheel(30, {}, scroller).defaultPrevented, true);
  f.advance(600);
  assert.equal(f.y, 900);
  f.close();
});
test("free scrolling can be enabled and scene buttons still provide deliberate navigation", () => {
  const f = fixture();
  sceneControls.initSceneNavigation();
  const toggle = f.doc.querySelector("[data-scene-toggle]");
  toggle.click();
  assert.equal(f.doc.documentElement.dataset.scrollMode, "free");
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(f.wheel(40).defaultPrevented, false);
  f.doc.querySelector("[data-scene-next]").click();
  f.advance(600);
  assert.equal(f.y, 900);
  toggle.click();
  assert.equal(f.doc.documentElement.dataset.scrollMode, "scenes");
  f.doc.querySelector("[data-scene-prev]").click();
  f.advance(600);
  assert.equal(f.y, 0);
  f.close();
});
test("mobile keeps native scrolling and a viewport change updates the mode", () => {
  const f = fixture({ desktop: false });
  sceneControls.initSceneNavigation();
  assert.equal(f.doc.querySelector("[data-scene-navigation]").hidden, true);
  assert.equal(f.wheel(40).defaultPrevented, false);
  assert.equal(f.key("PageDown").defaultPrevented, false);
  f.advance(600);
  assert.equal(f.y, 0);
  f.modes.desktop.matches = true;
  f.modes.desktop.listeners.forEach((fn) => fn());
  assert.equal(f.doc.querySelector("[data-scene-navigation]").hidden, false);
  assert.equal(f.wheel(1, { deltaMode: 1 }).defaultPrevented, true);
  f.advance(600);
  assert.equal(f.y, 900);
  f.close();
});
test("reduced motion advances instantly and page keys give focus to the destination", () => {
  const f = fixture({ reduced: true });
  sceneControls.initSceneNavigation();
  f.wheel(20);
  assert.equal(f.y, 900);
  f.advance(200);
  f.key("PageDown");
  assert.equal(f.y, 1800);
  assert.equal(f.doc.activeElement, f.scenes[2]);
  f.key("End", f.scenes[2]);
  assert.equal(f.y, (f.scenes.length - 1) * 900);
  f.key("Home", f.scenes.at(-1));
  assert.equal(f.y, 0);
  f.close();
});
test("anchors and chapter NEXT land at the first scene, not in the middle of a client", () => {
  const f = fixture();
  sceneControls.initSceneNavigation();
  f.doc.querySelector(".hero-scroll").click();
  f.advance(600);
  assert.equal(f.y, 900);
  assert.equal(f.w.location.hash, "#work");
  const next = f.doc.querySelector("[data-chapter-next]");
  next.href = "/#top-media";
  next.click();
  f.advance(600);
  const target = f.doc.querySelector("#top-media [data-scene]");
  assert.equal(f.y, f.scenes.indexOf(target) * 900);
  assert.equal(f.w.location.hash, "#top-media");
  assert.equal(target.closest("[data-chapter]").id, "top-media");
  f.close();
});
test("scene switching is accessible by keyboard and never changes document scroll", () => {
  const f = fixture();
  sceneControls.initSceneSwitches();
  for (const root of f.doc.querySelectorAll("[data-scene-switch]")) {
    const tabs = root.querySelectorAll("[data-scene-tab]"),
      panels = root.querySelectorAll("[data-scene-panel]");
    assert.equal(panels[0].hidden, false);
    assert.equal(panels[1].hidden, true);
    f.key("ArrowRight", tabs[0]);
    assert.equal(panels[0].hidden, true);
    assert.equal(panels[1].hidden, false);
    assert.equal(f.doc.activeElement, tabs[1]);
    assert.equal(tabs[1].getAttribute("aria-selected"), "true");
    f.key("Home", tabs[1]);
    assert.equal(panels[0].hidden, false);
  }
  assert.equal(f.y, 0);
  f.close();
});
test("wheel navigation remains inactive while a full video dialog is open", () => {
  const f = fixture();
  sceneControls.initSceneNavigation();
  const dialog = f.doc.querySelector("dialog");
  dialog.setAttribute("open", "");
  assert.equal(f.wheel(40).defaultPrevented, false);
  assert.equal(f.key("PageDown").defaultPrevented, false);
  f.advance(600);
  assert.equal(f.y, 0);
  dialog.removeAttribute("open");
  f.wheel(40);
  f.advance(600);
  assert.equal(f.y, 900);
  f.close();
});
test("vertical wheel over collection tabs advances scenes while tab keys keep their own behavior", () => {
  const f = fixture();
  sceneControls.initSceneNavigation();
  sceneControls.initSceneSwitches();
  const tab = f.doc.querySelector("[data-scene-tab]");
  assert.equal(f.key("PageDown", tab).defaultPrevented, false);
  assert.equal(f.wheel(20, {}, tab).defaultPrevented, true);
  f.advance(600);
  assert.equal(f.y, 900);
  f.close();
});
