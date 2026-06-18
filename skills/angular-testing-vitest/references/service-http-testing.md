# HTTP Service Testing with HttpTestingController

## Setup
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
  httpTestingController.verify(); // fails test if any unmatched requests
});
```

## GET — expectOne by URL
```ts
const coursesPromise = service.reloadAllCourses();
const req = httpTestingController.expectOne('/api/courses');
expect(req.request.method).toBe('GET');
req.flush({ payload: MOCK_COURSES });
const result = await coursesPromise;
```

## GET with query params
```ts
const promise = service.findLessons(12, 'filter-text', 'desc', 2, 10);
const req = httpTestingController.expectOne(r => r.url === '/api/lessons');
expect(req.request.params.get('courseId')).toBe('12');
// ...assert all params...
req.flush({ payload: [{ id: 12, description: 'Lesson 1' }] });
```

## PUT — save + verify signal state
```ts
const savePromise = service.saveCourse(1, changes);
const saveReq = httpTestingController.expectOne('/api/courses/1');
expect(saveReq.request.method).toBe('PUT');
expect(saveReq.request.body).toBe(changes);
saveReq.flush({ ...course1, ...changes });
await savePromise;
expect(service.allCourses()[0].titles.description).toBe('New Title');
```

## 404 error
```ts
const coursePromise = service.findCourseById(999);
const req = httpTestingController.expectOne('/api/courses/999');
req.flush('Course not found', { status: 404, statusText: 'Not Found' });
expect(coursePromise).rejects.toThrow();
```

## Network error
```ts
const coursePromise = service.findCourseById(1);
const req = httpTestingController.expectOne('/api/courses/1');
req.error(new ProgressEvent('network error'));
expect(coursePromise).rejects.toThrow();
```

## Key methods
| Method | Purpose |
|--------|---------|
| `httpMock.expectOne(url)` | Assert exactly 1 request to URL |
| `httpMock.expectOne(predicate)` | Assert request matching predicate |
| `req.flush(data)` | Resolve with response data |
| `req.flush(msg, { status, statusText })` | Resolve with error status |
| `req.error(event)` | Simulate network failure |
| `httpMock.verify()` | Assert no unmatched requests |

## Source
`@angular-testing-in-depth/services/courses.spec.ts`
