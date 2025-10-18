# Phase 1: 규칙 CRUD 구현

## 📋 개요

규칙(Rule) 관리의 핵심 기능을 구현하는 단계입니다. 마스터 규칙의 생성, 조회, 수정, 삭제 기능을 완성합니다.

### 목표
- 규칙 목록 조회 기능 구현
- 규칙 추가/편집/삭제 기능 구현
- 규칙 복사 기능 구현
- 규칙 관리 UI 완성

### 완료 시 얻게 되는 것
✅ 마스터 규칙을 자유롭게 관리할 수 있는 완전한 CRUD 시스템
✅ 기존 규칙을 복사하여 빠르게 새 규칙을 만들 수 있는 기능
✅ 규칙 저장소 페이지 완성

---

## 🔗 선행 조건

**의존성: Phase 0 완료 필수**

- [x] Supabase 연결 및 Prisma 설정 완료
- [x] `rules` 테이블 생성 완료
- [x] shadcn/ui 컴포넌트 설치 완료
- [x] 기본 레이아웃 구성 완료

---

## ✅ 작업 체크리스트

### 1. API Routes 구현 (Backend)
- [ ] **규칙 목록 조회**: `GET /api/rules` 구현
- [ ] **규칙 상세 조회**: `GET /api/rules/[id]` 구현
- [ ] **규칙 생성**: `POST /api/rules` 구현
- [ ] **규칙 수정**: `PUT /api/rules/[id]` 구현
- [ ] **규칙 삭제**: `DELETE /api/rules/[id]` 구현
- [ ] **규칙 복사**: `POST /api/rules/[id]/copy` 구현

### 2. 규칙 목록 페이지 (Frontend)
- [ ] 규칙 목록 페이지 컴포넌트 작성 (`src/app/rules/page.tsx`)
- [ ] 규칙 카드 컴포넌트 작성
- [ ] 우선순위 뱃지 컴포넌트 작성
- [ ] 빈 상태(Empty State) UI 구현

### 3. 규칙 추가/편집 다이얼로그
- [ ] 규칙 폼 다이얼로그 컴포넌트 작성
- [ ] 폼 유효성 검사 구현
- [ ] 저장 기능 구현
- [ ] Toast 알림 연동

### 4. 규칙 삭제 기능
- [ ] 삭제 확인 다이얼로그 구현
- [ ] 삭제 API 연동
- [ ] 삭제 후 목록 갱신

### 5. 규칙 복사 기능
- [ ] 복사 버튼 UI 추가
- [ ] 복사 API 연동
- [ ] 복사 후 편집 모드로 전환

---

## 💻 코드 예시 및 스니펫

### 1. API Routes 구현

#### `src/app/api/rules/route.ts` - 목록 조회 및 생성

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rules - 규칙 목록 조회
export async function GET() {
  try {
    const rules = await prisma.rule.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('규칙 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/rules - 규칙 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const rule = await prisma.rule.create({
      data: {
        name: body.name,
        description: body.description,
        title: body.title,
        priority: body.priority,
        allowed: body.allowed,
        descriptionDetail: body.descriptionDetail,
        exampleBad: body.exampleBad,
        exampleGood: body.exampleGood,
        violationAction: body.violationAction,
        notes: body.notes,
      }
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('규칙 생성 실패:', error)
    return NextResponse.json(
      { error: '규칙을 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

#### `src/app/api/rules/[id]/route.ts` - 상세 조회, 수정, 삭제

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rules/[id] - 규칙 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rule = await prisma.rule.findUnique({
      where: { id: params.id }
    })

    if (!rule) {
      return NextResponse.json(
        { error: '규칙을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('규칙 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/rules/[id] - 규칙 수정 (마스터 업데이트)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const rule = await prisma.rule.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        title: body.title,
        priority: body.priority,
        allowed: body.allowed,
        descriptionDetail: body.descriptionDetail,
        exampleBad: body.exampleBad,
        exampleGood: body.exampleGood,
        violationAction: body.violationAction,
        notes: body.notes,
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('규칙 수정 실패:', error)
    return NextResponse.json(
      { error: '규칙을 수정할 수 없습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/rules/[id] - 규칙 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Phase 2 이후: 카테고리에서 사용 중인지 확인 필요
    // Phase 5 이후: 스냅샷이 있는지 확인 필요

    await prisma.rule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('규칙 삭제 실패:', error)
    return NextResponse.json(
      { error: '규칙을 삭제할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

#### `src/app/api/rules/[id]/copy/route.ts` - 규칙 복사

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/rules/[id]/copy - 규칙 복사
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const original = await prisma.rule.findUnique({
      where: { id: params.id }
    })

    if (!original) {
      return NextResponse.json(
        { error: '원본 규칙을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 모든 필드 복사, 이름에 " (복사)" 추가
    const copied = await prisma.rule.create({
      data: {
        name: `${original.name} (복사)`,
        description: original.description,
        title: original.title,
        priority: original.priority,
        allowed: original.allowed,
        descriptionDetail: original.descriptionDetail,
        exampleBad: original.exampleBad,
        exampleGood: original.exampleGood,
        violationAction: original.violationAction,
        notes: original.notes,
      }
    })

    return NextResponse.json(copied, { status: 201 })
  } catch (error) {
    console.error('규칙 복사 실패:', error)
    return NextResponse.json(
      { error: '규칙을 복사할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 2. 규칙 타입 정의 (`src/types/rule.ts`)

```typescript
export type Priority = 'critical' | 'warning' | 'info'

export interface Rule {
  id: string
  name: string
  description: string | null

  // 규칙 내용
  title: string
  priority: Priority
  allowed: boolean
  descriptionDetail: string
  exampleBad: string | null
  exampleGood: string | null
  violationAction: string | null
  notes: string | null

  createdAt: Date
  updatedAt: Date
}

export interface CreateRuleInput {
  name: string
  description?: string
  title: string
  priority: Priority
  allowed: boolean
  descriptionDetail: string
  exampleBad?: string
  exampleGood?: string
  violationAction?: string
  notes?: string
}
```

### 3. 규칙 목록 페이지 (`src/app/rules/page.tsx`)

```typescript
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rule } from "@/types/rule"
import { RuleDialog } from "@/components/rules/rule-dialog"
import { useToast } from "@/hooks/use-toast"

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const { toast } = useToast()

  // 규칙 목록 불러오기
  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setRules(data)
    } catch (error) {
      toast({
        title: "오류",
        description: "규칙 목록을 불러올 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  // 규칙 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 규칙을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast({
        title: "성공",
        description: "규칙이 삭제되었습니다."
      })

      fetchRules()
    } catch (error) {
      toast({
        title: "오류",
        description: "규칙을 삭제할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  // 규칙 복사
  const handleCopy = async (id: string) => {
    try {
      const response = await fetch(`/api/rules/${id}/copy`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to copy')

      const copied = await response.json()

      toast({
        title: "성공",
        description: "규칙이 복사되었습니다."
      })

      // 복사된 규칙을 바로 편집 모드로
      setEditingRule(copied)
      setDialogOpen(true)
    } catch (error) {
      toast({
        title: "오류",
        description: "규칙을 복사할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: "destructive",
      warning: "default",
      info: "secondary"
    } as const

    const labels = {
      critical: "🔴 중요",
      warning: "🟡 경고",
      info: "🔵 정보"
    }

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📜 규칙 저장소</h1>
          <p className="text-muted-foreground">마스터 규칙을 관리합니다</p>
        </div>
        <Button onClick={() => {
          setEditingRule(null)
          setDialogOpen(true)
        }}>
          + 새 규칙
        </Button>
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              아직 규칙이 없습니다. 새 규칙을 추가해보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{rule.name}</CardTitle>
                    {rule.description && (
                      <CardDescription>{rule.description}</CardDescription>
                    )}
                  </div>
                  {getPriorityBadge(rule.priority)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingRule(rule)
                      setDialogOpen(true)
                    }}
                  >
                    편집
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(rule.id)}
                  >
                    복사
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(rule.id)}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSuccess={() => {
          fetchRules()
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
```

### 4. 규칙 폼 다이얼로그 (`src/components/rules/rule-dialog.tsx`)

```typescript
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Rule, CreateRuleInput, Priority } from "@/types/rule"
import { useToast } from "@/hooks/use-toast"

interface RuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: Rule | null
  onSuccess: () => void
}

export function RuleDialog({ open, onOpenChange, rule, onSuccess }: RuleDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateRuleInput>({
    name: "",
    description: "",
    title: "",
    priority: "info",
    allowed: true,
    descriptionDetail: "",
    exampleBad: "",
    exampleGood: "",
    violationAction: "",
    notes: ""
  })

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || "",
        title: rule.title,
        priority: rule.priority,
        allowed: rule.allowed,
        descriptionDetail: rule.descriptionDetail,
        exampleBad: rule.exampleBad || "",
        exampleGood: rule.exampleGood || "",
        violationAction: rule.violationAction || "",
        notes: rule.notes || ""
      })
    } else {
      // 초기화
      setFormData({
        name: "",
        description: "",
        title: "",
        priority: "info",
        allowed: true,
        descriptionDetail: "",
        exampleBad: "",
        exampleGood: "",
        violationAction: "",
        notes: ""
      })
    }
  }, [rule, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = rule ? `/api/rules/${rule.id}` : '/api/rules'
      const method = rule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: "성공",
        description: rule ? "규칙이 수정되었습니다." : "규칙이 생성되었습니다."
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "오류",
        description: "규칙을 저장할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "규칙 편집" : "새 규칙 추가"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">규칙 이름 *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: useState 3개 제한"
            />
          </div>

          <div>
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="간단한 설명"
            />
          </div>

          <div>
            <Label htmlFor="title">규칙 제목 *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="MD 파일에 표시될 제목"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">우선순위 *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">🔴 중요 (Critical)</SelectItem>
                  <SelectItem value="warning">🟡 경고 (Warning)</SelectItem>
                  <SelectItem value="info">🔵 정보 (Info)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="allowed">허용/비허용 *</Label>
              <Select
                value={formData.allowed ? "allowed" : "disallowed"}
                onValueChange={(value) => setFormData({ ...formData, allowed: value === "allowed" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">✅ 허용</SelectItem>
                  <SelectItem value="disallowed">❌ 비허용</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descriptionDetail">상세 설명 *</Label>
            <Textarea
              id="descriptionDetail"
              required
              value={formData.descriptionDetail}
              onChange={(e) => setFormData({ ...formData, descriptionDetail: e.target.value })}
              placeholder="규칙에 대한 자세한 설명"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="exampleBad">잘못된 예시</Label>
            <Textarea
              id="exampleBad"
              value={formData.exampleBad}
              onChange={(e) => setFormData({ ...formData, exampleBad: e.target.value })}
              placeholder="코드 예시 (잘못된 사용)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="exampleGood">올바른 예시</Label>
            <Textarea
              id="exampleGood"
              value={formData.exampleGood}
              onChange={(e) => setFormData({ ...formData, exampleGood: e.target.value })}
              placeholder="코드 예시 (올바른 사용)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="violationAction">위반 시 조치</Label>
            <Textarea
              id="violationAction"
              value={formData.violationAction}
              onChange={(e) => setFormData({ ...formData, violationAction: e.target.value })}
              placeholder="이 규칙을 위반했을 때 취해야 할 조치"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">참고사항</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="추가 참고사항"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">
              {rule ? "수정" : "생성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ 규칙 목록 페이지에서 모든 규칙이 표시됨
2. ✅ 새 규칙 추가 시 8개 필드를 모두 입력할 수 있음
3. ✅ 기존 규칙 편집 시 마스터 규칙이 업데이트됨
4. ✅ 규칙 삭제 시 확인 후 삭제됨
5. ✅ 규칙 복사 시 " (복사)" 접미사가 붙고 편집 모드로 전환됨
6. ✅ 모든 작업 완료 시 Toast 알림이 표시됨

---

## 📝 다음 단계

Phase 1 완료 후 **Phase 2: 카테고리 CRUD 구현**으로 진행합니다.

Phase 2에서는:
- 카테고리 및 카테고리-규칙 연결 테이블 추가
- 카테고리 CRUD API 구현
- 카테고리에 규칙 추가/제거 기능 구현
- 카테고리 관리 UI 구현
