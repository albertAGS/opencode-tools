# Route Resolver Testing with RouterTestingHarness

## Setup
```ts
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

let mockCoursesService: any;
let harness: RouterTestingHarness;

beforeEach(async () => {
  mockCoursesService = { findCourseById: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [CoursePage],
    providers: [
      { provide: CoursesService, useValue: mockCoursesService },
      provideRouter([{
        path: 'courses/:id',
        component: CoursePage,
        resolve: { course: courseResolver }
      }])
    ]
  }).compileComponents();

  harness = await RouterTestingHarness.create();
});
```

## Test resolver + component rendering
```ts
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

## Key points
- Mock the service the resolver depends on with `mockResolvedValueOnce`
- `RouterTestingHarness.create()` creates a harness without navigating
- `harness.navigateByUrl(path, Component)` navigates AND returns the component instance
- `harness.routeNativeElement` gives the rendered component's DOM
- `TestBed.inject(Router).url` verifies the actual route changed

## Source
`@angular-testing-in-depth/services/course-resolver.spec.ts`
