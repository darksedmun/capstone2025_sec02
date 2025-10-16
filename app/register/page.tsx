"use client"

import { useState } from "react"
import RegisterForm from "@/components/register"
import LoginForm from "@/components/login"

export default function RegisterPage() {
  const [registered, setRegistered] = useState(false)

  if (registered) {
    // 👇 después de registrarse, lo mandamos al login
    return <LoginForm onLoginSuccess={() => console.log("logueado")} />
  }

  return <RegisterForm onRegisterSuccess={() => setRegistered(true)} />
}
