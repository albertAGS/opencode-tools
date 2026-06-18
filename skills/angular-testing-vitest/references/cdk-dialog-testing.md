# CDK Dialog Testing

## Testing component that OPENS a dialog
```ts
it('should open dialog when clicking the edit button', () => {
  const btn = de.query(By.css('.course-card:first-child .edit-btn'));
  btn.nativeElement.click();
  fixture.detectChanges();

  const form = document.querySelectorAll('.course-form');
  expect(form, 'The edit course form should be visible.').toBeTruthy();
});
```

## Testing the dialog component itself
Provide mocks for `DialogRef` and `DIALOG_DATA`:
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

  fixture = TestBed.createComponent(CoursesDialog);
  component = fixture.componentInstance;
  fixture.detectChanges();
});
```

## Key points
- `DIALOG_DATA` provides the data passed via `Dialog.open(data)`
- `DialogRef` provides `close()` — spy on it to verify dialog closes
- The dialog form is rendered in the document body (use `document.querySelectorAll`)
- `expect.objectContaining({})` for partial match on complex objects

## Sources
- `@angular-testing-in-depth/courses-card-list/course-cards-list.spec.ts` (opening dialog)
- `@angular-testing-in-depth/courses-dialog/courses-dialog.spec.ts` (testing dialog component)
