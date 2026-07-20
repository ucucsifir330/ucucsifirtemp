# Mobile Hero Copy Scroll Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the mobile hero into a two-beat scroll scene where the brand header exits first, then the hero headline and description enter while the character, its three attached objects, the Clavis Futuri band, and contact actions remain present.

**Architecture:** Reuse the existing sticky mobile hero track and native scroll listener. Derive a normalized first-viewport scene progress from the hero track position, expose eased navigation-exit and copy-reveal values as CSS custom properties on the hero shell, and let mobile-only CSS compose the transitions without adding render-per-scroll React state. Keep the existing video scrub and post-hero panel stack intact.

**Tech Stack:** React 18, TypeScript, Framer Motion, CSS custom properties, Vitest, Testing Library, Vite.

## Global Constraints

- Mobile means `max-width: 767px`; tablet and desktop compositions must remain unchanged.
- The initial mobile frame shows the wordmark, `#notlikeothers`, WhatsApp, email, character, all three character objects, and the Clavis Futuri band.
- The initial mobile frame hides the `Ritim ile Akış` heading and description.
- Scroll must be reversible: scrolling upward restores the opening frame.
- WhatsApp and email stay visible during the brand exit.
- The existing character video scroll scrub, rolling orb animation, and sitewide stacked-panel reveal must remain intact.
- Add the desktop-style `Scroll` label and animated line to mobile.
- Do not add dependencies, commit, or discard unrelated dirty-worktree changes.

---

### Task 1: Mobile hero scene progress

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `mobileHeroSceneProgress(scrolled: number, viewportHeight: number): { navExit: number; copyReveal: number; indicatorExit: number }`
- Produces: CSS variables `--mobile-nav-exit`, `--mobile-copy-reveal`, and `--mobile-indicator-exit` on `[data-testid="site-shell"]`.

- [ ] **Step 1: Write the failing progress test**

```ts
expect(mobileHeroSceneProgress(0, 800)).toEqual({
  navExit: 0,
  copyReveal: 0,
  indicatorExit: 0,
});
expect(mobileHeroSceneProgress(800, 800)).toEqual({
  navExit: 1,
  copyReveal: 1,
  indicatorExit: 1,
});
expect(mobileHeroSceneProgress(-100, 800).copyReveal).toBe(0);
expect(mobileHeroSceneProgress(1200, 800).copyReveal).toBe(1);
```

- [ ] **Step 2: Run the focused test and verify it fails because the helper is missing**

Run: `npm test -- --run src/App.test.tsx -t "maps the first mobile viewport"`

- [ ] **Step 3: Implement clamped, eased scene phases and update CSS variables from the existing scroll listener**

```ts
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

export const mobileHeroSceneProgress = (scrolled: number, viewportHeight: number) => {
  const progress = viewportHeight > 0 ? clamp01(scrolled / viewportHeight) : 0;
  return {
    navExit: smoothstep(clamp01(progress / 0.55)),
    copyReveal: smoothstep(clamp01((progress - 0.42) / 0.48)),
    indicatorExit: smoothstep(clamp01(progress / 0.22)),
  };
};
```

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run: `npm test -- --run src/App.test.tsx -t "maps the first mobile viewport"`

### Task 2: Stage the mobile brand exit and copy entrance

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `--mobile-nav-exit`, `--mobile-copy-reveal`, and `--mobile-indicator-exit`.
- Produces: `.nav-brand`, `.hero-copy`, and `.hero-scroll-indicator` mobile transitions.

- [ ] **Step 1: Write failing DOM and stylesheet tests**

```ts
expect(screen.getByTestId("site-shell")).toHaveStyle({
  "--mobile-nav-exit": "0",
  "--mobile-copy-reveal": "0",
});
expect(screen.getByTestId("hero-scroll-indicator")).not.toHaveClass("hidden");
expect(styles).toContain("opacity: var(--mobile-copy-reveal);");
expect(styles).toContain("translate: 0 calc(var(--mobile-nav-exit) * -140%);");
```

- [ ] **Step 2: Run the focused tests and verify the missing mobile scene hooks fail**

Run: `npm test -- --run src/App.test.tsx -t "mobile hero opening frame|mobile hero scroll indicator"`

- [ ] **Step 3: Add stable hooks and mobile-only CSS**

```tsx
<main ref={siteShell} data-testid="site-shell" className="site-shell ...">
  ...
  <motion.div data-testid="hero-copy" className="hero-copy ...">
  ...
  <motion.div data-testid="hero-scroll-indicator" className="hero-scroll-indicator ... flex">
```

```css
@media (max-width: 767px) {
  .nav-brand { translate: 0 calc(var(--mobile-nav-exit) * -140%); opacity: calc(1 - var(--mobile-nav-exit)); }
  .hero-copy { opacity: var(--mobile-copy-reveal); transform: translateY(calc((1 - var(--mobile-copy-reveal)) * 28px)); }
  .hero-scroll-indicator { opacity: calc(1 - var(--mobile-indicator-exit)); }
}
```

- [ ] **Step 4: Verify scroll updates the variables while contact actions and character visuals keep their DOM and positioning contracts**

Run: `npm test -- --run src/App.test.tsx -t "mobile hero"`

### Task 3: Regression and visual verification

**Files:**
- Verify: `src/App.tsx`
- Verify: `src/index.css`
- Verify: `src/App.test.tsx`

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

- [ ] **Step 2: Run the production build**

Run: `npm run build`

- [ ] **Step 3: Inspect a phone-sized viewport at scroll positions 0, mid-transition, and after copy reveal**

Expected: opening brand is visible and copy hidden at 0; brand moves upward before copy appears; copy is readable after reveal; contact icons, character, three objects, and band remain visible; the scroll indicator appears on mobile; reverse scroll restores the opening frame.

- [ ] **Step 4: Confirm no browser console errors and review `git diff --check`**

Run: `git diff --check`

