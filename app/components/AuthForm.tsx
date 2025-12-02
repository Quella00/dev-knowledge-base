'use client'

import { useState, useEffect, useActionState } from 'react' // <--- 修改点 1：引入 useActionState
import { login, register } from '../actions' // 确保路径正确，可能是 '../actions' 或 '@/app/actions'
import { User, Lock, Key, RefreshCw, ArrowRight } from 'lucide-react'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [captchaUrl, setCaptchaUrl] = useState('/api/captcha')

  // <--- 修改点 2：使用 useActionState 替代 useFormState
  // useActionState 的返回值其实有三个：[state, action, isPending]，这里我们暂时只需要前两个
  const [loginState, loginAction, isLoginPending] = useActionState(login, null)
  const [registerState, registerAction, isRegisterPending] = useActionState(register, null)

  // 刷新验证码
  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/captcha?t=${Date.now()}`)
  }

  // 注册成功后自动切到登录
  useEffect(() => {
    if (registerState?.success) {
      alert("注册成功，请登录")
      setIsLogin(true)
      refreshCaptcha()
    }
  }, [registerState])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isLogin ? '欢迎回来' : '创建账户'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">Dev Knowledge Base</p>
        </div>

        {/* 表单区域 */}
        <form action={isLogin ? loginAction : registerAction} className="space-y-4">
          
          {/* 用户名 */}
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input name="username" required placeholder="用户名" className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          {/* 密码 */}
          <div className="relative">
            <Key className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input name="password" type="password" required placeholder="密码" className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          {/* 验证码 */}
          <div className="flex gap-2">
             <input name="code" required placeholder="验证码" className="w-32 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
             <div className="flex-1 flex items-center gap-2 justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={captchaUrl} 
                  alt="captcha" 
                  className="h-10 rounded border border-slate-200 cursor-pointer" 
                  onClick={refreshCaptcha}
                />
                <button type="button" onClick={refreshCaptcha} className="text-slate-400 hover:text-indigo-600">
                   <RefreshCw className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* 错误提示 */}
          {(loginState?.error || registerState?.error) && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {isLogin ? loginState?.error : registerState?.error}
            </div>
          )}

          {/* 提交按钮 */}
          <button 
            type="submit" 
            disabled={isLogin ? isLoginPending : isRegisterPending} // 利用 isPending 防止重复提交
            className={`w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 ${isLoginPending || isRegisterPending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {(isLoginPending || isRegisterPending) ? '处理中...' : (isLogin ? '登 录' : '注 册')} 
            {!(isLoginPending || isRegisterPending) && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* 底部切换 */}
        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button 
            onClick={() => { setIsLogin(!isLogin); refreshCaptcha(); }} 
            className="text-indigo-600 font-bold ml-1 hover:underline"
          >
            {isLogin ? '立即注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  )
}