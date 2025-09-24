import type { ReactNode } from "react";
import { classNames } from "../utils/classNames";

const MAX_CARD_DEPTH = 3;

type NewsCardVariant = "stack" | "tile";

type NewsCardProps = {
  depth?: number;
  isTop?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  variant?: NewsCardVariant;
};

export function NewsCard({
  depth = 0,
  isTop = false,
  children,
  footer,
  className,
  variant = "stack",
}: NewsCardProps) {
  const clampedDepth = Math.min(depth, MAX_CARD_DEPTH);
  const cardClassName = classNames(
    "news-card",
    variant === "stack" ? "news-card--stack" : "news-card--tile",
    variant === "stack" && `news-card--depth-${clampedDepth}`,
    variant === "stack" && isTop && "news-card--top",
    className
  );

  return (
    <article className={cardClassName}>
      <div className="news-card__body">
        <div className="news-card__content">{children}</div>
      </div>
      {footer ? <div className="news-card__footer">{footer}</div> : null}
    </article>
  );
}
