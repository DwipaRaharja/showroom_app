import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PerformancePoint } from '@/pages/dashboard/types';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
});

type Props = {
    data: PerformancePoint[];
};

export function PerformanceChart({ data }: Props) {
    const maximum = Math.max(
        ...data.flatMap((point) => [point.turnover, point.payments]),
        1,
    );

    return (
        <Card className="min-w-0">
            <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle>Performa Enam Bulan</CardTitle>
                        <CardDescription>
                            Nilai transaksi dibandingkan dengan pembayaran yang
                            benar-benar diterima.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-blue-500" />
                            Nilai penjualan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-emerald-500" />
                            Pembayaran masuk
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider delayDuration={50}>
                    <div className="grid h-60 grid-cols-6 items-end gap-2 border-b sm:gap-4">
                        {data.map((point) => {
                            const turnoverHeight = Math.max(
                                point.turnover > 0 ? 8 : 3,
                                (point.turnover / maximum) * 176,
                            );
                            const paymentHeight = Math.max(
                                point.payments > 0 ? 8 : 3,
                                (point.payments / maximum) * 176,
                            );

                            return (
                                <div
                                    key={point.key}
                                    className="flex h-full min-w-0 flex-col justify-end gap-2"
                                >
                                    <div className="flex flex-1 items-end justify-center gap-1 sm:gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="w-full max-w-7 cursor-pointer rounded-t-md bg-blue-500 transition-all duration-150 hover:bg-blue-600 hover:shadow-md hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
                                                    style={{
                                                        height: turnoverHeight,
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`${point.label}, Nilai Penjualan: ${currencyFormatter.format(point.turnover)}`}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className="border border-border/80 bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-sm"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                        <span className="size-2 rounded-full bg-blue-500" />
                                                        <span>
                                                            {point.label} ·
                                                            Nilai Penjualan
                                                        </span>
                                                    </div>
                                                    <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                                                        {currencyFormatter.format(
                                                            point.turnover,
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {point.sales_count}{' '}
                                                        transaksi penjualan
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="w-full max-w-7 cursor-pointer rounded-t-md bg-emerald-500 transition-all duration-150 hover:bg-emerald-600 hover:shadow-md hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                                                    style={{
                                                        height: paymentHeight,
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`${point.label}, Pembayaran Masuk: ${currencyFormatter.format(point.payments)}`}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className="border border-border/80 bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-sm"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                        <span className="size-2 rounded-full bg-emerald-500" />
                                                        <span>
                                                            {point.label} ·
                                                            Pembayaran Masuk
                                                        </span>
                                                    </div>
                                                    <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                        {currencyFormatter.format(
                                                            point.payments,
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        Realisasi kas masuk
                                                        showroom
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="pb-2 text-center">
                                        <p className="truncate text-[11px] font-medium sm:text-xs">
                                            {point.label}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {point.sales_count} transaksi
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TooltipProvider>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                        Total nilai penjualan:{' '}
                        <span className="font-semibold text-foreground">
                            {compactCurrencyFormatter.format(
                                data.reduce(
                                    (total, point) => total + point.turnover,
                                    0,
                                ),
                            )}
                        </span>
                    </p>
                    <p className="sm:text-right">
                        Total pembayaran masuk:{' '}
                        <span className="font-semibold text-foreground">
                            {compactCurrencyFormatter.format(
                                data.reduce(
                                    (total, point) => total + point.payments,
                                    0,
                                ),
                            )}
                        </span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
