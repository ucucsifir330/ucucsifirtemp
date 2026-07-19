import type { ReactNode } from "react";

type LogoSectionProps = {
  children: ReactNode;
};

export default function LogoSection({ children }: LogoSectionProps) {
  return <>{children}</>;
}
