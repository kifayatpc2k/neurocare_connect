import { branding } from "@/config/branding";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/neurocare-logo.png.asset.json";

/** The application mark — reads its label from the central branding config. */
export function BrandMark({
  className,
  subtitle = branding.app.tagline,
  compact = false,
}: {
  className?: string | undefined;
  subtitle?: string | null | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <img
        src={logoAsset.url}
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        className="size-11 shrink-0 object-contain"
      />
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight">
          {branding.app.name}
        </span>
        {!compact && subtitle ? (
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}

/** Institutional logos. Swap the assets in `src/config/branding.ts` only. */
export function InstitutionLogos({
  className,
  size = 40,
  withCaption = true,
}: {
  className?: string | undefined;
  size?: number | undefined;
  withCaption?: boolean | undefined;
}) {
  const { college, university } = branding.logos;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {[college, university].map((logo) => (
        <img
          key={logo.alt}
          src={logo.src}
          alt={logo.alt}
          loading="lazy"
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="inset-tile rounded-xl object-contain p-1"
        />
      ))}
      {withCaption ? (
        <p className="text-xs text-muted-foreground">
          {college.isPlaceholder || university.isPlaceholder
            ? "College & University logo placeholders"
            : `${branding.institution.collegeName} · ${branding.institution.universityName}`}
        </p>
      ) : null}
    </div>
  );
}
