import { ViewState } from "./MobileUi";
import { getSetting, settings } from "./settings";

export function initChatEffects() {
  const windowHtml = `<div id="mobile-chat-bubbles"></div>`;
  document.body.insertAdjacentHTML("beforeend", windowHtml);
  const bubbleWindow = document.getElementById("mobile-chat-bubbles")!;

  Hooks.on("createChatMessage", (newMessage: ChatMessage) => {
    if (
      !globalThis.MobileMode.enabled ||
      !newMessage.isRoll ||
      !newMessage.isAuthor
    ) {
      return;
    }

    if (getSetting(settings.SHOW_CHAT_ON_ROLL)) {
      const shouldBloop =
        globalThis.MobileMode.navigation.state === ViewState.Map ||
        window.WindowManager.minimizeAll() ||
        ui.sidebar.activeTab !== "chat";

      globalThis.MobileMode.navigation.showSidebar();
      ui.sidebar.activateTab("chat");

      if (shouldBloop) {
        Hooks.once(
          "renderChatMessageHTML",
          (obj: ChatMessage, html: HTMLElement) => {
            if (obj.id !== newMessage.id) return; // Avoid possible race condition?

            html.classList.add("bloop");
            setTimeout(() => html.classList.remove("bloop"), 10000);
          }
        );
      }
    }

    if (getSetting(settings.SHOW_ROLL_BUBBLES)) {
      Hooks.once(
        "renderChatMessageHTML",
        async (message: ChatMessage, html: HTMLElement, data) => {
          if (newMessage.id !== message.id) return; // Avoid possible race condition?

          if (html.classList.contains("dsn-hide")) {
            await new Promise<void>((resolve) => {
              Hooks.once("diceSoNiceRollComplete", () => {
                resolve();
              });
            });
          }

          const flavor = data.message.flavor
            ? `<div class="flavor">${data.message.flavor}</div>`
            : "";
          const bubbleHtml = `<div class="mi-chat-bubble">${flavor}${data.message.content}</div>`;
          bubbleWindow.insertAdjacentHTML("beforeend", bubbleHtml);
          const bubble = bubbleWindow.lastElementChild!;
          bubble.addEventListener("click", () => bubble.remove());
          // Demonlord fix
          if (game.user?.isGM) {
            bubble.querySelectorAll(".gmremove").forEach((el) => el.remove());
          } else {
            bubble.querySelectorAll(".gmonlyzero").forEach((el) => el.remove());
          }
          setTimeout(() => bubble.remove(), 15000);
        }
      );
    }
  });
}
