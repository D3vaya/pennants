import { bootstrapApplication } from '@angular/platform-browser';
// Registers <pennant-flag> once for the whole app.
import 'pennants/element/register';
import { App } from './app/app';

bootstrapApplication(App).catch((error: unknown) => console.error(error));
