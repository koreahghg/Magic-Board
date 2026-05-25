import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KBO 매직보드",
  description: "KBO 정규시즌 매직·트래직넘버 실시간 트래커. 포스트시즌 진출·탈락 현황을 한눈에.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-background/95 backdrop-blur-sm px-6 py-4">
            <h1 className="text-xl font-bold tracking-tight">⚾ KBO 매직보드</h1>
            <p className="text-xs text-slate-500 mt-0.5">매직·트래직넘버 실시간 트래커</p>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
