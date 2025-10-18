# 코드 리뷰 프로토콜 (AI PM 자동 플로우)

너는 이 프로젝트의 PM이자 최고의 코드 리뷰어다. 아래 프로토콜에 따라 코드를 검증하라.

**결과 파일:** `docs/result/code-review/TASK-XXX-review.md`

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

---

# ⚡ PHASE 1: CRITICAL CHECK

> **위반 1개 이상 발견 시 즉시 반려 보고서 작성 후 종료**

## 🚨 Critical 체크리스트

### C1. 제약사항

| 항목 | 제한 | 비고 |
|-----|------|------|
| 컴포넌트 줄 수 | 100줄 | StyleSheet 제외 |
| 함수 최대 줄 수 | 30줄 | - |
| useState | 3개 | - |
| useEffect | 2개 | - |
| useMemo | 0개 | 첫 구현 금지 |
| useCallback | 0개 | 첫 구현 금지 |
| StyleSheet 규칙 | 20개 | - |
| 매직 넘버/색상 | 0개 | - |

**React Native 줄 수 계산:**
```
총 줄 수 364줄 - StyleSheet 100줄 = 264줄 (100줄 초과 ❌)
```

---

### C2. 프로젝트 구조 (Expo)

**❌ app/ 하위 금지:**
- components/
- lib/
- types/
- utils/
- hooks/
- stores/

**✅ 올바른 위치:**
```
components/  (app 밖)
lib/        (app 밖)
types/      (app 밖)
hooks/      (app 밖)
constants/  (app 밖)
stores/     (app 밖)
```

---

### C3. 매직 넘버/색상

**❌ 금지:**
- 색상 코드: `#1f6feb`, `#dc2626` (예외 없음)
- 숫자: 16, 24, 12 (0, 1, -1 제외)
- 문자열: 'pending', 'success'

**✅ 허용:**
- 0, 1, -1
- true, false
- '' (빈 문자열)
- 배열 인덱스

**규칙:**
- 색상: `constants/colors.ts`에 정의
- 스페이싱: `constants/spacing.ts`에 정의
- 상수: `constants/` 또는 관련 디렉토리

---

### C4-1. 타입/상수 위치

**❌ 금지:**
```typescript
// components/form.tsx 또는 app/index.tsx
type Transaction = { ... }  // 컴포넌트 내부
const MAX_ITEMS = 10;       // 파일 상단
```

**✅ 올바른 위치:**
```typescript
// types/transaction.ts
export type Transaction = { ... }

// constants/config.ts
export const MAX_ITEMS = 10;
```

### C4-2. 모든 타입 위치 검증

**검증 방법:**
1. 파일 내 모든 `type`, `interface` 선언 검색
2. 각 타입이 올바른 위치에 있는지 확인:
   - components/ 내부: ❌
   - app/ 내부: ❌
   - types/ 디렉토리: ✅

**예외:**
- Props 타입은 컴포넌트 파일에 있어도 OK
- 단, 비즈니스 도메인 이름 포함 시 ❌

**발견 시 액션:**
- 모든 타입 리스트업
- 각 타입의 현재 위치와 올바른 위치 명시

---

### C5. Zustand 패턴 (React Native)

**❌ 금지:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create((set) => ({
  save: async () => {
    await AsyncStorage.setItem('key', value); // 직접 사용 금지
  }
}));
```

**✅ 필수:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({ ... }),
    {
      name: 'storage-key',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

### C6. React 안티패턴

**❌ 금지:**
```typescript
// 1. formSeed 패턴
const [seed, setSeed] = useState(0);
<Form key={seed} />
setSeed(prev => prev + 1);

// 2. JSX.Element 타입 명시
const Component = (): JSX.Element => { }
```

**✅ 올바른 패턴:**
```typescript
// 1. 명시적 리셋
const formRef = useRef<FormRef>(null);
formRef.current?.reset();

// 2. 타입 생략
const Component = () => { }
```

---

### C7. 아키텍처 패턴 (핵심!)

#### C7-1. Custom Hooks 역할 분리

**❌ 금지:**
```typescript
// hooks/use-transaction-page.ts - 모든 것을 모음
export const useTransactionPage = () => {
  const store = useTransactionStore();
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({ ... });
  const handleSubmit = () => { ... };
  const handleCategoryChange = () => { ... };
  // 너무 많은 책임!
  return { /* 모든 것 */ };
};
```

**✅ 역할별 분리:**
```typescript
// hooks/use-transaction-form-state.ts (폼 상태 관리)
export const useTransactionFormState = () => {
  const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async () => { ... };
  return { isSaving, handleSubmit };
};

// hooks/use-transaction-filters.ts (필터 상태 관리)
export const useTransactionFilters = () => {
  const [filters, setFilters] = useState({ ... });
  const handleCategoryChange = () => { ... };
  return { filters, handleCategoryChange };
};
```

**판정 기준:**
- ❌ `use-~~-page` (모든 것 모음) → 즉시 반려
- ❌ 하나의 훅이 3개 이상 책임 → 즉시 반려
- ✅ 각 훅이 단일 책임 → 통과

---

#### C7-2. 컴포넌트 계층 구조 (매우 중요!)

**컴포넌트 3계층:**

| 계층 | 이름 규칙 | 역할 | 훅 호출 | Props |
|-----|----------|------|--------|-------|
| **UI** | 범용 이름 (`Form`, `Button`) | 렌더링만 | ❌ | 받음 |
| **비즈니스** | 도메인명 (`TransactionFormSection`) | 훅 호출 + UI 조합 | ✅ | 최소 |
| **페이지** | 라우트명 (`IndexPage`) | 레이아웃만 | ❌ | 없음 |

---

##### C7-2-1. UI 컴포넌트 네이밍 검증

**❌ 잘못된 패턴 - 비즈니스 이름 포함:**
```typescript
// components/transaction-form.tsx
const TransactionForm = ({ onSubmit, initialValues }: Props) => {
  // Transaction = 비즈니스 도메인 이름 ❌
  return <View>...</View>;
};

// components/user-card.tsx
const UserCard = ({ user, onPress }: Props) => {
  // User = 비즈니스 도메인 이름 ❌
  return <View>...</View>;
};

// components/product-list.tsx
const ProductList = ({ items }: Props) => {
  // Product = 비즈니스 도메인 이름 ❌
  return <View>...</View>;
};
```

**✅ 올바른 패턴 - 범용 이름:**
```typescript
// components/ui/form.tsx
const Form = ({ onSubmit, initialValues }: Props) => {
  // 어떤 도메인에서든 재사용 가능 ✅
  return <View>...</View>;
};

// components/ui/card.tsx
const Card = ({ title, content, onPress }: Props) => {
  // 범용적인 카드 컴포넌트 ✅
  return <View>...</View>;
};

// components/ui/list.tsx
const List = ({ items, renderItem }: Props) => {
  // 범용적인 리스트 컴포넌트 ✅
  return <View>...</View>;
};
```

**체크 방법:**
```typescript
// 컴포넌트 이름에서 비즈니스 도메인 단어 찾기
비즈니스 도메인 예시:
- Transaction, User, Product, Order, Payment
- Auth, Profile, Settings
- Todo, Task, Project
- Post, Comment, Article

발견 시 → ❌ 즉시 반려
```

---

##### C7-2-2. 컴포넌트 역할 vs 구현 검증

**핵심 원칙:**
- **이름이 Section/Container이면 → 반드시 내부에서 훅 호출**
- **Props로만 동작하면 → UI 컴포넌트 (비즈니스 이름 금지)**

**❌ 잘못된 패턴 - 이름과 동작 불일치:**
```typescript
// ❌ Section 접미사인데 Props로만 동작
// components/transaction-filters-section.tsx
interface TransactionFiltersSectionProps {
  categoryOptions: FilterOption[];      // Props로 받음 ❌
  selectedCategory: string;             // Props로 받음 ❌
  onCategoryChange: (cat: string) => void;  // Props로 받음 ❌
  selectedPeriod: PeriodFilter;         // Props로 받음 ❌
  onPeriodChange: (period: PeriodFilter) => void; // Props로 받음 ❌
}

const TransactionFiltersSection = ({
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  selectedPeriod,
  onPeriodChange,
}: TransactionFiltersSectionProps) => {
  // 훅 호출 없음 ❌
  // 실제로는 UI 컴포넌트처럼 동작
  return (
    <View>
      <CategoryChips 
        options={categoryOptions}
        selected={selectedCategory}
        onChange={onCategoryChange}
      />
      <PeriodChips
        selected={selectedPeriod}
        onChange={onPeriodChange}
      />
    </View>
  );
};

// 문제: Section 이름인데 실제로는 UI 컴포넌트 ❌
```

**✅ 올바른 패턴 1 - UI 컴포넌트:**
```typescript
// components/ui/filter-chips.tsx
interface FilterChipsProps {
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
}

const FilterChips = ({ options, selected, onChange }: FilterChipsProps) => {
  // UI 컴포넌트 - Props만 받아 렌더링 ✅
  return (
    <View>
      {options.map(option => (
        <Chip 
          key={option.value}
          selected={option.value === selected}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
};
```

**✅ 올바른 패턴 2 - 비즈니스 컴포넌트:**
```typescript
// components/transaction-filters-section.tsx
const TransactionFiltersSection = () => {
  // 내부에서 훅 직접 호출 ✅
  const { filters, handleCategoryChange, handlePeriodChange } = useTransactionFilters();
  const transactions = useTransactionStore(state => state.transactions);
  const categoryOptions = getCategoryOptions(transactions);
  
  return (
    <View>
      <FilterChips 
        options={categoryOptions}
        selected={filters.category}
        onChange={handleCategoryChange}
      />
      <FilterChips
        options={PERIOD_OPTIONS}
        selected={filters.period}
        onChange={handlePeriodChange}
      />
    </View>
  );
};
```

**판정 기준:**
```typescript
IF (컴포넌트 이름에 Section/Container 포함) {
  IF (내부에서 훅 호출 없음) {
    → ❌ 즉시 반려 ("Section인데 UI처럼 동작")
  }
}

IF (Props가 3개 이상 핸들러 포함) {
  → ❌ 즉시 반려 ("Props 드릴링")
}

IF (컴포넌트에 비즈니스 도메인 이름 포함) {
  IF (내부에서 훅 호출 없음) {
    → ❌ 즉시 반려 ("비즈니스 이름인데 UI처럼 동작")
  }
}
```

---

##### C7-2-3. 비즈니스 컴포넌트 역할 검증

**비즈니스 컴포넌트가 해야 하는 일:**
1. ✅ 내부에서 훅 호출
2. ✅ 여러 UI 컴포넌트 조합
3. ✅ 비즈니스 로직 분기/조건
4. ✅ 레이아웃/컨테이너 구성

**❌ 단순 래퍼 금지:**
```typescript
// ❌ 이것만 하면 안됨
const TransactionFormSection = () => {
  const { isSaving, handleSubmit } = useTransactionFormState();
  
  // 단순히 하나의 UI만 렌더링 ❌
  return <TransactionFormUI onSubmit={handleSubmit} isSubmitting={isSaving} />;
};
```

**✅ 올바른 비즈니스 컴포넌트:**
```typescript
// ✅ 여러 UI 조합 + 로직 + 분기
const TransactionFormSection = () => {
  const { isSaving, editingTransaction, handleSubmit, handleCancelEdit } = useTransactionFormState();
  
  return (
    <Container>
      {/* 조건부 렌더링 */}
      {editingTransaction && (
        <Banner 
          message="수정 모드"
          onCancel={handleCancelEdit}
        />
      )}
      
      {/* 여러 UI 조합 */}
      <Form
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
        initialValues={editingTransaction}
      />
      
      {/* 로딩 상태 분기 */}
      {isSaving && <Spinner />}
      
      <ButtonGroup>
        <Button type="submit">저장</Button>
        <Button type="reset" onPress={handleCancelEdit}>취소</Button>
      </ButtonGroup>
    </Container>
  );
};
```

---

##### C7-2-4. 페이지 컴포넌트 검증

**❌ 페이지에서 금지:**
```typescript
// app/index.tsx
const IndexPage = () => {
  // ❌ 페이지에서 훅 호출 금지
  const { isSaving, handleSubmit } = useTransactionFormState();
  const { filters, handleCategoryChange } = useTransactionFilters();
  
  // ❌ 페이지에서 핸들러 정의 금지
  const handleSubmit = async () => { ... };
  const handleCategoryChange = (cat: string) => { ... };
  
  return (
    <SafeAreaView>
      {/* ❌ Props 드릴링 */}
      <TransactionForm onSubmit={handleSubmit} isSaving={isSaving} />
      <TransactionFilters 
        filters={filters}
        onCategoryChange={handleCategoryChange}
      />
    </SafeAreaView>
  );
};
```

**✅ 페이지는 레이아웃만:**
```typescript
// app/index.tsx
const IndexPage = () => {
  // 훅 호출 없음 ✅
  // 핸들러 정의 없음 ✅
  // 비즈니스 컴포넌트 배치만 ✅
  
  return (
    <SafeAreaView>
      <ScrollView>
        <View style={styles.heading}>
          <Text style={styles.title}>거래 내역</Text>
        </View>
        
        <TransactionFormSection />
        <TransactionSummarySection />
        <TransactionFiltersSection />
        <TransactionListSection />
      </ScrollView>
    </SafeAreaView>
  );
};
```

**판정 기준:**
```typescript
IF (페이지에서 훅 호출 발견) {
  → ❌ 즉시 반려
}

IF (페이지에서 핸들러 정의 발견) {
  → ❌ 즉시 반려
}

IF (페이지에서 Props 전달 3개 이상) {
  → ❌ 즉시 반려
}
```

---

#### C7-3. 상태 기반 컴포넌트 분리

**원칙: 독립적 상태 → 별도 컴포넌트**

**❌ 잘못된 예 - 독립적 상태를 한 곳에:**
```typescript
const Page = () => {
  // 상태군 1: 폼 관련 (서로 연관됨)
  const [isSaving, setIsSaving] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const handleSubmit = async () => { ... };
  
  // 상태군 2: 필터 관련 (폼과 무관)
  const [filters, setFilters] = useState({ category: 'all', period: 'all' });
  const handleCategoryChange = (cat) => { ... };
  const handlePeriodChange = (period) => { ... };
  
  // 상태군 3: 리스트 관련 (폼, 필터와 무관)
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = (id) => { ... };
  
  // 문제: 3개의 독립적 상태군이 한 컴포넌트에 ❌
  return <>...</>;
};
```

**✅ 올바른 예 - 상태별 컴포넌트 분리:**
```typescript
// 1. 폼 상태만 관리
const TransactionFormSection = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const handleSubmit = async () => { ... };
  
  return <Form onSubmit={handleSubmit} ... />;
};

// 2. 필터 상태만 관리
const TransactionFiltersSection = () => {
  const [filters, setFilters] = useState({ ... });
  const handleCategoryChange = (cat) => { ... };
  const handlePeriodChange = (period) => { ... };
  
  return <FilterChips ... />;
};

// 3. 리스트 상태만 관리
const TransactionListSection = () => {
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = (id) => { ... };
  
  return <List ... />;
};

// 페이지는 조합만
const Page = () => {
  return (
    <>
      <TransactionFormSection />
      <TransactionFiltersSection />
      <TransactionListSection />
    </>
  );
};
```

**체크 방법:**
```typescript
1. 컴포넌트의 모든 상태 나열
2. 각 상태를 그룹으로 묶기 (서로 연관된 것끼리)
3. 독립적인 상태 그룹 개수 세기

IF (독립적 상태 그룹 2개 이상) {
  → ⚠️ "각 그룹별로 컴포넌트 분리 필요"
}

IF (독립적 상태 그룹 3개 이상) {
  → ❌ 즉시 반려
}
```

**상태 연관성 판단:**
```typescript
// 연관된 상태 (같은 컴포넌트 ✅)
const [formData, setFormData] = useState();
const [errors, setErrors] = useState();        // formData와 연관
const [isSubmitting, setIsSubmitting] = useState(); // formData와 연관

// 독립적 상태 (별도 컴포넌트 ✅)
const [filters, setFilters] = useState();      // formData와 무관
const [selectedId, setSelectedId] = useState(); // formData, filters와 무관
```

---

### C7 종합 판정 기준

**즉시 반려:**
- ❌ UI 컴포넌트에 비즈니스 이름 (Transaction, User 등)
- ❌ Section/Container인데 훅 호출 없음
- ❌ 3개 이상 핸들러 Props 전달
- ❌ 페이지에서 훅 호출 또는 핸들러 정의
- ❌ 독립적 상태 그룹 3개 이상을 한 컴포넌트에서 관리

**체크리스트:**
```markdown
### C7 아키텍처 검증

**C7-1. Custom Hooks:**
- [ ] use-~~-page 패턴: [없음 ✅ / 발견 ❌]
- [ ] 역할별 분리: [Yes ✅ / No ❌]

**C7-2. 컴포넌트 네이밍:**
- [ ] UI에 비즈니스 이름: [없음 ✅ / 발견 ❌]
  발견: [TransactionForm ❌, UserCard ❌]

**C7-3. 컴포넌트 역할:**
- [ ] Section인데 훅 호출 없음: [없음 ✅ / 발견 ❌]
  발견: [TransactionFiltersSection ❌]
  
- [ ] 3개 이상 핸들러 Props: [없음 ✅ / 발견 ❌]
  발견: [컴포넌트명 - 5개 핸들러 ❌]

**C7-4. 페이지:**
- [ ] 페이지에서 훅 호출: [없음 ✅ / 발견 ❌]
- [ ] 페이지에서 핸들러 정의: [없음 ✅ / 발견 ❌]

**C7-5. 상태 분리:**
- 독립적 상태 그룹: __개
  - 상태군1: 폼 (isSaving, editingTransaction, handleSubmit)
  - 상태군2: 필터 (filters, handleCategoryChange)
  - 상태군3: 리스트 (selectedId, handleSelect)
  - 판정: 3개 이상 → ❌

**컴포넌트 분류:**

*현재 파일들:*
- TransactionForm: 비즈니스 이름 포함 ❌
- TransactionFiltersSection: Section인데 Props로만 동작 ❌
- TransactionListSection: Section인데 Props로만 동작 ❌

*필요한 구조:*
- UI: Form, FilterChips, Card, List
- 비즈니스: TransactionFormSection, TransactionFiltersSection
- 페이지: IndexPage

### TASK 범위
- 완료 조건 충족: [✅ / ❌]
- 추가 기능: [없음 / 목록]

### PHASE 1 판정
- [✅ 통과] / [❌ 반려]

**반려 사유 (해당 시):**
1. C1: 제약사항 위반
2. C2: 구조 위반
3. C4: 타입/상수 위치
4. C6: 안티패턴
5. C7: 아키텍처 위반

---

## 🔍 PHASE 2: Quality Check
(PHASE 1 통과 시)

### 품질 메트릭
- 복잡도: [Low/Medium/High]
- 가독성: [좋음/보통/개선 필요]
- 유지보수성: [쉬움/보통/어려움]

### 발견 사항

**✅ 잘한 점:**
1. [구체적 피드백]

**⚠️ 개선 권장 (P2):**
1. [항목] - [개선 방법]

**🔍 관찰 목록:**
1. [패턴] - __회 (3회 시 추상화)

---

## 🎯 최종 판정

### [✅ 승인 / ⚠️ 조건부 승인 / ❌ 반려]

**근거:**
- [근거 1]
- [근거 2]

**종합:**
[2-3문장 요약]

---

## 📝 액션 아이템

### 🔴 즉시 수정 (반려 시)
- [ ] [P0] [항목] - 예상: __분

**총 소요:** __시간

### 🟡 다음 TASK
- [ ] [P2] [항목] - TASK-XXX에서

---

## 🔄 다음 단계

**✅ 승인:** TASK 완료 → 다음 진행
**⚠️ 조건부:** Warning 백로그 등록 → 다음 진행
**❌ 반려:** 수정 → 재리뷰

---

## 📚 액션 아이템 예시

### 아키텍처 위반 수정 예시

**문제: TransactionForm (비즈니스 이름 + UI 동작)**

```typescript
// ❌ 현재 (잘못됨)
// components/transaction-form.tsx
const TransactionForm = ({ onSubmit, initialValues }: Props) => {
  return <View>...</View>;
};

// ✅ 수정 1: UI 컴포넌트 생성
// components/ui/form.tsx
const Form = ({ onSubmit, initialValues }: Props) => {
  return <View>...</View>;
};

// ✅ 수정 2: 비즈니스 컴포넌트 생성
// components/transaction-form-section.tsx
const TransactionFormSection = () => {
  const { isSaving, editingTransaction, handleSubmit } = useTransactionFormState();
  
  return (
    <>
      {editingTransaction && <Banner onCancel={...} />}
      <Form 
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
        initialValues={editingTransaction}
      />
    </>
  );
};
```

**문제: 페이지에서 훅 호출 후 Props 전달**

```typescript
// ❌ 현재 (잘못됨)
// app/index.tsx
const IndexPage = () => {
  const { filters, handleCategoryChange } = useTransactionFilters();
  
  return (
    <TransactionFiltersSection
      filters={filters}
      onCategoryChange={handleCategoryChange}
    />
  );
};

// ✅ 수정: 비즈니스 컴포넌트가 직접 훅 호출
// components/transaction-filters-section.tsx
const TransactionFiltersSection = () => {
  const { filters, handleCategoryChange } = useTransactionFilters();
  const transactions = useTransactionStore(state => state.transactions);
  const categoryOptions = getCategoryOptions(transactions);
  
  return (
    <FilterChips
      options={categoryOptions}
      selected={filters.category}
      onChange={handleCategoryChange}
    />
  );
};

// app/index.tsx
const IndexPage = () => {
  return (
    <SafeAreaView>
      <TransactionFormSection />
      <TransactionFiltersSection />
      <TransactionListSection />
    </SafeAreaView>
  );
};
```

**문제: 독립적 상태를 한 컴포넌트에서 관리**

```typescript
// ❌ 현재 (잘못됨)
const Page = () => {
  // 3개의 독립적 상태 그룹
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({ ... });
  const [selectedId, setSelectedId] = useState(null);
  
  const handleSubmit = async () => { ... };
  const handleCategoryChange = (cat) => { ... };
  const handleSelect = (id) => { ... };
  
  return <>...</>;
};

// ✅ 수정: 상태별 컴포넌트 분리
// 1. components/transaction-form-section.tsx
const TransactionFormSection = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const handleSubmit = async () => { ... };
  return <Form ... />;
};

// 2. components/transaction-filters-section.tsx
const TransactionFiltersSection = () => {
  const [filters, setFilters] = useState({ ... });
  const handleCategoryChange = (cat) => { ... };
  return <FilterChips ... />;
};

// 3. components/transaction-list-section.tsx
const TransactionListSection = () => {
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = (id) => { ... };
  return <List ... />;
};

// app/index.tsx
const IndexPage = () => {
  return (
    <>
      <TransactionFormSection />
      <TransactionFiltersSection />
      <TransactionListSection />
    </>
  );
};
```

---

## ✅ 최종 체크리스트

**PHASE 1 (필수):**
- [ ] 제약사항 확인 (StyleSheet 제외)
- [ ] 구조 검증 (app/ 하위 금지)
- [ ] 매직 넘버/색상 0개
- [ ] 타입/상수 위치
- [ ] Zustand persist
- [ ] React 안티패턴 없음
- [ ] Custom Hooks 역할 분리
- [ ] UI 컴포넌트 네이밍 (비즈니스 이름 없음)
- [ ] Section/Container 역할 검증
- [ ] 페이지 순수성 (훅/핸들러 없음)
- [ ] 상태 기반 분리 (독립적 상태 → 별도 컴포넌트)
- [ ] TASK 범위
- [ ] 최적화 0개
- [ ] 미사용 코드 0개

**PHASE 2 (조건부):**
- [ ] 복잡도
- [ ] 중복
- [ ] 네이밍
- [ ] 에러 처리
- [ ] 테스트 가능성

**최종:**
- [ ] 판정 완료
- [ ] 액션 아이템
- [ ] 보고서 생성
```태 분리:**
- [ ] 독립적 상태 그룹: __개
  - 2개 이상: ⚠️ 분리 권장
  - 3개 이상: ❌ 즉시 반려
```

---

### C8. TASK 범위

- [ ] TASK 완료 조건 충족
- [ ] TASK 외 추가 기능 없음
- [ ] "나중을 위한" 확장 코드 없음

**판정:**
- 미충족 or 추가 기능 → 즉시 반려

---

### C9. 불필요한 최적화

**❌ 금지 (첫 구현):**
- useMemo (성능 측정 없이)
- useCallback (성능 측정 없이)
- React.memo (성능 측정 없이)

**✅ 예외:**
- 컴포넌트 분할 (단일 책임 원칙)
- UI/비즈니스 분리

---

### C10. 미사용 코드

**검증 순서:**
1. 모든 import 문 추출
2. 각 import된 항목이 실제로 사용되는지 확인
3. 모든 변수/함수 선언 추출
4. 각 선언이 실제로 참조되는지 확인
5. 0, 1, -1, true, false 등은 제외

**결과 형식:**
- [ ] import 검증: X개 중 Y개 사용, Z개 미사용
- [ ] 변수 검증: X개 중 Y개 사용, Z개 미사용
- [ ] 함수 검증: X개 중 Y개 사용, Z개 미사용

**판정:** 발견 시 즉시 반려

---

## 🔴 PHASE 1 결과

**IF 위반 발견:**
1. 즉시 반려 보고서 작성
2. PHASE 2 스킵
3. 종료

**IF 모두 통과:**
→ PHASE 2 진행

---

# 🔍 PHASE 2: QUALITY CHECK

> PHASE 1 통과 시에만 실행

## Q1. 복잡도

- 함수 30줄 이하: ✅
- 함수 31-60줄: ⚠️ (다음 TASK 분리 고려)
- 함수 61줄 이상: 🚫 즉시 분리
- 중첩 깊이 3단계 이상: ⚠️

---

## Q2. 코드 중복

**Rule of Three:**
- 1-2회: ✅ OK (관찰 목록 추가)
- 3회 이상: ⚠️ 추상화 필요

---

## Q3. 네이밍

**변수/함수명:**
- 명확한 이름: ✅
- 단일 문자 (d, x, tmp): ⚠️
- 모호한 동사 (process, handle, do): ⚠️

---

## Q4. 에러 처리

- null/undefined 체크: ✅
- 명확한 에러 메시지: ✅
- 일관된 패턴: ✅

---

## Q5. 테스트 가능성

- 의존성 주입: ✅
- 하드코딩된 의존성: ⚠️

---

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
| 컴포넌트 줄 수 (StyleSheet 제외) | 100 | __ | ✅/❌ |
| 함수 최대 줄 수 | 30 | __ | ✅/❌ |
| useState | 3 | __ | ✅/❌ |
| useEffect | 2 | __ | ✅/❌ |
| useMemo | 0 | __ | ✅/❌ |
| useCallback | 0 | __ | ✅/❌ |
| StyleSheet 규칙 | 20 | __ | ✅/❌ |
| 매직 넘버/색상 | 0 | __ | ✅/❌ |

### 구조 검증
- app/ 하위 components/: [없음 ✅ / 발견 ❌]
- app/ 하위 lib/: [없음 ✅ / 발견 ❌]
- app/ 하위 types/: [없음 ✅ / 발견 ❌]

### 아키텍처 검증

**C7-1. Custom Hooks:**
- use-~~-page 패턴: [없음 ✅ / 발견 ❌]
- 역할별 분리: [Yes ✅ / No ❌]

**C7-2. 컴포넌트 네이밍:**
- UI에 비즈니스 이름: [없음 ✅ / 발견 ❌]
  - 발견: TransactionForm, UserCard, ProductList

**C7-3. 컴포넌트 역할:**
- Section인데 훅 호출 없음: [없음 ✅ / 발견 ❌]
  - 발견: TransactionFiltersSection (Props로만 동작)
- 3개 이상 핸들러 Props: [없음 ✅ / 발견 ❌]
  - 발견: TransactionForm (5개 핸들러)

**C7-4. 페이지:**
- 페이지에서 훅 호출: [없음 ✅ / 발견 ❌]
- 페이지에서 핸들러 정의: [없음 ✅ / 발견 ❌]

**C7-5. 상태 분리:**
- 독립적 상태 그룹: __개
  - 2개 이상: ⚠️ 분리 권장
  - 3개 이상: ❌ 즉시 반려

**컴포넌트 분류:**

*현재 파일들:*
- TransactionForm: 비즈니스 이름 포함 ❌
- TransactionFiltersSection: Section인데 Props로만 동작 ❌
- TransactionListSection: Section인데 Props로만 동작 ❌

*필요한 구조:*
- UI: Form, FilterChips, Card, List
- 비즈니스: TransactionFormSection, TransactionFiltersSection
- 페이지: IndexPage

### TASK 범위
- 완료 조건 충족: [✅ / ❌]
- 추가 기능: [없음 / 목록]

### PHASE 1 판정
- [✅ 통과] / [❌ 반려]

**반려 사유 (해당 시):**
1. C1: 제약사항 위반
2. C2: 구조 위반
3. C4: 타입/상수 위치
4. C6: 안티패턴
5. C7: 아키텍처 위반

---