// server.js
const { createServer } = require('http')
const next = require('next')
const path = require('path')

// 生产环境配置
const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 30001
const dir = __dirname // 确保指向当前目录

// 初始化 Next.js 应用
const app = next({ dev, dir })
const handle = app.getRequestHandler()

app.prepare().then(() => {
   createServer((req, res) => {
    handle(req, res)
  }).listen(port, '0.0.0.0', (err) => { // <--- 修改这里：加上 '0.0.0.0'
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})