# 02_DIAGRAMS_EXPORT_PNG_SVG

## Objective
Render all Mermaid C4 diagrams to PNG and SVG deterministically.

## Inputs
- `docs/diagrams/*.mmd`
- Node + `@mermaid-js/mermaid-cli`

## Outputs
- `docs/diagrams/svg/*.svg` and `docs/diagrams/png/*.png`.
- NPM script `render:diagrams`.

## Steps
1. Install CLI: `npm i` (script uses `npx @mermaid-js/mermaid-cli`).
2. Run: `npm run render:diagrams` or `node scripts/render-diagrams.mjs`.
3. Verify artifacts exist and open correctly.

## Acceptance Criteria
- All `.mmd` produce both `.png` and `.svg` artifacts locally and in CI.

## References
- Mermaid CLI: https://github.com/mermaid-js/mermaid-cli
