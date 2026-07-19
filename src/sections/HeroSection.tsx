import type { ReactNode } from "react";

type HeroSectionProps = {
  children: ReactNode;
};

/**
 * Owns the hero section boundary while App keeps pointer and video-seek state.
 */
export default function HeroSection({ children }: HeroSectionProps) {
  return <>{children}</>;
}
