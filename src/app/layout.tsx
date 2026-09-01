import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import UIProvider from "@/components/ui/UIProvider";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "نظام الامتحانات الآمن",
  description: "منصة امتحانات إلكترونية آمنة للطلاب مع حماية متعددة الطبقات من الغش",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <head>
        {/* Applies a previously-chosen dark-mode preference before paint,
            so a returning student doesn't see a light flash first. Reads
            localStorage only — never OS preference — so this can never
            put a teacher into dark mode on their own. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.dataset.theme='dark';}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}
