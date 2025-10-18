"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Rule, CreateRuleInput, Priority } from "@/types/rule"
import { toast } from "sonner"

interface RuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: Rule | null
  onSuccess: () => void
}

export function RuleDialog({ open, onOpenChange, rule, onSuccess }: RuleDialogProps) {
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

      toast.success(rule ? "규칙이 수정되었습니다." : "규칙이 생성되었습니다.")

      onSuccess()
    } catch (error) {
      toast.error("규칙을 저장할 수 없습니다.")
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
