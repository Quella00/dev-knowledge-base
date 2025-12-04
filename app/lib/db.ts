// app/lib/db.ts
import { PrismaClient } from './prisma-client'; // 引用本地生成的代码
import path from 'path';

// 判断是否是生产环境 (打包后 NODE_ENV 通常为 production)
const isProd = process.env.NODE_ENV === 'production';

let prisma: PrismaClient;

if (isProd) {
  // --- 生产环境配置 ---
  
  // 1. 获取资源路径。在 Electron 打包的应用中，process.cwd() 通常指向安装目录
  // 我们将在 package.json 中把文件配置到 'resources' 文件夹下
  const resourcesPath = path.join(process.cwd(), 'resources');

  // 2. 数据库文件路径 (注意：Program Files 通常不可写，建议第一次运行时复制到 appData，这里先演示读取)
  const dbPath = path.join(resourcesPath, 'prisma/dev_kb.db');

  // 3. 引擎文件路径 (必须手动指定，否则找不到)
  // 注意：文件名可能是 query_engine-windows.dll.node 或 .exe，取决于你的系统
  // 请去 node_modules/@prisma/engines 确认一下文件名
  const enginePath = path.join(resourcesPath, 'bin/query_engine-windows.dll.node');

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
    // 显式告诉 Prisma 引擎在哪里
    __internal: {
      engine: {
        binaryPath: enginePath,
      },
    },
  } as any); // 使用 as any 绕过类型检查，因为 __internal 是私有 API 但必须用
} else {
  // --- 开发环境配置 ---
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;