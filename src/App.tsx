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

export const heroScrollVideoTime = (
  scrolled: number,
  scrollable: number,
  duration: number,
) => {
  if (scrollable <= 0 || !Number.isFinite(duration) || duration <= 0) return 0;
  const progress = Math.min(1, Math.max(0, scrolled / scrollable));
  const maxTime = Math.max(0, duration - heroFrameDuration);
  const targetFrame = Math.round(progress * maxTime * heroVideoFps);
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
    <svg
      aria-hidden="true"
      className="contact-icon--wa size-6 sm:size-10"
      viewBox="0 0 24 24"
      fill="#ffffff"
    >
      <path
        d="M21.98 11.4104C21.64 5.61044 16.37 1.14045 10.3 2.14045C6.12004 2.83045 2.77005 6.22043 2.12005 10.4004C1.74005 12.8204 2.24007 15.1104 3.33007 17.0004L2.44006 20.3104C2.24006 21.0604 2.93004 21.7404 3.67004 21.5304L6.93005 20.6304C8.41005 21.5004 10.14 22.0004 11.99 22.0004C17.63 22.0004 22.31 17.0304 21.98 11.4104ZM16.8801 15.7204C16.7901 15.9004 16.68 16.0704 16.54 16.2304C16.29 16.5004 16.02 16.7004 15.72 16.8204C15.42 16.9504 15.09 17.0104 14.74 17.0104C14.23 17.0104 13.68 16.8905 13.11 16.6405C12.53 16.3905 11.9601 16.0604 11.3901 15.6504C10.8101 15.2304 10.2701 14.7604 9.75005 14.2504C9.23005 13.7304 8.77003 13.1804 8.35003 12.6104C7.94003 12.0404 7.61005 11.4704 7.37005 10.9004C7.13005 10.3304 7.01006 9.78045 7.01006 9.26045C7.01006 8.92044 7.07006 8.59044 7.19006 8.29044C7.31006 7.98044 7.50007 7.70045 7.77007 7.45045C8.09007 7.13045 8.44005 6.98045 8.81005 6.98045C8.95005 6.98045 9.09002 7.01044 9.22002 7.07044C9.35002 7.13044 9.47005 7.22044 9.56005 7.35044L10.72 8.99043C10.81 9.12043 10.88 9.23043 10.92 9.34043C10.97 9.45043 10.99 9.55043 10.99 9.65043C10.99 9.77043 10.9501 9.89045 10.8801 10.0104C10.8101 10.1304 10.72 10.2504 10.6 10.3704L10.22 10.7704C10.16 10.8304 10.1401 10.8904 10.1401 10.9704C10.1401 11.0104 10.15 11.0504 10.16 11.0904C10.18 11.1304 10.1901 11.1604 10.2001 11.1904C10.2901 11.3604 10.45 11.5704 10.67 11.8304C10.9 12.0904 11.1401 12.3604 11.4001 12.6204C11.6701 12.8904 11.9301 13.1304 12.2001 13.3604C12.4601 13.5804 12.68 13.7304 12.85 13.8204C12.88 13.8304 12.9101 13.8504 12.9401 13.8604C12.9801 13.8804 13.0201 13.8804 13.0701 13.8804C13.1601 13.8804 13.2201 13.8504 13.2801 13.7904L13.66 13.4104C13.79 13.2804 13.9101 13.1904 14.0201 13.1304C14.1401 13.0604 14.2501 13.0204 14.3801 13.0204C14.4801 13.0204 14.5801 13.0404 14.6901 13.0904C14.8001 13.1404 14.92 13.2004 15.04 13.2904L16.7001 14.4704C16.8301 14.5604 16.92 14.6704 16.98 14.7904C17.03 14.9204 17.0601 15.0404 17.0601 15.1804C17.0001 15.3504 16.9601 15.5404 16.8801 15.7204Z"
        fill="white"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      className="contact-icon--mail size-6 sm:size-9"
      viewBox="0 0 24 24"
      fill="#ffffff"
    >
      <g clipPath="url(#mail-icon-clip)">
        <path
          d="M21.54 13.51C21.7261 13.3937 21.99 13.5191 21.99 13.7386V19.02C21.99 20.67 20.65 22 18.99 22H5C3.34 22 2 20.67 2 19.02V13.7432C2 13.5249 2.27189 13.3993 2.46 13.51L9.95 17.97C10.58 18.34 11.29 18.53 12 18.53C12.71 18.53 13.42 18.34 14.05 17.97L21.54 13.51Z"
          fill="white"
        />
        <path
          d="M22.0002 10.96C22.0002 10.96 22.0002 11.05 21.9902 11.09L22.0002 10.96Z"
          fill="white"
        />
        <path
          d="M20.87 8.21L13.87 2.65C12.77 1.78 11.23 1.78 10.13 2.65L3.13 8.21C2.41 8.78 2 9.63 2 10.53V10.96C2 11.65 2.37 12.3 2.97 12.65L10.46 17.11C11.41 17.67 12.59 17.67 13.54 17.11L21.03 12.65C21.59 12.32 21.95 11.73 21.99 11.09V10.53C21.99 9.63 21.58 8.78 20.87 8.21ZM14.97 10.85C15.33 11.06 15.45 11.52 15.24 11.87C15.1 12.11 14.85 12.25 14.59 12.25C14.46 12.25 14.33 12.22 14.22 12.15L12.75 11.3V13C12.75 13.41 12.41 13.75 12 13.75C11.59 13.75 11.25 13.41 11.25 13V11.3L9.78 12.15C9.66 12.22 9.53 12.25 9.41 12.25C9.15 12.25 8.9 12.12 8.76 11.87C8.55 11.51 8.68 11.05 9.03 10.85L10.5 10L9.03 9.15C8.67 8.94 8.55 8.48 8.76 8.13C8.97 7.77 9.42 7.65 9.78 7.86L11.25 8.71V7.01C11.25 6.6 11.59 6.26 12 6.26C12.41 6.26 12.75 6.6 12.75 7.01V8.71L14.22 7.86C14.58 7.65 15.04 7.78 15.24 8.13C15.45 8.49 15.32 8.95 14.97 9.15L13.5 10L14.97 10.85Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="mail-icon-clip">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
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
      className="site-nav fixed top-0 z-50 grid h-24 w-full grid-cols-12 items-center gap-x-4 px-4 sm:h-32 sm:px-6 md:px-8"
    >
      <div
        data-testid="nav-wordmark"
        aria-label="Üç Üç Sıfır"
        onMouseEnter={() => setWordmarkHovered(true)}
        onMouseLeave={() => setWordmarkHovered(false)}
        className="col-span-6 flex items-center"
      >
          <span className="font-galgo nav-brand relative inline-block text-[42px] leading-none sm:text-[84px]">
            <span data-testid="nav-wordmark-text">
              <ScrambleText text="Üç Üç Sıfır" isHovered={wordmarkHovered} />
            </span>
            <sup
              data-testid="nav-copyright"
              className="nav-sup absolute font-sans text-[10px] font-medium leading-none sm:text-[18px]"
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
        className="font-galgo nav-brand col-span-6 justify-self-end cursor-default text-[42px] leading-none sm:text-[84px]"
      >
        <ScrambleText text="#notlikeothers" isHovered={taglineHovered} />
      </div>
      <div
        data-testid="hero-contact-actions"
        className="nav-contact fixed right-4 top-24 z-50 flex flex-col items-end gap-2 sm:right-6 sm:top-32 sm:gap-3 md:right-8"
      >
        <button
          type="button"
          aria-label="WhatsApp ile iletişime geç"
          className="contact-icon-button grid size-[56px] place-items-center text-white sm:size-[96px]"
        >
          <WhatsAppIcon />
        </button>
        <button
          type="button"
          aria-label="E-posta ile iletişime geç"
          className="contact-icon-button grid size-[56px] place-items-center text-white sm:size-[96px]"
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

function PageAmbient() {
  return (
    <div
      data-testid="page-ambient"
      aria-hidden="true"
      className="page-ambient pointer-events-none fixed inset-0 z-10"
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
      <div className="model-anchor__box">
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
    heroTrack = useRef<HTMLDivElement>(null),
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
    const scrubHeroFromScroll = () => {
      const track = heroTrack.current;
      const currentVideo = video.current;
      if (!track || !currentVideo || !heroMetadataReady.current) return;
      const bounds = track.getBoundingClientRect();
      const scrollable = bounds.height - window.innerHeight;
      // Desktop: the track collapses to the hero height, so there is
      // nothing to scrub and the pointer keeps driving the video.
      if (scrollable <= 0) return;
      heroTargetTime.current = heroScrollVideoTime(
        -bounds.top,
        scrollable,
        currentVideo.duration,
      );
      scheduleHeroSeek();
    };
    window.addEventListener("scroll", scrubHeroFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", scrubHeroFromScroll);
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
    // The cached metadata may have loaded before this effect subscribed.
    if (currentVideo && currentVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
      showFirstVisibleHeroFrame();
    }
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
      <PageAmbient />
      <Nav visible={entered} />
       <HeroSection>
       <div
        ref={heroTrack}
        data-testid="hero-scroll-track"
        className="hero-scroll-track relative"
       >
       <section
        data-testid="hero-stage"
        onMouseMove={moveHero}
        onMouseLeave={() => {
          lastHeroPointerX.current = null;
          setHeroPointer((pointer) => ({ ...pointer, active: false }));
        }}
        className="hero-stage relative flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#07040E]/70 px-5 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-24 lg:px-12 lg:pb-16 xl:px-16"
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
        >
          <div className="model-anchor__box">
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
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <video
            data-testid="hero-video"
            ref={video}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            className="hero-model-video pointer-events-none absolute bottom-0 left-1/2 w-auto max-w-none object-contain object-center lg:left-[72%]"
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
        <div data-testid="hero-wordmark" className="hero-wordmark pointer-events-none absolute inset-x-0 top-1/2 z-[16] -translate-y-1/2 overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 52,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="hero-marquee flex w-max whitespace-nowrap text-[clamp(120px,30vw,521px)] tracking-[-4px]"
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
       </div>
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
        <div className="logo-showcase relative z-20 mx-auto w-full max-w-6xl text-center">
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
          className="absolute inset-x-0 bottom-3 z-20 grid grid-cols-[1fr_auto] items-center gap-x-4 border-t border-[#A48FFF]/30 px-5 py-4 text-[9px] uppercase tracking-[.24em] text-[#F0EDFA]/80 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-0 sm:px-8 sm:pb-0 sm:text-[10px]"
          style={{ fontFamily: "Geist, sans-serif" }}
        >
          <span className="col-start-1 row-start-1 justify-self-start whitespace-nowrap">© 2026 TÜM HAKLARI SAKLIDIR</span>
          <span data-testid="logo-frequency" className="hidden justify-self-center whitespace-nowrap sm:col-start-2 sm:block">88.1 — 107.9 MHZ</span>
          <span className="col-start-2 row-start-1 justify-self-end whitespace-nowrap sm:col-start-3">{clock}</span>
        </div>
       </section>
       </LogoSection>
      </div>
    </main>
  );
}

export default App;
