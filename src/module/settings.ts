export const MODULE_NAME = "mobile-improvements"; // TODO: Better handling

export const settings = {
  // In config
  SIDEBAR_PAUSES_RENDER: "sideBarPausesRender",
  SHOW_MOBILE_TOGGLE: "showMobileToggle",
  SHOW_CHAT_ON_ROLL: "showChatOnRoll",
  SHOW_ROLL_BUBBLES: "showRollBubbles",

  // Not in config
  SHOW_PLAYER_LIST: "showPlayerList",
  PIN_MOBILE_MODE: "pinMobileMode",
  WINDOWS_ZOOM_VALUES: "windowZoomValues",
} as const;

interface Callbacks {
  [setting: string]: (value) => void;
}

import fields = foundry.data.fields;

declare module "fvtt-types/configuration" {
  interface SettingConfig {
    "mobile-improvements.sideBarPausesRender": fields.BooleanField;
    "mobile-improvements.showMobileToggle": fields.BooleanField;
    "mobile-improvements.showChatOnRoll": fields.BooleanField;
    "mobile-improvements.showRollBubbles": fields.BooleanField;

    // Not in config
    "mobile-improvements.showPlayerList": fields.BooleanField;
    "mobile-improvements.pinMobileMode": fields.BooleanField;
    "mobile-improvements.windowZoomValues": fields.ObjectField<{}>;
  }
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
    default: false,
    scope: "world",
  },
  {
    setting: settings.SHOW_ROLL_BUBBLES,
    name: "MOBILEIMPROVEMENTS.SettingsShowRollBubbles",
    hint: "MOBILEIMPROVEMENTS.SettingsShowRollBubblesHint",
    type: Boolean,
    default: true,
    scope: "client",
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

type settingKey = (typeof settings)[keyof typeof settings];

export function getSetting<K extends settingKey>(
  setting: K
): ClientSettings.Get<typeof MODULE_NAME, K, undefined> {
  return game.settings.get(MODULE_NAME, setting);
}

export function setSetting<K extends settingKey>(
  setting: K,
  value: ClientSettings.SettingCreateData<typeof MODULE_NAME, K>
): Promise<unknown> {
  return game.settings.set(MODULE_NAME, setting, value);
}
