import { App, Editor, MarkdownView, TFile, WorkspaceLeaf } from "obsidian";

type CoreCommand =
  | "editor:open-link-in-new-leaf"
  | "editor:open-link-in-new-split"
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

  splitTabGroup(direction: "horizontal" | "vertical"): WorkspaceLeaf {
    return this.unsafeApp.workspace.getLeaf("split", direction);
  }

  openFile(path: string, option?: { newLeaf: boolean }): Promise<void> {
    const newLeaf = option?.newLeaf ?? false;
    return this.unsafeApp.workspace.openLinkText("", path, newLeaf);
  }

  getLinkFileOnCursor(): TFile | null {
    const file = this.getActiveFile();
    if (!file) {
      return null;
    }

    const editor = this.getActiveMarkdownEditor();
    if (!editor) {
      return null;
    }

    const dstFile = this.unsafeApp.metadataCache.getFirstLinkpathDest(
      (editor as any).getClickableTokenAt(editor.getCursor()).text,
      file.path
    );
    if (!dstFile) {
      return null;
    }

    return dstFile;
  }
}
