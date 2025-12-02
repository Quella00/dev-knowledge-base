// app/lib.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = "secret-key-please-change-in-prod";
const key = new TextEncoder().encode(secretKey);

// 1. 加密 Session
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

// 2. 解密 Session
export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

// 3. 获取当前登录用户 (注意这里加了 await)
export async function getSession() {
  // === 修改点 1：Next.js 15 中 cookies() 是异步的 ===
  const cookieStore = await cookies(); 
  const session = cookieStore.get("session")?.value;
  
  if (!session) return null;
  return await decrypt(session);
}

// 4. 登录成功后设置 Cookie (注意这里加了 await)
export async function setSession(user: { id: number; username: string }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  // === 修改点 2：Next.js 15 中 cookies() 是异步的 ===
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    path: "/",
  });
}

// 5. 退出登录 (注意这里加了 await)
export async function logout() {
  // === 修改点 3：Next.js 15 中 cookies() 是异步的 ===
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0), path: "/" });
}