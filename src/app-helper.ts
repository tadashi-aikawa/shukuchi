import { App, Editor, MarkdownView, TFile } from "obsidian";

type CoreCommand =
  | "editor:open-link-in-new-leaf"
  | "editor:follow-link"
  | string;
interface UnsafeAppInterface {
  commands: {
    commands: { [commandId: string]: any };
    executeCommandById(commandId: string): boolean;
  };
}

export class AppHelper {
  private unsafeApp: App & UnsafeAppInterface;

  constructor(app: App) {
    this.unsafeApp = app as any;
  }

  getActiveFile(): TFile | null {
    // noinspection TailRecursionJS
    return this.unsafeApp.workspace.getActiveFile();
  }

  getActiveMarkdownView(): MarkdownView | null {
    return this.unsafeApp.workspace.getActiveViewOfType(MarkdownView);
  }

  getActiveMarkdownEditor(): Editor | null {
    return this.getActiveMarkdownView()?.editor ?? null;
  }

  executeCoreCommand(command: CoreCommand): boolean {
    return this.unsafeApp.commands.executeCommandById(command);
  }
}
