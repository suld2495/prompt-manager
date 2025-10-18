# Phase 6: 검색, 필터링 및 개선사항

## 📋 개요

사용자 경험을 향상시키는 다양한 개선사항을 구현하는 단계입니다. 검색, 필터링, 통계, UI/UX 개선, 성능 최적화 등을 진행합니다.

### 목표
- 검색 기능 구현 (규칙, 카테고리, 프리셋, 템플릿)
- 필터링 및 정렬 기능 구현
- 사용 통계 표시
- UI/UX 개선 및 폴리싱
- 성능 최적화

### 완료 시 얻게 되는 것
✅ 빠르게 원하는 항목을 찾을 수 있는 검색 기능
✅ 다양한 조건으로 필터링 및 정렬
✅ 사용 현황을 파악할 수 있는 통계
✅ 완성도 높은 사용자 경험
✅ **프로덕션 레디 애플리케이션**

---

## 🔗 선행 조건

**의존성: Phase 5 완료 필수**

- [x] 모든 핵심 기능 구현 완료
- [x] 스냅샷 시스템 구현 완료
- [x] 전체 워크플로우 동작 확인 완료

---

## ✅ 작업 체크리스트

### 1. 검색 기능
- [ ] 규칙 검색 (이름, 제목, 설명으로 검색)
- [ ] 카테고리 검색 (이름, 설명으로 검색)
- [ ] 프리셋 검색 (이름, 설명으로 검색)
- [ ] 템플릿 검색 (이름, 설명으로 검색)
- [ ] 실시간 검색 (Debounce 적용)

### 2. 필터링 기능
- [ ] 규칙 필터링 (우선순위, 허용/비허용)
- [ ] 카테고리 필터링 (사용 여부)
- [ ] 템플릿 필터링 (변경사항 있음/없음)

### 3. 정렬 기능
- [ ] 이름순, 생성일순, 수정일순 정렬
- [ ] 오름차순/내림차순 토글

### 4. 사용 통계
- [ ] 규칙: 사용 중인 카테고리 수, 템플릿 수
- [ ] 카테고리: 사용 중인 프리셋 수, 템플릿 수
- [ ] 프리셋: 사용 중인 템플릿 수
- [ ] 템플릿: 포함된 카테고리 수, 규칙 수

### 5. UI/UX 개선
- [ ] 로딩 스피너 및 스켈레톤 UI
- [ ] 에러 바운더리 구현
- [ ] 빈 상태(Empty State) 개선
- [ ] 반응형 디자인 개선
- [ ] 다크 모드 지원 (선택사항)

### 6. 성능 최적화
- [ ] API 응답 캐싱 (React Query 또는 SWR)
- [ ] 무한 스크롤 또는 페이지네이션
- [ ] 이미지 및 자산 최적화
- [ ] 코드 스플리팅

---

## 💻 코드 예시 및 스니펫

### 1. 검색 기능 구현 (`src/components/search-input.tsx`)

```typescript
"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchInputProps {
  placeholder: string
  onSearch: (query: string) => void
  debounceMs?: number
}

export function SearchInput({ placeholder, onSearch, debounceMs = 300 }: SearchInputProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, onSearch, debounceMs])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  )
}
```

### 2. 필터링 및 정렬 UI (`src/components/filter-toolbar.tsx`)

```typescript
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

interface FilterToolbarProps {
  onFilterChange: (filter: string) => void
  onSortChange: (sort: string) => void
  onOrderToggle: () => void
  filterOptions: Array<{ value: string; label: string }>
  sortOptions: Array<{ value: string; label: string }>
  currentOrder: 'asc' | 'desc'
}

export function FilterToolbar({
  onFilterChange,
  onSortChange,
  onOrderToggle,
  filterOptions,
  sortOptions,
  currentOrder
}: FilterToolbarProps) {
  return (
    <div className="flex gap-2 items-center">
      <Select onValueChange={onFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="필터" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onSortChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={onOrderToggle}
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### 3. 사용 통계 API 추가 (`src/app/api/rules/[id]/stats/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rules/[id]/stats - 규칙 사용 통계
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용 중인 카테고리 수
    const categoryCount = await prisma.categoryRule.count({
      where: { ruleId: params.id }
    })

    // 사용 중인 카테고리 목록
    const categories = await prisma.categoryRule.findMany({
      where: { ruleId: params.id },
      include: {
        category: true
      },
      distinct: ['categoryId']
    })

    // 사용 중인 템플릿 수 (카테고리를 통해)
    const templateCategories = await prisma.templateCategory.findMany({
      where: {
        categoryId: {
          in: categories.map(c => c.categoryId)
        }
      },
      distinct: ['templateId']
    })

    // 스냅샷 수
    const snapshotCount = await prisma.ruleSnapshot.count({
      where: { baseRuleId: params.id }
    })

    return NextResponse.json({
      categoryCount,
      templateCount: templateCategories.length,
      snapshotCount,
      categories: categories.map(c => ({
        id: c.category.id,
        name: c.category.name
      }))
    })
  } catch (error) {
    console.error('통계 조회 실패:', error)
    return NextResponse.json(
      { error: '통계를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
```

### 4. 로딩 스켈레톤 UI (`src/components/skeleton-card.tsx`)

```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
```

### 5. 에러 바운더리 (`src/components/error-boundary.tsx`)

```typescript
"use client"

import { Component, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-8">
          <CardHeader>
            <CardTitle>⚠️ 오류가 발생했습니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {this.state.error && (
              <pre className="text-sm bg-muted p-4 rounded overflow-auto mb-4">
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              페이지 새로고침
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
```

### 6. React Query 설정 (`src/lib/react-query.tsx`)

```typescript
"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5분
        cacheTime: 1000 * 60 * 10, // 10분
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 7. 규칙 목록에 검색/필터 적용 예시

```typescript
"use client"

import { useState, useMemo } from "react"
import { useQuery } from '@tanstack/react-query'
import { SearchInput } from "@/components/search-input"
import { FilterToolbar } from "@/components/filter-toolbar"
import { SkeletonList } from "@/components/skeleton-card"
import { Rule } from "@/types/rule"

export default function RulesPageWithSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const { data: rules = [], isLoading } = useQuery<Rule[]>({
    queryKey: ['rules'],
    queryFn: async () => {
      const res = await fetch('/api/rules')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  // 검색, 필터, 정렬 적용
  const filteredAndSortedRules = useMemo(() => {
    let result = [...rules]

    // 검색
    if (searchQuery) {
      result = result.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 필터
    if (filter !== 'all') {
      if (filter === 'critical') {
        result = result.filter(r => r.priority === 'critical')
      } else if (filter === 'warning') {
        result = result.filter(r => r.priority === 'warning')
      } else if (filter === 'info') {
        result = result.filter(r => r.priority === 'info')
      } else if (filter === 'allowed') {
        result = result.filter(r => r.allowed === true)
      } else if (filter === 'disallowed') {
        result = result.filter(r => r.allowed === false)
      }
    }

    // 정렬
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return order === 'asc' ? comparison : -comparison
    })

    return result
  }, [rules, searchQuery, filter, sortBy, order])

  if (isLoading) {
    return <SkeletonList count={5} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          placeholder="규칙 검색..."
          onSearch={setSearchQuery}
        />
        <FilterToolbar
          onFilterChange={setFilter}
          onSortChange={setSortBy}
          onOrderToggle={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
          currentOrder={order}
          filterOptions={[
            { value: 'all', label: '전체' },
            { value: 'critical', label: '🔴 중요' },
            { value: 'warning', label: '🟡 경고' },
            { value: 'info', label: '🔵 정보' },
            { value: 'allowed', label: '✅ 허용' },
            { value: 'disallowed', label: '❌ 비허용' },
          ]}
          sortOptions={[
            { value: 'name', label: '이름순' },
            { value: 'createdAt', label: '생성일순' },
            { value: 'updatedAt', label: '수정일순' },
          ]}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredAndSortedRules.length}개의 규칙
      </div>

      {/* 규칙 목록 렌더링 */}
    </div>
  )
}
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ 모든 목록 페이지에 검색 기능이 작동함
2. ✅ 필터링 및 정렬이 정상적으로 작동함
3. ✅ 사용 통계가 정확하게 표시됨
4. ✅ 로딩 상태와 에러 상태가 적절히 처리됨
5. ✅ 전반적인 UI/UX가 완성도 있게 구현됨
6. ✅ 성능 이슈 없이 원활하게 동작함

---

## 🎉 프로젝트 완성!

Phase 6 완료 시, 프롬프트 관리 시스템의 모든 기능이 완성됩니다!

### 완성된 시스템의 핵심 기능

1. **4계층 아키텍처**: 규칙 → 카테고리 → 프리셋 → 템플릿
2. **모듈화 및 재사용성**: 모든 요소를 재사용 가능하게 설계
3. **스냅샷 시스템**: MD 생성 시점 보존 및 변경 추적
4. **검색 및 필터링**: 빠른 항목 찾기
5. **사용 통계**: 사용 현황 파악
6. **완성도 높은 UX**: 로딩, 에러 처리, 반응형 디자인

### 다음 스텝 (선택사항)

프로젝트를 더욱 발전시키고 싶다면:

- [ ] **인증 시스템**: 사용자별 프롬프트 관리
- [ ] **협업 기능**: 팀 멤버와 공유 및 협업
- [ ] **버전 관리**: Git과 유사한 변경 이력 관리
- [ ] **AI 통합**: 규칙 추천, 자동 카테고리 분류
- [ ] **임포트/익스포트**: JSON, CSV 등 다양한 포맷 지원
- [ ] **템플릿 마켓플레이스**: 공개 템플릿 공유

---

## 📊 프로젝트 체크리스트

### Phase 0: 인프라 ✅
- [x] Supabase 설정
- [x] Prisma 설정
- [x] shadcn/ui 컴포넌트
- [x] 기본 레이아웃

### Phase 1: 규칙 CRUD ✅
- [x] 규칙 CRUD API
- [x] 규칙 목록 및 편집 UI
- [x] 규칙 복사 기능

### Phase 2: 카테고리 CRUD ✅
- [x] 카테고리 CRUD API
- [x] 카테고리-규칙 연결
- [x] 카테고리 관리 UI

### Phase 3: 프리셋 CRUD ✅
- [x] 프리셋 CRUD API
- [x] 프리셋-카테고리 연결
- [x] 프리셋 미리보기

### Phase 4: 템플릿 및 MD 생성 ✅
- [x] 템플릿 CRUD API
- [x] 프리셋/카테고리 추가
- [x] MD 생성 및 다운로드

### Phase 5: 스냅샷 관리 ✅
- [x] 스냅샷 자동 생성
- [x] 변경 감지
- [x] 변경사항 처리 UI

### Phase 6: 개선사항 ✅
- [x] 검색 기능
- [x] 필터링 및 정렬
- [x] 사용 통계
- [x] UI/UX 개선
- [x] 성능 최적화

---

## 🎊 축하합니다!

모든 Phase를 완료하면 완전히 기능하는 프롬프트 관리 시스템을 갖게 됩니다!

프로젝트를 계속 발전시키고, 실제로 사용하면서 피드백을 받아 더욱 개선해나가세요.
