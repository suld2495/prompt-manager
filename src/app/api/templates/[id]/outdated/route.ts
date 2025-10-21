import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/templates/[id]/outdated - 변경된 스냅샷 목록 조회
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const snapshots = await prisma.ruleSnapshot.findMany({
      where: {
        templateId: params.id,
        isOutdated: true
      },
      include: {
        baseRule: {
          select: {
            id: true,
            name: true,
            title: true,
            priority: true,
            allowed: true,
            descriptionDetail: true,
            exampleBad: true,
            exampleGood: true,
            violationAction: true,
            notes: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 스냅샷 내용과 현재 마스터 규칙 내용을 비교하기 쉽게 포맷팅
    const outdatedList = snapshots.map(snapshot => {
      const snapshotContent = snapshot.snapshotContent as any

      return {
        snapshotId: snapshot.id,
        ruleId: snapshot.baseRuleId,
        ruleName: snapshot.baseRule.name,
        categoryName: snapshot.category.name,
        isCustom: snapshot.isCustom,
        snapshotContent: {
          title: snapshotContent.title,
          priority: snapshotContent.priority,
          allowed: snapshotContent.allowed,
          descriptionDetail: snapshotContent.descriptionDetail,
          exampleBad: snapshotContent.exampleBad,
          exampleGood: snapshotContent.exampleGood,
          violationAction: snapshotContent.violationAction,
          notes: snapshotContent.notes
        },
        currentContent: {
          title: snapshot.baseRule.title,
          priority: snapshot.baseRule.priority,
          allowed: snapshot.baseRule.allowed,
          descriptionDetail: snapshot.baseRule.descriptionDetail,
          exampleBad: snapshot.baseRule.exampleBad,
          exampleGood: snapshot.baseRule.exampleGood,
          violationAction: snapshot.baseRule.violationAction,
          notes: snapshot.baseRule.notes
        }
      }
    })

    return NextResponse.json(outdatedList)
  } catch (error) {
    console.error('변경된 스냅샷 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '변경된 스냅샷 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
