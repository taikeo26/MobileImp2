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

abstract class MobileMode {
  static enabled = false;
  static navigation: MobileUI;

  static enter() {
    if (MobileMode.enabled) return;
    MobileMode.enabled = true;
    document.body.classList.add("mobile-improvements");
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
