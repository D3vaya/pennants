import { CUSTOM_ELEMENTS_SCHEMA, Component, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import ar from 'pennants/art/1x1/ar';
import { SHAPES, renderFlag, type PennantCode, type PennantShape } from 'pennants';

@Component({
  selector: 'app-root',
  // Allows unknown elements such as <pennant-flag> in this component's template.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h2>Web Component (lazy chunk per flag)</h2>
    <pennant-flag [attr.code]="code()" [attr.shape]="shape()" size="48" />
    @for (choice of codes; track choice) {
      <button type="button" (click)="code.set(choice)">{{ choice }}</button>
    }
    @for (choice of shapes; track choice) {
      <button type="button" (click)="shape.set(choice)">{{ choice }}</button>
    }

    <h2>Art module + renderFlag (bundled)</h2>
    <span class="flag" role="img" aria-label="Argentina" [innerHTML]="circle"></span>

    <h2>CSS classes</h2>
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
  protected readonly codes: PennantCode[] = ['br', 'mx', 'gb-eng'];
  protected readonly shapes = SHAPES;
  // Angular strips <svg> from [innerHTML]. The markup is composed from
  // pennants/art/* (trusted, never user input), so bypassing the sanitizer is safe.
  protected readonly circle = inject(DomSanitizer).bypassSecurityTrustHtml(
    renderFlag(ar, { shape: 'circle' }),
  );
}
