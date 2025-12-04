const { app, BrowserWindow } = require('electron')
const path = require('path')
const { fork } = require('child_process') // 引入进程控制模块

let mainWindow
let serverProcess // 用于保存后台服务进程

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Dev Knowledge Base",
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
    }
  })

  mainWindow.webContents.openDevTools()

  const url = 'http://localhost:30001'

  // === 关键逻辑：循环检查服务是否启动 ===
  // 因为 Next.js 启动需要几秒钟，如果直接加载会报错，所以我们用轮询的方式
  const checkServer = () => {
    // 尝试加载页面
    mainWindow.loadURL(url).catch(() => {
      console.log('Server not ready, waiting...')
      // 如果失败（服务没起），1秒后重试
      setTimeout(checkServer, 1000)
    })
  }

  checkServer()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// === 关键逻辑：启动 Next.js 后端服务 ===
const startServer = () => {
  if (!app.isPackaged) return

  // 直接指向同目录下的 server.js
  // __dirname 在打包后会自动指向资源根目录，非常稳定
  const scriptPath = path.join(__dirname, 'server.js')
  
  console.log('Starting server from:', scriptPath)

  serverProcess = fork(scriptPath, [], {
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      PORT: '30001'
    }
  })

  serverProcess.on('error', (err) => {
    console.error('Server process failed:', err)
  })

  // 2. === 加上日志输出 ===
  // 把子进程的报错打印到主进程的控制台
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`)
  })
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`)
  })
}


app.on('ready', () => {
  startServer() // 1. 先启动服务
  createWindow() // 2. 再打开窗口
})

// 当所有窗口关闭时
app.on('window-all-closed', function () {
  // 杀死后台服务进程，防止残留
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})

// 退出前再次确保杀掉进程
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})