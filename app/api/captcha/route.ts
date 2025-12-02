// app/api/captcha/route.ts
import { NextResponse } from 'next/server';
import svgCaptcha from 'svg-captcha';
import { encrypt } from '@/app/lib'; // 引入刚才写的加密工具

export async function GET() {
  // 生成验证码
  const captcha = svgCaptcha.create({
    size: 4, // 4个字符
    ignoreChars: '0o1i', // 排除易混淆字符
    noise: 2, // 干扰线数量
    color: true, // 彩色
    width: 100,
    height: 40,
  });

  // 将验证码的文字答案加密后存入 header/cookie
  // 这里我们临时存一个叫 'captcha_hash' 的 cookie，有效期很短 (5分钟)
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  const hash = await encrypt({ text: captcha.text.toLowerCase() });

  const response = new NextResponse(captcha.data, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });

  response.cookies.set('captcha_hash', hash, {
    httpOnly: true,
    expires,
    path: '/', // 确保全局可访问
  });

  return response;
}