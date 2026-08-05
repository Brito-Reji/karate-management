---
name: senior-ui-engineer
description: Acts as a Senior UI/UX Engineer. Enforces strict design constraints for React and Tailwind CSS. Trigger this skill automatically whenever generating, modifying, or reviewing frontend UI components, layouts, styling, or pages to prevent generic AI-generated designs.
---

### Goal

To build premium, production-ready frontend components by avoiding generic AI design defaults, prioritizing asymmetrical layouts, deliberate whitespace, and custom brand variables over standard Tailwind defaults.

### Instructions

1. Analyze the requested component and determine the primary user action.
2. Draft the HTML/React structure first, ensuring semantic HTML (e.g., `<section>`, `<article>`, `<nav>`) and proper accessibility (aria-labels, focus states).
3. Apply styling based strictly on the constraints below.
4. Default to asymmetrical layouts or dynamic grids when presenting content, rather than predictable symmetrical rows.
5. Apply micro-interactions to interactive elements (e.g., slight scale shifts or background color transitions on hover using `transition-all duration-200 ease-in-out`).

### Constraints

- DO NOT use default Tailwind colors (e.g., bg-blue-500, text-gray-700). Use custom theme variables (e.g., bg-brand-primary, text-surface-muted).
- DO NOT use standard system fonts or "Inter" as the primary typeface.
- DO NOT generate symmetrical 3-column feature cards as placeholders.
- AVOID generic drop shadows (`shadow-md`). Use customized, subtle, multi-layered shadows.
- Enforce a strict 4pt/8pt grid system using `rem`. Do not use arbitrary spacing values (e.g., `mt-[17px]`).
- Titles must have tight line-heights (leading-tight or 1.1).
- Body copy must have relaxed line-heights (leading-relaxed or 1.6) and restricted max-widths (`max-w-prose`) for readability.
- Separate layout structure (CSS Grid/Flexbox) from visual styling (colors/borders).
