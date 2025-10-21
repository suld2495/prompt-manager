import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ReorderRequest {
  categoryId: string
  direction: 'up' | 'down'
}

// PUT /api/templates/[id]/categories/reorder - 카테고리 순서 변경
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body: ReorderRequest = await request.json()

    // 현재 카테고리 찾기
    const current = await prisma.templateCategory.findFirst({
      where: {
        templateId: params.id,
        categoryId: body.categoryId
      }
    })

    if (!current) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 교환할 카테고리 찾기
    const target = await prisma.templateCategory.findFirst({
      where: {
        templateId: params.id,
        order: body.direction === 'up' ? current.order - 1 : current.order + 1
      }
    })

    if (!target) {
      return NextResponse.json(
        { error: '이동할 수 없는 위치입니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 순서 교환
    await prisma.$transaction([
      prisma.templateCategory.update({
        where: { id: current.id },
        data: { order: target.order }
      }),
      prisma.templateCategory.update({
        where: { id: target.id },
        data: { order: current.order }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('순서 변경 실패:', error)
    return NextResponse.json(
      { error: '순서를 변경할 수 없습니다.' },
      { status: 500 }
    )
  }
}
