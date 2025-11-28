"use client"

import { useState } from "react"
import { Crown, User, MoreVertical, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { removeMember, updateMemberRole } from "@/lib/household-actions"

interface Member {
  id: string
  user_id: string
  full_name: string
  email: string
  avatar_url?: string
  role: "admin" | "member"
  joined_at: string
}

interface HouseholdMembersListProps {
  householdId: string
  members: Member[]
  currentUserId: string
  isCurrentUserAdmin: boolean
  onUpdate: () => void
}

export function HouseholdMembersList({
  householdId,
  members,
  currentUserId,
  isCurrentUserAdmin,
  onUpdate,
}: HouseholdMembersListProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string>()

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member from the household?")) return

    setLoadingMemberId(userId)
    try {
      await removeMember({ householdId, userId })
      onUpdate()
    } catch (error) {
      alert("Failed to remove member")
    } finally {
      setLoadingMemberId(undefined)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: "admin" | "member") => {
    const newRole = currentRole === "admin" ? "member" : "admin"
    setLoadingMemberId(userId)
    try {
      await updateMemberRole({ householdId, userId, role: newRole })
      onUpdate()
    } catch (error) {
      alert("Failed to update role")
    } finally {
      setLoadingMemberId(undefined)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId
            const canManage = isCurrentUserAdmin && !isCurrentUser

            return (
              <div key={member.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/10">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url || "/placeholder.svg"}
                        alt={member.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {member.full_name}
                        {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === "admin" ? "default" : "secondary"}
                    className={member.role === "admin" ? "bg-primary" : ""}
                  >
                    {member.role === "admin" ? (
                      <>
                        <Crown className="mr-1 h-3 w-3" />
                        Admin
                      </>
                    ) : (
                      "Member"
                    )}
                  </Badge>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={loadingMemberId === member.user_id}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleRole(member.user_id, member.role)}>
                          {member.role === "admin" ? "Remove Admin" : "Make Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRemove(member.user_id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
