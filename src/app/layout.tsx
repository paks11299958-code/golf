import type { Metadata } from 'next'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: 'Vertex AI 기술 기반 골프 스윙 분석기 | golf.dbzone.kr',
  description: 'Vertex AI가 골프 스윙 영상과 사진을 분석하여 자세 교정 포인트와 맞춤 드릴을 제공합니다.',
  keywords: '골프 스윙, 골프 레슨, 스윙 교정, Vertex AI 골프, 골프 분석',
  openGraph: {
    title: 'Vertex AI 기술 기반 골프 스윙 분석기',
    description: 'Vertex AI가 내 골프 스윙을 분석하고 맞춤 교정 드릴을 알려드립니다',
    url: 'https://golf.dbzone.kr',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
