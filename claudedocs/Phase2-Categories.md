# Phase 2: 카테고리 CRUD 구현

## 📋 개요

카테고리(Category) 관리 기능을 구현하는 단계입니다. 규칙들을 그룹화하는 평면 구조의 카테고리 시스템을 완성합니다.

### 목표
- 카테고리 CRUD 기능 구현 (평면 구조)
- 카테고리-규칙 연결 관리 기능 구현
- 카테고리에 규칙 추가/제거/순서 변경 기능 구현
- 카테고리 관리 UI 완성

### 완료 시 얻게 되는 것
✅ 규칙들을 의미있는 그룹으로 조직할 수 있는 카테고리 시스템
✅ 카테고리별로 규칙을 관리할 수 있는 완전한 인터페이스
✅ 카테고리 저장소 페이지 완성

---

## 🔗 선행 조건

**의존성: Phase 1 완료 필수**

- [x] 규칙 CRUD 기능 완성
- [x] 규칙 목록 페이지 구현 완료
- [x] Prisma 및 API Routes 기본 구조 이해

---

## ✅ 작업 체크리스트

### 1. 데이터베이스 스키마 업데이트
- [ ] Prisma 스키마에 `Category` 모델 추가
- [ ] Prisma 스키마에 `CategoryRule` 모델 추가 (다대다 관계)
- [ ] 마이그레이션 실행

### 2. API Routes 구현
- [ ] **카테고리 목록 조회**: `GET /api/categories` 구현
- [ ] **카테고리 생성**: `POST /api/categories` 구현
- [ ] **카테고리 수정**: `PUT /api/categories/[id]` 구현
- [ ] **카테고리 삭제**: `DELETE /api/categories/[id]` 구현
- [ ] **카테고리 복사**: `POST /api/categories/[id]/copy` 구현
- [ ] **카테고리의 규칙 목록**: `GET /api/categories/[id]/rules` 구현
- [ ] **카테고리에 규칙 추가**: `POST /api/categories/[id]/rules` 구현
- [ ] **카테고리에서 규칙 제거**: `DELETE /api/categories/[id]/rules/[ruleId]` 구현
- [ ] **규칙 순서 변경**: `PUT /api/categories/[id]/rules/reorder` 구현

### 3. 카테고리 목록 페이지
- [ ] 카테고리 목록 페이지 작성 (`src/app/categories/page.tsx`)
- [ ] 카테고리 카드 컴포넌트 작성
- [ ] 카테고리에 포함된 규칙 수 표시

### 4. 카테고리 편집 페이지
- [ ] 카테고리 편집 페이지 작성 (`src/app/categories/[id]/page.tsx`)
- [ ] 카테고리 기본 정보 편집 폼
- [ ] 규칙 추가 UI (마스터 규칙 목록에서 선택)
- [ ] 규칙 제거 UI
- [ ] 규칙 순서 변경 UI (드래그앤드롭 또는 버튼)

### 5. 카테고리 삭제 기능
- [ ] 사용 중인지 확인 (Phase 3 이후 프리셋/템플릿 체크 필요)
- [ ] 삭제 확인 다이얼로그
- [ ] 삭제 API 연동

---

## 💻 코드 예시 및 스니펫

### 1. Prisma 스키마 업데이트 (`prisma/schema.prisma`)

```prisma
// 기존 Rule 모델에 관계 추가
model Rule {
  id        String   @id @default(uuid())
  // ... 기존 필드들 ...

  // 카테고리 관계 추가
  categoryRules CategoryRule[]

  @@map("rules")
}

// 카테고리 모델 (평면 구조)
model Category {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  order       Int      @default(0)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // 관계
  categoryRules CategoryRule[]

  @@map("categories")
}

// 카테고리-규칙 연결 테이블 (다대다 + 순서)
model CategoryRule {
  id         String   @id @default(uuid())
  categoryId String   @map("category_id")
  ruleId     String   @map("rule_id")
  order      Int      @default(0)

  createdAt DateTime @default(now()) @map("created_at")

  // 관계
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  rule     Rule     @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@unique([categoryId, ruleId])
  @@map("category_rules")
}
```

### 2. 마이그레이션 실행

```bash
pnpm prisma migrate dev --name add-categories
pnpm prisma generate
```

### 3. 카테고리 타입 정의 (`src/types/category.ts`)

```typescript
import { Rule } from './rule'

export interface Category {
  id: string
  name: string
  description: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface CategoryWithRules extends Category {
  categoryRules: Array<{
    id: string
    order: number
    rule: Rule
  }>
}

export interface CreateCategoryInput {
  name: string
  description?: string
  order?: number
}
```

### 4. 카테고리 API Routes (`src/app/api/categories/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - 카테고리 목록
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        categoryRules: {
          include: {
            rule: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/categories - 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const category = await prisma.category.create({
      data: {
        name: body.name,
        description: body.description,
        order: body.order || 0
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 5. 카테고리에 규칙 추가 API (`src/app/api/categories/[id]/rules/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/[id]/rules - 카테고리의 규칙 목록
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryRules = await prisma.categoryRule.findMany({
      where: {
        categoryId: params.id
      },
      include: {
        rule: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categoryRules)
  } catch (error) {
    console.error('카테고리 규칙 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/categories/[id]/rules - 카테고리에 규칙 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { ruleId } = body

    // 이미 추가되어 있는지 확인
    const existing = await prisma.categoryRule.findFirst({
      where: {
        categoryId: params.id,
        ruleId: ruleId
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 추가된 규칙입니다.' },
        { status: 400 }
      )
    }

    // 현재 카테고리의 규칙 개수 확인 (순서 결정)
    const count = await prisma.categoryRule.count({
      where: { categoryId: params.id }
    })

    const categoryRule = await prisma.categoryRule.create({
      data: {
        categoryId: params.id,
        ruleId: ruleId,
        order: count
      },
      include: {
        rule: true
      }
    })

    return NextResponse.json(categoryRule, { status: 201 })
  } catch (error) {
    console.error('규칙 추가 실패:', error)
    return NextResponse.json(
      { error: '규칙을 추가할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 6. 카테고리 편집 페이지 예시 (`src/app/categories/[id]/page.tsx`)

```typescript
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CategoryWithRules } from "@/types/category"
import { Rule } from "@/types/rule"
import { useToast } from "@/hooks/use-toast"

export default function CategoryEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [category, setCategory] = useState<CategoryWithRules | null>(null)
  const [allRules, setAllRules] = useState<Rule[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    // 카테고리 정보 불러오기
    fetch(`/api/categories/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setCategory(data)
        setName(data.name)
        setDescription(data.description || "")
      })

    // 모든 규칙 불러오기 (규칙 추가용)
    fetch('/api/rules')
      .then(res => res.json())
      .then(setAllRules)
  }, [params.id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) throw new Error('Failed to update')

      toast({
        title: "성공",
        description: "카테고리가 수정되었습니다."
      })
    } catch (error) {
      toast({
        title: "오류",
        description: "카테고리를 수정할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handleAddRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/categories/${params.id}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      })

      if (!response.ok) throw new Error('Failed to add')

      toast({
        title: "성공",
        description: "규칙이 추가되었습니다."
      })

      // 카테고리 정보 다시 불러오기
      const updated = await fetch(`/api/categories/${params.id}`).then(r => r.json())
      setCategory(updated)
    } catch (error) {
      toast({
        title: "오류",
        description: "규칙을 추가할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handleRemoveRule = async (categoryRuleId: string) => {
    try {
      const response = await fetch(`/api/category-rules/${categoryRuleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove')

      toast({
        title: "성공",
        description: "규칙이 제거되었습니다."
      })

      // 카테고리 정보 다시 불러오기
      const updated = await fetch(`/api/categories/${params.id}`).then(r => r.json())
      setCategory(updated)
    } catch (error) {
      toast({
        title: "오류",
        description: "규칙을 제거할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  if (!category) return <p>로딩 중...</p>

  // 이미 추가된 규칙 ID 목록
  const addedRuleIds = new Set(category.categoryRules.map(cr => cr.rule.id))
  const availableRules = allRules.filter(rule => !addedRuleIds.has(rule.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/categories')}>
            ← 뒤로
          </Button>
          <h1 className="text-3xl font-bold mt-2">카테고리 편집</h1>
        </div>
        <Button onClick={handleSave}>저장</Button>
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
              placeholder="카테고리 이름"
            />
          </div>
          <div>
            <Label>설명</Label>
            <Textarea
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
        </CardHeader>
        <CardContent>
          {category.categoryRules.length === 0 ? (
            <p className="text-muted-foreground">아직 규칙이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {category.categoryRules.map((cr) => (
                <div key={cr.id} className="flex items-center justify-between p-3 border rounded">
                  <span>{cr.rule.name}</span>
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
        </CardHeader>
        <CardContent>
          {availableRules.length === 0 ? (
            <p className="text-muted-foreground">추가 가능한 규칙이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {availableRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                  <span>{rule.name}</span>
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
  )
}
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ 카테고리 목록 페이지에서 모든 카테고리와 포함된 규칙 수가 표시됨
2. ✅ 새 카테고리 생성이 정상적으로 작동함
3. ✅ 카테고리 편집 페이지에서 기본 정보를 수정할 수 있음
4. ✅ 카테고리에 마스터 규칙을 추가/제거할 수 있음
5. ✅ 카테고리 삭제가 정상적으로 작동함 (Phase 3 이후 사용 체크 추가 필요)
6. ✅ 카테고리 복사 기능이 정상적으로 작동함

---

## 📝 다음 단계

Phase 2 완료 후 **Phase 3: 카테고리 프리셋 CRUD 구현**으로 진행합니다.

Phase 3에서는:
- 카테고리 프리셋 및 연결 테이블 추가
- 프리셋 CRUD API 구현
- 프리셋에 카테고리 추가/제거 기능
- 프리셋 미리보기 기능
