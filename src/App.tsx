import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
const heroMobileFrameCount = 61;
const clavisBandDuration = 52;
const heroDesktopPointerQuery =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
const heroTouchSceneQuery =
  "(max-width: 1023px), (hover: none), (pointer: coarse)";

const requestMediaPlayback = (media: HTMLMediaElement) => {
  try {
    const playback = media.play();
    if (playback) void playback.catch(() => {});
  } catch {
    // Playback is retried after the next user gesture.
  }
};

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

export const heroScrollScrubDistance = (
  trackHeight: number,
  viewportHeight: number,
  reservesPanelReveal: boolean,
) =>
  Math.max(
    0,
    trackHeight - viewportHeight * (reservesPanelReveal ? 2 : 1),
  );

export const heroScrollFrameIndex = (
  scrolled: number,
  scrollable: number,
  frameCount = heroMobileFrameCount,
) => {
  if (scrollable <= 0 || frameCount <= 1 || !Number.isFinite(scrolled)) return 0;
  const progress = Math.min(1, Math.max(0, scrolled / scrollable));
  return Math.round(progress * (frameCount - 1));
};

export const heroMobileFrameSrc = (frameIndex: number) => {
  const safeFrame = Math.min(
    heroMobileFrameCount - 1,
    Math.max(0, Math.round(frameIndex)),
  );
  return `/media/hero/frames/hero-model-${String(safeFrame + 1).padStart(3, "0")}.webp`;
};

export const stackPanelStickyTop = (
  panelHeight: number,
  viewportHeight: number,
) => Math.min(0, viewportHeight - panelHeight);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

export const mobileHeroSceneProgress = (
  scrolled: number,
  viewportHeight: number,
) => {
  const progress =
    viewportHeight > 0 && Number.isFinite(scrolled)
      ? clamp01(scrolled / viewportHeight)
      : 0;

  return {
    navExit: smoothstep(clamp01(progress / 0.55)),
    copyReveal: smoothstep(clamp01((progress - 0.42) / 0.48)),
    indicatorExit: smoothstep(clamp01(progress / 0.22)),
  };
};

export const desktopHeroChromeProgress = (
  scrolled: number,
  viewportHeight: number,
) => {
  const progress =
    viewportHeight > 0 && Number.isFinite(scrolled)
      ? clamp01(scrolled / viewportHeight)
      : 0;

  return smoothstep(clamp01((progress - 0.18) / 0.5));
};

export const desktopWordmarkExitProgress = (
  panelTop: number,
  viewportHeight: number,
) => {
  if (
    viewportHeight <= 0 ||
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(panelTop)
  ) {
    return 0;
  }

  const start = viewportHeight * 0.72;
  const end = viewportHeight * 0.2;
  return smoothstep(clamp01((start - panelTop) / (start - end)));
};

export const shouldSeekHeroVideo = (currentTime: number, targetTime: number) =>
  Math.abs(targetTime - currentTime) >= heroFrameDuration - Number.EPSILON;

export const clavisOrbRotationDuration = (
  bandDistance: number,
  orbDiameter: number,
  bandDuration = clavisBandDuration,
) => {
  if (
    !Number.isFinite(bandDistance) ||
    !Number.isFinite(orbDiameter) ||
    !Number.isFinite(bandDuration) ||
    bandDistance <= 0 ||
    orbDiameter <= 0 ||
    bandDuration <= 0
  ) {
    return bandDuration;
  }

  return (Math.PI * orbDiameter * bandDuration) / bandDistance;
};

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

function SoundOnIcon() {
  return (
    <svg
      aria-hidden="true"
      className="hero-sound-control__waves"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18 16.7503C17.84 16.7503 17.69 16.7003 17.55 16.6003C17.22 16.3503 17.15 15.8803 17.4 15.5503C18.97 13.4603 18.97 10.5403 17.4 8.45027C17.15 8.12027 17.22 7.65027 17.55 7.40027C17.88 7.15027 18.35 7.22027 18.6 7.55027C20.56 10.1703 20.56 13.8303 18.6 16.4503C18.45 16.6503 18.23 16.7503 18 16.7503Z" />
      <path d="M19.8301 19.2503C19.6701 19.2503 19.5201 19.2003 19.3801 19.1003C19.0501 18.8503 18.9801 18.3803 19.2301 18.0503C21.9001 14.4903 21.9001 9.51027 19.2301 5.95027C18.9801 5.62027 19.0501 5.15027 19.3801 4.90027C19.7101 4.65027 20.1801 4.72027 20.4301 5.05027C23.5001 9.14027 23.5001 14.8603 20.4301 18.9503C20.2901 19.1503 20.0601 19.2503 19.8301 19.2503Z" />
      <path d="M14.02 3.77972C12.9 3.15972 11.47 3.31972 10.01 4.22972L7.09 6.05972C6.89 6.17972 6.66 6.24972 6.43 6.24972H5.5H5C2.58 6.24972 1.25 7.57972 1.25 9.99972V13.9997C1.25 16.4197 2.58 17.7497 5 17.7497H5.5H6.43C6.66 17.7497 6.89 17.8197 7.09 17.9397L10.01 19.7697C10.89 20.3197 11.75 20.5897 12.55 20.5897C13.07 20.5897 13.57 20.4697 14.02 20.2197C15.13 19.5997 15.75 18.3097 15.75 16.5897V7.40972C15.75 5.68972 15.13 4.39972 14.02 3.77972Z" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="hero-sound-control__mute"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22.5299 13.4197L21.0799 11.9697L22.4799 10.5697C22.7699 10.2797 22.7699 9.79969 22.4799 9.50969C22.1899 9.21969 21.7099 9.21969 21.4199 9.50969L20.0199 10.9097L18.5699 9.45969C18.2799 9.16969 17.7999 9.16969 17.5099 9.45969C17.2199 9.74969 17.2199 10.2297 17.5099 10.5197L18.9599 11.9697L17.4699 13.4597C17.1799 13.7497 17.1799 14.2297 17.4699 14.5197C17.6199 14.6697 17.8099 14.7397 17.9999 14.7397C18.1899 14.7397 18.3799 14.6697 18.5299 14.5197L20.0199 13.0297L21.4699 14.4797C21.6199 14.6297 21.8099 14.6997 21.9999 14.6997C22.1899 14.6997 22.3799 14.6297 22.5299 14.4797C22.8199 14.1897 22.8199 13.7197 22.5299 13.4197Z" />
      <path d="M14.02 3.77972C12.9 3.15972 11.47 3.31972 10.01 4.22972L7.09 6.05972C6.89 6.17972 6.66 6.24972 6.43 6.24972H5.5H5C2.58 6.24972 1.25 7.57972 1.25 9.99972V13.9997C1.25 16.4197 2.58 17.7497 5 17.7497H5.5H6.43C6.66 17.7497 6.89 17.8197 7.09 17.9397L10.01 19.7697C10.89 20.3197 11.75 20.5897 12.55 20.5897C13.07 20.5897 13.57 20.4697 14.02 20.2197C15.13 19.5997 15.75 18.3097 15.75 16.5897V7.40972C15.75 5.68972 15.13 4.39972 14.02 3.77972Z" />
    </svg>
  );
}

const audioEntryWords = [
  { label: "SESİ AÇMAK İÇİN", layout: "intro" },
  { label: "HERHANGİ BİR YERE", layout: "prompt" },
  { label: "TIKLA", layout: "action" },
] as const;

function AudioEntryGate({
  ready,
  onEnterWithSound,
  onEnterSilently,
}: {
  ready: boolean;
  onEnterWithSound: () => void;
  onEnterSilently: () => void;
}) {
  return (
    <motion.section
      role="dialog"
      aria-label="Ses tercihi"
      aria-modal={ready}
      aria-hidden={!ready}
      data-ready={ready}
      className="audio-entry-gate"
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
    >
      <button
        type="button"
        aria-label="Sesi açarak siteye gir"
        className="audio-entry-gate__sound"
        disabled={!ready}
        onClick={onEnterWithSound}
      >
        <span className="audio-entry-gate__message" aria-hidden="true">
          {audioEntryWords.map(({ label, layout }) => (
            <span
              key={layout}
              data-layout={layout}
              className="audio-entry-gate__word"
            >
              {label}
            </span>
          ))}
        </span>
      </button>
      <button
        type="button"
        aria-label="Sessiz devam et"
        className="audio-entry-gate__silent"
        disabled={!ready}
        onClick={onEnterSilently}
      >
        SESSİZ DEVAM ET
      </button>
    </motion.section>
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
          <span className="font-galgo nav-brand nav-brand--persistent relative inline-block text-[42px] leading-none sm:text-[84px]">
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
        className="font-galgo nav-brand nav-brand--secondary col-span-6 justify-self-end cursor-default text-[42px] leading-none sm:text-[84px]"
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

function ClavisFuturiSequence({
  hidden = false,
  sequenceRef,
}: {
  hidden?: boolean;
  sequenceRef?: React.Ref<HTMLSpanElement>;
}) {
  return (
    <span
      ref={sequenceRef}
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="inline-flex shrink-0 items-center">
          <span className="clavis-futuri-label opacity-[.075]">CLAVIS FUTURI</span>
          <img
            data-testid="clavis-futuri-orb"
            src={MEDIA.decorations.marbledOrb}
            alt=""
            className="clavis-futuri-orb clavis-futuri-orb--rolling-left mx-[.13em] inline-block h-[.28em] w-[.28em] shrink-0 object-contain opacity-[.68] brightness-125 drop-shadow-[0_0_16px_rgb(178_139_255_/_0.48)]"
          />
        </span>
      ))}
    </span>
  );
}

function App() {
  const usesTouchHeroFrames = window.matchMedia
    ? window.matchMedia(heroTouchSceneQuery).matches
    : window.innerWidth <= 1023;
  const [entered, setEntered] = useState(false),
    [soundEnabled, setSoundEnabled] = useState(false),
    [audioGateOpen, setAudioGateOpen] = useState(true),
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
    siteShell = useRef<HTMLElement>(null),
    soundtrack = useRef<HTMLAudioElement>(null),
    soundEnabledRef = useRef(false),
    video = useRef<HTMLVideoElement>(null),
    heroFallback = useRef<HTMLImageElement>(null),
    heroTrack = useRef<HTMLDivElement>(null),
    logoPanel = useRef<HTMLElement>(null),
    clavisMarquee = useRef<HTMLDivElement>(null),
    clavisSequence = useRef<HTMLSpanElement>(null),
    heroTargetTime = useRef(0),
    heroRaf = useRef<number | null>(null),
    heroMetadataReady = useRef(false),
    heroSeeking = useRef(false),
    lastMobileFrame = useRef(0),
    desiredMobileFrame = useRef(0),
    mobileFrameCache = useRef(new Map<number, HTMLImageElement>()),
    lastHeroPointerX = useRef<number | null>(null);
  const audioGateReady = loadingPhase === "lift" || loadingPhase === "complete";
  const toggleSound = () => {
    const currentSoundtrack = soundtrack.current;
    if (!currentSoundtrack) return;

    if (soundEnabled) {
      soundEnabledRef.current = false;
      currentSoundtrack.pause();
      setSoundEnabled(false);
      return;
    }

    soundEnabledRef.current = true;
    setSoundEnabled(true);
    requestMediaPlayback(currentSoundtrack);
  };
  const enterWithSound = () => {
    soundEnabledRef.current = true;
    setSoundEnabled(true);
    if (soundtrack.current) requestMediaPlayback(soundtrack.current);
    setEntered(true);
    setAudioGateOpen(false);
  };
  const enterSilently = () => {
    soundEnabledRef.current = false;
    soundtrack.current?.pause();
    setSoundEnabled(false);
    setEntered(true);
    setAudioGateOpen(false);
  };
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
  const primeMobileFrameWindow = (
    centerFrame: number,
    direction: 1 | -1,
    commitCenter = true,
  ) => {
    const cache = mobileFrameCache.current;
    const candidates = [
      centerFrame,
      centerFrame + direction,
      centerFrame + direction * 2,
      centerFrame + direction * 3,
      centerFrame + direction * 4,
      centerFrame + direction * 5,
      centerFrame - direction,
      centerFrame - direction * 2,
    ].filter(
      (frameIndex, index, frames) =>
        frameIndex >= 0 &&
        frameIndex < heroMobileFrameCount &&
        frames.indexOf(frameIndex) === index,
    );
    const retainedFrames = new Set(candidates);

    for (const frameIndex of candidates) {
      let frame = cache.get(frameIndex);
      const isNewFrame = !frame;
      if (!frame) {
        frame = new Image();
        frame.decoding = "async";
        cache.set(frameIndex, frame);
      }

      if (commitCenter && frameIndex === centerFrame) {
        frame.onload = () => {
          if (
            desiredMobileFrame.current === frameIndex &&
            heroFallback.current
          ) {
            heroFallback.current.src = heroMobileFrameSrc(frameIndex);
          }
        };
        frame.onerror = () => {
          if (cache.get(frameIndex) === frame) cache.delete(frameIndex);
          if (desiredMobileFrame.current === frameIndex) {
            lastMobileFrame.current = -1;
          }
        };
      }

      if (isNewFrame) frame.src = heroMobileFrameSrc(frameIndex);
      if (
        commitCenter &&
        frameIndex === centerFrame &&
        frame.complete &&
        frame.naturalWidth > 0
      ) {
        frame.onload?.(new Event("load"));
      }
    }

    for (const [frameIndex, frame] of cache) {
      if (retainedFrames.has(frameIndex)) continue;
      frame.onload = null;
      frame.onerror = null;
      frame.src = "";
      cache.delete(frameIndex);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const panels = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".site-panel-track > .site-stack-panel",
      ),
    );
    const syncStickyOffsets = () => {
      for (const panel of panels) {
        const stickyTop = stackPanelStickyTop(
          panel.getBoundingClientRect().height,
          window.innerHeight,
        );
        panel.style.setProperty("--site-stack-sticky-top", `${stickyTop}px`);
      }
    };
    syncStickyOffsets();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncStickyOffsets);
    for (const panel of panels) resizeObserver?.observe(panel);
    window.addEventListener("resize", syncStickyOffsets);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncStickyOffsets);
    };
  }, []);
  useEffect(() => {
    const marquee = clavisMarquee.current;
    const sequence = clavisSequence.current;
    if (!marquee || !sequence) return;

    const updateOrbRotationSpeed = () => {
      const orb = sequence.querySelector<HTMLElement>(
        '[data-testid="clavis-futuri-orb"]',
      );
      if (!orb) return;

      const duration = clavisOrbRotationDuration(
        sequence.getBoundingClientRect().width,
        orb.offsetWidth,
      );
      marquee.style.setProperty(
        "--clavis-orb-rotation-duration",
        `${duration}s`,
      );
    };

    updateOrbRotationSpeed();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOrbRotationSpeed);
      return () => window.removeEventListener("resize", updateOrbRotationSpeed);
    }

    const resizeObserver = new ResizeObserver(updateOrbRotationSpeed);
    resizeObserver.observe(sequence);
    return () => resizeObserver.disconnect();
  }, []);
  useEffect(() => {
    if (!usesTouchHeroFrames) return;

    primeMobileFrameWindow(0, 1, false);
    return () => {
      for (const frame of mobileFrameCache.current.values()) {
        frame.onload = null;
        frame.onerror = null;
        frame.src = "";
      }
      mobileFrameCache.current.clear();
    };
  }, []);
  useEffect(() => {
    const scrubHeroFromScroll = () => {
      const track = heroTrack.current;
      if (!track) return;

      const bounds = track.getBoundingClientRect();
      const isMobile = window.matchMedia
        ? window.matchMedia("(max-width: 767px)").matches
        : window.innerWidth <= 767;
      const usesTouchScene =
        isMobile ||
        (window.matchMedia
          ? window.matchMedia(heroTouchSceneQuery).matches
          : window.innerWidth <= 1023);
      const isDesktopPointer =
        window.matchMedia?.(heroDesktopPointerQuery).matches ?? false;
      const scene = usesTouchScene
        ? mobileHeroSceneProgress(-bounds.top, window.innerHeight)
        : { navExit: 0, copyReveal: 0, indicatorExit: 0 };
      const desktopChromeExit = isDesktopPointer
        ? desktopHeroChromeProgress(-bounds.top, window.innerHeight)
        : 0;
      const desktopWordmarkExit = isDesktopPointer
        ? desktopWordmarkExitProgress(
            logoPanel.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
            window.innerHeight,
          )
        : 0;
      const shell = siteShell.current;
      if (shell) {
        const desktopChromeTravel = Math.min(
          320,
          Math.max(180, window.innerHeight * 0.32),
        );
        shell.style.setProperty(
          "--desktop-chrome-exit",
          `${desktopChromeExit}`,
        );
        shell.style.setProperty(
          "--desktop-chrome-shift",
          `${-desktopChromeTravel * desktopChromeExit}px`,
        );
        shell.style.setProperty(
          "--desktop-chrome-opacity",
          `${1 - desktopChromeExit}`,
        );
        shell.style.setProperty(
          "--desktop-wordmark-exit",
          `${desktopWordmarkExit}`,
        );
        shell.style.setProperty(
          "--desktop-wordmark-shift",
          `${-desktopChromeTravel * desktopWordmarkExit}px`,
        );
        shell.style.setProperty(
          "--desktop-wordmark-opacity",
          `${1 - desktopWordmarkExit}`,
        );
        shell.style.setProperty("--mobile-nav-exit", `${scene.navExit}`);
        shell.style.setProperty(
          "--mobile-nav-shift",
          `${-140 * scene.navExit}px`,
        );
        shell.style.setProperty(
          "--mobile-nav-opacity",
          `${1 - scene.navExit}`,
        );
        shell.style.setProperty(
          "--mobile-copy-reveal",
          `${scene.copyReveal}`,
        );
        shell.style.setProperty(
          "--mobile-copy-shift",
          `${28 * (1 - scene.copyReveal)}px`,
        );
        shell.style.setProperty(
          "--mobile-indicator-exit",
          `${scene.indicatorExit}`,
        );
        shell.style.setProperty(
          "--mobile-indicator-opacity",
          `${1 - scene.indicatorExit}`,
        );
      }

      // Fine-pointer desktop keeps the character timeline under horizontal
      // mouse control; page scroll is reserved for the panel reveal.
      if (isDesktopPointer) return;
      const reservesPanelReveal =
        window.matchMedia?.("(max-width: 767px)").matches ?? false;
      const scrollable = heroScrollScrubDistance(
        bounds.height,
        window.innerHeight,
        reservesPanelReveal,
      );
      // Desktop: the track collapses to the hero height, so there is
      // nothing to scrub and the pointer keeps driving the video.
      if (scrollable <= 0) return;
      if (usesTouchScene) {
        const nextFrame = heroScrollFrameIndex(-bounds.top, scrollable);
        if (nextFrame !== lastMobileFrame.current) {
          const direction =
            nextFrame >= desiredMobileFrame.current ? 1 : -1;
          desiredMobileFrame.current = nextFrame;
          lastMobileFrame.current = nextFrame;
          primeMobileFrameWindow(nextFrame, direction);
        }
        return;
      }

      const currentVideo = video.current;
      if (!currentVideo || !heroMetadataReady.current) return;
      heroTargetTime.current = heroScrollVideoTime(
        -bounds.top,
        scrollable,
        currentVideo.duration,
      );
      scheduleHeroSeek();
    };
    let scrollRaf: number | null = null;
    const scheduleHeroScrub = () => {
      if (scrollRaf !== null) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = null;
        scrubHeroFromScroll();
      });
    };
    scrubHeroFromScroll();
    window.addEventListener("scroll", scheduleHeroScrub, { passive: true });
    window.addEventListener("resize", scheduleHeroScrub);
    return () => {
      window.removeEventListener("scroll", scheduleHeroScrub);
      window.removeEventListener("resize", scheduleHeroScrub);
      if (scrollRaf !== null) window.cancelAnimationFrame(scrollRaf);
    };
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
      // Seeking away from the default 0 forces mobile Safari to decode and
      // paint a frame even though the scroll-scrubbed video never autoplays.
      currentVideo.currentTime = Math.min(
        heroFrameDuration,
        Math.max(0, currentVideo.duration - heroFrameDuration),
      );
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
    if (!window.matchMedia?.(heroDesktopPointerQuery).matches) {
      lastHeroPointerX.current = null;
      return;
    }
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
    <main
      ref={siteShell}
      data-testid="site-shell"
      className="site-shell relative isolate"
      style={{
        fontFamily: '"Space Mono", monospace',
        "--mobile-nav-exit": "0",
        "--mobile-nav-shift": "0px",
        "--mobile-nav-opacity": "1",
        "--mobile-copy-reveal": "0",
        "--mobile-copy-shift": "28px",
        "--mobile-indicator-exit": "0",
        "--mobile-indicator-opacity": "1",
        "--desktop-chrome-exit": "0",
        "--desktop-chrome-shift": "0px",
        "--desktop-chrome-opacity": "1",
        "--desktop-wordmark-exit": "0",
        "--desktop-wordmark-shift": "0px",
        "--desktop-wordmark-opacity": "1",
      } as React.CSSProperties}
    >
      <audio
        ref={soundtrack}
        data-testid="site-soundtrack"
        loop
        preload="auto"
      >
        <source src={MEDIA.audio.soundtrackMp3} type="audio/mpeg" />
        <source src={MEDIA.audio.soundtrackM4a} type="audio/mp4" />
      </audio>
      <AnimatePresence>
        {audioGateOpen && (
          <AudioEntryGate
            ready={audioGateReady}
            onEnterWithSound={enterWithSound}
            onEnterSilently={enterSilently}
          />
        )}
      </AnimatePresence>
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
          <img
            data-testid="hero-model-fallback"
            ref={heroFallback}
            src={heroMobileFrameSrc(0)}
            alt=""
            aria-hidden="true"
            draggable="false"
            className="hero-model-video hero-model-fallback pointer-events-none absolute bottom-0 left-1/2 w-auto max-w-none object-contain object-center lg:left-[72%]"
          />
          <video
            data-testid="hero-video"
            ref={video}
            muted
            playsInline
            preload={usesTouchHeroFrames ? "none" : "auto"}
            disablePictureInPicture
            aria-hidden="true"
            className="hero-model-video hero-model-source pointer-events-none absolute bottom-0 left-1/2 w-auto max-w-none object-contain object-center lg:left-[72%]"
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
        <button
          type="button"
          aria-label={soundEnabled ? "Sesi kapat" : "Sesi aç"}
          aria-pressed={soundEnabled}
          className="hero-sound-control"
          onClick={(event) => {
            event.stopPropagation();
            toggleSound();
          }}
        >
          {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <div data-testid="hero-wordmark" className="hero-wordmark pointer-events-none absolute inset-x-0 top-1/2 z-[16] -translate-y-1/2 overflow-hidden">
          <motion.div
            ref={clavisMarquee}
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: clavisBandDuration,
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
            <ClavisFuturiSequence sequenceRef={clavisSequence} />
            <ClavisFuturiSequence hidden />
          </motion.div>
        </div>
        <motion.div
          data-testid="hero-copy-entrance"
          data-intro={entered ? "visible" : "hidden"}
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1 }}
          className="hero-copy-entrance relative z-30 flex flex-1"
        >
          <div
            data-testid="hero-copy"
            className="hero-copy flex flex-1 flex-col justify-end"
          >
            <div className="hero-copy-layout flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-8">
              <div className="flex flex-col gap-5 sm:gap-6">
                <div className="hero-title-entrance">
                  <h1
                    aria-label="Ritim ile Akış"
                    className="hero-primary-heading whitespace-nowrap text-[clamp(48px,10vw,160px)] font-light leading-[.92] tracking-[-.03em]"
                    style={{
                      fontFamily: '"PP Neue Machina", sans-serif',
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    <ScrambleIn text="Ritim ile Akış" delay={200} triggered={entered} />
                  </h1>
                </div>
                <div className="hero-description-entrance">
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
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2"
        >
          <div
            data-testid="hero-scroll-indicator"
            className="hero-scroll-indicator bottom-5 flex flex-col items-center gap-3"
          >
            <span className="scroll-cue-label uppercase">
              Scroll
            </span>
            <span className="scroll-line" />
          </div>
        </motion.div>
       </section>
       </div>
       </HeroSection>
       <div
        data-testid="cinematic-scroll-track"
        className="site-panel-track"
       >
        <CinematicSection />
       </div>
       <LogoSection>
       <section
        ref={logoPanel}
        data-testid="logo-section"
        className="site-stack-panel logo-panel relative flex min-h-screen items-start overflow-hidden px-5 pb-32 pt-8 sm:px-8 sm:pb-40 sm:pt-10"
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
