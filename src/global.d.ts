// Extra types not covered by foundry-pc-types
export {};
declare global {
  interface Window {
    WindowManager: import("./module/windowManager").WindowManager;
    libWrapper: {
      register(
        package_id: string,
        target: number | string,
        fn: (...args: any[]) => any,
        type?: string,
        options?: any
      ): void;
      unregister(package_id: string, target: number, fail?: boolean): void;
    };
  }

  interface AssumeHookRan {
    i18nInit: never;
    ready: never;
  }

  interface LenientGlobalVariableTypes {
    game: never;
    ui: never;
    canvas: never;
  }

  type ApplicationV2 = foundry.applications.api.ApplicationV2.Any;
}

declare module "fvtt-types/configuration" {
  interface SettingConfig {
    "window-controls.organizedMinimize": foundry.data.fields.StringField;
  }
  namespace Hooks {
    interface HookConfig {
      "mobile-improvements:enter": () => void;
      "mobile-improvements:leave": () => void;

      "WindowManager:Init": () => void;
      "WindowManager:Added": (appId: number | string) => void;
      "WindowManager:Removed": (appId: number | string) => void;
      "WindowManager:Maximized": (appId: number | string) => void;
      "WindowManager:Minimized": (appId: number | string) => void;
      "WindowManager:WindowRendered": (appId: number | string) => void;
      "WindowManager:BroughtToTop": (appId: number | string) => void;
      "WindowManager:NoneVisible": () => void;
      diceSoNiceRollComplete: () => void;
      renderPlayerList: () => void;
    }
  }
}
