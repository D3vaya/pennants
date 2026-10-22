# Angular

Angular 22, standalone components, `@angular/build:application` builder.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/angular)

```sh
npm install pennants
```

## Setup

Register the Web Component once, in `main.ts`:

```ts [src/main.ts]
import { bootstrapApplication } from '@angular/platform-browser';
import 'pennants/element/register';
import { App } from './app/app';

bootstrapApplication(App).catch((error: unknown) => console.error(error));
```

To use the `pn pn-xx` classes, add the stylesheet to `angular.json`. Angular emits the flag
SVGs as separate files under `media/`, so each flag is downloaded only when it is used:

```json [angular.json]
"styles": ["pennants/css/pennants.min.css"]
```

## Usage

Add `CUSTOM_ELEMENTS_SCHEMA` to each component that uses `<pennant-flag>`:

```ts [src/app/app.ts]
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import ar from 'pennants/flags/ar';
import type { PennantCode } from 'pennants';

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <pennant-flag [attr.code]="code()" size="48" />
    <button type="button" (click)="code.set('mx')">Mexico</button>

    <span class="flag" role="img" aria-label="Argentina" [innerHTML]="ar"></span>

    <span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>
  `,
  styles: `
    .flag {
      display: inline-block;
      height: 48px;
      aspect-ratio: 66 / 72;
    }
    .flag ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class App {
  protected readonly code = signal<PennantCode>('br');
  // Angular removes <svg> from [innerHTML]. This markup comes from pennants/flags/*,
  // which is trusted, so bypassing the sanitizer is safe. Never do this with user input.
  protected readonly ar = inject(DomSanitizer).bypassSecurityTrustHtml(ar);
}
```

## Bundle and SSR

- `pennants/element/register` adds about 7 KB gzip to `main.js`. Each flag is a lazy chunk
  of a few KB.
- Angular SSR: the import is safe on the server, because registration is skipped where
  `customElements` doesn't exist. `<pennant-flag>` is rendered empty and filled after
  bootstrap. For a flag in the server HTML, use `[innerHTML]` with a per-flag module.
