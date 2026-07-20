import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, {
  clavisOrbRotationDuration,
  desktopHeroChromeProgress,
  desktopWordmarkExitProgress,
  mobileHeroSceneProgress,
  heroVideoTime,
  heroScrollVideoTime,
  heroScrollScrubDistance,
  formatClock,
  stackPanelStickyTop,
  shouldSeekHeroVideo,
} from "./App";
import CustomCursor from "./components/CustomCursor";
import * as SignalTunerModule from "./components/SignalTuner";

type WaveProfile = "idle" | "software" | "production" | "growth" | "other";

const getSignalWaveY = () => {
  const waveY = (
    SignalTunerModule as unknown as {
      signalWaveY?: (profile: WaveProfile, x: number, time: number) => number;
    }
  ).signalWaveY;

  expect(waveY).toBeTypeOf("function");
  return waveY!;
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

it("loads the supplied soundtrack formats without attempting audible autoplay", () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play");
  render(<App />);

  const soundtrack = screen.getByTestId("site-soundtrack");
  const sources = soundtrack.querySelectorAll("source");

  expect(soundtrack).toHaveAttribute("loop");
  expect(soundtrack).not.toHaveAttribute("autoplay");
  expect(soundtrack).toHaveAttribute("preload", "auto");
  expect(play).not.toHaveBeenCalled();
  expect(sources[0]).toHaveAttribute(
    "src",
    "/media/audio/pure-system-silence.mp3",
  );
  expect(sources[0]).toHaveAttribute("type", "audio/mpeg");
  expect(sources[1]).toHaveAttribute(
    "src",
    "/media/audio/pure-system-silence.m4a",
  );
  expect(sources[1]).toHaveAttribute("type", "audio/mp4");
});

it("enters with sound when the visitor clicks the full-screen gate", async () => {
  vi.useFakeTimers();
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue(undefined);
  const { container } = render(<App />);

  expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  const concealedGate = container.querySelector(".audio-entry-gate");
  expect(concealedGate).toHaveAttribute("data-ready", "false");
  expect(concealedGate).toHaveAttribute("aria-hidden", "true");
  expect(
    screen.queryByRole("dialog", { name: "Ses tercihi" }),
  ).not.toBeInTheDocument();

  act(() => vi.advanceTimersByTime(3000));

  expect(screen.getByTestId("loading-screen")).toHaveClass("loading-screen--lift");
  expect(concealedGate).toHaveAttribute("data-ready", "true");
  expect(screen.getByRole("dialog", { name: "Ses tercihi" })).toBeInTheDocument();

  act(() => vi.advanceTimersByTime(800));
  vi.useRealTimers();

  const gate = screen.getByRole("dialog", { name: "Ses tercihi" });
  const words = gate.querySelectorAll(".audio-entry-gate__word");
  expect(Array.from(words, (word) => word.textContent)).toEqual([
    "SESİ AÇMAK İÇİN",
    "HERHANGİ BİR YERE",
    "TIKLA",
  ]);
  expect(Array.from(words, (word) => word.getAttribute("data-layout"))).toEqual([
    "intro",
    "prompt",
    "action",
  ]);

  fireEvent.click(
    screen.getByRole("button", { name: "Sesi açarak siteye gir" }),
  );

  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Ses tercihi" })).not.toBeInTheDocument();
  });
  expect(play).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Sesi kapat" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

it("lets the visitor enter silently without starting the soundtrack", async () => {
  vi.useFakeTimers();
  const play = vi.spyOn(HTMLMediaElement.prototype, "play");
  render(<App />);

  act(() => vi.advanceTimersByTime(3800));
  vi.useRealTimers();
  fireEvent.click(screen.getByRole("button", { name: "Sessiz devam et" }));

  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Ses tercihi" })).not.toBeInTheDocument();
  });
  expect(play).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Sesi aç" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

it("keeps native root scrolling available for the iOS Safari toolbar", () => {
  render(<App />);

  expect(document.documentElement).not.toHaveClass("audio-entry-active");

  const styles = readFileSync("src/index.css", "utf8");
  expect(styles).not.toMatch(
    /html\.audio-entry-active[\s\S]*?overflow:\s*hidden;/,
  );
  expect(styles).toMatch(
    /\.audio-entry-gate\s*\{[^}]*touch-action:\s*none;/s,
  );
  expect(styles).toMatch(
    /\.loading-screen\s*\{[^}]*touch-action:\s*none;/s,
  );
});

it("uses a centered, higher-contrast Geist entry composition responsively", () => {
  const styles = readFileSync("src/index.css", "utf8");

  expect(styles).toMatch(
    /@font-face\s*\{[^}]*font-family:\s*'PP Neue Machina';[^}]*PPNeueMachina-PlainThin\.otf[^}]*font-weight:\s*100;/s,
  );
  expect(styles).toMatch(
    /\.audio-entry-gate\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*z-index:\s*190;[^}]*background:\s*#090414;/s,
  );
  expect(styles).toMatch(
    /\.audio-entry-gate__message\s*\{[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*display:\s*grid;[^}]*width:\s*min\(82vw, 760px\);[^}]*justify-items:\s*center;[^}]*transform:\s*translate\(-50%, -50%\);/s,
  );
  expect(styles).toMatch(
    /\.audio-entry-gate__word\s*\{[^}]*color:\s*rgb\(226 222 230 \/ \.94\);[^}]*font-family:\s*"Geist"[^}]*font-weight:\s*300;[^}]*text-align:\s*center;/s,
  );
  expect(styles).toMatch(
    /\.audio-entry-gate__word\[data-layout="action"\]\s*\{[^}]*font-size:\s*clamp\(46px, 6\.4vw, 110px\);/s,
  );
  expect(styles).toMatch(
    /\.audio-entry-gate__silent\s*\{[^}]*bottom:\s*7dvh;[^}]*color:\s*rgb\(207 201 216 \/ \.9\);[^}]*font-family:\s*"Geist"[^}]*font-weight:\s*400;/s,
  );
  expect(styles).toMatch(
    /@media \(max-width: 767px\) \{[\s\S]*?\.audio-entry-gate__message\s*\{[^}]*width:\s*min\(88vw, 520px\);/,
  );
  expect(styles).toMatch(
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.audio-entry-gate__word,[\s\S]*?animation:\s*none;/,
  );
});

it("places the mobile sound control beneath mail and moves it with navigation", () => {
  const styles = readFileSync("src/index.css", "utf8");

  expect(styles).toMatch(
    /\.hero-sound-control\s*\{[^}]*display:\s*grid;/s,
  );
  expect(styles).not.toMatch(
    /\.hero-sound-control\s*\{[^}]*display:\s*none;/s,
  );
  expect(styles).toMatch(
    /@media \(max-width: 767px\) \{[\s\S]*?\.hero-sound-control \{[^}]*position:\s*fixed;[^}]*top:\s*224px;[^}]*right:\s*16px;[^}]*bottom:\s*auto;[^}]*width:\s*56px;[^}]*height:\s*56px;[^}]*transform:\s*translate3d\(0, var\(--mobile-nav-shift\), 0\);[^}]*opacity:\s*var\(--mobile-nav-opacity\);[^}]*will-change:\s*transform, opacity;[^}]*\}/,
  );
  expect(styles).toMatch(
    /\.hero-sound-control__waves,\s*\.hero-sound-control__mute\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;/s,
  );
});

it("places the tablet sound control directly beneath the tablet mail action", () => {
  const styles = readFileSync("src/index.css", "utf8");

  expect(styles).toMatch(
    /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[\s\S]*?\.hero-sound-control\s*\{[^}]*position:\s*fixed;[^}]*top:\s*344px;[^}]*right:\s*32px;[^}]*bottom:\s*auto;[^}]*width:\s*96px;[^}]*height:\s*96px;/,
  );
});

it("renders the purple custom cursor layers", () => {
  render(
    <>
      <button type="button">İletişim</button>
      <CustomCursor />
    </>,
  );

  const dot = screen.getByTestId("cursor-dot");
  const follower = screen.getByTestId("cursor-ring");
  const contactButton = screen.getByRole("button", { name: "İletişim" });
  fireEvent.mouseMove(contactButton, {
    clientX: 120,
    clientY: 80,
  });

  expect(dot).toHaveStyle({ transform: "translate3d(120px, 80px, 0)" });
  expect(follower).toHaveStyle({ transform: "translate3d(120px, 80px, 0)" });
  expect(follower.parentElement).toHaveAttribute("data-active", "true");
  expect(contactButton).toHaveStyle({ cursor: "none" });

  const styles = readFileSync("src/index.css", "utf8");
  expect(styles).toContain("width: 28px;");
  expect(styles).toContain("height: 28px;");
  expect(styles).not.toContain("!important");
  expect(styles).toContain("html body [class]");
});

describe("Üç Üç Sıfır landing page", () => {
  it("uses Üç Üç Sıfır in the project metadata", () => {
    const html = readFileSync("index.html", "utf8");
    const packageJson = readFileSync("package.json", "utf8");

    expect(html).toContain("<title>Üç Üç Sıfır</title>");
    expect(html).toContain(
      '<link rel="icon" type="image/png" href="/favicon-330.png" />',
    );
    expect(existsSync("public/favicon-330.png")).toBe(true);
    expect(packageJson).toContain('"name": "uc-uc-sifir"');
  });

  it("keeps public media in semantic directories", () => {
    expect(existsSync("public/media/hero/abstract-sculpture.png")).toBe(true);
    expect(existsSync("public/media/hero/ringed-planet.png")).toBe(true);
    expect(existsSync("public/media/hero/floating-cube.png")).toBe(true);
    expect(existsSync("public/media/hero/hero-model.webm")).toBe(true);
    expect(existsSync("public/media/backgrounds/cosmic-field.png")).toBe(true);
    expect(existsSync("public/media/backgrounds/vortex-texture.png")).toBe(true);
    expect(existsSync("public/media/decorations/marbled-orb.png")).toBe(true);
    expect(existsSync("public/media/brand/uc-uc-sifir-logo.png")).toBe(true);
    expect(
      existsSync("public/Untitled - 19 Temmuz 2026 04.57.12-1.png"),
    ).toBe(false);
  });

  it("composes the page from focused section modules", () => {
    expect(existsSync("src/sections/HeroSection.tsx")).toBe(true);
    expect(existsSync("src/sections/CinematicSection.tsx")).toBe(true);
    expect(existsSync("src/sections/LogoSection.tsx")).toBe(true);
    expect(readFileSync("src/App.tsx", "utf8")).toContain(
      'from "./sections/HeroSection"',
    );
  });

  it("starts at the very top when the loading screen is shown", () => {
    render(<App />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toMatch(
      /\.site-content--prepared\s*\{[\s\S]*transform:\s*translateY\(0\);/,
    );
  });

  it("reverses the loading ring, grows 330, then lifts the page curtain", () => {
    vi.useFakeTimers();
    const { container } = render(<App />);

    const loader = screen.getByTestId("loading-screen");
    expect(loader).toHaveAttribute("data-phase", "loading");
    expect(screen.getByTestId("loading-logo")).toHaveAttribute(
      "src",
      "/media/brand/uc-uc-sifir-logo.png",
    );
    expect(screen.getByTestId("loading-ring")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1650));
    expect(loader).toHaveAttribute("data-phase", "ring-out");

    act(() => vi.advanceTimersByTime(350));
    expect(loader).toHaveAttribute("data-phase", "logo-grow");
    expect(screen.getByTestId("loading-ring")).toHaveClass(
      "loading-ring--erasing",
    );
    expect(screen.getByTestId("loading-logo")).toHaveClass(
      "loading-logo--growing",
    );
    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toMatch(/\.loading-screen\s*\{[\s\S]*background:\s*#07040e;/);
    expect(styles).toContain(".loading-ring--erasing {\n  opacity: 0;");
    expect(styles).toContain("to { transform: scale(1.2); }");

    act(() => vi.advanceTimersByTime(999));
    expect(loader).toHaveAttribute("data-phase", "logo-grow");

    act(() => vi.advanceTimersByTime(1));
    expect(loader).toHaveAttribute("data-phase", "lift");
    expect(loader).toHaveAttribute("data-transition", "curtain-up");
    expect(loader).toHaveClass("loading-screen--lift");
    expect(container.querySelector(".audio-entry-gate")).toHaveAttribute(
      "data-ready",
      "true",
    );
    expect(container.querySelector(".site-content")).toHaveClass(
      "site-content--revealing",
    );

    const stylesDuringLift = readFileSync("src/index.css", "utf8");
    expect(stylesDuringLift).toMatch(
      /\.loading-screen\s*\{[^}]*z-index:\s*210;/s,
    );
    expect(stylesDuringLift).toMatch(
      /\.audio-entry-gate\s*\{[^}]*z-index:\s*190;/s,
    );

    act(() => vi.advanceTimersByTime(800));
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
  });

  it("replaces the navigation menu with an animated Üç Üç Sıfır wordmark", () => {
    render(<App />);

    expect(screen.getByTestId("nav-wordmark")).toHaveAttribute(
      "aria-label",
      "Üç Üç Sıfır",
    );
    expect(screen.getByTestId("nav-wordmark")).toHaveTextContent("©");
    expect(screen.getByTestId("nav-copyright")).toHaveClass("absolute");
    expect(screen.getByTestId("nav-wordmark")).not.toHaveClass("bg-white/10");
    expect(screen.queryByTestId("nav-logo")).not.toBeInTheDocument();
    expect(screen.getByTestId("nav-wordmark-text").parentElement).toHaveClass(
      "text-[42px]",
      "sm:text-[84px]",
    );
    expect(screen.getByTestId("nav-tagline")).toHaveTextContent("#notlikeothers");
    expect(screen.getByTestId("nav-tagline")).toHaveClass(
      "text-[42px]",
      "sm:text-[84px]",
    );
    expect(screen.getByTestId("nav-copyright")).toHaveClass("nav-sup");
    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toContain(".nav-sup { right: -4px; top: 4px; }");
    expect(styles).toContain(
      ".nav-sup.nav-sup { font-size: calc(18 * var(--u)); right: calc(-4 * var(--u)); top: calc(4 * var(--u)); }",
    );
    expect(screen.queryByLabelText("Toggle navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Metrics" })).not.toBeInTheDocument();
  });

  it("shows the supplied WhatsApp mark and email mark without glass containers", () => {
    render(<App />);

    const contactActions = screen.getByTestId("hero-contact-actions");
    expect(contactActions).toHaveClass("fixed", "right-4", "top-24", "z-50");
    const whatsapp = screen.getByRole("button", { name: "WhatsApp ile iletişime geç" });
    expect(whatsapp).toBeInTheDocument();
    expect(whatsapp).toHaveClass("contact-icon-button");
    expect(whatsapp).not.toHaveClass("liquid-glass-button");
    expect(whatsapp.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
    expect(whatsapp.querySelector("svg path")).toHaveAttribute(
      "d",
      expect.stringContaining("M21.98 11.4104"),
    );
    expect(whatsapp.querySelector("svg path")).toHaveAttribute("fill", "white");
    const email = screen.getByRole("button", { name: "E-posta ile iletişime geç" });
    expect(email).not.toHaveTextContent("E-POSTA");
    expect(email).toHaveClass("contact-icon-button");
    expect(email).not.toHaveClass("liquid-glass-button");
    expect(email.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
    expect(email.querySelectorAll("svg path")).toHaveLength(3);
    expect(email.querySelector("svg path")).toHaveAttribute(
      "d",
      expect.stringContaining("M21.54 13.51"),
    );
    expect(email.querySelector("svg path")).toHaveAttribute("fill", "white");
  });

  it("removes every decorative surface from the contact icon buttons", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(".contact-icon-button {");
    expect(styles).toContain("border: 0;");
    expect(styles).toContain("background: transparent;");
    expect(styles).not.toContain(".liquid-glass-button");
  });

  it("decrypts the Üç Üç Sıfır wordmark when hovered", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<App />);

    const wordmark = screen.getByTestId("nav-wordmark-text");
    fireEvent.mouseEnter(screen.getByTestId("nav-wordmark"));
    act(() => vi.advanceTimersByTime(25));

    expect(wordmark).not.toHaveTextContent("Üç Üç Sıfır");

    fireEvent.mouseLeave(screen.getByTestId("nav-wordmark"));
    expect(wordmark).toHaveTextContent("Üç Üç Sıfır");
  });

  it("renders the specified content landmarks", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Yayın çok yakında." })).toBeInTheDocument();
    expect(screen.getByText("Frekans ayarla")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Yazılım|Prodüksiyon|Büyüme|Diğer/ })).toHaveLength(4);
    expect(screen.getByTestId("signal-background")).toHaveAttribute(
      "src",
      "/media/backgrounds/cosmic-field.png",
    );
    expect(screen.getByTestId("signal-background")).toHaveClass("opacity-45");
    expect(screen.getByTestId("vortex-shader")).toHaveAttribute(
      "data-src",
      "/media/backgrounds/vortex-texture.png",
    );
    expect(screen.getByTestId("vortex-shader")).toHaveClass("z-0", "opacity-45");
    expect(screen.getByRole("button", { name: "SİNYALİ GÖNDER" })).toBeEnabled();
    expect(screen.queryByText(/Nereden başlayalım/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Adaptive\s*Intelligence/)).not.toBeInTheDocument();
    expect(screen.queryByText("Three layers. Zero friction.")).not.toBeInTheDocument();
    expect(screen.queryByText(/2026 Üç Üç Sıfır Labs/)).not.toBeInTheDocument();
  });

  it("does not show the temporary visual gallery on the homepage", () => {
    render(<App />);

    expect(screen.queryByTestId("homepage-visuals")).not.toBeInTheDocument();
  });

  it("layers the supplied transparent visuals into the hero", () => {
    const { container } = render(<App />);

    const visuals = container.querySelector('[data-testid="hero-visuals"]');
    expect(visuals).toBeInTheDocument();
    expect(visuals?.querySelectorAll("img")).toHaveLength(2);
    expect(visuals?.querySelector('img[src="/media/hero/abstract-sculpture.png"]')).toBeInTheDocument();
    expect(visuals?.querySelector('img[src="/media/hero/ringed-planet.png"]')).toBeInTheDocument();
    expect(visuals?.querySelector('img[src="/media/hero/floating-cube.png"]')).not.toBeInTheDocument();
  });

  it("makes the hero objects float and react to pointer hover", () => {
    render(<App />);

    const object = screen.getByTestId("hero-object-1");
    expect(object).toHaveAttribute("data-hovered", "false");
    expect(object).toHaveClass("hero-object");

    fireEvent.mouseEnter(object);
    expect(object).toHaveAttribute("data-hovered", "true");

    fireEvent.mouseLeave(object);
    expect(object).toHaveAttribute("data-hovered", "false");
  });

  it("places the supplied third visual as a cube behind the hero model", () => {
    const { container } = render(<App />);

    const visual = container.querySelector('[data-testid="hero-background-visual"]');
    expect(visual).toHaveAttribute(
      "src",
      "/media/hero/floating-cube.png",
    );
    expect(visual).toHaveClass("hero-cube", "z-[15]");
    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toContain(".hero-object--cube {\n  top: 61%;\n  left: 71.16%;");
  });

  it("makes the background cube float and react to pointer hover", () => {
    render(<App />);

    const cube = screen.getByTestId("hero-cube-object");
    expect(cube).toHaveAttribute("data-hovered", "false");

    fireEvent.mouseEnter(cube);
    expect(cube).toHaveAttribute("data-hovered", "true");

    fireEvent.mouseLeave(cube);
    expect(cube).toHaveAttribute("data-hovered", "false");
  });

  it("moves all three hero objects when the pointer approaches them", () => {
    render(<App />);

    const hero = screen.getByTestId("hero-stage");
    hero.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 1000, height: 600 }) as DOMRect;
    fireEvent.mouseMove(hero, { clientX: 900, clientY: 450 });

    expect(screen.getByTestId("hero-object-1")).toHaveAttribute(
      "data-reactive",
      "true",
    );
    expect(screen.getByTestId("hero-object-2")).toHaveAttribute(
      "data-reactive",
      "true",
    );
    expect(screen.getByTestId("hero-cube-object")).toHaveAttribute(
      "data-reactive",
      "true",
    );
  });

  it("keeps hero objects at a fixed scale while restoring their proximity glow", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const styles = readFileSync("src/index.css", "utf8");

    expect(app).toContain("scale: 1,");
    expect(styles).toContain('.hero-object[data-glowing="true"]::before');
  });

  it("activates the cube glow only when the pointer is directly over it", () => {
    render(<App />);

    const hero = screen.getByTestId("hero-stage");
    const cube = screen.getByTestId("hero-cube-object");
    hero.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 1000, height: 600 }) as DOMRect;
    cube.getBoundingClientRect = () =>
      ({ left: 780, top: 360, right: 900, bottom: 480, width: 120, height: 120 }) as DOMRect;

    fireEvent.mouseMove(hero, { clientX: 840, clientY: 414 });
    expect(cube).toHaveAttribute(
      "data-glowing",
      "true",
    );

    fireEvent.mouseMove(hero, { clientX: 700, clientY: 414 });
    expect(cube).toHaveAttribute(
      "data-glowing",
      "false",
    );
  });

  it("positions the ringed visual lower and slightly left in the hero", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(".hero-object--2 {\n  top: 74%;\n  left: 83.28%;");
  });

  it("rotates the first hero visual 260 degrees", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(".hero-object--1 {\n  top: 62%;\n  left: 87.83%;");
    expect(styles).toContain(".hero-visual--1 {\n  transform: rotate(260deg);");
  });

  it("uses the local Geist font files instead of requiring a remote font request", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain("src: url('/fonts/Geist-VariableFont_wght.ttf') format('truetype')");
    expect(styles).toContain("src: url('/fonts/GeistMono-VariableFont_wght.ttf') format('truetype')");
    expect(styles).not.toContain("family=Geist:wght");
  });

  it("self-hosts every required font and removes unused font resources", () => {
    const styles = readFileSync("src/index.css", "utf8");
    const packageJson = readFileSync("package.json", "utf8");

    expect(styles).not.toContain("fonts.googleapis.com");
    expect(styles).toContain("@fontsource/anton-sc");
    expect(styles).toContain("@fontsource/space-mono");
    expect(styles).toContain("@fontsource-variable/instrument-sans");
    expect(packageJson).not.toContain('"lucide-react"');
    expect(existsSync("public/fonts/Galgo-Light.otf")).toBe(false);
    expect(existsSync("public/fonts/Geist-Regular.ttf")).toBe(false);
    expect(existsSync("public/fonts/GeistMono-Regular.ttf")).toBe(false);
  });

  it("replaces the performance metrics with the 330 logo", () => {
    render(<App />);

    expect(screen.getByTestId("metrics-logo")).toHaveAttribute(
      "src",
      "/media/brand/uc-uc-sifir-logo.png",
    );
    expect(screen.getByTestId("metrics-logo")).toHaveAttribute(
      "alt",
      "Üç Üç Sıfır",
    );
    expect(screen.getByTestId("metrics-logo")).toHaveClass("object-contain");
    expect(screen.getByTestId("metrics-logo")).toHaveClass("opacity-70");
    expect(screen.queryByText("Performance Metrics")).not.toBeInTheDocument();
    expect(screen.queryByText("Synaptic Latency")).not.toBeInTheDocument();
  });

  it("makes the 330 logo respond to pointer position and hover", () => {
    const { container } = render(<App />);
    const logoStage = screen.getByTestId("metrics-logo-stage");

    expect(logoStage).toHaveAttribute("data-hovered", "false");
    fireEvent.mouseEnter(logoStage);
    fireEvent.mouseMove(logoStage, { clientX: 180, clientY: 40 });

    expect(logoStage).toHaveAttribute("data-hovered", "true");
    expect(container.querySelector(".metrics-logo-glow")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-logo").parentElement).toHaveClass(
      "metrics-logo-motion",
    );

    fireEvent.mouseLeave(logoStage);
    expect(logoStage).toHaveAttribute("data-hovered", "false");
  });

  it("positions the 330 logo near the top of the section", () => {
    render(<App />);
    const styles = readFileSync("src/index.css", "utf8");

    expect(screen.getByTestId("logo-section")).toHaveClass(
      "items-start",
      "overflow-hidden",
    );
    expect(screen.getByTestId("metrics-logo").closest(".mt-0")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-logo").closest(".-translate-y-\\[18\\%\\]")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-logo").closest(".logo-showcase")).toBeInTheDocument();
    expect(styles).toContain(".logo-showcase { translate: 0 -16px; }");
    expect(styles).not.toContain("-translate-y-[24%]");
    expect(screen.getByTestId("vortex-shader")).toHaveAttribute(
      "data-focal-point",
      "0.5,0.84",
    );
  });

  it("anchors the Geist frequency status bar to the bottom of the page", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 21, 7, 52));
    render(<App />);

    const statusBar = screen.getByTestId("logo-status-bar");
    expect(statusBar).toHaveClass("absolute", "inset-x-0", "bottom-3", "border-t");
    expect(statusBar).toHaveStyle({ fontFamily: "Geist, sans-serif" });
    expect(statusBar).toHaveTextContent("© 2026 TÜM HAKLARI SAKLIDIR");
    expect(statusBar).toHaveTextContent("88.1 — 107.9 MHZ");
    expect(statusBar).toHaveTextContent("21:07:52");
  });

  it("pins the frequency to the true center of the status bar and keeps the logo glow subtle", () => {
    render(<App />);
    const statusBar = screen.getByTestId("logo-status-bar");
    const styles = readFileSync("src/index.css", "utf8");

    expect(statusBar).toHaveClass("grid", "sm:grid-cols-[1fr_auto_1fr]");
    expect(screen.getByTestId("logo-frequency")).toHaveClass("justify-self-center");
    expect(styles).toContain("opacity: .14;");
    expect(styles).toContain("opacity: .42;");
  });

  it("uses a spacious soft-white mobile status bar without the frequency readout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 21, 7, 52));
    render(<App />);

    const statusBar = screen.getByTestId("logo-status-bar");
    const copyright = screen.getByText("© 2026 TÜM HAKLARI SAKLIDIR");
    const frequency = screen.getByTestId("logo-frequency");
    const clock = screen.getByText("21:07:52");

    expect(statusBar).toHaveClass(
      "grid-cols-[1fr_auto]",
      "gap-x-4",
      "py-4",
      "text-[#F0EDFA]/80",
      "sm:grid-cols-[1fr_auto_1fr]",
      "sm:gap-x-0",
      "sm:pb-0",
    );
    expect(frequency).toHaveClass("hidden", "sm:block", "sm:col-start-2");
    expect(copyright).toHaveClass("col-start-1", "row-start-1");
    expect(clock).toHaveClass("col-start-2", "row-start-1", "sm:col-start-3");
  });

  it("replaces the neural-link label with the three-line Not Like Others heading", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(2000));

    expect(screen.queryByText("Neural Link Active — EST. 330")).not.toBeInTheDocument();
    expect(screen.getByText("#notlikeothers")).toBeInTheDocument();
  });

  it("keeps #notlikeothers in the top-right and scrambles it on hover", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<App />);

    const tagline = screen.getByTestId("nav-tagline");
    expect(tagline).toHaveTextContent("#notlikeothers");

    fireEvent.mouseEnter(tagline);
    act(() => vi.advanceTimersByTime(25));
    expect(tagline).not.toHaveTextContent("#notlikeothers");

    fireEvent.mouseLeave(tagline);
    expect(tagline).toHaveTextContent("#notlikeothers");
  });

  it("uses the new Ritim İle Akış hero copy", () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole("heading", { name: /Ritim\s+ile Akış/i })).toBeInTheDocument();
    expect(container.querySelector(".hero-description")).toHaveTextContent(
      "Sıradan görünmeyi reddeden markalar için premium dijital deneyimler üretiyoruz. Yeni yüzümüzü inşa ederken ihtiyacın olan hizmet alanını seç, detayları paylaş hedefine en uygun ekiple seni doğrudan buluşturalım.",
    );
    expect(screen.queryByText("Brain")).not.toBeInTheDocument();
  });

  it("reveals the desktop hero copy only after the sound gate choice", () => {
    vi.useFakeTimers();
    render(<App />);

    const entrance = screen.getByTestId("hero-copy-entrance");
    expect(entrance).toHaveAttribute("data-intro", "hidden");
    expect(entrance.querySelector(".hero-title-entrance")).toBeInTheDocument();
    expect(entrance.querySelector(".hero-description-entrance")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2999));
    expect(entrance).toHaveAttribute("data-intro", "hidden");
    act(() => vi.advanceTimersByTime(1));
    expect(entrance).toHaveAttribute("data-intro", "hidden");
    act(() => vi.advanceTimersByTime(800));
    fireEvent.click(screen.getByRole("button", { name: "Sessiz devam et" }));
    expect(entrance).toHaveAttribute("data-intro", "visible");

    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toContain("@keyframes desktop-hero-title-in");
    expect(styles).toContain("@keyframes desktop-hero-description-in");
    expect(styles).toContain(
      '.hero-copy-entrance[data-intro="visible"] .hero-title-entrance',
    );
    expect(styles).toContain(
      '.hero-copy-entrance[data-intro="visible"] .hero-description-entrance',
    );
    expect(styles).toContain("animation-delay: 80ms;");
    expect(styles).toContain("animation-delay: 320ms;");
  });

  it("keeps the Ritim ile Akış title on one line in its original left position", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(3000));

    const heroTitle = screen.getByRole("heading", { name: /Ritim\s+ile Akış/i });
    expect(heroTitle).toHaveClass("whitespace-nowrap");
    expect(heroTitle).not.toHaveClass("text-center");
    expect(heroTitle.querySelector("br")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-copy")).not.toHaveClass("items-center");
  });

  it("positions the complete Ritim ile Akış copy block for each viewport", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(".hero-copy { translate: 0 clamp(28px, 5vh, 52px); }");
    expect(styles).toContain("translate: 0 clamp(8px, 1.5vh, 16px);");
    expect(styles).toContain(
      ".hero-copy { justify-content: flex-start; padding-top: .5rem; padding-bottom: 0; translate: 0; }",
    );
    expect(styles).toContain(
      ".hero-copy.hero-copy { padding-bottom: 0; translate: 0 calc(12 * var(--u)); }",
    );
  });

  it("enlarges the character and attached objects only on mobile and tablet", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(
      ".hero-model-video { height: 100%; transform: translateX(-50%); transform-origin: center bottom; }",
    );
    expect(styles).toContain(
      ".hero-model-video { height: min(64%, 99.04vw); max-width: 112vw; object-position: center bottom; transform: translateX(-50%) scale(1.12); }",
    );
    expect(styles).toContain(
      ".model-anchor__box { height: min(64%, 99.04vw); }",
    );
    expect(styles).toContain(
      "@media (min-width: 768px) and (max-width: 1023px)",
    );
    expect(styles).toContain(
      ".hero-model-video { height: min(86%, 90vw); max-width: 110vw; }",
    );
    expect(styles).toContain(
      ".model-anchor__box { height: min(86%, 90vw); }",
    );
    expect(styles).not.toMatch(/\.model-anchor__box[^}]*scale\(/s);
  });

  it("uses the requested hero typography scale and description treatment", () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(3000));

    const heroTitle = screen.getByRole("heading", { name: /Ritim\s+ile Akış/i });
    expect(heroTitle).toHaveClass("text-[clamp(48px,10vw,160px)]");
    expect(heroTitle).toHaveStyle({
      fontFamily: '"PP Neue Machina", sans-serif',
      fontWeight: "800",
      letterSpacing: "-0.02em",
    });
    expect((heroTitle as HTMLElement).style.lineHeight).toBe("");
    const description = container.querySelector(".hero-description");
    expect(description).toHaveClass("text-[#fdfcfc]", "sm:text-[16px]");
    expect(description).toHaveClass("lg:max-w-[60rem]");
    expect(description).toHaveStyle({ fontFamily: '"Inter Variable", Arial, sans-serif' });
  });

  it("updates the frequency readout when a station is selected", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Prodüksiyon/i }));

    expect(screen.getByText("Bağlı — 94.5 · Prodüksiyon")).toBeInTheDocument();
  });

  it("assigns a distinct waveform profile to every station", () => {
    const { container } = render(<App />);
    const wave = container.querySelector(".st-wave");

    expect(wave).toHaveAttribute("data-wave-profile", "idle");

    for (const [station, profile] of [
      ["Yazılım", "software"],
      ["Prodüksiyon", "production"],
      ["Büyüme", "growth"],
      ["Diğer", "other"],
    ] as const) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(station, "i") }));
      expect(wave).toHaveAttribute("data-wave-profile", profile);
    }
  });

  it("keeps every waveform safely inside the visible wave band", () => {
    const waveY = getSignalWaveY();
    const profiles: WaveProfile[] = ["idle", "software", "production", "growth", "other"];

    for (const profile of profiles) {
      const samples = Array.from({ length: 301 }, (_, index) =>
        waveY(profile, index * 4, 1800),
      );
      expect(Math.min(...samples)).toBeGreaterThanOrEqual(5);
      expect(Math.max(...samples)).toBeLessThanOrEqual(51);
    }
  });

  it("adds glow at every size and vertically stretches only the desktop waveform", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(
      ".st-wave path{opacity:1;filter:drop-shadow(0 0 5px rgba(164,143,255,.72))}",
    );
    expect(styles).toContain(
      "@media (min-width:761px){\n  .st-wave{height:88px}\n  .st-wave path{stroke-width:2.25;transform:scaleY(1.55);transform-box:view-box;transform-origin:center}",
    );
    expect(styles).not.toContain(
      "@media (max-width:760px){\n  .st-wave path{transform:scaleY(1.55)",
    );
  });

  it("gives software a regular repeating flow", () => {
    const waveY = getSignalWaveY();

    for (let x = 0; x <= 1040; x += 40) {
      expect(waveY("software", x, 900)).toBeCloseTo(
        waveY("software", x + 160, 900),
        5,
      );
    }
  });

  it("makes the growth wave progressively stronger without overflowing", () => {
    const waveY = getSignalWaveY();
    const amplitude = (from: number, to: number) =>
      Math.max(
        ...Array.from({ length: (to - from) / 4 + 1 }, (_, index) =>
          Math.abs(waveY("growth", from + index * 4, 0) - 28),
        ),
      );

    expect(amplitude(960, 1200)).toBeGreaterThan(amplitude(0, 240) * 2.5);
  });

  it("gives the other wave a slow heartbeat with a mostly calm baseline", () => {
    const waveY = getSignalWaveY();
    const samples = Array.from({ length: 321 }, (_, x) => waveY("other", x, 0));
    const calmSamples = samples.filter((y) => Math.abs(y - 28) < 1.5);

    expect(calmSamples.length / samples.length).toBeGreaterThan(0.72);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(20);
  });

  it("uses the requested communication call-to-action copy", () => {
    render(<App />);

    expect(screen.getByText("İletişim")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("İlk adımı at...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SİNYALİ GÖNDER" })).toBeEnabled();
    expect(screen.queryByText("İletim")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Talebini yaz — seni doğru ekibe yönlendirelim")).not.toBeInTheDocument();
  });

  it("expands the mobile communication field upward toward the station cards", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;
    const messageField = screen.getByPlaceholderText("İlk adımı at...");

    expect(messageField.tagName).toBe("TEXTAREA");
    expect(styles).toContain(".st-transmit{margin-top:64px}");
    expect(styles).toContain(".st-input{min-height:118px}");
    expect(styles).toContain("resize:none");
  });

  it("positions the tuner below the coming-soon copy", () => {
    const { container } = render(<App />);

    expect(container.querySelector(".st-root > style")?.textContent).toContain(
      ".st-tuner{margin-top:clamp(96px,13vh,140px)}",
    );
  });

  it("applies the annotated desktop spacing to the signal heading and station band", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(".st-h1{padding-top:8px}");
    expect(styles).toContain(".st-band{position:relative;padding-top:58px}");
    expect(styles).toContain(".st-kicker{transform:translate(-18px,-32px)");
  });

  it("moves only the waveform lower while allowing the needle to extend to a card", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(
      ".st-tuner-head{transform:translateY(-60px)}",
    );
    expect(styles).toContain(".st-wave{transform:translateY(28px)}");
    expect(styles).toContain(
      "top:-124px;bottom:var(--st-desktop-needle-bottom);",
    );
    expect(styles).toContain(
      "transition:bottom 1.05s cubic-bezier(.45,0,.2,1)",
    );
  });

  it("uses the signal-led introduction in Geist", () => {
    const { container } = render(<App />);
    const introduction = container.querySelector(".st-sub");

    expect(introduction).toHaveTextContent(
      "Her marka bir sinyal taşır biz onu yayına çeviririz. Yeni yüzümüz son ayarlarında. Frekansını seç, talebini bırak, doğru masaya düşsün.",
    );
    expect(introduction).toHaveStyle({ fontFamily: 'Geist, sans-serif' });
  });

  it("breaks the signal introduction before doğru masaya düşsün", () => {
    const { container } = render(<App />);
    const introduction = container.querySelector(".st-sub");

    expect(introduction?.querySelector("br")).toBeInTheDocument();
    expect(introduction?.innerHTML).toContain("talebini bırak,<br> doğru masaya düşsün.");
  });

  it("uses Neue Machina for the headline and Geist Mono for signal controls", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;
    const globalStyles = readFileSync("src/index.css", "utf8");

    expect(container.querySelector(".st-h1 em")).not.toBeInTheDocument();
    expect(globalStyles).toContain("font-family: 'PP Neue Machina'");
    expect(globalStyles).toContain("PPNeueMachina-PlainUltrabold.otf");
    const neueMachina = readFileSync("public/fonts/PPNeueMachina-PlainUltrabold.otf", "base64");
    expect(neueMachina).toHaveLength(163336);
    expect(neueMachina).toMatch(/^T1RUTwAMAIAAAwBAQ0ZGIADhWOcAABdsAACookdERUY\+pD\+v/);
    expect(styles).toContain("--st-display:'PP Neue Machina',sans-serif");
    expect(styles).toContain(".st-h1{font-family:var(--st-display);font-size:clamp(48px,8.5vw,118px);line-height:1.05;");
    expect(styles).toContain("letter-spacing:-.02em");
    expect(styles).toContain("--st-mono:'Geist Mono',monospace");
    expect(styles).toContain("text-transform:uppercase");
    expect(styles).toContain("letter-spacing:.12em");
    expect(screen.getByRole("button", { name: "SİNYALİ GÖNDER" })).toBeEnabled();
  });

  it("connects the active station card to the tuner rail", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;
    const needle = container.querySelector(".st-needle");

    expect(styles).toContain(
      "--st-radius:6px",
    );
    expect(styles).toContain(
      ".st-stations{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:100px}",
    );
    expect(styles).toContain(
      "top:-124px;bottom:var(--st-desktop-needle-bottom)",
    );
    expect(styles).toContain("--st-rail-offset:80px");
    expect(styles).toContain(".st-rail::before{content:'';position:absolute;inset:0 0 auto;height:1px;background:var(--st-line);transform:translateY(var(--st-rail-offset))}");
    expect(styles).toContain(".st-ticks,.st-ticks-fine{position:absolute;inset:0;background-repeat:no-repeat;transform:translateY(var(--st-rail-offset))}");
    expect(styles).toContain("border-radius:var(--st-radius)");
    expect(styles).not.toContain(".st-tag{display:flex;align-items:center;padding:14px 18px;border-radius:");
    expect(styles).toContain("--st-rail-offset:0px");
    expect(styles).toContain(".st-stations{grid-template-columns:repeat(2,1fr);margin-top:36px}");
    expect(styles).toContain(".st-station.is-active::before{opacity:1;transform:scale(1)}");
    expect(styles).toContain("@media (max-width:760px){\n  .st-root{--st-rail-offset:0px}");
    expect(needle).toHaveStyle({ left: "12.5%" });
  });

  it("rests the needle on the rail until a station is selected", () => {
    const { container } = render(<App />);
    const band = container.querySelector(".st-band") as HTMLElement;
    const needle = container.querySelector(".st-needle");
    const software = screen.getByRole("button", { name: /Yazılım/i });

    expect(screen.getAllByRole("button", { pressed: false })).toEqual(
      expect.arrayContaining([
        software,
        screen.getByRole("button", { name: /Prodüksiyon/i }),
        screen.getByRole("button", { name: /Büyüme/i }),
        screen.getByRole("button", { name: /Diğer/i }),
      ]),
    );
    expect(screen.getByText("Frekansını seç")).toBeInTheDocument();
    expect(needle).toHaveAttribute("data-extension", "resting");
    expect(band.style.getPropertyValue("--st-desktop-needle-bottom")).toBe(
      "calc(34px - var(--st-rail-offset))",
    );
    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("34px");

    fireEvent.click(software);

    expect(software).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Bağlı — 88.1 · Yazılım")).toBeInTheDocument();
    expect(needle).toHaveAttribute("data-extension", "connected");
    expect(band.style.getPropertyValue("--st-desktop-needle-bottom")).toBe("-100px");
    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("-36px");
  });

  it("aligns the mobile tuner column with both rows of the two-column station grid", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;
    const band = container.querySelector(".st-band") as HTMLElement;

    expect(styles).toContain(
      ".st-needle{left:var(--st-mobile-column)!important;bottom:var(--st-mobile-needle-bottom);",
    );
    expect(styles).toContain("grid-auto-rows:125px");
    expect(band.style.getPropertyValue("--st-mobile-column")).toBe("calc(25% - 2.5px)");
    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("34px");

    fireEvent.click(screen.getByRole("button", { name: /Büyüme/i }));

    expect(band.style.getPropertyValue("--st-mobile-column")).toBe("calc(25% - 2.5px)");
    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("-36px");

    fireEvent.click(screen.getByRole("button", { name: /Diğer/i }));

    expect(band.style.getPropertyValue("--st-mobile-column")).toBe("calc(75% + 2.5px)");
    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("-36px");
  });

  it("routes mobile bottom-row connections behind the top-row cards", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;
    const band = container.querySelector(".st-band") as HTMLElement;
    const bridge = container.querySelector(".st-needle-bridge");

    expect(styles).toContain(".st-needle-bridge{display:none}");
    expect(styles).toContain(
      ".st-needle-bridge{display:block;position:absolute;top:195px;height:10px;",
    );
    expect(bridge).toHaveAttribute("data-visible", "false");

    fireEvent.click(screen.getByRole("button", { name: /Büyüme/i }));

    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("-36px");
    expect(band.style.getPropertyValue("--st-mobile-column")).toBe("calc(25% - 2.5px)");
    expect(bridge).toHaveAttribute("data-visible", "true");

    fireEvent.click(screen.getByRole("button", { name: /Diğer/i }));

    expect(band.style.getPropertyValue("--st-mobile-needle-bottom")).toBe("-36px");
    expect(band.style.getPropertyValue("--st-mobile-column")).toBe("calc(75% + 2.5px)");
    expect(bridge).toHaveAttribute("data-visible", "true");
    expect(band.style.getPropertyValue("--st-desktop-needle-bottom")).toBe("-100px");

    fireEvent.click(screen.getByRole("button", { name: /Prodüksiyon/i }));

    expect(bridge).toHaveAttribute("data-visible", "false");
  });

  it("moves the mobile signal indicator inward from the clipped left edge", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(".st-kicker{transform:translate(0,-32px)}");
  });

  it("glides the mobile tuner needle between stations instead of snapping", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(
      "transition:left 1.05s cubic-bezier(.45,0,.2,1),bottom 1.05s cubic-bezier(.45,0,.2,1)",
    );
    expect(styles).toContain("will-change:left,bottom");
  });

  it("renders an uncropped, non-autoplay hero video with the background wordmark", () => {
    const { container } = render(<App />);
    const heroVideo = container.querySelector('[data-testid="hero-video"]');

    expect(heroVideo).not.toHaveClass("mix-blend-screen");
    expect(heroVideo).toHaveAttribute("preload", "auto");
    expect(heroVideo).toHaveClass("object-contain");
    expect(heroVideo).toHaveClass("hero-model-video");
    expect(heroVideo).toHaveClass("lg:left-[72%]");
    expect(heroVideo).not.toHaveAttribute("autoplay");
    expect(heroVideo).not.toHaveAttribute("loop");
    expect(container.querySelector('[data-testid="hero-wordmark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="hero-atmosphere"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="hero-aura"]')).not.toBeInTheDocument();
    expect(container.querySelector('[style*="background-size: 24px 24px"]')).not.toBeInTheDocument();
  });

  it("uses a compact hero composition below the 16:9 desktop reference", () => {
    const { container } = render(<App />);
    const styles = readFileSync("src/index.css", "utf8");

    expect(container.querySelector('[data-testid="hero-copy"]')).toBeInTheDocument();
    expect(styles).toContain("@media (min-width: 768px) and (max-width: 1279px)");
    expect(styles).toContain(".hero-model-video { height: 78%; }");
    expect(styles).toContain("@media (max-width: 767px)");
    expect(styles).toContain(".hero-model-video { height: 60%; max-width: 94vw; }");
    expect(styles).toContain("@media (min-width: 768px) and (max-aspect-ratio: 4/5)");
    expect(styles).toContain(".hero-copy-layout { flex-direction: column; align-items: stretch; gap: 1.5rem; }");
  });

  it("keeps the mobile hero copy compact and clear of the character", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(
      ".hero-copy { justify-content: flex-start; padding-top: 1.5rem; padding-bottom: 0; translate: 0 clamp(8px, 1.5vh, 16px); }",
    );
    expect(styles).toContain(".hero-copy-layout > div { gap: 0.75rem; }");
    expect(styles).toContain(
      ".hero-primary-heading { max-width: 15rem; white-space: normal; font-size: clamp(38px, 10.8vw, 46px); line-height: .88; }",
    );
    expect(styles).toContain(
      ".hero-description { max-width: 18.5rem; font-size: clamp(11px, 3vw, 12px); line-height: 1.55; }",
    );
  });

  it("softens the model's lower edge into the hero background", () => {
    const { container } = render(<App />);
    const fade = container.querySelector('[data-testid="hero-model-fade"]');

    expect(fade).toBeInTheDocument();
    expect(fade).toHaveClass("hero-model-fade");
    expect(fade).toHaveClass("hero-model-fade--subtle");
    expect(fade).toHaveClass("z-20");
  });

  it("keeps the lower-edge blur below bright character highlights", () => {
    const styles = readFileSync("src/index.css", "utf8");
    const fadeRule = styles.match(/\.hero-model-fade--subtle\s*\{([^}]*)\}/s)?.[1];
    const blurRule = styles.match(
      /\.hero-model-fade--subtle::after\s*\{([^}]*)\}/s,
    )?.[1];

    expect(fadeRule).toBeDefined();
    expect(fadeRule).not.toContain("backdrop-filter");
    expect(fadeRule).toContain("height: clamp(120px, 18vh, 210px)");
    expect(blurRule).toContain("inset: 52% 0 -18px");
    expect(blurRule).toContain("backdrop-filter: blur(3px)");
    expect(blurRule).toContain("mask-image: linear-gradient");
  });

  it("veils the moving Clavis Futuri band behind the foreground", () => {
    const { container } = render(<App />);
    const veil = container.querySelector('[data-testid="hero-wordmark-veil"]');

    expect(veil).toBeInTheDocument();
    expect(veil).toHaveClass("hero-wordmark-veil");
    expect(veil).toHaveClass("z-[15]");
  });

  it("pauses the vortex render loop while its section is off-screen", () => {
    const shader = readFileSync("src/components/VortexShader.tsx", "utf8");

    expect(shader).toContain("let isVisible = false;");
    expect(shader).toContain("isVisible = entry.isIntersecting;");
    expect(shader).toContain(
      "if (isVisible) animationFrame = window.requestAnimationFrame(render);",
    );
  });

  it("pauses the tuner waveform loop while its section is off-screen", () => {
    const tuner = readFileSync("src/components/SignalTuner.tsx", "utf8");

    expect(tuner).toContain("let isVisible = false;");
    expect(tuner).toContain("isVisible = entry.isIntersecting;");
    expect(tuner).toContain(
      "if (isVisible) raf = requestAnimationFrame(loop);",
    );
  });

  it("uses the supplied globe image for every Clavis Futuri separator", () => {
    const { container } = render(<App />);
    const orbs = container.querySelectorAll('[data-testid="clavis-futuri-orb"]');

    expect(orbs).toHaveLength(8);
    for (const orb of orbs) {
      expect(orb).toHaveAttribute("src", "/media/decorations/marbled-orb.png");
      expect(orb).toHaveAttribute("alt", "");
      expect(orb).toHaveClass("h-[.28em]", "w-[.28em]");
    }
    expect(container.querySelector('[data-testid="hero-wordmark"]')).not.toHaveTextContent("•");
  });

  it("rolls the Clavis Futuri globes left at the band's linear speed", () => {
    expect(clavisOrbRotationDuration(5200, 100, 52)).toBeCloseTo(Math.PI);

    const { container } = render(<App />);
    const globe = container.querySelector('[data-testid="clavis-futuri-orb"]');

    expect(globe).toHaveClass("clavis-futuri-orb--rolling-left");

    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toContain("animation: clavis-orb-roll-left var(--clavis-orb-rotation-duration) linear infinite;");
    expect(styles).toContain("to { transform: rotate(-1turn); }");
  });

  it("keeps the Clavis Futuri globes brighter than the veiled wordmark", () => {
    const { container } = render(<App />);
    const wordmark = container.querySelector('[data-testid="hero-wordmark"]');
    const globe = container.querySelector('[data-testid="clavis-futuri-orb"]');
    const word = container.querySelector(".clavis-futuri-label");

    expect(wordmark).not.toHaveClass("opacity-[.075]");
    expect(wordmark).toHaveClass("z-[16]");
    expect(word).toHaveClass("opacity-[.075]");
    expect(globe).toHaveClass("opacity-[.68]", "brightness-125");
  });

  it("removes the animated star field from the page and stylesheet", () => {
    const { container } = render(<App />);
    const styles = readFileSync("src/index.css", "utf8");

    expect(container.querySelector('[data-testid="hero-galaxy"]')).not.toBeInTheDocument();
    expect(styles).not.toContain(".galaxy-field");
    expect(styles).not.toContain(".page-galaxy");
    expect(styles).not.toContain("galaxy-drift");
  });

  it("keeps the static purple and blue ambient light across the page", () => {
    const { container } = render(<App />);
    const styles = readFileSync("src/index.css", "utf8");
    const ambient = container.querySelector('[data-testid="page-ambient"]');

    expect(ambient).toHaveClass("page-ambient", "fixed", "inset-0");
    expect(ambient).not.toHaveClass("animate-galaxy-drift");
    expect(styles).toContain(".page-ambient {");
    expect(styles).toContain("rgba(75, 41, 104, .30)");
    expect(styles).toContain("rgba(31, 58, 113, .24)");
    expect(styles).not.toContain(".page-ambient::before");
    expect(styles).not.toContain(".page-ambient::after");
  });

  it("positions the scroll indicator slightly lower in the hero", () => {
    render(<App />);

    expect(screen.getByText("Scroll").parentElement).toHaveClass("bottom-5");
  });

  it("adds red and violet rim lights behind the hero model", () => {
    const { container } = render(<App />);
    const lights = container.querySelector('[data-testid="hero-rim-lights"]');

    expect(lights).toBeInTheDocument();
    expect(lights).toHaveClass("hero-rim-lights");
    expect(lights).toHaveClass("hero-rim-lights--cinematic");
    expect(lights).toHaveClass("z-[5]");
  });

  it("keeps the red and violet rim lights as a restrained background detail", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain("rgba(243, 69, 83, .10)");
    expect(styles).toContain("rgba(183, 85, 255, .10)");
    expect(styles).not.toMatch(/rgba\(243, 69, 83, \.(?:[2-9]|1[1-9])\)/);
    expect(styles).not.toMatch(/rgba\(183, 85, 255, \.(?:[2-9]|1[1-9])\)/);
  });

  it("removes the unused shuriken asset from the project", () => {
    const { container } = render(<App />);

    expect(container.querySelector('[data-testid="hero-shuriken"]')).not.toBeInTheDocument();
    expect(existsSync("public/shuriken-cutout.png")).toBe(false);
  });

  it("keeps section transitions across the complete page", () => {
    const { container } = render(<App />);

    expect(
      container.querySelectorAll('[data-testid="section-transition"]'),
    ).toHaveLength(5);
  });

  it("marks the coming-soon section as the panel that rises over the mobile hero", () => {
    const { container } = render(<App />);

    expect(
      container.querySelector('[data-testid="cinematic-panel"]'),
    ).toHaveClass("cinematic-panel");
  });

  it("places every post-hero section in the sitewide scroll stack", () => {
    render(<App />);
    const track = screen.getByTestId("cinematic-scroll-track");
    const cinematic = screen.getByTestId("cinematic-panel");
    const logo = screen.getByTestId("logo-section");

    expect(track).toHaveClass("site-panel-track");
    expect(track).toContainElement(cinematic);
    expect(cinematic).toHaveClass("site-stack-panel");
    expect(logo).toHaveClass("site-stack-panel", "logo-panel");
  });
});

describe("hero scroll scrubbing", () => {
  it("keeps the desktop wordmark until the 330 panel approaches", () => {
    expect(desktopWordmarkExitProgress(900, 800)).toBe(0);
    expect(desktopWordmarkExitProgress(576, 800)).toBe(0);
    expect(desktopWordmarkExitProgress(400, 800)).toBeGreaterThan(0);
    expect(desktopWordmarkExitProgress(160, 800)).toBe(1);
    expect(desktopWordmarkExitProgress(-100, 800)).toBe(1);
  });

  it("moves desktop navigation away before the incoming panel reaches it", () => {
    expect(desktopHeroChromeProgress(0, 800)).toBe(0);
    expect(desktopHeroChromeProgress(144, 800)).toBe(0);
    expect(desktopHeroChromeProgress(400, 800)).toBeGreaterThan(0);
    expect(desktopHeroChromeProgress(544, 800)).toBe(1);
    expect(desktopHeroChromeProgress(900, 800)).toBe(1);
    expect(desktopHeroChromeProgress(-100, 800)).toBe(0);
  });

  it("maps the first mobile viewport into ordered reversible hero phases", () => {
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

    const beforeCopy = mobileHeroSceneProgress(320, 800);
    expect(beforeCopy.navExit).toBeGreaterThan(0);
    expect(beforeCopy.copyReveal).toBe(0);
  });

  it("starts the mobile hero with brand, contacts, character, objects, band, and scroll cue while copy waits", () => {
    render(<App />);

    const shell = screen.getByTestId("site-shell");
    expect(shell.style.getPropertyValue("--mobile-nav-exit")).toBe("0");
    expect(shell.style.getPropertyValue("--mobile-copy-reveal")).toBe("0");
    expect(screen.getByTestId("nav-wordmark")).toBeInTheDocument();
    expect(screen.getByTestId("nav-tagline")).toBeInTheDocument();
    expect(screen.getByTestId("hero-contact-actions")).toBeInTheDocument();
    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
    expect(screen.getByTestId("hero-object-1")).toBeInTheDocument();
    expect(screen.getByTestId("hero-object-2")).toBeInTheDocument();
    expect(screen.getByTestId("hero-cube-object")).toBeInTheDocument();
    expect(screen.getByTestId("hero-wordmark")).toBeInTheDocument();
    expect(screen.getByTestId("hero-copy")).toHaveClass("hero-copy");
    expect(screen.getByTestId("hero-scroll-indicator")).toHaveClass("flex");
    expect(screen.getByTestId("hero-scroll-indicator")).not.toHaveClass("hidden");
  });

  it("drives the mobile brand exit and copy reveal forward and backward from native scroll", () => {
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(<App />);
    const shell = screen.getByTestId("site-shell");
    const track = screen.getByTestId("hero-scroll-track");
    const fallback = screen.getByTestId("hero-model-fallback");
    expect(fallback).toHaveAttribute(
      "src",
      "/media/hero/frames/hero-model-001.webp",
    );
    let trackTop = 0;
    vi.spyOn(track, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: trackTop,
          height: 2880,
          left: 0,
          width: 390,
          right: 390,
          bottom: trackTop + 2880,
        }) as DOMRect,
    );

    trackTop = -320;
    fireEvent.scroll(window);
    expect(Number(shell.style.getPropertyValue("--mobile-nav-exit"))).toBeGreaterThan(0);
    expect(shell.style.getPropertyValue("--mobile-copy-reveal")).toBe("0");
    expect(fallback).toHaveAttribute(
      "src",
      "/media/hero/frames/hero-model-016.webp",
    );

    trackTop = -800;
    fireEvent.scroll(window);
    expect(shell.style.getPropertyValue("--mobile-nav-exit")).toBe("1");
    expect(shell.style.getPropertyValue("--mobile-copy-reveal")).toBe("1");
    expect(fallback).toHaveAttribute(
      "src",
      "/media/hero/frames/hero-model-039.webp",
    );

    trackTop = 0;
    fireEvent.scroll(window);
    expect(shell.style.getPropertyValue("--mobile-nav-exit")).toBe("0");
    expect(shell.style.getPropertyValue("--mobile-copy-reveal")).toBe("0");
    expect(fallback).toHaveAttribute(
      "src",
      "/media/hero/frames/hero-model-001.webp",
    );
  });

  it("drives the same navigation exit and copy reveal choreography on tablets", () => {
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 820);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches:
          query === "(max-width: 1023px), (hover: none), (pointer: coarse)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(<App />);
    const shell = screen.getByTestId("site-shell");
    const track = screen.getByTestId("hero-scroll-track");
    let trackTop = 0;
    vi.spyOn(track, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: trackTop,
          height: 2080,
          left: 0,
          width: 820,
          right: 820,
          bottom: trackTop + 2080,
        }) as DOMRect,
    );

    trackTop = -320;
    fireEvent.scroll(window);
    expect(Number(shell.style.getPropertyValue("--mobile-nav-exit"))).toBeGreaterThan(0);
    expect(shell.style.getPropertyValue("--mobile-copy-reveal")).toBe("0");

    trackTop = -800;
    fireEvent.scroll(window);
    expect(shell.style.getPropertyValue("--mobile-nav-exit")).toBe("1");
    expect(shell.style.getPropertyValue("--mobile-copy-reveal")).toBe("1");
  });

  it("moves the mobile contact actions out with the two brand marks", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toMatch(
      /\.nav-brand,\s*\.nav-contact\s*\{[^}]*transform:\s*translate3d\(0, var\(--mobile-nav-shift\), 0\);[^}]*opacity:\s*var\(--mobile-nav-opacity\);/s,
    );
  });

  it("gives the left wordmark its own late desktop exit while the right group leaves early", () => {
    const styles = readFileSync("src/index.css", "utf8");
    render(<App />);

    expect(styles).toMatch(
      /\.nav-brand--secondary,\s*\.nav-contact\s*\{[^}]*transform:\s*translate3d\(0, var\(--desktop-chrome-shift\), 0\);[^}]*opacity:\s*var\(--desktop-chrome-opacity\);/s,
    );
    expect(styles).toMatch(
      /\.nav-brand--persistent\s*\{[^}]*transform:\s*translate3d\(0, var\(--desktop-wordmark-shift\), 0\);[^}]*opacity:\s*var\(--desktop-wordmark-opacity\);/s,
    );
    expect(
      screen.getByTestId("nav-wordmark-text").parentElement,
    ).toHaveClass("nav-brand--persistent");
    expect(screen.getByTestId("nav-tagline")).toHaveClass(
      "nav-brand--secondary",
    );
  });

  it("updates desktop navigation motion variables from native scroll", () => {
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches:
          query ===
          "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(<App />);
    const shell = screen.getByTestId("site-shell");
    const track = screen.getByTestId("hero-scroll-track");
    const logoPanel = screen.getByTestId("logo-section");
    let trackTop = 0;
    let logoPanelTop = 1800;
    vi.spyOn(track, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: trackTop,
          height: 1600,
          left: 0,
          width: 1280,
          right: 1280,
          bottom: trackTop + 1600,
        }) as DOMRect,
    );
    vi.spyOn(logoPanel, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: logoPanelTop,
          height: 900,
          left: 0,
          width: 1280,
          right: 1280,
          bottom: logoPanelTop + 900,
        }) as DOMRect,
    );

    trackTop = -400;
    fireEvent.scroll(window);
    expect(
      Number(shell.style.getPropertyValue("--desktop-chrome-exit")),
    ).toBeGreaterThan(0);
    expect(
      Number.parseFloat(
        shell.style.getPropertyValue("--desktop-chrome-shift"),
      ),
    ).toBeLessThan(0);
    expect(
      Number(shell.style.getPropertyValue("--desktop-chrome-opacity")),
    ).toBeLessThan(1);
    expect(shell.style.getPropertyValue("--desktop-wordmark-exit")).toBe("0");
    expect(shell.style.getPropertyValue("--desktop-wordmark-shift")).toBe("0px");
    expect(shell.style.getPropertyValue("--desktop-wordmark-opacity")).toBe("1");

    logoPanelTop = 400;
    fireEvent.scroll(window);
    expect(
      Number(shell.style.getPropertyValue("--desktop-wordmark-exit")),
    ).toBeGreaterThan(0);
    expect(
      Number.parseFloat(
        shell.style.getPropertyValue("--desktop-wordmark-shift"),
      ),
    ).toBeLessThan(0);

    logoPanelTop = 160;
    fireEvent.scroll(window);
    expect(shell.style.getPropertyValue("--desktop-wordmark-exit")).toBe("1");
    expect(shell.style.getPropertyValue("--desktop-wordmark-opacity")).toBe("0");

    trackTop = 0;
    logoPanelTop = 1800;
    fireEvent.scroll(window);
    expect(shell.style.getPropertyValue("--desktop-chrome-exit")).toBe("0");
    expect(shell.style.getPropertyValue("--desktop-chrome-shift")).toBe("0px");
    expect(shell.style.getPropertyValue("--desktop-chrome-opacity")).toBe("1");
    expect(shell.style.getPropertyValue("--desktop-wordmark-exit")).toBe("0");
    expect(shell.style.getPropertyValue("--desktop-wordmark-shift")).toBe("0px");
    expect(shell.style.getPropertyValue("--desktop-wordmark-opacity")).toBe("1");
  });

  it("renders a higher-contrast scroll cue without an arrow tip", () => {
    render(<App />);
    const styles = readFileSync("src/index.css", "utf8");

    expect(screen.getByText("Scroll")).toHaveClass("scroll-cue-label");
    expect(styles).toContain(".scroll-cue-label");
    expect(styles).toMatch(/\.scroll-line\s*\{[^}]*width:\s*2px;[^}]*height:\s*52px;/s);
    expect(styles).not.toMatch(/\.scroll-line::before\s*\{/s);
  });

  it("uses the mobile scene variables only for navigation, copy, and scroll-cue transitions", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(
      ".hero-copy { opacity: var(--mobile-copy-reveal); transform: translate3d(0, var(--mobile-copy-shift), 0);",
    );
    expect(styles).toContain(
      ".hero-scroll-indicator { opacity: var(--mobile-indicator-opacity);",
    );
    expect(styles).not.toMatch(/\.hero-(?:model-video|object|wordmark)\s*\{[^}]*--mobile-(?:nav|copy)/s);
  });

  it("keeps the contact controls positioned from the viewport while their group exits with navigation", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(
      ".site-content {\n  opacity: 1;\n  transform: none;",
    );
    expect(screen.queryByTestId("hero-contact-actions")).not.toBeInTheDocument();

    render(<App />);
    expect(screen.getByTestId("hero-contact-actions")).toHaveClass("fixed");
  });

  it("keeps a tall stack panel's bottom edge pinned after its content scrolls", () => {
    expect(stackPanelStickyTop(1479, 1080)).toBe(-399);
    expect(stackPanelStickyTop(900, 1080)).toBe(0);
    expect(stackPanelStickyTop(1080, 1080)).toBe(0);
  });

  it("writes the measured 1920 desktop sticky offset onto the tracked panel", () => {
    vi.stubGlobal("innerHeight", 1080);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const height =
          this.getAttribute("data-testid") === "cinematic-panel" ? 1479 : 0;
        return {
          x: 0,
          y: 0,
          top: 0,
          right: 1920,
          bottom: height,
          left: 0,
          width: 1920,
          height,
          toJSON: () => ({}),
        } as DOMRect;
      },
    );

    render(<App />);

    expect(
      screen
        .getByTestId("cinematic-panel")
        .style.getPropertyValue("--site-stack-sticky-top"),
    ).toBe("-399px");
  });

  it("excludes the final mobile viewport from the hero video scrub distance", () => {
    expect(heroScrollScrubDistance(3600, 1000, true)).toBe(1600);
    expect(heroScrollScrubDistance(2600, 1000, false)).toBe(1600);
    expect(heroScrollScrubDistance(1000, 1000, false)).toBe(0);
  });

  it("maps scroll progress onto the video timeline and clamps both ends", () => {
    const maxTime = 20 - 1 / 30;
    expect(heroScrollVideoTime(0, 1000, 20)).toBe(0);
    expect(heroScrollVideoTime(-200, 1000, 20)).toBe(0);
    expect(heroScrollVideoTime(1000, 1000, 20)).toBeCloseTo(maxTime);
    expect(heroScrollVideoTime(1500, 1000, 20)).toBeCloseTo(maxTime);
    expect(heroScrollVideoTime(500, 1000, 20)).toBeCloseTo(
      Math.round(0.5 * maxTime * 30) / 30,
    );
    expect(heroScrollVideoTime(500, 0, 20)).toBe(0);
    expect(heroScrollVideoTime(500, 1000, Number.NaN)).toBe(0);
  });

  it("pins the hero on a mobile and tablet scroll track that drives the character video", () => {
    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toContain(
      "@media (max-width: 1023px), (hover: none), (pointer: coarse)",
    );
    expect(styles).toContain(".hero-scroll-track { height: 260dvh; }");
    expect(styles).toContain(
      ".hero-scroll-track .hero-stage { position: sticky; top: 0; }",
    );
    expect(styles).toMatch(
      /@media \(max-width: 1023px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*?\.nav-brand,\s*\.nav-contact\s*\{[^}]*transform:\s*translate3d\(0, var\(--mobile-nav-shift\), 0\);[^}]*opacity:\s*var\(--mobile-nav-opacity\);/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 1023px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*?\.hero-copy\s*\{[^}]*opacity:\s*var\(--mobile-copy-reveal\);[^}]*transform:\s*translate3d\(0, var\(--mobile-copy-shift\), 0\);/,
    );
    // overflow-x: hidden on body would turn it into a scroll container and
    // silently break the sticky pinning; clip does not.
    expect(styles).toContain("overflow-x: clip");
    expect(styles).not.toContain("overflow-x: hidden");
  });

  it("raises the mobile coming-soon panel only after the hero scrub phase", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain("@media (max-width: 767px)");
    expect(styles).toContain(".hero-scroll-track { height: 360dvh; }");
    expect(styles).toContain(
      ".site-panel-track { position: relative; z-index: 40; margin-top: -100dvh;",
    );
    expect(styles).toContain("background-color: #08060d;");
    expect(styles).toContain("border-top: 0;");
    expect(styles).toContain(
      "mask-image: linear-gradient(to bottom, transparent 0, rgba(0, 0, 0, .45) 24px, #000 72px);",
    );
    expect(styles).toContain("border-radius: 28px 28px 0 0;");
  });

  it("keeps the rounded card surface on the coming-soon panel and removes it behind 330", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toMatch(
      /\.cinematic-panel\s*\{[^}]*border-radius:\s*28px 28px 0 0;[^}]*box-shadow:/s,
    );
    expect(styles).toMatch(
      /\.logo-panel\s*\{[^}]*border-radius:\s*0;[^}]*box-shadow:\s*none;/s,
    );
    expect(styles).not.toMatch(
      /\.site-stack-panel\s*\{[^}]*border-radius:/s,
    );
  });

  it("raises the coming-soon panel over the pinned hero on pointer desktop", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(
      "@media (min-width: 1024px) and (hover: hover) and (pointer: fine)",
    );
    expect(styles).toContain(".hero-scroll-track { height: 200dvh; }");
    expect(styles).toContain(
      ".hero-scroll-track .hero-stage { position: sticky; top: 0; }",
    );
    expect(styles).toContain(
      ".site-panel-track { position: relative; z-index: 40; margin-top: -100dvh;",
    );
  });

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

  it("pins the character to the screen bottom with the marquee flowing behind it", () => {
    const styles = readFileSync("src/index.css", "utf8");
    expect(styles).toContain("object-position: center bottom;");
    expect(styles).toContain(
      ".hero-wordmark { top: auto; bottom: 12%; transform: none; }",
    );
    expect(styles).toContain("overscroll-behavior-y: none");

    const { container } = render(<App />);
    expect(
      container.querySelector('[data-testid="hero-wordmark"]'),
    ).toHaveClass("hero-wordmark");
  });

  it("scrubs forward while scrolling down and rewinds while scrolling back up", () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });
    const flushAnimationFrames = () => {
      for (const callback of rafQueue.splice(0)) callback(0);
    };

    const { container } = render(<App />);
    const hero = container.querySelector(
      '[data-testid="hero-video"]',
    ) as HTMLVideoElement;
    const track = container.querySelector(
      '[data-testid="hero-scroll-track"]',
    ) as HTMLDivElement;
    expect(track).toContainElement(
      container.querySelector('[data-testid="hero-stage"]') as HTMLElement,
    );

    Object.defineProperty(hero, "duration", { configurable: true, value: 4 });
    fireEvent.loadedMetadata(hero);

    let trackTop = 0;
    const trackHeight = window.innerHeight + 1000;
    vi.spyOn(track, "getBoundingClientRect").mockImplementation(
      () => ({ top: trackTop, height: trackHeight }) as DOMRect,
    );

    trackTop = -500;
    fireEvent.scroll(window);
    flushAnimationFrames();
    expect(hero.currentTime).toBeCloseTo(heroScrollVideoTime(500, 1000, 4));
    fireEvent.seeked(hero);
    flushAnimationFrames();

    trackTop = -250;
    fireEvent.scroll(window);
    flushAnimationFrames();
    expect(hero.currentTime).toBeCloseTo(heroScrollVideoTime(250, 1000, 4));
  });

  it("keeps the desktop character video pointer-driven while the panel reveal uses scroll", () => {
    const desktopPointerQuery =
      "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === desktopPointerQuery,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });

    const { container } = render(<App />);
    const hero = container.querySelector(
      '[data-testid="hero-video"]',
    ) as HTMLVideoElement;
    const track = container.querySelector(
      '[data-testid="hero-scroll-track"]',
    ) as HTMLDivElement;
    Object.defineProperty(hero, "duration", { configurable: true, value: 4 });
    fireEvent.loadedMetadata(hero);

    vi.spyOn(track, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: -500,
          height: window.innerHeight + 1000,
        }) as DOMRect,
    );
    fireEvent.scroll(window);
    for (const callback of rafQueue.splice(0)) callback(0);

    expect(hero.currentTime).toBeCloseTo(1 / 30);
  });

  it("ignores pointer-driven video scrubbing on tablet and touch input", () => {
    const mediaQuery = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("matchMedia", mediaQuery);
    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });

    const { container } = render(<App />);
    const hero = container.querySelector(
      '[data-testid="hero-video"]',
    ) as HTMLVideoElement;
    const stage = screen.getByTestId("hero-stage");
    stage.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 1000, height: 600 }) as DOMRect;
    Object.defineProperty(hero, "duration", { configurable: true, value: 4 });
    fireEvent.loadedMetadata(hero);

    fireEvent.mouseMove(stage, { clientX: 100, clientY: 300 });
    fireEvent.mouseMove(stage, { clientX: 900, clientY: 300 });
    for (const callback of rafQueue.splice(0)) callback(0);

    expect(mediaQuery).toHaveBeenCalledWith(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
    );
    expect(hero.currentTime).toBeCloseTo(1 / 30);
  });
});

describe("hero video mouse timing", () => {
  it("moves the video timeline forward and backward with horizontal mouse movement", () => {
    expect(heroVideoTime(10, 500, 1000, 20)).toBeCloseTo(20 - 1 / 30);
    expect(heroVideoTime(10, -500, 1000, 20)).toBe(0);
  });

  it("snaps small mouse movements to the nearest 30 FPS frame", () => {
    expect(heroVideoTime(10, 0.5, 1000, 20)).toBe(10);
  });

  it("ignores time changes below one 30 FPS frame", () => {
    expect(shouldSeekHeroVideo(10, 10 + 1 / 60)).toBe(false);
    expect(shouldSeekHeroVideo(10, 10 + 1 / 30)).toBe(true);
  });
});

it("formats the live status clock with leading zeroes", () => {
  expect(formatClock(new Date(2026, 0, 1, 3, 4, 5))).toBe("03:04:05");
});

it("uses the original local WebM for the hero scene", () => {
  const { container } = render(<App />);
  expect(
    container
      .querySelector('[data-testid="hero-video"] source')
      ?.getAttribute("src"),
  ).toBe("/media/hero/hero-model.webm");
});

it("keeps an independent hero fallback behind video on mobile WebKit", () => {
  const { container } = render(<App />);
  const fallback = container.querySelector(
    '[data-testid="hero-model-fallback"]',
  );
  const video = container.querySelector('[data-testid="hero-video"]');
  expect(
    fallback?.getAttribute("src"),
  ).toBe("/media/hero/frames/hero-model-001.webp");
  expect(fallback).toHaveClass("hero-model-fallback");
  expect(video).not.toHaveAttribute("poster");
  expect(video).toHaveClass("hero-model-source");
  expect(readFileSync("src/index.css", "utf8")).toMatch(
    /@media \(max-width: 1023px\), \(hover: none\), \(pointer: coarse\) \{[\s\S]*?\.hero-model-source\s*\{[^}]*display:\s*none;/,
  );
  expect(
    existsSync("public/media/hero/frames/hero-model-061.webp"),
  ).toBe(true);
});

it("seeks into the first decodable hero frame so mobile Safari paints the model", () => {
  const { container } = render(<App />);
  const hero = container.querySelector(
    '[data-testid="hero-video"]',
  ) as HTMLVideoElement;
  Object.defineProperty(hero, "duration", { configurable: true, value: 10 });
  hero.currentTime = 1;
  fireEvent.loadedMetadata(hero);
  expect(hero.currentTime).toBeCloseTo(1 / 30);
});
