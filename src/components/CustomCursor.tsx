import { useEffect, useRef } from "react";

const interactiveSelector = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "[role='button']",
  "[data-cursor-grow]",
].join(",");

function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const follower = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = cursor.current;
    if (!element) return;

    const moveCursor = (event: MouseEvent) => {
      const position = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      dot.current?.style.setProperty("transform", position);
      follower.current?.style.setProperty("transform", position);
      element.dataset.visible = "true";
      if (event.target instanceof HTMLElement || event.target instanceof SVGElement) {
        event.target.style.cursor = "none";
      }
      element.dataset.active = event.target instanceof Element && event.target.closest(interactiveSelector) ? "true" : "false";
    };
    const hideCursor = () => {
      element.dataset.visible = "false";
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", hideCursor);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", hideCursor);
    };
  }, []);

  return (
    <div ref={cursor} className="custom-cursor" data-visible="false" data-active="false" aria-hidden="true">
      <span ref={dot} data-testid="cursor-dot" className="custom-cursor__dot" />
      <span ref={follower} data-testid="cursor-ring" className="custom-cursor__follower" />
    </div>
  );
}

export default CustomCursor;
