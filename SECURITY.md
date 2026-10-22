# Security Policy

## Supported versions

Only the latest minor release receives fixes.

## Reporting a vulnerability

Do not open a public issue. Report privately through
[GitHub Security Advisories](https://github.com/D3vaya/pennants/security/advisories/new).

Include affected versions, a description and, if possible, a reproduction. You can expect an
initial reply within 7 days. Once a fix is released, the advisory is published with credit to
the reporter unless you prefer otherwise.

## Scope

`pennants` ships static SVG markup that consumers may insert with `innerHTML`. Any way to get
script execution or external resource loading through the shipped SVG, the CSS, or the
React and Web Component bindings is in scope.
