import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/stats - 카테고리별 사용 통계
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            categoryRules: true,
            presetItems: true,
            templateCategories: true,
            snapshots: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const stats = categories.map((category) => ({
      id: category.id,
      name: category.name,
      rulesCount: category._count.categoryRules,
      usedInPresets: category._count.presetItems,
      usedInTemplates: category._count.templateCategories,
      usedInSnapshots: category._count.snapshots,
      totalUsage:
        category._count.presetItems +
        category._count.templateCategories +
        category._count.snapshots,
      createdAt: category.createdAt,
    }))

    return NextResponse.json(stats)
  } catch (error) {
    console.error('카테고리 통계 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 통계를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
