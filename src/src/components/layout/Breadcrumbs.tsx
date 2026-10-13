import { Fragment } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = {
  label: string;
  to?: LinkProps["to"] | undefined;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !crumb.to ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}

      </BreadcrumbList>
    </Breadcrumb>
  );
}
