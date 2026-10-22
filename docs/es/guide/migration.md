# Migrar desde flag-icons

`pennants` se genera a partir de las banderas de [flag-icons](https://github.com/lipis/flag-icons),
así que los códigos y los diseños son los mismos. Puedes mantener el aspecto rectangular con las
formas `rect` y `square`, o pasarte al banderín.

<MigrationCompare />

## Mantener rectángulos

| flag-icons                                   | pennants                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| `import 'flag-icons/css/flag-icons.min.css'` | `import 'pennants/css/rect'`                            |
| `fi fi-ar` (4:3)                             | `pn pn-ar` con `pennants/css/rect`                      |
| `fi fi-ar fis` (1:1)                         | `pn pn-ar` con `pennants/css/square`                    |
| `fib fi-ar` (solo fondo)                     | `pn pn-ar` (`.pn` ya aplica `background-size: contain`) |
| `flag-icons/flags/4x3/ar.svg`                | `pennants/svg/rect/ar.svg`                              |
| `flag-icons/flags/1x1/ar.svg`                | `pennants/svg/square/ar.svg`                            |

En `pennants/css/rect`, `.pn` mide `1em` de alto y `1.333em` de ancho, la misma caja que `.fi`
de flag-icons, así que la maquetación conserva sus espacios. Las formas rect y square agregan un
borde fino oscurecido y esquinas redondeadas de 2 px.

Cada hoja de estilos sirve una sola forma: si una página usaba `fi` y `fi fis` a la vez,
necesitas una misma forma para ambas o los componentes para una de ellas
(`<Pennant shape="square">`).

## Pasarte al banderín

Reemplaza la hoja de estilos por `import 'pennants/css'`; las clases son las mismas,
`pn pn-<código>`.

|                    | flag-icons `.fi`             | pennants `.pn`                |
| ------------------ | ---------------------------- | ----------------------------- |
| Alto               | caja de línea de `1em`       | `1em`                         |
| Ancho              | `1.333em` (4:3), `1em` (1:1) | `0.917em` (66:72)             |
| Alineación         | baseline                     | `middle`                      |
| Tamaños auxiliares | no tiene                     | `.pn-lg`, `.pn-2x` a `.pn-4x` |

Los banderines son más angostos que las banderas 4:3, así que revisa las columnas de ancho fijo.
La parte inferior termina en punta, así que a la misma altura un banderín se ve más liviano que
un rectángulo; un tamaño más (`.pn-lg`) suele quedar bien.

## Buscar y reemplazar

Para migrar de 4:3 a `rect`, el cambio de clases es mecánico:

```sh
# Revisa el diff antes de hacer commit.
grep -rlE '\bfi fi-' src | xargs sed -i.bak -E 's/\bfi fi-([a-z-]+)/pn pn-\1/g'
```

Después cambia el import de la hoja de estilos y resuelve las clases `fis` como se explica
arriba.

## Qué ganas

- Archivos PNG y un sprite SVG, además de SVG y CSS.
- Módulos de dibujo por bandera, `loadFlag` con carga diferida, modo fetch, componentes de React
  y un Web Component.
- Tipos de TypeScript para cada código (`PennantCode`), `getPennantName` con nombres traducidos,
  `toEmoji` y `pennantUrl`.

## Convivencia

Puedes usar los dos paquetes a la vez durante la migración; los prefijos (`fi` y `pn`) no
chocan.

```html
<span class="fi fi-ar"></span> <span class="pn pn-ar"></span>
```
