# Cambios y actualización

Qué cambió en cada versión y qué hacer al actualizar. La lista completa está en
[CHANGELOG.md](https://github.com/D3vaya/pennants/blob/main/CHANGELOG.md).

## 0.2.0

Instalación más liviana: el paquete de npm pasa de 2,81 MB a 1,96 MB comprimido (de 9,31 MB a
7,56 MB descomprimido). Lo que descargan tus usuarios no cambia.

### Quitado del paquete de npm

| Quitado                                                                        | Usa en su lugar                                                                                 |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `pennants/sprite`, `sprite/pennant.svg`                                        | `sprite/pennant.svg` de los [assets del release](./shapes#assets-del-release), o las clases CSS |
| `png/rect/`, `png/square/`, `png/circle/`                                      | `svg/<forma>/<código>.svg`, o los PNG de los [assets del release](./shapes#assets-del-release)  |
| `pennantUrl(code, { format: 'png', shape })` con formas distintas de `pennant` | `pennantUrl(code, { shape })` (SVG), o tu propia URL a un PNG alojado por ti                    |

Estas rutas tampoco existen en jsDelivr ni en unpkg para `pennants@0.2.0`. Las URLs fijadas a
`pennants@0.1.x` siguen funcionando.

Los PNG del banderín (`png/pennant/1x/` y `png/pennant/2x/`), todos los SVG, el CSS y la API de
JS no cambian.

### Actualizar desde 0.1.x

1. Busca en tu código `pennants/sprite`, `png/rect`, `png/square` y `png/circle`.
2. En cada caso, usa el archivo SVG de la misma forma (`svg/rect/cl.svg`), o descarga
   `pennants-assets-v0.2.0.zip` del
   [release de GitHub](https://github.com/D3vaya/pennants/releases/tag/v0.2.0) y sirve el archivo
   tú mismo.
3. Si llamas a `pennantUrl` con `format: 'png'`, ahora solo acepta la forma `pennant`; las otras
   lanzan un `RangeError`.

### Nuevo

- Cada release de GitHub adjunta `pennants-assets-vX.Y.Z.zip`: los PNG de todas las formas, los
  sprites de todas las formas y los archivos SVG. Ver [Assets del release](./shapes#assets-del-release).

### Cambios

- Las versiones se publican con trusted publishing de npm (OIDC) y provenance; el repositorio no
  guarda ningún token de npm.

## 0.1.1

- Se corrigió el README en npmjs.com: las insignias y los enlaces ahora funcionan ahí.

## 0.1.0

- Primera versión: 271 banderas en cuatro formas (banderín, rect, square, circle) como SVG, PNG,
  clases CSS, módulos JS, un componente de React y un Web Component.
