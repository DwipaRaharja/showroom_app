import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4 sm:p-6 md:p-10 dark:bg-background">
            <div className="grid min-h-[580px] w-full max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl lg:grid-cols-12">
                {/* Sisi Kiri: Branding Showroom Management */}
                <div className="relative hidden flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 p-10 text-white lg:col-span-6 lg:flex xl:col-span-6 dark:border-r dark:border-neutral-800">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,119,198,0.15),transparent_50%)]" />

                    {/* Header Logo */}
                    <Link
                        href={home()}
                        className="relative z-10 flex items-center gap-3 text-lg font-semibold tracking-tight text-white hover:opacity-90"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <span>Showroom Management App</span>
                    </Link>

                    {/* Content Tengah: Showroom Management + Subtext */}
                    <div className="relative z-10 my-auto space-y-4 py-12">
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300 backdrop-blur-sm">
                            Aplikasi Manajemen
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white xl:text-4xl">
                            Showroom Management App
                        </h2>
                        <p className="text-sm leading-relaxed text-neutral-300/90 xl:text-base">
                            Aplikasi yang berfungsi mengatur proses internal
                            dari showroom mobil bekas
                        </p>
                    </div>

                    {/* Footer Copyright */}
                    <div className="relative z-10 text-xs text-neutral-400">
                        &copy; {new Date().getFullYear()} Treaze Teams. All
                        rights reserved.
                    </div>
                </div>

                {/* Sisi Kanan: Seluruh Konten Form Login */}
                <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-6 xl:col-span-6">
                    <div className="mx-auto w-full max-w-sm space-y-6">
                        {/* Mobile Header Logo (hanya tampil di layar mobile/kecil) */}
                        <div className="flex flex-col items-center gap-2 text-center lg:hidden">
                            <Link
                                href={home()}
                                className="flex items-center gap-2 font-semibold"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <AppLogoIcon className="size-6 fill-current" />
                                </div>
                                <span className="text-lg">
                                    Showroom Management App
                                </span>
                            </Link>
                        </div>

                        {/* Title & Description Form Header */}
                        <div className="space-y-1.5 text-center lg:text-left">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Form Body */}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
