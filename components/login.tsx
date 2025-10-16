"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LoginFormProps {
  onLoginSuccess: () => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Guardar el token en localStorage (ejemplo)
        localStorage.setItem("token", data.token)

        // Llamar al callback
        onLoginSuccess()

        // Ir al menú
        router.push("/payment-menu")
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
    } catch (err) {
      setError("Error de conexión con el servidor")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <input
              className="border rounded-md p-2"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              className="border rounded-md p-2"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              style={{ backgroundColor: "#0cb7f2", color: "white" }}
            >
              Ingresar
            </Button>

            {/* Olvidaste tu contraseña debajo del botón ingresar */}
            <p className="text-center text-sm mt-2">
              ¿Olvidaste tu contraseña?{" "}
              <span
                onClick={() => router.push("/reset-password")}
                className="text-sky-500 cursor-pointer hover:underline"
              >
                Recuperar
              </span>
            </p>

            {/* Registro */}
            <p className="text-center text-sm mt-2">
              ¿No tienes cuenta?{" "}
              <span
                onClick={() => router.push("/register")}
                className="text-sky-500 cursor-pointer hover:underline"
              >
                Regístrate
              </span>
            </p>

            {/* Contacto / Colaboración */}
            <p className="text-center text-sm mt-2">
              ¿Deseas colaborar?{" "}
              <span
                onClick={() => router.push("/contact")}
                className="text-sky-500 cursor-pointer hover:underline"
              >
                Contáctanos
              </span>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Todos los derechos reservados por EcoFinder © {new Date().getFullYear()}
      </p>
    </div>
  )
}
