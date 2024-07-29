import { preloadTemplates } from "./module/preloadTemplates.js";
import {
  registerSettings,
  settings,
  getSetting,
  setSetting,
} from "./module/settings.js";
import * as windowMgr from "./module/windowManager.js";
import { MobileUI, ViewState } from "./module/MobileUi.js";
import { viewHeight } from "./module/util.js";
import { TouchInput } from "./module/touchInput.js";

declare global {
  interface LenientGlobalVariableTypes {
    game: never;
    ui: never;
  }
}

function setMeta(maxScale="1.0") {
  const meta = document.querySelector(`meta[name="viewport"]`);
  if (meta) {
    meta.setAttribute(
      "content",
      `width=device-width, initial-scale=1.0, maximum-scale=${maxScale}, user-scalable=1`
    );
  }
}

abstract class MobileMode {
  static enabled = false;
  static navigation: MobileUI;

  static enter() {
    if (MobileMode.enabled) return;
    MobileMode.enabled = true;
    document.body.classList.add("mobile-improvements");
    setMeta();
    ui.nav?.collapse();
    viewHeight();
    Hooks.call("mobile-improvements:enter");
  }

  static leave() {
    if (!MobileMode.enabled) return;
    MobileMode.enabled = false;
    document.body.classList.remove("mobile-improvements");
    Hooks.call("mobile-improvements:leave");
  }

  static viewResize() {
    if (MobileMode.enabled) viewHeight();

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
  const button = $(
    `<a id="mobile-improvements-toggle"><i class="fas fa-mobile-alt"></i> ${game.i18n.localize(
      "MOBILEIMPROVEMENTS.EnableMobileMode"
    )}</a>`
  );
  $("body").append(button);
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

Hooks.on("ready", () => {
  MobileMode.navigation.render(true);
  showToggleModeButton(getSetting(settings.SHOW_MOBILE_TOGGLE));
});

Hooks.once("renderChatLog", (app: Application) => {
  let touchWhenFocused = false;
  const form = app.element.find("#chat-form");
  const textarea = form.find("#chat-message").get(0);
  const btn = $(
    `<button id="chat-form--send"><i class="fas fa-paper-plane"></i></button>`
  );

  btn.on("touchstart", () => {
    if (document.activeElement === textarea) {
      touchWhenFocused = true;
    }
  });
  btn.on("touchend", () => {
    setTimeout(() => (touchWhenFocused = false), 100);
  });

  btn.on("click", (evt) => {
    evt.preventDefault();
    if (touchWhenFocused) {
      textarea?.focus();
    }
    //@ts-ignore
    app._onChatKeyDown({
      code: "Enter",
      originalEvent: {},
      preventDefault: () => {},
      currentTarget: textarea,
    });
  });
  form.append(btn);
});

Hooks.once("renderSceneNavigation", () => {
  if (MobileMode.enabled) ui.nav?.collapse();
});

Hooks.once("renderPlayerList", () =>
  togglePlayerList(getSetting(settings.SHOW_PLAYER_LIST))
);

Hooks.on("createChatMessage", (message: ChatMessage) => {
  if (!MobileMode.enabled || !message.isAuthor) return;

  const shouldBloop =
    MobileMode.navigation.state === ViewState.Map ||
    window.WindowManager.minimizeAll() ||
    ui.sidebar.activeTab !== "chat";

  MobileMode.navigation.showSidebar();
  ui.sidebar.activateTab("chat");

  if (shouldBloop) {
    Hooks.once("renderChatMessage", (obj: ChatMessage, html: JQuery) => {
      if (obj.id !== message.id) return; // Avoid possible race condition?

      html.addClass("bloop");
      setTimeout(() => html.removeClass("bloop"), 10000);
    });
  }
});

Hooks.on("getApplicationHeaderButtons", addWindowZoomControlButton);
Hooks.on("getActorSheetHeaderButtons", addWindowZoomControlButton);

function addWindowZoomControlButton(app, buttons) {
  if (MobileMode.enabled) {
    buttons.unshift({
      class: "zoom",
      icon: "fa-solid fa-magnifying-glass-minus",
      onclick: () => {
        const html = $(app.element);
        const currentZoom = getComputedStyle(html.get(0)).getPropertyValue("--zoomValue");
        if (html.find(".window-zoom-slider").length > 0) {
          html.find(".window-zoom-slider").remove();
        } else {
          const zoomTool = $("<div>").addClass("flexrow window-zoom-slider")
            .insertAfter(html.find(".window-header"));
          const zoomSlider = $("<input>").attr("type", "range")
            .attr("min", 0.5).attr("max", 1).attr("step", 0.1).val(currentZoom)
            .on("input", function() {
              const newZoomValue = $(this).val() as number;
              html.get(0).style.setProperty("--zoomValue", newZoomValue);
              setMeta(newZoomValue < 1 ? "2.0" : "1.0");
            })
            .on("change", function() {
              const orderedClasses = [...html.get(0).classList].filter(c => !["app", "window-app"].includes(c)).sort().join(" ");
              setSetting(settings.WINDOWS_ZOOM_VALUES, foundry.utils.mergeObject(getSetting(settings.WINDOWS_ZOOM_VALUES), {[orderedClasses]: $(this).val()}));
            })
            .appendTo(zoomTool);
          const zoomHide = $("<i>").addClass("toggle fas fa-caret-up")
            .on("click", function() {
              $(this).closest(".window-zoom-slider").remove();
            })
            .appendTo(zoomTool);
        }
      }
    });
  }
}

Hooks.on("renderFormApplication", setWindowZoomValueFromStorage);
Hooks.on("renderActorSheet", setWindowZoomValueFromStorage);

Hooks.on("WindowManager:Maximized", onMainWindowChanged);
Hooks.on("WindowManager:Minimized", onMainWindowChanged);
Hooks.on("WindowManager:Removed", onMainWindowChanged);

function setMetaForWindow(html) {
  if (MobileMode.enabled) {
    const elem = html.get(0);
    const isZoomed = elem && parseFloat(getComputedStyle(elem).getPropertyValue("--zoomValue")) < 1;
    setMeta(isZoomed ? "2.0" : "1.0");
  }
}

function onMainWindowChanged() {
  if (MobileMode.enabled) {
    const currentWindow = Object.values(windowMgr.getManager().windows).find(w => !w.minimized);
    if (currentWindow) {
      setMetaForWindow(currentWindow.app.element);
    } else {
      setMeta("1.0");
    }
  }
}

function setWindowZoomValueFromStorage(app, html) {
  if (MobileMode.enabled) {
    const settingObjectValue = getSetting(settings.WINDOWS_ZOOM_VALUES);
    const orderedClasses = [...html.get(0).classList].filter(c => !["app", "window-app"].includes(c)).sort().join(" ");
    html.get(0).style.setProperty("--zoomValue", settingObjectValue[orderedClasses] || 1);
  }
}

const notificationQueueProxy = {
  get: function (target, key) {
    if (key === "__isProxy") return true;

    if (key === "push") {
      return (...arg) => {
        if (Hooks.call("queuedNotification", ...arg)) {
          target.push(...arg);
        }
      };
    }
    return target[key];
  },
};

Hooks.once("renderNotifications", (app) => {
  if (!app.queue.__isProxy) {
    app.queue = new Proxy(app.queue, notificationQueueProxy);
  }
});

const touchInput = new TouchInput();
Hooks.on("canvasReady", () => touchInput.hook());

Hooks.on("queuedNotification", (notif) => {
  if (typeof notif.message === "string") {
    const regex = /\s.+px/g;
    const message = notif.message?.replace(regex, "");
    //@ts-ignore
    const match = game.i18n.translations.ERROR.LowResolution.replace(regex, "");

    if (message == match) {
      console.log("notification suppressed", notif);
      return false;
    }
  }
});

globalThis.MobileMode = MobileMode;
