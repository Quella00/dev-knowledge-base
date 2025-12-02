// app/components/RenderMarkdown.tsx
'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy, Terminal, FileCode2 } from 'lucide-react'

// === 代码块组件 (保持之前的逻辑不变) ===
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  const codeString = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy!', err)
    }
  }

  if (inline) {
    return (
      <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-sm font-mono border border-slate-200 mx-1" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden group">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 backdrop-blur px-4 py-2.5 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white border border-slate-200 rounded shadow-sm">
             {['bash', 'sh', 'zsh', 'terminal', 'shell', 'cmd'].includes(language.toLowerCase()) ? (
                <Terminal className="h-3.5 w-3.5 text-slate-600" />
              ) : (
                <FileCode2 className="h-3.5 w-3.5 text-blue-500" />
              )}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {language === 'text' ? 'Code' : language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent transition-all duration-200 text-xs font-medium text-slate-500"
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-white relative">
        <SyntaxHighlighter
          {...props}
          style={oneLight}
          language={language}
          PreTag="div"
          showLineNumbers={true}
          wrapLongLines={true}
          lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1.5em', color: '#cbd5e1', textAlign: 'right', borderRight: '1px solid #f1f5f9', marginRight: '1.5em' }}
          customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.9rem', lineHeight: '1.7', backgroundColor: 'white', fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace' }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

// === 主渲染组件 ===
export default function RenderMarkdown({ content }: { content: string }) {
  return (
    // 移除了 prose 类，因为我们要手动接管所有样式，这样控制力更强
    <div className="text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 1. 代码块逻辑
          code: CodeBlock,
          
          // 2. 标题样式 (修复你的问题)
          h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-slate-900 mt-10 mb-6 pb-2 border-b border-slate-100" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-lg font-semibold text-slate-800 mt-6 mb-2" {...props} />,
          
          // 3. 列表样式 (修复列表不显示圆点/数字的问题)
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 my-4 space-y-2 marker:text-indigo-300" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 my-4 space-y-2 marker:font-bold marker:text-indigo-500" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,

          // 4. 引用块样式
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 py-3 px-4 rounded-r-lg my-6 text-slate-600 italic" {...props} />
          ),

          // 5. 链接样式
          a: ({node, ...props}) => <a className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline transition-colors" {...props} />,
          
          // 6. 表格样式
          table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
          th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
          tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
          td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600" {...props} />,
          
          // 7. 分割线
          hr: ({node, ...props}) => <hr className="my-8 border-t border-slate-200" {...props} />,
          
          // 8. 段落 (增加间距)
          p: ({node, ...props}) => <p className="my-4" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}