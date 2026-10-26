---
name: react-best-practices
description: Use when writing, refactoring or reviewing React components, hooks, state, data fetching or performance in a Vite + JavaScript project. Covers component structure, state placement, effects, rendering performance, bundle size and accessibility basics.
---

# React Best Practices

Apply these when writing or reviewing React code. Prefer simple code first, optimize only where there is a real reason.

## Components

- One component per file, named in PascalCase. Keep components small: if one handles data loading, layout and several UI parts, split it.
- Put data logic into custom hooks (`useXyz`), keep components focused on rendering.
- Pass only the props a component needs, not whole objects when two fields are enough.
- Avoid deep prop drilling: use composition (children) first, Context only for truly app-wide values.
- Never define a component inside another component's body. It remounts on every render.

## State

- Keep state as local as possible; lift it only when siblings need it.
- Do not store derived values in state. Compute them during render (`useMemo` only if measurably expensive).
- Use the functional update form (`setX(prev => ...)`) when the new value depends on the old one.
- Never mutate state or props. Create new arrays and objects.
- Values that change together belong in one state object or `useReducer`.

## Effects

- An effect is for syncing with something outside React (network, timers, subscriptions, DOM APIs). Not for computing values or reacting to clicks; put click logic in the event handler.
- List all dependencies. Do not silence the lint rule; restructure instead.
- Clean up in the return function: timers, listeners, subscriptions.
- Data fetching: handle loading, error and empty states, and cancel or ignore stale requests (`AbortController` or an `ignore` flag) so old responses do not overwrite new ones.

## Lists and keys

- Use stable unique ids as `key`, not the array index if items can be reordered, added or removed.
- For very long lists, paginate, filter or virtualize.

## Performance (only when needed)

- Measure first (React DevTools Profiler). Do not add `memo`, `useMemo`, `useCallback` everywhere.
- Use them when a heavy child re-renders with unchanged props, or a function/object is a dependency of an effect or memoized child.
- Lazy-load routes and heavy components with `React.lazy` and `Suspense`.
- Import only what you use; do not pull in whole libraries for one function.
- Images: set width and height, `loading="lazy"` below the fold, prefer webp/avif.
- Debounce search inputs and other high-frequency handlers.

## Forms

- Controlled inputs for forms with validation; every input has a label.
- Validate on submit and show clear messages next to the field.

## Accessibility basics

- Use real elements: `button` for actions, `a` for navigation, never a clickable `div`.
- Dialogs, menus, tabs and listboxes come from Headless UI, which handles focus and keyboard behavior.
- Icon-only buttons need an `aria-label`. Images need meaningful `alt` (empty `alt=""` if decorative).

## Project conventions

- JavaScript, React with Vite, Tailwind CSS. Do not introduce TypeScript or new state libraries unless asked.
- Keep the existing folder structure and naming; match the style of surrounding code.
- When reviewing, report findings as a list: file, problem, suggested fix, priority (high, medium, low). Do not rewrite working code only for style.
