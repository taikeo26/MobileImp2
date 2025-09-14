const AppV2 = foundry.applications.api.ApplicationV2;

function loc(s: string) {
  return game.i18n.localize(`MOBILEIMPROVEMENTS.${s}`);
}

export class About extends AppV2 {
  static DEFAULT_OPTIONS = {
    id: "mobile-improvements-about",
    classes: ["application"],
    window: {
      title: "MOBILEIMPROVEMENTS.AboutTitle",
      resizable: true,
    },
  };

  override async _renderHTML(): Promise<string> {
    return "";
  }

  override _replaceHTML(result: string, content: HTMLElement) {
    content.innerHTML = `
    <img style="max-height: 30vh; object-fit: contain;" src="../modules/mobile-improvements/images/fvtt-modules-lab.png">
        <p>${loc("AboutThanks")}</p>
        <p>${loc("AboutText")}</p>
        <ul>
            <li>
                <a href="https://discord.gg/jM4XQ33EjK" target="_blank">
                  ${loc("AboutDiscord")}
                </a>
            </li>
            <li>
                <a href="https://gitlab.com/fvtt-modules-lab/quick-insert/-/issues" target="_blank">
                  ${loc("AboutIssues")}
                </a>
            </li>
            <li>
                <a href="https://ko-fi.com/sunspots" target="_blank">
                  ${loc("AboutSupport")}
                </a>
            </li>
        <ul>
    `;
  }
}

export function openAboutApp() {
  new About({}).render();
}
