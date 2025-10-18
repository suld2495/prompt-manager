# Phase 3: 카테고리 프리셋 CRUD 구현

## 📋 개요

카테고리 프리셋(Category Preset) 관리 기능을 구현하는 단계입니다. 자주 사용하는 카테고리 조합을 프리셋으로 저장하여 템플릿 작성 시 편리하게 사용할 수 있습니다.

### 목표
- 카테고리 프리셋 CRUD 기능 구현
- 프리셋-카테고리 연결 관리 기능 구현
- 프리셋 미리보기 기능 (포함된 모든 규칙 표시)
- 프리셋 관리 UI 완성

### 완료 시 얻게 되는 것
✅ 자주 사용하는 카테고리 조합을 프리셋으로 저장
✅ 템플릿 작성 시 프리셋을 선택하여 여러 카테고리를 한번에 추가 가능
✅ 프리셋 저장소 페이지 완성

---

## 🔗 선행 조건

**의존성: Phase 2 완료 필수**

- [x] 카테고리 CRUD 기능 완성
- [x] 카테고리-규칙 연결 기능 완성
- [x] 카테고리 관리 UI 구현 완료

---

## ✅ 작업 체크리스트

### 1. 데이터베이스 스키마 업데이트
- [ ] Prisma 스키마에 `CategoryPreset` 모델 추가
- [ ] Prisma 스키마에 `CategoryPresetItem` 모델 추가 (프리셋-카테고리 다대다)
- [ ] 마이그레이션 실행

### 2. API Routes 구현
- [ ] **프리셋 목록 조회**: `GET /api/presets` 구현
- [ ] **프리셋 생성**: `POST /api/presets` 구현
- [ ] **프리셋 수정**: `PUT /api/presets/[id]` 구현
- [ ] **프리셋 삭제**: `DELETE /api/presets/[id]` 구현
- [ ] **프리셋 복사**: `POST /api/presets/[id]/copy` 구현
- [ ] **프리셋에 카테고리 추가**: `POST /api/presets/[id]/categories` 구현
- [ ] **프리셋에서 카테고리 제거**: `DELETE /api/presets/[id]/categories/[categoryId]` 구현
- [ ] **프리셋 미리보기**: `GET /api/presets/[id]/preview` 구현 (모든 규칙 포함)

### 3. 프리셋 목록 페이지
- [ ] 프리셋 목록 페이지 작성 (`src/app/presets/page.tsx`)
- [ ] 프리셋 카드 컴포넌트 작성
- [ ] 포함된 카테고리 수 표시
- [ ] 사용 중인 템플릿 수 표시 (Phase 4 이후)

### 4. 프리셋 편집 페이지
- [ ] 프리셋 편집 페이지 작성 (`src/app/presets/[id]/page.tsx`)
- [ ] 프리셋 기본 정보 편집 폼
- [ ] 카테고리 추가/제거 UI
- [ ] 카테고리 순서 변경 UI
- [ ] 프리셋 미리보기 (포함된 모든 규칙 표시)

### 5. 프리셋 삭제 기능
- [ ] 삭제 확인 다이얼로그
- [ ] 삭제 API 연동
- [ ] 사용 중인 템플릿이 있어도 삭제 가능 (템플릿에는 개별 카테고리로 남음)

---

## 💻 코드 예시 및 스니펫

### 1. Prisma 스키마 업데이트 (`prisma/schema.prisma`)

```prisma
// 카테고리 프리셋 모델
model CategoryPreset {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // 관계
  presetItems CategoryPresetItem[]

  @@map("category_presets")
}

// 프리셋-카테고리 연결 테이블
model CategoryPresetItem {
  id         String   @id @default(uuid())
  presetId   String   @map("preset_id")
  categoryId String   @map("category_id")
  order      Int      @default(0)

  createdAt DateTime @default(now()) @map("created_at")

  // 관계
  preset   CategoryPreset @relation(fields: [presetId], references: [id], onDelete: Cascade)
  category Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([presetId, categoryId])
  @@map("category_preset_items")
}

// Category 모델에 관계 추가
model Category {
  // ... 기존 필드들 ...

  categoryRules  CategoryRule[]
  presetItems    CategoryPresetItem[]  // 추가

  @@map("categories")
}
```

### 2. 마이그레이션 실행

```bash
pnpm prisma migrate dev --name add-presets
pnpm prisma generate
```

### 3. 프리셋 타입 정의 (`src/types/preset.ts`)

```typescript
import { Category } from './category'

export interface CategoryPreset {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CategoryPresetWithItems extends CategoryPreset {
  presetItems: Array<{
    id: string
    order: number
    category: Category
  }>
}

export interface CreatePresetInput {
  name: string
  description?: string
}
```

### 4. 프리셋 API Routes (`src/app/api/presets/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/presets - 프리셋 목록
export async function GET() {
  try {
    const presets = await prisma.categoryPreset.findMany({
      include: {
        presetItems: {
          include: {
            category: {
              include: {
                categoryRules: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(presets)
  } catch (error) {
    console.error('프리셋 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '프리셋 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/presets - 프리셋 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const preset = await prisma.categoryPreset.create({
      data: {
        name: body.name,
        description: body.description
      }
    })

    return NextResponse.json(preset, { status: 201 })
  } catch (error) {
    console.error('프리셋 생성 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 5. 프리셋 복사 API (`src/app/api/presets/[id]/copy/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/presets/[id]/copy - 프리셋 복사
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const original = await prisma.categoryPreset.findUnique({
      where: { id: params.id },
      include: {
        presetItems: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!original) {
      return NextResponse.json(
        { error: '원본 프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프리셋 복사 (포함된 카테고리 연결도 모두 복사)
    const copied = await prisma.categoryPreset.create({
      data: {
        name: `${original.name} (복사)`,
        description: original.description,
        presetItems: {
          create: original.presetItems.map(item => ({
            categoryId: item.categoryId,
            order: item.order
          }))
        }
      },
      include: {
        presetItems: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(copied, { status: 201 })
  } catch (error) {
    console.error('프리셋 복사 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 복사할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 6. 프리셋 미리보기 API (`src/app/api/presets/[id]/preview/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/presets/[id]/preview - 프리셋 미리보기 (모든 규칙 표시)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const preset = await prisma.categoryPreset.findUnique({
      where: { id: params.id },
      include: {
        presetItems: {
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

    if (!preset) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 총 규칙 수 계산
    const totalRules = preset.presetItems.reduce(
      (sum, item) => sum + item.category.categoryRules.length,
      0
    )

    // 모든 규칙 평탄화
    const allRules = preset.presetItems.flatMap(item =>
      item.category.categoryRules.map(cr => ({
        ...cr.rule,
        categoryName: item.category.name
      }))
    )

    return NextResponse.json({
      preset,
      totalRules,
      allRules
    })
  } catch (error) {
    console.error('프리셋 미리보기 실패:', error)
    return NextResponse.json(
      { error: '프리셋 미리보기를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 7. 프리셋 목록 페이지 (`src/app/presets/page.tsx`)

```typescript
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryPresetWithItems } from "@/types/preset"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function PresetsPage() {
  const router = useRouter()
  const [presets, setPresets] = useState<CategoryPresetWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/presets')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setPresets(data)
    } catch (error) {
      toast({
        title: "오류",
        description: "프리셋 목록을 불러올 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?\n\n사용 중인 템플릿이 있어도 삭제됩니다. 템플릿에는 개별 카테고리로 남아있습니다.')) return

    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast({
        title: "성공",
        description: "프리셋이 삭제되었습니다."
      })

      fetchPresets()
    } catch (error) {
      toast({
        title: "오류",
        description: "프리셋을 삭제할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const handleCopy = async (id: string) => {
    try {
      const response = await fetch(`/api/presets/${id}/copy`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to copy')

      toast({
        title: "성공",
        description: "프리셋이 복사되었습니다."
      })

      fetchPresets()
    } catch (error) {
      toast({
        title: "오류",
        description: "프리셋을 복사할 수 없습니다.",
        variant: "destructive"
      })
    }
  }

  const getTotalRules = (preset: CategoryPresetWithItems) => {
    return preset.presetItems.reduce(
      (sum, item) => sum + (item.category.categoryRules?.length || 0),
      0
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📦 카테고리 프리셋</h1>
          <p className="text-muted-foreground">자주 사용하는 카테고리 조합을 관리합니다</p>
        </div>
        <Button onClick={() => router.push('/presets/new')}>
          + 새 프리셋
        </Button>
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : presets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              아직 프리셋이 없습니다. 새 프리셋을 추가해보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {presets.map((preset) => (
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
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ 프리셋 목록 페이지에서 모든 프리셋과 포함된 카테고리/규칙 수가 표시됨
2. ✅ 새 프리셋 생성 및 카테고리 추가가 정상적으로 작동함
3. ✅ 프리셋 편집 페이지에서 카테고리를 추가/제거할 수 있음
4. ✅ 프리셋 미리보기에서 포함된 모든 규칙이 표시됨
5. ✅ 프리셋 복사 시 포함된 카테고리 연결도 모두 복사됨
6. ✅ 프리셋 삭제가 정상적으로 작동함

---

## 💡 중요 개념: 프리셋은 "스탬프"

프리셋은 **스탬프**와 같은 개념입니다:
- 템플릿에 프리셋을 추가하면 해당 프리셋의 카테고리들이 템플릿에 복사됩니다
- 복사된 후에는 독립적으로 존재하며, 프리셋을 수정해도 기존 템플릿에 영향을 주지 않습니다
- `from_preset_id` 필드는 출처 표시용으로만 사용됩니다

---

## 📝 다음 단계

Phase 3 완료 후 **Phase 4: 템플릿 CRUD 및 MD 생성 구현**으로 진행합니다.

Phase 4에서는:
- 템플릿 및 템플릿-카테고리 연결 테이블 추가
- 템플릿 CRUD API 구현
- 프리셋 추가 기능 (여러 카테고리를 한번에)
- 개별 카테고리 추가 기능
- MD 생성/미리보기/다운로드 기능
