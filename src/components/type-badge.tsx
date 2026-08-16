import type { TypeName } from "@/lib/type-chart";
import { TYPE_COLORS } from "@/lib/type-colors";

// The colored pill a pokemon/move type is always drawn as. Sizes are the
// four that actually occur: roster rows are the tightest, cards and table
// cells sit in the middle, and the filter/coverage chips are the largest.
type BadgeSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[9px]",
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-xs",
};

const BASE_CLASSES = "rounded-full font-medium capitalize text-white";

// Renders a <button> when onClick is given (the type filter chips), a
// plain <span> otherwise. No "use client" -- it has no hooks of its own, so
// it takes on whichever boundary its importer is already in.
export function TypeBadge({
  type,
  size = "sm",
  className = "",
  onClick,
}: {
  type: TypeName;
  size?: BadgeSize;
  className?: string;
  onClick?: () => void;
}) {
  const classes = `${BASE_CLASSES} ${SIZE_CLASSES[size]} ${className}`;
  const style = { backgroundColor: TYPE_COLORS[type] };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} style={style}>
        {type}
      </button>
    );
  }

  return (
    <span className={classes} style={style}>
      {type}
    </span>
  );
}
