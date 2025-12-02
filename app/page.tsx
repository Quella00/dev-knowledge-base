// app/page.tsx
import { getIssues, getCategories } from './actions'
import KnowledgeBase from './components/KnowledgeBase'

import { getSession } from './lib' // 引入 session 获取
import AuthForm from './components/AuthForm'

export default async function Home() {
 // 1. 检查是否登录
  const session = await getSession()

  // 2. 如果未登录，显示登录页
  if (!session) {
    return <AuthForm />
  }

  // 3. 如果已登录，获取数据并显示主应用
  const [issues, categories] = await Promise.all([
    getIssues(),
    getCategories()
  ])

  // 将用户信息传给主组件
  return (
    <KnowledgeBase 
      initialIssues={issues} 
      categories={categories.filter((c): c is string => c !== null)} 
      user={session.user} // <--- 传入用户信息
    />
  )
}