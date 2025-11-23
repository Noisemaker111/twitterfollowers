import { yacineFollowers } from "@/lib/mock-data"
import UserFollowersTable from "@/components/user-followers-table"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Share2, ShieldCheck } from "lucide-react"

export function generateMetadata({ params }: { params: { username: string } }) {
  return {
    title: `${params.username}'s Network - myxfollowing`,
    description: `View ${params.username}'s Twitter network analytics on myxfollowing.`,
  }
}

type PageProps = {
  params: Promise<{ username: string }>
}

export default async function UserPage({ params }: PageProps) {
  const resolvedParams = await params
  const username = resolvedParams.username

  // In a real app, we would fetch data based on the username
  // For this demo, we'll use the mock data for "yacineMTB" and show empty/error for others
  // or just show the same data for demo purposes if it matches specific handles

  if (username.toLowerCase() !== "yacinemtb") {
    // For demo purposes, we only have data for yacineMTB
    // In a real app, this would check the DB
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">We only have demo data for @yacineMTB currently.</p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                {username[0].toUpperCase()}
              </div>
              <span className="font-semibold text-lg">@{username}</span>
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Network Analytics</h1>
          <p className="text-muted-foreground">Analyze {username}'s followers, following, and blocked accounts.</p>
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts followers={yacineFollowers} />

        {/* Detailed Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Detailed List</h2>
          <UserFollowersTable followers={yacineFollowers} />
        </div>
      </main>
    </div>
  )
}
