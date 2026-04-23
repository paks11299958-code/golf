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

// 답글 작성 — 작성자 또는 관리자
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  try {
    const { id } = await params
    const postId = parseInt(id)
    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })

    const post = await prisma.boardPost.findUnique({
      where: { id: postId },
      include: { user: { select: { email: true, username: true } } },
    })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const isAdmin = user.role === 'ADMIN'
    const isAuthor = post.userId === user.id

    if (!isAdmin && !isAuthor)
      return NextResponse.json({ error: '댓글 작성 권한이 없습니다.' }, { status: 403 })

    const reply = await prisma.boardReply.create({
      data: { postId, userId: user.id, isAdminReply: isAdmin, content: content.trim() },
    })

    // 관리자가 답글을 달았을 때만 작성자에게 이메일 알림
    if (isAdmin && !isAuthor) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await sendEmail({
          to: post.user.email,
          subject: '[Vertex AI 골프 코칭] 소통게시판 답글이 등록되었습니다',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8faf7;color:#1a1f1a;border-radius:12px;border:1px solid #d4e4d0;">
              <h2 style="color:#357132;margin-bottom:8px;">답글이 등록되었습니다</h2>
              <p style="color:#4a5e48;font-size:14px;line-height:1.6;">
                안녕하세요, <strong>${post.user.username || post.user.email}</strong>님.<br/>
                회원님의 게시글 <strong>"${post.title}"</strong>에 관리자 답글이 등록되었습니다.
              </p>
              <a href="${baseUrl}/board/${post.id}"
                style="display:inline-block;margin-top:24px;padding:12px 28px;background:#357132;color:#ffffff;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">
                답글 확인하기
              </a>
              <p style="margin-top:24px;font-size:12px;color:#8a9e88;">
                Vertex AI 골프 코칭 · golf.dbzone.kr
              </p>
            </div>
          `,
        })
      } catch (e) {
        console.error('[board reply email] 오류:', e)
      }
    }

    return NextResponse.json({ id: reply.id })
  } catch (err) {
    console.error('[board reply POST]', err)
    return NextResponse.json({ error: '댓글 등록 실패' }, { status: 500 })
  }
}
