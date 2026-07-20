import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Station = {
  freq: string;
  name: string;
  desc: string;
  pos: number;
  wave: WaveProfile;
};

export type WaveProfile = 'idle' | 'software' | 'production' | 'growth' | 'other';

const WAVE_CENTER = 28;
const WAVE_MIN = 5;
const WAVE_MAX = 51;
const TAU = Math.PI * 2;

const clampWave = (value: number) => Math.min(WAVE_MAX, Math.max(WAVE_MIN, value));

const gaussian = (value: number, center: number, width: number) =>
  Math.exp(-Math.pow((value - center) / width, 2));

const positiveModulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

export function signalWaveY(profile: WaveProfile, x: number, time: number) {
  let offset = 0;

  if (profile === 'software') {
    const phase = (TAU * x) / 160 - time * 0.0022;
    offset = Math.sin(phase) * 5.2 + Math.sin(phase * 2 + 0.35) * 1.1;
  } else if (profile === 'production') {
    const cinematicSwell = 0.58 + Math.sin((TAU * x) / 540 + time * 0.0007) * 0.24;
    offset =
      Math.sin((TAU * x) / 260 - time * 0.0016) * 8 * cinematicSwell +
      Math.sin((TAU * x) / 86.67 + time * 0.0028) * 2.7 +
      Math.sin((TAU * x) / 600 - time * 0.00045) * 2;
  } else if (profile === 'growth') {
    const progress = Math.min(1, Math.max(0, x / 1200));
    const growingAmplitude = 1.8 + progress * 14.2;
    offset =
      growingAmplitude *
      (Math.sin((TAU * x) / 240 - time * 0.0015) * 0.72 +
        Math.sin((TAU * x) / 96 + time * 0.001) * 0.28);
  } else if (profile === 'other') {
    const beatPhase = positiveModulo(x - time * 0.025, 340);
    offset =
      Math.sin(x * 0.012 - time * 0.00035) * 0.35 +
      gaussian(beatPhase, 110, 11) * 2.8 -
      gaussian(beatPhase, 138, 5) * 7 +
      gaussian(beatPhase, 151, 3) * 18 -
      gaussian(beatPhase, 160, 5) * 14 +
      gaussian(beatPhase, 184, 11) * 4;
  } else {
    offset =
      Math.sin(x * 0.014 + time * 0.0016) * 7 +
      Math.sin(x * 0.037 + time * 0.0031) * 3.5 +
      Math.sin(x * 0.006 - time * 0.0009) * 4;
  }

  return clampWave(WAVE_CENTER + offset);
}

const STATIONS: Station[] = [
  { freq: '88.1', name: 'Yazılım', desc: 'web · app · full-stack', pos: 12.5, wave: 'software' },
  { freq: '94.5', name: 'Prodüksiyon', desc: '3d modelleme · görsel üretim', pos: 37.5, wave: 'production' },
  { freq: '101.3', name: 'Büyüme', desc: 'seo · görünürlük · performans', pos: 62.5, wave: 'growth' },
  { freq: '107.9', name: 'Diğer', desc: 'aklında başka bir şey varsa', pos: 87.5, wave: 'other' },
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const EQ_BARS = [
  { h: 5, delay: 0 },
  { h: 11, delay: 0.15 },
  { h: 7, delay: 0.3 },
  { h: 10, delay: 0.45 },
];

const CSS = `
.st-root{
  --st-ink:#F0EDFA;
  --st-ink-dim:rgba(240,237,250,.56);
  --st-ink-faint:rgba(240,237,250,.32);
  --st-violet:#A48FFF;
  --st-violet-soft:rgba(164,143,255,.55);
  --st-line:rgba(240,237,250,.14);
  --st-line-soft:rgba(240,237,250,.07);
  --st-sans:'Instrument Sans',sans-serif;
  --st-display:'PP Neue Machina',sans-serif;
  --st-mono:'Geist Mono',monospace;
  --st-radius:6px;
  --st-rail-offset:80px;
  --st-ease:cubic-bezier(.16,1,.3,1);
  color:var(--st-ink);
  font-family:var(--st-sans);
  display:flex;flex-direction:column;justify-content:center;
  padding:clamp(40px,6vh,80px) 0;
  box-sizing:border-box;
}
.st-root *,.st-root *::before,.st-root *::after{box-sizing:border-box;margin:0;padding:0}
.st-kicker{transform:translate(-18px,-32px);display:flex;align-items:center;gap:16px;font-family:var(--st-mono);font-size:clamp(10px,1vw,12px);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--st-violet-soft);margin-bottom:clamp(-12px,1vh,0px)}
.st-eq{display:flex;align-items:flex-end;gap:2px;height:12px}
.st-eq i{display:block;width:2px;background:var(--st-violet);transform-origin:bottom}
.st-h1{font-family:var(--st-display);font-size:clamp(48px,8.5vw,118px);line-height:1.05;font-weight:800;letter-spacing:-.02em;max-width:14ch;text-wrap:balance}
.st-h1{padding-top:8px}
.st-sub{margin-top:clamp(18px,2.6vh,28px);max-width:44ch;font-family:Geist,sans-serif;font-size:clamp(15px,1.3vw,18px);line-height:1.65;color:var(--st-ink-dim);font-weight:400}
.st-tuner{margin-top:clamp(96px,13vh,140px)}
.st-tuner-head{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--st-mono);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--st-ink-faint);margin-bottom:14px}
.st-tuner-head{transform:translateY(-60px)}
.st-wave{transform:translateY(28px)}
.st-readout{color:var(--st-ink)}
.st-wave{width:100%;height:56px;display:block;margin-bottom:-8px}
.st-wave path{opacity:1;filter:drop-shadow(0 0 5px rgba(164,143,255,.72))}
.st-band{position:relative;padding-top:58px}
.st-rail{position:relative;height:34px}
.st-rail::before{content:'';position:absolute;inset:0 0 auto;height:1px;background:var(--st-line);transform:translateY(var(--st-rail-offset))}
.st-ticks,.st-ticks-fine{position:absolute;inset:0;background-repeat:no-repeat;transform:translateY(var(--st-rail-offset))}
.st-ticks{background-image:repeating-linear-gradient(90deg,var(--st-line-soft) 0,var(--st-line-soft) 1px,transparent 1px,transparent 12.5%);background-size:100% 10px}
.st-ticks-fine{background-image:repeating-linear-gradient(90deg,var(--st-line-soft) 0,var(--st-line-soft) 1px,transparent 1px,transparent 2.5%);background-size:100% 5px}
.st-needle{position:absolute;z-index:2;top:-124px;bottom:var(--st-desktop-needle-bottom);width:1px;pointer-events:none;background:linear-gradient(to bottom,var(--st-violet) 0%,rgba(164,143,255,.28) 48%,rgba(164,143,255,.32) 72%,var(--st-violet) 100%);will-change:bottom;transition:bottom 1.05s cubic-bezier(.45,0,.2,1)}
.st-needle::after{content:'';position:absolute;top:-5px;left:-3.5px;width:8px;height:8px;border-radius:50%;background:var(--st-violet)}
.st-needle-bridge{display:none}
.st-stations{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:100px}
.st-station{appearance:none;background:transparent;border:1px solid rgba(240,237,250,.08);border-radius:var(--st-radius);cursor:pointer;text-align:left;color:var(--st-ink-faint);padding:16px 18px 24px;min-height:122px;position:relative;font-family:var(--st-mono);font-weight:600;letter-spacing:.12em;text-transform:uppercase;transition:color .5s,border-color .35s var(--st-ease),box-shadow .35s var(--st-ease)}
.st-station::before{content:'';position:absolute;top:10px;right:10px;width:4px;height:4px;border-radius:50%;background:var(--st-violet);opacity:0;transform:scale(.5);transition:opacity .35s var(--st-ease),transform .35s var(--st-ease)}
.st-station:hover{color:var(--st-ink-dim);border-color:rgba(240,237,250,.22)}
.st-station:hover .st-freq{color:var(--st-violet-soft)}
.st-station.is-active{color:var(--st-ink);border-color:rgba(164,143,255,.5);box-shadow:inset 0 0 24px rgba(164,143,255,.06)}
.st-station.is-active::before{opacity:1;transform:scale(1)}
.st-station:focus-visible{outline:1px solid var(--st-violet);outline-offset:3px}
.st-freq{font-size:11px;letter-spacing:.12em;display:block;margin-bottom:8px}
.st-station.is-active .st-freq{color:var(--st-violet)}
.st-name{font-size:clamp(17px,1.7vw,24px);font-weight:600;letter-spacing:.12em;display:inline-block;position:relative}
.st-name::after{content:'';position:absolute;left:0;bottom:-6px;height:1px;width:0;background:var(--st-violet);transition:width .6s var(--st-ease)}
.st-desc{display:block;margin-top:12px;font-family:var(--st-mono);font-size:10px;font-weight:400;letter-spacing:.06em;text-transform:lowercase;color:rgba(240,237,250,.28);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .5s}
.st-station:hover .st-desc{color:rgba(240,237,250,.42)}
.st-station.is-active .st-desc{color:var(--st-ink-dim)}
.st-station:hover .st-name::after{width:24%}
.st-station.is-active .st-name::after{width:100%}
.st-transmit{margin-top:clamp(124px,17vh,200px);display:flex;flex-direction:column;align-items:stretch;border:1px solid var(--st-line);border-radius:var(--st-radius);overflow:hidden;background:rgba(240,237,250,.025);backdrop-filter:blur(8px);transition:border-color .4s var(--st-ease)}
.st-transmit:focus-within{border-color:rgba(164,143,255,.5)}
.st-tag{display:flex;align-items:center;padding:14px 18px;font-family:var(--st-mono);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--st-ink-faint);border-bottom:1px solid var(--st-line-soft);white-space:nowrap}
.st-input{flex:1;min-width:0;background:none;border:0;outline:none;resize:none;color:var(--st-ink);font-family:var(--st-mono);font-size:15px;font-weight:500;line-height:1.6;letter-spacing:.03em;padding:22px 20px}
.st-input::placeholder{color:var(--st-ink-faint)}
.st-send{appearance:none;border:0;cursor:pointer;white-space:nowrap;background:var(--st-ink);color:#0B0918;font-family:var(--st-mono);font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:16px;transition:background .3s,letter-spacing .5s var(--st-ease)}
.st-send:hover{background:var(--st-violet);letter-spacing:.16em}
.st-send:focus-visible{outline:1px solid var(--st-violet);outline-offset:3px}
@media (min-width:761px){
  .st-wave{height:88px}
  .st-wave path{stroke-width:2.25;transform:scaleY(1.55);transform-box:view-box;transform-origin:center}
  .st-transmit{flex-direction:row}
  .st-tag{padding:0 22px;border-bottom:0;border-right:1px solid var(--st-line-soft)}
  .st-send{padding:0 clamp(22px,3vw,40px)}
}
@media (max-width:760px){
  .st-root{--st-rail-offset:0px}
  .st-kicker{transform:translate(0,-32px)}
  .st-needle{left:var(--st-mobile-column)!important;bottom:var(--st-mobile-needle-bottom);will-change:left,bottom;transition:left 1.05s cubic-bezier(.45,0,.2,1),bottom 1.05s cubic-bezier(.45,0,.2,1)}
  .st-needle-bridge{display:block;position:absolute;top:195px;height:10px;width:1px;left:var(--st-mobile-column);z-index:2;pointer-events:none;background:var(--st-violet);opacity:0;transform:scaleY(0);transform-origin:top;will-change:left,opacity,transform;transition:left 1.05s cubic-bezier(.45,0,.2,1),opacity .3s ease,transform .5s var(--st-ease)}
  .st-needle-bridge[data-visible='true']{opacity:1;transform:scaleY(1)}
  .st-stations{grid-template-columns:repeat(2,1fr);margin-top:36px}
  .st-stations{grid-auto-rows:125px}
  .st-station{padding:14px 14px 20px;min-height:104px}
  .st-desc{font-size:9px;white-space:normal;line-height:1.5}
  .st-transmit{margin-top:64px}
  .st-input{min-height:118px}
}
@media (prefers-reduced-motion:reduce){
  .st-root *{transition:none!important}
}
`;

export default function SignalTuner() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Station | null>(null);

  const rootRef = useRef<HTMLElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const waveProfileRef = useRef<WaveProfile>('idle');
  const needleStation = active ?? STATIONS[0];
  const activeIndex = active ? STATIONS.indexOf(active) : 0;
  const mobileNeedleStyle = {
    '--st-mobile-column': activeIndex % 2 === 0 ? 'calc(25% - 2.5px)' : 'calc(75% + 2.5px)',
    '--st-desktop-needle-bottom': active ? '-100px' : 'calc(34px - var(--st-rail-offset))',
    '--st-mobile-needle-bottom': active ? '-36px' : '34px',
  } as CSSProperties;
  const showMobileBridge = active !== null && activeIndex >= 2;

  useEffect(() => {
    const profile = active?.wave ?? 'idle';
    waveProfileRef.current = profile;

    if (!reduce || !pathRef.current) return;

    let d = `M0 ${WAVE_CENTER}`;
    for (let x = 0; x <= 1200; x += 8) {
      d += ` L${x} ${signalWaveY(profile, x, 0).toFixed(1)}`;
    }
    pathRef.current.setAttribute('d', d);
  }, [active, reduce]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    let raf = 0;
    let isVisible = false;
    const currentY: number[] = [];

    const draw = (t: number) => {
      let d = `M0 ${WAVE_CENTER}`;
      let pointIndex = 0;
      for (let x = 0; x <= 1200; x += 8) {
        const targetY = signalWaveY(waveProfileRef.current, x, t);
        const y = currentY[pointIndex] === undefined
          ? targetY
          : currentY[pointIndex] + (targetY - currentY[pointIndex]) * 0.075;
        currentY[pointIndex] = y;
        d += ` L${x} ${y.toFixed(1)}`;
        pointIndex += 1;
      }
      path.setAttribute('d', d);
    };

    if (reduce) {
      draw(0);
      return;
    }

    const loop = (t: number) => {
      raf = 0;
      draw(t);
      if (isVisible) raf = requestAnimationFrame(loop);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (!isVisible) {
          cancelAnimationFrame(raf);
          raf = 0;
          return;
        }

        if (!raf) raf = requestAnimationFrame(loop);
      },
      { threshold: 0.25 },
    );
    if (rootRef.current) observer.observe(rootRef.current);
    draw(0);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="st-root">
      <style>{CSS}</style>

      <div className="st-kicker">
        <div className="st-eq" aria-hidden="true">
          {EQ_BARS.map((bar, i) => (
            <motion.i
              key={i}
              style={{ height: bar.h }}
              animate={reduce ? undefined : { scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: bar.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <span>Sinyal var — 330 frekansındasın</span>
      </div>

      <h1 className="st-h1">Yayın çok yakında.</h1>
      <p className="st-sub">
        Her marka bir sinyal taşır biz onu yayına çeviririz. Yeni yüzümüz son ayarlarında. Frekansını seç, talebini bırak,<br /> doğru masaya düşsün.
      </p>

      <div className="st-tuner" aria-label="Frekans seçimi">
        <div className="st-tuner-head">
          <span>Frekans ayarla</span>
          <motion.span
            key={active?.freq ?? 'idle'}
            className="st-readout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {active ? `Bağlı — ${active.freq} · ${active.name}` : 'Frekansını seç'}
          </motion.span>
        </div>

        <svg
          className="st-wave"
          data-wave-profile={active?.wave ?? 'idle'}
          viewBox="0 0 1200 56"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path ref={pathRef} fill="none" stroke="#A48FFF" strokeWidth={1.4} opacity={0.85} />
        </svg>

        <div className="st-band" style={mobileNeedleStyle}>
          <div className="st-rail">
            <div className="st-ticks-fine" />
            <div className="st-ticks" />
            <motion.div
              className="st-needle"
              data-extension={active ? 'connected' : 'resting'}
              initial={false}
              animate={{ left: `${needleStation.pos}%` }}
              transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
            />
            <div className="st-needle-bridge" data-visible={showMobileBridge} aria-hidden="true" />
          </div>

          <div className="st-stations">
            {STATIONS.map((station) => (
              <button
                key={station.freq}
                type="button"
                onClick={() => setActive(station)}
                aria-pressed={station.freq === active?.freq}
                className={`st-station${station.freq === active?.freq ? ' is-active' : ''}`}
              >
                <span className="st-freq">{station.freq}</span>
                <span className="st-name">{station.name}</span>
                <span className="st-desc">{station.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="st-transmit">
        <span className="st-tag">İletişim</span>
        <textarea
          className="st-input"
          rows={1}
          placeholder="İlk adımı at..."
          aria-label="Talebin"
        />
        <button className="st-send" type="button">
          SİNYALİ GÖNDER
        </button>
      </div>
    </section>
  );
}
