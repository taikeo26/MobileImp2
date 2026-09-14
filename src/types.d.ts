/// <reference types="@dfreds/foundry-types" />

// Дополнительные типы Mobile Improvements,
// которых нет в базовых типах Foundry V14.

interface Window {
  WindowManager: import("./module/windowManager").WindowManager;

  libWrapper: {
    register(
      package_id: string,
      target: string,
      fn: (...args: any[]) => any,
      type?: string,
      options?: any
    ): void;

    unregister(
      package_id: string,
      target: string,
      fail?: boolean
    ): void;
  };
}

interface MobileModeGlobal {
  enabled: boolean;

  navigation: import("./module/MobileUi").MobileUI;

  enter(): void;
  leave(): void;
  viewResize(): void;
}

declare var MobileMode: MobileModeGlobal;

interface GlobalThis {
  MobileMode: MobileModeGlobal;
}
