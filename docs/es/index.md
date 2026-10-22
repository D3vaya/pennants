---
layout: home
title: pennants
titleTemplate: Banderas de países con forma de banderín

hero:
  name: pennants
  text: Todas las banderas, todas las formas, una sola API
  tagline: '271 banderas de países como banderines (el estilo propio), rectángulos, cuadrados y círculos. SVG, PNG, CSS, sprite, JS con tree-shaking, React y Web Component; solo envías las banderas que muestras.'
  actions:
    - theme: brand
      text: Empezar
      link: /es/guide/getting-started
    - theme: alt
      text: Ver la galería
      link: /es/gallery
    - theme: alt
      text: Formas
      link: /es/guide/shapes
    - theme: alt
      text: ¿Qué formato uso?
      link: /es/guide/formats

features:
  - title: Cuatro formas
    details: Banderín por defecto, más rectángulo 4:3, cuadrado y círculo. Los mismos códigos y la misma API; eliges la forma con una opción.
  - title: Todos los formatos
    details: SVG y PNG estáticos, clases CSS, un sprite SVG, un módulo ES por bandera, un componente de React y un custom element sin framework.
  - title: Pagas solo lo que muestras
    details: Cada bandera es su propio módulo y su propio chunk diferido, así que solo envías las banderas que muestras. Los nombres salen de Intl.DisplayNames, sin datos extra.
  - title: Tipado y traducido
    details: Un tipo PennantCode con los 271 códigos y nombres en cualquier idioma gracias a Intl.DisplayNames, sin incluir datos de nombres.
  - title: Accesible por defecto
    details: Los componentes reciben un nombre accesible traducido automáticamente; pasa un title o label vacío si la bandera es decorativa.
  - title: Personalizable
    details: Cambia el color de la barra del banderín con dos custom properties de CSS. Compatible con CSP estricta.
  - title: Los mismos códigos que flag-icons
    details: Generado a partir de las banderas de flag-icons. Mantén los rectángulos con la forma rect o pásate a los banderines.
---

## Inicio rápido

```sh
npm install pennants
```

```js
import 'pennants/css';
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
```

## Elige un formato

<FormatPicker />

¿Dudas? Lee [¿Qué formato uso?](/es/guide/formats) o mira todas las banderas en la
[galería](/es/gallery).
