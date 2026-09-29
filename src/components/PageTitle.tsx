import type { ReactNode } from "react";

/**
 * Standard page/section title row. Keeps the title height and horizontal
 * position identical across pages, whether or not an action is present.
 */
export const PageTitle = ({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex min-h-[2.25rem] items-center justify-between px-4">
    <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">
      {children}
    </h2>
    {action ? <div className="flex items-center gap-2">{action}</div> : null}
  </div>
);
