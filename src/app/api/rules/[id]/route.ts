import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rules/[id] - 규칙 상세 조회
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const rule = await prisma.rule.findUnique({
      where: { id: params.id }
    })

    if (!rule) {
      return NextResponse.json(
        { error: '규칙을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('규칙 조회 실패:', error)
    return NextResponse.json(
      { error: '규칙을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/rules/[id] - 규칙 수정 (마스터 업데이트)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()

    const rule = await prisma.rule.update({
      where: { id: params.id },
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

    return NextResponse.json(rule)
  } catch (error) {
    console.error('규칙 수정 실패:', error)
    return NextResponse.json(
      { error: '규칙을 수정할 수 없습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/rules/[id] - 규칙 삭제
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Phase 2 이후: 카테고리에서 사용 중인지 확인 필요
    // Phase 5 이후: 스냅샷이 있는지 확인 필요

    await prisma.rule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('규칙 삭제 실패:', error)
    return NextResponse.json(
      { error: '규칙을 삭제할 수 없습니다.' },
      { status: 500 }
    )
  }
}
