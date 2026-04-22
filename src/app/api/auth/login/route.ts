import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const loginRateMap = new Map<string, { count: number; resetAt: number }>()
function checkLoginRate(ip: string): boolean {
  const now = Date.now()
  const entry = loginRateMap.get(ip)
  if (!entry || now > entry.resetAt) { loginRateMap.set(ip, { count: 1, resetAt: now + 3600_000 }); return true }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkLoginRate(ip))
    return NextResponse.json({ error: '로그인 시도 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.' }, { status: 429 })

  try {
    const { email, password } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user)
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })

    const token = await new SignJWT({ id: user.id, email: user.email, username: user.username, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    const res = NextResponse.json({ id: user.id, email: user.email, username: user.username, role: user.role })
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: '로그인 오류가 발생했습니다.' }, { status: 500 })
  }
}
