import { Link } from '@inertiajs/react';
import {
    BankIcon,
    CarProfileIcon,
    ClipboardTextIcon,
    HandCoinsIcon,
    KeyIcon,
    SquaresFourIcon,
    TagIcon,
    UsersThreeIcon,
} from '@phosphor-icons/react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
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
import { index as financeCompaniesIndex } from '@/routes/finance-companies';
import { index as salesIndex } from '@/routes/sales';
import type { NavGroup, NavItem } from '@/types';

const mainNavGroups: NavGroup[] = [
    {
        title: 'Ringkasan',
        items: [
            {
                title: 'Dashboard',
                href: dashboard.url(),
                icon: SquaresFourIcon,
            },
        ],
    },
    {
        title: 'Transaksi',
        items: [
            {
                title: 'Penjualan',
                href: salesIndex.url(),
                icon: HandCoinsIcon,
            },
        ],
    },
    {
        title: 'Operasional',
        items: [
            {
                title: 'Penyerahan Unit',
                href: VehicleHandoverController.index.url(),
                icon: KeyIcon,
            },
            {
                title: 'Proses Berkas',
                href: DocumentProcessController.index.url(),
                icon: ClipboardTextIcon,
            },
        ],
    },
    {
        title: 'Inventaris',
        items: [
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
        ],
    },
    {
        title: 'Relasi',
        items: [
            {
                title: 'Customer',
                href: customersIndex.url(),
                icon: UsersThreeIcon,
            },
            {
                title: 'Leasing',
                href: financeCompaniesIndex.url(),
                icon: BankIcon,
            },
        ],
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
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
