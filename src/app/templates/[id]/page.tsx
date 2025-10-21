"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown,
  Eye, Download, FileText
} from "lucide-react"
import type { TemplateWithCategories, TemplateCategoryWithDetails } from "@/types/template"
import type { CategoryPresetWithItems } from "@/types/preset"
import type { Category } from "@/types/category"

export default function TemplateEditPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<TemplateWithCategories | null>(null)
  const [presets, setPresets] = useState<CategoryPresetWithItems[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [mdContent, setMdContent] = useState("")
  const [mdPreviewOpen, setMdPreviewOpen] = useState(false)
  const [changesDialogOpen, setChangesDialogOpen] = useState(false)
  const [outdatedSnapshots, setOutdatedSnapshots] = useState<any[]>([])

  useEffect(() => {
    loadTemplate()
    loadPresets()
    loadCategories()
  }, [params.id])

  const loadTemplate = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTemplate(data)
      setName(data.name)
      setDescription(data.description || "")

      // 변경된 스냅샷이 있으면 로드
      if (data.outdatedCount > 0) {
        loadOutdatedSnapshots()
      }
    } catch (error) {
      toast.error('템플릿을 불러올 수 없습니다.')
    }
  }

  const loadOutdatedSnapshots = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}/outdated`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOutdatedSnapshots(data)
    } catch (error) {
      console.error('변경된 스냅샷 로드 실패:', error)
    }
  }

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/presets')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPresets(data)
    } catch (error) {
      toast.error('프리셋 목록을 불러올 수 없습니다.')
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      toast.error('카테고리 목록을 불러올 수 없습니다.')
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('템플릿이 수정되었습니다.')
      loadTemplate()
    } catch (error) {
      toast.error('템플릿을 수정할 수 없습니다.')
    }
  }

  const handleAddPreset = async (presetId: string) => {
    try {
      const res = await fetch(`/api/templates/${params.id}/add-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '프리셋을 추가할 수 없습니다.')
        return
      }

      if (data.skipped > 0) {
        toast.success(`${data.added}개 카테고리가 추가되었습니다. (${data.skipped}개는 이미 존재)`)
      } else {
        toast.success(`${data.added}개 카테고리가 추가되었습니다.`)
      }

      setPresetDialogOpen(false)
      loadTemplate()
    } catch (error) {
      toast.error('프리셋을 추가할 수 없습니다.')
    }
  }

  const handleAddCategory = async (categoryId: string) => {
    try {
      const res = await fetch(`/api/templates/${params.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '카테고리를 추가할 수 없습니다.')
        return
      }

      toast.success('카테고리가 추가되었습니다.')
      setCategoryDialogOpen(false)
      loadTemplate()
    } catch (error) {
      toast.error('카테고리를 추가할 수 없습니다.')
    }
  }

  const handleRemoveCategory = async (categoryId: string) => {
    if (!confirm('이 카테고리를 제거하시겠습니까?')) {
      return
    }

    try {
      const res = await fetch(`/api/templates/${params.id}/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to remove')

      toast.success('카테고리가 제거되었습니다.')
      loadTemplate()
    } catch (error) {
      toast.error('카테고리를 제거할 수 없습니다.')
    }
  }

  const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/templates/${params.id}/categories/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, direction })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '순서를 변경할 수 없습니다.')
        return
      }

      loadTemplate()
    } catch (error) {
      toast.error('순서를 변경할 수 없습니다.')
    }
  }

  const handlePreview = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}/preview`)
      if (!res.ok) throw new Error('Failed to preview')
      const data = await res.json()
      setMdContent(data.content)
      setMdPreviewOpen(true)
    } catch (error) {
      toast.error('미리보기를 불러올 수 없습니다.')
    }
  }

  const handleGenerate = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}/generate`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()

      // 파일 다운로드
      const blob = new Blob([data.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('MD 파일이 생성되었습니다.')
      loadTemplate()
    } catch (error) {
      toast.error('MD 파일을 생성할 수 없습니다.')
    }
  }

  const handleSnapshotAction = async (snapshotId: string, action: 'update' | 'keep' | 'customize', customContent?: any) => {
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, customContent })
      })

      if (!res.ok) throw new Error('Failed to update snapshot')

      toast.success('스냅샷이 업데이트되었습니다.')
      loadTemplate()
      loadOutdatedSnapshots()
    } catch (error) {
      toast.error('스냅샷을 업데이트할 수 없습니다.')
    }
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  const templateCategories = template.templateCategories || []
  const availableCategories = categories.filter(
    cat => !templateCategories.some(tc => tc.categoryId === cat.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">템플릿 편집</h1>
            {template.outdatedCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {template.outdatedCount}개 규칙 변경됨
              </Badge>
            )}
          </div>
        </div>
        {template.outdatedCount > 0 && (
          <Button variant="outline" onClick={() => setChangesDialogOpen(true)}>
            변경사항 확인
          </Button>
        )}
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="mr-2 h-4 w-4" />
          미리보기
        </Button>
        <Button onClick={handleGenerate}>
          <Download className="mr-2 h-4 w-4" />
          MD 생성
        </Button>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="템플릿 이름"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="템플릿 설명 (선택사항)"
              rows={3}
            />
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>카테고리</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                프리셋 추가
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                카테고리 추가
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templateCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 추가된 카테고리가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templateCategories.map((tc, index) => (
                <div
                  key={tc.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tc.category.name}</span>
                      {tc.presetName && (
                        <Badge variant="secondary" className="text-xs">
                          프리셋: {tc.presetName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tc.category.categoryRules?.length || 0}개 규칙
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => handleReorder(tc.categoryId, 'up')}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === templateCategories.length - 1}
                      onClick={() => handleReorder(tc.categoryId, 'down')}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCategory(tc.categoryId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 프리셋 추가 다이얼로그 */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프리셋 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {preset.presetItems?.length || 0}개 카테고리
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddPreset(preset.id)}
                >
                  추가
                </Button>
              </div>
            ))}
            {presets.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                사용 가능한 프리셋이 없습니다
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 카테고리 추가 다이얼로그 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>카테고리 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {availableCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddCategory(category.id)}
                >
                  추가
                </Button>
              </div>
            ))}
            {availableCategories.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                모든 카테고리가 이미 추가되었습니다
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MD 미리보기 다이얼로그 */}
      <Dialog open={mdPreviewOpen} onOpenChange={setMdPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>MD 미리보기</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
              {mdContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* 변경사항 비교 다이얼로그 */}
      <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>규칙 변경사항 ({outdatedSnapshots.length}개)</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {outdatedSnapshots.map((snapshot) => (
              <Card key={snapshot.snapshotId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{snapshot.ruleName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        카테고리: {snapshot.categoryName}
                        {snapshot.isCustom && (
                          <Badge variant="secondary" className="ml-2">커스텀</Badge>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSnapshotAction(snapshot.snapshotId, 'update')}
                      >
                        최신으로 업데이트
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSnapshotAction(snapshot.snapshotId, 'keep')}
                      >
                        현재 유지
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">현재 스냅샷</h4>
                      <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                        <div>
                          <span className="font-medium">제목:</span> {snapshot.snapshotContent.title}
                        </div>
                        <div>
                          <span className="font-medium">우선순위:</span>{' '}
                          <Badge variant={
                            snapshot.snapshotContent.priority === 'critical' ? 'destructive' :
                            snapshot.snapshotContent.priority === 'warning' ? 'default' : 'secondary'
                          }>
                            {snapshot.snapshotContent.priority}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">허용:</span>{' '}
                          {snapshot.snapshotContent.allowed ? '✅ 허용' : '❌ 비허용'}
                        </div>
                        {snapshot.snapshotContent.descriptionDetail && (
                          <div>
                            <span className="font-medium">설명:</span>
                            <p className="text-muted-foreground mt-1">
                              {snapshot.snapshotContent.descriptionDetail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">최신 마스터 규칙</h4>
                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg space-y-2 text-sm">
                        <div>
                          <span className="font-medium">제목:</span> {snapshot.currentContent.title}
                        </div>
                        <div>
                          <span className="font-medium">우선순위:</span>{' '}
                          <Badge variant={
                            snapshot.currentContent.priority === 'critical' ? 'destructive' :
                            snapshot.currentContent.priority === 'warning' ? 'default' : 'secondary'
                          }>
                            {snapshot.currentContent.priority}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">허용:</span>{' '}
                          {snapshot.currentContent.allowed ? '✅ 허용' : '❌ 비허용'}
                        </div>
                        {snapshot.currentContent.descriptionDetail && (
                          <div>
                            <span className="font-medium">설명:</span>
                            <p className="text-muted-foreground mt-1">
                              {snapshot.currentContent.descriptionDetail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
