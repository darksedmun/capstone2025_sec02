"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Minus, Navigation, QrCode } from "lucide-react"
import QrScanner from "qr-scanner"

interface RecyclingMapProps {
  onBack?: () => void
  addPoints?: (points: number) => void
}

export default function RecyclingMap({ onBack, addPoints }: RecyclingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const [showScanner, setShowScanner] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  // 🌍 Inicializar mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return
    mapContainerRef.current.style.width = "100%"
    mapContainerRef.current.style.height = "100%"

    const map: L.Map = L.map(mapContainerRef.current, {
      center: [-33.509, -70.756],
      zoom: 14,
      zoomControl: false,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    mapRef.current = map

    const recyclingPoints = [
      { lat: -33.51031462661952, lng: -70.75715535967082, name: "Punto Reciclaje Metro Plaza Maipú" },
      { lat: -33.510728936127386, lng: -70.76439657186344, name: "Punto Reciclaje Templo Votivo" },
      { lat: -33.48137909660768, lng: -70.75146264857686, name: "Punto Reciclaje Mall Arauco Maipú" },
      { lat: -33.51121454604599, lng: -70.75247074605075, name: "Punto Reciclaje Duoc UC: sede Maipú" },
    ]

    const recycleIcon = L.divIcon({
      html: `<svg width="36" height="36" viewBox="0 0 24 24" fill="green"><path d="M12 2L15.5 8H8.5L12 2ZM2 22L5.5 16H18.5L22 22H2Z"/></svg>`,
      className: "",
      iconAnchor: [18, 36],
    })

    recyclingPoints.forEach((point) => {
      L.marker([point.lat, point.lng], { icon: recycleIcon })
        .addTo(map)
        .bindPopup(`<b>${point.name}</b>`)
    })

    return () => {
      map.remove()
    }
  }, [])

  // 📷 Escaneo QR
  useEffect(() => {
    if (showScanner && videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          scannerRef.current?.stop()
          setShowScanner(false)

          const token = localStorage.getItem("token")

          if (!token) {
            setMessage({ text: "Debes iniciar sesión para escanear.", type: "error" })
            setTimeout(() => setMessage(null), 2500)
            return
          }

          try {
            const res = await fetch("/api/scanner", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({ qrCode: result.data }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
              setMessage({ text: "¡Reciclaje registrado correctamente!", type: "success" })
              if (addPoints) addPoints(data.pointsAdded || 50) // Si la API no devuelve puntos
            } else {
              setMessage({ text: data.error || "Error al registrar reciclaje.", type: "error" })
            }
          } catch (err) {
            console.error(err)
            setMessage({ text: "Error de conexión con el servidor.", type: "error" })
          }

          setTimeout(() => setMessage(null), 2500)
        },
        { highlightScanRegion: true, highlightCodeOutline: true }
      )

      scannerRef.current.start()
    }

    return () => {
      scannerRef.current?.stop()
    }
  }, [showScanner, addPoints])

  // 🔍 Funciones de control del mapa
  const zoomIn = () => mapRef.current?.zoomIn()
  const zoomOut = () => mapRef.current?.zoomOut()

  const geolocate = () => {
    if (!mapRef.current || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude, longitude } = coords
      mapRef.current!.setView([latitude, longitude], 16)

      const userIcon = L.divIcon({
        html: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0cb7f2"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>`,
        className: "",
        iconAnchor: [20, 40],
      })

      if (!markerRef.current) {
        markerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current!)
      } else {
        markerRef.current.setLatLng([latitude, longitude])
      }
    })
  }


  return (
    <div className="relative w-full h-screen">
      {onBack && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            style={{ backgroundColor: "#0cb7f2", color: "white" }}
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        <Button type="button" onClick={zoomIn} style={{ backgroundColor: "#0cb7f2", color: "white" }}>
          <Plus className="h-5 w-5" />
        </Button>
        <Button type="button" onClick={zoomOut} style={{ backgroundColor: "#0cb7f2", color: "white" }}>
          <Minus className="h-5 w-5" />
        </Button>
        <Button type="button" onClick={geolocate} style={{ backgroundColor: "#0cb7f2", color: "white" }}>
          <Navigation className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          onClick={() => setShowScanner(true)}
          style={{ backgroundColor: "#0cb7f2", color: "white" }}
        >
          <QrCode className="h-5 w-5" />
        </Button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />

      {showScanner && (
        <div className="absolute inset-0 bg-black/80 z-[2000] flex flex-col items-center justify-center">
          <p className="text-white mb-2">Escanea el código QR</p>
          <video ref={videoRef} style={{ width: "90%", maxWidth: "400px", borderRadius: "8px" }} />
          <Button
            type="button"
            onClick={() => setShowScanner(false)}
            className="mt-4 w-[200px]"
            style={{ backgroundColor: "#0cb7f2", color: "white" }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {message && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md z-[2000]">
          <p className="text-center font-medium" style={{ color: message.type === "success" ? "#0cb7f2" : "#ef4444" }}>
            {message.text}
          </p>
        </div>
      )}
    </div>
  )
}
