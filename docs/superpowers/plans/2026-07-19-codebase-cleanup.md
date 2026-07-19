# Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing page test suite accurate, prevent off-screen animation work, and remove unused local and package dependencies without changing contact or message-submission behavior.

**Architecture:** Preserve the existing React/Vite component structure. Use `IntersectionObserver` as a small reusable visibility signal inside each animated component, pause render loops while hidden, and update tests to assert the current intended visual contract. Asset and dependency removal is limited to files and packages proven unreferenced by source.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Framer Motion, OGL.

## Global Constraints

- Do not add functionality to WhatsApp, e-mail, or “Sinyali gönder” controls.
- Do not delete user-authored working-tree changes in `index.html`, `package.json`, `package-lock.json`, or `src/App.test.tsx`.
- Preserve the current visual design: navigation wordmarks are `64px/84px`; the hero wordmark is layered at `z-[16]`.
- Remove only dependencies and public assets with no runtime or source reference.

---

### Task 1: Bring visual contract tests in sync

**Files:**
- Modify: `src/App.test.tsx:83-104,628-645`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: current `Nav` and hero-wordmark class contracts in `src/App.tsx`.
- Produces: assertions that protect the current typography and z-index contract.

- [ ] **Step 1: Write the failing test**

Replace old navigation assertions with:

```ts
expect(screen.getByTestId("nav-wordmark-text").parentElement).toHaveClass(
  "text-[64px]",
  "sm:text-[84px]",
);
expect(screen.getByTestId("nav-tagline")).toHaveClass(
  "text-[64px]",
  "sm:text-[84px]",
);
expect(screen.getByTestId("nav-copyright")).toHaveStyle({ top: "2px" });
```

and replace the hero assertion with:

```ts
expect(wordmark).toHaveClass("z-[16]");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: the old assertions fail because they expect superseded classes.

- [ ] **Step 3: Keep only the current design contract assertions**

Remove the old `24px/32px`, `0.05em`, and `z-10` expectations. Keep the new exact assertions from Step 1.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all tests pass.

### Task 2: Pause VortexShader when it is off-screen

**Files:**
- Modify: `src/components/VortexShader.tsx:139-170`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `IntersectionObserver`, `requestAnimationFrame`, and `prefers-reduced-motion`.
- Produces: a Vortex animation loop that runs only while its container is visible.

- [ ] **Step 1: Write the failing test**

Add a test that reads `VortexShader.tsx` and expects its intersection callback to store visibility and its animation loop to schedule a next frame only when visible:

```ts
const shader = readFileSync("src/components/VortexShader.tsx", "utf8");
expect(shader).toContain("let isVisible = false;");
expect(shader).toContain("isVisible = entry.isIntersecting;");
expect(shader).toContain("if (isVisible) animationFrame = window.requestAnimationFrame(render);");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: the visibility-loop assertions fail because the shader currently schedules every frame unconditionally.

- [ ] **Step 3: Implement minimal visibility gating**

Declare `let isVisible = false`, update it in the observer callback, trigger one render when the container enters, and request the next frame only when `isVisible`. Preserve cleanup of the observer and active animation frame.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all tests pass.

### Task 3: Pause SignalTuner waveform work when it is off-screen

**Files:**
- Modify: `src/components/SignalTuner.tsx:115-154`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: an SVG path ref and `IntersectionObserver`.
- Produces: waveform animation that only schedules frames for a visible tuner.

- [ ] **Step 1: Write the failing test**

Add a test that asserts the tuner source has a visibility state and conditional frame scheduling:

```ts
const tuner = readFileSync("src/components/SignalTuner.tsx", "utf8");
expect(tuner).toContain("let isVisible = false;");
expect(tuner).toContain("isVisible = entry.isIntersecting;");
expect(tuner).toContain("if (isVisible) raf = requestAnimationFrame(loop);");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: the source lacks those visibility-gating statements.

- [ ] **Step 3: Implement minimal visibility gating**

Observe the tuner root, draw one static path when hidden, start one loop when it becomes visible, and disconnect/cancel in effect cleanup. Keep reduced-motion behavior as one static draw.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all tests pass.

### Task 4: Remove unused dependencies, font files, and external font request

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/index.css`
- Delete: `public/fonts/Galgo-Light.otf`, all unreferenced static and italic Geist/Geist Mono font files
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: only the variable local Geist, Geist Mono, and Galgo fonts referenced by `@font-face`.
- Produces: no `lucide-react` dependency, no Google Fonts import, and no unreferenced local font files.

- [ ] **Step 1: Write the failing test**

Add assertions that the stylesheet has no Google Fonts URL, `package.json` has no `lucide-react`, and the removed font paths do not exist:

```ts
expect(styles).not.toContain("fonts.googleapis.com");
expect(packageJson).not.toContain('"lucide-react"');
expect(existsSync("public/fonts/Galgo-Light.otf")).toBe(false);
expect(existsSync("public/fonts/Geist-Regular.ttf")).toBe(false);
expect(existsSync("public/fonts/GeistMono-Regular.ttf")).toBe(false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: those unused dependency, URL, and font files still exist.

- [ ] **Step 3: Remove only proven-unused resources**

Remove both Google `@import` lines, uninstall `lucide-react` with `npm uninstall lucide-react`, and delete the 39 unreferenced local font files. Do not remove the variable fonts or `PPNeueMachina-PlainUltrabold.otf`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all tests pass.

### Task 5: Final verification

**Files:**
- Verify: modified production files and test suite

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: 0 failing tests.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Run dependency audit and source scan**

Run: `npm audit --omit=dev --audit-level=low; rg -n "lucide-react|fonts.googleapis.com" src package.json`

Expected: 0 production vulnerabilities and no search matches.
