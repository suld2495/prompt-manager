import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { UpdateTemplateInput } from '@/types/template'

// GET /api/templates/[id] - 템플릿 상세 조회
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        templateCategories: {
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
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // templateCategories 데이터 변환
    const templateWithDetails = {
      ...template,
      templateCategories: template.templateCategories.map(tc => ({
        ...tc,
        presetName: tc.preset?.name
      }))
    }

    return NextResponse.json(templateWithDetails)
  } catch (error) {
    console.error('템플릿 조회 실패:', error)
    return NextResponse.json(
      { error: '템플릿을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id] - 템플릿 수정
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body: UpdateTemplateInput = await request.json()

    const template = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description })
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('템플릿 수정 실패:', error)
    return NextResponse.json(
      { error: '템플릿을 수정할 수 없습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    await prisma.template.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('템플릿 삭제 실패:', error)
    return NextResponse.json(
      { error: '템플릿을 삭제할 수 없습니다.' },
      { status: 500 }
    )
  }
}
