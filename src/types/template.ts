import type { CategoryWithRules } from './category'

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

export interface TemplateCategory {
  id: string
  templateId: string
  categoryId: string
  order: number
  fromPresetId: string | null
  createdAt: Date
}

export interface TemplateCategoryWithDetails extends TemplateCategory {
  category: CategoryWithRules
  presetName?: string
}

export interface TemplateWithCategories extends Template {
  templateCategories: TemplateCategoryWithDetails[]
}

export interface CreateTemplateInput {
  name: string
  description?: string
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
}

export interface AddCategoryToTemplateInput {
  categoryId: string
}

export interface AddPresetToTemplateInput {
  presetId: string
}
