# 컴포넌트 레이어 공통 규칙

> 컴포넌트 레이어 개발 및 리뷰 시 공통으로 적용되는 핵심 규칙

**이 문서를 참조하는 파일:**
- `specialists/component-dev.md` - 컴포넌트 개발 가이드
- `specialists/component-review.md` - 컴포넌트 리뷰 가이드

---

## 📋 목차
1. [핵심 원칙](#핵심-원칙)
2. [컴포넌트 제약사항](#컴포넌트-제약사항)
3. [3계층 아키텍처](#3계층-아키텍처)
4. [React 패턴](#react-패턴)
5. [Custom Hooks 규칙](#custom-hooks-규칙)
6. [상태 관리 규칙](#상태-관리-규칙)
7. [파일 구조 규칙](#파일-구조-규칙)
8. [네이밍 규칙](#네이밍-규칙)
9. [금지 사항](#금지-사항)
10. [테스트 규칙](#테스트-규칙)

---

## 핵심 원칙

### 컴포넌트 레이어의 단일 책임

```
컴포넌트 레이어 = UI 렌더링 + 사용자 상호작용
```

**핵심 규칙:**
- ✅ 명확한 계층 분리 (UI, 비즈니스, 페이지)
- ✅ 재사용 가능한 UI 컴포넌트
- ✅ 단일 책임 원칙
- ❌ 비즈니스 로직 포함 금지 (별도 파일)
- ❌ API 호출 포함 금지 (Custom Hook에서)
- ❌ 복잡한 계산 금지 (별도 파일)

---

## 컴포넌트 제약사항

### 코드 길이 제한

**React Native 줄 수 계산:**
```
총 줄 수 - StyleSheet 줄 수 = 실제 컴포넌트 줄 수

예시:
총 364줄 - StyleSheet 100줄 = 264줄 (❌ 100줄 초과)
총 180줄 - StyleSheet 100줄 = 80줄 (✅ 100줄 이하)
```

| 항목 | 제한 | 비고 |
|-----|------|------|
| **컴포넌트 줄 수** | 100줄 | StyleSheet 제외 |
| **함수 길이** | 30줄 | 단일 함수 최대 |
| **useState** | 3개 | 초과 시 Custom Hook |
| **useEffect** | 2개 | 초과 시 Custom Hook |
| **useMemo** | 0개 | 첫 구현 시 금지 |
| **useCallback** | 0개 | 첫 구현 시 금지 |
| **StyleSheet 규칙** | 20개 | React Native |

### Hook 개수 제한

```typescript
// ❌ 금지: useState 3개 초과
const Component = () => {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  const [state3, setState3] = useState();
  const [state4, setState4] = useState();  // ❌ 4개 초과
};

// ✅ 올바름: Custom Hook으로 그룹화
const useFormState = () => {
  const [formData, setFormData] = useState();
  const [errors, setErrors] = useState();
  const [isSubmitting, setIsSubmitting] = useState();
  
  return { formData, errors, isSubmitting, setFormData, setErrors, setIsSubmitting };
};

const Component = () => {
  const formState = useFormState();  // ✅ 1개의 Hook으로
};
```

```typescript
// ❌ 금지: useEffect 2개 초과
const Component = () => {
  useEffect(() => { /* effect 1 */ }, []);
  useEffect(() => { /* effect 2 */ }, []);
  useEffect(() => { /* effect 3 */ }, []);  // ❌ 3개 초과
};

// ✅ 올바름: Custom Hook으로 분리
const useDataFetching = () => {
  useEffect(() => {
    // 관련된 effect들을 하나로 통합
  }, []);
};

const Component = () => {
  useDataFetching();  // ✅ Custom Hook 사용
  useEffect(() => { /* 다른 effect */ }, []);  // 총 2개
};
```

### useMemo/useCallback 금지 (첫 구현)

```typescript
// ❌ 금지: 첫 구현에서 성능 최적화
const Component = ({ items }: Props) => {
  const filteredItems = useMemo(() => {  // ❌ 첫 구현부터 최적화 금지
    return items.filter(item => item.active);
  }, [items]);
  
  const handleClick = useCallback(() => {  // ❌ 첫 구현부터 최적화 금지
    console.log('clicked');
  }, []);
  
  return <List items={filteredItems} onClick={handleClick} />;
};

// ✅ 올바름: 단순하게 먼저 작성
const Component = ({ items }: Props) => {
  const filteredItems = items.filter(item => item.active);  // ✅ 단순하게
  
  const handleClick = () => {  // ✅ 단순하게
    console.log('clicked');
  };
  
  return <List items={filteredItems} onClick={handleClick} />;
};

// 성능 문제가 실제로 발생하면 그때 최적화
```

### StyleSheet 제한 (React Native)

```typescript
// ❌ 금지: StyleSheet 20개 초과
const styles = StyleSheet.create({
  container: { ... },
  header: { ... },
  title: { ... },
  subtitle: { ... },
  content: { ... },
  footer: { ... },
  button: { ... },
  input: { ... },
  label: { ... },
  error: { ... },
  // ... 21개 이상 ❌
});

// ✅ 올바름: 컴포넌트 분리
// components/ui/header.tsx
const headerStyles = StyleSheet.create({
  container: { ... },
  title: { ... },
  subtitle: { ... },
  // 5개 ✅
});

// components/ui/form.tsx
const formStyles = StyleSheet.create({
  container: { ... },
  input: { ... },
  label: { ... },
  button: { ... },
  error: { ... },
  // 5개 ✅
});
```

---

## 3계층 아키텍처

### 계층 구조

```
┌─────────────────────────────────────┐
│         Page (레이아웃만)            │
│   - 훅 호출 금지                     │
│   - 핸들러 정의 금지                 │
│   - 비즈니스 컴포넌트 배치           │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Business Component (로직 + UI)   │
│   - 도메인명 + Section/Container    │
│   - 내부에서 훅 호출                │
│   - 여러 UI 컴포넌트 조합           │
│   - Props 최소화 (0-2개)            │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      UI Component (렌더링만)        │
│   - 범용 이름 (비즈니스 도메인 없음)│
│   - Props로만 동작                  │
│   - 훅 호출 금지                    │
│   - 재사용 가능                     │
└─────────────────────────────────────┘
```

### Layer 1: UI 컴포넌트

**특징:**
- 범용 이름 사용 (`Form`, `Button`, `Card`, `List`)
- 비즈니스 도메인 이름 금지
- Props로만 동작
- 훅 호출 금지
- 재사용 가능

| ✅ 올바른 이름 | ❌ 잘못된 이름 |
|--------------|--------------|
| `Form` | `TransactionForm` |
| `Button` | `SubmitButton` |
| `Card` | `UserCard` |
| `List` | `ProductList` |
| `Input` | `EmailInput` |
| `Modal` | `ConfirmModal` |

```typescript
// ✅ 올바른 UI 컴포넌트
// components/ui/form.tsx
interface FormProps<T> {
  onSubmit: (data: T) => void;
  initialValues?: T;
  isSubmitting?: boolean;
  children?: React.ReactNode;
}

export const Form = <T,>({ 
  onSubmit, 
  initialValues, 
  isSubmitting = false,
  children 
}: FormProps<T>) => {
  // ✅ Props로만 동작
  // ❌ 훅 호출 없음
  
  return (
    <View style={styles.container}>
      {children}
      <Button 
        title={isSubmitting ? '저장 중...' : '저장'}
        onPress={() => onSubmit(initialValues as T)}
        disabled={isSubmitting}
      />
    </View>
  );
};
```

```typescript
// ❌ 잘못된 예: 비즈니스 도메인 이름
// components/transaction-form.tsx
export const TransactionForm = ({ onSubmit }: Props) => {
  // Transaction = 비즈니스 도메인 ❌
  return <View>...</View>;
};

// components/user-card.tsx
export const UserCard = ({ user }: Props) => {
  // User = 비즈니스 도메인 ❌
  return <View>...</View>;
};
```

### Layer 2: 비즈니스 컴포넌트

**특징:**
- 도메인명 + Section 또는 Container
- 내부에서 훅 호출
- 여러 UI 컴포넌트 조합
- Props 최소화 (0-2개 권장)
- 조건부 렌더링 포함

```typescript
// ✅ 올바른 비즈니스 컴포넌트
// components/user-profile-section.tsx
interface UserProfileSectionProps {
  userId?: string;  // Props 최소화
}

export const UserProfileSection = ({ userId }: UserProfileSectionProps) => {
  // ✅ 내부에서 훅 호출
  const { user, isLoading, error, handleEdit } = useUserProfile(userId);
  
  // ✅ 비즈니스 로직 사용
  const displayName = user ? formatUserName(user) : '';
  const displayPhone = user ? formatPhoneNumber(user.phone) : '';
  
  // ✅ 조건부 렌더링
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <EmptyState message="사용자를 찾을 수 없습니다" />;
  
  // ✅ 여러 UI 컴포넌트 조합
  return (
    <View style={styles.container}>
      <Card
        title="사용자 정보"
        content={
          <View>
            <Text>이름: {displayName}</Text>
            <Text>전화번호: {displayPhone}</Text>
          </View>
        }
        footer={<Button title="수정" onPress={handleEdit} />}
      />
    </View>
  );
};
```

```typescript
// ❌ 잘못된 예 1: Section인데 Props로만 동작
interface UserProfileSectionProps {
  user: User;
  onEdit: () => void;
  // Props가 많음 - 실제로는 UI 컴포넌트처럼 동작
}

export const UserProfileSection = ({ user, onEdit }: UserProfileSectionProps) => {
  // ❌ 훅 호출 없음
  // Section 이름인데 실제로는 UI 컴포넌트
  return <Card title="사용자 정보" ... />;
};

// ❌ 잘못된 예 2: 단순 래퍼
export const UserProfileSection = () => {
  const { user } = useUserProfile();
  
  // ❌ 단순히 하나의 UI만 렌더링
  return <UserCard user={user} />;
};
```

### Layer 3: 페이지 컴포넌트

**특징:**
- 라우트명 + Page
- 레이아웃만 담당
- 훅 호출 금지
- 핸들러 정의 금지
- 비즈니스 컴포넌트 배치만

```typescript
// ✅ 올바른 페이지 컴포넌트
// app/index.tsx
export default function IndexPage() {
  // ❌ 훅 호출 없음
  // ❌ 핸들러 정의 없음
  // ✅ 레이아웃만
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>주문 관리</Text>
        </View>
        
        {/* 비즈니스 컴포넌트 배치 */}
        <View style={styles.content}>
          <UserProfileSection />
          <OrderFormSection />
          <OrderSummarySection />
          <OrderListSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { gap: 16 },
});
```

```typescript
// ❌ 잘못된 페이지 컴포넌트
export default function IndexPage() {
  // ❌ 페이지에서 훅 호출 금지
  const { data, handleSubmit } = useOrderData();
  const { filters } = useOrderFilters();
  
  // ❌ 페이지에서 핸들러 정의 금지
  const handleEdit = (id: string) => { ... };
  const handleDelete = (id: string) => { ... };
  
  return (
    <SafeAreaView>
      {/* ❌ Props 드릴링 */}
      <OrderForm onSubmit={handleSubmit} />
      <OrderFilters filters={filters} />
      <OrderList 
        items={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
```

---

## React 패턴

### Zustand 패턴 (React Native)

**원칙: persist 미들웨어 사용 필수**

```typescript
// ❌ 금지: AsyncStorage 직접 사용
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create((set) => ({
  user: null,
  save: async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));  // ❌ 직접 사용 금지
    set({ user });
  }
}));
```

```typescript
// ✅ 필수: persist 미들웨어 사용
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      
      setUser: (user) => set({ user }),
      
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Store 구조

```typescript
// stores/orderStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order, Category } from '@/types/order.types';

interface OrderStore {
  // State
  orders: Order[];
  categories: Category[];
  
  // Actions
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Order) => void;
  deleteOrder: (id: string) => void;
  setCategories: (categories: Category[]) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      // Initial State
      orders: [],
      categories: [],
      
      // Actions (불변성 유지)
      addOrder: (order) => 
        set((state) => ({ 
          orders: [...state.orders, order] 
        })),
      
      updateOrder: (id, order) =>
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? order : o)
        })),
      
      deleteOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter(o => o.id !== id)
        })),
      
      setCategories: (categories) =>
        set({ categories }),
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### React 안티패턴

**❌ 금지 1: formSeed 패턴**
```typescript
// ❌ key를 변경해서 강제 리렌더링
const Component = () => {
  const [seed, setSeed] = useState(0);
  
  const resetForm = () => {
    setSeed(prev => prev + 1);  // 안티패턴
  };
  
  return <Form key={seed} />;
};
```

**✅ 올바른 패턴: 명시적 리셋**
```typescript
// ✅ ref로 직접 제어
const Component = () => {
  const formRef = useRef<FormRef>(null);
  
  const resetForm = () => {
    formRef.current?.reset();
  };
  
  return <Form ref={formRef} />;
};

// 또는 상태로 제어
const Component = () => {
  const [formData, setFormData] = useState(initialData);
  
  const resetForm = () => {
    setFormData(initialData);
  };
  
  return <Form data={formData} onChange={setFormData} />;
};
```

**❌ 금지 2: JSX.Element 타입 명시**
```typescript
// ❌ 불필요한 타입 명시
const Component = (): JSX.Element => {
  return <View />;
};
```

**✅ 올바른 패턴: 타입 생략**
```typescript
// ✅ 타입 추론 활용
const Component = () => {
  return <View />;
};

// Props가 있는 경우만 명시
interface ComponentProps {
  title: string;
}

const Component = ({ title }: ComponentProps) => {
  return <View><Text>{title}</Text></View>;
};
```

---

## Custom Hooks 규칙

### 원칙: 역할별 분리, 단일 책임

**네이밍 규칙:**
```
use-[domain]-[purpose].ts

예시:
- use-user-profile.ts
- use-order-form-state.ts
- use-transaction-filters.ts
- use-product-list.ts
```

**❌ 금지: use-XXX-page 패턴**
```typescript
// ❌ 금지: 모든 것을 한 훅에
// hooks/use-order-page.ts
export const useOrderPage = () => {
  // 폼 상태
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState();
  
  // 필터 상태
  const [filters, setFilters] = useState();
  
  // 리스트 상태
  const [selectedId, setSelectedId] = useState();
  
  // 너무 많은 책임 ❌
  const handleSubmit = () => { ... };
  const handleCategoryChange = () => { ... };
  const handleSelect = () => { ... };
  const handleEdit = () => { ... };
  const handleDelete = () => { ... };
  
  return { /* 모든 것 */ };
};
```

**✅ 올바름: 역할별 분리**
```typescript
// hooks/use-order-form-state.ts
// 책임: 폼 상태 관리만
export const useOrderFormState = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Order | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleSubmit = async (data: Order) => {
    setIsSaving(true);
    setErrors([]);
    
    try {
      if (formData?.id) {
        await updateOrder(formData.id, data);
      } else {
        await saveOrder(data);
      }
      setFormData(null);
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEdit = (order: Order) => {
    setFormData(order);
  };
  
  const handleCancel = () => {
    setFormData(null);
    setErrors([]);
  };
  
  return {
    formData,
    isSaving,
    errors,
    handleSubmit,
    handleEdit,
    handleCancel,
    setFormData,
  };
};
```

```typescript
// hooks/use-order-filters.ts
// 책임: 필터 상태 관리만
export const useOrderFilters = () => {
  const [filters, setFilters] = useState<OrderFilters>({
    category: 'all',
    period: 'all',
    status: 'all',
  });
  
  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };
  
  const handlePeriodChange = (period: string) => {
    setFilters(prev => ({ ...prev, period }));
  };
  
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
  };
  
  const resetFilters = () => {
    setFilters({ category: 'all', period: 'all', status: 'all' });
  };
  
  return {
    filters,
    handleCategoryChange,
    handlePeriodChange,
    handleStatusChange,
    resetFilters,
  };
};
```

### Custom Hook 템플릿

```typescript
// hooks/use-[domain]-[purpose].ts
import { useState, useEffect } from 'react';

/**
 * [훅의 목적을 설명]
 * 
 * @example
 * const { data, loading, error, refetch } = useUserData(userId);
 */
export const useUserData = (userId: string) => {
  // 1. 상태 정의 (3개 이하)
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 2. Effect (2개 이하)
  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId]);
  
  // 3. 핸들러 함수들
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUser(userId);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  const refetch = () => {
    fetchData();
  };
  
  // 4. 명확한 인터페이스로 반환
  return {
    data,
    loading,
    error,
    refetch,
  };
};
```

### Form Hook 패턴

**원칙: 개별 setter 대신 공통 setter 사용**

**❌ 잘못된 패턴: 필드마다 개별 함수**
```typescript
export function useOrderForm() {
  const [formData, setFormData] = useState<OrderFormState>(initialState);
  
  // ❌ 필드가 늘어날수록 반복 코드 증가
  const setOrderNumber = (value: string) => {
    setFormData((prev) => ({ ...prev, orderNumber: value }));
    clearError('orderNumber');
  };

  const setDeliveryAddress = (value: string) => {
    setFormData((prev) => ({ ...prev, deliveryAddress: value }));
    clearError('deliveryAddress');
  };

  const setShopName = (value: string) => {
    setFormData((prev) => ({ ...prev, shopName: value }));
  };
  
  const setMemo = (value: string) => {
    setFormData((prev) => ({ ...prev, memo: value }));
  };
  
  // 필드 10개면 함수 10개...
  
  return {
    formData,
    setOrderNumber,
    setDeliveryAddress,
    setShopName,
    setMemo,
    // ...
  };
}
```

**✅ 정상 패턴: 객체 타입의 상태는 공통 setter로**
```typescript
export function useOrderForm() {
  const [formData, setFormData] = useState<OrderFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ✅ 타입 안전한 공통 setter
  const setField = <K extends keyof OrderFormState>(
    field: K,
    value: OrderFormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };
  
  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  
  return {
    formData,
    errors,
    setField,  // 하나의 함수로 모든 필드 처리
    clearError,
  };
}
```

**✅ 정상 패턴 setter 사용 예시**
```jsx
const OrderFormSection = () => {
  const { formData, setField } = useOrderForm();
  
  return (
    <View>
      <Input
        label="주문번호"
        value={formData.orderNumber}
        onChangeText={(value) => setField('orderNumber', value)}
      />
      
      <Input
        label="배송지"
        value={formData.deliveryAddress}
        onChangeText={(value) => setField('deliveryAddress', value)}
      />
      
      <Input
        label="쇼핑몰"
        value={formData.shopName}
        onChangeText={(value) => setField('shopName', value)}
      />
      
      <Input
        label="메모"
        value={formData.memo}
        onChangeText={(value) => setField('memo', value)}
      />
    </View>
  );
};
```

---

## 상태 관리 규칙

### 원칙: 독립적 상태 → 별도 컴포넌트

**상태 연관성 판단:**

```typescript
// 1단계: 모든 상태 나열
const [formData, setFormData] = useState();        // 상태 1
const [errors, setErrors] = useState();            // 상태 2
const [isSaving, setIsSaving] = useState();        // 상태 3
const [filters, setFilters] = useState();          // 상태 4
const [selectedId, setSelectedId] = useState();    // 상태 5

// 2단계: 연관성 분석
// 그룹 A (폼 관련): formData, errors, isSaving
//   → 서로 연관됨 (한 컴포넌트 OK)
// 그룹 B (필터 관련): filters
//   → 독립적 (별도 컴포넌트 필요)
// 그룹 C (선택 관련): selectedId
//   → 독립적 (별도 컴포넌트 필요)

// 3단계: 판정
// 독립적 그룹 3개 → ❌ 컴포넌트 분리 필요
```

**✅ 연관된 상태 (같은 컴포넌트 OK)**
```typescript
const Component = () => {
  // 폼 관련 - 서로 연관된 상태들
  const [formData, setFormData] = useState();
  const [errors, setErrors] = useState();           // formData와 연관
  const [isSubmitting, setIsSubmitting] = useState(); // formData와 연관
  
  // 3개지만 모두 연관되어 있으므로 OK ✅
  return <Form ... />;
};
```

**❌ 독립적 상태 (별도 컴포넌트 필요)**
```typescript
const Component = () => {
  // 그룹 1: 폼 관련
  const [formData, setFormData] = useState();
  const [errors, setErrors] = useState();
  const [isSaving, setIsSaving] = useState();
  
  // 그룹 2: 필터 관련 (폼과 무관)
  const [filters, setFilters] = useState();
  
  // 그룹 3: 선택 관련 (폼, 필터와 무관)
  const [selectedId, setSelectedId] = useState();
  
  // 독립적 그룹 3개 → ❌ 분리 필요
  return <>...</>;
};

// ✅ 올바른 분리
const FormSection = () => {
  const [formData, setFormData] = useState();
  const [errors, setErrors] = useState();
  const [isSaving, setIsSaving] = useState();
  return <Form ... />;
};

const FiltersSection = () => {
  const [filters, setFilters] = useState();
  return <Filters ... />;
};

const ListSection = () => {
  const [selectedId, setSelectedId] = useState();
  return <List ... />;
};
```

### 상태 판단 기준

```typescript
// 연관성 판단 질문
// Q1: 상태 A가 변경될 때 상태 B도 변경되는가?
// Q2: 상태 A와 B가 같은 기능을 위해 사용되는가?
// Q3: 상태 A와 B 중 하나만 있어도 기능이 동작하는가?

// 예시 1: 연관된 상태
const [formData, setFormData] = useState();
const [errors, setErrors] = useState();
// → formData 변경 시 errors도 변경
// → 같은 폼 기능을 위해 사용
// → 연관됨 ✅

// 예시 2: 독립적 상태
const [formData, setFormData] = useState();
const [filters, setFilters] = useState();
// → formData 변경 시 filters는 무관
// → 다른 기능 (폼 vs 필터)
// → 독립적 ❌
```

---

## 파일 구조 규칙

### 디렉토리 구조

```
components/
├── ui/                              # UI 컴포넌트 (범용)
│   ├── button.tsx
│   ├── form.tsx
│   ├── card.tsx
│   ├── list.tsx
│   ├── modal.tsx
│   └── input.tsx
│
├── user-profile-section.tsx         # 비즈니스 컴포넌트
├── order-form-section.tsx
├── order-list-section.tsx
├── product-card-section.tsx
└── transaction-filters-section.tsx

hooks/
├── use-user-profile.ts
├── use-order-form-state.ts
├── use-order-filters.ts
└── use-transaction-list.ts

stores/
├── userStore.ts
├── orderStore.ts
└── productStore.ts

app/
├── index.tsx                        # 페이지 컴포넌트
├── orders.tsx
└── profile.tsx
```

---

## 네이밍 규칙

### 컴포넌트 파일명

```typescript
// UI 컴포넌트: 범용 이름 (소문자-하이픈)
components/ui/
  button.tsx
  form.tsx
  card.tsx
  list.tsx
  modal.tsx

// 비즈니스 컴포넌트: 도메인-역할-section/container (소문자-하이픈)
components/
  user-profile-section.tsx
  order-form-section.tsx
  product-list-section.tsx
  transaction-filters-container.tsx

// 페이지: 라우트명-page (소문자-하이픈)
app/
  index.tsx
  orders.tsx
  profile.tsx
```

### 컴포넌트 이름

```typescript
// PascalCase
export const Button = () => { ... };
export const Form = () => { ... };
export const UserProfileSection = () => { ... };
export const OrderFormSection = () => { ... };
```

### Custom Hook 이름

```typescript
// use + PascalCase
export const useUserProfile = () => { ... };
export const useOrderFormState = () => { ... };
export const useTransactionFilters = () => { ... };
```

### Store 이름

```typescript
// use + PascalCase + Store
export const useUserStore = create(...);
export const useOrderStore = create(...);
export const useProductStore = create(...);
```

---

## 금지 사항

### ❌ 금지 1: formSeed 패턴

```typescript
// ❌ 잘못됨: key 변경으로 강제 리렌더링
const Component = () => {
  const [seed, setSeed] = useState(0);
  
  const resetForm = () => {
    setSeed(prev => prev + 1);  // 안티패턴 ❌
  };
  
  return <Form key={seed} />;
};

// ✅ 올바름: 명시적 리셋
const Component = () => {
  const formRef = useRef<FormRef>(null);
  
  const resetForm = () => {
    formRef.current?.reset();
  };
  
  return <Form ref={formRef} />;
};

// 또는 상태로 제어
const Component = () => {
  const [formData, setFormData] = useState(initialData);
  
  const resetForm = () => {
    setFormData(initialData);
  };
  
  return <Form data={formData} onChange={setFormData} />;
};
```

### ❌ 금지 2: JSX.Element 타입 명시

```typescript
// ❌ 불필요한 타입 명시
const Component = (): JSX.Element => {
  return <View />;
};

// ✅ 타입 추론 활용
const Component = () => {
  return <View />;
};

// Props가 있는 경우만 명시
interface ComponentProps {
  title: string;
}

const Component = ({ title }: ComponentProps) => {
  return <View><Text>{title}</Text></View>;
};
```

### ❌ 금지 3: 페이지에서 훅 호출

```typescript
// ❌ 잘못됨
const IndexPage = () => {
  const { data, handleClick } = useOrderData();  // ❌ 페이지에서 훅 호출
  
  return <OrderList items={data} onClick={handleClick} />;
};

// ✅ 올바름
const OrderListSection = () => {
  const { data, handleClick } = useOrderData();  // ✅ 비즈니스 컴포넌트에서
  
  return <List items={data} onClick={handleClick} />;
};

const IndexPage = () => {
  return <OrderListSection />;  // ✅ 페이지는 배치만
};
```

### ❌ 금지 4: UI 컴포넌트에 비즈니스 이름

```typescript
// ❌ 잘못됨
const TransactionForm = ({ onSubmit }: Props) => {
  // Transaction = 비즈니스 도메인 ❌
  return <View>...</View>;
};

// ✅ 올바름
const Form = <T,>({ onSubmit }: Props<T>) => {
  // 범용 이름 ✅
  return <View>...</View>;
};

const TransactionFormSection = () => {
  const { handleSubmit } = useTransactionFormState();
  return <Form onSubmit={handleSubmit} />;
};
```

### ❌ 금지 5: Section인데 Props로만 동작

```typescript
// ❌ 잘못됨: Section 이름인데 훅 호출 없음
interface OrderFiltersSectionProps {
  filters: Filters;
  onCategoryChange: (cat: string) => void;
  onPeriodChange: (period: string) => void;
}

const OrderFiltersSection = ({ 
  filters, 
  onCategoryChange, 
  onPeriodChange 
}: OrderFiltersSectionProps) => {
  // ❌ 훅 호출 없음
  // Section 이름인데 실제로는 UI 컴포넌트처럼 동작
  return <FilterChips ... />;
};

// ✅ 올바름: Section이면 내부에서 훅 호출
const OrderFiltersSection = () => {
  // ✅ 내부에서 훅 호출
  const { filters, handleCategoryChange, handlePeriodChange } = useOrderFilters();
  
  return <FilterChips ... />;
};
```

---

## 테스트 규칙

### 컴포넌트 테스트 (React Native)

```typescript
// components/order-form-section.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OrderFormSection } from './order-form-section';
import * as orderApi from '@/api/order.api';

jest.mock('@/api/order.api');

describe('OrderFormSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('폼을 렌더링한다', () => {
    const { getByText, getByPlaceholderText } = render(<OrderFormSection />);
    
    expect(getByText('주문 작성')).toBeTruthy();
    expect(getByPlaceholderText('금액')).toBeTruthy();
  });
  
  it('유효한 데이터로 제출하면 성공한다', async () => {
    const mockSave = jest.spyOn(orderApi, 'saveOrder')
      .mockResolvedValue({ id: '1', amount: 10000 });
    
    const { getByPlaceholderText, getByText } = render(<OrderFormSection />);
    
    fireEvent.changeText(getByPlaceholderText('금액'), '10000');
    fireEvent.press(getByText('저장'));
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
    });
  });
  
  it('빈 값으로 제출하면 에러를 표시한다', async () => {
    const { getByText } = render(<OrderFormSection />);
    
    fireEvent.press(getByText('저장'));
    
    await waitFor(() => {
      expect(getByText('금액은 필수입니다')).toBeTruthy();
    });
  });
});
```

### Custom Hook 테스트

```typescript
// hooks/use-order-form-state.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useOrderFormState } from './use-order-form-state';
import * as orderApi from '@/api/order.api';

jest.mock('@/api/order.api');

describe('useOrderFormState', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useOrderFormState());
    
    expect(result.current.formData).toBeNull();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.errors).toEqual([]);
  });
  
  it('주문을 저장한다', async () => {
    const mockSave = jest.spyOn(orderApi, 'saveOrder')
      .mockResolvedValue({ id: '1' });
    
    const { result } = renderHook(() => useOrderFormState());
    
    await act(async () => {
      await result.current.handleSubmit({ amount: 10000 });
    });
    
    expect(mockSave).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });
});
```

---

## ✅ 준수 체크리스트

### Critical Check (필수)

**제약사항:**
- [ ] 컴포넌트 줄 수: 100줄 이하 (StyleSheet 제외)
- [ ] 함수 길이: 30줄 이하
- [ ] useState: 3개 이하
- [ ] useEffect: 2개 이하
- [ ] useMemo/useCallback: 없음 (첫 구현)
- [ ] StyleSheet 규칙: 20개 이하

**3계층 아키텍처:**
- [ ] UI 컴포넌트: 비즈니스 이름 없음
- [ ] UI 컴포넌트: 훅 호출 없음
- [ ] 비즈니스 컴포넌트: 내부에서 훅 호출
- [ ] 비즈니스 컴포넌트: 여러 UI 조합
- [ ] Section/Container: 훅 호출 있음
- [ ] 페이지: 훅/핸들러 정의 없음

**React 패턴:**
- [ ] Zustand persist 미들웨어 사용
- [ ] formSeed 패턴 없음
- [ ] JSX.Element 타입 명시 없음

**Custom Hooks:**
- [ ] use-XXX-page 패턴 없음
- [ ] 역할별 분리 (단일 책임)

**상태 관리:**
- [ ] 독립적 상태 그룹: 2개 이하

### Quality Check (권장)

- [ ] 테스트 작성
- [ ] 명확한 변수/함수명
- [ ] 적절한 에러 처리
- [ ] 중복 코드 최소화

---

## 📝 참고 사항

### 이 규칙을 위반하면

- ❌ 컴포넌트 재사용 어려움
- ❌ 유지보수 어려움
- ❌ 테스트 작성 어려움
- ❌ 성능 문제 발생 가능

### 이 규칙을 준수하면

- ✅ 명확한 책임 분리
- ✅ 높은 재사용성
- ✅ 쉬운 테스트
- ✅ 일관된 코드 품질