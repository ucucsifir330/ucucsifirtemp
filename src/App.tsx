import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import VortexShader from "./components/VortexShader";
import CustomCursor from "./components/CustomCursor";
import { HERO_FLOATING_VISUALS, MEDIA } from "./config/media";
import CinematicSection from "./sections/CinematicSection";
import HeroSection from "./sections/HeroSection";
import LogoSection from "./sections/LogoSection";

const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";
const random = () => chars[Math.floor(Math.random() * chars.length)];
const heroVideoFps = 30;
const heroFrameDuration = 1 / heroVideoFps;
type HeroPointer = {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  active: boolean;
};

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

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="size-10" viewBox="0 0 640 640">
      <path fill="rgb(255, 255, 255)" d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="size-9" viewBox="0 0 640 640">
      <path fill="rgb(255, 255, 255)" d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z" />
    </svg>
  );
}

function Nav({ visible }: { visible: boolean }) {
  const [wordmarkHovered, setWordmarkHovered] = useState(false);
  const [taglineHovered, setTaglineHovered] = useState(false);
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 z-50 grid h-32 w-full grid-cols-12 items-center gap-x-4 px-4 sm:px-6 md:px-8"
    >
      <div
        data-testid="nav-wordmark"
        aria-label="Üç Üç Sıfır"
        onMouseEnter={() => setWordmarkHovered(true)}
        onMouseLeave={() => setWordmarkHovered(false)}
        className="col-span-6 flex items-center"
      >
          <span className="font-galgo relative inline-block text-[64px] leading-none sm:text-[84px]">
            <span data-testid="nav-wordmark-text">
              <ScrambleText text="Üç Üç Sıfır" isHovered={wordmarkHovered} />
            </span>
            <sup
              data-testid="nav-copyright"
              className="absolute font-sans text-[13px] font-medium leading-none sm:text-[18px]"
              style={{ right: "-12px", top: "2px" }}
            >
              ©
            </sup>
        </span>
      </div>
      <div
        data-testid="nav-tagline"
        aria-label="#notlikeothers"
        onMouseEnter={() => setTaglineHovered(true)}
        onMouseLeave={() => setTaglineHovered(false)}
        className="font-galgo col-span-6 justify-self-end cursor-default text-[64px] leading-none sm:text-[84px]"
      >
        <ScrambleText text="#notlikeothers" isHovered={taglineHovered} />
      </div>
      <div
        data-testid="hero-contact-actions"
        className="fixed right-4 top-28 z-50 flex flex-col items-end gap-3 sm:right-6 sm:top-32 md:right-8"
      >
        <button
          type="button"
          aria-label="WhatsApp ile iletişime geç"
          className="liquid-glass-button grid size-[96px] place-items-center rounded-[24px] text-white"
        >
          <WhatsAppIcon />
        </button>
        <button
          type="button"
          aria-label="E-posta ile iletişime geç"
          className="liquid-glass-button grid size-[96px] place-items-center rounded-[24px] text-white"
        >
          <MailIcon />
        </button>
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
      className="galaxy-field galaxy-field--visible page-galaxy pointer-events-none fixed inset-0 z-10 overflow-hidden animate-galaxy-drift"
    />
  );
}

function HeroVisuals({ pointer }: { pointer: HeroPointer }) {
  return (
    <div
      data-testid="hero-visuals"
      aria-hidden="true"
      className="hero-visuals pointer-events-none absolute inset-0 z-[25]"
    >
      {HERO_FLOATING_VISUALS.map((src, index) => (
        <FloatingHeroObject
          key={src}
          src={src}
          index={index + 1}
          pointer={pointer}
          anchor={index === 0 ? [0.94, 0.7] : [0.9, 0.82]}
        />
      ))}
    </div>
  );
}

function FloatingHeroObject({
  src,
  index,
  objectTestId = `hero-object-${index}`,
  objectClassName = `hero-object--${index}`,
  imageClassName = `hero-visual--${index}`,
  imageTestId,
  pointer,
  anchor,
}: {
  src: string;
  index: number;
  objectTestId?: string;
  objectClassName?: string;
  imageClassName?: string;
  imageTestId?: string;
  pointer: HeroPointer;
  anchor?: [number, number];
}) {
  const reduceMotion = useReducedMotion();
  const object = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [anchorX, anchorY] = anchor ?? [0.92, 0.72];
  const deltaX = pointer.x - anchorX;
  const deltaY = pointer.y - anchorY;
  const distance = Math.hypot(deltaX, deltaY);
  const proximity = pointer.active ? Math.max(0, 1 - distance / 0.7) : 0;
  const reactive = proximity > 0.08;
  const objectBounds = object.current?.getBoundingClientRect();
  const glowing =
    pointer.active &&
    !!objectBounds &&
    pointer.clientX >= objectBounds.left &&
    pointer.clientX <= objectBounds.right &&
    pointer.clientY >= objectBounds.top &&
    pointer.clientY <= objectBounds.bottom;

  const moveObject = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    setOffset({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 18,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 14,
    });
  };

  const resetObject = () => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={object}
      data-testid={objectTestId}
      data-hovered={hovered}
      data-reactive={reactive}
      data-glowing={glowing}
      className={`hero-object ${objectClassName}`}
      animate={reduceMotion ? { y: 0 } : { y: [0, -12, 0] }}
      transition={{
        duration: 4.8 + index * 0.7,
        ease: "easeInOut",
        repeat: Infinity,
      }}
      onMouseEnter={() => !reduceMotion && setHovered(true)}
      onMouseMove={moveObject}
      onMouseLeave={resetObject}
    >
      <motion.div
        className="hero-object__motion"
        animate={{
          x: reduceMotion ? 0 : offset.x + deltaX * proximity * 30,
          y: reduceMotion ? 0 : offset.y + deltaY * proximity * 24,
          scale: 1,
        }}
        transition={{ type: "spring", stiffness: 210, damping: 17, mass: 0.6 }}
      >
        <img
          data-testid={imageTestId}
          src={src}
          alt=""
          className={`hero-visual ${imageClassName}`}
        />
      </motion.div>
    </motion.div>
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
          src={MEDIA.brand.logo}
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
          src={MEDIA.brand.logo}
          alt="Üç Üç Sıfır"
          className="h-auto w-full object-contain opacity-70"
        />
      </motion.div>
    </div>
  );
}

function ClavisFuturiSequence({ hidden = false }: { hidden?: boolean }) {
  return (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="inline-flex shrink-0 items-center">
          <span className="clavis-futuri-label opacity-[.075]">CLAVIS FUTURI</span>
          <img
            data-testid="clavis-futuri-orb"
            src={MEDIA.decorations.marbledOrb}
            alt=""
            className="clavis-futuri-orb mx-[.13em] inline-block h-[.28em] w-[.28em] shrink-0 object-contain opacity-[.68] brightness-125 drop-shadow-[0_0_16px_rgb(178_139_255_/_0.48)]"
          />
        </span>
      ))}
    </span>
  );
}

function App() {
  const [entered, setEntered] = useState(false),
    [loadingPhase, setLoadingPhase] = useState<
      "loading" | "ring-out" | "logo-grow" | "lift" | "complete"
    >("loading"),
    [heroPointer, setHeroPointer] = useState<HeroPointer>({
      x: 0,
      y: 0,
      clientX: 0,
      clientY: 0,
      active: false,
    }),
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
    setHeroPointer({
      x: pointerX / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
      clientX: event.clientX,
      clientY: event.clientY,
      active: true,
    });
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
      <CustomCursor />
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
       <HeroSection>
       <section
        data-testid="hero-stage"
        onMouseMove={moveHero}
        onMouseLeave={() => {
          lastHeroPointerX.current = null;
          setHeroPointer((pointer) => ({ ...pointer, active: false }));
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
        <FloatingHeroObject
          objectTestId="hero-cube-object"
          objectClassName="hero-object--cube z-[15]"
          imageClassName="hero-cube z-[15]"
          imageTestId="hero-background-visual"
          src={MEDIA.hero.floatingCube}
          index={3}
          pointer={heroPointer}
          anchor={[0.84, 0.69]}
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
            className="hero-model-video pointer-events-none absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 object-contain object-center lg:left-[72%]"
          >
            <source src={MEDIA.hero.modelVideo} type='video/webm; codecs="vp9"' />
          </video>
        </div>
        <div
          data-testid="hero-model-fade"
          aria-hidden="true"
          className="hero-model-fade hero-model-fade--subtle pointer-events-none absolute inset-x-0 bottom-0 z-20"
        />
        <HeroVisuals pointer={heroPointer} />
        <SectionTransition edge="bottom" />
        <div data-testid="hero-wordmark" className="pointer-events-none absolute inset-x-0 top-1/2 z-[16] -translate-y-1/2 overflow-hidden">
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
            <ClavisFuturiSequence />
            <ClavisFuturiSequence hidden />
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
              <h1
                className="hero-primary-heading whitespace-nowrap text-[clamp(48px,10vw,160px)] font-light leading-[.92] tracking-[-.03em]"
                style={{
                  fontFamily: '"PP Neue Machina", sans-serif',
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                <ScrambleIn text="Ritim ile Akış" delay={200} triggered={entered} />
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 25 }}
                transition={{
                  duration: 0.9,
                  ease: [0.215, 0.61, 0.355, 1],
                  delay: 0.2,
                }}
              className="hero-description max-w-md border-l border-[#A48FFF]/30 pl-5 text-[13px] leading-[1.75] text-[#fdfcfc] sm:text-[16px] lg:max-w-[60rem]"
                style={{ fontFamily: '"Inter Variable", Arial, sans-serif' }}
              >
                Sıradan görünmeyi reddeden markalar için premium dijital
                deneyimler üretiyoruz. Yeni yüzümüzü inşa ederken ihtiyacın
                olan hizmet alanını seç, detayları paylaş hedefine en uygun
                ekiple seni doğrudan buluşturalım.
              </motion.p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-3 xl:flex"
        >
          <span className="text-[9px] uppercase tracking-[.34em] text-white/35">
            Scroll
          </span>
          <span className="scroll-line" />
        </motion.div>
       </section>
       </HeroSection>
       <CinematicSection />
       <LogoSection>
       <section
        data-testid="logo-section"
        className="relative flex min-h-screen items-start overflow-hidden px-5 pb-32 pt-8 sm:px-8 sm:pb-40 sm:pt-10"
      >
        <VortexShader
          src={MEDIA.backgrounds.vortexTexture}
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
          </motion.div>
        </div>
        <div
          data-testid="logo-status-bar"
          className="absolute inset-x-0 bottom-3 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-t border-[#A48FFF]/30 px-5 pt-4 text-[9px] uppercase tracking-[.24em] text-[#A48FFF]/70 sm:px-8 sm:text-[10px]"
          style={{ fontFamily: "Geist, sans-serif" }}
        >
          <span className="justify-self-start">© 2026 TÜM HAKLARI SAKLIDIR</span>
          <span data-testid="logo-frequency" className="justify-self-center">88.1 — 107.9 MHZ</span>
          <span className="justify-self-end">{clock}</span>
        </div>
       </section>
       </LogoSection>
      </div>
    </main>
  );
}

export default App;
