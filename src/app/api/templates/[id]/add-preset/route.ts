import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AddPresetToTemplateInput } from '@/types/template'

// POST /api/templates/[id]/add-preset - 프리셋 전체를 템플릿에 추가
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body: AddPresetToTemplateInput = await request.json()

    // 프리셋의 모든 카테고리 조회
    const preset = await prisma.categoryPreset.findUnique({
      where: { id: body.presetId },
      include: {
        presetItems: {
          include: {
            category: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!preset) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 템플릿의 최대 order 값 구하기
    const maxOrder = await prisma.templateCategory.findFirst({
      where: { templateId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const startOrder = (maxOrder?.order ?? -1) + 1

    // 프리셋의 모든 카테고리를 템플릿에 추가
    const createData = preset.presetItems.map((item, index) => ({
      templateId: params.id,
      categoryId: item.categoryId,
      order: startOrder + index,
      fromPresetId: body.presetId
    }))

    // 중복 체크: 이미 템플릿에 있는 카테고리는 추가하지 않음
    const existingCategories = await prisma.templateCategory.findMany({
      where: {
        templateId: params.id,
        categoryId: { in: preset.presetItems.map(item => item.categoryId) }
      },
      select: { categoryId: true }
    })

    const existingCategoryIds = new Set(existingCategories.map(tc => tc.categoryId))
    const newCategories = createData.filter(
      data => !existingCategoryIds.has(data.categoryId)
    )

    if (newCategories.length === 0) {
      return NextResponse.json(
        { error: '이미 템플릿에 모든 카테고리가 존재합니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 추가
    const result = await prisma.$transaction(
      newCategories.map(data =>
        prisma.templateCategory.create({ data })
      )
    )

    return NextResponse.json({
      success: true,
      added: result.length,
      skipped: createData.length - result.length
    })
  } catch (error) {
    console.error('프리셋 추가 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 추가할 수 없습니다.' },
      { status: 500 }
    )
  }
}
