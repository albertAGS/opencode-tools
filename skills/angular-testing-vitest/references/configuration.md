# Configuration Reference

## Vitest Config (vitest-base.config.ts)
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true
  },
});
```

## Angular Test Target (angular.json)
```json
{
  "projects": {
    "your-project": {
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "runnerConfig": "vitest-base.config.ts",
            "tsConfig": "tsconfig.spec.json"
          }
        }
      }
    }
  }
}
```

## Package.json Dependencies
```json
{
  "devDependencies": {
    "@angular/build": "^22.0.0",
    "@angular/cli": "^22.0.0",
    "@angular/compiler-cli": "^22.0.0",
    "vitest": "^4.0.8",
    "jsdom": "^27.1.0",
    "@vitest/coverage-v8": "^4.1.3"
  }
}
```

## Config Options Explained

| Option | Values | Purpose |
|--------|--------|---------|
| `globals` | `false` (recommended) | Forces explicit `import { describe, it, expect, vi } from 'vitest'` |
| `environment` | `'jsdom'` / `'happy-dom'` | DOM emulation for Node.js test execution |
| `restoreMocks` | `true` | Auto `mockRestore()` on all spies after each test |
| `clearMocks` | `true` | Auto `mockClear()` on all mocks after each test |
| `mockReset` | `true` | Auto `mockReset()` on all mocks after each test |

## NPM Script
```json
"scripts": {
  "test": "ng test"
}
```

## Run modes
```bash
ng test           # watch mode (default)
ng test --watch false  # single run (CI)
ng test --browsers   # browser mode (Playwright)
```

## Sources
- `@angular-testing-in-depth/vitest-base.config.ts`
- `@angular-testing-in-depth/angular.json`
- `@angular-testing-in-depth/package.json`
