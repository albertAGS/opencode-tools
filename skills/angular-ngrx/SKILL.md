---
name: angular-ngrx
description: |
  NgRx state management skill for Angular projects. Use when the user asks
  about NgRx patterns, state management with Store/Effects/Reducers/Selectors,
  or generating NgRx feature slices. Follows the reference patterns from
  https://github.com/amosISA/angular-state-management
---

# Angular NgRx Skill

## Reference Folder Structure

```
src/app/
├── core/
│   └── core.provider.ts                 # Injection tokens, app-wide providers
├── layout/
│   ├── components/
│   │   ├── header.component.ts
│   │   └── header.component.html
│   ├── layout.component.ts
│   ├── layout.component.html
│   └── layout.routes.ts                 # Lazy-loaded child routes
├── modules/
│   ├── components/
│   │   └── <feature>/
│   │       ├── <feature>.component.ts
│   │       ├── <feature>.component.html
│   │       └── <feature>.service.ts     # Data service (providedIn: 'root')
│   ├── resolvers/
│   │   └── <name>.resolver.ts           # Functional route resolvers
│   └── ... (feature modules)
├── shared/
│   └── directives/
│       └── <name>.directive.ts
├── state/                               # Central NgRx state
│   ├── <slice>.actions.ts               # Action creators
│   ├── <slice>.reducer.ts               # Reducer + feature selectors
│   ├── <slice>.selectors.ts             # Derived selectors (optional)
│   └── <slice>.effects.ts               # Side effects (optional)
├── app.component.ts
├── app.config.ts                        # Store/Effects/Router providers
└── app.routes.ts
```

## NgRx Patterns

### 1. Multi-slice Store Setup

The store can have **multiple slices**. Register them in `app.config.ts`:

- **Global/App slice** — registered with `provideStore({ [featureKey]: reducer })`
- **Feature slice** — registered with `provideState(featureObject)` from `createFeature`

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideEffects(PhotosEffects),
    provideStore({ [appFeatureKey]: appReducer }),   // Global slice
    provideState(photosFeature),                      // Feature slice (createFeature)
    provideStoreDevtools({ logOnly: !isDevMode(), connectInZone: true, maxAge: 25 }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withViewTransitions(), withComponentInputBinding()),
    provideCore(),
  ],
};
```

### 2. Action Creation

Two patterns:

**Simple actions** (`createAction` + `props`):
```typescript
import { createAction, props } from '@ngrx/store';

export const updateTotalPhotos = createAction(
  '[APP] Update total Photos',
  props<{ totalPhotos: number }>()
);
```

**Action groups** (`createActionGroup`) — preferred for features with multiple events:
```typescript
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const PhotosActions = createActionGroup({
  source: 'Photos',
  events: {
    loadMorePhotos: props<{ total: number }>(),
    loadMorePhotosSuccess: props<{ newPhotos: Photo[] }>(),
    loadMorePhotosFailure: emptyProps(),
    filterPhotos: props<{ searchTerm: string }>(),
    setFilteredPhotos: props<{ filteredPhotos: Photo[] }>(),
    setItemsBeingFiltered: props<{ totals: number }>(),
  },
});
```

### 3. Reducer + Feature Object

**Two approaches:**

**A) Classic reducer** — for global/app-level slices:
```typescript
// app.reducer.ts
import { createReducer, on } from '@ngrx/store';

export const appFeatureKey = 'appState';

export interface AppState {
  totalPhotos: number;
  totalFavourites: number;
}

const initialAppState: AppState = {
  totalPhotos: 0,
  totalFavourites: 0,
};

export const appReducer = createReducer(
  initialAppState,
  on(updateTotalPhotos, (state, { totalPhotos }) => ({...state, totalPhotos})),
  on(updateTotalFavourites, (state, { totalFavourites }) => ({...state, totalFavourites})),
);
```

**B) `createFeature`** — auto-generates selectors and feature object. Prefer this for feature slices:
```typescript
// photos.reducer.ts
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { PhotosActions } from './photos.actions';

export const photosFeatureKey = 'photos';

export interface PhotosState {
  itemsBeingFiltered: number;
  photos: Photo[];
  filteredPhotos: Photo[];
  isLoading: boolean;
}

export const initialState: PhotosState = {
  itemsBeingFiltered: 0,
  photos: [],
  filteredPhotos: [],
  isLoading: true,
};

export const photosReducer = createReducer(
  initialState,
  on(PhotosActions.loadMorePhotosSuccess, (state, { newPhotos }) => {
    const updatedPhotos = [...state.photos, ...newPhotos];
    return { ...state, photos: updatedPhotos, filteredPhotos: updatedPhotos, isLoading: false };
  }),
  // ... other handlers
);

export const photosFeature = createFeature({
  name: photosFeatureKey,
  reducer: photosReducer,
  extraSelectors: ({ selectFilteredPhotos, selectPhotos }) => ({
    selectFilteredPhotosAsString: createSelector(
      selectFilteredPhotos, selectPhotos,
      (photos, total) => `Found: ${photos.map(p => p.id).join(', ')} from a total of ${total.length}`
    ),
  }),
});
```

`createFeature` automatically generates: `select{Name}State`, `select{Field}` for each field, plus any `extraSelectors`.

### 4. Selectors

**From classic reducer** — use `createFeatureSelector` + `createSelector`:
```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { appFeatureKey, AppState } from './app.reducer';

export const selectAppState = createFeatureSelector<AppState>(appFeatureKey);
export const selectTotalPhotos = createSelector(
  selectAppState,
  (state) => state.totalPhotos
);
```

**From `createFeature`** — selectors are auto-generated on the feature object:
```typescript
// In a component:
this._store.select(photosFeature.selectFilteredPhotos)
this._store.select(photosFeature.selectIsLoading)
this._store.select(photosFeature.selectFilteredPhotosAsString) // extra selector
```

### 5. Effects

Use `createEffect` with `concatLatestFrom` for reading current state and `mergeMap` for dispatching multiple actions:

```typescript
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, mergeMap, of } from 'rxjs';

@Injectable()
export class PhotosEffects {
  private readonly _actions$ = inject(Actions);
  private readonly _photosService = inject(PhotosService);
  private readonly _store = inject(Store);

  readonly loadMorePhotos$ = createEffect(() =>
    this._actions$.pipe(
      ofType(PhotosActions.loadMorePhotos),
      concatLatestFrom(() => this._store.select(photosFeature.selectPhotos)),
      concatMap(([action, photos]) =>
        this._photosService.getRandomPhotos(action.total).pipe(
          map((newPhotos) => [
            PhotosActions.loadMorePhotosSuccess({ newPhotos }),
            updateTotalPhotos({ totalPhotos: photos.length + newPhotos.length }),
          ]),
          mergeMap(actions => actions)
        )
      ),
      catchError(() => of(PhotosActions.loadMorePhotosFailure))
    )
  );
}
```

### 6. Component → Store Wiring

Components use `inject(Store)`, call `dispatch` for actions and `select` for observables:

```typescript
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class PhotosComponent implements OnInit {
  private readonly _store = inject(Store);

  // Expose as getters returning observables
  get filteredPhotos$(): Observable<Photo[]> {
    return this._store.select(photosFeature.selectFilteredPhotos);
  }

  ngOnInit(): void {
    this._store.dispatch(PhotosActions.loadMorePhotos({ total: 20 }));
  }

  filterPhotos(searchTerm: string): void {
    this._store.dispatch(PhotosActions.filterPhotos({ searchTerm }));
  }
}
```

**Signal interop** — convert observable selectors to signals:
```typescript
import { toSignal } from '@angular/core/rxjs-interop';

totals = toSignal(this._appStore.select(selectTotalPhotos));
```

**Output from signal** with debounce for search:
```typescript
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';

search = signal('');
searchTerm = outputFromObservable(
  toObservable(this.search).pipe(debounceTime(500), distinctUntilChanged())
);
```

### 7. Service Pattern

Services use `providedIn: 'root'`, `inject()` for DI, and can dispatch to the store:

```typescript
@Injectable({ providedIn: 'root' })
export class FavouritesService {
  private _favouritesSubject$ = new BehaviorSubject<Photo[]>([]);
  private readonly _appStore = inject(Store);

  addToFavourites(photo: Photo): void {
    this._favourites.push(photo);
    this._saveFavourites();
    this._appStore.dispatch(updateTotalFavourites({ totalFavourites: this._favourites.length }));
  }
}
```

For API services, inject a token for the base URL:
```typescript
@Injectable({ providedIn: 'root' })
export class PhotosService {
  private readonly _apiUrl: string = inject(API_URL);

  getRandomPhotos(count = 50): Observable<Photo[]> {
    return of(/* ... */).pipe(delay(Math.random() * 100 + 200));
  }
}
```

### 8. Routing

**App routes** — lazy-load layout:
```typescript
export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () => import('./layout/layout.routes').then(m => m.LAYOUT_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
```

**Layout routes** — lazy-load feature components:
```typescript
export const LAYOUT_ROUTES: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'photos',
        loadComponent: () => import('../modules/components/photos/photos.component').then(c => c.PhotosComponent),
      },
      {
        path: 'photos/:id',
        loadComponent: () => import('../modules/components/photo/photo.component').then(c => c.PhotoComponent),
        resolve: { photo: photoResolver },
      },
    ],
  },
];
```

**Functional resolvers** — use exported functions, not classes:
```typescript
export const photoResolver = (route: ActivatedRouteSnapshot) => {
  const photo = inject(FavouritesService).getFavourite(photoId);
  if (!photo) {
    return inject(Router).navigate(['photos']);
  }
  return photo;
};
```

### 9. Component Authoring Conventions

- **Standalone**: `standalone: true` on every component/directive/pipe
- **Change detection**: `ChangeDetectionStrategy.OnPush`
- **DI**: `inject()` function, never constructor injection
- **Private fields**: Prefix with `_` (e.g. `private readonly _store = inject(Store)`)
- **Templates**: Use `@for` control flow, `@if` for conditionals
- **Getters**: Expose store selectors as getter properties returning `Observable<T>`

### 10. Core Provider Pattern

Use an `InjectionToken` + `provideCore()` function for app-wide configuration:
```typescript
export const API_URL = new InjectionToken<string>('API_URL');

export const provideCore = (): Provider[] | EnvironmentProviders[] => {
  return [{ provide: API_URL, useValue: 'https://picsum.photos/200/300' }];
};
```

## Code Generation Templates

### Action Group
```typescript
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { <Model> } from '<model-path>';

export const <Name>Actions = createActionGroup({
  source: '<Name>',
  events: {
    load: props<{ /* params */ }>(),
    loadSuccess: props<{ data: <Model>[] }>(),
    loadFailure: emptyProps(),
    create: props<{ data: Partial<<Model>> }>(),
    update: props<{ id: string; data: Partial<<Model>> }>(),
    delete: props<{ id: string }>(),
  },
});
```

### Feature Reducer (createFeature)
```typescript
import { createFeature, createReducer, on } from '@ngrx/store';
import { <Name>Actions } from './<name>.actions';
import { <Model> } from '<model-path>';

export interface <Name>State {
  items: <Model>[];
  loading: boolean;
  error: string | null;
}

export const initialState: <Name>State = {
  items: [],
  loading: false,
  error: null,
};

export const <name>Reducer = createReducer(
  initialState,
  on(<Name>Actions.load, (state) => ({ ...state, loading: true })),
  on(<Name>Actions.loadSuccess, (state, { data }) => ({ ...state, items: data, loading: false })),
  on(<Name>Actions.loadFailure, (state) => ({ ...state, loading: false })),
);

export const <name>Feature = createFeature({
  name: '<name>',
  reducer: <name>Reducer,
});
```

### Effects
```typescript
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, mergeMap, of } from 'rxjs';
import { <Name>Actions } from './<name>.actions';
import { <name>Feature } from './<name>.reducer';
import { <Name>Service } from '<service-path>';

@Injectable()
export class <Name>Effects {
  private readonly _actions$ = inject(Actions);
  private readonly _service = inject(<Name>Service);
  private readonly _store = inject(Store);

  readonly load$ = createEffect(() =>
    this._actions$.pipe(
      ofType(<Name>Actions.load),
      concatLatestFrom(() => this._store.select(<name>Feature.selectItems)),
      concatMap(([action, items]) =>
        this._service.getAll().pipe(
          map((data) => <Name>Actions.loadSuccess({ data })),
          catchError(() => of(<Name>Actions.loadFailure()))
        )
      )
    )
  );
}
```

### Component with Store
```typescript
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { <Model> } from '<model-path>';
import { <Name>Actions } from '<actions-path>';
import { <name>Feature } from '<reducer-path>';

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './<name>.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Name>Component implements OnInit {
  private readonly _store = inject(Store);

  get items$(): Observable<<Model>[]> {
    return this._store.select(<name>Feature.selectItems);
  }

  ngOnInit(): void {
    this._store.dispatch(<Name>Actions.load({}));
  }
}
```

## Provider Registration

When adding a new state slice, register in `app.config.ts`:
- **Effects**: `provideEffects(EffectsClass)`
- **Global reducer**: inside `provideStore({ [key]: reducer })`
- **Feature slice**: `provideState(featureObject)`

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| State files | `kebab-case.{type}.ts` | `photos.reducer.ts`, `photos.actions.ts` |
| Action groups | PascalCase + `Actions` | `PhotosActions` |
| Actions | camelCase inside group | `loadMorePhotos`, `loadMorePhotosSuccess` |
| Reducer files | `<name>.reducer.ts` | `photos.reducer.ts` |
| Feature key | camelCase string | `'photos'` |
| Feature object | camelCase + `Feature` | `photosFeature` |
| Selector prefix | `select` + PascalCase | `selectTotalPhotos` |
| Effect files | `<name>.effects.ts` | `photos.effects.ts` |
| Effect class | PascalCase + `Effects` | `PhotosEffects` |
| Effect property | `$` suffix | `loadMorePhotos$` |
| Action source tag | `[<Name>]` in brackets | `'[Photos] Load more photos'` |
| Component files | `<name>.component.ts` | `photos.component.ts` |
| Service files | `<name>.service.ts` | `photos.service.ts` |
| Private fields | `_` prefix | `private readonly _store` |
