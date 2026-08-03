"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentAdmin } from "../api";

/** Redirect signed-in visitors away from guest-only pages. */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    void getCurrentAdmin()
      .then(() => {
        if (isCurrent) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [router]);

  return isCheckingSession;
}
