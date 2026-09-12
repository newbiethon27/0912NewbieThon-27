import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LifePath — 커리어 선택이 만드는 미래 시뮬레이션',
  description:
    '현재의 소득, 지출, 통근, 저축 데이터를 바탕으로 커리어 선택이 미래 자산과 시간에 만드는 변화를 시뮬레이션합니다.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
