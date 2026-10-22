# Códigos

Los códigos van en minúsculas. Los códigos ISO 3166-1 alfa-2 son los mismos que en flag-icons y
en la mayoría de las APIs (pásalos a mayúsculas para `Intl` o datos ISO). Usa `toPennantCode`
para normalizar lo que escribe el usuario.

```js
import { codes, isoCodes, isPennantCode, toPennantCode } from 'pennants';

codes.length; // 271
isoCodes.length; // 249
isPennantCode('ar'); // true; coincidencia exacta en minúsculas
toPennantCode(' GB-ENG '); // 'gb-eng'; lanza RangeError si el código no existe
```

Los nombres de las tablas salen de `getPennantName(código, 'es')`. La [galería](/es/gallery)
tiene búsqueda y el código listo para copiar.

## Regiones y organizaciones

<CodesTable kind="other" />

## Países y territorios ISO 3166-1

<CodesTable kind="iso" />
