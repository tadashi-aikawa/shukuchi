import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, Settings, ShukuchiSettingTab } from "./settings";
import { AppHelper } from "./app-helper";

export default class ShukuchiPlugin extends Plugin {
  settings: Settings;
  appHelper: AppHelper;

  async onload() {
    await this.loadSettings();
    this.appHelper = new AppHelper(this.app);
    this.init();

    this.addCommand({
      id: "main-command",
      name: "Main command",
      checkCallback: (checking: boolean) => {
        if (
          this.appHelper.getActiveFile() &&
          this.appHelper.getActiveMarkdownView()
        ) {
          if (!checking) {
            // TODO:
          }
          return true;
        }
      },
    });

    this.addSettingTab(new ShukuchiSettingTab(this.app, this));
  }

  private init() {
    // UIなどの登録系はここ
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.init();
  }
}
