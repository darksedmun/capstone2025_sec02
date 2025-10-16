"use client"

import { useState } from "react"
import LoginForm from "@/components/login"
import { PaymentMenu } from "@/components/payment-menu"

export default function LoginPage() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (loggedIn) return <PaymentMenu />

  return <LoginForm onLoginSuccess={() => setLoggedIn(true)} />
}
