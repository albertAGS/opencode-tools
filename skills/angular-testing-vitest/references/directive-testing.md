# Directive Testing with Test Host Component

## Pattern: Inline TestHostComponent
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

## Test setup
```ts
let fixture: ComponentFixture<TestHostComponent>;

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [TestHostComponent]
  }).compileComponents();

  fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();

  defaultHighlight = de.query(By.css('#default-highlight')).nativeElement;
  customHighlight = de.query(By.css('#custom-highlight')).nativeElement;
  noHighlight = de.query(By.css('#no-highlight')).nativeElement;
});
```

## Testing directive behavior
```ts
it('should highlight when mouse over, clear when mouse leaves', () => {
  defaultHighlight.dispatchEvent(new Event('mouseenter'));
  fixture.detectChanges();
  expect(defaultHighlight.style.backgroundColor).toBe('rgb(0, 128, 0)');

  defaultHighlight.dispatchEvent(new Event('mouseleave'));
  fixture.detectChanges();
  expect(defaultHighlight.style.backgroundColor).toBe('');
});

it('should apply custom color', () => {
  customHighlight.dispatchEvent(new Event('mouseenter'));
  fixture.detectChanges();
  expect(customHighlight.style.backgroundColor).toBe('rgb(0, 0, 255)');
});

it('should not affect elements without the directive', () => {
  noHighlight.dispatchEvent(new Event('mouseenter'));
  fixture.detectChanges();
  expect(noHighlight.style.backgroundColor).toBe('');
});
```

## Key points
- Test host component wraps the directive in realistic templates
- Use `dispatchEvent(new Event(...))` to trigger DOM events
- Always call `fixture.detectChanges()` after DOM mutations
- Test both the effect AND that non-targeted elements are unaffected

## Source
`@angular-testing-in-depth/directives/highlight.spec.ts`
