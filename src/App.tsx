import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SignalTuner from "./components/SignalTuner";
import VortexShader from "./components/VortexShader";

const videos = {
  hero: "/ucucmano.webm",
};
const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";
const random = () => chars[Math.floor(Math.random() * chars.length)];
const heroVideoFps = 30;
const heroFrameDuration = 1 / heroVideoFps;

export const formatClock = (date: Date) =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");

export const heroVideoTime = (
  currentTime: number,
  pointerDeltaX: number,
  width: number,
  duration: number,
) => {
  if (width <= 0 || !Number.isFinite(duration) || duration <= 0) return 0;
  const targetTime = currentTime + (pointerDeltaX / width) * duration;
  const maxTime = Math.max(0, duration - heroFrameDuration);
  const targetFrame = Math.round(
    Math.max(0, Math.min(maxTime, targetTime)) * heroVideoFps,
  );
  return Math.min(maxTime, targetFrame * heroFrameDuration);
};

export const shouldSeekHeroVideo = (currentTime: number, targetTime: number) =>
  Math.abs(targetTime - currentTime) >= heroFrameDuration - Number.EPSILON;

function ScrambleIn({
  text,
  delay,
  triggered,
}: {
  text: string;
  delay: number;
  triggered: boolean;
}) {
  const [shown, setShown] = useState("\u00a0");
  useEffect(() => {
    if (!triggered) {
      setShown("\u00a0");
      return;
    }
    let cursor = 0;
    const start = window.setTimeout(() => {
      const timer = window.setInterval(() => {
        cursor += 0.5;
        setShown(
          text
            .split("")
            .map((letter, index) =>
              letter === " "
                ? " "
                : index < cursor
                  ? letter
                  : index < cursor + 3
                    ? random()
                    : "",
            )
            .join(""),
        );
        if (cursor >= text.length + 3) window.clearInterval(timer);
      }, 25);
    }, delay);
    return () => window.clearTimeout(start);
  }, [delay, text, triggered]);
  return <>{shown}</>;
}

function ScrambleText({ text, isHovered }: { text: string; isHovered: boolean }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (!isHovered) {
      setShown(text);
      return;
    }
    let frame = 0;
    const timer = window.setInterval(() => {
      frame++;
      setShown(
        text
          .split("")
          .map((letter, index) =>
            letter === " " ? " " : frame >= index * 4 ? letter : random(),
          )
          .join(""),
      );
      if (frame >= text.length * 4) window.clearInterval(timer);
    }, 25);
    return () => window.clearInterval(timer);
  }, [isHovered, text]);
  return <>{shown}</>;
}

function RevealAndScrambleText({
  text,
  delay,
  triggered,
  isHovered,
}: {
  text: string;
  delay: number;
  triggered: boolean;
  isHovered: boolean;
}) {
  const [shown, setShown] = useState("\u00a0");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!triggered) {
      setShown("\u00a0");
      setRevealed(false);
      return;
    }
    let cursor = 0;
    const start = window.setTimeout(() => {
      const timer = window.setInterval(() => {
        cursor += 0.5;
        const next = text
          .split("")
          .map((letter, index) =>
            index < cursor ? letter : index < cursor + 3 ? random() : "",
          )
          .join("");
        setShown(next);
        if (cursor >= text.length + 3) {
          window.clearInterval(timer);
          setShown(text);
          setRevealed(true);
        }
      }, 25);
    }, delay);
    return () => window.clearTimeout(start);
  }, [delay, text, triggered]);

  useEffect(() => {
    if (!revealed || !isHovered) {
      if (revealed) setShown(text);
      return;
    }
    let frame = 0;
    const timer = window.setInterval(() => {
      frame++;
      setShown(
        text
          .split("")
          .map((letter, index) => (frame >= index * 4 ? letter : random()))
          .join(""),
      );
      if (frame >= text.length * 4) window.clearInterval(timer);
    }, 25);
    return () => window.clearInterval(timer);
  }, [isHovered, revealed, text]);

  return <>{shown}</>;
}

function Nav({ visible }: { visible: boolean }) {
  const [wordmarkHovered, setWordmarkHovered] = useState(false);
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 z-50 flex h-20 w-full items-center justify-between px-4 sm:px-6 md:px-8"
    >
      <div
        data-testid="nav-wordmark"
        aria-label="Üç Üç Sıfır"
        onMouseEnter={() => setWordmarkHovered(true)}
        onMouseLeave={() => setWordmarkHovered(false)}
        className="flex items-center"
      >
          <span className="relative inline-block text-[24px] font-medium tracking-tight sm:text-[32px]">
            <span data-testid="nav-wordmark-text">
              <ScrambleText text="Üç Üç Sıfır" isHovered={wordmarkHovered} />
            </span>
            <sup
              data-testid="nav-copyright"
              className="absolute text-[8px] leading-none sm:text-[10px]"
              style={{ left: "calc(100% - 0.1em)", top: "0.05em" }}
            >
              ©
            </sup>
          </span>
      </div>
    </motion.nav>
  );
}

function SectionTransition({ edge }: { edge: "top" | "bottom" }) {
  const position = edge === "top" ? "top-0" : "bottom-0";
  const gradient =
    edge === "top"
      ? "bg-gradient-to-b from-[#07040E] via-[#07040E]/70 to-transparent"
      : "bg-gradient-to-b from-transparent via-[#07040E]/70 to-[#07040E]";

  return (
    <div
      data-testid="section-transition"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${position} z-10 h-64 ${gradient}`}
    />
  );
}

function GalaxyBackground() {
  return (
    <div
      data-testid="hero-galaxy"
      aria-hidden="true"
      className="galaxy-field page-galaxy pointer-events-none fixed inset-0 z-10 overflow-hidden animate-galaxy-drift"
    />
  );
}

function LoadingScreen({
  phase,
}: {
  phase: "loading" | "ring-out" | "logo-grow" | "lift";
}) {
  const logoGrowing = phase === "logo-grow" || phase === "lift";
  const ringErasing = phase !== "loading";
  return (
    <div
      data-testid="loading-screen"
      data-phase={phase}
      data-transition={phase === "lift" ? "curtain-up" : undefined}
      aria-label="Site yükleniyor"
      role="status"
      className={`loading-screen ${phase === "lift" ? "loading-screen--lift" : ""}`}
    >
      <div className="loading-mark">
        <svg
          data-testid="loading-ring"
          className={`loading-ring ${ringErasing ? "loading-ring--erasing" : ""}`}
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle className="loading-ring__stroke" cx="100" cy="100" r="94" />
        </svg>
        <img
          data-testid="loading-logo"
          className={`loading-logo ${logoGrowing ? "loading-logo--growing" : ""}`}
          src="/uc-uc-sifir-logo.png"
          alt="Üç Üç Sıfır"
        />
      </div>
    </div>
  );
}

function ReactiveLogo() {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
    setOffset({ x: horizontal * 28, y: vertical * 22 });
  };

  const resetLogo = () => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      data-testid="metrics-logo-stage"
      data-hovered={hovered}
      className="metrics-logo-stage"
      onMouseEnter={() => !reduceMotion && setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetLogo}
    >
      <span className="metrics-logo-glow" aria-hidden="true" />
      <motion.div
        className="metrics-logo-motion"
        animate={{
          x: reduceMotion || !hovered ? 0 : offset.x,
          y: reduceMotion || !hovered ? 0 : offset.y,
          scale: reduceMotion || !hovered ? 1 : 1.045,
          rotateX: reduceMotion || !hovered ? 0 : -offset.y / 4,
          rotateY: reduceMotion || !hovered ? 0 : offset.x / 4,
        }}
        transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.7 }}
        style={{ transformPerspective: 900 }}
      >
        <img
          data-testid="metrics-logo"
          src="/uc-uc-sifir-logo.png"
          alt="Üç Üç Sıfır"
          className="h-auto w-full object-contain"
        />
      </motion.div>
    </div>
  );
}

function Cinematic() {
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#08060d]/70 px-5 py-28 sm:px-8 lg:py-36">
      <img
        data-testid="signal-background"
        src="/cosmic-background.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <SectionTransition edge="top" />
      <SectionTransition edge="bottom" />
      <div className="relative z-20 mx-auto w-full max-w-6xl">
        <SignalTuner />
      </div>
    </section>
  );
}

function App() {
  const [entered, setEntered] = useState(false),
    [loadingPhase, setLoadingPhase] = useState<
      "loading" | "ring-out" | "logo-grow" | "lift" | "complete"
    >("loading"),
    [taglineHovered, setTaglineHovered] = useState(false),
    [clock, setClock] = useState(() => formatClock(new Date())),
    video = useRef<HTMLVideoElement>(null),
    heroTargetTime = useRef(0),
    heroRaf = useRef<number | null>(null),
    heroMetadataReady = useRef(false),
    heroSeeking = useRef(false),
    lastHeroPointerX = useRef<number | null>(null);
  const scheduleHeroSeek = () => {
    if (
      heroRaf.current !== null ||
      heroSeeking.current ||
      !heroMetadataReady.current
    ) {
      return;
    }
    heroRaf.current = window.requestAnimationFrame(() => {
      heroRaf.current = null;
      const currentVideo = video.current;
      if (!currentVideo || heroSeeking.current) return;
      if (shouldSeekHeroVideo(currentVideo.currentTime, heroTargetTime.current)) {
        heroSeeking.current = true;
        currentVideo.currentTime = heroTargetTime.current;
      }
    });
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 800);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const ringTimer = window.setTimeout(() => setLoadingPhase("ring-out"), 1650);
    const logoTimer = window.setTimeout(() => setLoadingPhase("logo-grow"), 2000);
    const liftTimer = window.setTimeout(() => setLoadingPhase("lift"), 3000);
    const completeTimer = window.setTimeout(
      () => setLoadingPhase("complete"),
      3800,
    );
    return () => {
      clearTimeout(ringTimer);
      clearTimeout(logoTimer);
      clearTimeout(liftTimer);
      clearTimeout(completeTimer);
    };
  }, []);
  useEffect(() => {
    const showFirstVisibleHeroFrame = () => {
      const currentVideo = video.current;
      if (!currentVideo || !Number.isFinite(currentVideo.duration)) return;
      heroMetadataReady.current = true;
      currentVideo.currentTime = 0;
    };
    const continueHeroSeek = () => {
      heroSeeking.current = false;
      scheduleHeroSeek();
    };
    const currentVideo = video.current;
    currentVideo?.addEventListener("loadedmetadata", showFirstVisibleHeroFrame);
    currentVideo?.addEventListener("seeked", continueHeroSeek);
    return () => {
      currentVideo?.removeEventListener(
        "loadedmetadata",
        showFirstVisibleHeroFrame,
      );
      currentVideo?.removeEventListener("seeked", continueHeroSeek);
      if (heroRaf.current !== null) window.cancelAnimationFrame(heroRaf.current);
    };
  }, []);
  const moveHero = (event: React.MouseEvent<HTMLElement>) => {
    const currentVideo = video.current;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!currentVideo || bounds.width <= 0) return;
    const pointerX = event.clientX - bounds.left;
    if (lastHeroPointerX.current === null) {
      lastHeroPointerX.current = pointerX;
      return;
    }
    heroTargetTime.current = heroVideoTime(
      heroTargetTime.current,
      pointerX - lastHeroPointerX.current,
      bounds.width,
      currentVideo.duration,
    );
    lastHeroPointerX.current = pointerX;
    scheduleHeroSeek();
  };
  return (
    <main className="relative isolate" style={{ fontFamily: '"Space Mono", monospace' }}>
      {loadingPhase !== "complete" && <LoadingScreen phase={loadingPhase} />}
      <div
        className={`site-content ${
          loadingPhase === "loading" ||
          loadingPhase === "ring-out" ||
          loadingPhase === "logo-grow"
            ? "site-content--prepared"
            : loadingPhase === "lift"
              ? "site-content--revealing"
              : ""
        }`}
      >
      <div aria-hidden="true" className="grain-overlay" />
      <GalaxyBackground />
      <Nav visible={entered} />
      <section
        onMouseMove={moveHero}
        onMouseLeave={() => {
          lastHeroPointerX.current = null;
        }}
        className="relative flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#07040E]/70 px-5 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-24 lg:px-12 lg:pb-16 xl:px-16"
      >
        <div
          data-testid="hero-rim-lights"
          aria-hidden="true"
          className="hero-rim-lights hero-rim-lights--cinematic pointer-events-none absolute inset-0 z-[5]"
        />
        <div
          data-testid="hero-wordmark-veil"
          aria-hidden="true"
          className="hero-wordmark-veil pointer-events-none absolute inset-0 z-[15]"
        />
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <video
            data-testid="hero-video"
            ref={video}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            className="hero-model-video pointer-events-none absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 object-contain object-center"
          >
            <source src={videos.hero} type='video/webm; codecs="vp9"' />
          </video>
        </div>
        <div
          data-testid="hero-model-fade"
          aria-hidden="true"
          className="hero-model-fade hero-model-fade--subtle pointer-events-none absolute inset-x-0 bottom-0 z-20"
        />
        <SectionTransition edge="bottom" />
        <div data-testid="hero-wordmark" className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 overflow-hidden opacity-[.075]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 52,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="flex w-max whitespace-nowrap text-[clamp(120px,30vw,521px)] tracking-[-4px]"
            style={{
              fontFamily: "Anton SC",
              color: "#8E7F94",
            }}
          >
            <span className="shrink-0">CLAVIS FUTURI&nbsp;•&nbsp;CLAVIS FUTURI&nbsp;•&nbsp;CLAVIS FUTURI&nbsp;•&nbsp;CLAVIS FUTURI&nbsp;•&nbsp;</span>
            <span aria-hidden="true" className="shrink-0">
              CLAVIS FUTURI&nbsp;•&nbsp;CLAVIS FUTURI&nbsp;•&nbsp;CLAVIS FUTURI&nbsp;•&nbsp;CLAVIS FUTURI&nbsp;•&nbsp;
            </span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1 }}
          data-testid="hero-copy"
          className="hero-copy relative z-30 flex flex-1 flex-col justify-end"
        >
          <div className="hero-copy-layout flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-8">
            <div className="flex flex-col gap-5 sm:gap-6">
              <h1 className="hero-primary-heading text-[clamp(48px,10vw,104px)] font-light leading-[.92] tracking-[-.03em]">
                <span className="inline-block -translate-y-[0.16em] text-[clamp(57px,11.9vw,132px)]">
                  <ScrambleIn text="Ritim" delay={200} triggered={entered} />
                </span>
                <br />
                <ScrambleIn text="İle Akış" delay={500} triggered={entered} />
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 25 }}
                transition={{
                  duration: 0.9,
                  ease: [0.215, 0.61, 0.355, 1],
                  delay: 0.2,
                }}
              className="hero-description max-w-md border-l border-[#A48FFF]/30 pl-5 text-[13px] leading-[1.75] text-[#fdfcfc] sm:text-[16px]"
                style={{ fontFamily: '"Inter Variable", Arial, sans-serif' }}
              >
                Sıradan görünmeyi reddeden markalar için premium dijital
                deneyimler üretiyoruz. Yeni yüzümüzü inşa ederken ihtiyacın
                olan hizmet alanını seç, detayları paylaş hedefine en uygun
                ekiple seni doğrudan buluşturalım.
              </motion.p>
            </div>
            <h1
              data-testid="not-like-others"
              onMouseEnter={() => setTaglineHovered(true)}
              onMouseLeave={() => setTaglineHovered(false)}
              className="hero-secondary-heading text-left text-[clamp(42px,9.5vw,104px)] font-light leading-[.92] tracking-[-.03em] md:text-right"
            >
              <span className="block">
                <RevealAndScrambleText
                  text="Not"
                  delay={700}
                  triggered={entered}
                  isHovered={taglineHovered}
                />
              </span>
              <span className="block">
                <RevealAndScrambleText
                  text="Like"
                  delay={900}
                  triggered={entered}
                  isHovered={taglineHovered}
                />
              </span>
              <span className="block">
                <RevealAndScrambleText
                  text="Others"
                  delay={1100}
                  triggered={entered}
                  isHovered={taglineHovered}
                />
              </span>
            </h1>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-7 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-3 xl:flex"
        >
          <span className="text-[9px] uppercase tracking-[.34em] text-white/35">
            Scroll
          </span>
          <span className="scroll-line" />
        </motion.div>
      </section>
      <Cinematic />
      <section
        data-testid="logo-section"
        className="relative flex min-h-screen items-start overflow-hidden px-5 pb-32 pt-8 sm:px-8 sm:pb-40 sm:pt-10"
      >
        <VortexShader
          src="/metrics-background.png"
          focalPoint={[0.5, 0.84]}
          className="z-0 opacity-45"
        />
        <SectionTransition edge="top" />
        <SectionTransition edge="bottom" />
        <div className="relative z-20 mx-auto w-full max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-0 flex flex-col items-center"
        >
            <div className="h-[clamp(250px,50vw,390px)] w-[min(90vw,560px)] overflow-hidden">
              <div className="-translate-y-[18%]">
                <ReactiveLogo />
              </div>
            </div>
            <div
              data-testid="logo-status-bar"
              className="mt-10 grid w-screen grid-cols-[1fr_auto_1fr] items-center border-t border-[#A48FFF]/30 px-5 pt-4 text-[9px] uppercase tracking-[.24em] text-[#A48FFF]/70 sm:px-8 sm:text-[10px]"
            >
              <span className="justify-self-start">© 2026 TÜM HAKLARI SAKLIDIR</span>
              <span data-testid="logo-frequency" className="justify-self-center">88.1 — 107.9 MHZ</span>
              <span className="justify-self-end">{clock}</span>
            </div>
          </motion.div>
        </div>
      </section>
      </div>
    </main>
  );
}

export default App;
