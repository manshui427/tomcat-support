import * as vscode from 'vscode';
import { initJavaService } from '../services/JavaService';

class JavaAction {
  async start(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    channel.show();
    await initJavaService(context, channel).config();
    initJavaService(context, channel).start();
  }

  async stop(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    channel.show();
    initJavaService(context, channel).stop();
  }

  async refresh(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    channel.show();
    initJavaService(context, channel).refresh();
  }
}

const javaAction = new JavaAction();

export { javaAction };
