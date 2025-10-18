import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/[id]/rules - 카테고리의 규칙 목록
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const categoryRules = await prisma.categoryRule.findMany({
      where: {
        categoryId: params.id
      },
      include: {
        rule: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categoryRules)
  } catch (error) {
    console.error('카테고리 규칙 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/categories/[id]/rules - 카테고리에 규칙 추가
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()
    const { ruleId } = body

    // 이미 추가되어 있는지 확인
    const existing = await prisma.categoryRule.findFirst({
      where: {
        categoryId: params.id,
        ruleId: ruleId
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 추가된 규칙입니다.' },
        { status: 400 }
      )
    }

    // 현재 카테고리의 규칙 개수 확인 (순서 결정)
    const count = await prisma.categoryRule.count({
      where: { categoryId: params.id }
    })

    const categoryRule = await prisma.categoryRule.create({
      data: {
        categoryId: params.id,
        ruleId: ruleId,
        order: count
      },
      include: {
        rule: true
      }
    })

    return NextResponse.json(categoryRule, { status: 201 })
  } catch (error) {
    console.error('규칙 추가 실패:', error)
    return NextResponse.json(
      { error: '규칙을 추가할 수 없습니다.' },
      { status: 500 }
    )
  }
}
