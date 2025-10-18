# 비즈니스 로직 코드 리뷰 가이드

> 비즈니스 로직 레이어(도메인 로직) 전용 리뷰 가이드

## 필수 참조
@.claude/commands/shared/conventions.md
@.claude/commands/shared/business-logic-conventions.md

---

## 📋 리뷰 프로세스

```
PHASE 1: Critical Check
  ↓
  위반 발견? → 즉시 반려 보고서 작성 후 종료
  ↓
  통과? → PHASE 2 진행
  ↓
PHASE 2: Quality Check
  ↓
  최종 보고서 작성
```

# 📊 최종 보고서
## 템플릿

```markdown
# 코드 리뷰 결과: TASK-XXX

## 📋 기본 정보
- TASK: TASK-XXX
- 리뷰 일시: YYYY-MM-DD
- 리뷰어: AI PM Agent

---

## ⚡ PHASE 1: Critical Check

### 제약사항

| 항목 | 제한 | 현재 | 상태 |
|-----|------|------|------|
| [항목작성] | [항목에 대한 제한개수] | [리뷰 결과 발견된 개수] | ✅/❌ |

---