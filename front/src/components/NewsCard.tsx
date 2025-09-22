import type { ReactNode } from "react";
import { classNames } from "../utils/classNames";

const MAX_CARD_DEPTH = 3;

type NewsCardProps = {
  depth: number;
  isTop?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function NewsCard({ depth, isTop = false, children, footer, className }: NewsCardProps) {
  const clampedDepth = Math.min(depth, MAX_CARD_DEPTH);
  const cardClassName = classNames(
    "news-card",
    `news-card--depth-${clampedDepth}`,
    isTop && "news-card--top",
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
