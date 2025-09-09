import { ChildProcessWithoutNullStreams, execSync, spawn } from 'child_process';
import * as iconv from 'iconv-lite';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { commonUtils } from '../utils/CommonUtils';

class JavaService {
  private vmOptions: string = '';
  private contextPath: string = '';
  private home: string = '';
  private extensionPath: string;
  private debugPort: number = 0;
  private port: number = 0;
  private channel: vscode.OutputChannel;

  private updateConfig() {
    const tomcat: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('support.tomcat');
    this.vmOptions = tomcat.get('vmOptions', '');
    this.contextPath = tomcat.get('contextPath')!;
    this.home = tomcat.get('home') || path.join(this.extensionPath, 'resources', 'tomcat9');
    this.debugPort = tomcat.get('debugPort')!;
    this.port = tomcat.get('port')!;
  }

  constructor(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    this.extensionPath = context.extensionPath;
    this.channel = channel;
    this.updateConfig();
  }

  async start() {
    // 更新配置
    this.updateConfig();

    //启动程序
    const java: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('java.configuration');
    let jdk: string;
    if (java.has('runtimes') && Array.isArray(java.runtimes) && java.runtimes.length > 0) {
      const defaultRuntime = java.runtimes.find((runtime) => runtime.default === true);
      jdk = defaultRuntime ? defaultRuntime.path : java.runtimes[0].path;
    } else {
      const javaConfig = vscode.workspace.getConfiguration('java');
      jdk = javaConfig.get('jdt.ls.java.home')!;
    }

    //检测端口是否占用
    let resTemp = await commonUtils.portUsed(this.debugPort);
    let resTemp2 = await commonUtils.portUsed(this.port);
    if (resTemp) {
      vscode.window.showErrorMessage('端口占用: ' + this.debugPort);
      return;
    }

    if (resTemp2) {
      vscode.window.showErrorMessage('端口占用: ' + this.port);
      return;
    }

    let catalinaOpts = '-agentlib:jdwp=transport=dt_socket,address=' + this.debugPort + ',server=y,suspend=n ' + this.vmOptions;

    const options = {
      shell: true,
      env: {
        CATALINA_BASE: path.join(this.extensionPath, this.contextPath),
        CATALINA_HOME: this.home,
        CATALINA_TMPDIR: path.join(this.home, 'temp'),
        JRE_HOME: jdk,
        CLASSPATH: path.join(this.home, 'bin', 'bootstrap.jar') + ';' + path.join(this.home, 'bin', 'tomcat-juli.jar'),
        CATALINA_OPTS: catalinaOpts,
      },
    };
    var cmd: ChildProcessWithoutNullStreams;
    cmd = spawn(path.join(this.home, 'bin', 'catalina.bat'), ['run'], options);

    cmd!.stdout.on('data', (data: Buffer) => {
      this.channel.append(iconv.decode(data, 'utf-8'));
    });

    cmd!.stderr.on('data', (data: Buffer) => {
      this.channel.append(iconv.decode(data, 'utf-8'));
    });
  }

  async stop() {
    // 更新配置
    this.updateConfig();
    let resTemp = await commonUtils.portUsed(this.port);
    if (resTemp) {
      let netStr = execSync('netstat -ano | findstr .:' + this.port);
      if (netStr.toString()) {
        const pid: string = netStr.toString().trim().split(/\s+/g)[4];
        execSync('taskkill /pid ' + pid + ' /f');
        this.channel.append('tomcat 已经停止 \n');
      }
    } else {
      vscode.window.showErrorMessage('tomcat 未运行');
    }
  }

  async refresh() {
    let resTemp = await commonUtils.portUsed(this.debugPort);
    let resTemp2 = await commonUtils.portUsed(this.port);
    if (resTemp || resTemp2) {
      await this.stop();
    }
    //调用redhat的命令进行编译
    this.channel.append('redhat.java开始编译 \n');
    try {
      await vscode.commands.executeCommand('java.workspace.compile', true);
    } catch (error) {
      console.log(error);
    }
    this.channel.append('redhat.java编译完成 \n');
    await this.config(true);
    this.start();
  }

  async config(overwrite = false) {
    /**
     * 1 判断是否已经存在 catalinaBase + webName,不存在的话就复制一份过来
     */
    const targetPath = path.join(this.extensionPath, this.contextPath);
    const sourceConfigPath = path.join(this.home, 'conf');
    const sourceLogPath = path.join(this.home, 'logs');

    if (fs.existsSync(targetPath)) {
      if (overwrite) {
        this.channel.append('删除原有文件夹...\n');
        fs.rmSync(path.join(targetPath, this.contextPath), { recursive: true });
        this.channel.append('开始复制...\n');
      } else {
        return;
      }
    } else {
      this.channel.append('开始复制...\n');
    }

    fs.cpSync(sourceConfigPath, path.join(targetPath, 'conf'), { recursive: true });
    fs.cpSync(sourceLogPath, path.join(targetPath, 'logs'), { recursive: true });
    //复制新的pub包
    //判断是否存在ignores
    const tomcat: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('support.tomcat');
    if (tomcat.ignores && tomcat.ignores.length > 0) {
      const skipFolders = tomcat.ignores.split(',').map((item: string) => item.trim());
      fs.cpSync(
        path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'src', 'main', 'webapp'),
        path.join(this.extensionPath, this.contextPath, this.contextPath),
        {
          recursive: true,
          filter: (src) => {
            const baseName = path.basename(src);

            if (fs.statSync(src).isDirectory() && skipFolders.includes(baseName)) {
              return false;
            }

            return true;
          },
        },
      );
    } else {
      fs.cpSync(
        path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'src', 'main', 'webapp'),
        path.join(this.extensionPath, this.contextPath, this.contextPath),
        {
          recursive: true,
        },
      );
    }

    fs.cpSync(
      path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'target', 'classes'),
      path.join(this.extensionPath, this.contextPath, this.contextPath, 'WEB-INF', 'classes'),
      { recursive: true },
    );

    execSync(
      'mvn dependency:copy-dependencies -DoutputDirectory=' + path.join(this.extensionPath, this.contextPath, this.contextPath, 'WEB-INF', 'lib'),
      { cwd: vscode.workspace.workspaceFolders![0].uri.fsPath },
    );

    /**
     * 2 创建配置文件指向发布的包的地址
     */
    const content =
      '<Context docBase="' + path.join(this.extensionPath, this.contextPath, this.contextPath) + '" ><Resources cachingAllowed="false" /></Context>';
    fs.mkdirSync(path.join(targetPath, 'conf', 'Catalina', 'localhost'), { recursive: true });
    fs.writeFileSync(path.join(targetPath, 'conf', 'Catalina', 'localhost', this.contextPath + '.xml'), Buffer.from(content, 'utf8'));

    /**
     * 3 修改指定启动的端口
     */
    var data = fs.readFileSync(path.join(targetPath, 'conf', 'server.xml'));
    let serverContent = Buffer.from(data).toString('utf8');
    serverContent = serverContent.replaceAll('8080', this.port.toString()).replaceAll('8005', '-1');
    fs.mkdirSync(path.join(targetPath, 'conf'), { recursive: true });
    fs.writeFileSync(path.join(targetPath, 'conf', 'server.xml'), serverContent, 'utf-8');

    //4 增加localhost的输出
    const logStr =
      'org.apache.catalina.core.ContainerBase.[Catalina].[localhost].handlers = 2localhost.org.apache.juli.FileHandler, java.util.logging.ConsoleHandler';

    fs.appendFileSync(path.join(this.extensionPath, this.contextPath, 'conf', 'logging.properties'), logStr, 'utf8');
  }
}

let javaService: JavaService;

export function initJavaService(context: vscode.ExtensionContext, channel: vscode.OutputChannel): JavaService {
  if (!javaService) {
    javaService = new JavaService(context, channel);
  }
  return javaService;
}
