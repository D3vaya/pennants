---
layout: home
title: pennants
titleTemplate: Banderas de países con forma de banderín

hero:
  name: pennants
  text: Banderas de países con forma de banderín
  tagline: '271 banderas en SVG, PNG, CSS, sprite, JS con tree-shaking, React y Web Component. Con tipos y carga diferida: solo envías las banderas que muestras.'
  actions:
    - theme: brand
      text: Empezar
      link: /es/guide/getting-started
    - theme: alt
      text: Ver la galería
      link: /es/gallery
    - theme: alt
      text: ¿Qué formato uso?
      link: /es/guide/formats

features:
  - title: Todos los formatos
    details: SVG y PNG estáticos, clases CSS, un sprite SVG, un módulo ES por bandera, un componente de React y un custom element sin framework.
  - title: Pagas solo lo que muestras
    details: Cada bandera es su propio módulo y su propio chunk diferido; un import estático agrega alrededor de 1 kB con gzip en una build de Vite. Los nombres salen de Intl.DisplayNames, sin datos extra.
  - title: Tipado y traducido
    details: Un tipo PennantCode con los 271 códigos y nombres en cualquier idioma gracias a Intl.DisplayNames, sin incluir datos de nombres.
  - title: Accesible por defecto
    details: Los componentes reciben un nombre accesible traducido automáticamente; pasa un title o label vacío si la bandera es decorativa.
  - title: Personalizable
    details: Cambia el color de la barra del SVG inline con dos custom properties de CSS.
  - title: Los mismos códigos que flag-icons
    details: Generado a partir de las banderas de flag-icons. Migrar es, sobre todo, cambiar fi fi-xx por pn pn-xx.
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
