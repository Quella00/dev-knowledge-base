'use client'

import { useState, useEffect } from 'react'
import { Folder, FileText, Star, Search, Plus, Trash2, Bookmark, Menu, Save, X, Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toggleFavorite, deleteIssue, addIssue, updateIssue } from '../actions'
import RenderMarkdown from './RenderMarkdown'

// 动态引入编辑器
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Issue = {
  id: number; title: string; problem: string; solution: string;
  category: string; isFavorite: boolean; createdAt: Date; tags: string | null;
}

export default function KnowledgeBase({ initialIssues, categories }: { initialIssues: Issue[], categories: string[] }) {
  const [issues, setIssues] = useState(initialIssues) // 本地化 issues 状态以便即时更新
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  
  // UI 状态
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // 标记当前是否在编辑模式

  // 表单数据 (受控状态)
  const [formId, setFormId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')

  // 当 props 更新时同步 (Server Action revalidatePath 后)
  useEffect(() => {
    setIssues(initialIssues)
    // 如果当前选中的文档在新的数据里被更新了，也要同步更新 selectedIssue
    if (selectedIssue) {
      const updatedItem = initialIssues.find(i => i.id === selectedIssue.id)
      if (updatedItem) setSelectedIssue(updatedItem)
    }
  }, [initialIssues])

  // 过滤逻辑
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || (issue.tags && issue.tags.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = filterCategory ? issue.category === filterCategory : true
    const matchesFav = showFavoritesOnly ? issue.isFavorite : true
    return matchesSearch && matchesCategory && matchesFav
  })

  // === 核心逻辑：处理表单提交 ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止默认 HTML 提交
    
    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category || '未分类')
    formData.append('tags', tags)
    formData.append('problem', problem)
    formData.append('solution', solution)

    try {
      if (isEditing && formId) {
        // 编辑模式：调用更新接口
        await updateIssue(formId, formData)
        // 为了更好的体验，手动更新本地 selectedIssue，不用等服务器返回
        setSelectedIssue({
            ...selectedIssue!,
            title, category, tags, problem, solution
        })
      } else {
        // 新建模式：调用新增接口
        await addIssue(formData)
      }
      
      // 关闭表单，重置状态
      setIsFormOpen(false)
      setIsEditing(false)
    } catch (error) {
      alert("保存失败，请重试")
    }
  }

  // === 核心逻辑：打开编辑模式 ===
  const openEditMode = (issue: Issue) => {
    setFormId(issue.id)
    setTitle(issue.title)
    setCategory(issue.category)
    setTags(issue.tags || '')
    setProblem(issue.problem)
    setSolution(issue.solution)
    
    setIsEditing(true)
    setIsFormOpen(true)
  }

  // === 核心逻辑：打开新建模式 ===
  const openCreateMode = () => {
    setFormId(null)
    setTitle('')
    setCategory('')
    setTags('')
    setProblem('')
    setSolution("**在此处编写文档...**")
    
    setIsEditing(false)
    setIsFormOpen(true)
    setSelectedIssue(null) // 清空选中，避免UI混乱
  }

  return (
    <div className="flex h-screen bg-white text-slate-800 overflow-hidden font-sans">
      
      {/* === 左侧侧边栏 === */}
      <div className="w-64 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col">
         <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-lg flex items-center gap-2 text-indigo-700"><Bookmark className="w-5 h-5" /> Dev Docs</h1>
          <button 
            onClick={openCreateMode}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> 新建文档
          </button>
        </div>
         
         {/* 搜索与分类 */}
         <div className="p-3 border-b border-slate-200/50">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="搜索..." className="w-full pl-8 p-2 border rounded text-sm outline-none focus:border-indigo-500" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-2">
             <button onClick={() => {setFilterCategory(null); setShowFavoritesOnly(false);setSelectedIssue(null);
            setIsFormOpen(false);}} className={`block w-full text-left p-2 rounded text-sm mb-1 ${!filterCategory && !showFavoritesOnly ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>全部文档</button>
             <button onClick={() => {setShowFavoritesOnly(true); setFilterCategory(null);setSelectedIssue(null);
            setIsFormOpen(false);}} className={`block w-full text-left p-2 rounded text-sm mb-4 ${showFavoritesOnly ? 'bg-yellow-50 text-yellow-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>⭐ 我的收藏</button>
             
             <div className="px-2 text-xs font-bold text-slate-400 uppercase mb-1">分类</div>
             {categories.map(cat => (
                <button key={cat} onClick={() => {setFilterCategory(cat); setShowFavoritesOnly(false);setSelectedIssue(null);
            setIsFormOpen(false);}} className={`block w-full text-left p-2 rounded text-sm ${filterCategory === cat ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Folder className="inline w-3 h-3 mr-2" />{cat}
                </button>
             ))}
         </div>
      </div>

      {/* === 中间列表栏 === */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-white">
         <div className="flex-1 overflow-y-auto">
          {filteredIssues.map(issue => (
            <div key={issue.id} onClick={() => { setSelectedIssue(issue); setIsFormOpen(false) }} className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition ${selectedIssue?.id === issue.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
              <h3 className="font-bold text-sm truncate text-slate-700">{issue.title}</h3>
              <div className="flex justify-between mt-2">
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{issue.category}</span>
                  {issue.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              </div>
            </div>
          ))}
         </div>
      </div>

      {/* === 右侧详情 / 编辑区 === */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col relative">
        
        {/* 判断：显示表单 还是 显示详情 */}
        {isFormOpen ? (
          <div className="h-full flex flex-col animate-in fade-in duration-200">
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="text-xl font-bold text-slate-800">
                 {isEditing ? "编辑文档" : "新建文档"}
               </h2>
               <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg" />
                </div>
                <div className="col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                   <input value={category} onChange={e => setCategory(e.target.value)} list="cats" className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
                   <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Tags</label>
                   <input value={tags} onChange={e => setTags(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Problem Description</label>
                <textarea value={problem} onChange={e => setProblem(e.target.value)} rows={3} className="w-full mt-1 p-3 border border-slate-300 rounded-md font-mono text-xs bg-slate-50 focus:bg-white transition" />
              </div>

              <div className="flex-1 flex flex-col" data-color-mode="light">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Solution & Notes</label>
                <div className="flex-1 border border-slate-300 rounded-md overflow-hidden">
                    <MDEditor value={solution} onChange={(val) => setSolution(val || '')} height="100%" preview="edit" className="h-full border-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-sm">
                    <Save className="w-4 h-4" /> {isEditing ? "保存修改" : "创建文档"}
                </button>
              </div>
            </form>
          </div>
        ) : selectedIssue ? (
          // === 查看详情模式 ===
          <div className="flex-1 overflow-y-auto">
            {/* 顶部工具栏 */}
            <div className="bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-6 sticky top-0 z-10 flex justify-between items-start">
               <div className="max-w-3xl">
                 <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">{selectedIssue.category}</span>
                    {selectedIssue.tags && <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{selectedIssue.tags}</span>}
                    <span>Updated: {new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                 </div>
                 <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{selectedIssue.title}</h1>
               </div>
               
               <div className="flex gap-2 flex-shrink-0">
                  {/* 核心改动：编辑按钮 */}
                  <button 
                    onClick={() => openEditMode(selectedIssue)} 
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition font-medium text-sm"
                  >
                    <Pencil className="w-4 h-4" /> 编辑
                  </button>

                  <button 
                    onClick={() => toggleFavorite(selectedIssue.id, selectedIssue.isFavorite)}
                    className={`p-2 rounded-md border transition ${selectedIssue.isFavorite ? 'border-yellow-200 bg-yellow-50 text-yellow-600' : 'border-slate-200 hover:bg-slate-50 text-slate-400'}`}
                  >
                    <Star className={`w-5 h-5 ${selectedIssue.isFavorite ? 'fill-yellow-500' : ''}`} />
                  </button>
                  
                  <button 
                    onClick={() => { if(confirm('确定删除吗？')) { deleteIssue(selectedIssue.id); setSelectedIssue(null) }}}
                    className="p-2 rounded-md border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* 内容渲染 */}
            <div className="max-w-4xl mx-auto px-8 py-8 space-y-8 pb-32">
              {selectedIssue.problem && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        🚫 Problem / Error Log
                    </h3>
                    <pre className="text-sm font-mono text-red-900 whitespace-pre-wrap break-words overflow-x-auto">
                        {selectedIssue.problem}
                    </pre>
                  </div>
              )}

              <div className="min-h-[200px]">
                <RenderMarkdown content={selectedIssue.solution} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
            <FileText className="w-20 h-20 mb-6 opacity-10" />
            <p className="text-lg font-medium text-slate-400">选择文档开始阅读，或点击“新建”</p>
          </div>
        )}
      </div>
    </div>
  )
}