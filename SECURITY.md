# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/knowsy-nl/skos-picker/security) of this repository.
2. Click **"Report a vulnerability"**.
3. Describe the issue, affected versions, and reproduction steps.

We aim to acknowledge reports within a few business days and will keep you
updated on the fix and disclosure timeline.

## Scope

`@knowsy/skos-picker` is a front-end component. The most relevant concerns are:

- **XSS / HTML injection** via untrusted vocabulary labels rendered by the
  picker. Labels from a `data-source` are treated as text; if you find a path
  where markup is interpreted, that's a vulnerability — please report it.
- **Prototype pollution** or unsafe parsing of `data-source` JSON.

The bundled sample data (`src/data/`) is for demos only and is not a security
boundary.

## Supported versions

The latest published `1.x` release receives security fixes.
