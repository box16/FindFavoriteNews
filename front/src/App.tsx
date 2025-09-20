import './App.css'
import { useEffect, useState } from "react"

export default function App() {
  const [health, setHealth] = useState("null")

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(setHealth)
      .catch(console.error)
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1>MyNewsApp (React + Vite)</h1>
      <p>API health: {health ? JSON.stringify(health) : "loading..."}</p>
    </main>
  )
}