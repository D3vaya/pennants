# Contributing

Thanks for helping. Issues and pull requests are welcome in English or Spanish.

## Setup

Requires Node.js 22.18 or later for development (the generator runs TypeScript directly through
Node's type stripping). The published package supports Node.js >= 20.19.

```sh
npm ci
npm run build    # generate assets from flag-icons, then bundle dist/
npm test
```

## Scripts

| Script                  | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `npm run generate`      | Rebuild `svg/`, `png/`, `css/`, `sprite/`, `src/generated/` |
| `npm run build`         | `generate` + `tsup`                                         |
| `npm test`              | Unit tests (Vitest)                                         |
| `npm run coverage`      | Tests with coverage thresholds                              |
| `npm run lint`          | ESLint and Prettier check                                   |
| `npm run typecheck`     | `tsc --noEmit`                                              |
| `npm run check:package` | publint and Are The Types Wrong                             |
| `npm run size`          | size-limit budgets                                          |
| `npm run verify`        | All of the above, as run in CI                              |

Generated folders are not committed. Do not edit files under `src/generated/`; change
`scripts/` instead.

## Flag artwork

Flag designs come from [flag-icons](https://github.com/lipis/flag-icons). Corrections to a
flag's design belong upstream; once released there, bump the `flag-icons` dev dependency
here. Changes to the pennant frame live in `scripts/lib/pennant.ts`.

To preview changes, run `npm run build`, serve the repository root (`npx serve .`) and open
`/demo/`.

## Pull requests

- Keep each PR focused. Add or update tests for behavior changes.
- Run `npm run verify` before pushing.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`,
  `ci:`, `chore:`).
- Add user-facing changes to the `Unreleased` section of `CHANGELOG.md`.

## Releasing (maintainers)

1. Move `Unreleased` entries in `CHANGELOG.md` under the new version.
2. `npm version <patch|minor|major>` (creates the commit and the `vX.Y.Z` tag).
3. `git push --follow-tags`. The release workflow verifies, publishes to npm with provenance
   and creates the GitHub release.

By contributing you agree that your contributions are licensed under the MIT License and that
you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
