"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowUpRight, Bell, CheckCircle, QrCode, Ticket, Wallet, MapPin, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ContactScreen from "@/components/contact-screen"
import RedeemedCoupons from "@/components/redeemed-coupons"
import PointsHistory from "@/components/points-history"
import { motion, AnimatePresence } from "framer-motion"

const RecyclingMap = dynamic(() => import("@/components/recycling-map"), { ssr: false })
const QrScannerScreen = dynamic(() => import("@/components/qr-scanner-screen"), { ssr: false })
const RewardsCatalog = dynamic<{ onBack: () => void; onRedeem?: () => void }>(
  () => import("@/components/rewards-catalog"),
  { ssr: false }
)
const NotificationsPanel = dynamic(() => import("@/components/notifications-panel"), { ssr: false })

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

interface PaymentMenuProps {
  onLogout: () => void
}

export function PaymentMenu({ onLogout }: PaymentMenuProps) {
  const [currentScreen, setCurrentScreen] = useState<
    "menu" | "validation" | "map" | "contact" | "catalog" | "redeemed" | "points" | "scanner"
  >("menu")
  const [points, setPoints] = useState<number>(0)
  const [changeThisMonth, setChangeThisMonth] = useState<number>(0)
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [newRewardsCount, setNewRewardsCount] = useState<number>(0)

  const refreshUserData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPoints(data.points ?? 0)
      setUserName(data.name ?? null)
      setChangeThisMonth(data.changeThisMonth ?? 0)
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    const fetchNewRewards = async () => {
      try {
        const res = await fetch("/api/rewards", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.newRewardsCount !== undefined) {
          setNewRewardsCount(data.newRewardsCount)
        }
      } catch (err) {
        console.error("Error al obtener recompensas:", err)
      }
    }
    fetchNewRewards()
  }, [])

  useEffect(() => {
    refreshUserData().finally(() => {
      setLoadingPoints(false)
      setLoadingUser(false)
    })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    const fetchCount = async () => {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setUnreadCount(data.unreadCount || 0)
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (currentScreen === "catalog") {
    return (
      <RewardsCatalog
        onBack={() => {
          setCurrentScreen("menu")
          refreshUserData()
        }}
        onRedeem={() => {
          refreshUserData()
          const token = localStorage.getItem("token")
          if (token) {
            fetch("/api/rewards", { headers: { Authorization: `Bearer ${token}` } })
              .then((res) => res.json())
              .then((data) => setNewRewardsCount(data.newRewardsCount ?? 0))
          }
        }}
      />
    )
  }

  if (currentScreen === "redeemed") return <RedeemedCoupons onBack={() => setCurrentScreen("menu")} />

  if (currentScreen === "map")
    return (
      <RecyclingMap
        onBack={() => setCurrentScreen("menu")}
        addPoints={(pts: number) => {
          setPoints((prev) => prev + pts)
          setChangeThisMonth((prev) => prev + pts)
        }}
      />
    )

  if (currentScreen === "points") return <PointsHistory onBack={() => setCurrentScreen("menu")} />

  if (currentScreen === "scanner")
    return (
      <QrScannerScreen
        onBack={() => setCurrentScreen("menu")}
        addPoints={(pts: number) => {
          setPoints((prev) => prev + pts)
          setChangeThisMonth((prev) => prev + pts)
        }}
      />
    )

  const menuItems = [
    {
      title: "Puntos de Reciclaje",
      description: "Encuentra los puntos de reciclaje más cercanos.",
      icon: MapPin,
      color: BUTTON_COLOR,
      action: () => setCurrentScreen("map"),
    },
    {
      title: "Cupones Disponibles",
      description: "Explora las recompensas y descuentos que puedes canjear.",
      icon: Ticket,
      color: BUTTON_COLOR,
      badge: newRewardsCount > 0 ? `${newRewardsCount} nuevos` : null,
      action: () => setCurrentScreen("catalog"),
    },
    {
      title: "Cupones Canjeados",
      description: "Visualiza los cupones que ya has canjeado.",
      icon: CheckCircle,
      color: BUTTON_COLOR,
      action: () => setCurrentScreen("redeemed"),
    },
    {
      title: "Escanear QR",
      description: "Escanea un código QR para sumar puntos de reciclaje.",
      icon: QrCode,
      color: BUTTON_COLOR,
      action: () => setCurrentScreen("scanner"),
    },
    {
      title: "Mis Puntos",
      description: "Revisa cómo ganaste y utilizaste tus puntos de reciclaje.",
      icon: Wallet,
      color: BUTTON_COLOR,
      action: () => setCurrentScreen("points"),
    },
  ]

  const initials = userName
    ? userName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EF"

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-3xl font-bold" style={{ color: "black" }}>
            {loadingUser ? "Cargando..." : `¡Hola, ${userName ?? "usuario"}!`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            title={userName ?? "EcoFinder user"}
            className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: BUTTON_COLOR }}
          >
            {loadingUser ? "..." : initials}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 relative"
              style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
              onClick={() => {
                setShowNotifications(true)
                setUnreadCount(0)
              }}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-[6px] py-[1px]">
                  {unreadCount}
                </span>
              )}
            </Button>
            {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
          </div>

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

      <Card className="mb-8 border-0 text-primary-foreground" style={{ backgroundColor: BUTTON_COLOR }}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Puntos Disponibles</CardTitle>
          <AnimatePresence mode="wait">
            <motion.div
              key={points}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold"
            >
              {loadingPoints ? "..." : points} pts
            </motion.div>
          </AnimatePresence>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2 text-white/80">
            {changeThisMonth >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-200" />
            ) : (
              <ArrowUpRight className="h-4 w-4 rotate-180 text-red-200" />
            )}
            <span className={`text-sm ${changeThisMonth >= 0 ? "text-green-100" : "text-red-100"}`}>
              {changeThisMonth >= 0 ? `+${changeThisMonth}` : changeThisMonth} este mes
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {menuItems.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
            onClick={item.action}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl" style={{ backgroundColor: item.color, color: BUTTON_TEXT_COLOR }}>
                  <item.icon className="h-6 w-6" />
                </div>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-semibold px-2 py-[2px]"
                    style={{ backgroundColor: BUTTON_COLOR, color: "white" }}
                  >
                    {item.badge}
                  </Badge>
                )}
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
