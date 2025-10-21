'use client'

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  FileText,
  Layers,
  ListChecks,
  PlusCircle,
  Repeat,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Rule } from "@/types/rule"
import type { Template } from "@/types/template"
import type { CategoryPresetWithItems } from "@/types/preset"
import type { CategoryWithRules } from "@/types/category"

type DashboardStats = {
  rules: number
  categories: number
  presets: number
  templates: number
  categoryRules: number
  presetItems: number
  templateCategories: number
  snapshots: number
}

interface TemplateWithCounts extends Template {
  categoryCount: number
  ruleCount: number
}

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const LoadingList = () => (
  <div className="space-y-3">
    <div className="h-4 w-full rounded bg-muted animate-pulse" />
    <div className="h-4 w-[90%] rounded bg-muted animate-pulse" />
    <div className="h-4 w-[75%] rounded bg-muted animate-pulse" />
  </div>
)

const QuickLinkBadge = ({
  href,
  label,
}: {
  href: string
  label: string
}) => (
  <Link
    href={href}
    className="rounded-full border border-dashed border-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
  >
    {label}
  </Link>
)

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRules, setRecentRules] = useState<Rule[]>([])
  const [recentTemplates, setRecentTemplates] = useState<TemplateWithCounts[]>([])
  const [recentPresets, setRecentPresets] = useState<CategoryPresetWithItems[]>([])
  const [categories, setCategories] = useState<CategoryWithRules[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayLabel = useMemo(() => {
    const now = new Date()
    const weekday = now.toLocaleDateString("ko-KR", { weekday: "long" })
    const date = now.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    })
    return `${date} ${weekday}`
  }, [])

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [
          statsRes,
          rulesRes,
          templatesRes,
          presetsRes,
          categoriesRes,
        ] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/rules"),
          fetch("/api/templates"),
          fetch("/api/presets"),
          fetch("/api/categories"),
        ])

        if (
          !statsRes.ok ||
          !rulesRes.ok ||
          !templatesRes.ok ||
          !presetsRes.ok ||
          !categoriesRes.ok
        ) {
          throw new Error("failed to load dashboard data")
        }

        const [
          statsData,
          rulesData,
          templatesData,
          presetsData,
          categoriesData,
        ] = await Promise.all([
          statsRes.json(),
          rulesRes.json(),
          templatesRes.json(),
          presetsRes.json(),
          categoriesRes.json(),
        ])

        setStats(statsData)
        setRecentRules(rulesData.slice(0, 5))
        setRecentTemplates(templatesData.slice(0, 4))
        setRecentPresets(presetsData.slice(0, 4))
        setCategories(categoriesData)
      } catch (err) {
        console.error(err)
        setError("대시보드 데이터를 불러오지 못했습니다. 새로고침 해주세요.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const categoryHighlights = useMemo(() => {
    return categories
      .map((category) => {
        const sorted = [...category.categoryRules].sort((a, b) => {
          const aTime = new Date(
            (a.rule.updatedAt || a.rule.createdAt) as string | Date
          ).getTime()
          const bTime = new Date(
            (b.rule.updatedAt || b.rule.createdAt) as string | Date
          ).getTime()
          return bTime - aTime
        })
        const latestRule = sorted[0]?.rule ?? null

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          totalRules: category.categoryRules.length,
          latestRule,
        }
      })
      .sort((a, b) => {
        const aTime = a.latestRule
          ? new Date(
              (a.latestRule.updatedAt || a.latestRule.createdAt) as
                string | Date
            ).getTime()
          : 0
        const bTime = b.latestRule
          ? new Date(
              (b.latestRule.updatedAt || b.latestRule.createdAt) as
                string | Date
            ).getTime()
          : 0
        return bTime - aTime
      })
      .slice(0, 4)
  }, [categories])

  const quickActions = [
    {
      label: "새 규칙 작성",
      description: "규칙 저장소에 바로 추가합니다",
      href: "/rules",
      icon: ListChecks,
    },
    {
      label: "카테고리 정리",
      description: "규칙 그룹을 빠르게 관리합니다",
      href: "/categories",
      icon: Layers,
    },
    {
      label: "카테고리 프리셋",
      description: "자주 쓰는 조합을 불러옵니다",
      href: "/presets",
      icon: Repeat,
    },
    {
      label: "템플릿 대시보드",
      description: "MD 생성 흐름을 설계합니다",
      href: "/templates",
      icon: FileText,
    },
  ]

  const quickFilters = [
    { label: "🔴 중요 규칙", href: "/rules" },
    { label: "🗂 전체 카테고리", href: "/categories" },
    { label: "📦 프리셋 모음", href: "/presets" },
    { label: "🧱 템플릿 목록", href: "/templates" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-2xl border bg-card px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{todayLabel}</p>
              <h1 className="text-3xl font-semibold tracking-tight">
                프롬프트 관리 대시보드
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                자주 사용하는 흐름과 최근 작업을 한눈에 확인하고, 필요한 페이지로
                바로 이동하세요.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="flex h-auto flex-col items-start gap-2 rounded-xl border-dashed px-4 py-3 text-left"
                    onClick={() => router.push(action.href)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <QuickLinkBadge key={filter.label} href={filter.href} label={filter.label} />
            ))}
          </div>
        </section>

        {error && (
          <Card className="border-destructive/60 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">데이터를 불러오지 못했습니다</CardTitle>
              <CardDescription className="text-destructive">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    최근 추가한 규칙
                  </CardTitle>
                  <CardDescription>
                    새로 작성하거나 수정한 규칙을 빠르게 확인하세요.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{recentRules.length}개</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <LoadingList />
                ) : recentRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 등록된 규칙이 없습니다. 규칙 페이지에서 새 규칙을 추가하세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentRules.map((rule) => (
                      <button
                        key={rule.id}
                        onClick={() => router.push("/rules")}
                        className="w-full rounded-lg border border-transparent bg-muted/30 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/60"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{rule.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {rule.title}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(rule.updatedAt || rule.createdAt)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Link
                  href="/rules"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  규칙 전체 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>최근 템플릿</CardTitle>
                  <CardDescription>
                    가장 최근에 만든 템플릿과 구성 요소를 확인하세요.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{recentTemplates.length}개</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <LoadingList />
                ) : recentTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 템플릿이 없습니다. 템플릿 페이지에서 새 템플릿을 만들어보세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentTemplates.map((template) => (
                      <Link
                        key={template.id}
                        href={`/templates/${template.id}`}
                        className="block rounded-lg border border-transparent bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {template.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              카테고리 {template.categoryCount}개 · 규칙{" "}
                              {template.ruleCount}개
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(template.updatedAt || template.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Link
                  href="/templates"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  템플릿 전체 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>카테고리 하이라이트</CardTitle>
                <CardDescription>
                  최근에 수정된 카테고리와 대표 규칙을 미리 봅니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <LoadingList />
                ) : categoryHighlights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 등록된 카테고리가 없습니다. 카테고리 페이지에서 새로 만들어보세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categoryHighlights.map((category) => (
                      <Link
                        key={category.id}
                        href="/categories"
                        className="block rounded-lg border border-transparent bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                      >
                        <p className="text-sm font-semibold">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          규칙 {category.totalRules}개
                        </p>
                        {category.latestRule ? (
                          <div className="mt-2 space-y-1 rounded-lg bg-background/80 p-3 text-xs shadow-inner">
                            <p className="font-medium text-foreground">
                              {category.latestRule.name}
                            </p>
                            <p className="text-muted-foreground line-clamp-2">
                              {category.latestRule.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDateTime(
                                category.latestRule.updatedAt ||
                                  category.latestRule.createdAt
                              )}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">
                            아직 이 카테고리에 연결된 규칙이 없습니다.
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Link
                  href="/categories"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  카테고리 관리로 이동
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 프리셋</CardTitle>
                <CardDescription>
                  자주 사용하는 카테고리 묶음을 빠르게 불러옵니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <LoadingList />
                ) : recentPresets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 프리셋이 없습니다. 프리셋 페이지에서 새 묶음을 만들어보세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPresets.map((preset) => (
                      <Link
                        key={preset.id}
                        href={`/presets/${preset.id}`}
                        className="block rounded-lg border border-transparent bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{preset.name}</p>
                            {preset.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {preset.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              카테고리 {preset.presetItems.length}개
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(preset.updatedAt || preset.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Link
                  href="/presets"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  프리셋 전체 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>최근 활동 요약</CardTitle>
                <CardDescription>
                  현재 저장된 리소스의 전체 규모입니다.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <PlusCircle className="h-3 w-3" />
                업데이트됨
              </Badge>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">규칙</p>
                    <p className="text-2xl font-semibold">{stats.rules}</p>
                    <p className="text-[11px] text-muted-foreground">
                      카테고리 규칙 {stats.categoryRules}개 연결
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">카테고리</p>
                    <p className="text-2xl font-semibold">{stats.categories}</p>
                    <p className="text-[11px] text-muted-foreground">
                      프리셋 아이템 {stats.presetItems}개
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">프리셋</p>
                    <p className="text-2xl font-semibold">{stats.presets}</p>
                    <p className="text-[11px] text-muted-foreground">
                      템플릿 연결 {stats.templateCategories}개
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">템플릿</p>
                    <p className="text-2xl font-semibold">{stats.templates}</p>
                    <p className="text-[11px] text-muted-foreground">
                      스냅샷 {stats.snapshots}개
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  통계 정보를 불러오지 못했습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
