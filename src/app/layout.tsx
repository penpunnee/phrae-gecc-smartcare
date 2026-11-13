import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ศูนย์บริการร่วม พมจ.แพร่ (GECC Smart Care)",
  description: "ระบบส่งตรวจเอกสารล่วงหน้าและจองคิวด่วน ศูนย์บริการร่วม สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ (มาตรฐานศูนย์ราชการสะดวก GECC)",
  keywords: ["พมจ.แพร่", "GECC", "Smart Care", "ทำบัตรคนพิการ", "เงินสงเคราะห์", "จองคิวออนไลน์", "แพร่"],
  authors: [{ name: "สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-pink-100 selection:text-pink-900">
        {children}
      </body>
    </html>
  );
}
