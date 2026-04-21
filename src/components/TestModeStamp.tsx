/**
 * Permanent "TEST MODE" stamp shown on every screen.
 * 10px italic grey, bottom-right, non-interactive.
 */
export function TestModeStamp() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-1.5 right-2 z-40 text-[10px] italic text-muted-foreground/70 select-none"
    >
      TEST MODE
    </div>
  );
}