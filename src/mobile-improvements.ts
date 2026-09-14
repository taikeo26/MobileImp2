@use "sass:math";

$navigationHeight: 50px;
$drawerWidth: 300px;

html,
body {
  overscroll-behavior: none;
}

body.mobile-improvements {
  overflow: hidden;

  #ui-left {
    pointer-events: none;
  }

  #ui-top {
    left: 0;
    right: 0;
  }

  #ui-middle {
    pointer-events: none;
  }

  #ui-bottom {
    left: 0;
    right: 0;
  }

  #players {
    z-index: 100;
  }

  #navigation {
    display: none;
  }

  #hotbar {
    position: fixed;
    bottom: $navigationHeight;
    left: 0;
    right: 0;
    width: auto;
    margin: 0;
    z-index: 90;

    transform: translateY(100%);
    transition: transform 0.2s ease;

    pointer-events: auto;
  }

  &.show-hotbar #hotbar {
    transform: translateY(0);
  }

  #sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: $navigationHeight;

    width: 100%;
    max-width: none;

    z-index: 80;

    transition:
      transform 0.2s ease,
      opacity 0.2s ease;

    pointer-events: auto;
  }

  &.mobile-map #sidebar {
    transform: translateX(100%);
    opacity: 0;
    pointer-events: none;
  }

  &.mobile-app #sidebar {
    transform: translateX(0);
    opacity: 1;
  }

  &.hide-hud #sidebar {
    transform: translateX(100%);
    opacity: 0;
    pointer-events: none;
  }

  #sidebar-tabs {
    flex: 0 0 auto;
  }

  #sidebar-content {
    overflow: hidden auto;
  }

  #chat-log {
    padding-bottom: 0.5rem;
  }

  #chat-form {
    flex: 0 0 auto;
  }

  #chat-form .chat-controls,
  .chat-form .chat-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  #chat-form--send {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    min-width: 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;
  }

  /*
   * В старом Mobile Improvements здесь было глобальное:
   *
   * .chat-message {
   *   background-color: #d8d7cc;
   * }
   *
   * Оно перекрашивало абсолютно все сообщения одним цветом
   * и уничтожало штатное визуальное различие public/private/blind.
   *
   * В V14 фон ChatMessage больше не переопределяем вообще.
   */

  .chat-message {
    max-width: 100%;
  }

  /*
   * Метка для бросков, результата которых не видит
   * ни один обычный игрок.
   *
   * Само добавление элемента выполняется в chatEffects.ts
   * только на клиенте GM.
   */
  .mi-hidden-roll-label {
    display: block;

    margin: 0 0 0.35rem;
    padding: 0;

    font-weight: 700;
    line-height: 1.2;
  }

  /*
   * Не задаём скрытым сообщениям новый фон.
   * Так сохраняются системные стили Foundry/PF2e.
   */
  .mi-hidden-roll {
    .mi-hidden-roll-label {
      font-weight: 700;
    }
  }

  #mobile-chat-bubbles {
    position: fixed;

    left: 0.5rem;
    right: 0.5rem;
    bottom: calc(#{$navigationHeight} + 0.5rem);

    z-index: 110;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    gap: 0.35rem;

    pointer-events: none;

    .mi-chat-bubble {
      max-height: 40vh;
      overflow: hidden auto;

      padding: 0.5rem;

      border-radius: 4px;

      background: rgba(0, 0, 0, 0.85);
      color: white;

      box-shadow: 0 0 8px rgba(0, 0, 0, 0.45);

      pointer-events: auto;

      .flavor {
        margin-bottom: 0.25rem;

        font-size: 0.9em;
        font-style: italic;
      }

      .dice-roll {
        color: inherit;
      }

      .dice-formula,
      .dice-total {
        color: inherit;
      }
    }
  }

  #mobile-navigation {
    position: fixed;

    left: 0;
    right: 0;
    bottom: 0;

    height: $navigationHeight;

    z-index: 120;

    display: flex;
    align-items: stretch;

    background: rgba(20, 20, 20, 0.95);

    pointer-events: auto;

    ul {
      width: 100%;
      height: 100%;

      display: flex;
      flex-direction: row;

      margin: 0;
      padding: 0;

      list-style: none;
    }

    li {
      position: relative;

      flex: 1 1 0;

      display: flex;
      align-items: center;
      justify-content: center;

      min-width: 0;

      cursor: pointer;

      &.disabled {
        opacity: 0.4;
        pointer-events: none;
      }

      &.active {
        background: rgba(255, 255, 255, 0.1);
      }

      i {
        pointer-events: none;
      }

      .count {
        position: absolute;

        top: 2px;
        right: calc(50% - 18px);

        min-width: 16px;
        height: 16px;

        padding: 0 4px;

        border-radius: 8px;

        display: flex;
        align-items: center;
        justify-content: center;

        font-size: 10px;

        background: #900;
        color: white;
      }
    }
  }

  #show-mobile-navigation {
    position: fixed;

    left: 50%;
    bottom: $navigationHeight;

    z-index: 121;

    width: 44px;
    height: 22px;

    transform: translateX(-50%);

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 6px 6px 0 0;

    background: rgba(20, 20, 20, 0.95);

    cursor: pointer;

    pointer-events: auto;
  }

  &.hide-hud {
    #mobile-navigation {
      transform: translateY(100%);
    }

    #show-mobile-navigation {
      bottom: 0;

      i {
        transform: rotate(180deg);
      }
    }
  }

  .drawer {
    position: fixed;

    right: 0;
    bottom: $navigationHeight;

    width: min($drawerWidth, 90vw);
    max-height: calc(100vh - #{$navigationHeight});

    z-index: 100;

    overflow: auto;

    transform: translateX(100%);
    transition: transform 0.2s ease;

    pointer-events: auto;

    &.open {
      transform: translateX(0);
    }
  }

  .window-app,
  .application {
    --zoomValue: 1;

    transform-origin: top left;
  }

  .window-zoom-slider {
    flex: 0 0 auto;

    padding: 0.25rem 0.5rem;

    align-items: center;
    gap: 0.5rem;

    input[type="range"] {
      flex: 1 1 auto;
    }

    .toggle {
      flex: 0 0 auto;
      cursor: pointer;
    }
  }

  .mobile-hidden {
    display: none !important;
  }

  /*
   * Настройки Foundry V14.
   */
  .sidebar-toggle {
    position: absolute;

    top: 50%;
    left: -20px;

    width: 20px;
    height: 40px;

    transform: translateY(-50%);

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;

    z-index: 10;
  }

  /*
   * Когда используется Window Controls, не допускаем,
   * чтобы нижняя мобильная панель перекрывала его элементы.
   */
  &.mi-window-controls-persistent-bottom {
    #mobile-navigation {
      bottom: 0;
    }
  }
}

/*
 * Не ограничиваем эти правила mobile mode,
 * потому что плавающие bubbles создаются отдельным контейнером.
 */
#mobile-chat-bubbles:empty {
  display: none;
}

.bloop {
  animation: mi-bloop 0.3s ease;
}

@keyframes mi-bloop {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }

  100% {
    transform: scale(1);
  }
}
