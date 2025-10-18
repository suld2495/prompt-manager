# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Prompt Management System** - A hierarchical system for managing AI prompts with modular, reusable components that can be composed into final markdown files.

### Core Purpose
Systematically manage vast AI prompts by breaking them into reusable modules (rules → categories → presets → templates) with snapshot management for version tracking and change detection.

## Architecture

### 4-Layer Hierarchy
1. **Rules (규칙)** - Smallest unit, master rules that are always current
2. **Categories (카테고리)** - Flat groups of rules (no tree structure)
3. **Category Presets (프리셋)** - Frequently-used category combinations
4. **Templates (템플릿)** - Final composition layer combining presets + individual categories

### Key Concepts

**Snapshot System**: When generating MD files from templates, the system creates snapshots of rule content at that point in time. This allows:
- Preservation of rule content when MD was generated
- Change detection when master rules are updated
- User choice to update, keep, or customize snapshots independently

**Preset Pattern**: Presets work like "stamps" - once applied to a template, the categories become independent. Modifying a preset doesn't affect templates that already used it.

## Tech Stack

- **Framework**: Next.js 15.5 (App Router with Turbopack)
- **React**: 19.1.0
- **TypeScript**: Strict mode enabled
- **Package Manager**: pnpm 10.17.1 (enforced via packageManager field)
- **Styling**: Tailwind CSS 4 + tw-animate-css
- **UI Components**: shadcn/ui (New York style, using lucide-react icons)
- **Database**: Supabase (PostgreSQL) via @supabase/supabase-js
- **ORM**: Prisma (implemented)

## Development Commands

```bash
# Start development server with Turbopack
pnpm dev

# Build for production with Turbopack
pnpm build

# Start production server
pnpm start
```

**Note**: This project uses pnpm exclusively. Do not use npm or yarn.

## Database Schema

### Migration Commands

```bash
# Run pending migrations
pnpm prisma migrate dev --name <migration-name>

# Generate Prisma Client
pnpm prisma generate

# Reset database (development only)
pnpm prisma migrate reset --force

# View current database schema
pnpm prisma studio
```

### Implemented Tables (Phase 1-3 Complete)

**rules** - Master rules (always current) ✅ Implemented
- Contains: id, name, description, title, priority (critical/warning/info), allowed (boolean), descriptionDetail, exampleBad, exampleGood, violationAction, notes, createdAt, updatedAt
- Prisma model: `Rule`

**categories** - Flat structure (no tree hierarchy) ✅ Implemented
- Contains: id, name, description, order, createdAt, updatedAt
- Prisma model: `Category`
- Relations: categoryRules (one-to-many), presetItems (one-to-many)

**category_rules** - Many-to-many relationship ✅ Implemented
- Contains: id, categoryId, ruleId, order, createdAt
- Prisma model: `CategoryRule`
- Relations: category (many-to-one), rule (many-to-one)
- Unique constraint: [categoryId, ruleId]
- Cascade delete: when category or rule is deleted

**category_presets** - Saved category combinations ✅ Implemented
- Contains: id, name, description, createdAt, updatedAt
- Prisma model: `CategoryPreset`
- Relations: presetItems (one-to-many)

**category_preset_items** - Many-to-many relationship ✅ Implemented
- Contains: id, presetId, categoryId, order, createdAt
- Prisma model: `CategoryPresetItem`
- Relations: preset (many-to-one), category (many-to-one)
- Unique constraint: [presetId, categoryId]
- Cascade delete: when preset or category is deleted

### Planned Tables (Phase 4-5)

**rule_snapshots** - Frozen rule content from MD generation time
- Links to: base_rule_id (master), template_id, category_id
- snapshot_content (jsonb), is_outdated, is_custom

**templates** - Top-level composition
- Contains: name, description, has_snapshots, last_generated_at, outdated_count
- Tracks whether snapshots exist and how many are outdated

**template_categories** - Many-to-many relationship
- Links templates to categories
- from_preset_id tracks which preset added this category (nullable for manual additions)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                      # Root layout with Geist fonts
│   ├── page.tsx                        # Homepage
│   ├── globals.css                     # Global styles
│   ├── rules/
│   │   └── page.tsx                    # Rules list page ✅
│   ├── categories/
│   │   ├── page.tsx                    # Categories list page ✅
│   │   └── [id]/
│   │       └── page.tsx                # Category edit page ✅
│   ├── presets/
│   │   ├── page.tsx                    # Presets list page ✅
│   │   └── [id]/
│   │       └── page.tsx                # Preset edit page ✅
│   └── api/
│       ├── rules/
│       │   ├── route.ts                # GET, POST /api/rules ✅
│       │   └── [id]/
│       │       ├── route.ts            # GET, PUT, DELETE ✅
│       │       └── copy/
│       │           └── route.ts        # POST (copy) ✅
│       ├── categories/
│       │   ├── route.ts                # GET, POST /api/categories ✅
│       │   └── [id]/
│       │       ├── route.ts            # GET, PUT, DELETE ✅
│       │       ├── copy/
│       │       │   └── route.ts        # POST (copy) ✅
│       │       └── rules/
│       │           ├── route.ts        # GET, POST (add rule) ✅
│       │           └── reorder/
│       │               └── route.ts    # PUT (reorder) ✅
│       ├── presets/
│       │   ├── route.ts                # GET, POST /api/presets ✅
│       │   └── [id]/
│       │       ├── route.ts            # GET, PUT, DELETE ✅
│       │       ├── copy/
│       │       │   └── route.ts        # POST (copy) ✅
│       │       ├── preview/
│       │       │   └── route.ts        # GET (preview all rules) ✅
│       │       └── categories/
│       │           ├── route.ts        # POST (add category) ✅
│       │           └── [categoryId]/
│       │               └── route.ts    # DELETE (remove category) ✅
│       └── category-rules/
│           └── [id]/
│               └── route.ts            # DELETE (remove rule) ✅
├── components/
│   ├── layout/
│   │   └── app-layout.tsx              # Main app layout with navigation ✅
│   ├── rules/
│   │   └── rule-dialog.tsx             # Rule create/edit dialog ✅
│   └── ui/                             # shadcn/ui components ✅
├── lib/
│   ├── utils.ts                        # Utility functions
│   └── prisma.ts                       # Prisma client ✅
└── types/
    ├── rule.ts                         # Rule types ✅
    ├── category.ts                     # Category types ✅
    └── preset.ts                       # Preset types ✅

prisma/
└── schema.prisma                       # Database schema ✅

prompt/
└── 기획서.md                            # Project specification (DO NOT MODIFY)

claudedocs/
├── Phase0-Infrastructure.md
├── Phase1-Rules.md                     # ✅ Complete
├── Phase2-Categories.md                # ✅ Complete
├── Phase3-Presets.md                   # ✅ Complete
├── Phase4-Templates.md
├── Phase5-Snapshots.md
└── Phase6-Improvements.md
```

## TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler

## shadcn/ui Configuration

- Style: "new-york"
- Base color: neutral
- CSS variables: enabled
- RSC: enabled
- Icon library: lucide-react
- Component aliases: @/components, @/ui for UI components

## Development Phases

**Current Status**: Phase 1-3 Complete ✅

### Phase 1: Rules (MVP) ✅ COMPLETE
**Branch**: `main`
**Status**: Implemented and tested

**Completed Features**:
- ✅ Rules CRUD with master-only editing
- ✅ 10 rule fields: id, name, description, title, priority, allowed, descriptionDetail, exampleBad, exampleGood, violationAction, notes, timestamps
- ✅ UI with list page + dialog (create/edit)
- ✅ Copy functionality
- ✅ Priority badges (critical/warning/info)
- ✅ Allowed/forbidden badges

**Files Created**: 8 files
- Prisma schema, types, API routes (CRUD + copy), UI components

### Phase 2: Categories ✅ COMPLETE
**Branch**: `feature/phase2-categories` (merged to `main`)
**Status**: Implemented and tested

**Completed Features**:
- ✅ Category CRUD (flat structure, no tree)
- ✅ Category-rule linking (references master rules)
- ✅ Add/remove rules UI with master rule selection
- ✅ Rule reordering (move up/down buttons)
- ✅ Category copy functionality
- ✅ Cascade delete (category → category_rules)
- ✅ Duplicate prevention when adding rules
- ✅ Transaction-based reordering

**Files Created**: 11 files (1 modified, 10 new)
- Prisma schema update, category types, 7 API routes, 2 pages

### Phase 3: Presets ✅ COMPLETE
**Branch**: `feature/phase3-presets`
**Status**: Implemented and tested in dev mode

**Completed Features**:
- ✅ Preset CRUD (create, read, update, delete)
- ✅ Preset-category linking (many-to-many)
- ✅ Add/remove categories to/from presets
- ✅ Preset copy functionality
- ✅ Preset preview showing all included rules
- ✅ Category count and rule count display
- ✅ Cascade delete (preset → preset_items)
- ✅ Duplicate prevention when adding categories
- ✅ Next.js 15 params pattern migration (all API routes)

**Files Created**: 11 files
- Prisma schema update (CategoryPreset, CategoryPresetItem models)
- preset.ts types
- 6 API routes (CRUD, copy, preview, category management)
- 2 pages (list, edit)

**Known Issues**:
- Production build fails with Prisma + Next.js 15 + Turbopack compatibility issue ("#main-entry-point" not found)
- Development mode works correctly (`pnpm dev`)
- This is a known upstream issue; functionality is complete and working in dev mode

**Next Steps**:
1. Run database migration: `pnpm prisma migrate dev --name add-presets`
2. Test all preset operations in dev mode
3. Monitor Next.js/Prisma updates for build fix

### Phase 4: Templates - 1 week
- Template CRUD
- Add preset functionality (adds all preset categories at once)
- Add individual category functionality
- Show source (preset vs direct addition)
- MD generation/preview/download

### Phase 5: Snapshot Management - 1 week
- Create snapshots on MD generation
- Detect changes when master rules are updated
- Compare UI showing snapshot vs current
- Update/keep/customize snapshot options

### Phase 6: Improvements - 1 week
- Search, filtering, sorting
- Usage statistics
- UI/UX polish
- Performance optimization

## Key Implementation Rules

### Data Flow Principles

1. **Rules are always master**: When editing a rule, you update the master version. Snapshots are separate entities created during MD generation.

2. **Categories are flat**: Do NOT implement tree structures or nested categories. Categories are simple groups in a flat list.

3. **Presets are stamps**: When adding a preset to a template, copy all preset categories to template_categories with from_preset_id reference. The template becomes independent - future preset changes don't affect it.

4. **Snapshots track changes**: When a master rule is updated, find all snapshots referencing it. If content differs, set is_outdated=true and increment template.outdated_count.

### MD Generation Logic

```
For each category in template (ordered):
  For each rule in category (ordered):
    If snapshot exists for this rule in this template:
      Use snapshot.snapshot_content
    Else:
      Use master rule content from rules table

    Format as markdown section
```

### Change Detection Logic

```
When master rule is updated:
  Find all rule_snapshots WHERE base_rule_id = updated_rule.id

  For each snapshot:
    If snapshot.snapshot_content != master rule content:
      snapshot.is_outdated = true
      template.outdated_count += 1
```

## API Routes

### Implemented Routes (Phase 1-3)

**Rules API** ✅
- `GET /api/rules` - List all rules
- `POST /api/rules` - Create new rule
- `GET /api/rules/[id]` - Get rule by ID
- `PUT /api/rules/[id]` - Update rule
- `DELETE /api/rules/[id]` - Delete rule
- `POST /api/rules/[id]/copy` - Copy rule

**Categories API** ✅
- `GET /api/categories` - List all categories (with rule counts)
- `POST /api/categories` - Create new category
- `GET /api/categories/[id]` - Get category by ID (with rules)
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category (cascade)
- `POST /api/categories/[id]/copy` - Copy category (with rules)

**Category-Rules API** ✅
- `GET /api/categories/[id]/rules` - List rules in category
- `POST /api/categories/[id]/rules` - Add rule to category
- `PUT /api/categories/[id]/rules/reorder` - Reorder rules (transaction)
- `DELETE /api/category-rules/[id]` - Remove rule from category

**Presets API** ✅
- `GET /api/presets` - List all presets (with category and rule counts)
- `POST /api/presets` - Create new preset
- `GET /api/presets/[id]` - Get preset by ID (with categories)
- `PUT /api/presets/[id]` - Update preset
- `DELETE /api/presets/[id]` - Delete preset (cascade)
- `POST /api/presets/[id]/copy` - Copy preset (with categories)
- `GET /api/presets/[id]/preview` - Preview all rules in preset
- `POST /api/presets/[id]/categories` - Add category to preset
- `DELETE /api/presets/[id]/categories/[categoryId]` - Remove category from preset

### Planned Routes (Phase 4-5)

**Templates API**
- `/api/templates` - CRUD for templates
- `/api/templates/[id]/categories` - Manage template-category relationships
- `/api/templates/[id]/generate` - Generate MD with snapshot creation
- `/api/templates/[id]/snapshots` - Manage snapshot updates

## UI Component Requirements

### Installed Components ✅
- ✅ button
- ✅ input
- ✅ textarea
- ✅ dialog
- ✅ sonner (toast)
- ✅ select
- ✅ badge
- ✅ card
- ✅ table
- ✅ label

### To Be Added (Phase 3+)
- tabs
- accordion
- separator
- tooltip

## Important Constraints

1. **No tree structures**: Categories are strictly flat. Do not implement parent-child relationships.

2. **Snapshot immutability**: Snapshots are frozen in time. Never auto-update snapshots when master rules change - only update when user explicitly chooses to.

3. **Preset independence**: After adding a preset to a template, the categories become independent. Template keeps from_preset_id for display purposes only.

4. **Master rule deletion**: Only allow deletion if the rule is not used in any categories AND has no snapshots.

5. **Category deletion**: Only allow deletion if the category is not used in any presets or templates.

6. **Korean content support**: The UI and content will be in Korean. Ensure proper encoding and display.

## Workflow Examples

### Creating a Template with Presets

1. User creates "React 표준" preset with 4 categories
2. User creates new template "React Next.js 프로젝트"
3. User clicks [+ 프리셋 추가] and selects "React 표준"
4. System adds all 4 categories to template with from_preset_id="React 표준"
5. User clicks [+ 카테고리 추가] and adds "Next.js 전용" category (from_preset_id=null)
6. Template now has 5 categories total

### Handling Rule Changes

1. User generates MD from template → Creates snapshots for all rules
2. User later edits master rule "useState 제한" (3개 → 5개)
3. System finds all snapshots of this rule, marks is_outdated=true
4. Template shows "3개 규칙이 원본과 달라졌습니다" badge
5. User opens template, clicks [변경사항 보기]
6. For each outdated rule, user chooses:
   - Update: snapshot.content = master.content, is_outdated=false
   - Keep: keep snapshot.content, is_outdated=false (ignore change)
   - Customize: edit snapshot.content manually, is_custom=true, is_outdated=false

## Reference Documentation

The detailed Korean specification in `prompt/기획서.md` contains:
- Complete UI mockups
- Detailed workflow diagrams
- Full field definitions
- MD generation format examples
- User interaction flows

Refer to this document for implementation details, but do NOT modify it.
