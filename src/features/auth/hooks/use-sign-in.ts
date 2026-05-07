"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export function useSignIn() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async (email: string, password: string) => {
    setError("");
    setLoading(true);

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message || "An error occurred");
      setLoading(false);
    } else {
      router.push("/repos");
    }
  };

  const signInWithGithub = async () => {
    setError("");
    setLoading(true);

    await signIn.social({
      provider: "github",
      callbackURL: "/repos",
    });
  };

  return { signInWithEmail, signInWithGithub, error, loading };
}
