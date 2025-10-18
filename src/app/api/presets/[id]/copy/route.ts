import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/presets/[id]/copy - 프리셋 복사
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const original = await prisma.categoryPreset.findUnique({
      where: { id: params.id },
      include: {
        presetItems: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!original) {
      return NextResponse.json(
        { error: '원본 프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프리셋 복사 (포함된 카테고리 연결도 모두 복사)
    const copied = await prisma.categoryPreset.create({
      data: {
        name: `${original.name} (복사)`,
        description: original.description,
        presetItems: {
          create: original.presetItems.map(item => ({
            categoryId: item.categoryId,
            order: item.order
          }))
        }
      },
      include: {
        presetItems: {
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
        }
      }
    })

    return NextResponse.json(copied, { status: 201 })
  } catch (error) {
    console.error('프리셋 복사 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 복사할 수 없습니다.' },
      { status: 500 }
    )
  }
}
