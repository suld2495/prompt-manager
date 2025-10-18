import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - 카테고리 목록 조회
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        categoryRules: {
          include: {
            rule: true
          },
          orderBy: {
            order: 'asc'
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

// POST /api/categories - 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 현재 카테고리 개수 확인 (순서 결정)
    const count = await prisma.category.count()

    const category = await prisma.category.create({
      data: {
        name: body.name,
        description: body.description || null,
        order: body.order !== undefined ? body.order : count
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 실패:', error)
    return NextResponse.json(
      { error: '카테고리를 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
