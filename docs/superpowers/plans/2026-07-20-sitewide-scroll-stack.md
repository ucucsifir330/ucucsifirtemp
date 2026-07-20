# Sitewide Scroll Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every main site section participate in the same bottom-up stacking-panel scroll system at mobile, tablet, and desktop sizes, including 1920×1080.

**Architecture:** Keep the hero’s existing device-specific track because it also drives the character video on touch devices. Wrap the CinematicSection in a reusable `site-panel-track` that reserves one final viewport for the following panel. Measure panel height only on mount/resize and set a negative sticky-top CSS variable, so tall content scrolls fully before the panel pins and the next panel rises; scroll itself remains native and state-free.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, custom CSS, Vitest, Testing Library.

## Global Constraints

- Run the stack interaction at all viewport widths, including `1920 × 1080`.
- Preserve mobile and tablet scroll-driven hero video scrubbing.
- Preserve desktop fine-pointer hero video scrubbing.
- Keep all CinematicSection content reachable when its height exceeds one viewport.
- Add no animation dependency and no React state updates during panel movement.

---

### Task 1: Give every page section an explicit stack role

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/sections/CinematicSection.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `data-testid="cinematic-scroll-track"` with class `site-panel-track`.
- Produces: `site-stack-panel` on CinematicSection and `site-stack-panel logo-panel` on the logo/footer section.

- [x] **Step 1: Write the failing DOM contract test**

```tsx
it("places every post-hero section in the sitewide scroll stack", () => {
  const { container } = render(<App />);
  const track = screen.getByTestId("cinematic-scroll-track");
  const cinematic = screen.getByTestId("cinematic-panel");
  const logo = screen.getByTestId("logo-section");

  expect(track).toHaveClass("site-panel-track");
  expect(track).toContainElement(cinematic);
  expect(cinematic).toHaveClass("site-stack-panel");
  expect(logo).toHaveClass("site-stack-panel", "logo-panel");
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run -t "every post-hero section"`

Expected: FAIL because the wrapper and general stack classes do not exist.

- [x] **Step 3: Add the stack markup**

Wrap `CinematicSection` in:

```tsx
<div data-testid="cinematic-scroll-track" className="site-panel-track">
  <CinematicSection />
</div>
```

Add `site-stack-panel` to the CinematicSection root and `site-stack-panel logo-panel` to the logo/footer section root.

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run -t "every post-hero section"`

Expected: PASS.

### Task 2: Generalize the native-scroll stacking geometry

**Files:**
- Modify: `src/index.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `.site-panel-track`, `.site-stack-panel`, and `.logo-panel`.
- Produces: `stackPanelStickyTop(panelHeight: number, viewportHeight: number): number`.
- Produces: one viewport of reveal space between each main section at every viewport width.

- [x] **Step 1: Replace the narrow transition assertions with a failing sitewide CSS contract**

```tsx
it("stacks every main panel from mobile through 1920 desktop", () => {
  const styles = readFileSync("src/index.css", "utf8");
  expect(styles).toContain(
    ".site-panel-track { position: relative; z-index: 40; margin-top: -100dvh; padding-bottom: 100dvh; }",
  );
  expect(styles).toContain(
    ".site-panel-track > .site-stack-panel { position: sticky; top: var(--site-stack-sticky-top, 0px); }",
  );
  expect(styles).toContain(
    ".logo-panel { position: relative; z-index: 50; margin-top: -100dvh;",
  );
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run -t "from mobile through 1920 desktop"`

Expected: FAIL because only `.cinematic-panel` has a breakpoint-specific overlap.

- [x] **Step 3: Add the global stack rules and remove duplicated overlap rules**

```css
.site-panel-track { position: relative; z-index: 40; margin-top: -100dvh; padding-bottom: 100dvh; }
.site-panel-track > .site-stack-panel { position: sticky; top: var(--site-stack-sticky-top, 0px); }
.site-stack-panel { overflow: clip; background-color: #08060d; border-top: 1px solid rgb(164 143 255 / .18); border-radius: 28px 28px 0 0; box-shadow: 0 -24px 64px rgb(7 4 14 / .42); }
.logo-panel { position: relative; z-index: 50; margin-top: -100dvh; background-color: #07040e; }
```

Keep only the hero track heights inside the existing mobile/tablet/desktop media queries.

Add the pure measurement helper:

```tsx
export const stackPanelStickyTop = (panelHeight: number, viewportHeight: number) =>
  Math.min(0, viewportHeight - panelHeight);
```

On mount and resize, set `--site-stack-sticky-top` on each tracked panel from this helper. Observe panel resizes with `ResizeObserver`; do not update React state and do not run measurements from the scroll handler.

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run -t "from mobile through 1920 desktop"`

Expected: PASS.

- [x] **Step 5: Verify the complete stack visually and with measured geometry**

At `1920 × 1080`, verify Hero → CinematicSection visually and measure CinematicSection → logo/footer geometry. Confirm the `1479px` panel receives a `-399px` sticky top in the `1080px` viewport so its bottom stays pinned during the next reveal. Repeat responsive CSS contract checks for `390 × 844` and `820 × 1180`.

- [x] **Step 6: Verify the project**

Run `npm test -- --run`, `npm run build`, and `git diff --check`.
