import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Station = {
  freq: string;
  name: string;
  pos: number;
  amp: number;
};

const STATIONS: Station[] = [
  { freq: '88.1', name: 'Marka', pos: 0, amp: 1 },
  { freq: '94.5', name: 'Dijital', pos: 33.333, amp: 1.6 },
  { freq: '101.3', name: 'Kampanya', pos: 66.667, amp: 2.3 },
  { freq: '107.9', name: 'Diğer', pos: 100, amp: 0.7 },
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
  --st-serif:'Instrument Serif',serif;
  --st-mono:'Space Mono',monospace;
  --st-ease:cubic-bezier(.16,1,.3,1);
  color:var(--st-ink);
  font-family:var(--st-sans);
  display:flex;flex-direction:column;justify-content:center;
  padding:clamp(40px,6vh,80px) 0;
  box-sizing:border-box;
}
.st-root *,.st-root *::before,.st-root *::after{box-sizing:border-box;margin:0;padding:0}
.st-kicker{display:flex;align-items:center;gap:16px;font-family:var(--st-mono);font-size:clamp(10px,1vw,12px);letter-spacing:.26em;text-transform:uppercase;color:var(--st-violet-soft);margin-bottom:clamp(20px,3vh,34px)}
.st-eq{display:flex;align-items:flex-end;gap:2px;height:12px}
.st-eq i{display:block;width:2px;background:var(--st-violet);transform-origin:bottom}
.st-h1{font-family:var(--st-sans);font-size:clamp(48px,8.5vw,118px);line-height:.94;font-weight:700;letter-spacing:-.035em;max-width:14ch;text-wrap:balance}
.st-h1 em{font-family:var(--st-serif);font-style:italic;font-weight:400;letter-spacing:-.01em;color:var(--st-violet)}
.st-sub{margin-top:clamp(18px,2.6vh,28px);max-width:44ch;font-size:clamp(15px,1.3vw,18px);line-height:1.65;color:var(--st-ink-dim);font-weight:400}
.st-tuner{margin-top:clamp(64px,9vh,96px)}
.st-tuner-head{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--st-mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--st-ink-faint);margin-bottom:14px}
.st-tuner-head,.st-wave{transform:translateY(-34px)}
.st-readout{color:var(--st-ink)}
.st-wave{width:100%;height:56px;display:block;margin-bottom:-8px}
.st-band{position:relative;padding-top:26px}
.st-rail{position:relative;height:34px;border-top:1px solid var(--st-line)}
.st-ticks,.st-ticks-fine{position:absolute;inset:0;background-repeat:no-repeat}
.st-ticks{background-image:repeating-linear-gradient(90deg,var(--st-line-soft) 0,var(--st-line-soft) 1px,transparent 1px,transparent 12.5%);background-size:100% 10px}
.st-ticks-fine{background-image:repeating-linear-gradient(90deg,var(--st-line-soft) 0,var(--st-line-soft) 1px,transparent 1px,transparent 2.5%);background-size:100% 5px}
.st-needle{position:absolute;top:-98px;bottom:34px;width:1px;background:var(--st-violet)}
.st-needle::after{content:'';position:absolute;top:-5px;left:-3.5px;width:8px;height:8px;border-radius:50%;background:var(--st-violet)}
.st-stations{position:relative;height:82px;margin-top:6px}
.st-station{position:absolute;top:0;appearance:none;background:none;border:0;cursor:pointer;text-align:left;color:var(--st-ink-faint);padding:18px 0 22px;font-family:var(--st-sans);transition:color .5s}
.st-station:nth-child(1){left:0}
.st-station:nth-child(2){left:33.333%;transform:translateX(-50%)}
.st-station:nth-child(3){left:66.667%;transform:translateX(-50%)}
.st-station:nth-child(4){right:0;text-align:right}
.st-station:hover{color:var(--st-ink-dim)}
.st-station.is-active{color:var(--st-ink)}
.st-station:focus-visible{outline:1px solid var(--st-violet);outline-offset:4px;border-radius:2px}
.st-freq{font-family:var(--st-mono);font-size:11px;letter-spacing:.18em;display:block;margin-bottom:8px}
.st-station.is-active .st-freq{color:var(--st-violet)}
.st-name{font-size:clamp(17px,1.7vw,24px);font-weight:500;letter-spacing:-.01em;display:inline-block;position:relative}
.st-name::after{content:'';position:absolute;left:0;bottom:-6px;height:1px;width:0;background:var(--st-violet);transition:width .6s var(--st-ease)}
.st-station:hover .st-name::after{width:36%}
.st-station.is-active .st-name::after{width:100%}
.st-transmit{margin-top:clamp(30px,5vh,52px);display:flex;flex-direction:column;align-items:stretch;border:1px solid var(--st-line);background:rgba(240,237,250,.025);backdrop-filter:blur(8px);transition:border-color .4s var(--st-ease)}
.st-transmit:focus-within{border-color:rgba(164,143,255,.5)}
.st-tag{display:flex;align-items:center;padding:14px 18px;font-family:var(--st-mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--st-ink-faint);border-bottom:1px solid var(--st-line-soft);white-space:nowrap}
.st-input{flex:1;min-width:0;background:none;border:0;outline:none;color:var(--st-ink);font-family:var(--st-sans);font-size:15px;padding:22px 20px}
.st-input::placeholder{color:var(--st-ink-faint)}
.st-send{appearance:none;border:0;cursor:pointer;white-space:nowrap;background:var(--st-ink);color:#0B0918;font-family:var(--st-mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;padding:16px;transition:background .3s,letter-spacing .5s var(--st-ease)}
.st-send:hover{background:var(--st-violet);letter-spacing:.26em}
.st-send:focus-visible{outline:1px solid var(--st-violet);outline-offset:3px}
@media (min-width:761px){
  .st-transmit{flex-direction:row}
  .st-tag{padding:0 22px;border-bottom:0;border-right:1px solid var(--st-line-soft)}
  .st-send{padding:0 clamp(22px,3vw,40px)}
}
@media (max-width:760px){
  .st-stations{display:grid;grid-template-columns:repeat(2,1fr);height:auto;row-gap:4px}
  .st-station{position:static;transform:none!important;padding:18px 4px 22px}
}
@media (prefers-reduced-motion:reduce){
  .st-root *{transition:none!important}
}
`;

export default function SignalTuner() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Station>(STATIONS[0]);

  const pathRef = useRef<SVGPathElement | null>(null);
  const ampTargetRef = useRef(STATIONS[0].amp);

  useEffect(() => {
    ampTargetRef.current = active.amp;
  }, [active]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    let amp = ampTargetRef.current;
    let raf = 0;

    const draw = (t: number) => {
      amp += (ampTargetRef.current - amp) * 0.04;
      let d = 'M0 28';
      for (let px = 0; px <= 1200; px += 8) {
        const y =
          28 +
          Math.sin(px * 0.014 + t * 0.0016) * 7 * amp +
          Math.sin(px * 0.037 + t * 0.0031) * 3.5 * amp +
          Math.sin(px * 0.006 - t * 0.0009) * 4 * amp;
        d += ` L${px} ${y.toFixed(1)}`;
      }
      path.setAttribute('d', d);
    };

    if (reduce) {
      draw(0);
      return;
    }

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <section className="st-root">
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

      <h1 className="st-h1">
        Yayın <em>çok yakında.</em>
      </h1>
      <p className="st-sub">
        Her marka bir sinyal taşır biz onu yayına çeviririz. Yeni yüzümüz son ayarlarında. Frekansını seç, talebini bırak, doğru masaya düşsün.
      </p>

      <div className="st-tuner" aria-label="Frekans seçimi">
        <div className="st-tuner-head">
          <span>Frekans ayarla</span>
          <motion.span
            key={active.freq}
            className="st-readout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Bağlı — {active.freq} · {active.name}
          </motion.span>
        </div>

        <svg className="st-wave" viewBox="0 0 1200 56" preserveAspectRatio="none" aria-hidden="true">
          <path ref={pathRef} fill="none" stroke="#A48FFF" strokeWidth={1.4} opacity={0.85} />
        </svg>

        <div className="st-band">
          <div className="st-rail">
            <div className="st-ticks-fine" />
            <div className="st-ticks" />
            <motion.div
              className="st-needle"
              initial={false}
              animate={{ left: `${active.pos}%` }}
              transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
            />
          </div>

          <div className="st-stations">
            {STATIONS.map((station) => (
              <button
                key={station.freq}
                type="button"
                onClick={() => setActive(station)}
                aria-pressed={station.freq === active.freq}
                className={`st-station${station.freq === active.freq ? ' is-active' : ''}`}
              >
                <span className="st-freq">{station.freq}</span>
                <span className="st-name">{station.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="st-transmit">
        <span className="st-tag">İletim</span>
        <input
          className="st-input"
          type="text"
          placeholder="Talebini yaz — seni doğru ekibe yönlendirelim"
          aria-label="Talebin"
        />
        <button className="st-send" type="button">
          Sinyali gönder ↗
        </button>
      </div>
    </section>
  );
}
