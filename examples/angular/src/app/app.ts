import { CUSTOM_ELEMENTS_SCHEMA, Component, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import ar from 'pennants/flags/ar';
import type { PennantCode } from 'pennants';

@Component({
  selector: 'app-root',
  // Allows unknown elements such as <pennant-flag> in this component's template.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h2>Web Component (lazy chunk per flag)</h2>
    <pennant-flag [attr.code]="code()" size="48" />
    @for (choice of choices; track choice) {
      <button type="button" (click)="code.set(choice)">{{ choice }}</button>
    }

    <h2>Per-flag module (bundled)</h2>
    <span class="flag" role="img" aria-label="Argentina" [innerHTML]="ar"></span>

    <h2>CSS classes</h2>
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
  protected readonly choices: PennantCode[] = ['br', 'mx', 'gb-eng'];
  // Angular strips <svg> from [innerHTML]. The markup comes from pennants/flags/*
  // (trusted, never user input), so it is safe to bypass the sanitizer here.
  protected readonly ar = inject(DomSanitizer).bypassSecurityTrustHtml(ar);
}
