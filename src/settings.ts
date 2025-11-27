import { App, PluginSettingTab, Setting } from "obsidian";
import type ShukuchiPlugin from "./main";
import { Direction, directionList } from "./commands";
import { mirror } from "./utils/collections";

export interface Settings {
  directionOfPossibleTeleportation: Direction;
  delayFocusInterval: number;
}

export const DEFAULT_SETTINGS: Settings = {
  directionOfPossibleTeleportation: "both",
  delayFocusInterval: 0,
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

    new Setting(containerEl)
      .setName("Direction of possible teleportation")
      .addDropdown((cb) =>
        cb
          .addOptions(mirror([...directionList]))
          .setValue(this.plugin.settings.directionOfPossibleTeleportation)
          .onChange(async (value) => {
            this.plugin.settings.directionOfPossibleTeleportation =
              value as Direction;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Delay focus interval")
      .setDesc(
        "Interval to wait before applying explicit editor focus. This feature prevents the editor from losing focus in certain cases, such as when navigating from an internal link inside a table. If set to 0, this feature is disabled.",
      )
      .addSlider((sc) => {
        sc.setLimits(0, 500, 10)
          .setValue(this.plugin.settings.delayFocusInterval)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.delayFocusInterval = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
