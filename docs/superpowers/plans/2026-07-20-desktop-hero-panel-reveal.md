# Desktop Hero Panel Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On pointer-capable desktop viewports, keep the hero fixed while the “Yayın Çok Yakında” section rises from the bottom, without changing the existing mouse-driven character-video scrub.

**Architecture:** Give fine-pointer desktop devices a `200dvh` hero track: the first viewport is the visible hero and the second viewport is the native-scroll panel reveal. Keep the CinematicSection overlapped by `-100dvh`, and explicitly exclude fine-pointer desktop from scroll-driven video seeking so horizontal mouse movement remains its only video control.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, custom CSS, Vitest, Testing Library.

## Global Constraints

- Apply the new reveal only at `min-width: 1024px` with `hover: hover` and `pointer: fine`.
- Preserve the existing mobile reveal and tablet scroll-scrub behavior.
- Preserve desktop horizontal-pointer video scrubbing.
- Add no animation dependency and no React state updates during panel movement.

---

### Task 1: Keep desktop video control pointer-only

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `heroDesktopPointerQuery` and the existing `scrubHeroFromScroll` listener.
- Produces: an early return from scroll seeking whenever `heroDesktopPointerQuery` matches.

- [x] **Step 1: Write the failing behavior test**

```tsx
it("keeps the desktop character video pointer-driven while the panel reveal uses scroll", () => {
  // Match only the fine-pointer desktop query, render App, provide video
  // metadata and a scrollable hero track, then dispatch scroll.
  // The video must remain on its first visible frame.
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run -t "pointer-driven while the panel reveal uses scroll"`

Expected: FAIL because the current scroll listener seeks the video when the desktop track becomes taller than one viewport.

- [x] **Step 3: Exclude pointer desktop from scroll seeking**

Inside `scrubHeroFromScroll`, after resolving the track and video, add:

```tsx
if (window.matchMedia?.(heroDesktopPointerQuery).matches) return;
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run -t "pointer-driven while the panel reveal uses scroll"`

Expected: PASS.

### Task 2: Add the desktop native-scroll panel reveal

**Files:**
- Modify: `src/index.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `.hero-scroll-track`, `.hero-stage`, and `.cinematic-panel`.
- Produces: a fine-pointer desktop `200dvh` track with sticky hero and `-100dvh` panel overlap.

- [x] **Step 1: Write the failing CSS contract test**

```tsx
it("raises the coming-soon panel over the pinned hero on pointer desktop", () => {
  const styles = readFileSync("src/index.css", "utf8");
  expect(styles).toContain(
    "@media (min-width: 1024px) and (hover: hover) and (pointer: fine)",
  );
  expect(styles).toContain(".hero-scroll-track { height: 200dvh; }");
  expect(styles).toContain(
    ".cinematic-panel { position: relative; z-index: 40; margin-top: -100dvh;",
  );
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run -t "over the pinned hero on pointer desktop"`

Expected: FAIL because the fine-pointer desktop reveal media query does not exist.

- [x] **Step 3: Add the desktop reveal styles**

```css
@media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
  .hero-scroll-track { height: 200dvh; }
  .hero-scroll-track .hero-stage { position: sticky; top: 0; }
  .cinematic-panel {
    position: relative;
    z-index: 40;
    margin-top: -100dvh;
    overflow: clip;
    background-color: #08060d;
    border-top: 1px solid rgb(164 143 255 / .18);
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -24px 64px rgb(7 4 14 / .42);
  }
}
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run -t "over the pinned hero on pointer desktop"`

Expected: PASS.

- [x] **Step 5: Verify desktop interaction visually**

Open `http://127.0.0.1:5173/` at `1440 × 900`; confirm the hero remains fixed, the panel rises from the bottom across one viewport, and horizontal mouse movement still controls the character video.

- [x] **Step 6: Verify responsive boundaries and project health**

Check `390 × 844` mobile and `820 × 1180` tablet behavior, then run `npm test -- --run`, `npm run build`, and `git diff --check`.
