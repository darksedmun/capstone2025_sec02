"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Gift, Lock, CheckCircle } from "lucide-react"

const BUTTON_COLOR = "#0cb7f2"
const BUTTON_TEXT_COLOR = "white"

interface Reward {
  id: number
  name: string
  description: string
  points: number
  store: string
  image?: string
}

export default function RewardsCatalog({
  onBack,
}: {
  onBack: () => void
}) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPoints, setUserPoints] = useState<number>(0)
  const [redeeming, setRedeeming] = useState<number | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const resUser = await fetch("/api/user", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const userData = await resUser.json()
        setUserPoints(userData.points ?? 0)

        const resRewards = await fetch("/api/rewards")
        const data = await resRewards.json()
        setRewards(data.rewards ?? [])
      } catch {
        setError("No se pudieron cargar los cupones.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 2500)
  }

  const handleRedeem = async (reward: Reward) => {
    const token = localStorage.getItem("token")
    if (!token) return showMessage("Debes iniciar sesión para canjear.", "error")

    if (userPoints < reward.points) return showMessage("No tienes suficientes puntos 😢", "error")

    setRedeeming(reward.id)
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rewardId: reward.id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al canjear")

      showMessage(`🎉 ¡Canje exitoso!`, "success")
      setUserPoints((prev) => prev - reward.points)
    } catch (err: any) {
      showMessage(err.message || "Error al canjear", "error")
    } finally {
      setRedeeming(null)
    }
  }

  if (loading) return <p className="text-center mt-10 text-gray-600">Cargando cupones...</p>

  return (
    <div className="relative min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          style={{ backgroundColor: BUTTON_COLOR, color: BUTTON_TEXT_COLOR }}
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">Catálogo de Cupones</h1>
        <div className="text-right text-sm text-gray-700">
          <p className="font-semibold">Tus puntos</p>
          <p className="text-lg">{userPoints} pts</p>
        </div>
      </div>

      {/* Grid de cupones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map((reward) => {
          const canRedeem = userPoints >= reward.points
          return (
            <Card
              key={reward.id}
              className="transition-all hover:shadow-lg border-2 rounded-xl"
              style={{ borderColor: canRedeem ? BUTTON_COLOR : "#ccc" }}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                {reward.image ? (
                  <img src={reward.image} alt={reward.name} className="h-12 w-12 object-contain" />
                ) : (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: BUTTON_COLOR, color: "white" }}
                  >
                    <Gift className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle>{reward.name}</CardTitle>
                  <CardDescription>{reward.store}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col justify-between h-full">
                <p className="text-gray-700 mb-3 min-h-[40px]">{reward.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-semibold text-gray-800">{reward.points} pts</span>

                  {canRedeem ? (
                    <Button
                      size="sm"
                      disabled={redeeming === reward.id}
                      style={{
                        backgroundColor: BUTTON_COLOR,
                        color: BUTTON_TEXT_COLOR,
                      }}
                      onClick={() => handleRedeem(reward)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {redeeming === reward.id ? "Canjeando..." : "Canjear"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="opacity-70"
                      style={{
                        backgroundColor: "#999",
                        color: "white",
                      }}
                    >
                      <Lock className="h-4 w-4 mr-2" /> Bloqueado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Mensaje flotante estilo QR */}
      {message && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md z-[2000]">
          <p
            className="text-center font-medium"
            style={{
              color: message.type === "success" ? "#0cb7f2" : "#ef4444",
            }}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  )
}
