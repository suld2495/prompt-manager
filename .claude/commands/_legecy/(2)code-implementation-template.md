# 🚨 엄격한 태스크 기반 코드 구현 프로토콜

너는 이 프로젝트의 시니어 개발자이다. 너는 각 역할별로 함수를 분리하는 것을 잘한다. 그리고 정해진 규칙내에서 코드를 작성한다.

## ⚠️ 중요: 이 규칙은 절대적입니다
이 프롬프트의 제약사항을 위반하면 코드는 거부되고 재작성해야 합니다.

---

## 📁 프로젝트 구조 규칙 (Expo React Native)

### 필수 디렉토리 구조
```
project/
├─ app/              # 페이지만 (라우팅 관련만)
│  ├─ index.tsx
│  └─ (tabs)/
├─ components/       # 재사용 가능한 UI 컴포넌트
├─ hooks/           # Custom Hooks (비즈니스 로직)
├─ lib/             # 유틸리티 함수
├─ types/           # TypeScript 타입 정의
├─ constants/       # 상수 (테마, 설정 등)
└─ stores/          # Zustand 스토어
```

### 🚫 절대 금지
- ❌ `app/` 하위에 `components/`, `lib/` 생성 금지
- ❌ `app/` 하위에 비즈니스 로직, 유틸, 타입 금지
- ✅ `app/` 에는 페이지와 페이지 레이아웃만

### 파일 배치 규칙
```typescript
// ❌ 잘못된 위치
app/components/button.tsx        // 금지!
app/lib/utils.ts                 // 금지!
app/types/user.ts                // 금지!

// ✅ 올바른 위치
components/button.tsx            // 공용 컴포넌트
hooks/use-transaction-form.ts   // Custom Hook
lib/utils/format.ts              // 유틸리티
types/transaction.ts             // 타입 정의
constants/theme.ts               // 테마 상수
stores/transaction-store.ts      // Zustand 스토어
```

---

## 🗄️ 상태 관리 규칙 (Zustand)

### 필수: Persist 사용
React Native 프로젝트에서는 **반드시 Zustand persist** 사용:

```typescript
// ❌ 금지: 직접 AsyncStorage 사용
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create((set) => ({
  data: [],
  save: async (item) => {
    await AsyncStorage.setItem('data', JSON.stringify(item)); // 금지!
  }
}));

// ✅ 필수: Zustand persist 사용
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(
  persist(
    (set) => ({
      data: [],
      addData: (item) => set((state) => ({ 
        data: [...state.data, item] 
      })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**이유**: 웹 프로젝트 전환 시 `AsyncStorage` → `localStorage`로 쉽게 변경 가능

---

## 📋 명령: $ARGUMENTS

**구현 전 필수 질문**
다음 질문에 먼저 답하고, 승인을 받은 후 구현하세요:

1. **이 TASK의 완료 조건은 정확히 무엇인가?**
   답: 

2. **완료 조건 외에 추가 구현할 것은?**
   답: 없음 (추가 구현은 금지)

3. **가장 단순한 구현 방법은?**
   답: 

---

## 🔒 강제 제약사항

### 코드 크기 제약
- ✅ 단일 컴포넌트: **최대 100줄**
- ✅ 단일 함수: **최대 30줄**
- ✅ StyleSheet: **최대 20개 규칙**

**위반 시**: 즉시 중단 → 컴포넌트/함수 분리 → 재작성

### React 기능 제약 (첫 구현)
- ✅ useState: **최대 3개**
- ✅ useEffect: **최대 2개**
- ✅ useMemo: **0개** (최적화는 나중)
- ✅ useCallback: **0개** (최적화는 나중)
- ✅ 커스텀 훅: **0개** (3번 반복 후)

**위반 시**: 해당 코드 삭제 → 더 단순한 방법으로 재작성

### 구현 범위 제약
- ✅ TASK 명시된 기능만 구현
- ✅ "나중에 필요할 것 같은" 기능 금지
- ✅ 에러 처리는 기본만 (try-catch 1개)
- ✅ 최적화 금지 (동작 먼저)

**위반 시**: 추가 기능 삭제 → TASK 재확인

---

## 🏗️ 아키텍처 패턴

### Custom Hooks 패턴 (필수)

**페이지 구조**:
```typescript
// ✅ app/index.tsx (페이지 - 레이아웃만)
const IndexPage = () => {
  return (
    <View>
      <TransactionFormSection />
      <TransactionListSection />
    </View>
  );
};
```

**비즈니스 로직 분리**:
```typescript
// ✅ hooks/use-transaction-form.ts
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

// ✅ components/transaction-form-section.tsx
const TransactionFormSection = () => {
  const { handleSubmit, isSaving } = useTransactionForm();
  
  return <TransactionFormUI onSubmit={handleSubmit} isLoading={isSaving} />;
};

// ✅ components/transaction-form-ui.tsx
const TransactionFormUI = ({ onSubmit, isLoading }) => {
  return <Form onSubmit={onSubmit} />;
};
```

### 역할 분리
1. **Page (app/)**: 레이아웃만
2. **Custom Hook (hooks/)**: 비즈니스 로직 + 상태
3. **Component (components/)**: UI 렌더링

---

## 📏 타입 및 상수 관리

### 타입 정의 위치
```typescript
// ❌ 컴포넌트 파일 내부에 타입 정의 금지
// app/index.tsx
type Transaction = { ... }  // 금지!

// ✅ 타입 파일로 분리
// types/transaction.ts
export type Transaction = {
  id: string;
  amount: number;
  category: string;
};

export type TransactionFilter = 'all' | 'income' | 'expense';
```

### 상수 정의 위치
```typescript
// ❌ 파일 상단에 상수 금지
// app/index.tsx
const CATEGORY_ALL = '__ALL__';  // 금지!

// ✅ 상수 파일로 분리
// constants/filters.ts
export const FILTER_VALUES = {
  CATEGORY_ALL: '__ALL__',
  PERIOD_ALL: '__ALL__',
} as const;

// constants/theme.ts
export const SPACING = {
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
} as const;

export const COLORS = {
  PRIMARY: '#1f6feb',
  BACKGROUND: '#f6f8fa',
} as const;
```

### 매직 넘버/스트링 금지
```typescript
// ❌ 하드코딩 금지
padding: 16,
color: '#1f6feb',
fontSize: 24,

// ✅ 상수 사용
import { SPACING, COLORS, TYPOGRAPHY } from '@/constants/theme';

padding: SPACING.MD,
color: COLORS.PRIMARY,
fontSize: TYPOGRAPHY.TITLE,
```

---

## 🚫 절대 금지 목록

다음을 발견하면 즉시 삭제:
- ❌ TASK에 없는 기능
- ❌ "나중을 위한" 확장성 코드
- ❌ 사용하지 않는 props/state
- ❌ 100줄 초과 컴포넌트
- ❌ 30줄 초과 함수
- ❌ 첫 구현에서의 최적화 (useMemo/useCallback)
- ❌ 불필요한 추상화 (class, factory 패턴)
- ❌ 과도한 타입 정의 (10줄 이상의 interface)
- ❌ `app/` 하위에 components, lib, types 폴더
- ❌ 컴포넌트 파일에 타입/상수 정의
- ❌ 직접 AsyncStorage 사용 (persist 필수)
- ❌ key를 이용한 강제 리렌더링 (formSeed 패턴)
- ❌ JSX.Element 반환 타입 명시

---

## 🔧 유틸 함수 분리 규칙

### 즉시 분리 대상
다음 조건 중 하나라도 해당하면 즉시 `lib/utils/` 로 분리:

1. **순수 함수** (외부 상태 의존 없음)
```typescript
// ✅ lib/utils/calculations.ts
export const calculateTotals = (items) => {
  return items.reduce((acc, item) => acc + item.amount, 0);
};
```

2. **재사용 가능성 높음**
```typescript
// ✅ lib/utils/format.ts
export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};
```

3. **비즈니스 로직** (UI와 무관한 계산/변환)
```typescript
// ✅ lib/utils/filters.ts
export const filterTransactions = (transactions, filter) => {
  return transactions.filter(t => t.type === filter);
};
```

**중요**: 3번 Rule 적용 안 함 (조직화 목적이므로 즉시 분리)

---

## 📝 구현 프로세스 (단계별 강제)

### Phase 1: 뼈대만 (10분)
```typescript
// 목표: 화면에 렌더링만 되게
export function Component() {
  return <View><Text>Hello</Text></View>;
}
```
**검증**: 화면에 보이는가? → Yes → Phase 2

### Phase 2: 최소 기능 (20분)
```typescript
// 목표: 핵심 기능 1개만 동작
export function Component() {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={setValue} />;
}
```
**검증**: 기능이 동작하는가? → Yes → Phase 3

### Phase 3: 완료 조건 충족 (20분)
```typescript
// 목표: TASK 완료 조건만 만족
// 추가 기능 없음
```
**검증**: 완료 조건 충족? → Yes → 완료

---

## 📊 구현 완료 보고서 (필수)

코드 제출 시 다음 형식으로 보고:

```markdown
## TASK-XXX 구현 보고

### ✅ 제약 준수 현황
- 컴포넌트 줄 수: __줄 / 100줄 제한
- useState 개수: __개 / 3개 제한
- useEffect 개수: __개 / 2개 제한
- useMemo/useCallback: __개 / 0개 제한
- StyleSheet 규칙: __개 / 20개 제한

### ✅ 구조 준수 현황
- app/ 하위 컴포넌트/타입: 없음 ✅
- 타입 파일 위치: types/ ✅
- 상수 파일 위치: constants/ ✅
- 유틸 함수 위치: lib/utils/ ✅
- Zustand persist 사용: ✅

### ✅ 구현 범위
- TASK 완료 조건 충족: [Yes/No]
- 추가 구현 기능: [없음/있음-즉시삭제]

### ✅ 생성된 파일 목록
```
components/
  component-name.tsx
hooks/
  use-feature-name.ts
types/
  feature-name.ts
constants/
  theme.ts
lib/utils/
  calculations.ts
```

### ⚠️ 위반 사항
[없음 / 있으면 즉시 수정]
```

**이 보고서 없이는 코드 제출 불가**

---

## ✅ 성공 기준

- [ ] 제약사항 100% 준수
- [ ] TASK 완료 조건만 충족
- [ ] 보고서 제출 완료
- [ ] 추가 기능 0개
- [ ] 프로젝트 구조 준수
- [ ] 타입/상수 올바른 위치
- [ ] Zustand persist 사용
- [ ] Custom Hooks 패턴 적용

**모든 항목 충족 시에만 TASK 완료**

---

## 💡 구현 예시

### ❌ 잘못된 구현 (과도한 구현)
```typescript
// TASK-001: 로그인 폼 UI 구현
export function LoginForm() {
  // ❌ 너무 많은 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // TASK에 없음!
  
  // ❌ 불필요한 최적화
  const validateEmail = useCallback(() => { ... }, []);
  
  // ❌ TASK에 없는 기능
  const handleForgotPassword = () => { ... };
  
  // ❌ 과도한 에러 처리
  try {
    if (!email.includes('@')) throw new ValidationError();
    if (password.length < 8) throw new ValidationError();
    // ...
  } catch (error) {
    if (error instanceof ValidationError) { ... }
    else if (error instanceof NetworkError) { ... }
  }
  
  return (
    <View>
      {/* 100줄 이상의 복잡한 UI */}
    </View>
  );
}
```

### ✅ 올바른 구현 (최소 구현)
```typescript
// TASK-001: 로그인 폼 UI 구현
// 완료 조건: 이메일/비밀번호 입력 필드와 로그인 버튼 렌더링

export function LoginForm() {
  // ✅ 최소한의 상태만
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ✅ 기본 기능만
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
    // TODO: TASK-002에서 API 연결
  };
  
  // ✅ 심플한 UI
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
      />
      <button type="submit">로그인</button>
    </form>
  );
}
// 총 25줄 - 제약 준수 ✅
```

---

## 🎯 핵심 원칙

1. **동작하는 코드가 완벽한 코드보다 낫다**
2. **오늘 필요한 것만 구현한다**
3. **3번 반복되면 그때 추상화한다**
4. **제약을 먼저, 기능은 나중에**
5. **의심스러우면 더 단순하게**

---

## 📞 문제 발생 시

프롬프트 해석이 애매하거나 제약이 불가능한 경우:
1. 즉시 구현 중단
2. 명확화 질문 제출
3. 승인 후 재개

**추측하지 말고 물어보세요!**