import { externalUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SponsorDisplayProps = {
  name: string | null;
  website?: string | null;
  logo?: string | null;
  description?: string | null;
  typeLabel?: string | null;
  className?: string;
  /** Tighter layout for dense event lists */
  compact?: boolean;
};

/**
 * Sponsor / partner block: name → logo → description.
 * Logo uses a light plate so dark artwork stays readable on the dark theme.
 */
export function SponsorDisplay({
  name,
  website,
  logo,
  description,
  typeLabel,
  className,
  compact,
}: SponsorDisplayProps) {
  if (!name && !logo && !description) return null;

  const href = externalUrl(website || null);
  const title = name || "Organization";
  const hasLogo = Boolean(logo && logo.trim());

  const nameEl = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-white transition hover:text-[var(--cyan)]"
    >
      {title}
    </a>
  ) : (
    <span className="font-semibold text-white">{title}</span>
  );

  return (
    <div className={cn("flex flex-col", className)}>
      <div>
        {name && <div className={compact ? "text-base" : "text-lg"}>{nameEl}</div>}
        {typeLabel && (
          <p className="mt-0.5 text-xs uppercase tracking-wide text-[var(--muted)]">{typeLabel}</p>
        )}
      </div>

      {hasLogo ? (
        <div
          className={cn(
            "mt-4 w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/10",
            compact ? "p-3" : "p-4"
          )}
        >
          <img
            src={logo!}
            alt={`${title} logo`}
            className={cn(
              "mx-auto block w-full object-contain object-center",
              compact ? "max-h-24" : "h-36 sm:h-40"
            )}
            loading="lazy"
          />
        </div>
      ) : name ? (
        <div
          className={cn(
            "mt-4 flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)]",
            compact ? "h-20" : "h-36 sm:h-40"
          )}
        >
          <span className="text-2xl font-bold text-[var(--cyan)]">{title.charAt(0)}</span>
        </div>
      ) : null}

      {description && (
        <p
          className={cn(
            "mt-4 whitespace-pre-wrap leading-relaxed text-[var(--muted)]",
            compact ? "text-sm" : "text-sm sm:text-[15px]"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
