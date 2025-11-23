"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search, Filter, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Follower, UserStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type UserFollowersTableProps = {
  followers: Follower[]
}

export default function UserFollowersTable({ followers }: UserFollowersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All")

  const filteredFollowers = useMemo(() => {
    return followers.filter((follower) => {
      const matchesSearch =
        follower.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        follower.country.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "All" || follower.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [followers, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by username or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-lg border border-border/50">
          {(["All", "Following", "Follower", "Blocked"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                statusFilter === filter
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>
          Showing {filteredFollowers.length} of {followers.length} results
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-sm text-muted-foreground w-16">#</th>
                <th className="text-left py-4 px-6 font-medium text-sm text-muted-foreground min-w-[200px]">User</th>
                <th className="text-left py-4 px-6 font-medium text-sm text-muted-foreground w-32">Status</th>
                <th className="text-left py-4 px-6 font-medium text-sm text-muted-foreground w-40">Joined Twitter</th>
                <th className="text-left py-4 px-6 font-medium text-sm text-muted-foreground w-40">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredFollowers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-muted-foreground">
                    No results found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredFollowers.map((follower) => (
                  <tr key={follower.rank} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-4 px-6 text-muted-foreground font-mono text-sm">{follower.rank}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium font-mono text-foreground">{follower.handle}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal whitespace-nowrap",
                          follower.status === "Following" && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                          follower.status === "Follower" &&
                            "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                          follower.status === "Blocked" && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                        )}
                      >
                        {follower.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {follower.joinedDate && follower.joinedDate !== "Unknown" ? follower.joinedDate : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-sm whitespace-nowrap">
                      {follower.country && follower.country !== "Unknown" ? follower.country : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
