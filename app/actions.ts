// app/actions.ts
'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { setSession, logout as logoutAction, decrypt, getSession } from '@/app/lib' // 确保路径正确
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

// === 1. 获取用户专属数据 ===
export async function getIssues(query?: string) {
  const session = await getSession()
  if (!session) return []

  return await prisma.issue.findMany({
    where: {
      // 核心逻辑变动：
      OR: [
        { userId: session.user.id }, // 我自己的
        { isPublic: true }           // 所有人公开的
      ],
      // 搜索条件保持不变...
      AND: [
        query ? {
          OR: [
            { title: { contains: query } },
            { tags: { contains: query } }
          ]
        } : {}
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
}

// === 2. 获取用户专属分类 ===
export async function getCategories() {
  const session = await getSession()
  if (!session) return []
  // 这里我们只返回用户自己文档的分类，避免分类列表太乱
  const issues = await prisma.issue.findMany({
    where: { userId: session.user.id },
    select: { category: true },
    distinct: ['category']
  })
  return issues.map(i => i.category)
}
// === 3. 新增文档 (绑定用户) ===
export async function addIssue(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const category = formData.get('category') as string || "未分类"
  const problem = formData.get('problem') as string
  const solution = formData.get('solution') as string
  const tags = formData.get('tags') as string
  
  // 获取 checkbox 的值 (如果勾选，值为 "on"，否则为 null)
  const isPublic = formData.get('isPublic') === 'on'

  await prisma.issue.create({
    data: {
      title, category, problem, solution, tags, isPublic,
      userId: session.user.id
    }
  })
  revalidatePath('/')
}

// === 4. 更新文档 (安全校验) ===
export async function updateIssue(id: number, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  // 鉴权：只有作者本人能修改！(即使是公开文档，别人也不能改)
  const count = await prisma.issue.count({
    where: { id, userId: session.user.id }
  })

  if (count === 0) throw new Error("Permission denied")

  const isPublic = formData.get('isPublic') === 'on'

  await prisma.issue.update({
    where: { id },
    data: {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      problem: formData.get('problem') as string,
      solution: formData.get('solution') as string,
      tags: formData.get('tags') as string,
      isPublic: isPublic // 更新公开状态
    }
  })
  revalidatePath('/')
}
// === 5. 删除文档 (安全校验) ===
export async function deleteIssue(id: number) {
  const session = await getSession()
  if (!session) return

  // 只能删除属于自己的文档
  const count = await prisma.issue.count({
    where: { id, userId: session.user.id }
  })

  if (count > 0) {
    await prisma.issue.delete({ where: { id } })
    revalidatePath('/')
  }
}

// === 6. 切换收藏 (安全校验) ===
export async function toggleFavorite(id: number, currentStatus: boolean) {
  const session = await getSession()
  if (!session) return

  const count = await prisma.issue.count({
    where: { id, userId: session.user.id }
  })

  if (count > 0) {
    await prisma.issue.update({
      where: { id },
      data: { isFavorite: !currentStatus }
    })
    revalidatePath('/')
  }
}

// ==========================================
// 下面是 注册/登录 代码 (保持之前的逻辑即可)
// ==========================================

async function verifyCaptcha(inputCode: string) {
  const cookieStore = await cookies()
  const hash = cookieStore.get('captcha_hash')?.value
  if (!hash) return false
  const payload = await decrypt(hash)
  if (!payload || !payload.text) return false
  return payload.text === inputCode.toLowerCase()
}

export async function register(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const code = formData.get('code') as string

  const isCaptchaValid = await verifyCaptcha(code)
  if (!isCaptchaValid) return { error: "验证码错误" }

  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser) return { error: "用户名已存在" }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { username, password: hashedPassword }
  })
  return { success: true, message: "注册成功" }
}

export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const code = formData.get('code') as string

  const isCaptchaValid = await verifyCaptcha(code)
  if (!isCaptchaValid) return { error: "验证码错误" }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return { error: "用户名或密码错误" }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return { error: "用户名或密码错误" }

  await setSession({ id: user.id, username: user.username })
  redirect('/')
}

export async function logout() {
  await logoutAction()
  redirect('/')
}