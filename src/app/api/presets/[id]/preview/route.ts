import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/presets/[id]/preview - 프리셋 미리보기 (모든 규칙 표시)
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const preset = await prisma.categoryPreset.findUnique({
      where: { id: params.id },
      include: {
        presetItems: {
          include: {
            category: {
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
            }
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

    // 총 규칙 수 계산
    const totalRules = preset.presetItems.reduce(
      (sum, item) => sum + item.category.categoryRules.length,
      0
    )

    // 모든 규칙 평탄화
    const allRules = preset.presetItems.flatMap(item =>
      item.category.categoryRules.map(cr => ({
        ...cr.rule,
        categoryName: item.category.name
      }))
    )

    return NextResponse.json({
      preset,
      totalRules,
      allRules
    })
  } catch (error) {
    console.error('프리셋 미리보기 실패:', error)
    return NextResponse.json(
      { error: '프리셋 미리보기를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
