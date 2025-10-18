"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { CategoryPresetWithItems } from "@/types/preset"
import type { Category } from "@/types/category"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PresetEditPage(props: PageProps) {
  const params = use(props.params)
  const router = useRouter()
  const [preset, setPreset] = useState<CategoryPresetWithItems | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")

  const fetchData = async () => {
    try {
      const [presetRes, categoriesRes] = await Promise.all([
        fetch(`/api/presets/${params.id}`),
        fetch('/api/categories')
      ])

      if (!presetRes.ok || !categoriesRes.ok) throw new Error('Failed to fetch')

      const [presetData, categoriesData] = await Promise.all([
        presetRes.json(),
        categoriesRes.json()
      ])

      setPreset(presetData)
      setAllCategories(categoriesData)
    } catch (error) {
      toast.error("데이터를 불러올 수 없습니다.")
      router.push('/presets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  const handleSave = async () => {
    if (!preset) return
    if (!preset.name.trim()) {
      toast.error("프리셋 이름을 입력해주세요.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/presets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preset.name,
          description: preset.description
        })
      })

      if (!response.ok) throw new Error('Failed to save')

      toast.success("프리셋이 저장되었습니다.")
      router.push('/presets')
    } catch (error) {
      toast.error("프리셋을 저장할 수 없습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!selectedCategory) {
      toast.error("카테고리를 선택해주세요.")
      return
    }

    try {
      const response = await fetch(`/api/presets/${params.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCategory })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("카테고리가 추가되었습니다.")
      setSelectedCategory("")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "카테고리를 추가할 수 없습니다.")
    }
  }

  const handleRemoveCategory = async (categoryId: string) => {
    if (!confirm('이 카테고리를 제거하시겠습니까?')) return

    try {
      const response = await fetch(`/api/presets/${params.id}/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove')

      toast.success("카테고리가 제거되었습니다.")
      fetchData()
    } catch (error) {
      toast.error("카테고리를 제거할 수 없습니다.")
    }
  }

  const getTotalRules = () => {
    if (!preset) return 0
    return preset.presetItems.reduce(
      (sum, item) => sum + (item.category.categoryRules?.length || 0),
      0
    )
  }

  const getAvailableCategories = () => {
    if (!preset) return allCategories
    const usedCategoryIds = preset.presetItems.map(item => item.category.id)
    return allCategories.filter(cat => !usedCategoryIds.includes(cat.id))
  }

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (!preset) {
    return <div>프리셋을 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프리셋 편집</h1>
          <p className="text-muted-foreground">프리셋 정보와 포함된 카테고리를 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/presets')}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={preset.name}
              onChange={(e) => setPreset({ ...preset, name: e.target.value })}
              placeholder="프리셋 이름"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={preset.description || ""}
              onChange={(e) => setPreset({ ...preset, description: e.target.value })}
              placeholder="프리셋 설명 (선택)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>포함된 카테고리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableCategories().map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCategory}>추가</Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {preset.presetItems.length}개 카테고리, {getTotalRules()}개 규칙
          </div>

          {preset.presetItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              아직 카테고리가 없습니다. 카테고리를 추가해보세요.
            </p>
          ) : (
            <div className="space-y-2">
              {preset.presetItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="font-medium">{item.category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category.categoryRules?.length || 0}개 규칙
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveCategory(item.category.id)}
                    >
                      제거
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프리셋 미리보기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preset.presetItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="font-medium">{item.category.name}</div>
                {item.category.categoryRules && item.category.categoryRules.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.category.categoryRules.map((cr) => (
                      <Badge key={cr.id} variant="outline">
                        {cr.rule.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">규칙 없음</p>
                )}
              </div>
            ))}

            {preset.presetItems.length === 0 && (
              <p className="text-center text-muted-foreground">
                카테고리를 추가하면 여기에 미리보기가 표시됩니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
