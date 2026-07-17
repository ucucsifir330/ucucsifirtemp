import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, {
  heroVideoTime,
  formatClock,
  shouldSeekHeroVideo,
} from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

describe("SynapseX landing page", () => {
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
      "/uc-uc-sifir-logo.png",
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
    expect(container.querySelector(".site-content")).toHaveClass(
      "site-content--revealing",
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
      "text-[24px]",
      "sm:text-[32px]",
    );
    expect(screen.getByTestId("nav-copyright")).toHaveStyle({ top: "0.05em" });
    expect(screen.queryByLabelText("Toggle navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Metrics" })).not.toBeInTheDocument();
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

    expect(screen.getByText("Yayın")).toBeInTheDocument();
    expect(screen.getByText("çok yakında.")).toBeInTheDocument();
    expect(screen.getByText("Frekans ayarla")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Marka|Dijital|Kampanya|Diğer/ })).toHaveLength(4);
    expect(screen.getByTestId("signal-background")).toHaveAttribute(
      "src",
      "/cosmic-background.png",
    );
    expect(screen.getByTestId("signal-background")).toHaveClass("opacity-45");
    expect(screen.getByTestId("vortex-shader")).toHaveAttribute(
      "data-src",
      "/metrics-background.png",
    );
    expect(screen.getByTestId("vortex-shader")).toHaveClass("z-0", "opacity-45");
    expect(screen.getByRole("button", { name: /Sinyali gönder/i })).toBeEnabled();
    expect(screen.queryByText(/Nereden başlayalım/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Adaptive\s*Intelligence/)).not.toBeInTheDocument();
    expect(screen.queryByText("Three layers. Zero friction.")).not.toBeInTheDocument();
    expect(screen.queryByText(/2026 SynapseX Labs/)).not.toBeInTheDocument();
  });

  it("replaces the performance metrics with the 330 logo", () => {
    render(<App />);

    expect(screen.getByTestId("metrics-logo")).toHaveAttribute(
      "src",
      "/uc-uc-sifir-logo.png",
    );
    expect(screen.getByTestId("metrics-logo")).toHaveAttribute(
      "alt",
      "Üç Üç Sıfır",
    );
    expect(screen.getByTestId("metrics-logo")).toHaveClass("object-contain");
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

    expect(screen.getByTestId("logo-section")).toHaveClass(
      "items-start",
      "overflow-hidden",
    );
    expect(screen.getByTestId("metrics-logo").closest(".mt-0")).toBeInTheDocument();
    expect(screen.getByTestId("vortex-shader")).toHaveAttribute(
      "data-focal-point",
      "0.5,0.84",
    );
  });

  it("adds a frequency status bar beneath the 330 logo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 21, 7, 52));
    render(<App />);

    const statusBar = screen.getByTestId("logo-status-bar");
    expect(statusBar).toHaveClass("border-t", "w-screen");
    expect(statusBar).toHaveTextContent("© 2026 TÜM HAKLARI SAKLIDIR");
    expect(statusBar).toHaveTextContent("88.1 — 107.9 MHZ");
    expect(statusBar).toHaveTextContent("21:07:52");
  });

  it("pins the frequency to the true center of the status bar and keeps the logo glow subtle", () => {
    render(<App />);
    const statusBar = screen.getByTestId("logo-status-bar");
    const styles = readFileSync("src/index.css", "utf8");

    expect(statusBar).toHaveClass("grid", "grid-cols-[1fr_auto_1fr]");
    expect(screen.getByTestId("logo-frequency")).toHaveClass("justify-self-center");
    expect(styles).toContain("opacity: .14;");
    expect(styles).toContain("opacity: .42;");
  });

  it("replaces the neural-link label with the three-line Not Like Others heading", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(2000));

    expect(screen.queryByText("Neural Link Active — EST. 330")).not.toBeInTheDocument();
    expect(screen.getByText("Not")).toBeInTheDocument();
    expect(screen.queryByText("#Not")).not.toBeInTheDocument();
    expect(screen.getByText("Like")).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
  });

  it("reveals Not Like Others on entry and scrambles it on hover", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<App />);

    const tagline = screen.getByTestId("not-like-others");
    act(() => vi.advanceTimersByTime(800));
    expect(tagline).not.toHaveTextContent("NotLikeOthers");

    act(() => vi.advanceTimersByTime(1800));
    expect(tagline).toHaveTextContent("NotLikeOthers");

    fireEvent.mouseEnter(tagline);
    act(() => vi.advanceTimersByTime(25));
    expect(tagline).not.toHaveTextContent("NotLikeOthers");

    fireEvent.mouseLeave(tagline);
    expect(tagline).toHaveTextContent("NotLikeOthers");
  });

  it("uses the new Ritim İle Akış hero copy", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole("heading", { name: /Ritim\s+İle Akış/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sıradan görünmeyi reddeden markalar için premium dijital deneyimler üretiyoruz. Yeni yüzümüzü inşa ederken ihtiyacın olan hizmet alanını seç, detayları paylaş hedefine en uygun ekiple seni doğrudan buluşturalım.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Brain")).not.toBeInTheDocument();
  });

  it("raises only the Ritim line to open the hero title spacing", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(3000));

    const heroTitle = screen.getByRole("heading", { name: /Ritim\s+İle Akış/i });
    expect(heroTitle.querySelector(":scope > span")).toHaveClass("-translate-y-[0.16em]");
  });

  it("uses the requested hero typography scale and description treatment", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(3000));

    const heroTitle = screen.getByRole("heading", { name: /Ritim\s+İle Akış/i });
    expect(heroTitle).toHaveClass("text-[clamp(48px,10vw,104px)]");
    expect(heroTitle.querySelector(":scope > span")).toHaveClass(
      "text-[clamp(57px,11.9vw,132px)]",
    );
    const description = screen.getByText(/Sıradan görünmeyi reddeden markalar/i);
    expect(description).toHaveClass("text-[#fdfcfc]", "sm:text-[16px]");
    expect(description).toHaveStyle({ fontFamily: '"Inter Variable", Arial, sans-serif' });
  });

  it("updates the frequency readout when a station is selected", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Dijital/i }));

    expect(screen.getByText("Bağlı — 94.5 · Dijital")).toBeInTheDocument();
  });

  it("raises the tuner closer to the coming-soon copy", () => {
    const { container } = render(<App />);

    expect(container.querySelector(".st-root > style")?.textContent).toContain(
      ".st-tuner{margin-top:clamp(64px,9vh,96px)}",
    );
  });

  it("lifts the tuner readout and waveform while ending the needle at the rail", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(
      ".st-tuner-head,.st-wave{transform:translateY(-34px)}",
    );
    expect(styles).toContain(".st-needle{position:absolute;top:-98px;bottom:34px;");
  });

  it("uses the new signal-led introduction", () => {
    render(<App />);

    expect(
      screen.getByText(
        "Her marka bir sinyal taşır biz onu yayına çeviririz. Yeni yüzümüz son ayarlarında. Frekansını seç, talebini bırak, doğru masaya düşsün.",
      ),
    ).toBeInTheDocument();
  });

  it("anchors the stations to the two rail ends and their equal inner points", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(".st-station:nth-child(1){left:0}");
    expect(styles).toContain(
      ".st-station:nth-child(2){left:33.333%;transform:translateX(-50%)}",
    );
    expect(styles).toContain(
      ".st-station:nth-child(3){left:66.667%;transform:translateX(-50%)}",
    );
    expect(styles).toContain(".st-station:nth-child(4){right:0;text-align:right}");
  });

  it("renders an uncropped, non-autoplay hero video with the background wordmark", () => {
    const { container } = render(<App />);
    const heroVideo = container.querySelector('[data-testid="hero-video"]');

    expect(heroVideo).not.toHaveClass("mix-blend-screen");
    expect(heroVideo).toHaveAttribute("preload", "auto");
    expect(heroVideo).toHaveClass("object-contain");
    expect(heroVideo).toHaveClass("hero-model-video");
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

  it("softens the model's lower edge into the hero background", () => {
    const { container } = render(<App />);
    const fade = container.querySelector('[data-testid="hero-model-fade"]');

    expect(fade).toBeInTheDocument();
    expect(fade).toHaveClass("hero-model-fade");
    expect(fade).toHaveClass("hero-model-fade--subtle");
    expect(fade).toHaveClass("z-20");
  });

  it("veils the moving Clavis Futuri band behind the foreground", () => {
    const { container } = render(<App />);
    const veil = container.querySelector('[data-testid="hero-wordmark-veil"]');

    expect(veil).toBeInTheDocument();
    expect(veil).toHaveClass("hero-wordmark-veil");
    expect(veil).toHaveClass("z-[15]");
  });

  it("keeps the animated galaxy behind all page content", () => {
    const { container } = render(<App />);
    const styles = readFileSync("src/index.css", "utf8");
    const galaxy = container.querySelector('[data-testid="hero-galaxy"]');
    const wordmark = container.querySelector('[data-testid="hero-wordmark"]');
    const model = container.querySelector('[data-testid="hero-video"]');

    expect(galaxy).toBeInTheDocument();
    expect(galaxy).toHaveClass("z-10");
    expect(galaxy).toHaveClass("fixed");
    expect(galaxy).toHaveClass("page-galaxy");
    expect(galaxy).toHaveClass("animate-galaxy-drift");
    expect(styles).toContain(
      ".page-galaxy {\n  background:\n    radial-gradient",
    );
    expect(styles).toContain("animation: galaxy-drift-near");
    expect(styles).toContain("translate3d(");
    expect(wordmark).toHaveClass("z-10");
    expect(model?.parentElement).toHaveClass("z-20");
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

  it("extends the star field across the complete page", () => {
    const { container } = render(<App />);

    expect(container.querySelector('[data-testid="hero-galaxy"]')).toHaveClass("fixed");
    expect(
      container.querySelectorAll('[data-testid="section-transition"]'),
    ).toHaveLength(5);
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
  ).toBe("/ucucmano.webm");
});

it("starts the supplied hero video on its first frame", () => {
  const { container } = render(<App />);
  const hero = container.querySelector(
    '[data-testid="hero-video"]',
  ) as HTMLVideoElement;
  Object.defineProperty(hero, "duration", { configurable: true, value: 10 });
  hero.currentTime = 1;
  fireEvent.loadedMetadata(hero);
  expect(hero.currentTime).toBe(0);
});
