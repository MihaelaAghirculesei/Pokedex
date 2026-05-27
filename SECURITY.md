# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**.

Instead, report it privately via one of these channels:

- **Email**: [aghirculesei@gmail.com](mailto:aghirculesei@gmail.com)
- **GitHub private advisory**: [Report a vulnerability](https://github.com/MihaelaAghirculesei/Pokedex/security/advisories/new)

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any suggested mitigations (optional)

I aim to acknowledge reports within **72 hours** and provide a resolution timeline within **7 days**.

## Security Measures in This Project

- **DOMPurify** — all HTML rendered from external API data is sanitised before insertion into the DOM
- **Content Security Policy** — strict CSP headers served by Cloudflare Pages (`_headers`)
- **`X-Frame-Options: DENY`** and other security headers to prevent clickjacking
- **`npm audit`** runs automatically in CI on every push (`--audit-level=high`)
- **Dependabot** keeps dependencies up to date with automated PRs

## Scope

This is a client-side-only PWA that consumes [PokéAPI](https://pokeapi.co/) (read-only public API). It stores no user data and has no backend or authentication layer.
