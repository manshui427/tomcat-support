import * as net from 'net';

class CommonUtils {
  async portUsed(port: number, timeout: number = 5000): Promise<boolean> {
    // 验证端口号范围
    if (port < 0 || port > 65535) {
      throw new Error('Invalid port number');
    }

    return new Promise((resolve, reject) => {
      const server = net.createServer();
      let timeoutId: NodeJS.Timeout;

      // 设置超时处理
      timeoutId = setTimeout(() => {
        server.close();
        resolve(false);
      }, timeout);

      server.listen(port);

      server.on('listening', () => {
        clearTimeout(timeoutId);
        server.close();
        resolve(false); // 端口未被占用
      });

      server.on('error', (err: any) => {
        clearTimeout(timeoutId);
        server.close();
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          resolve(true); // 端口被占用
        } else {
          reject(err); // 其他错误
        }
      });
    });
  }
}

const commonUtils = new CommonUtils();

export { commonUtils };
