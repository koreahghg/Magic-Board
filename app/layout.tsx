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
  title: "KBO 매직넘버 트래커",
  description: "KBO 리그 순위 및 매직넘버 실시간 트래커",
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
          <header className="border-b px-6 py-4">
            <h1 className="text-xl font-bold tracking-tight">
              ⚾ KBO 매직넘버 트래커
            </h1>
          </header>
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
