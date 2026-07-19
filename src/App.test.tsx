import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, {
  heroVideoTime,
  formatClock,
  shouldSeekHeroVideo,
} from "./App";
import CustomCursor from "./components/CustomCursor";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
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
      "text-[64px]",
      "sm:text-[84px]",
    );
    expect(screen.getByTestId("nav-tagline")).toHaveTextContent("#notlikeothers");
    expect(screen.getByTestId("nav-tagline")).toHaveClass(
      "text-[64px]",
      "sm:text-[84px]",
    );
    expect(screen.getByTestId("nav-copyright")).toHaveStyle({ top: "2px" });
    expect(screen.queryByLabelText("Toggle navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Metrics" })).not.toBeInTheDocument();
  });

  it("places WhatsApp and email contact actions beneath #notlikeothers", () => {
    render(<App />);

    const contactActions = screen.getByTestId("hero-contact-actions");
    expect(contactActions).toHaveClass("fixed", "right-4", "top-28", "z-50");
    const whatsapp = screen.getByRole("button", { name: "WhatsApp ile iletişime geç" });
    expect(whatsapp).toBeInTheDocument();
    expect(whatsapp).toHaveClass("size-[96px]", "rounded-[24px]");
    expect(whatsapp).toHaveClass("liquid-glass-button");
    expect(whatsapp.querySelector("svg path")).toHaveAttribute("fill", "rgb(255, 255, 255)");
    const email = screen.getByRole("button", { name: "E-posta ile iletişime geç" });
    expect(email).not.toHaveTextContent("E-POSTA");
    expect(email).toHaveClass("size-[96px]", "rounded-[24px]");
    expect(email).toHaveClass("liquid-glass-button");
    expect(email.querySelector("svg path")).toHaveAttribute("fill", "rgb(255, 255, 255)");
  });

  it("keeps contact actions optically glassy while leaving the hero visible through them", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(".liquid-glass-button {");
    expect(styles).toContain("rgb(8 7 16 / .06)");
    expect(styles).toContain("border: 1px solid rgb(255 255 255 / .42)");
    expect(styles).toContain("backdrop-filter: blur(10px) saturate(130%)");
    expect(styles).toContain(".liquid-glass-button::before");
    expect(styles).toContain(".liquid-glass-button::after");
    expect(styles).toContain(".liquid-glass-button > svg");
    expect(styles).toContain("conic-gradient");
    expect(styles).toContain("@media (prefers-reduced-transparency: reduce)");
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
    expect(screen.getByRole("button", { name: /Sinyali gönder/i })).toBeEnabled();
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
    expect(styles).toContain(".hero-cube {\n  top: 61%;\n  right: 9%;");
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

    expect(styles).toContain(".hero-visual--2 {\n  top: 74%;\n  right: 3%;");
  });

  it("rotates the first hero visual 260 degrees", () => {
    const styles = readFileSync("src/index.css", "utf8");

    expect(styles).toContain(".hero-visual--1 {\n  top: 62%;\n  right: 0%;\n  width: clamp(104px, 13vw, 250px);\n  transform: rotate(260deg);");
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

  it("moves only the waveform lower while extending the needle to the card", () => {
    const { container } = render(<App />);
    const styles = container.querySelector(".st-root > style")?.textContent;

    expect(styles).toContain(
      ".st-tuner-head{transform:translateY(-60px)}",
    );
    expect(styles).toContain(".st-wave{transform:translateY(28px)}");
    expect(styles).toContain("top:-124px;bottom:-100px;");
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
    expect(screen.getByRole("button", { name: /Sinyali gönder ->/i })).toBeEnabled();
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
    expect(styles).toContain("top:-124px;bottom:-100px");
    expect(styles).toContain("--st-rail-offset:80px");
    expect(styles).toContain(".st-rail::before{content:'';position:absolute;inset:0 0 auto;height:1px;background:var(--st-line);transform:translateY(var(--st-rail-offset))}");
    expect(styles).toContain(".st-ticks,.st-ticks-fine{position:absolute;inset:0;background-repeat:no-repeat;transform:translateY(var(--st-rail-offset))}");
    expect(styles).toContain("border-radius:var(--st-radius)");
    expect(styles).not.toContain(".st-tag{display:flex;align-items:center;padding:14px 18px;border-radius:");
    expect(styles).toContain(".st-needle{bottom:34px}");
    expect(styles).toContain(".st-stations{grid-template-columns:repeat(2,1fr);margin-top:36px}");
    expect(styles).toContain(".st-station.is-active::before{opacity:1;transform:scale(1)}");
    expect(styles).toContain("@media (max-width:760px){\n  .st-needle{bottom:34px}");
    expect(needle).toHaveStyle({ left: "12.5%" });
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
    expect(wordmark).toHaveClass("z-[16]");
    expect(model?.parentElement).toHaveClass("z-20");
  });

  it("positions the scroll indicator slightly lower in the hero", () => {
    render(<App />);

    expect(screen.getByText("Scroll").parentElement).toHaveClass("bottom-5");
  });

  it("keeps the star field visibly layered over the page backdrop", () => {
    const { container } = render(<App />);
    const styles = readFileSync("src/index.css", "utf8");

    expect(container.querySelector('[data-testid="hero-galaxy"]')).toHaveClass(
      "galaxy-field--visible",
    );
    expect(styles).toContain(".galaxy-field--visible::before");
    expect(styles).toContain(".galaxy-field--visible::after");
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
  ).toBe("/media/hero/hero-model.webm");
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
