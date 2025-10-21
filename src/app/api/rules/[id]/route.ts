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

// PUT /api/rules/[id] - 규칙 수정 (마스터 업데이트 + 스냅샷 변경 감지)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()

    // 트랜잭션으로 규칙 업데이트 + 스냅샷 변경 감지
    const result = await prisma.$transaction(async (tx) => {
      // 규칙 업데이트
      const updatedRule = await tx.rule.update({
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

      // 이 규칙의 모든 스냅샷 찾기
      const snapshots = await tx.ruleSnapshot.findMany({
        where: { baseRuleId: params.id }
      })

      // 각 스냅샷을 체크하여 outdated 플래그 업데이트
      for (const snapshot of snapshots) {
        const snapshotContent = snapshot.snapshotContent as any

        // 내용이 변경되었는지 확인
        const isContentChanged =
          snapshotContent.title !== updatedRule.title ||
          snapshotContent.priority !== updatedRule.priority ||
          snapshotContent.allowed !== updatedRule.allowed ||
          snapshotContent.descriptionDetail !== updatedRule.descriptionDetail ||
          snapshotContent.exampleBad !== updatedRule.exampleBad ||
          snapshotContent.exampleGood !== updatedRule.exampleGood ||
          snapshotContent.violationAction !== updatedRule.violationAction ||
          snapshotContent.notes !== updatedRule.notes

        // 커스텀이 아니고 내용이 변경되었으며 아직 outdated로 표시되지 않았다면
        if (isContentChanged && !snapshot.isOutdated && !snapshot.isCustom) {
          await tx.ruleSnapshot.update({
            where: { id: snapshot.id },
            data: { isOutdated: true }
          })

          // 템플릿의 outdatedCount 증가
          await tx.template.update({
            where: { id: snapshot.templateId },
            data: { outdatedCount: { increment: 1 } }
          })
        }
      }

      return updatedRule
    })

    return NextResponse.json(result)
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
