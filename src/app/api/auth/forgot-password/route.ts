import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email)
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })

    // 보안: 계정 존재 여부 노출 안 함
    if (!user)
      return NextResponse.json({ message: '이메일이 발송되었습니다.' })

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 1000 * 60 * 30) // 30분

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'noreply@golf.dbzone.kr',
      to: email,
      subject: '[Vertex AI 골프 코칭] 비밀번호 재설정',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8faf7;color:#1a1f1a;border-radius:12px;border:1px solid #d4e4d0;">
          <h2 style="color:#357132;margin-bottom:8px;">비밀번호 재설정</h2>
          <p style="color:#4a5e48;font-size:14px;line-height:1.6;">
            아래 버튼을 클릭해 비밀번호를 재설정해주세요.<br/>
            링크는 <strong>30분</strong> 후 만료됩니다.
          </p>
          <a href="${resetUrl}"
            style="display:inline-block;margin-top:24px;padding:12px 28px;background:#357132;color:#ffffff;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
            비밀번호 재설정하기
          </a>
          <p style="margin-top:24px;font-size:12px;color:#8a9e88;">
            이 요청을 하지 않으셨다면 무시하셔도 됩니다.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ message: '이메일이 발송되었습니다.' })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 })
  }
}
