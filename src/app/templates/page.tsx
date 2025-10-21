"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/search-input"
import { CardSkeleton } from "@/components/skeleton-loader"
import { toast } from "sonner"
import { Plus, FileText, Copy, Trash2, Calendar } from "lucide-react"
import type { Template } from "@/types/template"

interface TemplateWithCounts extends Template {
  categoryCount: number
  ruleCount: number
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateWithCounts[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      toast.error('템플릿 목록을 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('템플릿 이름을 입력해주세요.')
      return
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!res.ok) throw new Error('Failed to create')

      toast.success('템플릿이 생성되었습니다.')
      setDialogOpen(false)
      setName("")
      setDescription("")
      loadTemplates()
    } catch (error) {
      toast.error('템플릿을 생성할 수 없습니다.')
    }
  }

  const handleCopy = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}/copy`, {
        method: 'POST'
      })

      if (!res.ok) throw new Error('Failed to copy')

      toast.success('템플릿이 복사되었습니다.')
      loadTemplates()
    } catch (error) {
      toast.error('템플릿을 복사할 수 없습니다.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('템플릿이 삭제되었습니다.')
      loadTemplates()
    } catch (error) {
      toast.error('템플릿을 삭제할 수 없습니다.')
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 검색 필터링
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates

    const query = searchQuery.toLowerCase()
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
    )
  }, [templates, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">템플릿</h1>
          <p className="text-muted-foreground mt-1">
            프리셋과 카테고리를 조합하여 MD 파일을 생성합니다 ({filteredTemplates.length}개)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 템플릿
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 템플릿 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate}>생성</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <SearchInput
          placeholder="템플릿 검색 (이름, 설명)"
          onSearch={setSearchQuery}
        />
      </div>

      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{template.name}</span>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex gap-2">
                <Badge variant="secondary">
                  {template.categoryCount}개 카테고리
                </Badge>
                <Badge variant="outline">
                  {template.ruleCount}개 규칙
                </Badge>
              </div>

              {template.lastGeneratedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(template.lastGeneratedAt)}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  편집
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(template.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id, template.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}

          {filteredTemplates.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {templates.length === 0 ? '아직 생성된 템플릿이 없습니다' : '검색 결과가 없습니다'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
