# Pipe Testing (no TestBed)

Pipes are plain classes. No `TestBed` needed.

## Basic pattern
```ts
import { DurationFormatPipe } from './duration-format.pipe';

let pipe: DurationFormatPipe;

beforeEach(() => {
  pipe = new DurationFormatPipe();
});

it('should create the pipe', () => {
  expect(pipe).toBeTruthy();
});

it('should format duration', () => {
  expect(pipe.transform('05:30')).toBe('05h 30m');
});
```

## Edge cases
```ts
it('should handle null or undefined', () => {
  expect(pipe.transform(null as any)).toBe('');
  expect(pipe.transform(undefined as any)).toBe('');
});

it('should return the original value if invalid input', () => {
  expect(pipe.transform('90')).toBe('90');
});

it('should only format the first two parts', () => {
  expect(pipe.transform('01:20:45')).toBe('01h 20m');
});
```

## Source
`@angular-testing-in-depth/pipes/duration-format.spec.ts`
