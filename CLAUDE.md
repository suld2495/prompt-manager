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
- **ORM**: Prisma (planned, not yet implemented)

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

## Database Schema (Planned)

### Core Tables

**rules** - Master rules (always current)
- Contains: title, priority (critical/warning/info), allowed (boolean), description_detail, example_bad, example_good, violation_action, notes

**rule_snapshots** - Frozen rule content from MD generation time
- Links to: base_rule_id (master), template_id, category_id
- snapshot_content (jsonb), is_outdated, is_custom

**categories** - Flat structure (no tree hierarchy)
- Contains: name, description, order

**category_rules** - Many-to-many relationship
- Links categories to master rules with ordering

**category_presets** - Saved category combinations
- Contains: name, description

**category_preset_items** - Many-to-many relationship
- Links presets to categories with ordering

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
│   ├── layout.tsx          # Root layout with Geist fonts
│   ├── page.tsx            # Homepage (currently default Next.js template)
│   └── globals.css         # Global styles
├── lib/
│   └── utils.ts            # Utility functions (cn helper for class merging)
└── components/
    └── ui/                 # shadcn/ui components (when added)

prompt/
└── 기획서.md               # Detailed project specification in Korean (DO NOT MODIFY)
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

**Current Status**: Project setup complete, implementation not started

### Phase 1: Rules (MVP) - 1 week
- Rules CRUD with master-only editing
- 8 rule fields: title, priority, allowed, description_detail, example_bad, example_good, violation_action, notes
- Basic UI with list + dialog

### Phase 2: Categories - 1 week
- Category CRUD (flat structure, no tree)
- Category-rule linking (references master rules)
- Add/remove rules UI

### Phase 3: Presets - 1 week
- Preset CRUD
- Preset-category linking
- Preset preview showing all included rules

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

## API Routes (To Be Implemented)

Expected structure:
- `/api/rules` - CRUD for master rules
- `/api/categories` - CRUD for categories
- `/api/categories/[id]/rules` - Manage category-rule relationships
- `/api/presets` - CRUD for category presets
- `/api/presets/[id]/categories` - Manage preset-category relationships
- `/api/templates` - CRUD for templates
- `/api/templates/[id]/categories` - Manage template-category relationships
- `/api/templates/[id]/generate` - Generate MD with snapshot creation
- `/api/templates/[id]/snapshots` - Manage snapshot updates

## UI Component Requirements

shadcn/ui components needed:
- button
- input
- textarea
- dialog
- toast
- select
- badge
- card
- table

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
