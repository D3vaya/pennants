# Angular

Angular 22, componentes standalone, builder `@angular/build:application`.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/angular)

```sh
npm install pennants
```

## Configuración

Registra el Web Component una sola vez, en `main.ts`:

```ts [src/main.ts]
import { bootstrapApplication } from '@angular/platform-browser';
import 'pennants/element/register';
import { App } from './app/app';

bootstrapApplication(App).catch((error: unknown) => console.error(error));
```

Para usar las clases `pn pn-xx`, añade la hoja de estilos a `angular.json`. Angular emite
los SVG como archivos en `media/`, así que cada bandera se descarga solo cuando se usa:

```json [angular.json]
"styles": ["pennants/css/pennants.min.css"]
```

## Uso

Añade `CUSTOM_ELEMENTS_SCHEMA` a cada componente que use `<pennant-flag>`:

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
    <button type="button" (click)="code.set('mx')">México</button>

    <span class="flag" role="img" aria-label="Argentina" [innerHTML]="ar"></span>

    <span class="pn pn-de pn-2x" role="img" aria-label="Alemania"></span>
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
  // Angular elimina el <svg> de [innerHTML]. Este markup viene de pennants/flags/*, que es
  // de confianza, así que saltarse el sanitizador es seguro. Nunca lo hagas con datos del usuario.
  protected readonly ar = inject(DomSanitizer).bypassSecurityTrustHtml(ar);
}
```

## Bundle y SSR

- `pennants/element/register` suma unos 7 KB con gzip a `main.js`. Cada bandera es un chunk
  diferido de pocos KB.
- Angular SSR: el import es seguro en el servidor, porque el registro se omite donde no
  existe `customElements`. `<pennant-flag>` se renderiza vacío y se completa tras el
  bootstrap. Para tener la bandera en el HTML del servidor, usa `[innerHTML]` con un módulo
  por bandera.
