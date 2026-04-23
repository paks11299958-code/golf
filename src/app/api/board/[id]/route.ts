import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

async function getUser(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { id: number; email: string; username?: string; role: string }
  } catch { return null }
}

// 상세 조회 — 작성자 또는 관리자만
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.boardPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { username: true, email: true } },
        replies: {
          include: { user: { select: { username: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const isAuthor = post.userId === user.id
    const isAdmin = user.role === 'ADMIN'
    if (!isAuthor && !isAdmin)
      return NextResponse.json({ error: '열람 권한이 없습니다.' }, { status: 403 })

    return NextResponse.json(post)
  } catch (err) {
    console.error('[board GET detail]', err)
    return NextResponse.json({ error: '불러오기 실패' }, { status: 500 })
  }
}

// 게시글 수정 — 작성자만
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.boardPost.findUnique({ where: { id: parseInt(id) } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    if (post.userId !== user.id)
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })

    const { title, content } = await req.json()
    if (!title?.trim() || !content?.trim())
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })

    await prisma.boardPost.update({
      where: { id: parseInt(id) },
      data: { title: title.trim(), content: content.trim() },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[board PUT]', err)
    return NextResponse.json({ error: '수정 실패' }, { status: 500 })
  }
}

// 게시글 삭제 — 작성자 또는 관리자
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.boardPost.findUnique({ where: { id: parseInt(id) } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    const isAuthor = post.userId === user.id
    const isAdmin = user.role === 'ADMIN'
    if (!isAuthor && !isAdmin)
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })

    await prisma.boardPost.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[board DELETE]', err)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
