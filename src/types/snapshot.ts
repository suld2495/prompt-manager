// 스냅샷 타입 정의

export interface RuleSnapshotContent {
  title: string
  priority: 'critical' | 'warning' | 'info'
  allowed: boolean
  descriptionDetail: string | null
  exampleBad: string | null
  exampleGood: string | null
  violationAction: string | null
  notes: string | null
}

export interface RuleSnapshot {
  id: string
  baseRuleId: string
  templateId: string
  categoryId: string
  snapshotContent: RuleSnapshotContent
  isOutdated: boolean
  isCustom: boolean
  createdAt: Date
}

export interface RuleSnapshotWithDetails extends RuleSnapshot {
  baseRule: {
    id: string
    name: string
    title: string
  }
  category: {
    id: string
    name: string
  }
}

export interface OutdatedSnapshot {
  snapshotId: string
  ruleId: string
  ruleName: string
  categoryName: string
  snapshotContent: RuleSnapshotContent
  currentContent: RuleSnapshotContent
  isCustom: boolean
}

export interface SnapshotUpdateInput {
  action: 'update' | 'keep' | 'customize'
  customContent?: RuleSnapshotContent
}
