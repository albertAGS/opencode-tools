# Signal Form Testing (@angular/forms/signals)

## Mock providers for dialog dependencies
```ts
let mockCoursesService: any;
let mockDialogRef: any;

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

## Testing signal form initialization
```ts
it('should initialize the form with course data', () => {
  expect(component.courseForm.description().value()).toBe('Beginner Course');
  expect(component.courseForm.category().value()).toBe('BEGINNER');
  expect(component.courseForm.releasedAt().value())
    .toBe(new Date().toLocaleDateString('en-CA'));
  expect(component.courseForm.longDescription().value()).toBe('Theory');
  expect(component.courseForm().valid()).toBe(true);
});
```

## Testing field mutation and save
```ts
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
```

## Testing field validation errors
```ts
import { FieldState } from '@angular/forms/signals';

it('should handle all form field errors', () => {
  testFieldError(component.courseForm.description(), '.description', 'Description is required');
  testFieldError(component.courseForm.category(), '.category', 'Category is required');
  testFieldError(component.courseForm.releasedAt(), '.released-at', 'Release Date is required');
  testFieldError(component.courseForm.longDescription(), '.long-description', 'Long Description is required');
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

## Key signal form patterns
| API | Purpose |
|-----|---------|
| `field.value` | Read signal holding current value |
| `field.value.set(v)` | Set value via signal |
| `field.markAsTouched()` | Trigger validation display |
| `field.invalid()` | Read-only signal for validity |
| `form().valid()` | Form-level validity signal |
| `expect.objectContaining({})` | Partial object matching in assertions |

## Source
`@angular-testing-in-depth/courses-dialog/courses-dialog.spec.ts`
