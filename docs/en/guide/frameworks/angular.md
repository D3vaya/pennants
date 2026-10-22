# Angular

Angular 22, standalone components, `@angular/build:application` builder.

[Full example](https://github.com/D3vaya/pennants/tree/main/examples/angular)

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

To use the `pn pn-xx` classes, add the stylesheet of each shape you use to `angular.json`. Angular only
accepts paths that end in `.css` here, so use the file name (`pennant.min.css`,
`rect.min.css`, `square.min.css` or `circle.min.css`). Angular emits the flag SVGs as
separate files under `media/`, so each flag is downloaded only when it is used:

```json [angular.json]
"styles": ["pennants/css/pennant.min.css"]
```

## Usage

Add `CUSTOM_ELEMENTS_SCHEMA` to each component that uses `<pennant-flag>`:

```ts [src/app/app.ts]
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import ar from 'pennants/art/1x1/ar';
import { renderFlag, type PennantCode, type PennantShape } from 'pennants';

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <pennant-flag [attr.code]="code()" [attr.shape]="shape()" size="48" />
    <button type="button" (click)="code.set('mx')">Mexico</button>
    <button type="button" (click)="shape.set('circle')">Circle</button>

    <span class="flag" role="img" aria-label="Argentina" [innerHTML]="circle"></span>

    <span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>
  `,
  styles: `
    .flag {
      display: inline-block;
      height: 48px;
      aspect-ratio: 1;
    }
    .flag ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class App {
  protected readonly code = signal<PennantCode>('br');
  protected readonly shape = signal<PennantShape>('pennant');
  // Angular removes <svg> from [innerHTML]. This markup is composed from pennants/art/*,
  // which is trusted, so bypassing the sanitizer is safe. Never do this with user input.
  protected readonly circle = inject(DomSanitizer).bypassSecurityTrustHtml(
    renderFlag(ar, { shape: 'circle' }),
  );
}
```

## Bundle and SSR

- `pennants/element/register` adds <Size probe="element" /> gzip to `main.js`. Each flag is a
  lazy chunk of a few KB.
- Angular SSR: the import is safe on the server, because registration is skipped where
  `customElements` doesn't exist. `<pennant-flag>` is rendered empty and filled after
  bootstrap. For a flag in the server HTML, use `[innerHTML]` with `renderFlag`.
