import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/templates/[id]/copy - 템플릿 복사
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // 원본 템플릿 조회
    const original = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        templateCategories: true
      }
    })

    if (!original) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 새 템플릿 생성 및 카테고리 복사
    const newTemplate = await prisma.template.create({
      data: {
        name: `${original.name} (복사본)`,
        description: original.description,
        templateCategories: {
          create: original.templateCategories.map(tc => ({
            categoryId: tc.categoryId,
            order: tc.order,
            fromPresetId: tc.fromPresetId
          }))
        }
      },
      include: {
        templateCategories: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(newTemplate)
  } catch (error) {
    console.error('템플릿 복사 실패:', error)
    return NextResponse.json(
      { error: '템플릿을 복사할 수 없습니다.' },
      { status: 500 }
    )
  }
}
