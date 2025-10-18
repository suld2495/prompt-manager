import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/categories/[id]/copy - 카테고리 복사
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // 원본 카테고리 조회
    const original = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        categoryRules: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!original) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 카테고리 개수 확인 (순서 결정)
    const count = await prisma.category.count()

    // 새 카테고리 생성
    const copied = await prisma.category.create({
      data: {
        name: `${original.name} (복사)`,
        description: original.description,
        order: count,
        categoryRules: {
          create: original.categoryRules.map((cr, index) => ({
            ruleId: cr.ruleId,
            order: index
          }))
        }
      },
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

    return NextResponse.json(copied, { status: 201 })
  } catch (error) {
    console.error('카테고리 복사 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 복사할 수 없습니다.' },
      { status: 500 }
    )
  }
}
