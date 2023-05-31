import { App, PluginSettingTab, Setting } from "obsidian";
import type ShukuchiPlugin from "./main";
import { Direction, directionList } from "./commands";
import { mirror } from "./utils/collections";

export interface Settings {
  directionOfPossibleTeleportation: Direction;
}

export const DEFAULT_SETTINGS: Settings = {
  directionOfPossibleTeleportation: "both",
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
          })
      );
  }
}
