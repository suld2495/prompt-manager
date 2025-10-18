# 비즈니스 로직 레이어 공통 규칙

> 비즈니스 로직 레이어 개발 및 리뷰 시 공통으로 적용되는 핵심 규칙

**이 문서를 참조하는 파일:**
- `specialists/business-logic-dev.md` - 비즈니스 로직 개발 가이드
- `specialists/business-logic-review.md` - 비즈니스 로직 리뷰 가이드

---

## 📋 목차
1. [핵심 원칙](#핵심-원칙)
2. [레이어 책임](#레이어-책임)
3. [순수 함수 원칙](#순수-함수-원칙)
4. [불변성 규칙](#불변성-규칙)
5. [금지 사항](#금지-사항)
6. [파일 구조 규칙](#파일-구조-규칙)
7. [네이밍 규칙](#네이밍-규칙)
8. [도메인 패턴](#도메인-패턴)
9. [타입 정의 규칙](#타입-정의-규칙)
10. [테스트 규칙](#테스트-규칙)
11. [복잡도 관리](#복잡도-관리)

---

## 핵심 원칙

### 비즈니스 로직의 단일 책임

```
비즈니스 로직 레이어 = 도메인 규칙 + 순수 함수
```

**핵심 규칙:**
- ✅ 순수 함수 (Pure Functions)
- ✅ 불변성 (Immutability)
- ✅ 테스트 가능성 (Testability)
- ❌ 부작용 없음 (No Side Effects)
- ❌ 외부 상태 의존 없음 (No External Dependencies)

---

## 레이어 책임

### 비즈니스 로직이 해야 할 일

| 책임 | 설명 | 예시 |
|------|------|------|
| 도메인 규칙 | 비즈니스 룰 구현 | "50,000원 이상 무료 배송" |
| 계산 로직 | 수치 계산 | 총액, 할인율, 세금 계산 |
| 검증 로직 | 데이터 유효성 검사 | 이메일 형식, 비밀번호 강도 |
| 변환 로직 | 데이터 포맷팅 | 전화번호 포맷, 날짜 포맷 |
| 상태 머신 | 상태 전이 관리 | 주문 상태, 결제 상태 |
| 권한 로직 | 접근 권한 확인 | 사용자 권한, 역할 기반 |

### 비즈니스 로직이 하면 안 되는 일

| 금지 | 이유 | 올바른 위치 |
|------|------|-------------|
| UI 렌더링 | 표현 계층 | `components/` 폴더 |
| API 호출 | 데이터 계층 | `api/` 폴더 |
| 상태 관리 | 상태 계층 | `store/` 또는 `context/` |
| 라우팅 | 네비게이션 계층 | `navigation/` |
| 외부 상태 변경 | 부작용 | 호출하는 쪽에서 처리 |
| 로컬 스토리지 접근 | 부작용 | 호출하는 쪽에서 처리 |

---

## 순수 함수 원칙

### 원칙: 모든 비즈니스 로직은 순수 함수

**순수 함수의 3가지 조건:**
1. **동일한 입력 → 항상 동일한 출력**
2. **외부 상태를 변경하지 않음** (No Side Effects)
3. **외부 상태에 의존하지 않음** (No External Dependencies)

### 순수 함수 예시

```typescript
// ✅ 순수 함수
export const calculateTotal = (price: number, quantity: number): number => {
  return price * quantity;
};

// 항상 동일한 결과
calculateTotal(10000, 2); // → 20000
calculateTotal(10000, 2); // → 20000
calculateTotal(10000, 2); // → 20000
```

### 비순수 함수 (금지)

```typescript
// ❌ 금지 1: 외부 변수 변경
let total = 0;

export const addToTotal = (amount: number) => {
  total += amount;  // 외부 상태 변경 ❌
  return total;
};

// ❌ 금지 2: 입력 객체 변경
export const updateUser = (user: User) => {
  user.updatedAt = new Date();  // 입력 객체 변경 ❌
  return user;
};

// ❌ 금지 3: 외부 상태 의존
export const getDiscountRate = () => {
  return Number(localStorage.getItem('rate'));  // 외부 상태 의존 ❌
};

// ❌ 금지 4: 랜덤값 사용
export const generateId = () => {
  return Math.random().toString();  // 매번 다른 결과 ❌
};

// ❌ 금지 5: 현재 시간 사용
export const getCurrentAge = (birthYear: number) => {
  return new Date().getFullYear() - birthYear;  // 시간 의존 ❌
};

// ❌ 금지 6: API 호출
export const getUserName = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);  // API 호출 ❌
  return response.json();
};
```

### 올바른 순수 함수

```typescript
// ✅ 예시 1: 새로운 값 반환
export const addToTotal = (currentTotal: number, amount: number): number => {
  return currentTotal + amount;
};

// ✅ 예시 2: 새 객체 반환
export const updateUser = (user: User, updatedAt: Date): User => {
  return { ...user, updatedAt };
};

// ✅ 예시 3: 매개변수로 받기
export const calculateDiscount = (price: number, discountRate: number): number => {
  return price * discountRate;
};

// ✅ 예시 4: 매개변수로 랜덤값 받기
export const generateId = (randomValue: number): string => {
  return randomValue.toString();
};

// ✅ 예시 5: 매개변수로 시간 받기
export const calculateAge = (birthYear: number, currentYear: number): number => {
  return currentYear - birthYear;
};

// ✅ 예시 6: 데이터만 받기 (API는 호출하는 쪽에서)
export const formatUserName = (user: User): string => {
  return `${user.lastName} ${user.firstName}`;
};
```

---

## 불변성 규칙

### 원칙: 원본 데이터를 절대 변경하지 않음

**불변성 유지 방법:**
- 배열: 새 배열 생성 (`[...array]`, `map`, `filter`, `reduce`)
- 객체: 새 객체 생성 (`{...object}`)
- 중첩 데이터: 깊은 복사

### 배열 불변성

```typescript
// ❌ 금지: 원본 배열 변경
export const addItem = (items: Item[], newItem: Item): Item[] => {
  items.push(newItem);  // 원본 변경 ❌
  return items;
};

export const removeItem = (items: Item[], index: number): Item[] => {
  items.splice(index, 1);  // 원본 변경 ❌
  return items;
};

export const sortItems = (items: Item[]): Item[] => {
  items.sort((a, b) => a.price - b.price);  // 원본 변경 ❌
  return items;
};

// ✅ 올바름: 새 배열 반환
export const addItem = (items: Item[], newItem: Item): Item[] => {
  return [...items, newItem];  // 새 배열 ✅
};

export const removeItem = (items: Item[], index: number): Item[] => {
  return items.filter((_, i) => i !== index);  // 새 배열 ✅
};

export const sortItems = (items: Item[]): Item[] => {
  return [...items].sort((a, b) => a.price - b.price);  // 새 배열 ✅
};

export const updateItem = (items: Item[], index: number, updates: Partial<Item>): Item[] => {
  return items.map((item, i) => 
    i === index ? { ...item, ...updates } : item
  );  // 새 배열 ✅
};
```

### 객체 불변성

```typescript
// ❌ 금지: 원본 객체 변경
export const updatePrice = (product: Product, newPrice: number): Product => {
  product.price = newPrice;  // 원본 변경 ❌
  return product;
};

export const addProperty = (user: User, role: string): User => {
  user.role = role;  // 원본 변경 ❌
  return user;
};

// ✅ 올바름: 새 객체 반환
export const updatePrice = (product: Product, newPrice: number): Product => {
  return { ...product, price: newPrice };  // 새 객체 ✅
};

export const addProperty = (user: User, role: string): User => {
  return { ...user, role };  // 새 객체 ✅
};

export const updateMultipleFields = (
  user: User,
  updates: Partial<User>
): User => {
  return { ...user, ...updates };  // 새 객체 ✅
};
```

### 중첩 객체 불변성

```typescript
// ❌ 금지: 중첩 객체 변경
export const updateAddress = (user: User, newAddress: string): User => {
  user.profile.address = newAddress;  // 중첩 객체 변경 ❌
  return user;
};

// ✅ 올바름: 중첩 객체도 새로 생성
export const updateAddress = (user: User, newAddress: string): User => {
  return {
    ...user,
    profile: {
      ...user.profile,
      address: newAddress,  // 중첩 객체도 새로 생성 ✅
    },
  };
};

export const updateNestedData = (
  order: Order,
  itemIndex: number,
  newQuantity: number
): Order => {
  return {
    ...order,
    items: order.items.map((item, i) =>
      i === itemIndex
        ? { ...item, quantity: newQuantity }
        : item
    ),  // 중첩 배열도 새로 생성 ✅
  };
};
```

---

## 금지 사항

### ❌ 금지 1: 부작용 (Side Effects)

```typescript
// ❌ 잘못됨
let orderCount = 0;

export const processOrder = (order: Order) => {
  orderCount++;  // 전역 변수 변경 ❌
  localStorage.setItem('lastOrder', order.id);  // 로컬 스토리지 접근 ❌
  console.log('Order processed');  // 콘솔 출력도 부작용 ❌
  return order;
};

// ✅ 올바름
export const processOrder = (order: Order, orderNumber: number): ProcessedOrder => {
  return { ...order, orderNumber };  // 순수 함수 ✅
};

// 부작용은 호출하는 쪽에서 처리
const handleProcess = async (order: Order) => {
  const orderNumber = orderCount + 1;
  const processed = processOrder(order, orderNumber);
  
  setOrderCount(orderNumber);  // 상태 업데이트
  localStorage.setItem('lastOrder', processed.id);  // 저장
  console.log('Order processed');  // 로깅
  
  return processed;
};
```

### ❌ 금지 2: UI 코드

```typescript
// ❌ 잘못됨
export const validateUser = (user: User) => {
  if (!user.email) {
    alert('이메일은 필수입니다');  // UI 코드 ❌
    return false;
  }
  
  showToast('검증 완료');  // UI 코드 ❌
  return true;
};

// ✅ 올바름
export const validateUser = (user: User): ValidationResult => {
  const errors: string[] = [];
  
  if (!user.email) {
    errors.push('이메일은 필수입니다');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// UI는 컴포넌트에서 처리
const handleValidate = () => {
  const result = validateUser(user);
  
  if (!result.valid) {
    showToast(result.errors[0]);  // UI 처리
    return;
  }
  
  showToast('검증 완료');
};
```

### ❌ 금지 3: API 호출

```typescript
// ❌ 잘못됨
export const saveUser = async (user: User) => {
  // 검증
  if (!user.email) {
    throw new Error('Email required');
  }
  
  // API 호출 ❌
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  
  return user;
};

// ✅ 올바름
// logic/user/userValidator.ts
export const validateUser = (user: User): ValidationResult => {
  const errors: string[] = [];
  if (!user.email) {
    errors.push('Email required');
  }
  return { valid: errors.length === 0, errors };
};

// api/user.api.ts
export const saveUser = async (user: User): Promise<User> => {
  const response = await apiClient.post('/users', user);
  return response.data;
};

// components/user-form.tsx
const handleSave = async () => {
  const validation = validateUser(user);
  if (!validation.valid) {
    showToast(validation.errors[0]);
    return;
  }
  
  await saveUser(user);
};
```

### ❌ 금지 4: 외부 의존성

```typescript
// ❌ 잘못됨
export const calculateDiscount = (price: number) => {
  const rate = localStorage.getItem('discountRate');  // 외부 의존 ❌
  return price * Number(rate);
};

export const getTodayDiscount = (price: number) => {
  const today = new Date().getDay();  // 시간 의존 ❌
  const rate = today === 0 ? 0.2 : 0.1;  // 일요일 20% 할인
  return price * rate;
};

// ✅ 올바름
export const calculateDiscount = (price: number, discountRate: number): number => {
  return price * discountRate;
};

export const getDiscountRate = (dayOfWeek: number): number => {
  return dayOfWeek === 0 ? 0.2 : 0.1;
};

// 사용
const today = new Date().getDay();
const rate = getDiscountRate(today);
const discounted = calculateDiscount(price, rate);
```

---

## 파일 구조 규칙

### 디렉토리 구조

```
logic/
├── user/                        # 사용자 도메인
│   ├── userValidator.ts         # 검증 로직
│   ├── userValidator.test.ts
│   ├── userFormatter.ts         # 포맷팅 로직
│   ├── userFormatter.test.ts
│   ├── userPermissions.ts       # 권한 로직
│   └── userPermissions.test.ts
│
├── order/                       # 주문 도메인
│   ├── orderCalculator.ts       # 계산 로직
│   ├── orderCalculator.test.ts
│   ├── orderValidator.ts        # 검증 로직
│   ├── orderValidator.test.ts
│   ├── orderStatus.ts           # 상태 머신
│   └── orderStatus.test.ts
│
├── product/                     # 상품 도메인
│   ├── productPricing.ts        # 가격 로직
│   ├── productPricing.test.ts
│   ├── productStock.ts          # 재고 로직
│   └── productStock.test.ts
│
├── payment/                     # 결제 도메인
│   ├── paymentProcessor.ts      # 결제 처리
│   ├── paymentProcessor.test.ts
│   ├── paymentValidator.ts      # 결제 검증
│   └── paymentValidator.test.ts
│
└── shared/                      # 공통 로직
    ├── dateUtils.ts
    ├── dateUtils.test.ts
    ├── validators.ts
    ├── validators.test.ts
    ├── formatters.ts
    └── formatters.test.ts
```

### 파일 구성 원칙

1. **도메인별 분리** - 각 도메인은 독립된 폴더
2. **역할별 분리** - Calculator, Validator, Formatter 등
3. **테스트 병치** - 같은 폴더에 `.test.ts` 파일
4. **공통 로직 분리** - `shared/` 폴더

---

## 네이밍 규칙

### 파일명

```
[도메인명][역할].ts

예시:
- userValidator.ts       # 사용자 검증
- orderCalculator.ts     # 주문 계산
- productPricing.ts      # 상품 가격
- paymentProcessor.ts    # 결제 처리
- orderStatus.ts         # 주문 상태
- userPermissions.ts     # 사용자 권한
```

### 함수명

```typescript
// 동사 + 명사 (camelCase)

// 계산
calculateTotal()
calculateDiscount()
calculateTax()

// 검증
validateUser()
validateEmail()
isValidPassword()

// 변환
formatPhoneNumber()
formatCurrency()
parseDate()

// 확인/체크
canCancelOrder()
isEligibleForDiscount()
hasPermission()

// 상태 전이
transitionStatus()
canTransitionTo()

// 조회
getDiscountRate()
getStatusLabel()
```

### 상수명

```typescript
// UPPER_SNAKE_CASE
export const TAX_RATE = 0.1;
export const SHIPPING_FEE = 3000;
export const FREE_SHIPPING_THRESHOLD = 50000;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_QUANTITY_PER_ITEM = 99;

// 열거형
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
} as const;
```

---

## 도메인 패턴

### 1. Calculator (계산 로직)

```typescript
// logic/order/orderCalculator.ts
import type { Order, OrderItem } from '@/types/order.types';
import { TAX_RATE, SHIPPING_FEE } from '@/constants/order';

/**
 * 항목 총액을 계산합니다
 */
export const calculateItemTotal = (item: OrderItem): number => {
  return item.price * item.quantity;
};

/**
 * 주문 소계를 계산합니다
 */
export const calculateSubtotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};

/**
 * 세금을 계산합니다
 */
export const calculateTax = (subtotal: number): number => {
  return Math.round(subtotal * TAX_RATE);
};

/**
 * 배송비를 계산합니다
 * 비즈니스 규칙: 50,000원 이상 무료 배송
 */
export const calculateShipping = (subtotal: number): number => {
  return subtotal >= 50000 ? 0 : SHIPPING_FEE;
};

/**
 * 주문 최종 금액을 계산합니다
 */
export const calculateOrderTotal = (order: Order): number => {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  const shipping = calculateShipping(subtotal);
  return subtotal + tax + shipping;
};
```

### 2. Validator (검증 로직)

```typescript
// logic/user/userValidator.ts
import type { User } from '@/types/user.types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 이메일 형식을 검증합니다
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 강도를 검증합니다
 * 비즈니스 규칙: 8자 이상, 영문+숫자+특수문자
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  return hasLetter && hasNumber && hasSpecial;
};

/**
 * 사용자 정보를 검증합니다
 */
export const validateUser = (user: Partial<User>): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!user.name) {
    errors.push({ field: 'name', message: '이름은 필수입니다' });
  }
  
  if (!user.email) {
    errors.push({ field: 'email', message: '이메일은 필수입니다' });
  } else if (!isValidEmail(user.email)) {
    errors.push({ field: 'email', message: '올바른 이메일 형식이 아닙니다' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
```

### 3. Formatter (변환 로직)

```typescript
// logic/user/userFormatter.ts
import type { User } from '@/types/user.types';

/**
 * 전화번호를 포맷팅합니다
 * 예: 01012345678 → 010-1234-5678
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * 사용자 이름을 포맷팅합니다
 */
export const formatUserName = (user: Pick<User, 'lastName' | 'firstName'>): string => {
  return `${user.lastName} ${user.firstName}`;
};

/**
 * 금액을 포맷팅합니다
 * 예: 10000 → "10,000원"
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ko-KR')}원`;
};
```

### 4. Status (상태 머신)

```typescript
// logic/order/orderStatus.ts
import type { OrderStatus } from '@/types/order.types';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

/**
 * 주문 상태 전이가 가능한지 확인합니다
 */
export const canTransitionTo = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean => {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  };
  
  return transitions[currentStatus]?.includes(nextStatus) ?? false;
};

/**
 * 주문 취소가 가능한지 확인합니다
 * 비즈니스 규칙: 배송 전까지만 취소 가능
 */
export const canCancelOrder = (status: OrderStatus): boolean => {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
  ].includes(status);
};
```

### 5. Permissions (권한 로직)

```typescript
// logic/user/userPermissions.ts
import type { User, UserRole } from '@/types/user.types';

/**
 * 사용자가 리소스를 수정할 권한이 있는지 확인합니다
 */
export const canEditResource = (
  user: User,
  resourceOwnerId: string
): boolean => {
  // 관리자는 모든 리소스 수정 가능
  if (user.role === 'admin') return true;
  
  // 소유자만 수정 가능
  return user.id === resourceOwnerId;
};

/**
 * 사용자가 특정 기능에 접근할 권한이 있는지 확인합니다
 */
export const hasFeatureAccess = (
  user: User,
  feature: string
): boolean => {
  const featurePermissions: Record<string, UserRole[]> = {
    'analytics': ['admin', 'manager'],
    'user_management': ['admin'],
    'export_data': ['admin', 'manager'],
    'view_reports': ['admin', 'manager', 'user'],
  };
  
  const allowedRoles = featurePermissions[feature] || [];
  return allowedRoles.includes(user.role);
};
```

---

## 타입 정의 규칙

### 원칙: 모든 함수는 명확한 타입

```typescript
// ❌ 금지: any 타입
export const calculateTotal = (items: any): any => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// ✅ 필수: 명확한 타입
export const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};
```

### 입력/출력 타입

```typescript
// types/order.types.ts

// 엔티티
export interface Order {
  id: string;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

// 계산 결과
export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

// 검증 결과
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// 상태
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
```

---

## 테스트 규칙

### 원칙: 테스트 커버리지 80% 이상 필수

**비즈니스 로직은 반드시 테스트가 필요합니다.**

### 테스트 구조

```typescript
// logic/order/orderCalculator.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  calculateItemTotal,
  calculateSubtotal,
  calculateShipping,
  calculateOrderTotal,
} from './orderCalculator';

describe('orderCalculator', () => {
  describe('calculateItemTotal', () => {
    it('항목 총액을 계산한다', () => {
      const item = { productId: '1', price: 10000, quantity: 2 };
      expect(calculateItemTotal(item)).toBe(20000);
    });
    
    it('수량이 0이면 0을 반환한다', () => {
      const item = { productId: '1', price: 10000, quantity: 0 };
      expect(calculateItemTotal(item)).toBe(0);
    });
  });
  
  describe('calculateShipping', () => {
    it('50,000원 미만이면 배송비를 부과한다', () => {
      expect(calculateShipping(40000)).toBe(3000);
    });
    
    it('50,000원 이상이면 무료다', () => {
      expect(calculateShipping(50000)).toBe(0);
      expect(calculateShipping(60000)).toBe(0);
    });
    
    it('경계값을 정확히 처리한다', () => {
      expect(calculateShipping(49999)).toBe(3000);
      expect(calculateShipping(50000)).toBe(0);
    });
  });
});
```

### 테스트 커버리지 항목

- [ ] **정상 케이스** - 일반적인 입력
- [ ] **엣지 케이스** - 0, 빈 배열, null/undefined
- [ ] **경계값** - 최소/최대 값
- [ ] **에러 케이스** - 잘못된 입력
- [ ] **비즈니스 규칙** - 모든 조건 분기

---

## 복잡도 관리

### 원칙: 단순하고 명확하게

**복잡도 기준:**
- **Cyclomatic Complexity < 10** (분기 복잡도)
- **중첩 깊이 < 3** (if 중첩)
- **함수 길이 < 30줄**

### 복잡도 개선

```typescript
// ❌ 높은 복잡도
export const processOrder = (order: Order): ProcessResult => {
  if (order.items.length > 0) {
    let total = 0;
    for (const item of order.items) {
      if (item.quantity > 0) {
        if (item.price > 0) {
          total += item.price * item.quantity;
          if (total > 100000) {
            if (order.customerType === 'VIP') {
              total *= 0.9;
            } else if (order.customerType === 'REGULAR') {
              total *= 0.95;
            }
          }
        }
      }
    }
    return { success: true, total };
  }
  return { success: false, total: 0 };
};

// ✅ 낮은 복잡도
export const calculateSubtotal = (items: OrderItem[]): number => {
  return items
    .filter(item => item.quantity > 0 && item.price > 0)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const applyDiscount = (
  total: number,
  customerType: CustomerType
): number => {
  if (total < 100000) return total;
  
  const discountRates: Record<CustomerType, number> = {
    VIP: 0.9,
    REGULAR: 0.95,
    NORMAL: 1.0,
  };
  
  return total * discountRates[customerType];
};

export const processOrder = (order: Order): ProcessResult => {
  if (order.items.length === 0) {
    return { success: false, total: 0 };
  }
  
  const subtotal = calculateSubtotal(order.items);
  const total = applyDiscount(subtotal, order.customerType);
  
  return { success: true, total };
};
```

---

## ✅ 준수 체크리스트

### Critical Check (필수)

**순수 함수:**
- [ ] 동일 입력 → 동일 출력
- [ ] 외부 상태 변경 없음
- [ ] 외부 상태 의존 없음
- [ ] 부작용 없음

**불변성:**
- [ ] 배열/객체 변경 없음
- [ ] 새로운 값 반환

**레이어 책임:**
- [ ] UI 코드 없음
- [ ] API 호출 없음
- [ ] 전역 상태 변경 없음

**타입 정의:**
- [ ] 입력 타입 명시
- [ ] 출력 타입 명시

**테스트:**
- [ ] 테스트 코드 작성
- [ ] 커버리지 80% 이상

### Quality Check (권장)

**복잡도:**
- [ ] Cyclomatic Complexity < 10
- [ ] 중첩 깊이 < 3
- [ ] 함수 길이 < 30줄

**설계:**
- [ ] 단일 책임 원칙
- [ ] 명확한 함수명
- [ ] 도메인 용어 사용

**문서화:**
- [ ] JSDoc 주석
- [ ] 비즈니스 규칙 명시
- [ ] 예제 포함

---

## 📝 참고 사항

### 이 규칙을 위반하면

- ❌ 테스트 작성 어려움
- ❌ 버그 발생 가능성 증가
- ❌ 예측 불가능한 동작
- ❌ 코드 재사용 불가

### 이 규칙을 준수하면

- ✅ 쉬운 테스트 작성
- ✅ 예측 가능한 동작
- ✅ 높은 재사용성
- ✅ 유지보수 용이