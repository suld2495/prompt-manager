import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CreateTemplateInput } from '@/types/template'

// GET /api/templates - 템플릿 목록 조회
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        templateCategories: {
          include: {
            category: true
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

    // 각 템플릿의 카테고리 수, 규칙 수 계산
    const templatesWithCounts = await Promise.all(
      templates.map(async (template) => {
        const categoryIds = template.templateCategories.map(tc => tc.categoryId)

        const ruleCounts = await prisma.categoryRule.groupBy({
          by: ['categoryId'],
          where: {
            categoryId: { in: categoryIds }
          },
          _count: true
        })

        const totalRules = ruleCounts.reduce((sum, rc) => sum + rc._count, 0)

        return {
          ...template,
          categoryCount: template.templateCategories.length,
          ruleCount: totalRules
        }
      })
    )

    return NextResponse.json(templatesWithCounts)
  } catch (error) {
    console.error('템플릿 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '템플릿 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/templates - 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateInput = await request.json()

    const template = await prisma.template.create({
      data: {
        name: body.name,
        description: body.description || null
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('템플릿 생성 실패:', error)
    return NextResponse.json(
      { error: '템플릿을 생성할 수 없습니다.' },
      { status: 500 }
    )
  }
}
