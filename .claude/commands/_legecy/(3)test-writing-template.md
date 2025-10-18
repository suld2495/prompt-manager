# 태스크 기반 테스트 작성 템플릿
`.claude/commands/write-tests.md`

## 명령: 태스크 단위 테스트 작성

다음 태스크에 대한 테스트를 작성해주세요: $ARGUMENTS

### 테스트 작성 원칙

**테스트는 "무엇을" 테스트하며, "어떤 결과"가 나와야 하는지 명확해야 합니다.**

- ✅ "사용자가 무엇을 할 수 있는가" 검증
- ✅ "어떤 동작의 결과가 무엇인가" 확인
- ❌ "코드가 어떻게 구현되었는가" 설명 금지
- ❌ "내부 필드가 어떻게 변경되는가" 확인 금지

### 테스트 전략

1. **필수 테스트만**
   - 핵심 비즈니스 로직
   - 에러 처리 경로
   - 경계값

2. **테스트 생략 가능**
   - 단순 getter/setter
   - 외부 라이브러리 래핑
   - UI 세부사항

### 테스트 작성 프로세스

```
1. 태스크 완료 기준 확인
2. 테스트 케이스 도출
3. 최소한의 테스트 작성
4. 실패 확인 → 성공 확인
```

### 테스트 구조 템플릿

```typescript
/**
 * [기능/모듈명] 테스트
 * 
 * 검증 내용:
 * - [기능 1]이 정상 동작하는가
 * - [기능 2]의 결과가 예상과 일치하는가
 * - [에러 상황]에서 적절히 처리되는가
 * 
 * 관련 태스크: TASK-XXX
 */

describe('[테스트 대상 기능/모듈명]', () => {
  // 1. 준비 (Arrange)
  beforeEach(() => {
    // 최소한의 셋업만
    // 공통 초기화 로직
  });

  // 2. 기능별 그룹화
  describe('[세부 기능 그룹 1]', () => {
    it('[기대하는 동작 결과]를 할 수 있어야 한다', () => {
      // Given: 무엇이 주어졌을 때
      const input = '테스트 데이터';
      
      // When: 무엇을 실행하면
      const result = executeFunction(input);
      
      // Then: 어떤 결과가 나와야 한다
      expect(result).toBe('예상 결과');
    });

    it('[특정 조건]에서도 [기대 결과]가 나와야 한다', () => {
      // Given
      const specialCase = '특수 케이스';
      
      // When
      const result = executeFunction(specialCase);
      
      // Then
      expect(result).toBe('예상 결과');
    });
  });

  // 3. 에러 처리 그룹
  describe('에러 처리', () => {
    it('[잘못된 입력]을 거부해야 한다', () => {
      // Given
      const invalidInput = null;
      
      // When & Then
      expect(() => {
        executeFunction(invalidInput);
      }).toThrow('명확한 에러 메시지');
    });
  });

  // 4. 경계값 그룹 (필요시)
  describe('경계값', () => {
    it('[경계 상황]에서도 정상 동작해야 한다', () => {
      // Given
      const edgeCase = '';
      
      // When
      const result = executeFunction(edgeCase);
      
      // Then
      expect(result).toBeDefined();
    });
  });
});
```

### describe 작성 가이드

**describe는 테스트 대상과 기능 그룹을 명확히 표현합니다.**

```typescript
// ❌ 태스크 번호 중심
describe('TASK-001~003: 거래 저장소 동작', () => {});

// ✅ 테스트 대상 중심
describe('거래 저장소', () => {
  describe('거래 생성', () => {});
  describe('거래 수정', () => {});
  describe('데이터 영속성', () => {});
});
```

**계층 구조:**
```typescript
describe('[모듈/기능명]', () => {           // 1단계: 전체 테스트 대상
  describe('[세부 기능 그룹]', () => {      // 2단계: 기능별 그룹
    it('[기대 결과]', () => {});           // 3단계: 개별 테스트
  });
});
```

### it 작성 가이드

**it은 "무엇을 테스트하고, 어떤 결과를 기대하는지" 명확히 표현합니다.**

#### ✅ 좋은 예시 (동작 중심)

```typescript
// 패턴: [동작]을/를 할 수 있어야 한다
it('생성한 거래를 다시 조회할 수 있어야 한다', () => {});
it('수정한 내용이 저장되어야 한다', () => {});

// 패턴: [조건]에서 [결과]가 나와야 한다
it('잘못된 이메일을 입력하면 에러가 발생해야 한다', () => {});
it('앱 재시작 후에도 데이터가 유지되어야 한다', () => {});

// 패턴: [상황]을 거부/허용해야 한다
it('중복된 ID를 거부해야 한다', () => {});
it('유효한 형식의 데이터를 허용해야 한다', () => {});
```

#### ❌ 피해야 할 예시 (구현 중심)

```typescript
// 구현 세부사항 설명
it('ID와 타임스탬프가 부여되고 저장된다', () => {});
it('updatedAt 필드가 변경된다', () => {});

// 수동태 표현 (구현 설명)
it('변경 내용이 반영된다', () => {});
it('데이터가 저장된다', () => {});

// 모호한 표현
it('정상 동작한다', () => {});
it('올바르게 처리된다', () => {});
```

### Given-When-Then 주석 활용

**각 테스트는 명확한 3단계 구조를 가져야 합니다.**

```typescript
it('할인율이 적용된 가격을 계산할 수 있어야 한다', () => {
  // Given: 원가와 할인율이 주어졌을 때
  const price = 10000;
  const discountRate = 0.2;
  
  // When: 할인 가격을 계산하면
  const result = calculateDiscountedPrice(price, discountRate);
  
  // Then: 20% 할인된 8000원이 나와야 한다
  expect(result).toBe(8000);
});
```

### 검증(expect) 작성 가이드

**비즈니스 동작을 검증하고, 구현 세부사항은 검증하지 않습니다.**

#### ✅ 동작 검증

```typescript
// 실제 사용 결과 확인
const stored = await getTransactions();
expect(stored).toHaveLength(1);
expect(stored[0]).toMatchObject({
  amount: 12000,
  category: '식비',
});

// 기능 동작 확인
const canLogin = await attemptLogin(email, password);
expect(canLogin).toBe(true);
```

#### ❌ 구현 세부사항 검증

```typescript
// 내부 필드 존재 확인
expect(transaction.id).toEqual(expect.any(String));
expect(transaction.createdAt).toBeDefined();

// private 메서드 호출 확인
expect(obj._internalMethod).toHaveBeenCalled();
```

### 테스트 우선순위

#### 1단계: 필수 (반드시 작성)
```typescript
// 핵심 비즈니스 로직
it('할인율을 적용한 가격을 계산할 수 있어야 한다', () => {
  const price = 10000;
  const discount = calculateDiscount(price, 'VIP');
  expect(discount).toBe(2000); // 20% 할인
});

// 중요한 에러 케이스
it('잘못된 인증 정보를 거부해야 한다', () => {
  const result = login('wrong@email.com', 'wrongpass');
  expect(result.success).toBe(false);
  expect(result.error).toBe('Invalid credentials');
});
```

#### 2단계: 중요 (가능하면 작성)
```typescript
// 데이터 변환 로직
it('날짜를 지정된 형식으로 변환할 수 있어야 한다', () => {
  const date = new Date('2024-01-01');
  const formatted = formatDate(date);
  expect(formatted).toBe('2024-01-01');
});
```

#### 3단계: 선택 (시간 있으면)
```typescript
// UI 상호작용
it('로딩 상태를 표시해야 한다', () => {
  // 대부분 수동 테스트로 충분
});
```

### 예시: 로그인 폼 검증 테스트

```typescript
/**
 * 로그인 폼 검증 테스트
 * 
 * 검증 내용:
 * - 유효한 이메일과 비밀번호를 입력할 수 있는가
 * - 잘못된 형식의 입력을 거부하는가
 * - 적절한 에러 메시지를 제공하는가
 * 
 * 관련 태스크: TASK-002
 */

describe('로그인 폼 검증', () => {
  describe('이메일 검증', () => {
    it('올바른 형식의 이메일을 허용해야 한다', () => {
      // Given: 유효한 이메일
      const email = 'user@example.com';
      
      // When: 이메일 검증
      const result = validateEmail(email);
      
      // Then: 검증 통과
      expect(result.isValid).toBe(true);
    });

    it('잘못된 형식의 이메일을 거부해야 한다', () => {
      // Given: 유효하지 않은 이메일
      const email = 'not-an-email';
      
      // When: 이메일 검증
      const result = validateEmail(email);
      
      // Then: 검증 실패 및 에러 메시지 제공
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('올바른 이메일 형식이 아닙니다');
    });
  });

  describe('비밀번호 검증', () => {
    it('최소 길이 이상의 비밀번호를 허용해야 한다', () => {
      // Given: 8자 이상 비밀번호
      const password = '12345678';
      
      // When: 비밀번호 검증
      const result = validatePassword(password);
      
      // Then: 검증 통과
      expect(result.isValid).toBe(true);
    });

    it('최소 길이 미만의 비밀번호를 거부해야 한다', () => {
      // Given: 8자 미만 비밀번호
      const password = '1234';
      
      // When: 비밀번호 검증
      const result = validatePassword(password);
      
      // Then: 검증 실패 및 에러 메시지 제공
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('비밀번호는 8자 이상이어야 합니다');
    });
  });

  describe('폼 전체 검증', () => {
    it('모든 필드가 유효하면 폼을 제출할 수 있어야 한다', () => {
      // Given: 유효한 폼 데이터
      const formData = {
        email: 'user@example.com',
        password: '12345678'
      };
      
      // When: 전체 폼 검증
      const result = validateLoginForm(formData);
      
      // Then: 검증 통과
      expect(result.isValid).toBe(true);
    });
  });
});
```

### 테스트 안티패턴 방지

```typescript
// ❌ 과도한 테스트
describe('Button Component', () => {
  it('should have correct color'); // 불필요
  it('should have correct font'); // 불필요
  it('should have correct padding'); // 불필요
  // → CSS는 테스트하지 않기
});

// ❌ 구현 세부사항 테스트
it('should call internal method _calculateTax', () => {
  // private 메서드 테스트 금지
});

// ❌ 외부 라이브러리 테스트
it('should format date using moment.js', () => {
  // moment.js 자체를 테스트하지 않기
});

// ❌ 구현 설명하는 테스트
it('ID가 생성되고 타임스탬프가 설정된다', () => {
  // 어떻게 동작하는지가 아닌, 무엇을 할 수 있는지 테스트
});

// ✅ 적절한 테스트
it('세금이 포함된 총액을 계산할 수 있어야 한다', () => {
  // Given: 가격과 세율
  const price = 100;
  const taxRate = 0.1;
  
  // When: 총액 계산
  const total = calculateTotal(price, taxRate);
  
  // Then: 세금 포함 110원
  expect(total).toBe(110);
});
```

### 테스트 커버리지 가이드

```
핵심 비즈니스 로직: 90-100%
API 엔드포인트: 80-90%
유틸리티 함수: 70-80%
UI 컴포넌트: 50-70%
설정 파일: 0-30%
```

### TDD 적용시 (선택적)

```bash
# 1. 테스트 먼저 작성
"TASK-003에 대한 테스트를 먼저 작성해줘. 구현은 하지 마."

# 2. 실패 확인
"테스트를 실행하고 실패하는지 확인해줘."

# 3. 최소 구현
"테스트를 통과하는 최소한의 코드만 작성해줘."

# 4. 리팩토링
"테스트는 그대로 두고 코드를 개선해줘."
```

### 테스트 작성 체크리스트

- [ ] 무엇을 테스트하고 어떤 결과를 기대하는지 명확한가?
- [ ] describe는 기능/모듈 그룹을 나타내는가?
- [ ] it은 동작과 결과를 설명하는가?
- [ ] Given-When-Then 구조가 명확한가?
- [ ] 구현 세부사항이 아닌 동작을 검증하는가?
- [ ] 핵심 기능이 커버되는가?
- [ ] 주요 에러 케이스를 처리하는가?
- [ ] 과도한 테스트는 없는가?
- [ ] 테스트가 독립적인가?
- [ ] 테스트 실행이 빠른가?