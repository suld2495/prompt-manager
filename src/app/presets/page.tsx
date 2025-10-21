"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchInput } from "@/components/search-input"
import { TableSkeleton } from "@/components/skeleton-loader"
import { toast } from "sonner"
import type { CategoryPresetWithItems } from "@/types/preset"

export default function PresetsPage() {
  const router = useRouter()
  const [presets, setPresets] = useState<CategoryPresetWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newPreset, setNewPreset] = useState({ name: "", description: "" })
  const [searchQuery, setSearchQuery] = useState("")

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/presets')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setPresets(data)
    } catch (error) {
      toast.error("프리셋 목록을 불러올 수 없습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [])

  const handleCreate = async () => {
    if (!newPreset.name.trim()) {
      toast.error("프리셋 이름을 입력해주세요.")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreset)
      })

      if (!response.ok) throw new Error('Failed to create')

      const created = await response.json()
      toast.success("프리셋이 생성되었습니다.")
      router.push(`/presets/${created.id}`)
    } catch (error) {
      toast.error("프리셋을 생성할 수 없습니다.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success("프리셋이 삭제되었습니다.")
      fetchPresets()
    } catch (error) {
      toast.error("프리셋을 삭제할 수 없습니다.")
    }
  }

  const handleCopy = async (id: string) => {
    try {
      const response = await fetch(`/api/presets/${id}/copy`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to copy')

      toast.success("프리셋이 복사되었습니다.")
      fetchPresets()
    } catch (error) {
      toast.error("프리셋을 복사할 수 없습니다.")
    }
  }

  const getTotalRules = (preset: CategoryPresetWithItems) => {
    return preset.presetItems.reduce(
      (sum, item) => sum + (item.category.categoryRules?.length || 0),
      0
    )
  }

  // 검색 필터링
  const filteredPresets = useMemo(() => {
    if (!searchQuery) return presets

    const query = searchQuery.toLowerCase()
    return presets.filter(
      (preset) =>
        preset.name.toLowerCase().includes(query) ||
        preset.description?.toLowerCase().includes(query)
    )
  }, [presets, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📦 카테고리 프리셋</h1>
          <p className="text-muted-foreground">자주 사용하는 카테고리 조합을 관리합니다 ({filteredPresets.length}개)</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>+ 새 프리셋</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 프리셋 만들기</DialogTitle>
              <DialogDescription>
                프리셋 이름과 설명을 입력하세요.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  placeholder="예: React 표준 프리셋"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Textarea
                  id="description"
                  value={newPreset.description}
                  onChange={(e) => setNewPreset({ ...newPreset, description: e.target.value })}
                  placeholder="프리셋에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <SearchInput
          placeholder="프리셋 검색 (이름, 설명)"
          onSearch={setSearchQuery}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredPresets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              아직 프리셋이 없습니다. 새 프리셋을 추가해보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPresets.map((preset) => (
            <Card key={preset.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{preset.name}</CardTitle>
                    {preset.description && (
                      <CardDescription>{preset.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {preset.presetItems.length}개 카테고리, {getTotalRules(preset)}개 규칙
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/presets/${preset.id}`)}
                    >
                      편집
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(preset.id)}
                    >
                      복사
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(preset.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
