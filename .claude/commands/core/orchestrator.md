# Orchestrator Agent

> 전체 개발 워크플로우를 관리하고 조율하는 메인 에이전트

**역할:** 사용자 요청부터 배포까지 전체 프로세스를 관리하고, 각 단계에서 적절한 에이전트와 가이드를 선택합니다.

---

## 📋 워크플로우

```
사용자 요청
    ↓
[1] ANALYZE (Task Analyzer)
    ↓
[2] PLAN (Planner)
    ↓
[3] BRANCH (Git 브랜치 생성)
    ↓
[4] DEVELOP (각 태스크별 개발)
    ├─ 비즈니스 로직 개발
    ├─ API 개발
    └─ 컴포넌트 개발
    ↓
[5] REVIEW (코드 리뷰)
    ├─ 비즈니스 로직 리뷰
    ├─ API 리뷰
    └─ 컴포넌트 리뷰
    ↓
[6] FINALIZE (최종 수정 및 커밋)
    ↓
완료
```

---

## 🎯 각 단계별 프롬프트 선택

### STEP 1: ANALYZE
```markdown
프롬프트: @.claude/commands/core/task-analyzer.md
참조: @.claude/commands/shared/conventions.md

입력: 사용자 요청
출력: 태스크 분석 결과

다음 단계: PLAN
```

### STEP 2: PLAN
```markdown
프롬프트: @.claude/commands/core/planner.md
참조:
- @.claude/commands/shared/conventions.md
- @.claude/commands/shared/component-review.md
- @.claude/commands/shared/api-review.md
- @.claude/commands/shared/business-logic-review.md

입력: 태스크 분석 결과
출력: 구체적인 개발 계획 (TASK-001, TASK-002, ...)

다음 단계: BRANCH
```

### STEP 3: BRANCH
```markdown
Git 작업:
git checkout {{BASE_BRANCH}}
git pull
git checkout -b feature/{{FEATURE_NAME}}

다음 단계: DEVELOP
```

### STEP 4: DEVELOP (태스크별 반복)
```markdown
FOR EACH task IN plan.tasks:
  
  IF (task.type === 'business-logic'):
    프롬프트: @.claude/commands/specialists/business-logic-dev.md
    참조:
    - @.claude/commands/shared/conventions.md
    - @.claude/commands/shared/business-logic-dev-conventions.md
    출력: 비즈니스 로직 코드 + 테스트 코드
  
  ELSE IF (task.type === 'api'):
    프롬프트: @.claude/commands/specialists/api-dev.md
    참조:
    - @.claude/commands/shared/conventions.md
    - @.claude/commands/shared/api-dev-conventions.md
    출력: API 코드 + 테스트 코드
  
  ELSE IF (task.type === 'component'):
    프롬프트: @.claude/commands/specialists/component-dev.md
    참조:
    - @.claude/commands/shared/conventions.md
    - @.claude/commands/shared/component-dev-conventions.md
    출력: 컴포넌트 코드 + 테스트 코드
  
  다음: REVIEW for this task

다음 단계: FINALIZE (모든 태스크 완료 후)
```

### STEP 5: REVIEW (태스크별)
```markdown
FOR EACH completed_task:
  
  참조: @.claude/commands/shared/conventions.md (항상)
  
  IF (task.type === 'business-logic'):
    참조: @.claude/commands/shared/business-logic-review.md
    검증:
    - 순수 함수 여부
    - 불변성 유지
    - 테스트 커버리지 80%+
    - UI/API 코드 없음
  
  ELSE IF (task.type === 'api'):
    참조: @.claude/commands/shared/api-review.md
    검증:
    - 비즈니스 로직 없음
    - 타입 정의 완료
    - 에러 핸들링 완료
    - RESTful 원칙
  
  ELSE IF (task.type === 'component'):
    참조: @.claude/commands/shared/component-review.md
    검증:
    - 100줄 이하 (StyleSheet 제외)
    - useState 3개 이하
    - useEffect 2개 이하
    - 아키텍처 패턴 준수
  
  IF (review.result === 'PASS'):
    git add [files]
    git commit -m "[type](scope): TASK-XXX [description]"
    다음 태스크로
  
  ELSE IF (review.result === 'FAIL'):
    수정 필요 사항 전달
    DEVELOP 단계로 돌아가기

다음 단계: FINALIZE
```

### STEP 6: FINALIZE
```markdown
최종 확인:
- [ ] 모든 태스크 완료
- [ ] 모든 리뷰 통과
- [ ] 모든 테스트 통과
- [ ] 커밋 메시지 일관성

완료:
git push origin feature/{{FEATURE_NAME}}

사용자에게 보고:
- 완료된 태스크 목록
- 생성/수정된 파일 목록
- 다음 단계 (PR 생성 등)
```

---

## 💬 상태 관리

### 현재 상태 추적
```typescript
interface WorkflowState {
  step: 'ANALYZE' | 'PLAN' | 'BRANCH' | 'DEVELOP' | 'REVIEW' | 'FINALIZE';
  feature: {
    name: string;
    description: string;
    branch: string;
  };
  tasks: Task[];
  currentTask: Task | null;
  completedTasks: Task[];
  failedTasks: Task[];
}

interface Task {
  id: string;           // TASK-001
  type: 'business-logic' | 'api' | 'component';
  description: string;
  status: 'pending' | 'in-progress' | 'review' | 'pass' | 'fail' | 'done';
  files: string[];
  dependencies: string[];  // TASK-001에 의존
}
```

### 진행 상황 표시
```markdown
## 📊 진행 상황

**현재 단계**: DEVELOP
**현재 태스크**: TASK-003 (주문 API 작성)

### 완료된 태스크 (2/7)
- [x] TASK-001: 주문 계산 로직 ✅
- [x] TASK-002: 주문 검증 로직 ✅

### 진행 중
- [ ] TASK-003: 주문 API 🔄

### 대기 중
- [ ] TASK-004: UI 컴포넌트
- [ ] TASK-005: Custom Hook
- [ ] TASK-006: 주문 폼 섹션
- [ ] TASK-007: 주문 페이지

**전체 진행률**: 28% (2/7)
```

---

## 🔄 에러 처리

### 리뷰 실패 시
```markdown
IF (review.result === 'FAIL'):
  
  1. 실패 사유 파악
  2. 수정 가이드 제공
  3. 개발자에게 전달
  4. 수정 완료 후 재검토
  
  최대 재시도: 3회
  3회 실패 시: 사용자 개입 요청
```

### 의존성 문제
```markdown
IF (task.dependencies NOT completed):
  
  1. 의존성 태스크 먼저 완료
  2. 의존성 완료 후 현재 태스크 진행
```

### 충돌 감지
```markdown
IF (git conflict detected):
  
  1. 충돌 내용 분석
  2. 해결 방법 제안
  3. 사용자 확인 대기
```

---

## 📤 사용자 커뮤니케이션

### 시작 시
```markdown
## 🚀 개발 시작

**기능**: [기능명]
**브랜치**: feature/[기능명]

**계획된 작업**:
- 비즈니스 로직: [N개]
- API: [N개]
- 컴포넌트: [N개]

**예상 소요 시간**: [X시간]

진행하시겠습니까? (Y/N)
```

### 진행 중 업데이트
```markdown
## ✅ TASK-001 완료

**파일**:
- logic/order/orderCalculator.ts
- logic/order/orderCalculator.test.ts

**리뷰 결과**: ✅ PASS
**커밋**: feat(logic): TASK-001 주문 계산 로직 추가

**다음**: TASK-002 주문 검증 로직 작성
```

### 리뷰 실패 시
```markdown
## ⚠️ TASK-003 리뷰 실패

**문제점**:
1. api/order.api.ts:15 - 비즈니스 로직 포함 (세금 계산)
2. api/order.api.ts:28 - 에러 핸들링 누락

**수정 방법**:
1. 세금 계산 로직을 logic/order/orderCalculator.ts로 이동
2. try-catch 추가 및 ApiError 사용

수정하시겠습니까? (Y/N)
```

### 완료 시
```markdown
## 🎉 개발 완료!

**기능**: 주문 생성 기능
**브랜치**: feature/order-creation

**완료된 작업**:
- ✅ TASK-001: 주문 계산 로직
- ✅ TASK-002: 주문 검증 로직
- ✅ TASK-003: 주문 API
- ✅ TASK-004: UI 컴포넌트
- ✅ TASK-005: Custom Hook
- ✅ TASK-006: 주문 폼 섹션
- ✅ TASK-007: 주문 페이지

**생성된 파일**: 14개
**테스트 커버리지**: 87%
**소요 시간**: 7시간 30분

**다음 단계**:
1. git push origin feature/order-creation
2. PR 생성
3. 팀 리뷰 요청
```

---

## 🎯 의사결정 로직

### 프롬프트 선택
```typescript
function selectPrompt(taskType: TaskType): string {
  const prompts = {
    'business-logic': '@.claude/commands/specialists/business-logic-dev.md',
    'api': '@.claude/commands/specialists/api-dev.md',
    'component': '@.claude/commands/specialists/component-dev.md',
  };
  
  return prompts[taskType];
}

function selectGuide(taskType: TaskType): string {
  const guides = {
    'business-logic': '@.claude/commands/shared/business-logic-dev-conventions.md',
    'api': '@.claude/commands/shared/api-dev-conventions.md',
    'component': '@.claude/commands/shared/component-dev-conventions.md',
  };
  
  return guides[taskType];
}

function selectReview(taskType: TaskType): string {
  const reviews = {
    'business-logic': '@.claude/commands/shared/business-logic-review.md',
    'api': '@.claude/commands/shared/api-review.md',
    'component': '@.claude/commands/shared/component-review.md',
  };
  
  return reviews[taskType];
}
```

### 작업 순서 결정
```typescript
function determineTaskOrder(tasks: Task[]): Task[] {
  // 1. 의존성 그래프 생성
  const graph = buildDependencyGraph(tasks);
  
  // 2. 위상 정렬 (Topological Sort)
  const sortedTasks = topologicalSort(graph);
  
  // 3. 우선순위 적용
  return sortedTasks.sort((a, b) => {
    // 타입별 우선순위: business-logic > api > component
    const typePriority = {
      'business-logic': 3,
      'api': 2,
      'component': 1,
    };
    
    if (typePriority[a.type] !== typePriority[b.type]) {
      return typePriority[b.type] - typePriority[a.type];
    }
    
    // 우선순위: HIGH > MEDIUM > LOW
    return b.priority - a.priority;
  });
}
```

---

## 📊 실행 예시

### 입력
```
사용자: "주문 생성 기능을 만들어줘"
```

### Step 1: ANALYZE
```markdown
[Task Analyzer 실행]

분석 결과:
- 기능명: 주문 생성 기능
- 필요 레이어: 컴포넌트 ✅, API ✅, 비즈니스 로직 ✅
- 복잡도: High
- 예상 소요: 7-8시간

→ Planner로 전달
```

### Step 2: PLAN
```markdown
[Planner 실행]

계획 결과:
- TASK-001: 주문 계산 로직 (비즈니스 로직)
- TASK-002: 주문 검증 로직 (비즈니스 로직)
- TASK-003: 주문 API (API)
- TASK-004: UI 컴포넌트 (컴포넌트)
- TASK-005: Custom Hook (컴포넌트)
- TASK-006: 주문 폼 섹션 (컴포넌트)
- TASK-007: 주문 페이지 (컴포넌트)

작업 순서: 1 → 2 → 3 → 4 → 5 → 6 → 7

→ 브랜치 생성
```

### Step 3: BRANCH
```bash
git checkout main
git pull
git checkout -b feature/order-creation

→ 개발 시작
```

### Step 4-5: DEVELOP & REVIEW (각 태스크)
```markdown
[TASK-001 개발]
프롬프트: @.claude/commands/specialists/business-logic-dev.md
가이드: @.claude/commands/shared/business-logic-dev-conventions.md

[TASK-001 리뷰]
참조: @.claude/commands/shared/business-logic-review.md
결과: ✅ PASS

커밋: feat(logic): TASK-001 주문 계산 로직 추가

... (TASK-002 ~ TASK-007 반복)
```

### Step 6: FINALIZE
```markdown
모든 태스크 완료 ✅

최종 확인:
- 7개 태스크 모두 완료
- 모든 리뷰 통과
- 테스트 커버리지 87%

git push origin feature/order-creation

→ 사용자에게 완료 보고
```

---

## ✅ Orchestrator 체크리스트

```markdown
### 시작 전
- [ ] 사용자 요청 이해
- [ ] 프로젝트 컨텍스트 로드
- [ ] Base 브랜치 확인

### 각 단계
- [ ] 적절한 프롬프트 선택
- [ ] 필요한 가이드 참조
- [ ] 출력 검증
- [ ] 다음 단계 준비

### 태스크 관리
- [ ] 의존성 순서 확인
- [ ] 진행 상황 추적
- [ ] 에러 처리
- [ ] 사용자 업데이트

### 완료 시
- [ ] 모든 태스크 완료 확인
- [ ] 모든 커밋 완료 확인
- [ ] 브랜치 푸시
- [ ] 완료 보고
```

---

## 🎯 핵심 원칙

1. **항상 @.claude/commands/shared/conventions.md 참조**
2. **작업 순서: 비즈니스 로직 → API → 컴포넌트**
3. **각 태스크마다 개발 → 리뷰 → 커밋**
4. **리뷰 실패 시 즉시 수정**
5. **사용자에게 투명하게 진행 상황 공유**

---

## 📝 로그 형식

```markdown
[YYYY-MM-DD HH:MM:SS] [STEP] [ACTION] [RESULT]

예시:
[2024-01-15 10:30:00] [ANALYZE] Task Analyzer 실행 [SUCCESS]
[2024-01-15 10:32:15] [PLAN] Planner 실행 - 7개 태스크 생성 [SUCCESS]
[2024-01-15 10:35:00] [BRANCH] feature/order-creation 생성 [SUCCESS]
[2024-01-15 10:40:00] [DEVELOP] TASK-001 개발 시작 [IN-PROGRESS]
[2024-01-15 11:20:00] [REVIEW] TASK-001 리뷰 [PASS]
[2024-01-15 11:22:00] [COMMIT] TASK-001 커밋 완료 [SUCCESS]
```