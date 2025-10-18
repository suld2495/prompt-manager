import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/categories/[id]/rules/reorder - 규칙 순서 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { categoryRuleIds } = body

    if (!Array.isArray(categoryRuleIds)) {
      return NextResponse.json(
        { error: 'categoryRuleIds는 배열이어야 합니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      categoryRuleIds.map((id, index) =>
        prisma.categoryRule.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('규칙 순서 변경 실패:', error)
    return NextResponse.json(
      { error: '규칙 순서를 변경할 수 없습니다.' },
      { status: 500 }
    )
  }
}
