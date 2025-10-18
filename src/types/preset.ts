import type { Category, CategoryWithRules } from './category'

export interface CategoryPreset {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CategoryPresetItem {
  id: string
  presetId: string
  categoryId: string
  order: number
  createdAt: Date
}

export interface CategoryPresetWithItems extends CategoryPreset {
  presetItems: Array<{
    id: string
    order: number
    category: CategoryWithRules
  }>
}

export interface CreatePresetInput {
  name: string
  description?: string
}

export interface UpdatePresetInput {
  name?: string
  description?: string
}

export interface AddCategoryToPresetInput {
  categoryId: string
}
