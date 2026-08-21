import { Link } from '@inertiajs/react';
import {
    CarProfileIcon,
    SquaresFourIcon,
    TagIcon,
    UsersThreeIcon,
} from '@phosphor-icons/react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as brandsIndex } from '@/routes/brands';
import { index as carsIndex } from '@/routes/cars';
import { index as customersIndex } from '@/routes/customers';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
        icon: SquaresFourIcon,
    },
    {
        title: 'Mobil',
        href: carsIndex.url(),
        icon: CarProfileIcon,
    },
    {
        title: 'Merek',
        href: brandsIndex.url(),
        icon: TagIcon,
    },
    {
        title: 'Customer',
        href: customersIndex.url(),
        icon: UsersThreeIcon,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
