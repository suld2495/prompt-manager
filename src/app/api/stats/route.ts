import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats - 전체 통계 조회
export async function GET() {
  try {
    const [
      rulesCount,
      categoriesCount,
      presetsCount,
      templatesCount,
      categoryRulesCount,
      presetItemsCount,
      templateCategoriesCount,
      snapshotsCount,
    ] = await Promise.all([
      prisma.rule.count(),
      prisma.category.count(),
      prisma.categoryPreset.count(),
      prisma.template.count(),
      prisma.categoryRule.count(),
      prisma.categoryPresetItem.count(),
      prisma.templateCategory.count(),
      prisma.ruleSnapshot.count(),
    ])

    return NextResponse.json({
      rules: rulesCount,
      categories: categoriesCount,
      presets: presetsCount,
      templates: templatesCount,
      categoryRules: categoryRulesCount,
      presetItems: presetItemsCount,
      templateCategories: templateCategoriesCount,
      snapshots: snapshotsCount,
    })
  } catch (error) {
    console.error('통계 조회 실패:', error)
    return NextResponse.json(
      { error: '통계를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
