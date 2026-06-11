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
│   ├── layout/
│   │   ├── sidebar.ts
│   │   ├── topbar.ts
│   │   └── layout.routes.ts
│   ├── auth/
│   │   ├── auth-store.ts
│   │   ├── auth.model.ts
│   │   ├── auth-guard.ts
│   │   ├── auth.routes.ts
│   │   └── pages/
│   │       ├── login/
│   │       ├── register/
│   │       └── password-recovery/
│   ├── services/
│   │   └── notification-api.ts
│   └── interceptors/
│       └── api-interceptor.ts
│
├── modules/
│   ├── <domain>/
│   │   ├── <feature>/
│   │   │   ├── <feature>-api.ts
│   │   │   ├── <feature>.model.ts
│   │   │   ├── <feature>-guard.ts
│   │   │   ├── <feature>.routes.ts
│   │   │   ├── <feature>-store.ts
│   │   │   ├── components/
│   │   │   └── pages/
│   │   │       └── <page>/
│   │   │           ├── <page>.ts
│   │   │           ├── <page>.html
│   │   │           ├── <page>.css
│   │   │           ├── components/
│   │   │           ├── services/
│   │   │           ├── models/
│   │   │           ├── directives/
│   │   │           └── pipes/
│   │   └── ... (domain-level shared code)
│   └── ...
│
└── shared/
    ├── components/
    │   └── notification/
    │       ├── notification.ts
    │       ├── notification.html
    │       └── notification.css
    ├── models/
    ├── pipes/
    │   └── date-pipe.ts
    ├── directives/
    ├── utils/
    └── validators/
```

## Artifact Creation Rules

| Type | Location | Route update? | Store? |
|------|----------|---------------|--------|
| **Feature** | `modules/<domain>/<name>/` | Yes — add lazy route in `app.routes.ts` + create `<name>.routes.ts` | Yes — create `<name>-store.ts` |
| **Page** | `modules/<domain>/<feature>/pages/<page>/` | Yes — add child route in `<feature>.routes.ts` | No — reads existing feature store |
| **Component** | Feature `components/` or page-local `components/` or `shared/components/<name>/` | No | No |
| **Service** | Feature root `<feature>-api.ts` or `core/services/` or core domain folder | No | No |
| **Model** | Feature root `<feature>.model.ts` or `shared/models/` | No | No |
| **Pipe** | Page-local `pipes/` or `shared/pipes/` | No | No |
| **Guard** | Feature root `<feature>-guard.ts` or core domain folder | No | No |
| **Directive** | Page-local `directives/` or `shared/directives/` | No | No |
| **Resolver** | Feature root `<feature>-resolver.ts` | No | No |
| **Store** | Feature-level only (`<name>-store.ts`) | No | — |
| **Enum** | Core domain folder or feature-local `enums/` | No | No |
| **Interceptor** | `core/interceptors/` | No | No |

## Store Strategy

- **One signal store per feature** (`<feature>-store.ts`), never per component
- Cross-feature state lives in `core/` (auth/session, theme, notifications)
- Stores are created automatically when a new feature is generated, not when creating individual components

## Naming Conventions

- Folders: `kebab-case`
- Files: `kebab-case.ts` (components, directives, services — no type suffix), `kebab-case-{type}.ts` (pipes, guards, resolvers, interceptors — hyphen-separated suffix, e.g. `auth-guard.ts`, `date-pipe.ts`)
- Classes: PascalCase
- Selectors: `app-<name>` for components, `[app<Name>]` for directives
- Barrel `index.ts` files: **do not create them** — they hurt tree-shaking with standalone components. Only `shared/components/index.ts` may have one as a convenience re-export for the UI kit.

## Interactive Workflow

Follow this step-by-step when the user asks to create something:

### Step 1: Determine artifact type

Ask: **"What do you want to create?"**

Options: feature, page, component, service, model, pipe, guard, resolver, directive, store, enum, interceptor

### Step 2: Ask follow-ups based on type

#### For a **Feature**:
- Domain name? (kebab-case, for grouping under `modules/`)
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
- Where does it live? Feature-level, page-local, or shared?
- If page-local, which page?
- If shared, which component group?
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

#### For an **Interceptor**:
- Core or feature-local?
- Name?
- Purpose / behavior?

### Step 3: Generate files

Create all files with proper Angular 17+ boilerplate:

**Standalone component (`<name>.ts`):**
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<name>.html',
})
export class <Name>Component {
  private readonly router = inject(Router);
}
```

**Component template (`<name>.html`):**
```html
<p><name> works!</p>
```

**Service with providedIn: 'root' (`<name>-api.ts`):**
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class <Name>Api {
  private readonly http = inject(HttpClient);
}
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
  loadChildren: () => import('./modules/<domain>/<feature>/<feature>.routes'),
}
```

**Signal store (`<feature>-store.ts`):**
```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class <Name>Store {
  readonly items = signal<Item[]>([]);
  readonly loading = signal(false);
  readonly selectedId = signal<string | null>(null);

  readonly selectedItem = computed(() =>
    this.items().find(i => i.id === this.selectedId())
  );

  async load() { /* ... */ }
  async create(data: Partial<Item>) { /* ... */ }
  async update(id: string, data: Partial<Item>) { /* ... */ }
  async delete(id: string) { /* ... */ }
}
```

**Component test (`<name>.spec.ts`):**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { <Name>Component } from './<name>';

describe('<Name>Component', () => {
  let component: <Name>Component;
  let fixture: ComponentFixture<<Name>Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [<Name>Component],
    }).compileComponents();

    fixture = TestBed.createComponent(<Name>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Service test (`<name>-api.spec.ts`):**
```typescript
import { TestBed } from '@angular/core/testing';
import { <Name>Api } from './<name>-api';

describe('<Name>Api', () => {
  let service: <Name>Api;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(<Name>Api);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

### Step 4: Update routes based on creation

| Scenario | Action |
|----------|--------|
| New **feature** created | Create `<feature>.routes.ts` with child routes + add lazy import in `app.routes.ts` (`./modules/<domain>/<feature>/<feature>.routes`) |
| New **page** in existing feature | Add route entry in `<feature>.routes.ts` |
| New **component / service / model / pipe / guard / resolver / store / enum / interceptor** | No route update needed |

### Step 5: Verify

- All paths are relative and correct
- File names follow naming conventions: no type suffix for components/directives/services; hyphen-separated suffix for guards/pipes/resolvers/interceptors (`auth-guard.ts`)
- Standalone components have `standalone: true` and proper `imports`
- Feature routes use `loadChildren` with `export default`. Page routes use `loadComponent` for individual lazy pages
- No barrel `index.ts` files created (except `shared/components/index.ts` if it already exists)
