import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/templates/[id]/generate - MD 파일 생성
export async function POST(
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

    // 트랜잭션으로 MD 생성 + 스냅샷 생성
    const result = await prisma.$transaction(async (tx) => {
      // 스냅샷 생성 (존재하지 않는 것만)
      for (const tc of template.templateCategories) {
        for (const cr of tc.category.categoryRules) {
          const rule = cr.rule

          // 이미 스냅샷이 있는지 확인
          const existing = await tx.ruleSnapshot.findUnique({
            where: {
              templateId_categoryId_baseRuleId: {
                templateId: template.id,
                categoryId: tc.categoryId,
                baseRuleId: rule.id
              }
            }
          })

          // 없으면 생성
          if (!existing) {
            await tx.ruleSnapshot.create({
              data: {
                baseRuleId: rule.id,
                templateId: template.id,
                categoryId: tc.categoryId,
                snapshotContent: {
                  title: rule.title,
                  priority: rule.priority,
                  allowed: rule.allowed,
                  descriptionDetail: rule.descriptionDetail,
                  exampleBad: rule.exampleBad,
                  exampleGood: rule.exampleGood,
                  violationAction: rule.violationAction,
                  notes: rule.notes
                }
              }
            })
          }
        }
      }

      // 템플릿 상태 업데이트
      await tx.template.update({
        where: { id: params.id },
        data: {
          lastGeneratedAt: new Date(),
          hasSnapshots: true
        }
      })

      return { success: true }
    })

    // MD 생성
    const md = generateMarkdown(template)

    return NextResponse.json({
      content: md,
      filename: `${template.name}.md`
    })
  } catch (error) {
    console.error('MD 생성 실패:', error)
    return NextResponse.json(
      { error: 'MD 파일을 생성할 수 없습니다.' },
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
