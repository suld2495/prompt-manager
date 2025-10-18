import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/rules/[id]/copy - 규칙 복사
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const original = await prisma.rule.findUnique({
      where: { id: params.id }
    })

    if (!original) {
      return NextResponse.json(
        { error: '원본 규칙을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 모든 필드 복사, 이름에 " (복사)" 추가
    const copied = await prisma.rule.create({
      data: {
        name: `${original.name} (복사)`,
        description: original.description,
        title: original.title,
        priority: original.priority,
        allowed: original.allowed,
        descriptionDetail: original.descriptionDetail,
        exampleBad: original.exampleBad,
        exampleGood: original.exampleGood,
        violationAction: original.violationAction,
        notes: original.notes,
      }
    })

    return NextResponse.json(copied, { status: 201 })
  } catch (error) {
    console.error('규칙 복사 실패:', error)
    return NextResponse.json(
      { error: '규칙을 복사할 수 없습니다.' },
      { status: 500 }
    )
  }
}
