# Codes

Codes are lowercase. ISO 3166-1 alpha-2 codes are the same as in flag-icons and in most APIs
(uppercase them for `Intl` or ISO data). Use `toPennantCode` to normalize user input.

```js
import { codes, isoCodes, isPennantCode, toPennantCode } from 'pennants';

codes.length; // 271
isoCodes.length; // 249
isPennantCode('ar'); // true; exact lowercase match
toPennantCode(' GB-ENG '); // 'gb-eng'; throws RangeError for unknown codes
```

Names below come from `getPennantName(code, 'en')`. The [gallery](/gallery) has search and
snippets.

## Regions and organizations

<CodesTable kind="other" />

## ISO 3166-1 countries and territories

<CodesTable kind="iso" />
