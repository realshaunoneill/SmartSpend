"use client"

import { Check, ChevronsUpDown, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState } from "react"
import type { Household } from "@/lib/types"

interface HouseholdSelectorProps {
  households: Household[]
  selectedHouseholdId?: string
  onSelect: (householdId: string) => void
}

export function HouseholdSelector({ 
  households, 
  selectedHouseholdId, 
  onSelect 
}: HouseholdSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedHousehold = households.find(h => h.id === selectedHouseholdId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {selectedHousehold ? selectedHousehold.name : "Select household..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search households..." />
          <CommandList>
            <CommandEmpty>No household found.</CommandEmpty>
            <CommandGroup>
              {households.map((household) => (
                <CommandItem
                  key={household.id}
                  value={household.name}
                  onSelect={() => {
                    onSelect(household.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedHouseholdId === household.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {household.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
