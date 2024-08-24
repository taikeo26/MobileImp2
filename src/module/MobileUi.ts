import { settings, getSetting } from "./settings.js";
import { WindowMenu } from "./windowMenu.js";
import { MobileMenu } from "./mobileMenu.js";

export enum ViewState {
  Unloaded,
  Map,
  App,
}
enum DrawerState {
  None,
  Macros = "macros",
  Menu = "menu",
  Windows = "windows",
}

function isTabletMode() {
  return globalThis.MobileMode.enabled && window.innerWidth > 900;
}

export class MobileUI extends Application {
  state: ViewState = ViewState.Unloaded;
  drawerState: DrawerState = DrawerState.None;
  noCanvas = false;

  windowMenu: WindowMenu;
  mobileMenu: MobileMenu;

  constructor() {
    super({
      template: "modules/mobile-improvements/templates/navigation.hbs",
      popOut: false,
    });

    this.windowMenu = new WindowMenu(this);
    this.mobileMenu = new MobileMenu(this);

    // Ensure HUD shows on opening a new window
    Hooks.on("WindowManager:NewRendered", () => this._onShowWindow());
    Hooks.on("WindowManager:BroughtToTop", () => this._onShowWindow());
    Hooks.on("WindowManager:NoneVisible", () => this._onHideAllWindows());
  }

  _onShowWindow(): void {
    this.toggleHud(true);
    $(document.body).addClass("windows-open");

    if (isTabletMode()) {
      this.showSidebar();
    }
  }

  _onHideAllWindows(): void {
    $(document.body).removeClass("windows-open");
  }

  render(force: boolean, ...arg: unknown[]): unknown {
    this.noCanvas = game.settings.get("core", "noCanvas") as boolean;
    this.state = this.noCanvas ? ViewState.App : ViewState.Map;

    //@ts-ignore
    const r = super.render(force, ...arg);
    this.windowMenu.render(force);
    this.mobileMenu.render(force);
    return r;
  }

  activateListeners(html: JQuery<HTMLElement>): void {
    html.find("li").on("click", (evt) => {
      const [firstClass] = evt.currentTarget.className.split(" ");
      const [, name] = firstClass.split("-");
      this.selectItem(name);
    });
    this.updateMode();
    html.before(
      `<div id="show-mobile-navigation"><i class="fas fa-chevron-up"></i></div>`
    );
    html.siblings("#show-mobile-navigation").on("click", () => {
      this.toggleHud();
    });
    if (this.noCanvas) {
      this.element.find(".navigation-map").detach();
    }
  }

  expandSidebarWithoutAnimation() {
    //@ts-ignore
    if ( !ui.sidebar._collapsed ) return;
    const sidebar = ui.sidebar.element;
    const tab = sidebar.find(".sidebar-tab.active");
    const tabs = sidebar.find("#sidebar-tabs");
    const icon = tabs.find("a.collapse i");
    sidebar.css({width: "", height: ""});
    sidebar.removeClass("collapsed");
    tab.css({display: "", height: ""});
    icon.removeClass("fa-caret-left").addClass("fa-caret-right");
    //@ts-ignore
    ui.sidebar._collapsed = false;
    //@ts-ignore
    Hooks.callAll("collapseSidebar", ui.sidebar, ui.sidebar._collapsed);
  }

  collapseSidebarWithoutAnimation() {
    //@ts-ignore
    if ( ui.sidebar._collapsed ) return;
    const sidebar = ui.sidebar.element;
    const tab = sidebar.find(".sidebar-tab.active");
    const tabs = sidebar.find("#sidebar-tabs");
    const icon = tabs.find("a.collapse i");
    sidebar.css("height", "");
    sidebar.addClass("collapsed");
    tab.css("display", "");
    icon.removeClass("fa-caret-right").addClass("fa-caret-left");
    //@ts-ignore
    ui.sidebar._collapsed = true;
    //@ts-ignore
    Hooks.callAll("collapseSidebar", ui.sidebar, ui.sidebar._collapsed);
  }

  toggleHud(show: boolean = false): void {
    const isHidden = document.body.classList.contains("hide-hud");
    if (isHidden || show) {
      this.expandSidebarWithoutAnimation();
      $(document.body).removeClass("hide-hud");
    } else {
      $(document.body).addClass("hide-hud");
      this.collapseSidebarWithoutAnimation();
    }
  }

  closeDrawer(): void {
    this.setDrawerState(DrawerState.None);
  }

  showMap(): void {
    const minimized = window.WindowManager.minimizeAll();
    if (!minimized && this.state == ViewState.Map) {
      this.toggleHud();
    }
    this.state = ViewState.Map;
    canvas.ready && canvas.app?.start();
    this.setDrawerState(DrawerState.None);
    this.updateMode();
  }

  showSidebar(): void {
    this.state = ViewState.App;
    this.toggleHud(true);
    ui.sidebar?.expand();
    if (!isTabletMode()) window.WindowManager.minimizeAll();

    if (getSetting(settings.SIDEBAR_PAUSES_RENDER) === true) {
      // canvas.ready && canvas.app.stop();
    }
    this.setDrawerState(DrawerState.None);
    this.updateMode();
  }

  showHotbar(): void {
    $(document.body).addClass("show-hotbar");
    ui.hotbar.expand();
  }

  hideHotbar(): void {
    $(document.body).removeClass("show-hotbar");
  }

  setWindowCount(count: number): void {
    this.element.find(".navigation-windows .count").html(count.toString());
    if (count === 0) {
      this.element.find(".navigation-windows").addClass("disabled");
    } else {
      this.element.find(".navigation-windows").removeClass("disabled");
    }
    if (this.drawerState == DrawerState.Windows) {
      this.setDrawerState(DrawerState.None);
    }
  }

  setDrawerState(state: DrawerState): void {
    $(`body > .drawer`).removeClass("open");
    this.element.find(".toggle.active").removeClass("active");
    this.hideHotbar();
    if (state == DrawerState.None || state == this.drawerState) {
      this.drawerState = DrawerState.None;
      return;
    }

    this.drawerState = state;
    if (state == DrawerState.Macros) {
      this.showHotbar();
    } else {
      $(`body > .drawer.drawer-${state}`).addClass("open");
    }
    this.element.find(`.navigation-${state}`).addClass("active");
  }

  selectItem(name: string): void {
    switch (name) {
      case "map":
        this.showMap();
        break;
      case "sidebar":
        this.showSidebar();
        break;
      default:
        this.setDrawerState(name as DrawerState);
    }
  }

  updateMode(): void {
    if (globalThis.MobileMode.enabled) {
      this.element.find(".active:not(.toggle)").removeClass("active");
      $(document.body).removeClass("mobile-app");
      $(document.body).removeClass("mobile-map");

      switch (this.state) {
        case ViewState.Map:
          this.element.find(".navigation-map").addClass("active");
          $(document.body).addClass("mobile-map");
          this.collapseSidebarWithoutAnimation();
          break;
        case ViewState.App:
          this.element.find(".navigation-sidebar").addClass("active");
          $(document.body).addClass("mobile-app");
          this.expandSidebarWithoutAnimation();
          break;
        default:
          break;
      }
    } else {
      this.expandSidebarWithoutAnimation();
    }
  }
}
