# Accessibility

A flag either carries meaning ("Shipping to Argentina") or decorates text that already says the
country name. Decide which one it is for each use.

## Components name flags for you

| Component        | Default accessible name                   | Decorative |
| ---------------- | ----------------------------------------- | ---------- |
| `<Pennant>`      | `getPennantName(code, locale)`            | `title=""` |
| `<PennantSvg>`   | Name of the flag in the markup, localized | `title=""` |
| `<pennant-flag>` | English name                              | `label=""` |

Named flags get `role="img"` and `aria-label` (or `alt` in `img` mode). Decorative flags get
`aria-hidden="true"` (or an empty `alt`). A `<pennant-flag>` without any name, for example with
an unknown code or after a failed load, is hidden from assistive technology rather than exposed
as an unnamed image.

```jsx
<Pennant code="de" locale="es" />            {/* aria-label="Alemania" */}
<Pennant code="de" title="" /> Germany       {/* decorative: the text says it */}
```

```html
<pennant-flag code="de" label="Deutschland"></pennant-flag>
<pennant-flag code="de" label=""></pennant-flag> Germany
```

## Static formats

Add the name yourself:

```html
<img src="/flags/ar.svg" alt="Argentina" width="33" height="36" />
<img src="/flags/ar.svg" alt="" width="33" height="36" /> Argentina

<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-ar" aria-hidden="true"></span> Argentina

<svg role="img" aria-label="Argentina"><use href="/pennant.svg#pn-ar" /></svg>
```

## Localized names

`getPennantName(code, locale)` uses `Intl.DisplayNames`, so names follow the user's language
without shipping translations. Non-ISO flags (`gb-eng`, `eu`, `asean`, ...) fall back to their
English name.

```js
getPennantName('jp', 'es'); // 'Japón'
getPennantName('jp', navigator.language);
```

## Other notes

- Do not use a flag as the only way to identify a language; many languages span several
  countries. Show the language name.
- Pennants keep a fixed ratio and scale with `font-size` (CSS classes, `size` defaults to
  `1em`), so they follow the user's text zoom.
- The emoji from `toEmoji` renders as two letters on some platforms (Windows). Do not rely on
  it as the only label.
