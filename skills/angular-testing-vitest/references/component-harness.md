# ComponentHarness with CDK Testing

## Defining a harness
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

## Using the harness in tests
```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

let tabs: TabsHarness;

beforeEach(async () => {
  // ...configure TestBed, create fixture...
  const loader = TestbedHarnessEnvironment.loader(fixture);
  tabs = await loader.getHarness(TabsHarness);
});

it('should load courses and filter by category', async () => {
  const req = httpMock.expectOne('/api/courses');
  req.flush({ payload: MOCK_COURSES });
  await fixture.whenStable();
  fixture.detectChanges();

  expect(await tabs.getTabLabels()).toEqual(['Beginner', 'Advanced']);
  expect(await tabs.getActiveLabel()).toBe('Beginner');
});

it('should show advanced courses when tab clicked', async () => {
  const req = httpMock.expectOne('/api/courses');
  req.flush({ payload: MOCK_COURSES });
  await fixture.whenStable();

  await tabs.clickTabByIndex(1);

  const titles = de.queryAll(By.css('.course-card .card-header'));
  expect(titles).toHaveLength(1);
  expect(titles[0].nativeElement.textContent).toBe('Advanced Course');
});
```

## Key CDK testing APIs
| API | Purpose |
|-----|---------|
| `TestbedHarnessEnvironment.loader(fixture)` | Create harness loader |
| `loader.getHarness(HarnessClass)` | Get single harness instance |
| `static hostSelector` | CSS selector for component host |
| `this.locatorForAll(selector)` | Lazy loader for multiple elements |
| `button.text()` | Get text content from harness element |
| `button.hasClass(name)` | Check CSS class |
| `button.click()` | Click element |

## Sources
- `@angular-testing-in-depth/tabs/tabs.harness.ts`
- `@angular-testing-in-depth/courses/courses.spec.ts`
