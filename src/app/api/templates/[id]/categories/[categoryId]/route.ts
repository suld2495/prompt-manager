import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/templates/[id]/categories/[categoryId] - 템플릿에서 카테고리 제거
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; categoryId: string }> }
) {
  const params = await props.params
  try {
    // 해당 templateCategory 찾기
    const templateCategory = await prisma.templateCategory.findFirst({
      where: {
        templateId: params.id,
        categoryId: params.categoryId
      }
    })

    if (!templateCategory) {
      return NextResponse.json(
        { error: '템플릿에 해당 카테고리가 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.templateCategory.delete({
      where: { id: templateCategory.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('카테고리 제거 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 제거할 수 없습니다.' },
      { status: 500 }
    )
  }
}
