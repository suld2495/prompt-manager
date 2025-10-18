# Phase 5: 스냅샷 관리 구현

## 📋 개요

스냅샷(Snapshot) 시스템을 구현하는 단계입니다. MD 생성 시점의 규칙 내용을 보존하고, 마스터 규칙 변경 시 변경사항을 추적하여 사용자가 선택할 수 있도록 합니다.

### 목표
- MD 생성 시 스냅샷 자동 생성 기능 구현
- 마스터 규칙 변경 시 변경 감지 기능 구현
- 변경사항 비교 및 처리 UI 구현
- 스냅샷 업데이트/유지/커스텀 기능 구현

### 완료 시 얻게 되는 것
✅ MD 파일 생성 시점의 규칙 내용 보존
✅ 마스터 규칙 변경 시 자동 감지 및 알림
✅ 사용자가 변경사항을 선택적으로 반영 가능
✅ **완전한 버전 관리 시스템 완성**

---

## 🔗 선행 조건

**의존성: Phase 4 완료 필수**

- [x] 템플릿 CRUD 기능 완성
- [x] MD 생성 기능 구현 완료
- [x] 템플릿 관리 UI 구현 완료

---

## ✅ 작업 체크리스트

### 1. 데이터베이스 스키마 업데이트
- [ ] Prisma 스키마에 `RuleSnapshot` 모델 추가
- [ ] 마이그레이션 실행

### 2. 스냅샷 생성 로직
- [ ] MD 생성 시 스냅샷 자동 생성 구현
- [ ] 기존 스냅샷 존재 시 처리 로직
- [ ] `template.hasSnapshots` 플래그 업데이트

### 3. 변경 감지 로직
- [ ] 마스터 규칙 수정 시 스냅샷 비교
- [ ] `snapshot.isOutdated` 플래그 업데이트
- [ ] `template.outdatedCount` 카운터 업데이트

### 4. 변경사항 관리 API
- [ ] **변경된 스냅샷 목록**: `GET /api/templates/[id]/outdated` 구현
- [ ] **스냅샷 업데이트**: `PUT /api/snapshots/[id]/update` 구현 (마스터 내용으로)
- [ ] **스냅샷 유지**: `PUT /api/snapshots/[id]/keep` 구현 (무시 처리)
- [ ] **스냅샷 커스텀**: `PUT /api/snapshots/[id]/customize` 구현 (직접 편집)

### 5. 변경사항 UI
- [ ] 템플릿 편집 페이지에 변경 알림 뱃지 추가
- [ ] 변경사항 보기 다이얼로그 구현
- [ ] 스냅샷 vs 마스터 비교 UI
- [ ] 업데이트/유지/커스텀 버튼 및 처리

### 6. MD 생성 로직 업데이트
- [ ] 스냅샷 우선, 없으면 마스터 사용
- [ ] MD 생성 시 스냅샷 생성 통합

---

## 💻 코드 예시 및 스니펫

### 1. Prisma 스키마 업데이트 (`prisma/schema.prisma`)

```prisma
// 규칙 스냅샷 모델
model RuleSnapshot {
  id           String   @id @default(uuid())
  baseRuleId   String   @map("base_rule_id")  // 원본 마스터 규칙
  templateId   String   @map("template_id")   // 어느 템플릿용
  categoryId   String   @map("category_id")   // 어느 카테고리에서

  // 스냅샷 내용 (생성 시점 고정)
  snapshotContent Json   @map("snapshot_content")

  isOutdated   Boolean  @default(false) @map("is_outdated")  // 원본이 변경되었는지
  isCustom     Boolean  @default(false) @map("is_custom")    // 커스텀 수정했는지

  createdAt    DateTime @default(now()) @map("created_at")   // MD 생성 시점

  // 관계
  baseRule Rule     @relation(fields: [baseRuleId], references: [id], onDelete: Cascade)
  template Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([templateId, categoryId, baseRuleId])
  @@map("rule_snapshots")
}

// Rule, Template, Category 모델에 관계 추가
model Rule {
  // ... 기존 필드들 ...

  categoryRules CategoryRule[]
  snapshots     RuleSnapshot[]  // 추가

  @@map("rules")
}

model Template {
  // ... 기존 필드들 ...

  templateCategories TemplateCategory[]
  snapshots          RuleSnapshot[]      // 추가

  @@map("templates")
}

model Category {
  // ... 기존 필드들 ...

  categoryRules      CategoryRule[]
  presetItems        CategoryPresetItem[]
  templateCategories TemplateCategory[]
  snapshots          RuleSnapshot[]      // 추가

  @@map("categories")
}
```

### 2. 스냅샷 타입 정의 (`src/types/snapshot.ts`)

```typescript
export interface RuleSnapshot {
  id: string
  baseRuleId: string
  templateId: string
  categoryId: string
  snapshotContent: {
    title: string
    priority: string
    allowed: boolean
    descriptionDetail: string
    exampleBad: string | null
    exampleGood: string | null
    violationAction: string | null
    notes: string | null
  }
  isOutdated: boolean
  isCustom: boolean
  createdAt: Date
}

export interface SnapshotComparison {
  snapshotId: string
  ruleName: string
  categoryName: string
  snapshotContent: any
  currentContent: any
  differences: string[]
}
```

### 3. MD 생성 시 스냅샷 생성 (업데이트된 `generate` API)

```typescript
// src/app/api/templates/[id]/generate/route.ts 업데이트

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 스냅샷 생성 (트랜잭션)
    await prisma.$transaction(async (tx) => {
      for (const tc of template.templateCategories) {
        for (const cr of tc.category.categoryRules) {
          const rule = cr.rule

          // 이미 스냅샷이 있는지 확인
          const existing = await tx.ruleSnapshot.findUnique({
            where: {
              templateId_categoryId_baseRuleId: {
                templateId: template.id,
                categoryId: tc.categoryId,
                baseRuleId: rule.id
              }
            }
          })

          if (!existing) {
            // 스냅샷 생성
            await tx.ruleSnapshot.create({
              data: {
                baseRuleId: rule.id,
                templateId: template.id,
                categoryId: tc.categoryId,
                snapshotContent: {
                  title: rule.title,
                  priority: rule.priority,
                  allowed: rule.allowed,
                  descriptionDetail: rule.descriptionDetail,
                  exampleBad: rule.exampleBad,
                  exampleGood: rule.exampleGood,
                  violationAction: rule.violationAction,
                  notes: rule.notes
                }
              }
            })
          }
        }
      }

      // 템플릿 상태 업데이트
      await tx.template.update({
        where: { id: template.id },
        data: {
          hasSnapshots: true,
          lastGeneratedAt: new Date()
        }
      })
    })

    // MD 생성 (스냅샷 사용)
    const md = await generateMarkdownWithSnapshots(template.id)

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

async function generateMarkdownWithSnapshots(templateId: string): Promise<string> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      templateCategories: {
        include: {
          category: {
            include: {
              categoryRules: {
                include: {
                  rule: true
                },
                orderBy: { order: 'asc' }
              }
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!template) throw new Error('Template not found')

  let md = `# ${template.name}\n\n`
  if (template.description) {
    md += `${template.description}\n\n`
  }
  md += `---\n\n`

  for (const tc of template.templateCategories) {
    const category = tc.category

    md += `## ${category.name}\n\n`
    if (category.description) {
      md += `${category.description}\n\n`
    }

    for (const cr of category.categoryRules) {
      const rule = cr.rule

      // 스냅샷 찾기
      const snapshot = await prisma.ruleSnapshot.findUnique({
        where: {
          templateId_categoryId_baseRuleId: {
            templateId: templateId,
            categoryId: category.id,
            baseRuleId: rule.id
          }
        }
      })

      // 스냅샷이 있으면 스냅샷 사용, 없으면 마스터 사용
      const content = snapshot
        ? snapshot.snapshotContent as any
        : {
            title: rule.title,
            priority: rule.priority,
            allowed: rule.allowed,
            descriptionDetail: rule.descriptionDetail,
            exampleBad: rule.exampleBad,
            exampleGood: rule.exampleGood,
            violationAction: rule.violationAction,
            notes: rule.notes
          }

      // MD 포맷팅
      const priorityIcon = {
        critical: '🔴',
        warning: '🟡',
        info: '🔵'
      }[content.priority]

      const allowedText = content.allowed ? '✅ 허용' : '❌ 비허용'

      md += `### ${priorityIcon} ${content.title}\n\n`
      md += `**${allowedText}**\n\n`
      md += `${content.descriptionDetail}\n\n`

      if (content.exampleBad) {
        md += `❌ **잘못된 예시:**\n\n\`\`\`\n${content.exampleBad}\n\`\`\`\n\n`
      }

      if (content.exampleGood) {
        md += `✅ **올바른 예시:**\n\n\`\`\`\n${content.exampleGood}\n\`\`\`\n\n`
      }

      if (content.violationAction) {
        md += `**위반 시:** ${content.violationAction}\n\n`
      }

      if (content.notes) {
        md += `📝 **참고:** ${content.notes}\n\n`
      }

      md += `---\n\n`
    }
  }

  return md
}
```

### 4. 마스터 규칙 수정 시 변경 감지 (`src/app/api/rules/[id]/route.ts` 업데이트)

```typescript
// PUT /api/rules/[id] 업데이트

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 마스터 규칙 업데이트
      const updatedRule = await tx.rule.update({
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

      // 이 규칙의 모든 스냅샷 찾기
      const snapshots = await tx.ruleSnapshot.findMany({
        where: {
          baseRuleId: params.id
        }
      })

      // 각 스냅샷 비교 및 outdated 플래그 설정
      for (const snapshot of snapshots) {
        const snapshotContent = snapshot.snapshotContent as any

        // 내용 비교 (간단한 JSON 비교)
        const isContentChanged =
          snapshotContent.title !== updatedRule.title ||
          snapshotContent.priority !== updatedRule.priority ||
          snapshotContent.allowed !== updatedRule.allowed ||
          snapshotContent.descriptionDetail !== updatedRule.descriptionDetail ||
          snapshotContent.exampleBad !== updatedRule.exampleBad ||
          snapshotContent.exampleGood !== updatedRule.exampleGood ||
          snapshotContent.violationAction !== updatedRule.violationAction ||
          snapshotContent.notes !== updatedRule.notes

        if (isContentChanged && !snapshot.isOutdated) {
          // 스냅샷을 outdated로 표시
          await tx.ruleSnapshot.update({
            where: { id: snapshot.id },
            data: { isOutdated: true }
          })

          // 템플릿의 outdatedCount 증가
          await tx.template.update({
            where: { id: snapshot.templateId },
            data: {
              outdatedCount: { increment: 1 }
            }
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('규칙 수정 실패:', error)
    return NextResponse.json(
      { error: '규칙을 수정할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 5. 변경사항 목록 API (`src/app/api/templates/[id]/outdated/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/templates/[id]/outdated - 변경된 스냅샷 목록
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const outdatedSnapshots = await prisma.ruleSnapshot.findMany({
      where: {
        templateId: params.id,
        isOutdated: true
      },
      include: {
        baseRule: true,
        category: true
      }
    })

    // 비교 정보 생성
    const comparisons = outdatedSnapshots.map(snapshot => {
      const snapshotContent = snapshot.snapshotContent as any
      const currentContent = {
        title: snapshot.baseRule.title,
        priority: snapshot.baseRule.priority,
        allowed: snapshot.baseRule.allowed,
        descriptionDetail: snapshot.baseRule.descriptionDetail,
        exampleBad: snapshot.baseRule.exampleBad,
        exampleGood: snapshot.baseRule.exampleGood,
        violationAction: snapshot.baseRule.violationAction,
        notes: snapshot.baseRule.notes
      }

      // 차이점 찾기
      const differences: string[] = []
      if (snapshotContent.title !== currentContent.title) {
        differences.push('제목')
      }
      if (snapshotContent.priority !== currentContent.priority) {
        differences.push('우선순위')
      }
      if (snapshotContent.allowed !== currentContent.allowed) {
        differences.push('허용/비허용')
      }
      if (snapshotContent.descriptionDetail !== currentContent.descriptionDetail) {
        differences.push('설명')
      }
      if (snapshotContent.exampleBad !== currentContent.exampleBad) {
        differences.push('잘못된 예시')
      }
      if (snapshotContent.exampleGood !== currentContent.exampleGood) {
        differences.push('올바른 예시')
      }
      if (snapshotContent.violationAction !== currentContent.violationAction) {
        differences.push('위반 시 조치')
      }
      if (snapshotContent.notes !== currentContent.notes) {
        differences.push('참고사항')
      }

      return {
        snapshotId: snapshot.id,
        ruleName: snapshot.baseRule.name,
        categoryName: snapshot.category.name,
        snapshotContent,
        currentContent,
        differences
      }
    })

    return NextResponse.json(comparisons)
  } catch (error) {
    console.error('변경사항 조회 실패:', error)
    return NextResponse.json(
      { error: '변경사항을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 6. 스냅샷 업데이트/유지/커스텀 API (`src/app/api/snapshots/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/snapshots/[id] - 스냅샷 처리 (업데이트/유지/커스텀)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, customContent } = body  // action: 'update' | 'keep' | 'customize'

    const snapshot = await prisma.ruleSnapshot.findUnique({
      where: { id: params.id },
      include: { baseRule: true }
    })

    if (!snapshot) {
      return NextResponse.json(
        { error: '스냅샷을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'update') {
        // 마스터 내용으로 업데이트
        await tx.ruleSnapshot.update({
          where: { id: params.id },
          data: {
            snapshotContent: {
              title: snapshot.baseRule.title,
              priority: snapshot.baseRule.priority,
              allowed: snapshot.baseRule.allowed,
              descriptionDetail: snapshot.baseRule.descriptionDetail,
              exampleBad: snapshot.baseRule.exampleBad,
              exampleGood: snapshot.baseRule.exampleGood,
              violationAction: snapshot.baseRule.violationAction,
              notes: snapshot.baseRule.notes
            },
            isOutdated: false,
            isCustom: false
          }
        })
      } else if (action === 'keep') {
        // 스냅샷 유지 (무시 처리)
        await tx.ruleSnapshot.update({
          where: { id: params.id },
          data: {
            isOutdated: false
          }
        })
      } else if (action === 'customize' && customContent) {
        // 커스텀 내용으로 수정
        await tx.ruleSnapshot.update({
          where: { id: params.id },
          data: {
            snapshotContent: customContent,
            isOutdated: false,
            isCustom: true
          }
        })
      }

      // 템플릿의 outdatedCount 감소
      await tx.template.update({
        where: { id: snapshot.templateId },
        data: {
          outdatedCount: { decrement: 1 }
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('스냅샷 처리 실패:', error)
    return NextResponse.json(
      { error: '스냅샷을 처리할 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ MD 생성 시 스냅샷이 자동으로 생성됨
2. ✅ 마스터 규칙 수정 시 관련 스냅샷이 outdated로 표시됨
3. ✅ 템플릿 편집 페이지에 변경 알림 뱃지가 표시됨
4. ✅ 변경사항 보기 다이얼로그에서 스냅샷 vs 현재 내용 비교 가능
5. ✅ 업데이트/유지/커스텀 선택 후 outdatedCount가 감소함
6. ✅ MD 생성 시 스냅샷 내용이 우선 사용됨

---

## 🎉 마일스톤: 완전한 버전 관리 시스템 완성!

Phase 5 완료 시, 프롬프트 관리 시스템의 핵심 기능이 모두 완성됩니다:

- ✅ 규칙 → 카테고리 → 프리셋 → 템플릿 → MD 생성
- ✅ MD 생성 시점의 규칙 내용 보존 (스냅샷)
- ✅ 마스터 규칙 변경 추적
- ✅ 사용자 선택적 변경사항 반영

---

## 📝 다음 단계

Phase 5 완료 후 **Phase 6: 검색, 필터링 등 개선사항 구현**으로 진행합니다.

Phase 6에서는:
- 검색 기능
- 필터링 및 정렬
- 사용 통계 표시
- UI/UX 개선
- 성능 최적화
