"use client";

import { SessionProvider } from "next-auth/react";
import AutoLogout from "@/components/AutoLogout";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // 5분마다 세션 유효성 재확인, 탭 포커스 시에도 재확인
    <SessionProvider refetchInterval={300} refetchOnWindowFocus>
      <AutoLogout />
      {children}
    </SessionProvider>
  );
}
