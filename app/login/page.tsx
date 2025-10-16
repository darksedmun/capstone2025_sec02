"use client"

import { useRouter } from "next/navigation"
import LoginForm from "@/components/login"

export default function LoginPage() {
  const router = useRouter()

  return (
    <LoginForm onLoginSuccess={() => router.push("/payment")} />
  )
}
