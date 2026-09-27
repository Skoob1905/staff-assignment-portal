import type { ReactNode } from "react";
import { PageTitle } from "./PageTitle";

interface ContentProps {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Content = ({
  title,
  count,
  action,
  children,
  className,
}: ContentProps) => (
  <div className={`flex w-full flex-col ${className ?? ""}`}>
    <PageTitle action={action}>
      {title}
      {count !== undefined && ` (${count})`}
    </PageTitle>
    <div className="mt-1.5 sm:mt-3 rounded-[var(--radius)] bg-[var(--card)] p-3 sm:p-4">
      {children}
    </div>
  </div>
);
