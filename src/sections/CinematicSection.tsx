import SignalTuner from "../components/SignalTuner";
import { MEDIA } from "../config/media";

export default function CinematicSection() {
  return (
    <section
      data-testid="cinematic-panel"
      className="site-stack-panel cinematic-panel relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#08060d]/70 px-5 py-28 sm:px-8 lg:py-36"
    >
      <img
        data-testid="signal-background"
        src={MEDIA.backgrounds.cosmicField}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div data-testid="section-transition" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-64 bg-gradient-to-b from-[#07040E] via-[#07040E]/70 to-transparent" />
      <div data-testid="section-transition" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-b from-transparent via-[#07040E]/70 to-[#07040E]" />
      <div className="relative z-20 mx-auto w-full max-w-[74rem] -translate-y-8">
        <SignalTuner />
      </div>
    </section>
  );
}
