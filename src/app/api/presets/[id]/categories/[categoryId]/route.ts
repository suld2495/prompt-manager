import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/presets/[id]/categories/[categoryId] - 프리셋에서 카테고리 제거
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; categoryId: string }> }
) {
  const params = await props.params
  try {
    // 해당 presetItem 찾기
    const presetItem = await prisma.categoryPresetItem.findFirst({
      where: {
        presetId: params.id,
        categoryId: params.categoryId
      }
    })

    if (!presetItem) {
      return NextResponse.json(
        { error: '프리셋에 해당 카테고리가 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.categoryPresetItem.delete({
      where: { id: presetItem.id }
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
