# Structure and Asset Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the landing page into a clearly organized codebase with semantic asset names, focused React components, owned stylesheets, and tests that preserve public behavior.

**Architecture:** Keep `App.tsx` as composition and page-state owner only. Move independently reusable visual units into `components/`, section markup into `sections/`, typed media paths into `config/`, and styling into `styles/` by ownership. Public images and video are grouped by purpose under `public/media`; every import or string reference is migrated atomically.

**Tech Stack:** React 18, TypeScript, Vite 8, Vitest 4, Framer Motion, OGL, Tailwind CSS.

## Global Constraints

- Preserve every visible layout, animation, copy string, test ID, and accessibility label.
- Do not add behavior to WhatsApp, e-mail, or “Sinyali gönder” controls.
- Keep the existing public route behavior by serving all assets from `/media/...` paths.
- Keep `App.tsx` exports `formatClock`, `heroVideoTime`, and `shouldSeekHeroVideo` for existing callers.
- Use test-first verification for each behavior-preserving refactor.

---

### Task 1: Normalize public media naming and paths

**Files:**
- Move: `public/Untitled - 19 Temmuz 2026 04.57.12-1.png` → `public/media/hero/abstract-sculpture.png`
- Move: `public/Untitled - 19 Temmuz 2026 04.57.12-2.png` → `public/media/hero/ringed-planet.png`
- Move: `public/Untitled - 19 Temmuz 2026 04.57.12-3.png` → `public/media/hero/floating-cube.png`
- Move: `public/ucucmano.webm` → `public/media/hero/hero-model.webm`
- Move: `public/cosmic-background.png` → `public/media/backgrounds/cosmic-field.png`
- Move: `public/metrics-background.png` → `public/media/backgrounds/vortex-texture.png`
- Move: `public/küre.png` → `public/media/decorations/marbled-orb.png`
- Move: `public/uc-uc-sifir-logo.png` → `public/media/brand/uc-uc-sifir-logo.png`
- Create: `src/config/media.ts`
- Modify: `src/App.tsx`, `src/App.test.tsx`

**Interfaces:**
- Produces `MEDIA` constants with all public URLs, including `MEDIA.hero.modelVideo`.
- Consumers use `MEDIA` instead of inline public asset strings.

- [ ] **Step 1: Write failing asset-contract test**

```ts
expect(existsSync("public/media/hero/abstract-sculpture.png")).toBe(true);
expect(existsSync("public/media/hero/ringed-planet.png")).toBe(true);
expect(existsSync("public/media/hero/floating-cube.png")).toBe(true);
expect(existsSync("public/Untitled - 19 Temmuz 2026 04.57.12-1.png")).toBe(false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: the semantic paths do not yet exist.

- [ ] **Step 3: Add the typed media catalog and move every listed file**

```ts
export const MEDIA = {
  hero: {
    abstractSculpture: "/media/hero/abstract-sculpture.png",
    ringedPlanet: "/media/hero/ringed-planet.png",
    floatingCube: "/media/hero/floating-cube.png",
    modelVideo: "/media/hero/hero-model.webm",
  },
} as const;
```

Update all source and test references to the catalog paths.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all tests pass and no `Untitled -` path remains in `src`.

### Task 2: Extract app primitives and sections

**Files:**
- Create: `src/components/animation/ScrambleText.tsx`
- Create: `src/components/brand/BrandIcons.tsx`
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/visuals/FloatingHeroObject.tsx`
- Create: `src/components/visuals/SectionTransition.tsx`
- Create: `src/sections/HeroSection.tsx`
- Create: `src/sections/CinematicSection.tsx`
- Create: `src/sections/LogoSection.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`

**Interfaces:**
- `HeroSection` receives `pointer: HeroPointer`, `videoRef`, and `onPointerMove` / `onPointerLeave` callbacks.
- `LogoSection` receives `clock: string`.
- `Nav` receives `visible: boolean`.
- `App.tsx` remains the owner of loading, clock, video-seek, and pointer state.

- [ ] **Step 1: Write failing module-boundary test**

```ts
expect(existsSync("src/sections/HeroSection.tsx")).toBe(true);
expect(existsSync("src/sections/CinematicSection.tsx")).toBe(true);
expect(existsSync("src/sections/LogoSection.tsx")).toBe(true);
expect(readFileSync("src/App.tsx", "utf8")).toContain('from "./sections/HeroSection"');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: section files and imports do not exist.

- [ ] **Step 3: Extract components without changing markup contracts**

Move each current function into the indicated module. Preserve every `data-testid`, class name, ARIA value, and props-driven behavior. Replace internal asset literals with `MEDIA` catalog references.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all rendering and interaction tests pass.

### Task 3: Give each style an owner

**Files:**
- Create: `src/styles/fonts.css`
- Create: `src/styles/base.css`
- Create: `src/styles/hero.css`
- Create: `src/styles/loading.css`
- Create: `src/styles/logo-section.css`
- Create: `src/components/SignalTuner.css`
- Modify: `src/index.css`, `src/components/SignalTuner.tsx`, `src/App.test.tsx`

**Interfaces:**
- `index.css` imports only font and page-owned style modules.
- `SignalTuner.tsx` imports `./SignalTuner.css` and contains no CSS template literal.

- [ ] **Step 1: Write failing style-ownership test**

```ts
expect(existsSync("src/components/SignalTuner.css")).toBe(true);
expect(readFileSync("src/components/SignalTuner.tsx", "utf8")).not.toContain("const CSS = `");
expect(readFileSync("src/index.css", "utf8")).toContain('@import "./styles/hero.css"');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`

Expected: the CSS remains embedded or monolithic.

- [ ] **Step 3: Move styles by UI ownership**

Keep global resets, font setup, and reduced-motion fallback in `base.css` / `fonts.css`; move hero selectors and hero keyframes to `hero.css`; move loading selectors to `loading.css`; move logo selectors to `logo-section.css`; copy the complete tuner CSS string into `SignalTuner.css` and delete the JSX `<style>` element.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: all tests pass and Vite resolves every CSS module.

### Task 4: Final structural verification

**Files:**
- Verify: all moved assets, modules, styles, and tests

- [ ] **Step 1: Run static organization scans**

Run: `rg -n "Untitled -|ucucmano.webm|metrics-background.png|cosmic-background.png|küre.png" src public`

Expected: no matches.

- [ ] **Step 2: Run full automated verification**

Run: `npm test; npm run build; npm audit --audit-level=low`

Expected: 0 test failures, build exit code 0, and 0 dependency vulnerabilities.
