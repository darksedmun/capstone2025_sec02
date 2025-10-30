"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Lightbulb, RefreshCcw, Leaf } from "lucide-react"

const ICONS: Record<string, JSX.Element> = {
  habit: <Brain className="text-[#0cb7f2] w-6 h-6" />,
  suggestion: <Lightbulb className="text-yellow-500 w-6 h-6" />,
  summary: <RefreshCcw className="text-green-500 w-6 h-6" />,
}

interface Notification {
  id: number
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [insights, setInsights] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("No estás autenticado.")
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error al obtener notificaciones")
        setInsights(data.insights || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    fetch("/api/notifications", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-semibold">Notificaciones Inteligentes</h2>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-600 py-6">
            <Leaf className="w-10 h-10 text-[#0cb7f2] mb-2" />
            <p className="text-sm">No tienes notificaciones nuevas.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {insights.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  n.read ? "border-gray-200" : "border-[#0cb7f2]"
                }`}
              >
                {ICONS[n.type] || <Brain className="text-blue-500 w-6 h-6" />}
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("es-CL")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button onClick={onClose} className="mt-5 w-full" style={{ backgroundColor: "#0cb7f2", color: "white" }}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}
