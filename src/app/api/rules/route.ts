import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/rules - 규칙 목록 조회
export async function GET() {
  try {
    const rules = await prisma.rule.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('규칙 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/rules - 규칙 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const rule = await prisma.rule.create({
      data: {
        name: body.name,
        description: body.description,
        title: body.title,
        priority: body.priority,
        allowed: body.allowed,
        descriptionDetail: body.descriptionDetail,
        exampleBad: body.exampleBad,
        exampleGood: body.exampleGood,
        violationAction: body.violationAction,
        notes: body.notes,
      }
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('규칙 생성 실패:', error)
    return NextResponse.json(
      { error: '규칙을 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
