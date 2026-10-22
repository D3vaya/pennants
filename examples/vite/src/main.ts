// Side-effect import: Vite bundles the stylesheet and the flag images it uses.
import 'pennants/css/pennants.min.css';
// One flag as an SVG string; only this flag ends up in the bundle.
import ar from 'pennants/flags/ar';
import { getPennantName, loadPennant, toPennantCode } from 'pennants';
// Static files resolved to hashed URLs by Vite.
import deUrl from 'pennants/svg/de.svg?url';
import spriteUrl from 'pennants/sprite?url';

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;

$('#inline').innerHTML = ar;

const picker = $<HTMLSelectElement>('#picker');
async function showLazy(): Promise<void> {
  const code = toPennantCode(picker.value);
  const lazy = $('#lazy');
  lazy.innerHTML = await loadPennant(code); // fetches only this flag's chunk
  lazy.setAttribute('role', 'img');
  lazy.setAttribute('aria-label', getPennantName(code));
}
picker.addEventListener('change', showLazy);
void showLazy();

$<HTMLImageElement>('#img').src = deUrl;
$('#sprite').setAttribute('href', `${spriteUrl}#pn-mx`);
