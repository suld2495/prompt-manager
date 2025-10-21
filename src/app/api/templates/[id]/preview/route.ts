import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/templates/[id]/preview - MD 미리보기
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

    // MD 생성 (저장하지 않고 미리보기만)
    const md = generateMarkdown(template)

    return NextResponse.json({
      content: md,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        categoryCount: template.templateCategories.length,
        ruleCount: template.templateCategories.reduce(
          (sum, tc) => sum + tc.category.categoryRules.length,
          0
        )
      }
    })
  } catch (error) {
    console.error('MD 미리보기 실패:', error)
    return NextResponse.json(
      { error: 'MD 미리보기를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

function generateMarkdown(template: any): string {
  let md = `# ${template.name}\n\n`

  if (template.description) {
    md += `${template.description}\n\n`
  }

  md += `---\n\n`

  // 카테고리별로 규칙 포맷팅
  for (const tc of template.templateCategories) {
    const category = tc.category

    md += `## ${category.name}\n\n`

    if (category.description) {
      md += `${category.description}\n\n`
    }

    // 카테고리의 규칙들
    for (const cr of category.categoryRules) {
      const rule = cr.rule

      // 우선순위 아이콘
      const priorityIcon = {
        critical: '🔴',
        warning: '🟡',
        info: '🔵'
      }[rule.priority]

      // 허용/비허용
      const allowedText = rule.allowed ? '✅ 허용' : '❌ 비허용'

      md += `### ${priorityIcon} ${rule.title}\n\n`
      md += `**${allowedText}**\n\n`

      if (rule.descriptionDetail) {
        md += `${rule.descriptionDetail}\n\n`
      }

      if (rule.exampleBad) {
        md += `❌ **잘못된 예시:**\n\n`
        md += `\`\`\`\n${rule.exampleBad}\n\`\`\`\n\n`
      }

      if (rule.exampleGood) {
        md += `✅ **올바른 예시:**\n\n`
        md += `\`\`\`\n${rule.exampleGood}\n\`\`\`\n\n`
      }

      if (rule.violationAction) {
        md += `**위반 시:** ${rule.violationAction}\n\n`
      }

      if (rule.notes) {
        md += `📝 **참고:** ${rule.notes}\n\n`
      }

      md += `---\n\n`
    }
  }

  return md
}
