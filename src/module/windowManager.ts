// WindowManager is a singleton that allows management of application windows

export function activate(): void {
  if (!window.WindowManager) {
    window.WindowManager = new WindowManager();
  }
}

export function getManager(): WindowManager {
  if (!window.WindowManager) {
    activate();
  }

  return window.WindowManager;
}

/**
 * Legacy ApplicationV1 window.
 *
 * Foundry V14 still keeps ApplicationV1 for backwards compatibility,
 * so Mobile Improvements continues to support it.
 */
export class Window {
  readonly app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  get title(): string {
    return this.app.title;
  }

  get id(): number {
    return this.app.appId;
  }

  get minimized(): boolean {
    // ApplicationV1 still uses this internal state in Foundry V14.
    // @ts-ignore
    return this.app._minimized === true;
  }

  show(): void {
    if (this.minimized) {
      this.app.maximize();
    }

    this.app.bringToTop();
  }

  minimize(): void {
    if (!this.minimized) {
      this.app.minimize();
    }
  }

  close(): void {
    this.app.close();
  }
}

/**
 * Give ApplicationV2 windows their own namespace so a V1 numeric appId
 * cannot collide with a V2 application id.
 */
function v2AppId(app: ApplicationV2): string {
  return `v2_${app.id}`;
}

/**
 * Foundry V14 ApplicationV2 window.
 */
export class WindowV2 {
  readonly app: ApplicationV2;
  #id: string;

  constructor(app: ApplicationV2) {
    this.app = app;
    this.#id = v2AppId(app);
  }

  get title(): string {
    return this.app.title;
  }

  get id(): string {
    return this.#id;
  }

  get minimized(): boolean {
    return this.app.minimized;
  }

  show(): void {
    if (this.minimized) {
      this.app.maximize();
    }

    this.app.bringToFront();
  }

  minimize(): void {
    if (!this.minimized) {
      this.app.minimize();
    }
  }

  close(): void {
    this.app.close();
  }
}

export class WindowManager {
  /**
   * All currently managed pop-out windows.
   */
  windows: {
    [id: string]: Window | WindowV2;
  } = {};

  version = "1.1";

  /**
   * ApplicationV1 windows are still registered through ui.windows.
   * Keep the original Mobile Improvements proxy for those legacy apps.
   */
  windowChangeHandler: ProxyHandler<any> = {
    set: (target, property: string, value) => {
      target[property] = value;

      const appId = Number(property);

      if (!Number.isNaN(appId)) {
        this.windowAdded(appId);
      }

      /*
       * Notify Mobile Improvements after the newly-created
       * ApplicationV1 has actually rendered.
       */
      if (value?.constructor?.name) {
        Hooks.once(
          `render${value.constructor.name}`,
          (app) => {
            this.newWindowRendered(app.appId);
          }
        );
      }

      return true;
    },

    deleteProperty: (target, property) => {
      const res = delete target[property];

      const appId = Number(property);

      if (!Number.isNaN(appId)) {
        /*
         * ui.windows is modified as part of the close lifecycle.
         * Delay our cleanup until that lifecycle has completed.
         */
        setTimeout(() => {
          this.windowRemoved(appId);
        }, 1);
      }

      return res;
    },
  };

  constructor() {
    this.augmentAppV1();
    this.augmentAppV2();

    console.info(
      "Mobile Improvements | Window Manager initiated for Foundry V14"
    );

    Hooks.call("WindowManager:Init");
  }

  /**
   * Support legacy ApplicationV1 windows.
   *
   * ApplicationV1 remains available in Foundry V14 for backwards
   * compatibility, even though core Foundry now primarily uses V2.
   */
  augmentAppV1(): void {
    ui.windows = new Proxy(
      ui.windows,
      this.windowChangeHandler
    );

    const WM = this;

    window.libWrapper.register(
      "mobile-improvements",
      "Application.prototype.bringToTop",
      function () {
        WM.windowBroughtToTop(this.appId);
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "Application.prototype.minimize",
      function () {
        WM.windowMinimized(this.appId);
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "Application.prototype.maximize",
      function () {
        WM.windowMaximized(this.appId);
      },
      "LISTENER"
    );
  }

  /**
   * Foundry V14 core UI uses ApplicationV2.
   */
  augmentAppV2(): void {
    // @ts-ignore
    if (
      !globalThis.foundry?.applications?.api
        ?.ApplicationV2
    ) {
      return;
    }

    /*
     * renderApplicationV2 is the public Foundry V14 hook for
     * ApplicationV2 rendering.
     *
     * Only framed, minimizable windows belong in our window menu.
     * Permanent UI applications such as sidebar components are ignored.
     */
    Hooks.on(
      "renderApplicationV2",
      (app: ApplicationV2) => {
        if (
          app.options?.window?.frame === false ||
          app.options?.window?.minimizable === false
        ) {
          return;
        }

        const managedWindow =
          this.windowV2Added(app);

        app.element?.classList.add(
          "wm-managed"
        );

        if (managedWindow) {
          this.newWindowRendered(
            managedWindow.id
          );
        }
      }
    );

    /*
     * V14 provides a real closeApplicationV2 hook.
     * Using it is safer than wrapping ApplicationV2.close().
     */
    Hooks.on(
      "closeApplicationV2",
      (app: ApplicationV2) => {
        this.windowRemoved(
          v2AppId(app)
        );
      }
    );

    const WM = this;

    /*
     * Foundry does not provide generic hooks for bring-to-front,
     * minimize and maximize, so retain the lightweight libWrapper
     * listeners for those three operations.
     */
    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.bringToFront",
      function () {
        WM.windowBroughtToTop(
          v2AppId(this)
        );
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.minimize",
      function () {
        WM.windowMinimized(
          v2AppId(this)
        );
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.maximize",
      function () {
        WM.windowMaximized(
          v2AppId(this)
        );
      },
      "LISTENER"
    );
  }

  newWindowRendered(
    appId: number | string
  ): void {
    Hooks.call(
      "WindowManager:WindowRendered",
      appId
    );
  }

  /**
   * Register an ApplicationV1 window.
   */
  windowAdded(appId: number): void {
    const app = ui.windows?.[appId];

    if (!app) return;

    if (this.windows[appId]) return;

    /*
     * Do not manage the Window Controls module's own window.
     */
    if (
      app.constructor.name
        .toLowerCase()
        .includes("windowcontrols")
    ) {
      return;
    }

    this.windows[appId] =
      new Window(app);

    Hooks.call(
      "WindowManager:Added",
      appId
    );
  }

  /**
   * Register an ApplicationV2 window.
   *
   * renderApplicationV2 fires on re-render as well, so an already
   * registered instance must not be added again.
   */
  windowV2Added(
    app: ApplicationV2
  ): WindowV2 | undefined {
    const appId = v2AppId(app);

    const existing =
      this.windows[appId];

    if (existing?.app === app) {
      return undefined;
    }

    if (existing) {
      delete this.windows[appId];

      Hooks.call(
        "WindowManager:Removed",
        appId
      );
    }

    const managedWindow =
      new WindowV2(app);

    this.windows[appId] =
      managedWindow;

    Hooks.call(
      "WindowManager:Added",
      appId
    );

    return managedWindow;
  }

  windowRemoved(
    appId: number | string
  ): void {
    /*
     * Closing an application can cause more than one related
     * lifecycle notification. Only remove it once.
     */
    if (!this.windows[appId]) {
      return;
    }

    delete this.windows[appId];

    Hooks.call(
      "WindowManager:Removed",
      appId
    );

    this.checkEmpty();
  }

  windowBroughtToTop(
    appId: number | string
  ): void {
    if (!this.windows[appId]) {
      return;
    }

    Hooks.call(
      "WindowManager:BroughtToTop",
      appId
    );
  }

  windowMinimized(
    appId: number | string
  ): void {
    if (!this.windows[appId]) {
      return;
    }

    Hooks.call(
      "WindowManager:Minimized",
      appId
    );

    this.checkEmpty();
  }

  windowMaximized(
    appId: number | string
  ): void {
    if (!this.windows[appId]) {
      return;
    }

    Hooks.call(
      "WindowManager:Maximized",
      appId
    );
  }

  checkEmpty(): void {
    const windows =
      Object.values(this.windows);

    if (
      windows.length === 0 ||
      windows.every(
        (window) => window.minimized
      )
    ) {
      Hooks.call(
        "WindowManager:NoneVisible"
      );
    }
  }

  /**
   * Minimize every currently visible managed window.
   *
   * Returns true if at least one window actually needed minimizing.
   */
  minimizeAll(): boolean {
    let didMinimize = false;

    for (
      const window of Object.values(
        this.windows
      )
    ) {
      if (window.minimized) {
        continue;
      }

      didMinimize = true;
      window.minimize();
    }

    return didMinimize;
  }

  /**
   * Close all managed windows.
   *
   * Returns true if at least one window existed.
   */
  closeAll(): boolean {
    const windows =
      Object.values(this.windows);

    if (windows.length === 0) {
      return false;
    }

    for (const window of windows) {
      window.close();
    }

    return true;
  }
}
