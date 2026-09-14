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
    // @ts-ignore
    return this.app._minimized;
  }

  show(): void {
    if (this.minimized) {
      this.app.maximize();
    }
    this.app.bringToTop();
  }
  minimize(): void {
    this.app.minimize();
  }
  close(): void {
    this.app.close();
  }
}

function v2AppId(app: ApplicationV2): string {
  return "v2_" + app.id;
}

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
    this.app.minimize();
  }
  close(): void {
    this.app.close();
  }
}

export class WindowManager {
  // All windows
  windows: { [id: string]: Window | WindowV2 } = {};
  version = "1.0";
  windowChangeHandler: ProxyHandler<any> = {
    set: (target, property: string, value) => {
      target[property] = value;
      this.windowAdded(parseInt(property as string));
      // Hook for new window being rendered
      Hooks.once("render" + value.constructor.name, (app) =>
        this.newWindowRendered(app.appId)
      );
      return true;
    },
    deleteProperty: (target, property) => {
      const res = delete target[property];
      setTimeout(() => {
        this.windowRemoved(parseInt(property as string));
      }, 1);
      return res;
    },
  };

  constructor() {
    this.augmentAppV1();
    this.augmentAppV2();
    console.info("Window Manager | Initiated");
    Hooks.call("WindowManager:Init");
  }

  augmentAppV1() {
    ui.windows = new Proxy(ui.windows, this.windowChangeHandler);

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

  augmentAppV2() {
    //@ts-ignore
    if (!globalThis.foundry?.applications?.api?.ApplicationV2) {
      return;
    }

    Hooks.on("renderApplicationV2", (app: ApplicationV2) => {
      if (
        app.options?.window?.frame === false ||
        app.options?.window?.minimizable === false
      ) {
        return;
      }

      const newWindow = this.windowV2Added(app);
      app.element?.classList.add("wm-managed");
      newWindow && this.newWindowRendered(newWindow.id);
    });

    const WM = this;

    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.bringToFront",
      function () {
        WM.windowBroughtToTop(v2AppId(this));
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.minimize",
      function () {
        WM.windowMinimized(v2AppId(this));
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.maximize",
      function () {
        WM.windowMaximized(v2AppId(this));
      },
      "LISTENER"
    );

    window.libWrapper.register(
      "mobile-improvements",
      "foundry.applications.api.ApplicationV2.prototype.close",
      function () {
        WM.windowRemoved(v2AppId(this));
      },
      "LISTENER"
    );
  }

  newWindowRendered(appId: number | string): void {
    Hooks.call("WindowManager:WindowRendered", appId);
  }

  windowAdded(appId: number): void {
    if (
      this.windows[appId] ||
      ui.windows[appId].constructor.name
        .toLowerCase()
        .includes("windowcontrols")
    )
      return;

    this.windows[appId] = new Window(ui.windows[appId]);
    Hooks.call("WindowManager:Added", appId);
  }

  windowV2Added(app: ApplicationV2) {
    const appId = v2AppId(app);

    if (this.windows[appId]?.app === app) return;

    const previous = this.windows[appId];
    this.windows[appId] = new WindowV2(app);

    if (previous) {
      Hooks.call("WindowManager:Removed", appId);
    }

    Hooks.call("WindowManager:Added", appId);
    return this.windows[appId];
  }

  windowRemoved(appId: number | string): void {
    delete this.windows[appId];
    Hooks.call("WindowManager:Removed", appId);
    this.checkEmpty();
  }

  windowBroughtToTop(appId: number | string): void {
    Hooks.call("WindowManager:BroughtToTop", appId);
  }

  windowMinimized(appId: number | string): void {
    Hooks.call("WindowManager:Minimized", appId);
    this.checkEmpty();
  }

  windowMaximized(appId: number | string): void {
    Hooks.call("WindowManager:Maximized", appId);
  }

  checkEmpty(): void {
    const windows = Object.values(this.windows);

    if (
      windows.length === 0 ||
      windows.every((w) => w.minimized)
    ) {
      Hooks.call("WindowManager:NoneVisible");
    }
  }

  minimizeAll(): boolean {
    return Object.values(this.windows).reduce(
      (didMinimize, window) => {
        didMinimize = didMinimize || !window.minimized;
        window.minimize();
        return didMinimize;
      },
      false
    );
  }

  closeAll(): boolean {
    const closed = Object.keys(this.windows).length != 0;

    Object.values(this.windows).forEach((window) => {
      window.close();
    });

    return closed;
  }
}
