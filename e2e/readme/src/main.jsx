// Every snippet below is copied from the pennants README on npm.
import 'pennants/css';
import 'pennants/css/circle';

import { renderFlag } from 'pennants';
import cl from 'pennants/art/1x1/cl';

import { loadFlag, getPennantName } from 'pennants';

import { createRoot } from 'react-dom/client';
import { Pennant } from 'pennants/react';

// "Also: pennants/svg/<shape>/<code>.svg and pennants/png/pennant/{1x,2x}/<code>.png"
import svgCircle from 'pennants/svg/circle/cl.svg';
import png1x from 'pennants/png/pennant/1x/cl.png';
import png2x from 'pennants/png/pennant/2x/cl.png';

const status = document.getElementById('status');
const results = {};

try {
  // 3. One module per flag
  document.getElementById('module').innerHTML = renderFlag(cl, { shape: 'circle' }); // SVG markup

  // 4. Lazy, by code
  const svg = await loadFlag('cl'); // or loadFlag('cl', { shape: 'rect' })
  const rect = await loadFlag('cl', { shape: 'rect' });
  const lazy = document.getElementById('lazy');
  lazy.innerHTML = svg + rect;
  results.alemania = getPennantName('de', 'es'); // 'Alemania'
  lazy.insertAdjacentHTML('beforeend', `<p id="name">${results.alemania}</p>`);

  // 5. React
  createRoot(document.getElementById('react')).render(<Pennant code="cl" size={32} />);

  // 8. Files
  document.getElementById('files').innerHTML = `
    <img id="svg-circle" src="${svgCircle}" width="32" height="32" alt="Chile circle SVG" />
    <img id="png" src="${png1x}" srcset="${png2x} 2x" width="33" height="36" alt="Chile PNG" />`;

  status.textContent = 'ok';
} catch (error) {
  status.textContent = `error: ${error instanceof Error ? error.stack : String(error)}`;
}
status.dataset.results = JSON.stringify(results);
