import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VedaAI — Premium AI Assessment Creator",
  description: "Generate structured examination worksheets, quiz lists, and question papers instantly from documents using state-of-the-art AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#F3F4F6] text-zinc-950`}
      >
        {children}
      </body>
    </html>
  );
}
