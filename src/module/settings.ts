const MODULE_NAME = "mobile-improvements"; // TODO: Better handling

export enum settings {
  // In config
  SIDEBAR_PAUSES_RENDER = "sideBarPausesRender",
  SHOW_MOBILE_TOGGLE = "showMobileToggle",
  SHOW_CHAT_ON_ROLL = "showChatOnRoll",
  // Not in config
  SHOW_PLAYER_LIST = "showPlayerList",
  PIN_MOBILE_MODE = "pinMobileMode",
  WINDOWS_ZOOM_VALUES = "windowZoomValues",
}

interface Callbacks {
  [setting: string]: (value) => void;
}

const moduleSettings = [
  {
    setting: settings.SIDEBAR_PAUSES_RENDER,
    name: "MOBILEIMPROVEMENTS.SettingsPauseRendering",
    hint: "MOBILEIMPROVEMENTS.SettingsPauseRenderingHint",
    type: Boolean,
    default: false,
  },
  {
    setting: settings.SHOW_MOBILE_TOGGLE,
    name: "MOBILEIMPROVEMENTS.SettingsShowToggle",
    hint: "MOBILEIMPROVEMENTS.SettingsShowToggleHint",
    type: Boolean,
    default: false,
    scope: "world",
  },
  {
    setting: settings.SHOW_CHAT_ON_ROLL,
    name: "MOBILEIMPROVEMENTS.SettingsShowChatOnRoll",
    hint: "MOBILEIMPROVEMENTS.SettingsShowChatOnRollHint",
    type: Boolean,
    default: true,
    scope: "world",
  },
  {
    setting: settings.SHOW_PLAYER_LIST,
    type: Boolean,
    default: false,
    config: false,
  },
  {
    setting: settings.PIN_MOBILE_MODE,
    type: Boolean,
    default: false,
    config: false,
  },
  {
    setting: settings.WINDOWS_ZOOM_VALUES,
    type: Object,
    default: {},
    config: false,
  },
];

function registerSetting(callbacks: Callbacks, { setting, ...options }): void {
  game.settings.register(MODULE_NAME, setting, {
    config: true,
    scope: "client",
    ...options,
    onChange: callbacks[setting] || undefined,
  });
}

export function registerSettings(callbacks: Callbacks = {}): void {
  moduleSettings.forEach((item) => {
    registerSetting(callbacks, item);
  });
}

export function getSetting(setting: settings): any {
  return game.settings.get(MODULE_NAME, setting as string);
}

export function setSetting(setting: settings, value: unknown): Promise<any> {
  return game.settings.set(MODULE_NAME, setting as string, value);
}
