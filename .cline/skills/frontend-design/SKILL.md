---
name: frontend-design
description: Use when building a new UI or restyling an existing one (pages, components, layouts, color, typography). Pushes for a distinctive, deliberate visual identity instead of generic AI-looking defaults. Works with React, Vite, Tailwind CSS, Headless UI and Aceternity UI.
---

# Frontend Design

Act like a design lead who is paid for a clear point of view. Every visual choice should come from the subject of the app, not from habit.

## Before you code

1. **Name the subject.** In one or two sentences: what is the app, who uses it, what is its main job? If the request does not say, propose an answer and confirm it.
2. **Write a short design plan** (5 to 10 lines) before touching code:
   - Color: 4 to 6 named hex values (background, surface, text, one accent, one state color).
   - Type: one or two font families and their roles. If two, make them clearly different.
   - Layout: one sentence describing the structure, plus alignment (left, centered).
   - Principle: the one thing that should be memorable.
3. **Check the plan against the generic defaults** below. If a part looks like what you would produce for any app, change it and say what you changed.

## Generic defaults to avoid (unless the user explicitly asks)

- Cream background with a serif headline and a terracotta accent.
- Near-black background with a single neon accent.
- Every piece of content in identical rounded cards with the same soft grey shadow.
- Gradient washes as decoration.
- A small ALL-CAPS label above every heading.
- One word of a headline in a different color or italic.
- Numbered markers (01 / 02 / 03) on content that is not a real sequence.
- Fade-and-slide-up animation on every section, hover effects on every card.

## Rules

- **Typography carries the personality.** Pick fonts deliberately, set a clear scale, keep body line length under about 80 characters, give serif body text a bit more line height.
- **Structure is information.** Borders, dividers and labels must mean something. Remove them if they only decorate.
- **Spend boldness in one place.** One memorable element, everything else quiet and consistent.
- **Motion:** use it for responses to user actions (open, expand, confirm). For automatic motion, at most one deliberate moment. Respect `prefers-reduced-motion`.
- **Quality floor:** responsive down to phone width, visible keyboard focus, sufficient contrast, touch targets of at least 44px.

## Project conventions

- Stack: React with Vite, JavaScript, Tailwind CSS. Use Tailwind utilities; define colors and fonts once in the Tailwind config (theme extend) instead of repeating hex values.
- Use only free components: Headless UI for behavior (dialogs, menus, tabs) and free Aceternity UI components for effects. Do not add paid libraries.
- Do not restyle unrelated parts of the app. Change only the components the request is about, and keep existing props and behavior.

## Copy in the UI

- Name things by what the user understands, not by how the system works.
- Buttons say what happens: "Save changes", not "Submit". Keep the same word through the whole flow.
- Errors say what went wrong and how to fix it. Empty states say what to do next.
- Sentence case, plain verbs, no filler.
