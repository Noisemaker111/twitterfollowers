import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-bold">User Not Found</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          This user hasn't connected their Twitter account yet or the profile doesn't exist.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </main>
  )
}
