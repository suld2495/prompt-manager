import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AddCategoryToTemplateInput } from '@/types/template'

// GET /api/templates/[id]/categories - 템플릿의 카테고리 목록
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const categories = await prisma.templateCategory.findMany({
      where: { templateId: params.id },
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
        },
        preset: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/templates/[id]/categories - 개별 카테고리 추가
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body: AddCategoryToTemplateInput = await request.json()

    // 중복 체크
    const existing = await prisma.templateCategory.findFirst({
      where: {
        templateId: params.id,
        categoryId: body.categoryId
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 템플릿에 추가된 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 현재 최대 order 값 구하기
    const maxOrder = await prisma.templateCategory.findFirst({
      where: { templateId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = (maxOrder?.order ?? -1) + 1

    const templateCategory = await prisma.templateCategory.create({
      data: {
        templateId: params.id,
        categoryId: body.categoryId,
        order: newOrder,
        fromPresetId: null // 개별 추가는 프리셋 없음
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(templateCategory)
  } catch (error) {
    console.error('카테고리 추가 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 추가할 수 없습니다.' },
      { status: 500 }
    )
  }
}
