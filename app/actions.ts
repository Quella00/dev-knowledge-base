// app/actions.ts
'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// 获取数据（支持搜索和分类筛选）
export async function getIssues(query?: string, category?: string, showFavorites?: boolean) {
  return await prisma.issue.findMany({
    where: {
      AND: [
        // 搜索标题或标签
        query ? {
          OR: [
            { title: { contains: query } },
            { tags: { contains: query } }
          ]
        } : {},
        // 分类筛选
        category ? { category: category } : {},
        // 收藏筛选
        showFavorites ? { isFavorite: true } : {}
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
}

// 获取所有的分类列表（用于侧边栏）
export async function getCategories() {
  const issues = await prisma.issue.findMany({
    select: { category: true },
    distinct: ['category']
  })
  return issues.map(i => i.category)
}

// 添加问题
export async function addIssue(formData: FormData) {
  const title = formData.get('title') as string
  const category = formData.get('category') as string || "未分类" // 默认值
  const problem = formData.get('problem') as string
  const solution = formData.get('solution') as string
  const tags = formData.get('tags') as string

  await prisma.issue.create({
    data: { title, category, problem, solution, tags }
  })
  revalidatePath('/')
}

// 切换收藏状态
export async function toggleFavorite(id: number, currentStatus: boolean) {
  await prisma.issue.update({
    where: { id },
    data: { isFavorite: !currentStatus }
  })
  revalidatePath('/')
}

export async function deleteIssue(id: number) {
  await prisma.issue.delete({ where: { id } })
  revalidatePath('/')
}


// 新增：更新现有文档
export async function updateIssue(id: number, formData: FormData) {
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const problem = formData.get('problem') as string
  const solution = formData.get('solution') as string
  const tags = formData.get('tags') as string

  await prisma.issue.update({
    where: { id },
    data: {
      title,
      category,
      problem,
      solution,
      tags
    }
  })

  revalidatePath('/') // 刷新页面数据
}