# 코드 수정 프로토콜 (AI PM 자동 플로우용)

## 🎯 목적
코드 리뷰에서 반려된 코드를 리뷰 결과에 따라 정확히 수정합니다.

---

## 📋 명령: 코드 리뷰 결과 반영

다음 코드를 리뷰 결과에 따라 수정해주세요: $ARGUMENTS

---

## 📥 입력 요구사항

### 필수 입력

1. **원본 코드**
   - 반려된 코드 전체
   - 파일 구조 포함

2. **코드 리뷰 결과**
   - Critical 항목 (필수 수정)
   - Warning 항목 (선택적)
   - 액션 아이템 목록

3. **TASK 원본 명세**
   - TASK 번호
   - 완료 조건
   - 제약사항

---

## 🔄 수정 프로세스

### STEP 1: 리뷰 결과 분석

```markdown
## 리뷰 결과 파싱

### Critical 항목 추출
1. [항목 1] - 우선순위: P0
2. [항목 2] - 우선순위: P0
...

### 수정 전략 수립
- 제약사항 위반 → 파일 분리/함수 분리
- 프로젝트 구조 위반 → 파일 이동
- 매직 넘버 → constants.ts 생성
- 타입/상수 위치 → types/, constants/로 이동
- Zustand 패턴 → persist 적용
- React 안티패턴 → 올바른 패턴으로 교체
- Custom Hooks → 로직 분리
- 불필요한 최적화 → 코드 제거
- 미사용 코드 → 코드 삭제

### 영향 범위 분석
- 수정으로 영향받는 파일: [목록]
- 유지해야 할 기능: [목록]
- 깨지면 안 되는 것: [목록]
```

---

### STEP 2: 우선순위별 수정

#### P0-1: 프로젝트 구조 수정 (Expo React Native)

**app/ 하위 폴더 이동**

```typescript
// ❌ Before (잘못된 구조)
app/
  components/
    button.tsx
  lib/
    utils.ts
  types/
    user.ts

// ✅ After (올바른 구조)
components/
  button.tsx        // app 밖으로
lib/
  utils.ts         // app 밖으로
types/
  user.ts          // app 밖으로

app/
  index.tsx        // 페이지만
```

---

#### P0-2: 타입 및 상수 파일 분리

**Step 1: 타입 추출**

```typescript
// ❌ Before (컴포넌트 내부)
// app/index.tsx 또는 components/form.tsx
type Transaction = {
  id: string;
  amount: number;
};
type PeriodFilter = 'all' | 'thisMonth';

// ✅ After (타입 파일로)
// types/transaction.ts
export type Transaction = {
  id: string;
  amount: number;
};

export type PeriodFilter = 'all' | 'thisMonth' | 'last30Days';
```

**Step 2: 상수 추출**

```typescript
// ❌ Before (파일 상단)
// app/index.tsx
const CATEGORY_ALL_VALUE = '__ALL__';
const PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: 'thisMonth', label: '이번 달' },
];

// ✅ After (상수 파일로)
// constants/filters.ts
export const FILTER_VALUES = {
  CATEGORY_ALL: '__ALL__',
} as const;

export const PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: 'thisMonth', label: '이번 달' },
  { value: 'last30Days', label: '최근 30일' },
] as const;
```

---

#### P0-3: 매직 넘버/스트링 상수화

**Step 1: 매직 넘버/스트링 수집**

```typescript
// 코드에서 발견된 매직 넘버/스트링
발견:
- 숫자: [16, 12, 24, 8, 5000, 3]
- 색상: ['#1f6feb', '#dc2626', '#f6f8fa', '#111827', '#4b5563']
- 폰트: [24, 14, 16, 13, 18]
- 문자열: ['pending', 'success', 'error']
```

**Step 2: 카테고리별 분류**

```typescript
분류:
- 레이아웃: 16, 12, 24, 8 → SPACING
- API: 5000, 3 → API_CONFIG
- 색상: '#1f6feb', ... → COLORS
- 폰트: 24, 14, 16 → TYPOGRAPHY
- 상태: 'pending', ... → STATUS
```

**Step 3: 상수 파일 생성**

```typescript
// ✅ constants/theme.ts
export const SPACING = {
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
} as const;

export const COLORS = {
  PRIMARY: '#1f6feb',
  DANGER: '#dc2626',
  BACKGROUND: '#f6f8fa',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#4b5563',
} as const;

export const TYPOGRAPHY = {
  TITLE: 24,
  SUBTITLE: 16,
  BODY: 14,
  CAPTION: 13,
  AMOUNT: 18,
} as const;

// ✅ constants/config.ts
export const API_CONFIG = {
  TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,
} as const;

export const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;
```

**Step 4: 원본 코드 치환**

```typescript
// ❌ Before
const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 12,
    backgroundColor: '#f6f8fa',
  },
  title: {
    fontSize: 24,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
});

// ✅ After
import { SPACING, COLORS, TYPOGRAPHY } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MD,
    margin: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
  },
});
```

---

#### P0-4: Zustand Persist 적용 (React Native)

```typescript
// ❌ Before (직접 AsyncStorage 사용)
import AsyncStorage from '@react-native-async-storage/async-storage';

const useTransactionStore = create((set) => ({
  transactions: [],
  
  hydrate: async () => {
    const data = await AsyncStorage.getItem('transactions');
    if (data) {
      set({ transactions: JSON.parse(data) });
    }
  },
  
  addTransaction: async (item) => {
    set((state) => {
      const newTransactions = [...state.transactions, item];
      AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
      return { transactions: newTransactions };
    });
  },
}));

// ✅ After (Zustand persist 사용)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useTransactionStore = create(
  persist(
    (set) => ({
      transactions: [],
      
      addTransaction: (item) => 
        set((state) => ({ 
          transactions: [...state.transactions, item] 
        })),
      
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map(t =>
            t.id === id ? { ...t, ...updates } : t
          )
        })),
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

#### P0-5: Custom Hooks 패턴 적용

**Step 1: 페이지에서 로직 추출**

```typescript
// ❌ Before (페이지에 모든 로직)
// app/index.tsx
const IndexPage = () => {
  const store = useTransactionStore();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async (values) => {
    setIsSaving(true);
    await store.addTransaction(values);
    setIsSaving(false);
  };
  
  const handleCategoryChange = (category) => {
    setFilters(prev => ({ ...prev, category }));
  };
  
  return (
    <View>
      <Form onSubmit={handleSubmit} />
      <Filters onChange={handleCategoryChange} />
    </View>
  );
};

// ✅ After (Custom Hooks로 분리)

// hooks/use-transaction-form.ts
export const useTransactionForm = () => {
  const store = useTransactionStore();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async (values) => {
    setIsSaving(true);
    await store.addTransaction(values);
    setIsSaving(false);
  };
  
  return { handleSubmit, isSaving };
};

// hooks/use-transaction-filters.ts
export const useTransactionFilters = () => {
  const [filters, setFilters] = useState({
    category: 'ALL',
    period: 'all',
  });
  
  const handleCategoryChange = (category) => {
    setFilters(prev => ({ ...prev, category }));
  };
  
  const handlePeriodChange = (period) => {
    setFilters(prev => ({ ...prev, period }));
  };
  
  return { filters, handleCategoryChange, handlePeriodChange };
};

// app/index.tsx (레이아웃만)
const IndexPage = () => {
  return (
    <View>
      <TransactionFormSection />
      <TransactionFiltersSection />
      <TransactionListSection />
    </View>
  );
};

// components/transaction-form-section.tsx
const TransactionFormSection = () => {
  const { handleSubmit, isSaving } = useTransactionForm();
  
  return <TransactionFormUI onSubmit={handleSubmit} isLoading={isSaving} />;
};
```

---

#### P0-6: React 안티패턴 제거

**formSeed 패턴 제거**

```typescript
// ❌ Before (key를 이용한 강제 리마운트)
const [formSeed, setFormSeed] = useState(0);

<TransactionForm key={formSeed} />

const handleReset = () => {
  setFormSeed(prev => prev + 1);
};

// ✅ After (명시적 리셋)
// TransactionForm 컴포넌트 내부에 리셋 로직
const TransactionForm = ({ onSuccess }) => {
  const [values, setValues] = useState(initialValues);
  
  const handleSubmit = async () => {
    await save(values);
    setValues(initialValues); // 명시적 리셋
    onSuccess?.();
  };
  
  return <Form values={values} onSubmit={handleSubmit} />;
};
```

**JSX.Element 타입 제거**

```typescript
// ❌ Before
const Component = (): JSX.Element => {
  return <View />;
};

// ✅ After
const Component = () => {
  return <View />;
};
```

---

#### P0-7: 유틸 함수 분리

```typescript
// ❌ Before (Index 하단에)
// app/index.tsx
const getCategoryOptions = (transactions) => { ... };
const getFilteredTransactions = (transactions, filters) => { ... };
const calculateTotals = (transactions) => { ... };
const buildFormInitialValues = (transaction) => { ... };

// ✅ After (lib/utils/로 분리)

// lib/utils/transaction-filters.ts
export const getCategoryOptions = (transactions) => {
  const unique = new Set();
  transactions.forEach(t => unique.add(t.category));
  return Array.from(unique).sort();
};

export const getFilteredTransactions = (transactions, filters) => {
  return transactions.filter(t => {
    if (filters.category !== 'ALL' && t.category !== filters.category) {
      return false;
    }
    // ...
  });
};

// lib/utils/transaction-calculations.ts
export const calculateTotals = (transactions) => {
  return transactions.reduce(
    (acc, t) => {
      if (t.kind === 'income') {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
};

// lib/utils/transaction-mappers.ts
export const buildFormInitialValues = (transaction) => {
  if (!transaction) return null;
  
  return {
    kind: transaction.kind,
    amount: transaction.amount,
    category: transaction.category,
    occurredOn: transaction.occurredOn.slice(0, 10),
    memo: transaction.memo ?? '',
  };
};
```

---

#### P0-8: 제약사항 위반 수정

**컴포넌트 100줄 초과 → 분리**

```typescript
// ❌ Before (300줄)
function Index() {
  // 폼 로직
  // 리스트 로직
  // 필터 로직
  // 요약 로직
  // 300줄
}

// ✅ After (파일 분리)
// app/index.tsx (80줄 - 레이아웃만)
function Index() {
  return (
    <View>
      <TransactionFormSection />
      <TransactionSummarySection />
      <TransactionFiltersSection />
      <TransactionListSection />
    </View>
  );
}

// components/transaction-form-section.tsx (60줄)
// components/transaction-list-section.tsx (50줄)
// components/transaction-summary-section.tsx (40줄)
// components/transaction-filters-section.tsx (50줄)
```

**함수 30줄 초과 → 분리**

```typescript
// ❌ Before (80줄)
function handleSubmit(values) {
  // 검증 로직 20줄
  // API 호출 로직 20줄
  // 상태 업데이트 로직 20줄
  // 에러 처리 로직 20줄
}

// ✅ After (분리)
function validateFormData(values) {
  // 검증 로직만 20줄
}

function submitToAPI(data) {
  // API 호출만 20줄
}

function updateAppState(result) {
  // 상태 업데이트만 20줄
}

function handleSubmit(values) {
  // 오케스트레이션만 25줄
  const validated = validateFormData(values);
  const result = await submitToAPI(validated);
  updateAppState(result);
}
```

---

#### P0-9: 불필요한 최적화 제거

```typescript
// ❌ Before
const memoizedValue = useMemo(() => {
  return simpleCalculation(data);
}, [data]);

const handleClick = useCallback(() => {
  onClick();
}, [onClick]);

// ✅ After (제거)
const value = simpleCalculation(data);

const handleClick = () => {
  onClick();
};
```

---

#### P0-10: 미사용 코드 제거

```typescript
// ❌ Before
import { unused1, unused2 } from 'library'; // 사용 안 함
import { used } from 'another';

function Component() {
  const [unusedState, setUnusedState] = useState(); // 선언만 하고 사용 안 함
  const [usedState, setUsedState] = useState();
  
  function unusedFunction() { } // 호출 안 함
  
  return <div>{usedState}</div>;
}

// ✅ After (제거)
import { used } from 'another';

function Component() {
  const [usedState, setUsedState] = useState();
  
  return <div>{usedState}</div>;
}
```

---

### STEP 3: 자체 검증

```markdown
## 수정 후 자체 체크

### 제약사항 재확인
- [ ] 컴포넌트 100줄 이하: __줄
- [ ] 함수 30줄 이하: 최대 __줄
- [ ] useState 3개 이하: __개
- [ ] useEffect 2개 이하: __개
- [ ] useMemo/useCallback 0개: __개
- [ ] 매직 넘버/스트링 0개: __개

### 프로젝트 구조 재확인
- [ ] app/ 하위 components/ 없음
- [ ] app/ 하위 lib/ 없음
- [ ] app/ 하위 types/ 없음
- [ ] 타입 파일: types/ 위치
- [ ] 상수 파일: constants/ 위치
- [ ] 유틸 함수: lib/utils/ 위치

### Zustand 패턴 재확인 (React Native)
- [ ] AsyncStorage 직접 사용 없음
- [ ] persist 적용 완료

### React 패턴 재확인
- [ ] formSeed 패턴 없음
- [ ] JSX.Element 타입 제거
- [ ] Custom Hooks 패턴 적용

### 기능 유지 확인
- [ ] TASK 완료 조건 여전히 충족
- [ ] 기존 기능 모두 동작
- [ ] 회귀 버그 없음

### 새로운 문제 확인
- [ ] 새로운 제약 위반 없음
- [ ] 새로운 매직 넘버 추가 안 함
- [ ] import 순환 참조 없음
```

---

## 📤 출력 형식

```markdown
# 코드 수정 결과: TASK-XXX

## 📊 수정 요약

### 처리한 Critical 항목
✅ [P0] 프로젝트 구조: app/ 하위 파일들을 올바른 위치로 이동
✅ [P0] 타입 분리: types/transaction.ts 생성
✅ [P0] 상수 분리: constants/theme.ts, constants/filters.ts 생성
✅ [P0] 매직 넘버 15개 → constants.ts로 추출
✅ [P0] Zustand persist 적용
✅ [P0] Custom Hooks 패턴 적용 (3개 훅 생성)
✅ [P0] formSeed 패턴 제거
✅ [P0] 유틸 함수 분리: lib/utils/ 로 이동
✅ [P0] useMemo 3개 → 모두 제거
✅ [P0] 미사용 import 5개 → 삭제

### 생성/수정된 파일 구조
```
components/
  transaction-form-section.tsx       (신규 - 60줄)
  transaction-form-ui.tsx           (신규 - 50줄)
  transaction-list-section.tsx       (신규 - 50줄)
  transaction-summary-section.tsx    (신규 - 40줄)
  transaction-filters-section.tsx    (신규 - 50줄)
  
hooks/
  use-transaction-form.ts           (신규 - 40줄)
  use-transaction-filters.ts        (신규 - 35줄)
  use-transaction-list.ts           (신규 - 30줄)

types/
  transaction.ts                    (신규 - 25줄)

constants/
  theme.ts                          (신규 - 40줄)
  filters.ts                        (신규 - 20줄)
  
lib/utils/
  transaction-filters.ts            (신규 - 45줄)
  transaction-calculations.ts       (신규 - 20줄)
  transaction-mappers.ts            (신규 - 15줄)

stores/
  transaction-store.ts              (수정 - persist 적용)

app/
  index.tsx                         (수정 - 60줄, 레이아웃만)
```

---

## 📝 수정된 코드

### 파일 1: app/index.tsx (60줄 - 레이아웃만)
```typescript
[수정된 전체 코드]
```

### 파일 2: hooks/use-transaction-form.ts (40줄)
```typescript
[새로 생성된 전체 코드]
```

### 파일 3: constants/theme.ts (40줄)
```typescript
[새로 생성된 전체 코드]
```

### 파일 4: types/transaction.ts (25줄)
```typescript
[새로 생성된 전체 코드]
```

[... 나머지 파일들]

---

## ✅ 자체 검증 결과

### 제약사항 준수
| 항목 | 제한 | 수정 전 | 수정 후 | 상태 |
|-----|------|---------|---------|------|
| 컴포넌트 줄 수 | 100줄 | 300줄 | 60줄 | ✅ |
| 함수 최대 줄 수 | 30줄 | 80줄 | 25줄 | ✅ |
| useState | 3개 | 5개 | 2개 | ✅ |
| useEffect | 2개 | 3개 | 1개 | ✅ |
| useMemo | 0개 | 3개 | 0개 | ✅ |
| useCallback | 0개 | 2개 | 0개 | ✅ |
| 매직 넘버 | 0개 | 15개 | 0개 | ✅ |

### 프로젝트 구조 준수
| 항목 | 수정 전 | 수정 후 | 상태 |
|-----|---------|---------|------|
| app/ 하위 components/ | 있음 ❌ | 없음 | ✅ |
| 타입 위치 | app/index.tsx | types/ | ✅ |
| 상수 위치 | 파일 상단 | constants/ | ✅ |
| 유틸 함수 | index.tsx 하단 | lib/utils/ | ✅ |

### Zustand 패턴
| 항목 | 수정 전 | 수정 후 | 상태 |
|-----|---------|---------|------|
| AsyncStorage 직접 사용 | 있음 ❌ | 없음 | ✅ |
| persist 사용 | 없음 ❌ | 적용됨 | ✅ |

### React 패턴
| 항목 | 수정 전 | 수정 후 | 상태 |
|-----|---------|---------|------|
| formSeed 패턴 | 있음 ❌ | 없음 | ✅ |
| JSX.Element 타입 | 있음 ❌ | 제거됨 | ✅ |
| Custom Hooks | 없음 ❌ | 3개 적용 | ✅ |
| 페이지 로직 | 있음 ❌ | 없음 | ✅ |

### 기능 유지 확인
- ✅ TASK 완료 조건 충족
- ✅ 폼 제출 기능 동작
- ✅ 리스트 표시 기능 동작
- ✅ 필터링 기능 동작
- ✅ 요약 표시 기능 동작

### 새로운 문제
- ✅ 없음 - 모든 제약사항 준수
- ✅ 순환 참조 없음
- ✅ 타입 에러 없음
- ✅ import 에러 없음

---

## 🔄 다음 단계

### 권장 액션
1. ✅ 수정 완료 - 코드 리뷰 재실행 (5번 프롬프트)
2. 코드 리뷰 통과 시 → 다음 TASK 진행
3. 코드 리뷰 실패 시 → 6번 프롬프트 재실행

### 참고사항
- 파일 구조 대폭 변경 → import 경로 확인 필요
- constants, types, hooks 폴더 신규 생성 → Git 추가 필요
- persist 적용으로 기존 저장 데이터 마이그레이션 필요 (선택)
- 기존 테스트 코드 있다면 → 업데이트 필요
```

---

## 🎯 수정 원칙

### 1. 최소 수정 원칙
```markdown
✅ 해야 할 것:
- 리뷰에서 지적한 것만 수정
- Critical 항목만 해결

❌ 하지 말아야 할 것:
- 리뷰에서 언급 안 된 "개선"
- 새로운 기능 추가
- 과도한 리팩토링
```

### 2. 기능 유지 원칙
```markdown
✅ 반드시 유지:
- TASK 완료 조건 충족
- 기존 동작 방식
- 사용자 경험

❌ 깨뜨리면 안 됨:
- 기존 기능
- 외부 API 계약
- 컴포넌트 인터페이스 (props)
```

### 3. 단계적 수정 원칙
```markdown
순서:
1. 프로젝트 구조 (파일 이동)
2. 타입/상수 분리
3. 매직 넘버 상수화
4. Zustand persist 적용
5. Custom Hooks 패턴
6. React 안티패턴 제거
7. 제약사항 위반 해결
8. 미사용 코드 제거
9. 자체 검증

각 단계마다:
- 한 번에 하나씩
- 검증하면서 진행
- 문제 생기면 롤백
```

---

## 🚫 주의사항

### 하지 말아야 할 것

```typescript
// ❌ 리뷰에 없는데 "더 좋게" 만들기
// 리뷰: "프로젝트 구조 수정하세요"
// 잘못된 수정: 구조 수정 + 상태관리 라이브러리 도입 + 새로운 패턴

// ✅ 올바른 수정
// 리뷰: "프로젝트 구조 수정하세요"
// 올바른 수정: 프로젝트 구조만 수정
```

```typescript
// ❌ 기존 동작 바꾸기
// Before
function handleSubmit() {
  // 동기 처리
  saveData();
  alert('완료');
}

// 잘못된 수정: 동작 방식 변경
function handleSubmit() {
  // 비동기로 변경 (사용자 경험 바뀜)
  await saveData();
  toast('완료'); // alert에서 toast로 변경
}

// ✅ 올바른 수정: 동작 유지
function handleSubmit() {
  // 동기 유지
  saveData();
  alert('완료');
}
```

---

## 🔄 AI PM 워크플로우 통합

### 자동 수정 루프

```
5번: 코드 리뷰
  ↓
❌ 반려
  ↓
6번: 코드 수정 (이 프롬프트)
  ↓
수정된 코드
  ↓
5번: 코드 리뷰 재실행
  ↓
✅ 통과 → 다음 단계
❌ 반려 → 6번 재실행 (최대 3회)
```

### 재시도 제한

```markdown
MAX_RETRY = 3

FOR i in range(MAX_RETRY):
  6번 프롬프트 실행
  5번 프롬프트 실행
  
  IF (통과):
    BREAK
    
  IF (i == MAX_RETRY - 1):
    "사람 개입 필요" 알림
    상세 로그 제공
```

---

## 📋 체크리스트

### 수정 전
- [ ] 리뷰 결과 확인
- [ ] Critical 항목 파악
- [ ] 수정 전략 수립
- [ ] 영향 범위 분석

### 수정 중
- [ ] P0 항목부터 순차 처리
- [ ] 각 수정마다 검증
- [ ] 기능 동작 확인
- [ ] 새로운 문제 발생 확인

### 수정 후
- [ ] 모든 제약사항 준수
- [ ] 프로젝트 구조 준수
- [ ] TASK 완료 조건 유지
- [ ] 자체 검증 완료
- [ ] 보고서 작성 완료

---

## 💡 수정 패턴 예시

### 패턴 1: 프로젝트 구조 수정

```
Before:
  app/
    components/
    lib/
    types/
  
After:
  app/
    index.tsx (페이지만)
  components/ (app 밖)
  lib/ (app 밖)
  types/ (app 밖)
  hooks/ (신규)
  constants/ (신규)
```

### 패턴 2: 매직 넘버 상수화

```
Before:
  16, 24, 12, '#1f6feb' → 코드 곳곳에 흩어짐

After:
  constants/theme.ts
    SPACING = { SM: 12, MD: 16, LG: 24 }
    COLORS = { PRIMARY: '#1f6feb' }
  
  코드에서 SPACING.MD, COLORS.PRIMARY 사용
```

### 패턴 3: Custom Hooks 패턴

```
Before:
  Page with 비즈니스 로직

After:
  Page (레이아웃만)
  hooks/use-feature.ts (로직)
  components/feature-section.tsx (연결)
  components/feature-ui.tsx (UI)
```

### 패턴 4: Zustand Persist

```
Before:
  AsyncStorage 직접 사용

After:
  persist(
    (set) => ({ ... }),
    {
      name: 'storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
```

---

## ✅ 성공 기준

수정 완료 시:
- ✅ 모든 Critical 항목 해결
- ✅ 제약사항 100% 준수
- ✅ 프로젝트 구조 준수
- ✅ 타입/상수 올바른 위치
- ✅ Zustand persist 사용
- ✅ Custom Hooks 패턴 적용
- ✅ React 안티패턴 제거
- ✅ 기능 유지 (회귀 없음)
- ✅ 새로운 문제 0개
- ✅ 자체 검증 통과

→ 코드 리뷰 재실행 준비 완료!# 코드 수정 프로토콜 (AI PM 자동 플로우용)
`.claude/commands/code-fix.md`

## 🎯 목적
코드 리뷰에서 반려된 코드를 리뷰 결과에 따라 정확히 수정합니다.

---

## 📋 명령: 코드 리뷰 결과 반영

다음 코드를 리뷰 결과에 따라 수정해주세요: $ARGUMENTS

---

## 📥 입력 요구사항

### 필수 입력

1. **원본 코드**
   - 반려된 코드 전체
   - 파일 구조 포함

2. **코드 리뷰 결과**
   - Critical 항목 (필수 수정)
   - Warning 항목 (선택적)
   - 액션 아이템 목록

3. **TASK 원본 명세**
   - TASK 번호
   - 완료 조건
   - 제약사항

---

## 🔄 수정 프로세스

### STEP 1: 리뷰 결과 분석

```markdown
## 리뷰 결과 파싱

### Critical 항목 추출
1. [항목 1] - 우선순위: P0
2. [항목 2] - 우선순위: P0
...

### 수정 전략 수립
- 제약사항 위반 → 파일 분리/함수 분리
- 매직 넘버 → constants.ts 생성
- 불필요한 최적화 → 코드 제거
- 미사용 코드 → 코드 삭제

### 영향 범위 분석
- 수정으로 영향받는 파일: [목록]
- 유지해야 할 기능: [목록]
- 깨지면 안 되는 것: [목록]
```

---

### STEP 2: 우선순위별 수정

#### P0: Critical 항목 (필수)

##### 2.1. 제약사항 위반 수정

**컴포넌트 100줄 초과 → 분리**

```typescript
// ❌ Before (300줄)
function Index() {
  // 폼 로직
  // 리스트 로직
  // 필터 로직
  // 요약 로직
  // 300줄
}

// ✅ After (파일 분리)
// index.tsx (80줄)
function Index() {
  return (
    <View>
      <TransactionForm onSubmit={handleSubmit} />
      <TransactionSummary totals={totals} />
      <TransactionFilters onChange={handleFilterChange} />
      <TransactionList items={filteredItems} />
    </View>
  );
}

// components/transaction-form.tsx (60줄)
function TransactionForm({ onSubmit }) {
  // 폼 로직만
}

// components/transaction-list.tsx (50줄)
function TransactionList({ items }) {
  // 리스트 로직만
}

// components/transaction-summary.tsx (40줄)
function TransactionSummary({ totals }) {
  // 요약 로직만
}

// components/transaction-filters.tsx (50줄)
function TransactionFilters({ onChange }) {
  // 필터 로직만
}
```

**함수 30줄 초과 → 분리**

```typescript
// ❌ Before (80줄)
function handleSubmit(values) {
  // 검증 로직 20줄
  // API 호출 로직 20줄
  // 상태 업데이트 로직 20줄
  // 에러 처리 로직 20줄
}

// ✅ After (분리)
function validateFormData(values) {
  // 검증 로직만 20줄
}

function submitToAPI(data) {
  // API 호출만 20줄
}

function updateAppState(result) {
  // 상태 업데이트만 20줄
}

function handleSubmit(values) {
  // 오케스트레이션만 25줄
  const validated = validateFormData(values);
  const result = await submitToAPI(validated);
  updateAppState(result);
}
```

**useState/useEffect 초과 → 분리**

```typescript
// ❌ Before (5개 useState)
function Component() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  const [state3, setState3] = useState();
  const [state4, setState4] = useState();
  const [state5, setState5] = useState();
  // 너무 많은 책임
}

// ✅ After (Custom Hook으로 분리)
// hooks/use-form-state.ts
function useFormState() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  return { state1, state2, setState1, setState2 };
}

// hooks/use-filter-state.ts
function useFilterState() {
  const [state3, setState3] = useState();
  const [state4, setState4] = useState();
  const [state5, setState5] = useState();
  return { state3, state4, state5, ... };
}

// component.tsx (3개 이하)
function Component() {
  const formState = useFormState();
  const filterState = useFilterState();
  const [localState, setLocalState] = useState();
  // 3개 이하 유지
}
```

---

##### 2.2. 매직 넘버/스트링 상수화

**Step 1: 매직 넘버/스트링 수집**

```typescript
// 코드에서 발견된 매직 넘버/스트링
발견:
- 숫자: [16, 12, 24, 8, 5000, 3]
- 색상: ['#1f6feb', '#dc2626', '#f6f8fa']
- 문자열: ['pending', 'success', 'error']
```

**Step 2: 카테고리별 분류**

```typescript
분류:
- 레이아웃: 16, 12, 24, 8 → SPACING
- API: 5000, 3 → API_CONFIG
- 색상: '#1f6feb', ... → COLORS
- 상태: 'pending', ... → STATUS
```

**Step 3: 상수 파일 생성**

```typescript
// ✅ constants/theme.ts
export const SPACING = {
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
} as const;

export const COLORS = {
  PRIMARY: '#1f6feb',
  DANGER: '#dc2626',
  BACKGROUND: '#f6f8fa',
  BORDER: '#e5e7eb',
} as const;

export const TYPOGRAPHY = {
  TITLE: 24,
  SUBTITLE: 16,
  BODY: 14,
  CAPTION: 13,
} as const;

// ✅ constants/config.ts
export const API_CONFIG = {
  TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,
} as const;

export const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;
```

**Step 4: 원본 코드 치환**

```typescript
// ❌ Before
const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 12,
    backgroundColor: '#f6f8fa',
  },
  title: {
    fontSize: 24,
    color: '#1f6feb',
  },
});

// ✅ After
import { SPACING, COLORS, TYPOGRAPHY } from './constants/theme';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MD,
    margin: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    color: COLORS.PRIMARY,
  },
});
```

---

##### 2.3. 불필요한 최적화 제거

```typescript
// ❌ Before
const memoizedValue = useMemo(() => {
  return simpleCalculation(data);
}, [data]);

const handleClick = useCallback(() => {
  onClick();
}, [onClick]);

// ✅ After (제거)
const value = simpleCalculation(data);

const handleClick = () => {
  onClick();
};
```

---

##### 2.4. 미사용 코드 제거

```typescript
// ❌ Before
import { unused1, unused2 } from 'library'; // 사용 안 함
import { used } from 'another';

function Component() {
  const [unusedState, setUnusedState] = useState(); // 선언만 하고 사용 안 함
  const [usedState, setUsedState] = useState();
  
  function unusedFunction() { } // 호출 안 함
  
  return <div>{usedState}</div>;
}

// ✅ After (제거)
import { used } from 'another';

function Component() {
  const [usedState, setUsedState] = useState();
  
  return <div>{usedState}</div>;
}
```

---

##### 2.5. TASK 범위 초과 제거

```typescript
// ❌ Before (TASK에 없는 기능 추가됨)
interface User {
  id: string;
  name: string;
  avatar?: string;      // TASK에 없음
  preferences?: {       // TASK에 없음
    theme: string;
  };
}

function UserProfile() {
  // 프로필 표시 (TASK에 있음)
  // 아바타 업로드 (TASK에 없음)
  // 테마 설정 (TASK에 없음)
}

// ✅ After (TASK 범위만)
interface User {
  id: string;
  name: string;
}

function UserProfile() {
  // 프로필 표시만
}
```

---

### STEP 3: 자체 검증

```markdown
## 수정 후 자체 체크

### 제약사항 재확인
- [ ] 컴포넌트 100줄 이하: __줄
- [ ] 함수 30줄 이하: 최대 __줄
- [ ] useState 3개 이하: __개
- [ ] useEffect 2개 이하: __개
- [ ] useMemo/useCallback 0개: __개
- [ ] 매직 넘버/스트링 0개: __개

### 기능 유지 확인
- [ ] TASK 완료 조건 여전히 충족
- [ ] 기존 기능 모두 동작
- [ ] 회귀 버그 없음

### 새로운 문제 확인
- [ ] 새로운 제약 위반 없음
- [ ] 새로운 매직 넘버 추가 안 함
- [ ] import 순환 참조 없음
```

---

## 📤 출력 형식

```markdown
# 코드 수정 결과: TASK-XXX

## 📊 수정 요약

### 처리한 Critical 항목
✅ [P0] 컴포넌트 300줄 → 5개 파일로 분리 (각 50-80줄)
✅ [P0] 매직 넘버 15개 → constants.ts로 추출
✅ [P0] useMemo 3개 → 모두 제거
✅ [P0] 미사용 import 5개 → 삭제

### 생성/수정된 파일
```
src/
  components/
    transaction-form.tsx       (신규 - 60줄)
    transaction-list.tsx       (신규 - 50줄)
    transaction-summary.tsx    (신규 - 40줄)
    transaction-filters.tsx    (신규 - 50줄)
  constants/
    theme.ts                   (신규 - 30줄)
    config.ts                  (신규 - 15줄)
  index.tsx                    (수정 - 80줄)
```

---

## 📝 수정된 코드

### 파일 1: index.tsx (80줄)
```typescript
[수정된 전체 코드]
```

### 파일 2: components/transaction-form.tsx (60줄)
```typescript
[새로 생성된 전체 코드]
```

### 파일 3: constants/theme.ts (30줄)
```typescript
[새로 생성된 전체 코드]
```

[... 나머지 파일들]

---

## ✅ 자체 검증 결과

### 제약사항 준수
| 항목 | 제한 | 수정 전 | 수정 후 | 상태 |
|-----|------|---------|---------|------|
| 컴포넌트 줄 수 | 100줄 | 300줄 | 80줄 | ✅ |
| 함수 최대 줄 수 | 30줄 | 80줄 | 25줄 | ✅ |
| useState | 3개 | 5개 | 2개 | ✅ |
| useEffect | 2개 | 3개 | 1개 | ✅ |
| useMemo | 0개 | 3개 | 0개 | ✅ |
| useCallback | 0개 | 2개 | 0개 | ✅ |
| 매직 넘버 | 0개 | 15개 | 0개 | ✅ |

### 기능 유지 확인
- ✅ TASK 완료 조건 충족
- ✅ 폼 제출 기능 동작
- ✅ 리스트 표시 기능 동작
- ✅ 필터링 기능 동작
- ✅ 요약 표시 기능 동작

### 새로운 문제
- ✅ 없음 - 모든 제약사항 준수
- ✅ 순환 참조 없음
- ✅ 타입 에러 없음

---

## 🔄 다음 단계

### 권장 액션
1. ✅ 수정 완료 - 코드 리뷰 재실행 (5번 프롬프트)
2. 코드 리뷰 통과 시 → 다음 TASK 진행
3. 코드 리뷰 실패 시 → 6번 프롬프트 재실행

### 참고사항
- 파일 구조 변경됨 → import 경로 확인 필요
- constants 폴더 신규 생성 → Git 추가 필요
- 기존 테스트 코드 있다면 → 업데이트 필요
```

---

## 🎯 수정 원칙

### 1. 최소 수정 원칙
```markdown
✅ 해야 할 것:
- 리뷰에서 지적한 것만 수정
- 제약사항 위반만 해결

❌ 하지 말아야 할 것:
- 리뷰에서 언급 안 된 "개선"
- 새로운 기능 추가
- 과도한 리팩토링
```

### 2. 기능 유지 원칙
```markdown
✅ 반드시 유지:
- TASK 완료 조건 충족
- 기존 동작 방식
- 사용자 경험

❌ 깨뜨리면 안 됨:
- 기존 기능
- 외부 API 계약
- 컴포넌트 인터페이스 (props)
```

### 3. 단계적 수정 원칙
```markdown
순서:
1. 제약사항 위반 (가장 급함)
2. 매직 넘버 상수화
3. 미사용 코드 제거
4. TASK 범위 초과 제거
5. 자체 검증

각 단계마다:
- 한 번에 하나씩
- 검증하면서 진행
- 문제 생기면 롤백
```

---

## 🚫 주의사항

### 하지 말아야 할 것

```typescript
// ❌ 리뷰에 없는데 "더 좋게" 만들기
// 리뷰: "컴포넌트 분리하세요"
// 잘못된 수정: 컴포넌트 분리 + 상태관리 라이브러리 도입 + 새로운 패턴

// ✅ 올바른 수정
// 리뷰: "컴포넌트 분리하세요"
// 올바른 수정: 컴포넌트만 분리
```

```typescript
// ❌ 기존 동작 바꾸기
// Before
function handleSubmit() {
  // 동기 처리
  saveData();
  alert('완료');
}

// 잘못된 수정: 동작 방식 변경
function handleSubmit() {
  // 비동기로 변경 (사용자 경험 바뀜)
  await saveData();
  toast('완료'); // alert에서 toast로 변경
}

// ✅ 올바른 수정: 동작 유지
function handleSubmit() {
  // 동기 유지
  saveData();
  alert('완료');
}
```

---

## 🔄 AI PM 워크플로우 통합

### 자동 수정 루프

```
5번: 코드 리뷰
  ↓
❌ 반려
  ↓
6번: 코드 수정 (이 프롬프트)
  ↓
수정된 코드
  ↓
5번: 코드 리뷰 재실행
  ↓
✅ 통과 → 다음 단계
❌ 반려 → 6번 재실행 (최대 3회)
```

### 재시도 제한

```markdown
MAX_RETRY = 3

FOR i in range(MAX_RETRY):
  6번 프롬프트 실행
  5번 프롬프트 실행
  
  IF (통과):
    BREAK
    
  IF (i == MAX_RETRY - 1):
    "사람 개입 필요" 알림
    상세 로그 제공
```

---

## 📋 체크리스트

### 수정 전
- [ ] 리뷰 결과 확인
- [ ] Critical 항목 파악
- [ ] 수정 전략 수립
- [ ] 영향 범위 분석

### 수정 중
- [ ] P0 항목부터 순차 처리
- [ ] 각 수정마다 검증
- [ ] 기능 동작 확인
- [ ] 새로운 문제 발생 확인

### 수정 후
- [ ] 모든 제약사항 준수
- [ ] TASK 완료 조건 유지
- [ ] 자체 검증 완료
- [ ] 보고서 작성 완료

---

## 💡 수정 패턴 예시

### 패턴 1: 큰 컴포넌트 분리

```
Before:
  index.tsx (300줄)

After:
  index.tsx (80줄) - 오케스트레이션
  components/
    form.tsx (60줄)
    list.tsx (50줄)
    summary.tsx (40줄)
    filters.tsx (50줄)
```

### 패턴 2: 매직 넘버 상수화

```
Before:
  16, 24, 12 → 코드 곳곳에 흩어짐

After:
  constants/theme.ts
    SPACING = { SM: 12, MD: 16, LG: 24 }
  
  코드에서 SPACING.MD 사용
```

### 패턴 3: useState 초과 → Custom Hook

```
Before:
  Component with 5 useState

After:
  Component with 2 useState
  hooks/use-form-state.ts (3 useState)
```

---

## ✅ 성공 기준

수정 완료 시:
- ✅ 모든 Critical 항목 해결
- ✅ 제약사항 100% 준수
- ✅ 기능 유지 (회귀 없음)
- ✅ 새로운 문제 0개
- ✅ 자체 검증 통과

→ 코드 리뷰 재실행 준비 완료!