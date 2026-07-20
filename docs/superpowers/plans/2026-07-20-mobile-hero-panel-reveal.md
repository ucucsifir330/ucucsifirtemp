# Mobile Hero Panel Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile viewports, finish the hero video scrub first, then keep the completed hero pinned while the “Yayın Çok Yakında” section rises from the bottom as a layered panel; leave tablet and desktop layouts unchanged.

**Architecture:** Mark `CinematicSection` as the reveal panel. Extend only the mobile hero track from `260dvh` to `360dvh`: the first `160dvh` remains the video scrub distance, while the final `100dvh` becomes the panel reveal distance. A pure helper keeps the video timing independent from the extra panel scroll, and static CSS overlap lets native scrolling lift the panel without React state or another animation library.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, custom CSS, Vitest, Testing Library.

## Global Constraints

- Apply the panel reveal only below `768px`.
- Preserve the existing tablet scroll-scrub and desktop pointer-scrub behavior.
- Add no animation dependency and no React state updates during panel movement.
- Keep the CinematicSection content, controls, and accessibility semantics unchanged.

---

### Task 1: Add the mobile panel boundary

**Files:**
- Modify: `src/sections/CinematicSection.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: the existing `CinematicSection` render position immediately after `HeroSection`.
- Produces: `data-testid="cinematic-panel"` and the `cinematic-panel` class on the section root.

- [x] **Step 1: Write the failing test**

```tsx
it("marks the coming-soon section as the panel that rises over the mobile hero", () => {
  const { container } = render(<App />);
  expect(container.querySelector('[data-testid="cinematic-panel"]')).toHaveClass(
    "cinematic-panel",
  );
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --testNamePattern "rises over the mobile hero"`

Expected: FAIL because `data-testid="cinematic-panel"` is absent.

- [x] **Step 3: Add the panel contract to the section root**

```tsx
<section
  data-testid="cinematic-panel"
  className="cinematic-panel relative flex min-h-[100dvh] ..."
>
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --testNamePattern "rises over the mobile hero"`

Expected: PASS.

### Task 2: Reserve a separate scroll phase for the panel

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `heroScrollScrubDistance(trackHeight: number, viewportHeight: number, reservesPanelReveal: boolean): number`.
- Consumes: the helper inside `scrubHeroFromScroll` with `window.matchMedia("(max-width: 767px)").matches`.

- [x] **Step 1: Write the failing helper test**

```tsx
it("excludes the final mobile viewport from the hero video scrub distance", () => {
  expect(heroScrollScrubDistance(3600, 1000, true)).toBe(1600);
  expect(heroScrollScrubDistance(2600, 1000, false)).toBe(1600);
  expect(heroScrollScrubDistance(1000, 1000, false)).toBe(0);
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --testNamePattern "final mobile viewport"`

Expected: FAIL because the helper export does not exist.

- [x] **Step 3: Implement and use the helper**

```tsx
export const heroScrollScrubDistance = (
  trackHeight: number,
  viewportHeight: number,
  reservesPanelReveal: boolean,
) => Math.max(0, trackHeight - viewportHeight * (reservesPanelReveal ? 2 : 1));
```

Inside `scrubHeroFromScroll`, replace the existing subtraction with:

```tsx
const reservesPanelReveal =
  window.matchMedia?.("(max-width: 767px)").matches ?? false;
const scrollable = heroScrollScrubDistance(
  bounds.height,
  window.innerHeight,
  reservesPanelReveal,
);
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --testNamePattern "final mobile viewport"`

Expected: PASS.

### Task 3: Layer the panel over the completed mobile hero

**Files:**
- Modify: `src/index.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `.hero-scroll-track`, `.hero-stage`, and `.cinematic-panel`.
- Produces: a mobile-only `360dvh` track and `-100dvh` panel overlap.

- [x] **Step 1: Write the failing CSS contract test**

```tsx
it("raises the mobile coming-soon panel only after the hero scrub phase", () => {
  const styles = readFileSync("src/index.css", "utf8");
  expect(styles).toContain("@media (max-width: 767px)");
  expect(styles).toContain(".hero-scroll-track { height: 360dvh; }");
  expect(styles).toContain(".cinematic-panel { position: relative; z-index: 40; margin-top: -100dvh;");
  expect(styles).toContain("border-radius: 28px 28px 0 0;");
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --testNamePattern "only after the hero scrub phase"`

Expected: FAIL because the mobile panel overlap styles do not exist.

- [x] **Step 3: Add the native-scroll reveal styles**

```css
@media (max-width: 767px) {
  .hero-scroll-track { height: 360dvh; }
  .cinematic-panel {
    position: relative;
    z-index: 40;
    margin-top: -100dvh;
    overflow: clip;
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -24px 64px rgb(7 4 14 / .42);
  }
}
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --testNamePattern "only after the hero scrub phase"`

Expected: PASS.

- [x] **Step 5: Verify the mobile interaction visually**

Open `http://127.0.0.1:5173/` at `390 × 844`; confirm the video reaches its final frame before the panel edge appears, then confirm the panel rises from the bottom while the hero stays fixed.

- [x] **Step 6: Verify the complete project**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.
