# Phase 0: 인프라 설정

## 📋 개요

프로젝트의 기반이 되는 인프라를 설정하는 단계입니다. 데이터베이스, ORM, UI 컴포넌트 라이브러리 등을 구축합니다.

### 목표
- Supabase 프로젝트 생성 및 연결
- Prisma ORM 설정 및 기본 스키마 작성
- shadcn/ui 필수 컴포넌트 설치
- 기본 레이아웃 및 네비게이션 구조 구축

### 완료 시 얻게 되는 것
✅ 데이터베이스 연결 및 ORM 사용 준비 완료
✅ UI 컴포넌트 라이브러리 사용 준비 완료
✅ 프로젝트 기본 구조 및 레이아웃 완성

---

## 🔗 선행 조건

- [x] Next.js 프로젝트 생성 완료
- [x] pnpm 설치 및 의존성 설치 완료
- [x] TypeScript 설정 완료
- [x] Tailwind CSS 설정 완료

---

## ✅ 작업 체크리스트

### 1. Supabase 프로젝트 설정
- [ ] Supabase 계정 생성 (https://supabase.com)
- [ ] 새 프로젝트 생성
- [ ] Database URL 및 API Keys 확보
- [ ] `.env.local` 파일 생성 및 환경변수 설정

### 2. Prisma 설정
- [ ] Prisma 패키지 설치
- [ ] Prisma 초기화 (`prisma init`)
- [ ] Prisma 스키마 작성 (Phase 1용 rules 테이블만)
- [ ] Prisma Client 생성
- [ ] 데이터베이스 마이그레이션 실행

### 3. shadcn/ui 컴포넌트 설치
- [ ] 필수 컴포넌트 설치 (button, dialog, input, textarea, toast)
- [ ] 추가 컴포넌트 설치 (select, badge, card, table)

### 4. 기본 레이아웃 구성
- [ ] 사이드바 레이아웃 컴포넌트 작성
- [ ] 네비게이션 메뉴 구조 작성
- [ ] Toast 프로바이더 설정

---

## 💻 코드 예시 및 스니펫

### 1. 환경변수 설정 (`.env.local`)

```bash
# Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase API (옵션 - 나중에 필요시)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### 2. Prisma 설치 및 초기화

```bash
# Prisma 패키지 설치
pnpm add prisma @prisma/client
pnpm add -D prisma

# Prisma 초기화
pnpm prisma init
```

### 3. Prisma 스키마 (`prisma/schema.prisma`) - Phase 1용 최소 버전

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Phase 1: 규칙 마스터 테이블
model Rule {
  id        String   @id @default(uuid())
  name      String
  description String?

  // 규칙 내용 (마스터 - 항상 최신)
  title              String
  priority           Priority
  allowed            Boolean
  descriptionDetail  String   @map("description_detail") @db.Text
  exampleBad         String?  @map("example_bad") @db.Text
  exampleGood        String?  @map("example_good") @db.Text
  violationAction    String?  @map("violation_action") @db.Text
  notes              String?  @db.Text

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("rules")
}

enum Priority {
  critical
  warning
  info
}
```

### 4. Prisma Client 설정 (`src/lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 5. 마이그레이션 실행

```bash
# 마이그레이션 생성 및 실행
pnpm prisma migrate dev --name init

# Prisma Client 생성
pnpm prisma generate
```

### 6. shadcn/ui 컴포넌트 설치

```bash
# 필수 컴포넌트
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add toast

# 추가 컴포넌트
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add label
```

### 7. 기본 레이아웃 구조 (`src/components/layout/app-layout.tsx`)

```typescript
"use client"

import { ReactNode } from "react"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <aside className="w-64 border-r bg-muted/40 p-4">
        <nav className="space-y-2">
          <h2 className="mb-4 text-lg font-semibold">프롬프트 관리자</h2>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">메뉴</p>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-accent">
              📄 템플릿 목록
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-accent">
              📦 카테고리 프리셋
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-accent">
              📁 카테고리 저장소
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-accent">
              📜 규칙 저장소
            </a>
          </div>
        </nav>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
```

### 8. Toast 프로바이더 설정 (`src/app/layout.tsx` 업데이트)

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "프롬프트 관리자",
  description: "AI 프롬프트 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## 🎯 완료 기준

이 Phase는 다음 조건을 모두 만족하면 완료된 것으로 간주합니다:

1. ✅ `pnpm prisma studio` 실행 시 Supabase 데이터베이스에 연결되고 `rules` 테이블이 보임
2. ✅ shadcn/ui 컴포넌트를 import하여 사용 가능
3. ✅ `pnpm dev` 실행 시 기본 레이아웃이 렌더링됨
4. ✅ Toast 알림이 정상적으로 표시됨 (테스트)

---

## 📝 다음 단계

Phase 0 완료 후 **Phase 1: 규칙 CRUD 구현**으로 진행합니다.

Phase 1에서는:
- 규칙 목록 조회 API 구현
- 규칙 추가/편집/삭제 API 구현
- 규칙 관리 UI 구현 (목록, 다이얼로그)
