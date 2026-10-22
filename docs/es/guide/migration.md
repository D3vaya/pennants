# Migrar desde flag-icons

`pennants` se genera a partir de las banderas de [flag-icons](https://github.com/lipis/flag-icons),
así que los códigos y los diseños son los mismos. Cambian la forma (un banderín con barra en
lugar de un rectángulo), el prefijo de las clases y los formatos adicionales.

<MigrationCompare />

## Clases

| flag-icons                                   | pennants                | Notas                                       |
| -------------------------------------------- | ----------------------- | ------------------------------------------- |
| `import 'flag-icons/css/flag-icons.min.css'` | `import 'pennants/css'` |                                             |
| `fi fi-ar`                                   | `pn pn-ar`              |                                             |
| `fi fi-ar fis` (cuadrada)                    | `pn pn-ar`              | Hay una sola forma; quita `fis`.            |
| `fib fi-ar` (solo fondo)                     | `pn pn-ar`              | `.pn` ya aplica `background-size: contain`. |
| `flag-icons/flags/4x3/ar.svg`                | `pennants/svg/ar.svg`   |                                             |
| `flag-icons/flags/1x1/ar.svg`                | `pennants/svg/ar.svg`   |                                             |

En la mayoría de los proyectos basta con buscar y reemplazar:

```sh
# Revisa el diff antes de hacer commit.
grep -rlE '\bfi fi-' src | xargs sed -i.bak -E 's/\bfi fi-([a-z-]+)( fis)?/pn pn-\1/g'
```

## Tamaño y maquetación

|                    | flag-icons `.fi`             | pennants `.pn`                |
| ------------------ | ---------------------------- | ----------------------------- |
| Alto               | caja de línea de `1em`       | `1em`                         |
| Ancho              | `1.333em` (4:3), `1em` (1:1) | `0.917em` (66:72)             |
| Alineación         | baseline                     | `middle`                      |
| Tamaños auxiliares | no tiene                     | `.pn-lg`, `.pn-2x` a `.pn-4x` |

Los banderines son más angostos que las banderas 4:3. Si tenías banderas en columnas de ancho
fijo, revisa los espacios. La parte inferior del banderín termina en punta, así que a la misma
altura se ve más liviano que un rectángulo; un tamaño más (`.pn-lg`) suele quedar bien.

## Qué ganas

- Archivos PNG (1x y 2x) y un sprite SVG.
- Un módulo ES por bandera, `loadPennant` con carga diferida, componentes de React y un Web
  Component.
- Tipos de TypeScript para cada código (`PennantCode`), `getPennantName` con nombres traducidos,
  `toEmoji` y `pennantUrl`.

## Convivencia

Puedes usar los dos paquetes a la vez durante la migración; los prefijos (`fi` y `pn`) no
chocan.

```html
<span class="fi fi-ar"></span> <span class="pn pn-ar"></span>
```
