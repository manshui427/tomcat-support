import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

export class FileService {
  /**
   *
   * @param sourceFile 源文件路径1
   * @param isDel 是否删除 true 删除 false 修改
   */
  async fileChange(context: vscode.ExtensionContext, sourceFile: string, isDel: boolean) {
    const tomcat: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('support.tomcat');
    if (tomcat.autoPubWhenSave) {
      const javaSource: string = path.join('src', 'main', 'java');
      const resourceSource: string = path.join('src', 'main', 'resources');
      const webSource: string = path.join('src', 'main', 'webapp');

      const targetPath = path.join(context.extensionPath, tomcat.contextPath);
      let targetFile: string;

      if (tomcat.ignores && tomcat.ignores.length > 0) {
        tomcat.ignores.split(',').forEach((item: string) => {
          const ignorePath = item.trim();
          if (sourceFile.indexOf(ignorePath) > -1) {
            return;
          }
        });
      }

      if (sourceFile.indexOf(javaSource) > -1 && sourceFile.endsWith('java')) {
        //java文件夹下的文件
        targetFile = path.join(targetPath, tomcat.contextPath, 'WEB-INF', 'classes', sourceFile.split(javaSource)[1]).replace('.java', '.class');
        if (!isDel) {
          try {
            await vscode.commands.executeCommand('java.workspace.compile', false);
          } catch (error) {
            console.log(error);
          }
          sourceFile = sourceFile.replace(javaSource, path.join('target', 'classes')).replace('.java', '.class');
        }
      } else if (sourceFile.indexOf(resourceSource) > -1) {
        //resources文件夹下的文件
        targetFile = path.join(targetPath, tomcat.contextPath, 'WEB-INF', 'classes', sourceFile.split(resourceSource)[1]);
      } else if (sourceFile.indexOf(webSource) > -1) {
        //webapp文件夹下的文件
        targetFile = path.join(targetPath, tomcat.contextPath, sourceFile.split(webSource)[1]);
      } else if (sourceFile.indexOf('pom.xml') > -1) {
        const entries = fs.readdirSync(path.join(context.extensionPath, tomcat.contextPath, tomcat.contextPath, 'WEB-INF', 'lib'));
        entries.forEach((entry) => {
          const filePath = path.join(context.extensionPath, tomcat.contextPath, tomcat.contextPath, 'WEB-INF', 'lib', entry);
          try {
            fs.rmSync(filePath);
          } catch (error) {
            console.log(error);
          }
        });

        execSync(
          'mvn dependency:copy-dependencies -DoutputDirectory=' +
            path.join(context.extensionPath, tomcat.contextPath, tomcat.contextPath, 'WEB-INF', 'lib'),
          { cwd: vscode.workspace.workspaceFolders![0].uri.fsPath },
        );
        return;
      } else {
        return;
      }
      if (isDel) {
        fs.rmSync(targetFile);
      } else {
        fs.copyFileSync(sourceFile, targetFile);
      }
    }
  }
}

const fileService = new FileService();

export { fileService };
