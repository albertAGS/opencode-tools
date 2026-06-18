# Custom Test Helpers

## Test Data Factory
```ts
import { Course } from '../model/course';

export function createCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 12,
    seqNo: 1,
    titles: {
      description: 'Angular Testing',
      longDescription: 'A deep dive into testing'
    },
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

## Paginated Data Generator
```ts
export function getMockLessonsPage(
  courseId: number,
  filter = '',
  sortOrder = 'asc',
  pageNumber = 0,
  pageSize = 3
) {
  let lessons = MOCK_LESSONS.filter(l => l.courseId === courseId);

  if (filter?.trim()) {
    const q = filter.toLowerCase();
    lessons = lessons.filter(l => l.description.toLowerCase().includes(q));
  }

  lessons = [...lessons].sort((a, b) => {
    return sortOrder === 'asc' ? a.seqNo - b.seqNo : b.seqNo - a.seqNo;
  });

  const start = pageNumber * pageSize;
  return lessons.slice(start, start + pageSize);
}
```

## DOM Query Helpers
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

## Benefits
- **Factories** keep test data creation DRY (single source of truth)
- **`...overrides`** pattern makes tests expressive — only specify what differs
- **DOM helpers** encapsulate repetitive query logic
- **Paginated generators** enable realistic multi-page scenarios without large data

## Sources
- `@angular-testing-in-depth/testing/testing-data.ts`
- `@angular-testing-in-depth/testing/testing-utils.ts`
