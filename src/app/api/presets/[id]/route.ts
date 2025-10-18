import { use } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { UpdatePresetInput } from '@/types/preset'

// GET /api/presets/[id] - 프리셋 상세
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

    return NextResponse.json(preset)
  } catch (error) {
    console.error('프리셋 조회 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/presets/[id] - 프리셋 수정
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body: UpdatePresetInput = await request.json()

    const preset = await prisma.categoryPreset.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description
      }
    })

    return NextResponse.json(preset)
  } catch (error) {
    console.error('프리셋 수정 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 수정할 수 없습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/presets/[id] - 프리셋 삭제
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try{
    await prisma.categoryPreset.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('프리셋 삭제 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 삭제할 수 없습니다.' },
      { status: 500 }
    )
  }
}
