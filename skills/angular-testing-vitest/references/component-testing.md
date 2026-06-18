# Component Testing with TestBed

## Basic pattern
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

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

it('should create the component', () => {
  expect(fixture.componentInstance).toBeDefined();
});

it('should display the message', () => {
  const h1 = el.querySelector('h1');
  expect(h1).toBeDefined();
  expect(h1?.textContent).toEqual(component.message);
});
```

## Setting inputs with componentRef
```ts
fixture.componentRef.setInput('tabs', mockTabs);
fixture.detectChanges();
```

## DOM queries
```ts
import { By } from '@angular/platform-browser';

// Single element
const title = de.query(By.css('.card-header'));

// Multiple elements
const buttons = de.queryAll(By.css('.tab-link'));

// Native element access
const text = title.nativeElement.textContent;

// Class assertions
expect(button.nativeElement.classList).toContain('active');
```

## Spying on output emits
```ts
it('should emit tabChanged when a tab is clicked', () => {
  const emitSpy = vi.spyOn(component.tabChanged, 'emit');
  button.nativeElement.click();
  fixture.detectChanges();
  expect(emitSpy).toHaveBeenCalledWith('advanced');
  expect(emitSpy).toHaveBeenCalledOnce();
});
```

## Sources
- `@angular-testing-in-depth/hello-world/hello-world.spec.ts`
- `@angular-testing-in-depth/tabs/tabs.spec.ts`
