import { cn } from "@/lib/utils";

type LogoVariant = "mark" | "full";

type LogoProps = {
  /** `mark` = shield only, `full` = shield + wordmark */
  variant?: LogoVariant;
  className?: string;
  alt?: string;
};

/** Logo from original artwork in /logo.png — shield colors preserved, wordmark readable on dark UI. */
export function BrandLogo({
  variant = "full",
  className,
  alt = "Crewbase Collective",
}: LogoProps) {
  if (variant === "mark") {
    return (
      <img
        src="/logo-mark.png"
        alt={alt}
        className={cn(
          "block h-10 w-auto max-w-none object-contain object-left",
          "sm:h-12",
          className
        )}
      />
    );
  }

  return (
    <img
      src="/logo-full.png"
      alt={alt}
      className={cn(
        "block h-10 w-auto max-w-none object-contain object-left",
        "sm:h-11",
        className
      )}
    />
  );
}
