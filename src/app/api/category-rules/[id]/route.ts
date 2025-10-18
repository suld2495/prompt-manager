import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/category-rules/[id] - 카테고리에서 규칙 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.categoryRule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('규칙 제거 실패:', error)
    return NextResponse.json(
      { error: '규칙을 제거할 수 없습니다.' },
      { status: 500 }
    )
  }
}
