"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Calendar, PieChart, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const data = JSON.parse(json)
        // Store in localStorage for the dashboard to read
        localStorage.setItem("myxfollowing_data", JSON.stringify(data))
        router.push("/dashboard")
      } catch (error) {
        console.error("Error parsing JSON:", error)
        alert("Invalid JSON file")
      } finally {
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-bold">myxfollowing</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
              <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-balance">
            Analyze Your <span className="text-blue-500">Twitter Network</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 text-balance">
            Get detailed insights into your followers. View join dates, filter by status (blocked/following), and
            visualize your network growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 bg-blue-600 hover:bg-blue-700"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Upload Extension Data"}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
              <Link href="/yacineMTB">View Demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Don't have the extension? <span className="text-blue-400 cursor-pointer">Download it here</span>.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Join Date Analytics</h3>
            <p className="text-muted-foreground leading-relaxed">
              See when your followers joined Twitter. Identify long-time users versus new accounts in your network.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Status Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              Easily filter between followers, following, and blocked accounts. Keep your network clean and organized.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <PieChart className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Visual Insights</h3>
            <p className="text-muted-foreground leading-relaxed">
              Understand your network composition with intuitive charts and breakdown visualizations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">© 2025 myxfollowing. Analyze your network.</p>
        </div>
      </footer>
    </main>
  )
}
