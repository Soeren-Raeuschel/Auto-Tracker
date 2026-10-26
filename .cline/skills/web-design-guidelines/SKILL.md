---
name: web-design-guidelines
description: Use to review or audit existing UI code for usability, accessibility, responsive behavior and interface best practices. Trigger on requests like "audit the design", "check the UI", "review accessibility" or "does this follow best practices". Review only, does not redesign.
---

# Web Design Guidelines (UI Audit)

A checklist-based review. It finds problems; it does not redesign. Do not change files unless the user asks for fixes after seeing the report.

## Workflow

1. Identify the files to review (components or pages named by the user; if none, start with the main page and its components).
2. Read the code. If possible, also look at the running app.
3. Go through the checklist below.
4. Report findings by priority (high, medium, low). For each: file and line, what is wrong, a one-line fix. Skip categories with no findings. End with the top 3 fixes to do first.

## Checklist

### Accessibility
- Semantic elements: `button`, `a`, `nav`, `main`, `header`, `ul/li`; headings in logical order, one `h1`.
- Every form control has a visible label or `aria-label`.
- Icon-only buttons have an accessible name; images have `alt`.
- Everything works with keyboard only; focus is visible (`outline-none` needs a replacement focus style).
- Dialogs and menus trap and restore focus, close on Escape.
- Color is not the only signal (errors, status).
- Text contrast at least 4.5:1 (3:1 for large text).

### Interaction
- Touch targets at least 44x44px with enough spacing.
- Hover, focus, active and disabled states exist.
- Actions give feedback (loading, success, error). No silent failures.
- Destructive actions ask for confirmation or offer undo.
- Zoom is not disabled; paste is not blocked.

### States
- Loading, empty, error and "no results" states exist and say what to do next.
- Long text, long names and missing images do not break the layout.

### Forms
- Correct input `type`, `autocomplete`, `inputmode`.
- Errors appear next to the field and explain the fix.
- Submit button reflects progress; double submits are prevented.

### Responsive layout
- Works from 320px width up. No horizontal page scrolling.
- Tables and wide content scroll inside their own container.
- Readable text without zooming; reasonable line length.

### Motion
- Animation has a purpose (feedback, orientation). Respect `prefers-reduced-motion`.
- Animate `transform` and `opacity`, avoid layout-shifting animation.

### UI performance
- Images have dimensions, lazy loading below the fold, sensible sizes.
- Limit font families and weights, use `font-display: swap`.
- No layout shift when content loads.

### Consistency
- Spacing, radius, colors and font sizes come from a shared scale (Tailwind theme), not one-off values.
- The same action uses the same wording everywhere.
- Copy is concise, sentence case, specific ("Save changes", not "Submit").

## Report format

```
## Audit: <files>

### High
- `src/components/X.jsx:42` Icon button has no accessible name. Add aria-label="Close".

### Medium
- ...

### Low
- ...

### Fix first
1. ...
2. ...
3. ...
```
