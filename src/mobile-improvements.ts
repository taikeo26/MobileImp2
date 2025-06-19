import { preloadTemplates } from "./module/preloadTemplates.js";
import {
  registerSettings,
  settings,
  getSetting,
  setSetting,
} from "./module/settings.js";
import * as windowMgr from "./module/windowManager.js";
import { MobileUI } from "./module/MobileUi.js";
import { TouchInput } from "./module/touchInput.js";
import { initChatEffects } from "./module/chatEffects.js";

declare global {
  interface LenientGlobalVariableTypes {
    game: never;
    ui: never;
  }
}

function setMeta(maxScale = "1.0") {
  const meta = document.querySelector(`meta[name="viewport"]`);
  if (meta) {
    meta.setAttribute(
      "content",
      `width=device-width, initial-scale=1.0, maximum-scale=${maxScale}, user-scalable=1, interactive-widget=resizes-content`
    );
  }
}

abstract class MobileMode {
  static enabled = false;
  static navigation: MobileUI;
  static compatibilityClasses: string[] = [];

  static updateCompatibilityClasses() {
    MobileMode.compatibilityClasses.forEach((c) => {
      document.body.classList.toggle(c, MobileMode.enabled);
    });
  }

  static enter() {
    if (MobileMode.enabled) return;
    MobileMode.enabled = true;
    document.body.classList.add("mobile-improvements");
    MobileMode.navigation?.updateMode();
    MobileMode.updateCompatibilityClasses();
    setMeta();
    ui.nav?.collapse();
    Hooks.call("mobile-improvements:enter");
  }

  static leave() {
    if (!MobileMode.enabled) return;
    MobileMode.enabled = false;
    document.body.classList.remove("mobile-improvements");
    MobileMode.navigation.updateMode();
    MobileMode.updateCompatibilityClasses();
    Hooks.call("mobile-improvements:leave");
  }

  static viewResize() {
    if (game.settings && getSetting(settings.PIN_MOBILE_MODE))
      return MobileMode.enter();
    if (localStorage.getItem("mobile-improvements.pinMobileMode") === "true")
      return MobileMode.enter();

    if (window.innerWidth <= 800) {
      MobileMode.enter();
    } else {
      MobileMode.leave();
    }
  }
}

document.body.addEventListener("scroll", () => {
  document.body.scroll(0, 0);
});

function togglePlayerList(show: boolean) {
  if (show) {
    document.getElementById("players")?.classList.add("mobile-hidden");
  } else {
    document.getElementById("players")?.classList.remove("mobile-hidden");
  }
}

function showToggleModeButton(show: boolean) {
  if (!show) {
    $("#mobile-improvements-toggle").detach();
    return;
  }
  const button = $("<button>")
    .attr("id", "mobile-improvements-toggle")
    .attr("type", "button")
    .attr("data-tooltip", game.i18n.localize("MOBILEIMPROVEMENTS.EnableMobileMode"))
    .attr("data-tooltip-direction", "LEFT")
    .addClass("ui-control icon fa-solid fa-mobile-alt");
  $("#hotbar").prepend(button);
  button.on("click", () => {
    setSetting(settings.PIN_MOBILE_MODE, true);
  });
}

// Trigger the recalculation of viewheight often. Not great performance,
// but required to work on different mobile browsers
document.addEventListener("fullscreenchange", () =>
  setTimeout(MobileMode.viewResize, 100)
);
window.addEventListener("resize", MobileMode.viewResize);
window.addEventListener("scroll", MobileMode.viewResize);
MobileMode.viewResize();

Hooks.once("init", async function () {
  console.log("Mobile Improvements | Initializing Mobile Improvements");
  windowMgr.activate();

  if (MobileMode.navigation === undefined) {
    MobileMode.navigation = new MobileUI();
  }
  registerSettings({
    [settings.SHOW_PLAYER_LIST]: togglePlayerList,
    [settings.SHOW_MOBILE_TOGGLE]: showToggleModeButton,
    [settings.PIN_MOBILE_MODE]: (enabled) => {
      if (enabled) MobileMode.enter();
      else MobileMode.leave();
    },
  });
  await preloadTemplates();
});

Hooks.on("drawPrimaryCanvasGroup", () => {
  const sceneBackgroundTexture =
    //@ts-ignore
    canvas.app?.stage.rendered.environment.primary.background.texture;
  const textureSize = {
    width: sceneBackgroundTexture.width,
    height: sceneBackgroundTexture.height,
  };
  const maxTextureSize = canvas.app?.renderer.gl.getParameter(
    canvas.app?.renderer.gl.MAX_TEXTURE_SIZE
  );
  if (
    maxTextureSize &&
    Math.max(textureSize.width, textureSize.height) > maxTextureSize
  ) {
    ui.notifications.error(
      game.i18n.format("MOBILEIMPROVEMENTS.MaxTextureSizeExceeded", {
        width: textureSize.width,
        height: textureSize.height,
        maxTextureSize,
      })
    );
  }
});

Hooks.on("ready", () => {
  supressNotifications();
  // Compatibility with Window Controls
  if (game.modules?.get("window-controls")?.active) {
    MobileMode.compatibilityClasses.push("mi-window-controls");
    const organizedMinimize = game.settings.get(
      "window-controls",
      "organizedMinimize"
    );
    if (organizedMinimize == "persistentTop") {
      MobileMode.compatibilityClasses.push(
        "mi-window-controls-persistent",
        "mi-window-controls-persistent-top"
      );
    } else if (organizedMinimize == "persistentBottom") {
      MobileMode.compatibilityClasses.push(
        "mi-window-controls-persistent",
        "mi-window-controls-persistent-bottom"
      );
    }
    MobileMode.updateCompatibilityClasses();
  }
  MobileMode.navigation.render(true);
  initChatEffects();

  showToggleModeButton(getSetting(settings.SHOW_MOBILE_TOGGLE));
});

Hooks.once("renderChatLog", (app: ApplicationV2) => {
  if (!app.element) {
    return;
  }
  let touchWhenFocused = false;
  const form = app.element.querySelector(".chat-form") as HTMLFormElement;
  const textarea = form?.querySelector("#chat-message") as HTMLTextAreaElement;
  const controls = form.querySelector(".chat-controls");

  const btn = document.createElement("button");
  btn.id = "chat-form--send";
  btn.className = "ui-control";
  btn.innerHTML = `<i class="fas fa-paper-plane"></i>`;

  btn.addEventListener("touchstart", () => {
    if (document.activeElement === textarea) {
      touchWhenFocused = true;
    }
  });
  btn.addEventListener("touchend", () => {
    setTimeout(() => (touchWhenFocused = false), 100);
  });

  btn.addEventListener("click", (evt) => {
    evt.preventDefault();
    if (touchWhenFocused) {
      textarea?.focus();
    }
    console.log(app);
    //@ts-ignore
    app._onKeyDown({
      key: "Enter",
      target: textarea,
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: textarea,
    });
  });
  controls?.append(btn);
});

Hooks.once("renderSceneNavigation", () => {
  if (MobileMode.enabled) ui.nav?.collapse();
});

Hooks.once("renderPlayerList", () =>
  togglePlayerList(getSetting(settings.SHOW_PLAYER_LIST))
);

Hooks.on("getApplicationHeaderButtons", addWindowZoomControlButton);
Hooks.on("getActorSheetHeaderButtons", addWindowZoomControlButton);
Hooks.on("getHeaderControlsApplicationV2", addWindowZoomControlButton);

function addWindowZoomControlButton(app, buttons) {
  if (MobileMode.enabled) {
    buttons.unshift({
      class: "zoom",
      label: "MOBILEIMPROVEMENTS.ZoomOut",
      icon: "fa-solid fa-magnifying-glass-minus",
      onclick: () => createZoomControl(app),
      onClick: () => createZoomControl(app),
    });
  }
}

function createZoomControl(app) {
  const html = $(app.element);
  const currentZoom = getComputedStyle(html.get(0)).getPropertyValue(
    "--zoomValue"
  );
  if (html.find(".window-zoom-slider").length > 0) {
    html.find(".window-zoom-slider").remove();
  } else {
    const zoomTool = $("<div>")
      .addClass("flexrow window-zoom-slider")
      .insertAfter(html.find(".window-header"));
    const zoomSlider = $("<input>")
      .attr("type", "range")
      .attr("min", 0.5)
      .attr("max", 1)
      .attr("step", 0.1)
      .val(currentZoom)
      .on("input", function () {
        const newZoomValue = $(this).val() as number;
        html.get(0).style.setProperty("--zoomValue", newZoomValue);
        setMeta(newZoomValue < 1 ? "2.0" : "1.0");
      })
      .on("change", function () {
        const orderedClasses = [...html.get(0).classList]
          .filter((c) => !["app", "window-app", "application", "wm-managed"].includes(c))
          .sort()
          .join(" ");
        setSetting(
          settings.WINDOWS_ZOOM_VALUES,
          foundry.utils.mergeObject(
            getSetting(settings.WINDOWS_ZOOM_VALUES),
            { [orderedClasses]: $(this).val() }
          )
        );
      })
      .appendTo(zoomTool);
    const zoomHide = $("<i>")
      .addClass("toggle fas fa-caret-up")
      .on("click", function () {
        $(this).closest(".window-zoom-slider").remove();
      })
      .appendTo(zoomTool);
  }
}

Hooks.on("renderFormApplication", setWindowZoomValueFromStorage);
Hooks.on("renderActorSheet", setWindowZoomValueFromStorage);
Hooks.on("renderApplicationV2", setWindowZoomValueFromStorage);

Hooks.on("renderSettingsConfig", (app, html: HTMLElement) => {
  if (!MobileMode.enabled) {
    return;
  }
  const sidebar = html.querySelector(
    `aside[data-application-part="sidebar"]`
  ) as HTMLElement;
  const toggle = document.createElement("div");
  toggle.className = "sidebar-toggle";
  toggle.innerHTML = `<i class="fas fa-caret-left"></i>`;
  sidebar?.insertAdjacentElement("afterend", toggle);

  toggle.addEventListener("click", () => {
    const visible = sidebar.style.display !== "none";
    const icon = toggle.firstElementChild!;
    if (visible) {
      icon.classList.remove("fa-caret-left");
      icon.classList.add("fa-caret-right");
      sidebar.style.display = "none";
    } else {
      icon.classList.remove("fa-caret-right");
      icon.classList.add("fa-caret-left");
      sidebar.style.display = "";
    }
  });
});

Hooks.on("WindowManager:Maximized", onMainWindowChanged);
Hooks.on("WindowManager:Minimized", onMainWindowChanged);
Hooks.on("WindowManager:Removed", onMainWindowChanged);

function setMetaForWindow(html: HTMLElement | JQuery<HTMLElement> | undefined) {
  if (MobileMode.enabled && html) {
    const elem = "get" in html ? html.get(0) : html;
    const isZoomed =
      elem &&
      parseFloat(getComputedStyle(elem).getPropertyValue("--zoomValue")) < 1;
    setMeta(isZoomed ? "2.0" : "1.0");
  }
}

function onMainWindowChanged() {
  if (MobileMode.enabled) {
    const currentWindow = Object.values(windowMgr.getManager().windows).find(
      (w) => !w.minimized
    );
    if (currentWindow) {
      setMetaForWindow(currentWindow.app.element);
    } else {
      setMeta("1.0");
    }
  }
}

function setWindowZoomValueFromStorage(app, html) {
  const elem = "get" in html ? html.get(0) : html;
  if (MobileMode.enabled) {
    const settingObjectValue = getSetting(settings.WINDOWS_ZOOM_VALUES);
    const orderedClasses = [...elem.classList]
      .filter((c) => !["app", "window-app", "application", "wm-managed"].includes(c))
      .sort()
      .join(" ");
    elem
      .style.setProperty(
        "--zoomValue",
        settingObjectValue[orderedClasses] || 1
      );
  }
}

function supressNotifications() {
  window.libWrapper.register(
    "mobile-improvements",
    "ui.notifications.notify",
    function (wrapped, ...args) {
      if (
        [
          "ERROR.LowResolution",
          "ERROR.RESOLUTION.Window",
          "ERROR.RESOLUTION.Screen",
          "ERROR.RESOLUTION.Scale",
        ].includes(args[0])
      ) {
        console.info("notification suppressed", args);
        return;
      }
      return wrapped(...args);
    }
  );
}

const touchInput = new TouchInput();
Hooks.on("canvasReady", () => touchInput.hook());

globalThis.MobileMode = MobileMode;
