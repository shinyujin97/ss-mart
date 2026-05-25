"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

export default function AutoLogout() {
  const { status } = useSession();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticated.current = true;
    }
    if (status === "unauthenticated" && wasAuthenticated.current) {
      signOut({ callbackUrl: "/login" });
    }
  }, [status]);

  return null;
}
