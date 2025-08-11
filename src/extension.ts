import * as vscode from 'vscode';
import { fileAction } from './global/action/FileAction';
import { javaAction } from './global/action/JavaAction';

let channel: vscode.OutputChannel;
let startBarItem: vscode.StatusBarItem;
let stopBarItem: vscode.StatusBarItem;
let refreshBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  channel = vscode.window.createOutputChannel('tomcat');

  vscode.workspace.onDidSaveTextDocument((editor: vscode.TextDocument) => {
    fileAction.updateListener(context, editor);
  });
  vscode.workspace.onDidDeleteFiles((editor: vscode.FileDeleteEvent) => {
    fileAction.deleteListener(context, editor);
  });
  vscode.workspace.onDidCreateFiles((editor: vscode.FileCreateEvent) => {
    fileAction.createListener(context, editor);
  });
  vscode.workspace.onDidChangeWorkspaceFolders((editor: vscode.WorkspaceFoldersChangeEvent) => {
    fileAction.changeListener(context, editor);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('tomcat.start', () => {
      javaAction.start(context, channel);
    }),
    vscode.commands.registerCommand('tomcat.stop', () => {
      javaAction.stop(context, channel);
    }),
    vscode.commands.registerCommand('tomcat.refresh', () => {
      javaAction.refresh(context, channel);
    }),
  );

  startBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  startBarItem.command = 'tomcat.start';
  startBarItem.text = '$(play)';
  startBarItem.tooltip = 'tomcat start';
  context.subscriptions.push(startBarItem);
  startBarItem.show();

  stopBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  stopBarItem.command = 'tomcat.stop';
  stopBarItem.text = '$(stop)';
  stopBarItem.tooltip = 'tomcat stop';
  context.subscriptions.push(stopBarItem);
  stopBarItem.show();

  refreshBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  refreshBarItem.command = 'tomcat.refresh';
  refreshBarItem.text = '$(sync)';
  refreshBarItem.tooltip = 'tomcat refresh';
  context.subscriptions.push(refreshBarItem);
  refreshBarItem.show();
}

export function deactivate() {
  channel.dispose();
  startBarItem.hide();
  stopBarItem.hide();
  refreshBarItem.hide();
}
