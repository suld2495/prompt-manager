import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/[id] - 카테고리 상세 조회
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        categoryRules: {
          include: {
            rule: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - 카테고리 수정
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description !== undefined ? body.description : undefined,
        order: body.order !== undefined ? body.order : undefined
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 수정 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 수정할 수 없습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Cascade 삭제로 인해 categoryRules도 자동 삭제됨
    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('카테고리 삭제 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 삭제할 수 없습니다.' },
      { status: 500 }
    )
  }
}
