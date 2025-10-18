"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rule } from "@/types/rule"
import { RuleDialog } from "@/components/rules/rule-dialog"
import { toast } from "sonner"

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  // 규칙 목록 불러오기
  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setRules(data)
    } catch (error) {
      toast.error("규칙 목록을 불러올 수 없습니다.")
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

      toast.success("규칙이 삭제되었습니다.")
      fetchRules()
    } catch (error) {
      toast.error("규칙을 삭제할 수 없습니다.")
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

      toast.success("규칙이 복사되었습니다.")

      // 복사된 규칙을 바로 편집 모드로
      setEditingRule(copied)
      setDialogOpen(true)
    } catch (error) {
      toast.error("규칙을 복사할 수 없습니다.")
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
