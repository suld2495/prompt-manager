import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rules/stats - 규칙별 사용 통계
export async function GET() {
  try {
    const rules = await prisma.rule.findMany({
      include: {
        _count: {
          select: {
            categoryRules: true,
            snapshots: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const stats = rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      title: rule.title,
      priority: rule.priority,
      usedInCategories: rule._count.categoryRules,
      usedInSnapshots: rule._count.snapshots,
      totalUsage: rule._count.categoryRules + rule._count.snapshots,
      createdAt: rule.createdAt,
    }))

    return NextResponse.json(stats)
  } catch (error) {
    console.error('규칙 통계 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙 통계를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
