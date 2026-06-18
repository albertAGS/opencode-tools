# Vitest Basics: Spies, Mocks, Pure Mocks

## Explicit imports (globals: false)
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

## vi.spyOn — Observe without changing behavior
```ts
const spy = vi.spyOn(calculator, 'add');
const result = calculator.add(2, 3);
expect(result).toBe(5);
expect(spy).toHaveBeenCalledOnce();
expect(spy).toHaveBeenCalledWith(2, 3);
```

## vi.spyOn + mockReturnValue — Override implementation
```ts
const spy = vi.spyOn(calculator, 'add').mockReturnValue(5);
expect(calculator.add(2, 3)).toBe(5); // real logic bypassed
expect(calculator.add(5, 5)).toBe(5); // always 5
expect(spy).toHaveBeenCalledTimes(2);
```

## vi.fn() — Pure mock (no real implementation)
```ts
const addMock = vi.fn().mockReturnValue(10);
expect(addMock(5, 5)).toBe(10);
expect(addMock).toHaveBeenCalledOnce();
expect(addMock).toHaveBeenCalledWith(5, 5);
```

## mockClear — wipe call history only
```ts
spy.mockClear();
// spy still active, still tracking, but history is cleared
```

## mockReset — wipe history + remove mock behavior
```ts
spy.mockReset();
// For spies: original function is called again
// For pure mocks: returns undefined

spy.mockReturnValue(10);
spy.mockReset();
// Now spy returns original result, not 10
```

## mockRestore — full cleanup (clear + reset + detach)
```ts
spy.mockRestore();
// Original function restored, spy completely removed
// Future calls not tracked
```

## Configuration — auto cleanup between tests
```ts
// vitest-base.config.ts
export default defineConfig({
  test: {
    restoreMocks: true,  // calls mockRestore on all spies after each test
    clearMocks: true,    // calls mockClear on all mocks after each test
    mockReset: true      // calls mockReset on all mocks after each test
  }
});
```

## Source
`@angular-testing-in-depth/common/calculator.spec.ts`
