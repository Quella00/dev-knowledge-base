// app/page.tsx
import { getIssues, getCategories } from './actions'
import KnowledgeBase from './components/KnowledgeBase'

export default async function Home() {
  // 在服务端并发获取数据
  const [issues, categories] = await Promise.all([
    getIssues(),
    getCategories()
  ])

  return (
    <KnowledgeBase 
      initialIssues={issues} 
      categories={categories.filter((c): c is string => c !== null)} // 简单的类型过滤
    />
  )
}