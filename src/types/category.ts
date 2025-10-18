import { Rule } from './rule'

export interface Category {
  id: string
  name: string
  description: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface CategoryWithRules extends Category {
  categoryRules: Array<{
    id: string
    order: number
    rule: Rule
  }>
}

export interface CreateCategoryInput {
  name: string
  description?: string
  order?: number
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  order?: number
}
