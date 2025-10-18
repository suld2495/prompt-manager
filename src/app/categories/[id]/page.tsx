'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { CategoryWithRules } from '@/types/category'
import type { Rule } from '@/types/rule'

export default function CategoryEditPage() {
  const params = useParams()
  const router = useRouter()
  const [category, setCategory] = useState<CategoryWithRules | null>(null)
  const [allRules, setAllRules] = useState<Rule[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCategory()
      fetchAllRules()
    }
  }, [params.id])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setCategory(data)
      setName(data.name)
      setDescription(data.description || '')
    } catch (error) {
      toast.error('카테고리 정보를 불러오는데 실패했습니다.')
    }
  }

  const fetchAllRules = async () => {
    try {
      const response = await fetch('/api/rules')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setAllRules(data)
    } catch (error) {
      toast.error('규칙 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || null })
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('카테고리가 수정되었습니다.')
      fetchCategory()
    } catch (error) {
      toast.error('카테고리 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/categories/${params.id}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('규칙이 추가되었습니다.')
      fetchCategory()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '규칙 추가에 실패했습니다.')
    }
  }

  const handleRemoveRule = async (categoryRuleId: string) => {
    try {
      const response = await fetch(`/api/category-rules/${categoryRuleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove')

      toast.success('규칙이 제거되었습니다.')
      fetchCategory()
    } catch (error) {
      toast.error('규칙 제거에 실패했습니다.')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (!category || index === 0) return

    const newOrder = [...category.categoryRules]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp

    await updateOrder(newOrder.map(cr => cr.id))
  }

  const handleMoveDown = async (index: number) => {
    if (!category || index === category.categoryRules.length - 1) return

    const newOrder = [...category.categoryRules]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp

    await updateOrder(newOrder.map(cr => cr.id))
  }

  const updateOrder = async (categoryRuleIds: string[]) => {
    try {
      const response = await fetch(`/api/categories/${params.id}/rules/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryRuleIds })
      })

      if (!response.ok) throw new Error('Failed to reorder')

      toast.success('순서가 변경되었습니다.')
      fetchCategory()
    } catch (error) {
      toast.error('순서 변경에 실패했습니다.')
    }
  }

  if (!category) {
    return (
      <div className="container mx-auto py-8">
        <p>로딩 중...</p>
      </div>
    )
  }

  const addedRuleIds = new Set(category.categoryRules.map(cr => cr.rule.id))
  const availableRules = allRules.filter(rule => !addedRuleIds.has(rule.id))

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="ghost" onClick={() => router.push('/categories')}>
            ← 뒤로
          </Button>
          <h1 className="text-3xl font-bold mt-2">카테고리 편집</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="카테고리 이름"
              />
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="카테고리 설명"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 포함된 규칙 */}
        <Card>
          <CardHeader>
            <CardTitle>포함된 규칙 ({category.categoryRules.length}개)</CardTitle>
            <CardDescription>
              규칙의 순서를 변경하거나 제거할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {category.categoryRules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                아직 규칙이 없습니다. 아래에서 규칙을 추가해주세요.
              </p>
            ) : (
              <div className="space-y-2">
                {category.categoryRules.map((cr, index) => (
                  <div
                    key={cr.id}
                    className="flex items-center gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === category.categoryRules.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{cr.rule.name}</div>
                      {cr.rule.description && (
                        <div className="text-sm text-muted-foreground">
                          {cr.rule.description}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant={
                          cr.rule.priority === 'critical' ? 'destructive' :
                          cr.rule.priority === 'warning' ? 'default' : 'secondary'
                        }>
                          {cr.rule.priority}
                        </Badge>
                        <Badge variant={cr.rule.allowed ? 'default' : 'outline'}>
                          {cr.rule.allowed ? '허용' : '금지'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveRule(cr.id)}
                    >
                      제거
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 규칙 추가 */}
        <Card>
          <CardHeader>
            <CardTitle>규칙 추가</CardTitle>
            <CardDescription>
              마스터 규칙 목록에서 이 카테고리에 추가할 규칙을 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableRules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                추가 가능한 규칙이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {availableRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{rule.name}</div>
                      {rule.description && (
                        <div className="text-sm text-muted-foreground">
                          {rule.description}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant={
                          rule.priority === 'critical' ? 'destructive' :
                          rule.priority === 'warning' ? 'default' : 'secondary'
                        }>
                          {rule.priority}
                        </Badge>
                        <Badge variant={rule.allowed ? 'default' : 'outline'}>
                          {rule.allowed ? '허용' : '금지'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddRule(rule.id)}
                    >
                      추가
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
