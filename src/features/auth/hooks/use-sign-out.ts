"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOutUser = async () => {
    setLoading(true);
    await signOut();
    router.push("/");
  };

  return { signOutUser, loading };
}
