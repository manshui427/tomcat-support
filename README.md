# 说明

支持本地化tomcat发布项目

## 环境

- Windows System
- Maven management project
- VSCode version >= 1.78.1

## 参数

- support.tomcat.autoPubWhenSave.enabled 是否自动发布
- support.tomcat.home tomcat文件夹位置(非必填,已内置tomcat9)
- support.tomcat.port发布端口(默认8080)
- support.tomcat.debugPort debug端口(5005)
- support.tomcat.contextPath tomcat的发布名称(默认dev)
- support.tomcat.vmOptions tomcat启动的时候使用的vm-options

## 使用流程

1. .vscode 的 settings.json 中配置好参数 `support.tomcat.contextPath` `support.tomcat.port` `support.tomcat.debugPort`
2. 状态视图中会出现三个个按钮,分别是 `启动` `停止` `重启`
3. 如果需要 debug,配置.vscode 的 launch.json,启动项目后开启 debug 模式

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "java",
            "name": "localhost",
            "projectName": java.projectName,
            "request": "attach",
            "hostName": "localhost",
            "port": support.tomcat.debugPort
        }

    ]
}
```
