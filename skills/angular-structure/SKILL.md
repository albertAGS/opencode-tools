---
name: angular-structure
description: |
  Interactive scaffold generator for Angular projects. Use when the user says
  "create", "add", "generate", "scaffold", "make", "new" followed by:
  feature, page, component, service, model, pipe, guard, resolver, directive,
  store, enum. Asks questions about what to create and generates files
  following a referential Angular project structure.
---

# Angular Structure Skill

## Reference Folder Structure

```
src/app/
├── core/
│   ├── api/
│   │   ├── http.service.ts
│   │   └── api-error.handler.ts
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.store.ts
│   │   └── token.interceptor.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── enums/
│   │   └── permission.enum.ts
│   └── app.config.ts
│
├── shell/
│   ├── sidebar.component.ts
│   ├── topbar.component.ts
│   └── shell.routes.ts
│
├── features/
│   ├── <feature>/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   ├── pipes/
│   │   ├── guards/
│   │   ├── resolvers/
│   │   ├── <feature>.routes.ts
│   │   └── <feature>.store.ts
│   └── ...
│
└── shared/
    ├── models/
    ├── guards/
    ├── ui/
    │   ├── button/
    │   ├── modal/
    │   ├── table/
    │   ├── toast/
    │   ├── form-fields/
    │   ├── pagination/
    │   └── confirm-dialog/
    ├── pipes/
    ├── directives/
    ├── validators/
    └── helpers/
```

## Artifact Creation Rules

| Type | Location | Route update? | Store? |
|------|----------|---------------|--------|
| **Feature** | `features/<name>/` | Yes — add lazy route in `app.routes.ts` + create `<name>.routes.ts` | Yes — create `<name>.store.ts` |
| **Page** | `features/<feature>/pages/` | Yes — add child route in `<feature>.routes.ts` | No — reads existing feature store |
| **Component** | `features/<feature>/components/` or `shared/ui/<name>/` | No | No |
| **Service** | `features/<feature>/services/` or `core/<domain>/` | No | No |
| **Model** | `features/<feature>/models/` or `shared/models/` | No | No |
| **Pipe** | Feature-local `pipes/` or `shared/pipes/` | No | No |
| **Guard** | Feature-local `guards/` or `core/guards/` or `shared/guards/` | No | No |
| **Directive** | Feature-local `directives/` or `shared/directives/` | No | No |
| **Resolver** | Feature-local `resolvers/` | No | No |
| **Store** | Feature-level only (`<feature>/<name>.store.ts`) | No | — |
| **Enum** | `core/enums/` or feature-local `enums/` | No | No |

## Store Strategy

- **One signal store per feature** (`<feature>.store.ts`), never per component
- Query params are the source of truth for filter/search state — only add store-derived state when filter interdependencies become complex
- Cross-feature state lives in `core/` (auth/session, theme, notifications)
- Stores are created automatically when a new feature is generated, not when creating individual pages or components

## Naming Conventions

- Folders: `kebab-case`
- Files: `kebab-case.{type}.ts` (e.g., `product-list.page.ts`, `user.service.ts`)
- Classes: PascalCase
- Selectors: `app-<name>` for components, `[app<Name>]` for directives
- Barrel `index.ts` files: **do not create them** — they hurt tree-shaking with standalone components. Only `shared/ui/index.ts` may have one as a convenience re-export for the UI kit.

## Interactive Workflow

Follow this step-by-step when the user asks to create something:

### Step 1: Determine artifact type

Ask: **"What do you want to create?"**

Options: feature, page, component, service, model, pipe, guard, resolver, directive, store, enum

### Step 2: Ask follow-ups based on type

#### For a **Feature**:
- Feature name? (kebab-case)
- Pages needed? (list each: page name, route path)
- Components needed? (list each: component name)
- Services needed? (list each: service name, main HTTP methods)
- Models needed? (list each: model name, key fields)
- Pipes, guards, resolvers needed?
- Is it lazy-loaded? (default: yes)

#### For a **Page**:
- Which feature does it belong to?
- Page name? (kebab-case)
- Route path? (e.g., `:id`, `create`, `:id/edit`)
- Does it need a resolver? A guard?
- Does it read from an existing feature store or manage local state?

#### For a **Component**:
- Feature or shared? If shared, which UI kit group? (button, modal, table, etc.)
- Component name?
- Is it standalone? (default: yes)
- Key inputs/outputs?

#### For a **Service**:
- Feature or core? If core, which domain? (api, auth, etc.)
- Service name?
- Main HTTP endpoints or responsibilities?

#### For a **Model**:
- Feature or shared?
- Model name?
- Key fields and their types?

#### For a **Pipe / Guard / Directive**:
- Feature-local or shared?
- Name?
- Purpose / behavior?

#### For a **Store**:
- Which feature?
- What state does it manage?
- What actions/derived signals does it expose?

#### For an **Enum**:
- Core-wide or feature-local?
- Enum name?
- Values?

### Step 3: Generate files

Create all files with proper Angular 17+ boilerplate:

**Standalone component:**
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<name>.component.html',
})
export class <Name>Component {}
```

**Service with providedIn: 'root':**
```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class <Name>Service {}
```

**Feature routes with standalone pages:**
```typescript
import { Routes } from '@angular/router';

export default [
  { path: '', component: ListPage },
  { path: 'create', component: CreatePage },
  { path: ':id', component: DetailPage },
  { path: ':id/edit', component: EditPage },
] as Routes;
```

**App routes entry for lazy-loaded feature:**
```typescript
{
  path: '<feature>',
  loadChildren: () => import('./features/<feature>/<feature>.routes'),
}
```

**Signal store:**
```typescript
import { signal } from '@angular/core';

export class <Name>Store {
  // state
  readonly items = signal<Item[]>([]);
  readonly loading = signal(false);
  readonly selectedId = signal<string | null>(null);

  // derived
  readonly selectedItem = computed(() =>
    this.items().find(i => i.id === this.selectedId())
  );

  // actions
  async load() { /* ... */ }
  async create(data: Partial<Item>) { /* ... */ }
  async update(id: string, data: Partial<Item>) { /* ... */ }
  async delete(id: string) { /* ... */ }
}
```

### Step 4: Update routes based on creation

| Scenario | Action |
|----------|--------|
| New **feature** created | Create `<feature>.routes.ts` with child routes + add lazy import in `app.routes.ts` |
| New **page** in existing feature | Add route entry in `<feature>.routes.ts` |
| New **component / service / model / pipe / guard / resolver / store / enum** | No route update needed |

### Step 5: Verify

- All paths are relative and correct
- File names follow `kebab-case.{type}.ts` convention
- Standalone components have `standalone: true` and proper `imports`
- Routes use `loadComponent` (standalone) or `loadChildren` for feature modules
- No barrel `index.ts` files created (except `shared/ui/index.ts` if it already exists)
