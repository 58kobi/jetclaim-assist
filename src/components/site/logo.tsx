import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import markAsset from "@/assets/jetclaim-mark.png.asset.json";

export function Logo({
  className,
  invert = false,
  showTagline = true,
}: {
  className?: string;
  invert?: boolean;
  showTagline?: boolean;
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          invert ? "bg-navy-foreground/10 text-navy-foreground" : "bg-navy text-navy-foreground",
        )}
      >
        <Plane className="size-5 -rotate-45" strokeWidth={2.2} />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-xl font-extrabold tracking-tight",
            invert ? "text-navy-foreground" : "text-navy",
          )}
        >
          JetClaim
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-0.5 block text-[11px] font-medium",
              invert ? "text-navy-foreground/70" : "text-muted-foreground",
            )}
          >
            We Fight. You Fly.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
