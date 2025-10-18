import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AddCategoryToPresetInput } from '@/types/preset'

// POST /api/presets/[id]/categories - 프리셋에 카테고리 추가
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body: AddCategoryToPresetInput = await request.json()

    // 이미 추가되어 있는지 확인
    const existing = await prisma.categoryPresetItem.findFirst({
      where: {
        presetId: params.id,
        categoryId: body.categoryId
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 추가된 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 현재 최대 order 값 가져오기
    const maxOrder = await prisma.categoryPresetItem.findFirst({
      where: { presetId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const nextOrder = maxOrder ? maxOrder.order + 1 : 0

    // 카테고리 추가
    const presetItem = await prisma.categoryPresetItem.create({
      data: {
        presetId: params.id,
        categoryId: body.categoryId,
        order: nextOrder
      },
      include: {
        category: {
          include: {
            categoryRules: {
              include: {
                rule: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(presetItem, { status: 201 })
  } catch (error) {
    console.error('카테고리 추가 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 추가할 수 없습니다.' },
      { status: 500 }
    )
  }
}
