import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, Settings, ShukuchiSettingTab } from "./settings";
import { AppHelper } from "./app-helper";
import { createCommands } from "./commands";

export default class ShukuchiPlugin extends Plugin {
  settings: Settings;
  appHelper: AppHelper;

  async onload() {
    await this.loadSettings();
    this.appHelper = new AppHelper(this.app);
    this.init();

    createCommands(this.appHelper, this.settings).forEach((c) =>
      this.addCommand(c)
    );

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
