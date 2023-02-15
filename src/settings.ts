import { App, PluginSettingTab, Setting } from "obsidian";
import type ShukuchiPlugin from "./main";

export interface Settings {
  hoge: string;
}

export const DEFAULT_SETTINGS: Settings = {
  hoge: "",
};

export class ShukuchiSettingTab extends PluginSettingTab {
  plugin: ShukuchiPlugin;

  constructor(app: App, plugin: ShukuchiPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "General" });

    new Setting(containerEl).setName("Hoge").addText((text) =>
      text
        .setPlaceholder("ex: hoge.md")
        .setValue(this.plugin.settings.hoge)
        .onChange(async (value) => {
          this.plugin.settings.hoge = value;
          await this.plugin.saveSettings();
        })
    );
  }
}
