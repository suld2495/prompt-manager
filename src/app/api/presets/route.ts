import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CreatePresetInput } from '@/types/preset'

// GET /api/presets - 프리셋 목록
export async function GET() {
  try {
    const presets = await prisma.categoryPreset.findMany({
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
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(presets)
  } catch (error) {
    console.error('프리셋 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '프리셋 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/presets - 프리셋 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreatePresetInput = await request.json()

    const preset = await prisma.categoryPreset.create({
      data: {
        name: body.name,
        description: body.description
      }
    })

    return NextResponse.json(preset, { status: 201 })
  } catch (error) {
    console.error('프리셋 생성 실패:', error)
    return NextResponse.json(
      { error: '프리셋을 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
