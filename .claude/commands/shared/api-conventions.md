# API 레이어 공통 규칙

> API 레이어 개발 및 리뷰 시 공통으로 적용되는 핵심 규칙

**이 문서를 참조하는 파일:**
- `specialists/api-dev.md` - API 개발 가이드
- `specialists/api-review.md` - API 리뷰 가이드

---

## 📋 목차
1. [핵심 원칙](#핵심-원칙)
2. [레이어 책임](#레이어-책임)
3. [금지 사항](#금지-사항)
4. [타입 정의 규칙](#타입-정의-규칙)
5. [에러 핸들링 규칙](#에러-핸들링-규칙)
6. [파일 구조 규칙](#파일-구조-규칙)
7. [네이밍 규칙](#네이밍-규칙)
8. [RESTful 원칙](#restful-원칙)
9. [기본 템플릿](#기본-템플릿)

---

## 핵심 원칙

### API 레이어의 단일 책임

```
API 레이어 = 데이터 통신만 담당
```

**핵심 규칙:**
- ✅ HTTP 요청/응답 처리
- ✅ 에러 핸들링
- ✅ 타입 정의
- ❌ 비즈니스 로직 (계산, 검증, 변환)
- ❌ UI 관련 코드
- ❌ 전역 상태 직접 변경

---

## 레이어 책임

### API 레이어가 해야 할 일

| 책임 | 설명 | 예시 |
|------|------|------|
| HTTP 통신 | 서버와의 데이터 송수신 | `GET`, `POST`, `PUT`, `DELETE` |
| 에러 핸들링 | HTTP 에러 처리 | `404`, `500` 에러 처리 |
| 타임아웃 | 요청 시간 제한 | 5초 타임아웃 설정 |
| 재시도 | 실패 시 재시도 로직 | 네트워크 에러 시 3회 재시도 |
| 인증 처리 | 토큰 헤더 추가 | `Authorization: Bearer token` |
| 직렬화/역직렬화 | JSON 변환 | `JSON.stringify()`, `response.json()` |

### API 레이어가 하면 안 되는 일

| 금지 | 이유 | 올바른 위치 |
|------|------|-------------|
| 계산 로직 | 비즈니스 로직 | `logic/` 폴더 |
| 검증 로직 | 비즈니스 로직 | `logic/` 폴더 |
| 데이터 변환 | 비즈니스 로직 | `logic/` 폴더 |
| UI 렌더링 | 표현 계층 | `components/` 폴더 |
| 상태 관리 | 상태 계층 | `store/` 또는 `context/` |
| 라우팅 | 네비게이션 계층 | `navigation/` |

---

## 금지 사항

### ❌ 금지 1: 비즈니스 로직 포함

```typescript
// ❌ 잘못된 예
export const saveOrder = async (order: Order) => {
  // ❌ 계산 로직 (비즈니스 로직)
  const total = order.items.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  ) * 1.1; // 세금 계산
  
  // ❌ 검증 로직 (비즈니스 로직)
  if (!order.customerName) {
    throw new Error('고객명은 필수입니다');
  }
  
  // API 호출
  return apiClient.post('/orders', { ...order, total });
};

// ✅ 올바른 예
export const saveOrder = async (order: Order): Promise<Order> => {
  // 데이터 페칭만 ✅
  const response = await apiClient.post<OrderResponse>('/orders', order);
  return response.data;
};
```

### ❌ 금지 2: UI 코드 포함

```typescript
// ❌ 잘못된 예
export const getUser = async (id: string) => {
  const user = await apiClient.get(`/users/${id}`);
  
  // ❌ UI 관련 코드
  showToast('사용자를 불러왔습니다');
  
  return user;
};

// ✅ 올바른 예
export const getUser = async (id: string): Promise<User> => {
  // 데이터 페칭만 ✅
  const response = await apiClient.get<UserResponse>(`/users/${id}`);
  return response.data;
};
```

### ❌ 금지 3: 전역 상태 직접 변경

```typescript
// ❌ 잘못된 예
export const getUser = async (id: string) => {
  const user = await apiClient.get(`/users/${id}`);
  
  // ❌ 전역 상태 직접 변경
  store.dispatch(setUser(user));
  
  return user;
};

// ✅ 올바른 예
export const getUser = async (id: string): Promise<User> => {
  // 데이터 페칭만 ✅
  const response = await apiClient.get<UserResponse>(`/users/${id}`);
  return response.data;
};
```

---

## 타입 정의 규칙

### 원칙: 모든 API 함수는 명확한 타입을 가져야 함

```typescript
// ❌ 금지: any 타입
export const getUser = async (id) => {  // any
  return apiClient.get(`/users/${id}`);  // any
};

// ✅ 필수: 명확한 타입
export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<UserResponse>(`/users/${id}`);
  return response.data;
};
```

### 타입 정의 위치

```
types/
├── user.types.ts           # 사용자 관련 타입
├── order.types.ts          # 주문 관련 타입
├── product.types.ts        # 상품 관련 타입
├── api.types.ts            # API 공통 타입
└── error.types.ts          # 에러 타입
```

### 타입 구조

```typescript
// types/user.types.ts

// 1. 엔티티 타입
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// 2. 요청 타입
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
}

// 3. 응답 타입
export interface UserResponse {
  data: User;
  message?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 공통 API 타입

```typescript
// types/api.types.ts

/**
 * 단일 리소스 응답
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * 리스트 응답
 */
export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * 에러 응답
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## 에러 핸들링 규칙

### 원칙: 모든 API 호출은 에러 핸들링 필수

### ApiError 클래스

```typescript
// types/error.types.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
  
  isNetworkError(): boolean {
    return this.status === 0;
  }
  
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
  
  isServerError(): boolean {
    return this.status >= 500;
  }
  
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
```

### 에러 처리 패턴

```typescript
// ❌ 금지: 에러 처리 없음
export const getUser = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();  // 에러 체크 없음
};

// ✅ 필수: 적절한 에러 핸들링
export const getUser = async (id: string): Promise<User> => {
  try {
    const response = await apiClient.get<UserResponse>(`/users/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Network error: Unable to connect to server');
  }
};
```

### HTTP 상태 코드별 처리

```typescript
// api/client.ts
private async handleResponse<T>(response: Response): Promise<T> {
  // 성공
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json();
  }
  
  // 에러 처리
  let errorMessage = 'Unknown error occurred';
  let errorCode: string | undefined;
  let errorDetails: unknown;
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
    errorCode = errorData.code;
    errorDetails = errorData.details;
  } catch {
    errorMessage = response.statusText || errorMessage;
  }
  
  // 상태 코드별 에러
  switch (response.status) {
    case 400:
      throw new ApiError(400, errorMessage || 'Bad Request', errorCode, errorDetails);
    case 401:
      throw new ApiError(401, errorMessage || 'Unauthorized', errorCode);
    case 403:
      throw new ApiError(403, errorMessage || 'Forbidden', errorCode);
    case 404:
      throw new ApiError(404, errorMessage || 'Not Found', errorCode);
    case 409:
      throw new ApiError(409, errorMessage || 'Conflict', errorCode, errorDetails);
    case 422:
      throw new ApiError(422, errorMessage || 'Unprocessable Entity', errorCode, errorDetails);
    case 500:
      throw new ApiError(500, errorMessage || 'Internal Server Error', errorCode);
    case 503:
      throw new ApiError(503, errorMessage || 'Service Unavailable', errorCode);
    default:
      throw new ApiError(response.status, errorMessage, errorCode);
  }
}
```

---

## 파일 구조 규칙

### 디렉토리 구조

```
api/
├── client.ts              # API Client 클래스
├── user.api.ts            # 사용자 관련 API
├── order.api.ts           # 주문 관련 API
├── product.api.ts         # 상품 관련 API
├── auth.api.ts            # 인증 관련 API
└── index.ts               # 통합 export
```

### 파일 단위 구성

```typescript
// api/user.api.ts
import { apiClient } from './client';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersResponse,
} from '@/types/user.types';

// GET 단일
export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<UserResponse>(`/users/${id}`);
  return response.data;
};

// GET 목록
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<UsersResponse>('/users');
  return response.data;
};

// POST
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post<UserResponse>('/users', data);
  return response.data;
};

// PUT
export const updateUser = async (
  id: string,
  data: UpdateUserRequest
): Promise<User> => {
  const response = await apiClient.put<UserResponse>(`/users/${id}`, data);
  return response.data;
};

// PATCH
export const patchUser = async (
  id: string,
  data: Partial<UpdateUserRequest>
): Promise<User> => {
  const response = await apiClient.patch<UserResponse>(`/users/${id}`, data);
  return response.data;
};

// DELETE
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
```

### 통합 Export

```typescript
// api/index.ts
export * from './user.api';
export * from './order.api';
export * from './product.api';
export * from './auth.api';
export { apiClient, ApiError } from './client';
```

---

## 네이밍 규칙

### 파일명

```
[리소스명].api.ts

예시:
- user.api.ts
- order.api.ts
- product.api.ts
- auth.api.ts
```

### 함수명

```
[동사][리소스명]

예시:
- getUser(id)           GET    /users/:id
- getUsers()            GET    /users
- createUser(data)      POST   /users
- updateUser(id, data)  PUT    /users/:id
- patchUser(id, data)   PATCH  /users/:id
- deleteUser(id)        DELETE /users/:id
```

### 타입명

```typescript
// 엔티티
User, Order, Product

// 요청
CreateUserRequest, UpdateUserRequest

// 응답
UserResponse, UsersResponse

// 필터/파라미터
UserFilters, UserParams
```

---

## RESTful 원칙

### HTTP 메서드 매핑

| 메서드 | 용도 | 엔드포인트 예시 | 함수명 예시 |
|--------|------|-----------------|-------------|
| GET | 조회 | `GET /users/:id` | `getUser(id)` |
| GET | 목록 | `GET /users` | `getUsers()` |
| POST | 생성 | `POST /users` | `createUser(data)` |
| PUT | 전체 수정 | `PUT /users/:id` | `updateUser(id, data)` |
| PATCH | 부분 수정 | `PATCH /users/:id` | `patchUser(id, data)` |
| DELETE | 삭제 | `DELETE /users/:id` | `deleteUser(id)` |

### URL 패턴

```typescript
// ✅ 올바른 RESTful 패턴
GET    /api/users              // 목록
GET    /api/users/:id          // 단일
POST   /api/users              // 생성
PUT    /api/users/:id          // 전체 수정
PATCH  /api/users/:id          // 부분 수정
DELETE /api/users/:id          // 삭제

// 중첩 리소스
GET    /api/users/:id/orders   // 사용자의 주문 목록
POST   /api/users/:id/orders   // 사용자의 주문 생성

// 액션 (동사 사용 허용)
POST   /api/orders/:id/cancel  // 주문 취소
POST   /api/orders/:id/ship    // 주문 배송
POST   /api/auth/login         // 로그인
POST   /api/auth/logout        // 로그아웃

// ❌ 잘못된 패턴
GET    /api/getUsers            // 동사 사용
POST   /api/createUser          // 동사 사용
POST   /api/updateUser          // 동사 사용
POST   /api/deleteUser          // 동사 사용
```

### 쿼리 파라미터

```typescript
// 필터링, 정렬, 페이지네이션
GET /api/products?category=electronics&minPrice=10000&page=1&limit=20

// 함수 구현
export const getProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  const queryString = filters ? buildQueryString(filters) : '';
  const response = await apiClient.get<ProductsResponse>(`/products${queryString}`);
  return response.data;
};
```

---

## 기본 템플릿

### API Client 템플릿

```typescript
// api/client.ts
import { API_BASE_URL, API_TIMEOUT } from '@/constants/config';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

class ApiClient {
  private config: ApiClientConfig;
  
  constructor(config: ApiClientConfig) {
    this.config = config;
  }
  
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
    
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
  
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
  
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      if (response.status === 204) {
        return undefined as T;
      }
      return response.json();
    }
    
    let errorMessage = 'Unknown error occurred';
    let errorCode: string | undefined;
    let errorDetails: unknown;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code;
      errorDetails = errorData.details;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage, errorCode, errorDetails);
  }
  
  async get<T>(url: string): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}${url}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error: Unable to connect to server');
    }
  }
  
  async post<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}${url}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: data ? JSON.stringify(data) : undefined,
        }
      );
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error: Unable to connect to server');
    }
  }
  
  async put<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}${url}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        }
      );
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error: Unable to connect to server');
    }
  }
  
  async patch<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}${url}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        }
      );
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error: Unable to connect to server');
    }
  }
  
  async delete(url: string): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}${url}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );
      await this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error: Unable to connect to server');
    }
  }
}

export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});
```

### API 함수 템플릿

```typescript
// api/[resource].api.ts
import { apiClient } from './client';
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceResponse,
  ResourcesResponse,
} from '@/types/resource.types';

/**
 * [리소스] 목록을 조회합니다
 */
export const getResources = async (): Promise<Resource[]> => {
  const response = await apiClient.get<ResourcesResponse>('/resources');
  return response.data;
};

/**
 * 특정 [리소스]를 조회합니다
 */
export const getResource = async (id: string): Promise<Resource> => {
  const response = await apiClient.get<ResourceResponse>(`/resources/${id}`);
  return response.data;
};

/**
 * 새로운 [리소스]를 생성합니다
 */
export const createResource = async (
  data: CreateResourceRequest
): Promise<Resource> => {
  const response = await apiClient.post<ResourceResponse>('/resources', data);
  return response.data;
};

/**
 * [리소스] 정보를 전체 수정합니다
 */
export const updateResource = async (
  id: string,
  data: UpdateResourceRequest
): Promise<Resource> => {
  const response = await apiClient.put<ResourceResponse>(`/resources/${id}`, data);
  return response.data;
};

/**
 * [리소스] 정보를 부분 수정합니다
 */
export const patchResource = async (
  id: string,
  data: Partial<UpdateResourceRequest>
): Promise<Resource> => {
  const response = await apiClient.patch<ResourceResponse>(`/resources/${id}`, data);
  return response.data;
};

/**
 * [리소스]를 삭제합니다
 */
export const deleteResource = async (id: string): Promise<void> => {
  await apiClient.delete(`/resources/${id}`);
};
```

---

## ✅ 준수 체크리스트

### 레이어 책임
- [ ] 비즈니스 로직 없음 (계산, 검증, 변환)
- [ ] UI 코드 없음
- [ ] 전역 상태 직접 변경 없음

### 타입 정의
- [ ] 모든 함수에 파라미터 타입 정의
- [ ] 모든 함수에 반환 타입 정의
- [ ] 요청/응답 타입 정의

### 에러 핸들링
- [ ] try-catch 사용
- [ ] HTTP 상태 코드 체크
- [ ] ApiError 사용
- [ ] 네트워크 에러 처리

### RESTful 원칙
- [ ] 올바른 HTTP 메서드 사용
- [ ] 리소스 중심 URL 설계
- [ ] 일관된 엔드포인트 네이밍

### 파일 구조
- [ ] 리소스별 파일 분리
- [ ] 일관된 파일명 규칙
- [ ] 올바른 import 경로

---

## 📝 참고 사항

### 이 규칙을 위반하면

- ❌ 코드 리뷰에서 수정 요청
- ❌ 유지보수 어려움
- ❌ 버그 발생 가능성 증가
- ❌ 테스트 작성 어려움

### 이 규칙을 준수하면

- ✅ 명확한 책임 분리
- ✅ 쉬운 테스트 작성
- ✅ 재사용 가능한 코드
- ✅ 일관된 코드 품질