import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { sendEmail } from '@/lib/email'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

async function getUser(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { id: number; email: string; username?: string; role: string }
  } catch { return null }
}

// 목록 조회 — 제목만 공개, 내용은 숨김
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  try {
    const posts = await prisma.boardPost.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, email: true } },
        _count: { select: { replies: true } },
      },
    })
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[board GET]', err)
    return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
  }
}

// 게시글 작성 — 회원만 가능
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  try {
    const { title, content } = await req.json()
    if (!title?.trim() || !content?.trim())
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })

    const post = await prisma.boardPost.create({
      data: { userId: user.id, title: title.trim(), content: content.trim() },
    })

    // DB에서 관리자 이메일 전체 조회 후 알림 발송
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
      })
      if (admins.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await sendEmail({
          to: admins.map(a => a.email),
          subject: '[Vertex AI 골프 코칭] 소통게시판 새 글이 등록되었습니다',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8faf7;color:#1a1f1a;border-radius:12px;border:1px solid #d4e4d0;">
              <h2 style="color:#357132;margin-bottom:8px;">새 문의글이 등록되었습니다</h2>
              <p style="color:#4a5e48;font-size:14px;line-height:1.6;">
                작성자: <strong>${user.username || user.email}</strong><br/>
                제목: <strong>${title.trim()}</strong>
              </p>
              <a href="${baseUrl}/board/${post.id}"
                style="display:inline-block;margin-top:24px;padding:12px 28px;background:#357132;color:#ffffff;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
                게시글 확인하기
              </a>
              <p style="margin-top:24px;font-size:12px;color:#8a9e88;">
                Vertex AI 골프 코칭 · golf.dbzone.kr
              </p>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error('[board post email] 오류:', e)
    }

    return NextResponse.json({ id: post.id })
  } catch (err) {
    console.error('[board POST]', err)
    return NextResponse.json({ error: '게시글 등록 실패' }, { status: 500 })
  }
}
