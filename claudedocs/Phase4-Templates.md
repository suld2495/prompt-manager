# Phase 4: 템플릿 CRUD 및 MD 생성 구현

## 📋 개요

템플릿(Template) 관리 및 MD 파일 생성 기능을 구현하는 단계입니다. 프리셋과 개별 카테고리를 조합하여 최종 MD 파일을 생성합니다.

### 목표
- 템플릿 CRUD 기능 구현
- 프리셋 추가 기능 (여러 카테고리를 한번에)
- 개별 카테고리 추가 기능
- MD 파일 생성/미리보기/다운로드 기능 구현
- 템플릿 관리 UI 완성

### 완료 시 얻게 되는 것
✅ 프리셋과 카테고리를 조합하여 템플릿 생성
✅ 템플릿에서 MD 파일 생성 및 다운로드
✅ 템플릿 목록 및 편집 페이지 완성
✅ **첫 번째 완전한 워크플로우 완성** (규칙 → 카테고리 → 프리셋 → 템플릿 → MD 파일)

---

## 🔗 선행 조건

**의존성: Phase 3 완료 필수**

- [x] 카테고리 프리셋 CRUD 기능 완성
- [x] 프리셋-카테고리 연결 기능 완성
- [x] 프리셋 관리 UI 구현 완료

---

## ✅ 작업 체크리스트

### 1. 데이터베이스 스키마 업데이트
- [ ] Prisma 스키마에 `Template` 모델 추가
- [ ] Prisma 스키마에 `TemplateCategory` 모델 추가 (템플릿-카테고리 다대다)
- [ ] 마이그레이션 실행

### 2. API Routes 구현
- [ ] **템플릿 목록 조회**: `GET /api/templates` 구현
- [ ] **템플릿 생성**: `POST /api/templates` 구현
- [ ] **템플릿 수정**: `PUT /api/templates/[id]` 구현
- [ ] **템플릿 삭제**: `DELETE /api/templates/[id]` 구현
- [ ] **프리셋 추가**: `POST /api/templates/[id]/add-preset` 구현
- [ ] **개별 카테고리 추가**: `POST /api/templates/[id]/categories` 구현
- [ ] **카테고리 제거**: `DELETE /api/templates/[id]/categories/[categoryId]` 구현
- [ ] **MD 생성**: `POST /api/templates/[id]/generate` 구현
- [ ] **MD 미리보기**: `GET /api/templates/[id]/preview` 구현

### 3. 템플릿 목록 페이지
- [ ] 템플릿 목록 페이지 작성 (`src/app/templates/page.tsx`)
- [ ] 템플릿 카드 컴포넌트 작성
- [ ] 포함된 카테고리/규칙 수 표시

### 4. 템플릿 편집 페이지
- [ ] 템플릿 편집 페이지 작성 (`src/app/templates/[id]/page.tsx`)
- [ ] 템플릿 기본 정보 편집
- [ ] [+ 프리셋 추가] 기능 구현
- [ ] [+ 카테고리 추가] 기능 구현
- [ ] 카테고리 제거 기능
- [ ] 출처 표시 (프리셋 vs 직접 추가)
- [ ] MD 미리보기 기능
- [ ] MD 생성 및 다운로드 기능

### 5. MD 생성 로직
- [ ] MD 포맷 템플릿 작성
- [ ] 카테고리별 규칙 포맷팅
- [ ] 규칙 우선순위 아이콘 추가
- [ ] 파일 다운로드 기능

---

## 💻 코드 예시 및 스니펫

### 1. Prisma 스키마 업데이트 (`prisma/schema.prisma`)

```prisma
// 템플릿 모델
model Template {
  id              String   @id @default(uuid())
  name            String
  description     String?  @db.Text

  // 스냅샷 관련 (Phase 5에서 사용)
  hasSnapshots    Boolean  @default(false) @map("has_snapshots")
  lastGeneratedAt DateTime? @map("last_generated_at")
  outdatedCount   Int      @default(0) @map("outdated_count")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // 관계
  templateCategories TemplateCategory[]

  @@map("templates")
}

// 템플릿-카테고리 연결 테이블
model TemplateCategory {
  id           String   @id @default(uuid())
  templateId   String   @map("template_id")
  categoryId   String   @map("category_id")
  order        Int      @default(0)
  fromPresetId String?  @map("from_preset_id")  // 어느 프리셋에서 추가되었는지

  createdAt DateTime @default(now()) @map("created_at")

  // 관계
  template       Template        @relation(fields: [templateId], references: [id], onDelete: Cascade)
  category       Category        @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  fromPreset     CategoryPreset? @relation(fields: [fromPresetId], references: [id], onDelete: SetNull)

  @@unique([templateId, categoryId])
  @@map("template_categories")
}

// Category, CategoryPreset 모델에 관계 추가
model Category {
  // ... 기존 필드들 ...

  categoryRules      CategoryRule[]
  presetItems        CategoryPresetItem[]
  templateCategories TemplateCategory[]  // 추가

  @@map("categories")
}

model CategoryPreset {
  // ... 기존 필드들 ...

  presetItems        CategoryPresetItem[]
  templateCategories TemplateCategory[]  // 추가

  @@map("category_presets")
}
```

### 2. 템플릿 타입 정의 (`src/types/template.ts`)

```typescript
import { Category } from './category'

export interface Template {
  id: string
  name: string
  description: string | null
  hasSnapshots: boolean
  lastGeneratedAt: Date | null
  outdatedCount: number
  createdAt: Date
  updatedAt: Date
}

export interface TemplateWithCategories extends Template {
  templateCategories: Array<{
    id: string
    order: number
    fromPresetId: string | null
    category: Category
  }>
}

export interface CreateTemplateInput {
  name: string
  description?: string
}
```

### 3. 프리셋 추가 API (`src/app/api/templates/[id]/add-preset/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/templates/[id]/add-preset - 프리셋의 모든 카테고리 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { presetId } = body

    // 프리셋 정보 가져오기
    const preset = await prisma.categoryPreset.findUnique({
      where: { id: presetId },
      include: {
        presetItems: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!preset) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 템플릿의 카테고리 개수 확인 (순서 결정용)
    const count = await prisma.templateCategory.count({
      where: { templateId: params.id }
    })

    // 프리셋의 모든 카테고리를 템플릿에 추가
    const templateCategories = await Promise.all(
      preset.presetItems.map((item, index) =>
        prisma.templateCategory.create({
          data: {
            templateId: params.id,
            categoryId: item.categoryId,
            fromPresetId: presetId,  // 출처 표시
            order: count + index
          },
          include: {
            category: true
          }
        })
      )
    )

    return NextResponse.json(templateCategories, { status: 201 })
  } catch (error) {
    console.error('프리셋 추가 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 추가할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 4. MD 생성 API (`src/app/api/templates/[id]/generate/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/templates/[id]/generate - MD 파일 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        templateCategories: {
          include: {
            category: {
              include: {
                categoryRules: {
                  include: {
                    rule: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // MD 생성
    const md = generateMarkdown(template)

    // Phase 5에서 스냅샷 생성 로직 추가 예정

    // 템플릿 상태 업데이트
    await prisma.template.update({
      where: { id: params.id },
      data: {
        lastGeneratedAt: new Date()
      }
    })

    return NextResponse.json({
      content: md,
      filename: `${template.name}.md`
    })
  } catch (error) {
    console.error('MD 생성 실패:', error)
    return NextResponse.json(
      { error: 'MD 파일을 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}

function generateMarkdown(template: any): string {
  let md = `# ${template.name}\n\n`

  if (template.description) {
    md += `${template.description}\n\n`
  }

  md += `---\n\n`

  // 카테고리별로 규칙 포맷팅
  for (const tc of template.templateCategories) {
    const category = tc.category

    md += `## ${category.name}\n\n`

    if (category.description) {
      md += `${category.description}\n\n`
    }

    // 카테고리의 규칙들
    for (const cr of category.categoryRules) {
      const rule = cr.rule

      // 우선순위 아이콘
      const priorityIcon = {
        critical: '🔴',
        warning: '🟡',
        info: '🔵'
      }[rule.priority]

      // 허용/비허용
      const allowedText = rule.allowed ? '✅ 허용' : '❌ 비허용'

      md += `### ${priorityIcon} ${rule.title}\n\n`
      md += `**${allowedText}**\n\n`
      md += `${rule.descriptionDetail}\n\n`

      if (rule.exampleBad) {
        md += `❌ **잘못된 예시:**\n\n`
        md += `\`\`\`\n${rule.exampleBad}\n\`\`\`\n\n`
      }

      if (rule.exampleGood) {
        md += `✅ **올바른 예시:**\n\n`
        md += `\`\`\`\n${rule.exampleGood}\n\`\`\`\n\n`
      }

      if (rule.violationAction) {
        md += `**위반 시:** ${rule.violationAction}\n\n`
      }

      if (rule.notes) {
        md += `📝 **참고:** ${rule.notes}\n\n`
      }

      md += `---\n\n`
    }
  }

  return md
}
```

### 5. 템플릿 편집 페이지 (`src/app/templates/[id]/page.tsx`)

```typescript
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TemplateWithCategories } from "@/types/template"
import { CategoryPresetWithItems } from "@/types/preset"
import { Category } from "@/types/category"
import { useToast } from "@/hooks/use-toast"

export default function TemplateEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [template, setTemplate] = useState<TemplateWithCategories | null>(null)
  const [presets, setPresets] = useState<CategoryPresetWithItems[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [mdContent, setMdContent] = useState("")
  const [mdPreviewOpen, setMdPreviewOpen] = useState(false)

  useEffect(() => {
    // 템플릿 정보 불러오기
    fetch(`/api/templates/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setTemplate(data)
        setName(data.name)
        setDescription(data.description || "")
      })

    // 프리셋 목록 불러오기
    fetch('/api/presets')
      .then(res => res.json())
      .then(setPresets)

    // 카테고리 목록 불러오기
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories)
  }, [params.id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) throw new Error('Failed to update')

      toast({
        title: "성공",
        description: "템플릿이 수정되었습니다."
      })
    } catch (error) {
      toast({
        title: "오류",
        description: "템플릿을 수정할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handleAddPreset = async (presetId: string) => {
    try {
      const response = await fetch(`/api/templates/${params.id}/add-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId })
      })

      if (!response.ok) throw new Error('Failed to add')

      toast({
        title: "성공",
        description: "프리셋이 추가되었습니다."
      })

      setPresetDialogOpen(false)

      // 템플릿 정보 다시 불러오기
      const updated = await fetch(`/api/templates/${params.id}`).then(r => r.json())
      setTemplate(updated)
    } catch (error) {
      toast({
        title: "오류",
        description: "프리셋을 추가할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handleAddCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/templates/${params.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      })

      if (!response.ok) throw new Error('Failed to add')

      toast({
        title: "성공",
        description: "카테고리가 추가되었습니다."
      })

      setCategoryDialogOpen(false)

      // 템플릿 정보 다시 불러오기
      const updated = await fetch(`/api/templates/${params.id}`).then(r => r.json())
      setTemplate(updated)
    } catch (error) {
      toast({
        title: "오류",
        description: "카테고리를 추가할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handleGenerateMD = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}/generate`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()

      // 파일 다운로드
      const blob = new Blob([data.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "성공",
        description: "MD 파일이 생성되었습니다."
      })
    } catch (error) {
      toast({
        title: "오류",
        description: "MD 파일을 생성할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handlePreviewMD = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}/preview`)
      if (!response.ok) throw new Error('Failed to preview')

      const data = await response.json()
      setMdContent(data.content)
      setMdPreviewOpen(true)
    } catch (error) {
      toast({
        title: "오류",
        description: "MD 미리보기를 불러올 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  if (!template) return <p>로딩 중...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/templates')}>
            ← 뒤로
          </Button>
          <h1 className="text-3xl font-bold mt-2">{template.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreviewMD}>MD 미리보기</Button>
          <Button variant="outline" onClick={handleGenerateMD}>MD 생성</Button>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="템플릿 이름"
            />
          </div>
          <div>
            <Label>설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="템플릿 설명"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 포함된 카테고리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>포함된 카테고리 ({template.templateCategories.length}개)</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPresetDialogOpen(true)}>
                + 프리셋 추가
              </Button>
              <Button size="sm" onClick={() => setCategoryDialogOpen(true)}>
                + 카테고리 추가
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {template.templateCategories.length === 0 ? (
            <p className="text-muted-foreground">아직 카테고리가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {template.templateCategories.map((tc) => (
                <div key={tc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{tc.category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      출처: {tc.fromPresetId ? '프리셋' : '직접 추가'}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive">
                    제거
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 프리셋 선택 다이얼로그 */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프리셋 선택</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {preset.presetItems.length}개 카테고리
                  </p>
                </div>
                <Button size="sm" onClick={() => handleAddPreset(preset.id)}>
                  추가
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 카테고리 선택 다이얼로그 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 선택</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                <p className="font-medium">{category.name}</p>
                <Button size="sm" onClick={() => handleAddCategory(category.id)}>
                  추가
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MD 미리보기 다이얼로그 */}
      <Dialog open={mdPreviewOpen} onOpenChange={setMdPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>MD 미리보기</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <pre className="text-sm whitespace-pre-wrap">{mdContent}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ 템플릿 목록 페이지에서 모든 템플릿이 표시됨
2. ✅ 템플릿에 프리셋 추가 시 포함된 모든 카테고리가 한번에 추가됨
3. ✅ 템플릿에 개별 카테고리 추가가 정상적으로 작동함
4. ✅ 출처 표시가 정확함 (프리셋 vs 직접 추가)
5. ✅ MD 미리보기가 정상적으로 표시됨
6. ✅ MD 생성 및 다운로드가 정상적으로 작동함
7. ✅ 생성된 MD 파일이 기획서의 포맷을 따름

---

## 🎉 마일스톤: 첫 번째 완전한 워크플로우 완성!

Phase 4 완료 시, 전체 시스템의 핵심 워크플로우가 완성됩니다:

```
규칙 생성 → 카테고리 생성 → 카테고리에 규칙 추가 →
프리셋 생성 → 프리셋에 카테고리 추가 →
템플릿 생성 → 템플릿에 프리셋/카테고리 추가 → MD 파일 생성!
```

---

## 📝 다음 단계

Phase 4 완료 후 **Phase 5: 스냅샷 관리 구현**으로 진행합니다.

Phase 5에서는:
- RuleSnapshot 테이블 추가
- MD 생성 시 스냅샷 생성 로직
- 마스터 규칙 변경 시 변경 감지
- 변경사항 비교 UI
- 스냅샷 업데이트/유지/커스텀 기능
