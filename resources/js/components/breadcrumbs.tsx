import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from '@/components/ui/breadcrumb';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

export function Breadcrumbs({ items, breadcrumbs }: { items?: Array<{ label: string; href?: string }>; breadcrumbs?: any }) {
    const activeItems = items || (breadcrumbs ? breadcrumbs.map((b: any) => ({ label: b.title || b.label || '', href: b.href })) : []);
    if (!activeItems || activeItems.length === 0) return null;

    const isLong = activeItems.length > 2;
    const firstItem = activeItems[0];
    const lastItem = activeItems[activeItems.length - 1];
    const middleItems = activeItems.slice(0, activeItems.length - 1);

    return (
        <Breadcrumb className="hidden md:block">
            {/* Desktop Layout (lg+): Show all items */}
            <BreadcrumbList className={isLong ? 'hidden lg:flex' : 'flex'}>
                {activeItems.map((item, index) => {
                    const isLast = index === activeItems.length - 1;
                    return (
                        <Fragment key={index}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={item.href || '#'}>{item.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>

            {/* Tablet (md) Layout: Show first and last items with static ellipsis "..." in middle (no dropdown) */}
            {isLong && (
                <BreadcrumbList className="flex lg:hidden">
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href={firstItem.href || '#'}>{firstItem.label}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="truncate max-w-[200px]">{lastItem.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            )}
        </Breadcrumb>
    );
}
