import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-2 pb-5 border-b border-subtle">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] text-secondary"
        >
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  size={13}
                  className="text-muted shrink-0"
                  aria-hidden="true"
                />
              )}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-primary font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-[24px] font-semibold tracking-tight text-primary leading-8 truncate">
            {title}
          </h1>
          {description && (
            <p className="text-[14px] text-secondary truncate">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
