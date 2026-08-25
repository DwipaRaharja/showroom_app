import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

type NavMainProps = {
    groups?: NavGroup[];
    items?: NavItem[];
};

export function NavMain({ groups, items }: NavMainProps) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const normalizedGroups: NavGroup[] = groups ?? [
        {
            title: 'Menu',
            items: items ?? [],
        },
    ];

    return (
        <div className="space-y-2">
            {normalizedGroups.map((group, groupIdx) => (
                <SidebarGroup key={group.title ?? groupIdx} className="px-2 py-0">
                    {group.title && (
                        <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {group.title}
                        </SidebarGroupLabel>
                    )}
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentOrParentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </div>
    );
}

