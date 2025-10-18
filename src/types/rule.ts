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
