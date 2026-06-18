---
name: angular-testing-vitest
description: |
  Angular testing with Vitest. Use when writing Angular unit tests with Vitest —
  component testing with TestBed, HTTP services with HttpTestingController,
  directives, pipes, CDK dialogs, signal forms, component harnesses, route
  resolvers, and fake timers. Follows patterns from
  /home/albert/projects/angular-testing-in-depth
license: MIT
compatibility: opencode
metadata:
  source: "Angular Testing In Depth project + angular-university.io blog"
  angular: "22"
  vitest: "4"
---

# Angular Testing with Vitest

Modern Angular (v20+) uses **Vitest** as the default test runner. The CLI builder is `@angular/build:unit-test`. Tests run in Node.js with `jsdom` or `happy-dom` DOM emulation.

## Quick Start

Dependencies:
```json
{
  "devDependencies": {
    "vitest": "^4.0.8",
    "@angular/build": "^22.0.0",
    "jsdom": "^27.1.0"
  }
}
```

`angular.json` test target:
```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "runnerConfig": "vitest-base.config.ts",
    "tsConfig": "tsconfig.spec.json"
  }
}
```

`vitest-base.config.ts`:
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

**`globals: false`** means `describe`, `it`, `expect`, `vi` must be imported explicitly.  
**`restoreMocks: true`** auto-cleans spies after each test — prevents test pollution.

---

## Table of Contents

| # | Topic | Source File |
|---|-------|-------------|
| 1 | [Vitest Basics: Spies, Mocks, Pure Mocks](#1-vitest-basics) | `common/calculator.spec.ts` |
| 2 | [Component Testing with TestBed](#2-component-testing) | `hello-world/hello-world.spec.ts` |
| 3 | [Pipe Testing (no TestBed)](#3-pipe-testing) | `pipes/duration-format.spec.ts` |
| 4 | [Directive Testing with Test Host](#4-directive-testing) | `directives/highlight.spec.ts` |
| 5 | [Service Testing with HttpTestingController](#5-http-service-testing) | `services/courses.spec.ts` |
| 6 | [Standalone Component Inputs/Outputs](#6-standalone-component-inputsoutputs) | `tabs/tabs.spec.ts` |
| 7 | [ComponentHarness with CDK Testing](#7-componentharness-cdk-testing) | `tabs/tabs.harness.ts`, `courses/courses.spec.ts` |
| 8 | [CDK Dialog Testing](#8-cdk-dialog-testing) | `courses-card-list/course-cards-list.spec.ts` |
| 9 | [Signal Form Testing](#9-signal-form-testing) | `courses-dialog/courses-dialog.spec.ts` |
| 10 | [Route Resolver Testing with RouterTestingHarness](#10-route-resolver-testing) | `services/course-resolver.spec.ts` |
| 11 | [Fake Timers for Debounce Testing](#11-fake-timers-for-debounce-testing) | `course-page/courses-page.spec.ts` |
| 12 | [Custom Test Helpers](#12-custom-test-helpers) | `testing/testing-data.ts`, `testing/testing-utils.ts` |
| 13 | [Configuration Reference](#13-configuration-reference) | `vitest-base.config.ts`, `angular.json` |

---

## 1. Vitest Basics

**File:** `@angular-testing-in-depth/common/calculator.spec.ts`

All Vitest APIs require explicit imports when `globals: false`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

### Spying
Observes calls without changing behavior:
```ts
const spy = vi.spyOn(calculator, 'add');
calculator.add(2, 3);
expect(spy).toHaveBeenCalledOnce();
expect(spy).toHaveBeenCalledWith(2, 3);
```

### Mocking
Overrides implementation while tracking calls:
```ts
const spy = vi.spyOn(calculator, 'add').mockReturnValue(5);
expect(calculator.add(2, 3)).toBe(5); // real logic bypassed
expect(calculator.add(5, 5)).toBe(5); // always returns 5
```

### Pure Mocks (vi.fn())
Standalone mock with no real implementation:
```ts
const addMock = vi.fn().mockReturnValue(10);
expect(addMock(5, 5)).toBe(10);
expect(addMock).toHaveBeenCalledOnce();
expect(addMock).toHaveBeenCalledWith(5, 5);
```

### mockClear vs mockReset vs mockRestore

| Method | Clears calls | Removes mock behavior | Restores original |
|--------|-------------|----------------------|-------------------|
| `mockClear()` | ✅ | ❌ | ❌ |
| `mockReset()` | ✅ | ✅ | ❌ |
| `mockRestore()` | ✅ | ✅ | ✅ |

```ts
spy.mockClear();   // wipe call history, keep spy active
spy.mockReset();   // wipe history + remove mockReturnValue, keep spy
spy.mockRestore(); // remove spy entirely, restore original function
```

For pure mocks (`vi.fn()`), `mockReset()` returns the function to returning `undefined`.

---

## 2. Component Testing

**File:** `@angular-testing-in-depth/hello-world/hello-world.spec.ts`

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

let fixture: ComponentFixture<HelloWorld>;
let de: DebugElement;
let el: HTMLElement;
let component: HelloWorld;

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [HelloWorld] // standalone component
  }).compileComponents();
  fixture = TestBed.createComponent(HelloWorld);
  de = fixture.debugElement;
  el = de.nativeElement;
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('should display the message', () => {
  const h1 = el.querySelector('h1');
  expect(h1?.textContent).toEqual(component.message);
});
```

**Key Pattern:** Always call `compileComponents()` (async), then `createComponent()`, then `detectChanges()`.

---

## 3. Pipe Testing

**File:** `@angular-testing-in-depth/pipes/duration-format.spec.ts`

Pipes are plain classes — no TestBed needed:
```ts
let pipe: DurationFormatPipe;

beforeEach(() => {
  pipe = new DurationFormatPipe();
});

it('should format duration', () => {
  expect(pipe.transform('05:30')).toBe('05h 30m');
});

it('should handle null or undefined', () => {
  expect(pipe.transform(null as any)).toBe('');
  expect(pipe.transform(undefined as any)).toBe('');
});

it('should return the original value if invalid input', () => {
  expect(pipe.transform('90')).toBe('90');
});
```

---

## 4. Directive Testing

**File:** `@angular-testing-in-depth/directives/highlight.spec.ts`

Use an inline **TestHostComponent** to wrap the directive:
```ts
@Component({
  imports: [HighlightDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div id="default-highlight" appHighlight>Default Color</div>
    <div id="custom-highlight" appHighlight highlightColor="rgb(0, 0, 255)">
      Custom Color</div>
    <div id="no-highlight">No Directive</div>
  `
})
class TestHostComponent {}
```

Test by dispatching DOM events and asserting on styles:
```ts
it('should highlight when mouse over, clear when mouse leaves', () => {
  defaultHighlight.dispatchEvent(new Event('mouseenter'));
  fixture.detectChanges();
  expect(defaultHighlight.style.backgroundColor).toBe('rgb(0, 128, 0)');

  defaultHighlight.dispatchEvent(new Event('mouseleave'));
  fixture.detectChanges();
  expect(defaultHighlight.style.backgroundColor).toBe('');
});

it('should not affect elements without the directive', () => {
  noHighlight.dispatchEvent(new Event('mouseenter'));
  fixture.detectChanges();
  expect(noHighlight.style.backgroundColor).toBe('');
});
```

---

## 5. HTTP Service Testing

**File:** `@angular-testing-in-depth/services/courses.spec.ts`

```ts
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      CoursesService,
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  });
  service = TestBed.inject(CoursesService);
  httpTestingController = TestBed.inject(HttpTestingController);
});

afterEach(() => {
  httpTestingController.verify(); // ensure no unmatched requests
});
```

### GET request
```ts
it('should load all courses', async () => {
  const coursesPromise = service.reloadAllCourses();
  const req = httpTestingController.expectOne('/api/courses');
  expect(req.request.method).toBe('GET');
  req.flush({ payload: MOCK_COURSES });
  const result = await coursesPromise;
  expect(result).toBe(MOCK_COURSES);
  expect(service.allCourses()).toBe(MOCK_COURSES); // signal value
});
```

### GET with query params
```ts
it('should find lessons by query', async () => {
  const promise = service.findLessons(12, 'filter-text', 'desc', 2, 10);
  const req = httpTestingController.expectOne(req => req.url === '/api/lessons');
  expect(req.request.params.get('courseId')).toBe('12');
  expect(req.request.params.get('filter')).toBe('filter-text');
  expect(req.request.params.get('sortOrder')).toBe('desc');
  expect(req.request.params.get('pageNumber')).toBe('2');
  expect(req.request.params.get('pageSize')).toBe('10');
  req.flush({ payload: [{ id: 12, description: 'Lesson 1' }] });
  expect(await promise).toEqual([{ id: 12, description: 'Lesson 1' }]);
});
```

### PUT (save + verify signal update)
```ts
it('should save course', async () => {
  // first load courses
  const loadPromise = service.reloadAllCourses();
  const loadReq = httpTestingController.expectOne('/api/courses');
  loadReq.flush({ payload: [course1, course2] });
  await loadPromise;

  // then save
  const changes: Partial<Course> = { titles: { description: 'New Title' } };
  const savePromise = service.saveCourse(1, changes);
  const saveReq = httpTestingController.expectOne('/api/courses/1');
  expect(saveReq.request.method).toBe('PUT');
  expect(saveReq.request.body).toBe(changes);
  saveReq.flush({ ...course1, ...changes });
  await savePromise;

  // verify signal updated
  expect(service.allCourses()[0].titles.description).toBe('New Title');
});
```

### Error handling
```ts
it('should handle 404 error', async () => {
  const coursePromise = service.findCourseById(999);
  const req = httpTestingController.expectOne('/api/courses/999');
  req.flush('Course not found', { status: 404, statusText: 'Not Found' });
  expect(coursePromise).rejects.toThrow();
});

it('should handle network error', async () => {
  const coursePromise = service.findCourseById(1);
  const req = httpTestingController.expectOne('/api/courses/1');
  req.error(new ProgressEvent('network error'));
  expect(coursePromise).rejects.toThrow();
});
```

---

## 6. Standalone Component Inputs/Outputs

**File:** `@angular-testing-in-depth/tabs/tabs.spec.ts`

### Setting inputs with `componentRef.setInput`
```ts
fixture.componentRef.setInput('tabs', mockTabs);
fixture.detectChanges();
```

### Querying rendered output
```ts
const buttons = de.queryAll(By.css('.tab-link'));
expect(buttons.length).toBe(2);
expect(buttons[0].nativeElement.textContent.trim()).toBe('Beginner');
```

### Updating input and checking class
```ts
fixture.componentRef.setInput('activeTab', 'advanced');
fixture.detectChanges();
const button = de.query(By.css('.tab-link:last-child'));
expect(button.nativeElement.classList).toContain('active');
```

### Spying on output emits
```ts
const emitSpy = vi.spyOn(component.tabChanged, 'emit');
button.nativeElement.click();
fixture.detectChanges();
expect(emitSpy).toHaveBeenCalledWith('advanced');
expect(emitSpy).toHaveBeenCalledOnce();
```

---

## 7. ComponentHarness (CDK Testing)

**File:** `@angular-testing-in-depth/tabs/tabs.harness.ts` + `tabs/tabs.spec.ts`

Define a harness with `ComponentHarness`:
```ts
import { ComponentHarness } from '@angular/cdk/testing';

export class TabsHarness extends ComponentHarness {
  static hostSelector = 'tabs';

  private getButtons = this.locatorForAll('button.tab-link');

  async getTabLabels(): Promise<string[]> {
    const buttons = await this.getButtons();
    return Promise.all(buttons.map(button => button.text()));
  }

  async getActiveLabel(): Promise<string | null> {
    const buttons = await this.getButtons();
    for (const button of buttons) {
      if (await button.hasClass('active')) return button.text();
    }
    return null;
  }

  async clickTabByIndex(index: number) {
    const buttons = await this.getButtons();
    await buttons[index].click();
  }
}
```

Use it in tests with `TestbedHarnessEnvironment`:
```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

beforeEach(async () => {
  // ...configure TestBed, create fixture...
  const loader = TestbedHarnessEnvironment.loader(fixture);
  tabs = await loader.getHarness(TabsHarness);
});

it('should load courses and filter by category', async () => {
  // ...flush HTTP request...
  expect(await tabs.getTabLabels()).toEqual(['Beginner', 'Advanced']);
  expect(await tabs.getActiveLabel()).toBe('Beginner');
});

it('should show advanced courses when tab clicked', async () => {
  // ...flush HTTP request...
  await tabs.clickTabByIndex(1);
  // ...assert DOM updated...
});
```

---

## 8. CDK Dialog Testing

**File:** `@angular-testing-in-depth/courses-card-list/course-cards-list.spec.ts`

Opening a CDK `Dialog` in a component test:
```ts
it('should open dialog when clicking the edit button', () => {
  const btn = de.query(By.css('.course-card:first-child .edit-btn'));
  btn.nativeElement.click();
  fixture.detectChanges();
  const form = document.querySelectorAll('.course-form');
  expect(form, 'The edit course form should be visible.').toBeTruthy();
});
```

For testing the dialog component itself (`@angular-testing-in-depth/courses-dialog/courses-dialog.spec.ts`), provide mocks for `DIALOG_DATA` and `DialogRef`:
```ts
beforeEach(async () => {
  mockCoursesService = { saveCourse: vi.fn().mockResolvedValue({}) };
  mockDialogRef = { close: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [CoursesDialog],
    providers: [
      { provide: CoursesService, useValue: mockCoursesService },
      { provide: DialogRef, useValue: mockDialogRef },
      { provide: DIALOG_DATA, useValue: { course: MOCK_COURSES[0] } }
    ]
  }).compileComponents();
});
```

---

## 9. Signal Form Testing

**File:** `@angular-testing-in-depth/courses-dialog/courses-dialog.spec.ts`

Testing signal-based forms (`@angular/forms/signals`):
```ts
import { FieldState } from '@angular/forms/signals';

it('should initialize the form with course data', () => {
  expect(component.courseForm.description().value()).toBe('Beginner Course');
  expect(component.courseForm.category().value()).toBe('BEGINNER');
  expect(component.courseForm().valid()).toBe(true);
});

it('should call saveCourse and close dialog', async () => {
  component.courseForm.description().value.set('New Course Title');
  fixture.detectChanges();
  clickButton(de, '.btn-primary');
  await fixture.whenStable();
  expect(mockCoursesService.saveCourse).toHaveBeenLastCalledWith(
    1,
    expect.objectContaining({
      titles: expect.objectContaining({ description: 'New Course Title' })
    })
  );
  expect(mockDialogRef.close).toHaveBeenCalled();
});

it('should handle all form field errors', () => {
  testFieldError(component.courseForm.description(), '.description', 'Description is required');
});

function testFieldError(fieldState: FieldState<any>, selector: string, message: string) {
  fieldState.value.set('');
  fieldState.markAsTouched();
  fixture.detectChanges();
  const errorList = de.query(By.css(`${selector} .error-list`));
  expect(errorList).toBeTruthy();
  expect(errorList.nativeElement.textContent).toContain(message);
  const saveBtn = de.query(By.css('.btn-primary'))?.nativeElement;
  expect(saveBtn?.disabled).toBe(true);
}
```

---

## 10. Route Resolver Testing

**File:** `@angular-testing-in-depth/services/course-resolver.spec.ts`

Use `RouterTestingHarness` to test route resolvers end-to-end:
```ts
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

beforeEach(async () => {
  mockCoursesService = { findCourseById: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [CoursePage],
    providers: [
      { provide: CoursesService, useValue: mockCoursesService },
      provideRouter([
        {
          path: 'courses/:id',
          component: CoursePage,
          resolve: { course: courseResolver }
        }
      ])
    ]
  }).compileComponents();

  harness = await RouterTestingHarness.create();
});

it('should load correct course by Id', async () => {
  mockCoursesService.findCourseById.mockResolvedValueOnce(MOCK_COURSES[0]);

  const component = await harness.navigateByUrl('/courses/1', CoursePage);

  expect(TestBed.inject(Router).url).toBe('/courses/1');
  expect(mockCoursesService.findCourseById).toHaveBeenCalledOnce();
  expect(mockCoursesService.findCourseById).toHaveBeenLastCalledWith('1');
  expect(component.course()).toEqual(MOCK_COURSES[0]);
  expect(harness.routeNativeElement?.textContent).toContain('Beginner Course');
});
```

---

## 11. Fake Timers for Debounce Testing

**File:** `@angular-testing-in-depth/course-page/courses-page.spec.ts`

```ts
it('should debounce search input by 400ms', async () => {
  vi.useFakeTimers();

  mockCoursesService.findLessons.mockReturnValueOnce(FIRST_PAGE);
  fixture.detectChanges();
  expect(mockCoursesService.findLessons).toHaveBeenCalledTimes(1);

  mockCoursesService.findLessons.mockReturnValueOnce(SEARCH_RESULTS);
  component.onSearch('Lesson 20');

  vi.advanceTimersByTime(399); // still within debounce window
  fixture.detectChanges();
  expect(mockCoursesService.findLessons).toHaveBeenCalledTimes(1); // not yet called

  vi.advanceTimersByTime(1); // crosses 400ms threshold
  fixture.detectChanges();
  expect(mockCoursesService.findLessons).toHaveBeenCalledTimes(2);
  expect(mockCoursesService.findLessons)
    .toHaveBeenLastCalledWith(1, 'Lesson 20', 'asc', 0, 3);

  await vi.runAllTimersAsync(); // flush remaining async work
  expect(component.lessons()?.length).toBe(1);
});

afterEach(() => {
  vi.useRealTimers(); // always restore real timers
});
```

**Tips:**
- Use `vi.useFakeTimers()` at the start of the test
- Use `vi.advanceTimersByTime(ms)` to tick the clock
- Use `vi.runAllTimersAsync()` to flush pending async timers
- Always restore with `vi.useRealTimers()` in `afterEach`

---

## 12. Custom Test Helpers

**File:** `@angular-testing-in-depth/testing/testing-data.ts`

Factory function with defaults for creating test data:
```ts
export function createCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 12,
    seqNo: 1,
    titles: { description: 'Angular Testing', longDescription: 'A deep dive into testing' },
    iconUrl: 'test.png',
    uploadedImageUrl: '',
    courseListIcon: '',
    category: 'BEGINNER',
    lessonsCount: 10,
    ...overrides
  };
}

export const MOCK_COURSES: Course[] = [
  createCourse({ id: 1, category: 'BEGINNER', titles: { description: 'Beginner Course', longDescription: 'Theory' } }),
  createCourse({ id: 2, category: 'ADVANCED', titles: { description: 'Advanced Course', longDescription: 'Practice' } })
];
```

**File:** `@angular-testing-in-depth/testing/testing-utils.ts`

DOM query helpers:
```ts
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

export function clickButton(de: DebugElement, selector: string) {
  const btn = de.query(By.css(selector));
  btn.nativeElement.click();
}

export function getTableContent(de: DebugElement, selector: string) {
  return de.queryAll(By.css(selector)).map(el => el?.nativeElement?.textContent ?? 'not found');
}
```

---

## 13. Configuration Reference

### Vitest Config (`vitest-base.config.ts`)
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,       // import describe/it/expect/vi explicitly
    environment: 'jsdom', // DOM emulation (alternative: 'happy-dom')
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,   // auto vi.restoreAllMocks() after each test
    clearMocks: true,     // auto mockClear() after each test
    mockReset: true       // auto mockReset() after each test
  },
});
```

### Angular Test Target (`angular.json`)
```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "runnerConfig": "vitest-base.config.ts",
    "tsConfig": "tsconfig.spec.json"
  }
}
```

### Key Vitest Config Options

| Option | Purpose |
|--------|---------|
| `globals: false` | Require explicit imports from `vitest` |
| `environment: 'jsdom'` | Simulate browser DOM in Node.js |
| `restoreMocks: true` | Restore original functions after each test |
| `clearMocks: true` | Clear call history after each test |
| `mockReset: true` | Reset mock implementations after each test |
| `include: ['src/**/*.spec.ts']` | Test file discovery pattern |

### Package.json Dependencies
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

---

## Vitest API Quick Reference

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

| API | Purpose |
|-----|---------|
| `vi.spyOn(obj, 'method')` | Spy on method, keeps real implementation |
| `vi.spyOn(obj, 'method').mockReturnValue(v)` | Spy + override return |
| `vi.fn().mockReturnValue(v)` | Pure mock function |
| `vi.fn().mockResolvedValue(v)` | Pure mock returning Promise |
| `vi.useFakeTimers()` | Replace timers with fake ones |
| `vi.advanceTimersByTime(ms)` | Advance fake timers |
| `vi.runAllTimersAsync()` | Flush all pending async timers |
| `vi.useRealTimers()` | Restore real timers |
| `mockFn.mockClear()` | Clear call history only |
| `mockFn.mockReset()` | Clear history + remove mock behavior |
| `mockFn.mockRestore()` | Clear + reset + restore original |
| `expect().toHaveBeenCalledOnce()` | Assert single call |
| `expect().toHaveBeenCalledWith(...)` | Assert specific arguments |
| `expect().toHaveBeenLastCalledWith(...)` | Assert last call arguments |
| `expect().toHaveBeenCalledTimes(n)` | Assert call count |
| `expect.objectContaining({})` | Partial object match |
| `mockFn.mockResolvedValueOnce(v)` | Single-use resolved promise |
