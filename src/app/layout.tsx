import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, IBM_Plex_Mono, Bebas_Neue } from "next/font/google";
import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import Providers from "@/components/Providers";
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ssmart.kr";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "에스에스종합상사 | 작업복·안전화·자수 전문",
    template: "%s | 에스에스종합상사",
  },
  description: "80여 개 브랜드 작업복·안전화·안전용품 전문 쇼핑몰. 자수·마킹 서비스, 단체주문 최대 30% 할인.",
  keywords: ["작업복", "안전화", "안전용품", "자수", "마킹", "단체주문", "유니폼", "에스에스종합상사"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "에스에스종합상사",
    title: "에스에스종합상사 | 작업복·안전화·자수 전문",
    description: "80여 개 브랜드 작업복·안전화·안전용품 전문 쇼핑몰. 자수·마킹 서비스, 단체주문 최대 30% 할인.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? "",
  },
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
        <Providers>
          <Header />
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingCTA />
        </Providers>
      </body>
    </html>
  );
}
