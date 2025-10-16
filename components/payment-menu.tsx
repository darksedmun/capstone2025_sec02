"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Bell, CheckCircle, CreditCard, History, QrCode, Shield, Ticket, Wallet, MapPin, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidationScreen } from "@/components/validation-screen"
import RecyclingMap from "@/components/recycling-map"
import ContactScreen from "@/components/contact-screen"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

interface PaymentMenuProps {
  onLogout: () => void
}

export function PaymentMenu({ onLogout }: PaymentMenuProps) {
  const [currentScreen, setCurrentScreen] = useState<"menu" | "validation" | "map" | "contact">("menu")
  const [points, setPoints] = useState<number>(0)
  const [changeThisMonth, setChangeThisMonth] = useState<number>(0)
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoadingPoints(false)
      setLoadingUser(false)
      return
    }

    fetch("/api/user", {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setPoints(data.points ?? 0)
        setUserName(data.name ?? null)
        setChangeThisMonth(0)
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoadingPoints(false)
        setLoadingUser(false)
      })
  }, [])

  if (currentScreen === "validation") {
    return <ValidationScreen onBack={() => setCurrentScreen("menu")} />
  }

  if (currentScreen === "map") {
    return (
      <RecyclingMap
        onBack={() => setCurrentScreen("menu")}
        addPoints={(pts: number) => {
          setPoints(prev => prev + pts)
          setChangeThisMonth(prev => prev + pts)
        }}
      />
    )
  }

  const menuItems = [
    { title: "Solicitar Código de Validación", description: "Generar código para validar pagos", icon: Shield, color: BUTTON_COLOR, action: () => setCurrentScreen("validation") },
    { title: "Ver Puntos de Reciclaje", description: "Ubica los puntos de reciclaje cercanos", icon: MapPin, color: BUTTON_COLOR, action: () => setCurrentScreen("map") },
    { title: "Cupones Disponibles", description: "Ver cupones activos y promociones", icon: Ticket, color: BUTTON_COLOR, badge: "3 nuevos", action: () => console.log("Ver cupones disponibles") },
    { title: "Cupones Canjeados", description: "Historial de cupones utilizados", icon: CheckCircle, color: BUTTON_COLOR, action: () => console.log("Ver cupones canjeados") },
    { title: "Escanear QR", description: "Realizar pago mediante código QR", icon: QrCode, color: BUTTON_COLOR, action: () => console.log("Escanear QR") },
    { title: "Historial de Pagos", description: "Ver todas las transacciones", icon: History, color: BUTTON_COLOR, action: () => console.log("Ver historial") },
    { title: "Mi Billetera", description: "Gestionar saldo y métodos de pago", icon: Wallet, color: BUTTON_COLOR, action: () => console.log("Abrir billetera") },
  ]

  // Iniciales del usuario
  const initials = userName ? userName.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase() : "EF"

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {/* Izquierda: solo saludo */}
        <div>
          <p
            className="text-3xl font-bold"
            style={{ color: "black" }}
          >
            {loadingUser ? "Cargando..." : `¡Hola, ${userName ?? "usuario"}!`}
          </p>
        </div>

        {/* Derecha: EF, Noti, Salir */}
        <div className="flex items-center gap-3">
          {/* EF icono */}
          <div
            title={userName ?? "EcoFinder user"}
            className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          >
            {loadingUser ? "..." : initials}
          </div>

          {/* Notificaciones */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12"
            style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          >
            <Bell className="h-6 w-6" />
          </Button>

          {/* Salir */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12"
            style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
            onClick={onLogout}
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="mb-8 border-0 text-primary-foreground" style={{ backgroundColor: BUTTON_COLOR }}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Puntos Disponibles</CardTitle>
          <div className="text-3xl font-bold">{loadingPoints ? "..." : points} pts</div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-white/80">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-sm">+{changeThisMonth} este mes</span>
          </div>
        </CardContent>
      </Card>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {menuItems.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
            onClick={item.action}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: item.color, color: BUTTON_TEXT_COLOR }}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
