"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

export interface FilterOption {
  label: string
  value: string
}

export interface ActiveFilter {
  key: string
  label: string
  value: string
  displayValue: string
}

interface FilterToolbarProps {
  filters: {
    key: string
    label: string
    options: FilterOption[]
  }[]
  activeFilters: ActiveFilter[]
  onFilterChange: (key: string, value: string) => void
  onFilterRemove: (key: string) => void
  onClearAll: () => void
}

export function FilterToolbar({
  filters,
  activeFilters,
  onFilterChange,
  onFilterRemove,
  onClearAll,
}: FilterToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters.find((f) => f.key === filter.key)?.value || ""}
            onValueChange={(value) => onFilterChange(filter.key, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">활성 필터:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-1">
              {filter.label}: {filter.displayValue}
              <button
                onClick={() => onFilterRemove(filter.key)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            모두 지우기
          </Button>
        </div>
      )}
    </div>
  )
}
