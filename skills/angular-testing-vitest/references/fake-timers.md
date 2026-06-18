# Fake Timers for Debounce Testing

## Basic pattern
```ts
it('should debounce search input by 400ms', async () => {
  vi.useFakeTimers();

  // trigger debounced action
  component.onSearch('Lesson 20');

  // advance time but stay within debounce window
  vi.advanceTimersByTime(399);
  fixture.detectChanges();
  expect(mockService.method).toHaveBeenCalledTimes(1); // not called yet

  // cross the threshold
  vi.advanceTimersByTime(1);
  fixture.detectChanges();
  expect(mockService.method).toHaveBeenCalledTimes(2);

  // flush remaining async timers
  await vi.runAllTimersAsync();
  expect(component.signalValue()?.length).toBe(1);
});

afterEach(() => {
  vi.useRealTimers(); // ALWAYS restore
});
```

## Complete example from course-page
```ts
it('should debounce search input by 400ms', async () => {
  vi.useFakeTimers();

  mockCoursesService.findLessons.mockReturnValueOnce(FIRST_PAGE);
  fixture.detectChanges();
  expect(mockCoursesService.findLessons).toHaveBeenCalledTimes(1);

  mockCoursesService.findLessons.mockReturnValueOnce(SEARCH_RESULTS);
  component.onSearch('Lesson 20');

  vi.advanceTimersByTime(399);
  fixture.detectChanges();
  expect(mockCoursesService.findLessons).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(1);
  fixture.detectChanges();
  expect(mockCoursesService.findLessons).toHaveBeenCalledTimes(2);
  expect(mockCoursesService.findLessons)
    .toHaveBeenLastCalledWith(1, 'Lesson 20', 'asc', 0, 3);

  await vi.runAllTimersAsync();

  expect(component.lessons()?.length).toBe(1);

  const lessons = getTableContent(de, 'tbody tr td.description-cell');
  expect(lessons).toHaveLength(1);
  expect(lessons[0]).toBe('Lesson 20');
});

afterEach(() => {
  vi.useRealTimers();
});
```

## Key APIs
| API | Purpose |
|-----|---------|
| `vi.useFakeTimers()` | Replace all timers with fakes |
| `vi.advanceTimersByTime(ms)` | Advance the clock by ms |
| `vi.runAllTimersAsync()` | Run all pending async timers to completion |
| `vi.useRealTimers()` | Restore real timer implementations |

## Important
Always call `vi.useRealTimers()` in `afterEach` to avoid leaking fake timers between tests.

## Source
`@angular-testing-in-depth/course-page/courses-page.spec.ts`
