'use client'

import { useState, useEffect } from 'react'
// 引入 Globe 图标
import { Folder, FileText, Star, Search, Plus, Trash2, Bookmark, Save, X, Pencil, Globe, User, Lock } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toggleFavorite, deleteIssue, addIssue, updateIssue } from '../actions'
import RenderMarkdown from './RenderMarkdown'
import { LogOut, UserCircle } from 'lucide-react'
import { logout } from '../actions'

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Issue = {
  id: number; title: string; problem: string; solution: string;
  category: string; isFavorite: boolean; createdAt: Date; tags: string | null;
  userId: number; // 必须要有这个，用于判断是否是作者
  isPublic: boolean; // 新增
}

export default function KnowledgeBase({ initialIssues, categories, user }: { initialIssues: Issue[], categories: string[], user: { id: number, username: string } }) {
  const [issues, setIssues] = useState(initialIssues)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  
  // UI 状态
  const [search, setSearch] = useState('')
  
  // 视图模式：'all' (我的全部) | 'fav' (收藏) | 'public' (公开广场) | 'category' (具体分类)
  const [viewMode, setViewMode] = useState<'all' | 'fav' | 'public' | 'category'>('all')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // === 新增：删除确认弹窗的状态 ===
  // deleteTarget 既充当 boolean (不为null即显示)，也存储了要删除的对象信息
  const [deleteTarget, setDeleteTarget] = useState<Issue | null>(null)

  // 表单数据
  const [formId, setFormId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [isPublic, setIsPublic] = useState(false) // 表单里的公开状态

  useEffect(() => {
    setIssues(initialIssues)
    if (selectedIssue) {
      const updatedItem = initialIssues.find(i => i.id === selectedIssue.id)
      if (updatedItem) setSelectedIssue(updatedItem)
    }
  }, [initialIssues])


  // === 新增：确认删除的逻辑 ===
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    
    try {
      await deleteIssue(deleteTarget.id)
      
      // 删除后清理状态
      setSelectedIssue(null) // 清空右侧详情
      setDeleteTarget(null)  // 关闭弹窗
    } catch (e) {
      alert("删除失败")
    }
  }

  // === 核心过滤逻辑 ===
  const filteredIssues = issues.filter(issue => {
    // 1. 搜索匹配
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || (issue.tags && issue.tags.toLowerCase().includes(search.toLowerCase()))
    if (!matchesSearch) return false

    // 2. 视图匹配
    if (viewMode === 'public') {
      return issue.isPublic === true // 只显示公开的
    } else if (viewMode === 'fav') {
      return issue.userId === user.id && issue.isFavorite // 我的且收藏的
    } else if (viewMode === 'category' && filterCategory) {
      return issue.userId === user.id && issue.category === filterCategory // 我的且分类匹配
    } else {
      // 默认为 'all' -> 显示我自己的
      return issue.userId === user.id
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category || '未分类')
    formData.append('tags', tags)
    formData.append('problem', problem)
    formData.append('solution', solution)
    // 添加公开状态
    if (isPublic) formData.append('isPublic', 'on')

    try {
      if (isEditing && formId) {
        await updateIssue(formId, formData)
        // 本地乐观更新
        setSelectedIssue({ ...selectedIssue!, title, category, tags, problem, solution, isPublic })
      } else {
        await addIssue(formData)
      }
      setIsFormOpen(false)
      setIsEditing(false)
    } catch (error) {
      alert("保存失败或无权限")
    }
  }

  const openEditMode = (issue: Issue) => {
    setFormId(issue.id)
    setTitle(issue.title)
    setCategory(issue.category)
    setTags(issue.tags || '')
    setProblem(issue.problem)
    setSolution(issue.solution)
    setIsPublic(issue.isPublic) // 读取当前状态
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const openCreateMode = () => {
    setFormId(null)
    setTitle('')
    setCategory('')
    setTags('')
    setProblem('')
    setSolution("**在此处编写文档...**")
    setIsPublic(false) // 默认不公开
    setIsEditing(false)
    setIsFormOpen(true)
    setSelectedIssue(null)
  }

  return (
    <div className="flex h-screen bg-white text-slate-800 overflow-hidden font-sans">
      
      {/* === 左侧侧边栏 === */}
      <div className="w-64 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col">
         <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm truncate">
               <UserCircle className="w-5 h-5 text-indigo-600" /> {user.username}
            </div>
            <form action={logout}><button title="退出"><LogOut className="w-4 h-4 text-slate-400 hover:text-red-500" /></button></form>
         </div>

         <div className="p-4 border-b border-slate-200">
          <button onClick={openCreateMode} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> 新建文档
          </button>
        </div>
         
         <div className="p-3"><input type="text" placeholder="搜索..." className="w-full p-2 border rounded text-sm outline-none focus:border-indigo-500" value={search} onChange={e=>setSearch(e.target.value)}/></div>
         
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {/* 导航按钮组 */}
             <button onClick={() => { setViewMode('all'); setSelectedIssue(null); setIsFormOpen(false) }} className={`block w-full text-left p-2 rounded text-sm ${viewMode === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <FileText className="inline w-4 h-4 mr-2"/> 我的文档
             </button>
             
             <button onClick={() => { setViewMode('fav'); setSelectedIssue(null); setIsFormOpen(false) }} className={`block w-full text-left p-2 rounded text-sm ${viewMode === 'fav' ? 'bg-yellow-50 text-yellow-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Star className="inline w-4 h-4 mr-2"/> 我的收藏
             </button>

             {/* === 新增：公开广场 === */}
             <button onClick={() => { setViewMode('public'); setSelectedIssue(null); setIsFormOpen(false) }} className={`block w-full text-left p-2 rounded text-sm ${viewMode === 'public' ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Globe className="inline w-4 h-4 mr-2"/> 公开广场
             </button>
             
             <div className="px-2 text-xs font-bold text-slate-400 uppercase mb-1 mt-4">我的分类</div>
             {categories.map(cat => (
                <button key={cat} onClick={() => { setViewMode('category'); setFilterCategory(cat); setSelectedIssue(null); setIsFormOpen(false) }} className={`block w-full text-left p-2 rounded text-sm ${viewMode === 'category' && filterCategory === cat ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Folder className="inline w-3.5 h-3.5 mr-2 text-slate-400" />{cat}
                </button>
             ))}
         </div>
      </div>

      {/* === 中间列表 === */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-white">
         <div className="p-3 border-b bg-slate-50 text-xs text-slate-500 font-medium">
            {viewMode === 'public' ? '🌏 所有公开文档' : '📄 我的文档列表'}
         </div>
         <div className="flex-1 overflow-y-auto">
          {filteredIssues.map(issue => (
            <div key={issue.id} onClick={() => { setSelectedIssue(issue); setIsFormOpen(false) }} className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition ${selectedIssue?.id === issue.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
              <h3 className="font-bold text-sm truncate text-slate-700">{issue.title}</h3>
              <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{issue.category}</span>
                    {/* 如果是公开文档，显示一个小地球图标 */}
                    {issue.isPublic && <Globe className="w-3 h-3 text-green-500 mt-1" />}
                  </div>
                  {/* 如果是在公开广场看别人的文档，显示作者ID (或者你可以扩展User表查名字) */}
                  {viewMode === 'public' && issue.userId !== user.id && (
                     <span className="text-[10px] text-slate-400 flex items-center"><User className="w-3 h-3 mr-0.5"/>User {issue.userId}</span>
                  )}
              </div>
            </div>
          ))}
         </div>
      </div>

      {/* === 右侧详情 / 编辑 === */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col relative">
        {isFormOpen ? (
          <div className="h-full flex flex-col">
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="text-xl font-bold text-slate-800">{isEditing ? "编辑文档" : "新建文档"}</h2>
               <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
              {/* === 新增：公开状态切换开关 === */}
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {isPublic ? <><Globe className="w-4 h-4 text-green-600"/> 公开此文档 (所有人可见)</> : <><Lock className="w-4 h-4 text-slate-500"/> 私有文档 (仅自己可见)</>}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="文档标题" className="col-span-8 p-2 border rounded-md font-bold text-lg" />
                <input value={category} onChange={e => setCategory(e.target.value)} list="cats" placeholder="分类" className="col-span-2 p-2 border rounded-md text-sm" />
                <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="标签" className="col-span-2 p-2 border rounded-md text-sm" />
              </div>

              <textarea value={problem} onChange={e => setProblem(e.target.value)} rows={3} placeholder="问题描述..." className="w-full p-3 border rounded-md font-mono text-xs bg-slate-50" />
              
              <div className="flex-1 border rounded-md overflow-hidden">
                  <MDEditor value={solution} onChange={(val) => setSolution(val || '')} height="100%" preview="edit" className="h-full border-none" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-md">取消</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center gap-2">
                    <Save className="w-4 h-4" /> 保存
                </button>
              </div>
            </form>
          </div>
        ) : selectedIssue ? (
          // === 详情查看 ===
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-6 sticky top-0 z-10 flex justify-between items-start">
               <div className="max-w-3xl">
                 <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">{selectedIssue.category}</span>
                    {selectedIssue.isPublic ? 
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1"><Globe className="w-3 h-3"/> 公开</span> : 
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"><Lock className="w-3 h-3"/> 私有</span>
                    }
                 </div>
                 <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{selectedIssue.title}</h1>
               </div>
               
               {/* 
                  关键逻辑：按钮鉴权 
                  只有当 (文档作者ID === 当前登录用户ID) 时，才显示编辑/删除按钮 
               */}
               {selectedIssue.userId === user.id && (
                   <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEditMode(selectedIssue!)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-medium">
                        <Pencil className="w-4 h-4" /> 编辑
                      </button>
                      <button onClick={() => toggleFavorite(selectedIssue!.id, selectedIssue!.isFavorite)} className={`p-2 rounded-md border ${selectedIssue!.isFavorite ? 'border-yellow-200 bg-yellow-50 text-yellow-600' : 'border-slate-200 text-slate-400'}`}>
                        <Star className={`w-5 h-5 ${selectedIssue!.isFavorite ? 'fill-yellow-500' : ''}`} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(selectedIssue)} // <--- 仅仅是打开弹窗，不直接删除
                        className="p-2 rounded-md border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                        title="删除文档"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
               )}
            </div>

            <div className="max-w-4xl mx-auto px-8 py-8 space-y-8 pb-32">
              {selectedIssue.problem && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-red-600 uppercase mb-2">Problem</h3>
                    <pre className="text-sm font-mono text-red-900 whitespace-pre-wrap break-words">{selectedIssue.problem}</pre>
                  </div>
              )}
              <div className="min-h-[200px]">
                <RenderMarkdown content={selectedIssue.solution} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
            <div className="text-center space-y-2">
              <FileText className="w-20 h-20 mx-auto opacity-10" />
              <p className="text-lg font-medium text-slate-400">选择文档阅读</p>
              {viewMode === 'public' && <p className="text-xs text-green-600">当前正在浏览公开广场</p>}
            </div>
          </div>
        )}

        {/* === 新增：自定义删除确认弹窗 === */}
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              {/* 弹窗卡片 */}
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                
                {/* 顶部警告图标区域 */}
                <div className="p-6 pb-0 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-6">
                    确认删除文档？
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      您即将删除文档：
                      <span className="block mt-1 font-bold text-slate-800 bg-slate-100 py-1 px-2 rounded border border-slate-200 break-all">
                        {deleteTarget.title}
                      </span>
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                      此操作无法撤销，删除后将无法恢复。
                    </p>
                  </div>
                </div>

                {/* 底部按钮区域 */}
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-colors"
                  >
                    确认删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  )
}