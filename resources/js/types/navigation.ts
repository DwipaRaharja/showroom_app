import type { InertiaLinkProps } from '@inertiajs/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | PhosphorIcon | null;
    isActive?: boolean;
};

export type NavGroup = {
    title?: string;
    items: NavItem[];
};
