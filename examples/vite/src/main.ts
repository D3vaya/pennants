// Side-effect import: Vite bundles the stylesheet and the flag images it uses.
import 'pennants/css';
import './style.css';
// Flag artwork: only the flags you import end up in the bundle. 1x1 art draws
// pennant, square and circle; 4x3 art draws rect.
import ar from 'pennants/art/1x1/ar';
import ar4x3 from 'pennants/art/4x3/ar';
import {
  getPennantName,
  isShape,
  loadFlag,
  renderFlag,
  toPennantCode,
  type PennantShape,
} from 'pennants';
// Static files resolved to hashed URLs by Vite.
import deUrl from 'pennants/svg/pennant/de.svg?url';
import spriteUrl from 'pennants/sprite?url';

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;

const shapes: PennantShape[] = ['pennant', 'rect', 'square', 'circle'];
$('#shapes').innerHTML = shapes
  .map(
    (shape) =>
      `<span class="flag" role="img" aria-label="Argentina (${shape})">` +
      `${renderFlag(shape === 'rect' ? ar4x3 : ar, { shape })}</span>`,
  )
  .join(' ');

const codeSelect = $<HTMLSelectElement>('#code');
const shapeSelect = $<HTMLSelectElement>('#shape');
async function showLazy(): Promise<void> {
  const code = toPennantCode(codeSelect.value);
  const shape = isShape(shapeSelect.value) ? shapeSelect.value : 'pennant';
  const lazy = $('#lazy');
  lazy.innerHTML = await loadFlag(code, { shape }); // fetches only this flag's chunk
  lazy.setAttribute('role', 'img');
  lazy.setAttribute('aria-label', getPennantName(code));
}
codeSelect.addEventListener('change', showLazy);
shapeSelect.addEventListener('change', showLazy);
void showLazy();

$<HTMLImageElement>('#img').src = deUrl;
$('#sprite').setAttribute('href', `${spriteUrl}#pn-mx`);
