import { createElement, useMemo } from "react";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { sanitizeHtml } from "../utils/sanitizeHtml";

type SanitizedHtmlProps<T extends ElementType> = {
  html: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "dangerouslySetInnerHTML" | "children">;

export function SanitizedHtml<T extends ElementType = "div">({
  html,
  as,
  ...rest
}: SanitizedHtmlProps<T>) {
  const Component = as ?? ("div" as T);
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);

  return createElement(Component, {
    ...rest,
    dangerouslySetInnerHTML: { __html: sanitized },
  });
}
