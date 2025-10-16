"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RegisterFormProps {
  onRegisterSuccess: () => void
}

export default function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async () => {
    setError("")
    setSuccess("")

    if (!name || !email || !username || !phone || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (!/^\+?\d{8,15}$/.test(phone)) {
      setError("Ingresa un número de teléfono válido")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, phone, password }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess("¡Usuario registrado con éxito!")
        setName("")
        setEmail("")
        setUsername("")
        setPhone("")
        setPassword("")
        setConfirmPassword("")
        setError("")

        setTimeout(() => {
          onRegisterSuccess()
        }, 1500)
      } else {
        setError(data.error || "Error al registrar usuario")
      }
    } catch {
      setError("Error al conectar con el servidor")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm p-4 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Registro de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            className="border rounded-md p-2"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded-md p-2"
            placeholder="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border rounded-md p-2"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="border rounded-md p-2"
            placeholder="Número de teléfono"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="border rounded-md p-2"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="border rounded-md p-2"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && (
            <p
              className="text-sm font-medium text-center"
              style={{ color: "#0cb7f2" }}
            >
              {success}
            </p>
          )}

          <Button
            style={{ backgroundColor: "#0cb7f2", color: "white" }}
            onClick={handleRegister}
          >
            Registrarse
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
