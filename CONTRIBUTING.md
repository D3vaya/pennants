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
here. The frame geometry of every shape lives in `src/shapes.ts`, shared by the generator and
the runtime.

To preview changes, run `npm run build` and then `npm run docs:dev`: the docs site shows every
flag in the gallery.

## Docs site

The site lives in `docs/` (VitePress). English pages are in `docs/en/`, Spanish ones in
`docs/es/` with the same file names; update both when you change one.

| Script                         | Purpose                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `npm run docs:dev`             | Dev server (run `npm run build` once first)                        |
| `npm run docs:build`           | Full build: package, assets, API pages, site; fails on dead links  |
| `npm run docs:api`             | Regenerate `docs/en/api/` from the TSDoc comments                  |
| `node scripts/docs-preview.ts` | Re-render `preview.png` (README) and `social-preview.png` (GitHub) |

The API reference is generated from TSDoc comments in `src/`; document new public exports there.
Copied assets (`docs/public/{svg,png,css,sprite}`) and `docs/en/api/` are generated and not
committed.

## Pull requests

- Keep each PR focused. Add or update tests for behavior changes.
- Run `npm run verify` before pushing.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`,
  `ci:`, `chore:`).
- Add user-facing changes to the `Unreleased` section of `CHANGELOG.md`.

## Releasing (maintainers)

1. Move `Unreleased` entries in `CHANGELOG.md` under the new version.
2. `npm version <patch|minor|major> --no-git-tag-version`, then
   `node scripts/bundle-budget.ts --json docs/data/bundle-sizes.json` and
   `node scripts/docs-readme-sizes.ts`: the version is inlined into the bundles, so their sizes
   (and the CI snapshot check) move with it. Update the version in the jsDelivr URLs of the
   README and the docs (`test/docs-versions.test.ts` lists them and fails until you do). On a
   minor or major bump, also update the `pennants` range in `examples/*/package.json` and
   `e2e/readme/package.json`, and add the release to `docs/{en,es}/guide/changelog.md`.
3. Open a pull request (`main` is protected and needs green checks), merge it, then
   `git tag vX.Y.Z && git push origin vX.Y.Z` on the merged commit (only maintainers can push
   `v*` tags).
4. Approve the `npm` deployment in the Actions run. The release workflow verifies, publishes to
   npm with provenance, creates the GitHub release, and then installs the new version from npm
   and runs every README snippet against it (`e2e/readme`, job "README works from npm").

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC): npm
trusts `release.yml` in `D3vaya/pennants`, environment `npm`, so there is no npm token in the
repository and nothing is published without a maintainer's approval.

By contributing you agree that your contributions are licensed under the MIT License and that
you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
