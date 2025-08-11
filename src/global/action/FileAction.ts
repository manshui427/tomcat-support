import * as vscode from 'vscode';
import { fileService } from '../services/FileService';

class FileAction {
  async updateListener(context: vscode.ExtensionContext, editor: vscode.TextDocument) {
    fileService.fileChange(context, editor.fileName, false);
  }

  async changeListener(context: vscode.ExtensionContext, editor: vscode.WorkspaceFoldersChangeEvent) {
    editor.added.forEach((item) => {
      fileService.fileChange(context, item.uri.fsPath, false);
    });
    editor.removed.forEach((item) => {
      fileService.fileChange(context, item.uri.fsPath, true);
    });
  }

  async deleteListener(context: vscode.ExtensionContext, editor: vscode.FileDeleteEvent) {
    editor.files.forEach((file) => {
      fileService.fileChange(context, file.fsPath, true);
    });
  }

  createListener(context: vscode.ExtensionContext, editor: vscode.FileCreateEvent) {
    editor.files.forEach(async (file) => {
      fileService.fileChange(context, file.fsPath, false);
    });
  }
}

const fileAction = new FileAction();

export { fileAction };
