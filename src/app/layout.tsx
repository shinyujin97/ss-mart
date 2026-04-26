import type { Metadata } from "next";
import { Noto_Sans_KR, IBM_Plex_Mono, Bebas_Neue } from "next/font/google";
import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "에스에스종합상사 | 작업복·안전화·자수 전문",
  description:
    "80여 개 브랜드 작업복·안전화·안전용품 전문 쇼핑몰. 자수·마킹 서비스, 단체주문 최대 30% 할인.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${ibmPlexMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <Header />
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
    </html>
  );
}
