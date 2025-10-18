# 공통 코드 컨벤션 (Shared Conventions)

> 모든 역할(컴포넌트, API, 비즈니스 로직)에 적용되는 공통 규칙

---

## 📋 목차
1. [프로젝트 구조](#프로젝트-구조)
2. [네이밍 규칙](#네이밍-규칙)
3. [타입/상수 위치](#타입상수-위치)
4. [매직 넘버/색상](#매직-넘버색상)
5. [코드 제약사항](#코드-제약사항)
6. [미사용 코드](#미사용-코드)
7. [TASK 범위](#task-범위)
8. [불필요한 최적화](#불필요한-최적화)

---

## 프로젝트 구조

### Expo 프로젝트 구조 규칙

**❌ app/ 하위 금지:**
```
app/
├── components/  ❌
├── lib/         ❌
├── types/       ❌
├── utils/       ❌
├── hooks/       ❌
└── stores/      ❌
```

**✅ 올바른 위치:**
```
project-root/
├── app/              # 라우트만
│   ├── index.tsx
│   └── (tabs)/
├── components/       # app 밖
├── logic/           # app 밖
├── api/             # app 밖
├── types/           # app 밖
├── hooks/           # app 밖
├── constants/       # app 밖
└── stores/          # app 밖
```

### 권장 폴더 구조
```
src/
├── components/           # 컴포넌트 레이어
│   ├── ui/              # 범용 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   └── card.tsx
│   └── [domain]/        # 비즈니스 컴포넌트
│       ├── user-profile-section.tsx
│       └── order-form-section.tsx
│
├── api/                 # API 레이어
│   ├── user.api.ts
│   ├── order.api.ts
│   └── auth.api.ts
│
├── logic/               # 비즈니스 로직 레이어
│   ├── user/
│   │   ├── userValidator.ts
│   │   └── userPermissions.ts
│   └── order/
│       ├── orderCalculator.ts
│       └── orderStatus.ts
│
├── types/               # 타입 정의
│   ├── user.types.ts
│   ├── order.types.ts
│   └── api.types.ts
│
├── constants/           # 상수
│   ├── colors.ts
│   ├── spacing.ts
│   └── config.ts
│
├── hooks/               # Custom Hooks
│   ├── use-user-form-state.ts
│   └── use-order-filters.ts
│
└── stores/              # 전역 상태
    ├── userStore.ts
    └── orderStore.ts
```

---

## 네이밍 규칙

### 파일명
```typescript
// 컴포넌트
UserProfile.tsx          // PascalCase
user-profile-section.tsx // kebab-case (비즈니스 컴포넌트)

// API
user.api.ts             // kebab-case + .api
order.api.ts

// 비즈니스 로직
userValidator.ts        // camelCase
orderCalculator.ts

// Hooks
use-user-form.ts        // kebab-case + use- prefix

// 타입
user.types.ts           // kebab-case + .types
api.types.ts

// 상수
colors.ts               // camelCase
config.ts
```

### 변수/함수명
```typescript
// 변수/함수: camelCase
const getUserData = () => {};
const isValidEmail = true;
const userCount = 10;

// 상수: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const TAX_RATE = 0.1;

// 타입/인터페이스: PascalCase
interface IUserData {
  id: string;
  name: string;
}

type OrderStatus = 'pending' | 'completed';

// 비즈니스 로직 모듈: camelCase + 도메인 접미사
const userValidator = { ... };
const orderCalculator = { ... };
const paymentProcessor = { ... };
```

### 컴포넌트명 규칙

**UI 컴포넌트: 범용 이름 (비즈니스 도메인 없음)**
```typescript
// ✅ 올바른 예
const Form = () => {};
const Button = () => {};
const Card = () => {};
const List = () => {};
const Modal = () => {};

// ❌ 잘못된 예 - 비즈니스 도메인 포함
const UserForm = () => {};      // User는 도메인 이름
const ProductCard = () => {};   // Product는 도메인 이름
const OrderList = () => {};     // Order는 도메인 이름
```

**비즈니스 컴포넌트: 도메인명 + Section/Container**
```typescript
// ✅ 올바른 예
const UserProfileSection = () => {};
const OrderFormSection = () => {};
const TransactionListSection = () => {};

// ❌ 잘못된 예
const UserProfile = () => {};   // Section/Container 없음
```

---

## 타입/상수 위치

### 규칙: 컴포넌트/페이지 파일 내부 금지

**❌ 금지:**
```typescript
// components/user-profile.tsx 또는 app/index.tsx
type User = {
  id: string;
  name: string;
};

const MAX_ITEMS = 10;
const API_URL = 'https://api.example.com';

const UserProfile = () => {
  // ...
};
```

**✅ 올바른 위치:**
```typescript
// types/user.types.ts
export type User = {
  id: string;
  name: string;
};

// constants/config.ts
export const MAX_ITEMS = 10;
export const API_URL = 'https://api.example.com';

// components/user-profile.tsx
import type { User } from '@/types/user.types';
import { MAX_ITEMS, API_URL } from '@/constants/config';

const UserProfile = () => {
  // ...
};
```

### 예외: Props 타입

```typescript
// ✅ Props 타입은 컴포넌트 파일에 있어도 OK
// components/ui/button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button = ({ title, onPress, disabled }: ButtonProps) => {
  return <Pressable onPress={onPress}>...</Pressable>;
};
```

**단, 비즈니스 도메인 이름이 포함된 경우 금지:**
```typescript
// ❌ 금지
// components/user-form.tsx
interface UserFormProps {  // User = 비즈니스 도메인
  user: User;
  onSubmit: (user: User) => void;
}

// ✅ types/user.types.ts로 이동
export interface UserFormProps {
  user: User;
  onSubmit: (user: User) => void;
}
```

### 검증 방법
1. 파일 내 모든 `type`, `interface`, `const` 선언 검색
2. 각 항목이 올바른 위치에 있는지 확인
3. Props 타입인지 확인
4. 비즈니스 도메인 이름 포함 여부 확인

---

## 매직 넘버/색상

### 원칙: 모든 숫자/색상은 상수화

**❌ 금지:**
```typescript
// 색상 코드 직접 사용
<View style={{ backgroundColor: '#1f6feb' }} />
<Text style={{ color: '#dc2626' }} />

// 숫자 직접 사용
<View style={{ padding: 16, margin: 24 }} />
const maxItems = 10;
const retryDelay = 3000;

// 문자열 상수
if (status === 'pending') { }
if (type === 'success') { }
```

**✅ 허용: 예외 숫자**
```typescript
// 이 숫자들만 직접 사용 가능
0
1
-1
true
false
'' (빈 문자열)
배열 인덱스 (array[0], array[1])
```

**✅ 올바른 예:**
```typescript
// constants/colors.ts
export const COLORS = {
  primary: '#1f6feb',
  danger: '#dc2626',
  success: '#10b981',
  background: '#ffffff',
  text: '#1f2937',
} as const;

// constants/spacing.ts
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// constants/config.ts
export const CONFIG = {
  maxItems: 10,
  retryDelay: 3000,
  apiTimeout: 5000,
} as const;

// constants/status.ts
export const ORDER_STATUS = {
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// 사용
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { CONFIG } from '@/constants/config';
import { ORDER_STATUS } from '@/constants/status';

<View style={{ 
  backgroundColor: COLORS.primary,
  padding: SPACING.md,
  margin: SPACING.lg 
}} />

const maxItems = CONFIG.maxItems;
if (status === ORDER_STATUS.pending) { }
```

### 검증 방법
1. 코드에서 `#` 패턴 검색 (색상 코드)
2. 2 이상의 숫자 리터럴 검색 (0, 1, -1 제외)
3. 문자열 리터럴 검색 (상태, 타입 등)
4. 각 항목이 상수로 정의되었는지 확인

---

## 코드 제약사항

### 함수 길이
```typescript
// ❌ 금지: 30줄 초과
const longFunction = () => {
  // ... 31줄 이상
};

// ✅ 권장: 30줄 이하
const shortFunction = () => {
  // ... 30줄 이하
};

// ✅ 해결: 함수 분리
const processStep1 = () => { /* 15줄 */ };
const processStep2 = () => { /* 15줄 */ };

const mainFunction = () => {
  processStep1();
  processStep2();
};
```

### 중첩 깊이
```typescript
// ❌ 금지: 3단계 이상 중첩
const deepNesting = () => {
  if (condition1) {
    if (condition2) {
      if (condition3) {        // 3단계 중첩
        // ...
      }
    }
  }
};

// ✅ 권장: 조기 리턴
const flatStructure = () => {
  if (!condition1) return;
  if (!condition2) return;
  if (!condition3) return;
  
  // 메인 로직
};
```

### 복잡도 기준
- **Low**: 분기/루프 1-3개
- **Medium**: 분기/루프 4-7개
- **High**: 분기/루프 8개 이상 (리팩토링 필요)

---

## 미사용 코드

### 검증 항목

**1. Import 검증**
```typescript
// ❌ 미사용 import
import { useState, useEffect, useMemo } from 'react';  // useMemo 사용 안 함
import { calculateTotal, formatDate } from '@/utils';  // formatDate 사용 안 함

// ✅ 사용하는 것만 import
import { useState, useEffect } from 'react';
import { calculateTotal } from '@/utils';
```

**2. 변수/함수 검증**
```typescript
// ❌ 선언했지만 사용하지 않음
const unusedVariable = 'test';
const unusedFunction = () => {};

// ✅ 선언하고 사용
const usedVariable = 'test';
console.log(usedVariable);

const usedFunction = () => {};
usedFunction();
```

**3. 타입 검증**
```typescript
// ❌ 정의했지만 사용하지 않는 타입
interface IUnusedType {
  id: string;
}

type UnusedAlias = string;

// ✅ 정의하고 사용
interface IUsedType {
  id: string;
}

const data: IUsedType = { id: '1' };
```

### 검증 프로세스
1. 모든 `import` 문 추출
2. 각 import된 항목의 사용 여부 확인
3. 모든 변수/함수 선언 추출
4. 각 선언의 참조 여부 확인
5. 모든 타입/인터페이스 선언 추출
6. 각 타입의 사용 여부 확인

### 예외
- `0`, `1`, `-1`, `true`, `false` 등 기본 리터럴
- 테스트 파일의 setup/teardown 함수

---

## TASK 범위

### 원칙: TASK 완료 조건만 충족

**❌ 금지:**
```typescript
// "나중을 위한" 확장 코드
interface IUser {
  id: string;
  name: string;
  email: string;
  // 아래는 현재 TASK에서 사용하지 않음
  phoneNumber?: string;      // 미래를 위한 필드
  address?: string;          // 미래를 위한 필드
  preferences?: object;      // 미래를 위한 필드
}

// TASK 범위 외 추가 기능
const saveUser = (user: IUser) => {
  validateUser(user);
  saveToDatabase(user);
  sendWelcomeEmail(user);    // TASK에 없는 기능
  logAnalytics(user);        // TASK에 없는 기능
};

// 과도한 추상화
const createGenericValidator = <T>() => {  // 현재는 하나만 검증
  // 복잡한 제네릭 구조
};
```

**✅ 올바른 예:**
```typescript
// TASK 완료에 필요한 것만
interface IUser {
  id: string;
  name: string;
  email: string;
}

const saveUser = (user: IUser) => {
  validateUser(user);
  saveToDatabase(user);
};

// 필요할 때 확장
// 다음 TASK에서 추가
```

### 판정 기준
- TASK 완료 조건 미충족: ❌ 반려
- TASK 외 추가 기능 존재: ❌ 반려
- "나중을 위한" 코드 존재: ❌ 반려

---

## 불필요한 최적화

### 원칙: 성능 측정 없이 최적화 금지

**❌ 첫 구현에 금지:**
```typescript
// useMemo - 성능 문제 확인 전 사용 금지
const expensiveValue = useMemo(() => {
  return calculateSomething(data);
}, [data]);

// useCallback - 성능 문제 확인 전 사용 금지
const handleClick = useCallback(() => {
  doSomething();
}, []);

// React.memo - 성능 문제 확인 전 사용 금지
const MemoizedComponent = React.memo(Component);
```

**✅ 대신 사용:**
```typescript
// 단순하게 시작
const expensiveValue = calculateSomething(data);

const handleClick = () => {
  doSomething();
};

const Component = () => { };
```

**✅ 예외: 구조적 개선**
```typescript
// 컴포넌트 분할 (단일 책임 원칙)
const LargeComponent = () => {
  // 너무 많은 책임
};

// 분리
const FormSection = () => { };
const ListSection = () => { };
const FilterSection = () => { };

// UI/비즈니스 분리
const UserFormSection = () => {  // 비즈니스
  const { handleSubmit } = useUserForm();
  return <Form onSubmit={handleSubmit} />;  // UI
};
```

### 최적화가 필요한 시점
1. 성능 프로파일링으로 병목 지점 확인
2. 실제 사용자 경험에서 문제 발견
3. 구체적인 메트릭 (렌더링 시간, FPS 등) 측정

---

## ✅ 공통 체크리스트

### 필수 검증
- [ ] 프로젝트 구조: app/ 하위에 금지된 폴더 없음
- [ ] 네이밍 규칙: 일관된 명명 규칙 적용
- [ ] 타입/상수 위치: 컴포넌트/페이지 파일 내부에 없음
- [ ] 매직 넘버/색상: 모든 숫자/색상 상수화 (0, 1, -1 제외)
- [ ] 함수 길이: 30줄 이하
- [ ] 중첩 깊이: 3단계 미만
- [ ] 미사용 코드: import/변수/함수/타입 모두 사용됨
- [ ] TASK 범위: 완료 조건만 충족, 추가 기능 없음
- [ ] 불필요한 최적화: useMemo/useCallback/React.memo 없음

### 권장 사항
- [ ] 복잡도: Low/Medium 유지
- [ ] 가독성: 명확한 변수/함수명
- [ ] 유지보수성: 단일 책임 원칙
- [ ] 테스트 가능성: 의존성 주입

---

## 📝 참고: 검증 프로세스

### 1단계: 자동 검증
```bash
# 미사용 import 검출
eslint --rule 'no-unused-vars: error'

# 복잡도 검출
eslint --rule 'complexity: [error, 10]'

# 파일 길이 검출
wc -l components/**/*.tsx
```

### 2단계: 수동 검증
- 프로젝트 구조 확인
- 타입/상수 위치 확인
- 매직 넘버/색상 검색
- TASK 범위 검토

### 3단계: 종합 판정
- 모든 항목 통과: ✅ 승인
- 1개 이상 위반: ❌ 반려