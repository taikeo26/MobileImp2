import { ViewState } from "./MobileUi.js";
import { getSetting, settings } from "./settings.js";

/**
 * Бросок считается скрытым для интерфейса модуля,
 * если его результат не видит ни один обычный игрок.
 *
 * Это включает:
 * - PF2e Secret checks
 * - Blind Rolls
 * - броски только для GM
 */
function isRollHiddenFromAllPlayers(message: ChatMessage): boolean {
  if (!message.isRoll) return false;

  const players = (game.users?.contents ?? []).filter(
    (user) => !user.isGM
  );

  if (players.length === 0) return false;

  const whisperIds = new Set(message.whisper ?? []);

  // Если whisper пустой — сообщение публичное.
  if (whisperIds.size === 0) return false;

  const authorId =
    message.author?.id ??
    message.user?.id ??
    message.user;

  for (const player of players) {
    // Автор обычного private/GM/self roll видит свой бросок.
    // Blind roll — исключение.
    if (player.id === authorId && !message.blind) {
      return false;
    }

    // Игрок, которому сообщение явно отправлено через whisper,
    // тоже видит его.
    if (whisperIds.has(player.id)) {
      // Но автор blind roll собственного результата не видит.
      if (message.blind && player.id === authorId) {
        continue;
      }

      return false;
    }
  }

  return true;
}

/**
 * Для GM добавляет в карточку жирную подпись
 * "Скрытая проверка".
 *
 * Игрокам эта метка никогда не добавляется,
 * чтобы не раскрывать сам факт скрытого броска.
 */
function markHiddenRollsForGM() {
  Hooks.on(
    "renderChatMessageHTML",
    (message: ChatMessage, html: HTMLElement) => {
      if (
        !game.user?.isGM ||
        !isRollHiddenFromAllPlayers(message)
      ) {
        return;
      }

      // Защита от повторного добавления при перерисовке.
      if (html.querySelector(".mi-hidden-roll-label")) {
        return;
      }

      html.classList.add("mi-hidden-roll");

      const label = document.createElement("div");

      label.className = "mi-hidden-roll-label";
      label.textContent = "Скрытая проверка";

      const content =
        html.querySelector(".message-content") ?? html;

      content.prepend(label);
    }
  );
}

export function initChatEffects() {
  const windowHtml =
    `<div id="mobile-chat-bubbles"></div>`;

  if (!document.getElementById("mobile-chat-bubbles")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      windowHtml
    );
  }

  const bubbleWindow =
    document.getElementById("mobile-chat-bubbles")!;

  markHiddenRollsForGM();

  Hooks.on(
    "createChatMessage",
    (newMessage: ChatMessage) => {
      if (
        !globalThis.MobileMode.enabled ||
        !newMessage.isRoll ||
        !newMessage.isAuthor
      ) {
        return;
      }

      /*
       * При броске открываем вкладку чата.
       *
       * В Foundry V14 вместо старых:
       *   ui.sidebar.activeTab
       *   ui.sidebar.activateTab(...)
       *
       * используются:
       *   ui.sidebar.tabGroups
       *   ui.sidebar.changeTab(...)
       */
      if (getSetting(settings.SHOW_CHAT_ON_ROLL)) {
        const activeTab =
          ui.sidebar?.tabGroups?.primary;

        const shouldBloop =
          globalThis.MobileMode.navigation.state ===
            ViewState.Map ||
          window.WindowManager.minimizeAll() ||
          activeTab !== "chat";

        globalThis.MobileMode.navigation.showSidebar();

        ui.sidebar?.changeTab(
          "chat",
          "primary",
          { force: true }
        );

        if (shouldBloop) {
          Hooks.once(
            "renderChatMessageHTML",
            (
              obj: ChatMessage,
              html: HTMLElement
            ) => {
              if (obj.id !== newMessage.id) {
                return;
              }

              html.classList.add("bloop");

              setTimeout(
                () => html.classList.remove("bloop"),
                10000
              );
            }
          );
        }
      }

      /*
       * Плавающие roll bubbles.
       *
       * В старом Mobile Improvements скрытый бросок
       * потенциально мог скопироваться в отдельный bubble.
       *
       * В V14 сначала проверяем фактическую видимость
       * содержимого для текущего пользователя.
       */
      if (getSetting(settings.SHOW_ROLL_BUBBLES)) {
        if (!newMessage.isContentVisible) {
          return;
        }

        Hooks.once(
          "renderChatMessageHTML",
          async (
            message: ChatMessage,
            html: HTMLElement
          ) => {
            if (newMessage.id !== message.id) {
              return;
            }

            /*
             * Совместимость с Dice So Nice.
             */
            if (html.classList.contains("dsn-hide")) {
              await new Promise<void>((resolve) => {
                Hooks.once(
                  "diceSoNiceRollComplete",
                  () => resolve()
                );
              });
            }

            const flavor = message.flavor
              ? `<div class="flavor">${message.flavor}</div>`
              : "";

            const bubbleHtml =
              `<div class="mi-chat-bubble">` +
              `${flavor}${message.content}` +
              `</div>`;

            bubbleWindow.insertAdjacentHTML(
              "beforeend",
              bubbleHtml
            );

            const bubble =
              bubbleWindow.lastElementChild!;

            bubble.addEventListener(
              "click",
              () => bubble.remove()
            );

            /*
             * Совместимость с Demon Lord.
             */
            if (game.user?.isGM) {
              bubble
                .querySelectorAll(".gmremove")
                .forEach((el) => el.remove());
            } else {
              bubble
                .querySelectorAll(".gmonlyzero")
                .forEach((el) => el.remove());
            }

            setTimeout(
              () => bubble.remove(),
              15000
            );
          }
        );
      }
    }
  );
}
