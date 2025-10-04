"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizRedirectClient({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/welcome?id=${id}`);
  }, [id, router]);
  return null;
} 