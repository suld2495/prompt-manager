import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/snapshots/[id] - 스냅샷 업데이트/유지/커스텀
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()
    const { action, customContent } = body

    if (!['update', 'keep', 'customize'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be update, keep, or customize' },
        { status: 400 }
      )
    }

    // 스냅샷 조회 (템플릿 ID 필요)
    const snapshot = await prisma.ruleSnapshot.findUnique({
      where: { id: params.id },
      include: {
        baseRule: true
      }
    })

    if (!snapshot) {
      return NextResponse.json(
        { error: '스냅샷을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 트랜잭션으로 스냅샷 + 템플릿 outdatedCount 업데이트
    const result = await prisma.$transaction(async (tx) => {
      let updatedSnapshot

      if (action === 'update') {
        // 마스터 규칙 내용으로 스냅샷 업데이트
        updatedSnapshot = await tx.ruleSnapshot.update({
          where: { id: params.id },
          data: {
            snapshotContent: {
              title: snapshot.baseRule.title,
              priority: snapshot.baseRule.priority,
              allowed: snapshot.baseRule.allowed,
              descriptionDetail: snapshot.baseRule.descriptionDetail,
              exampleBad: snapshot.baseRule.exampleBad,
              exampleGood: snapshot.baseRule.exampleGood,
              violationAction: snapshot.baseRule.violationAction,
              notes: snapshot.baseRule.notes
            },
            isOutdated: false,
            isCustom: false
          }
        })
      } else if (action === 'keep') {
        // 현재 스냅샷 유지 (outdated 플래그만 해제)
        updatedSnapshot = await tx.ruleSnapshot.update({
          where: { id: params.id },
          data: {
            isOutdated: false
          }
        })
      } else if (action === 'customize') {
        // 사용자 커스텀 내용으로 업데이트
        if (!customContent) {
          throw new Error('customContent is required for customize action')
        }

        updatedSnapshot = await tx.ruleSnapshot.update({
          where: { id: params.id },
          data: {
            snapshotContent: customContent,
            isOutdated: false,
            isCustom: true
          }
        })
      }

      // 템플릿의 outdatedCount 감소 (이 스냅샷이 outdated였다면)
      if (snapshot.isOutdated) {
        await tx.template.update({
          where: { id: snapshot.templateId },
          data: {
            outdatedCount: {
              decrement: 1
            }
          }
        })
      }

      return updatedSnapshot
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('스냅샷 업데이트 실패:', error)
    return NextResponse.json(
      { error: '스냅샷을 업데이트할 수 없습니다.' },
      { status: 500 }
    )
  }
}
