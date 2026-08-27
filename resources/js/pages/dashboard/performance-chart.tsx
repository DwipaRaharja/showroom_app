import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { PerformancePoint } from '@/pages/dashboard/types';

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
                <div className="grid h-60 grid-cols-6 items-end gap-2 border-b sm:gap-4">
                    {data.map((point) => {
                        const turnoverHeight = Math.max(
                            point.turnover > 0 ? 6 : 2,
                            (point.turnover / maximum) * 176,
                        );
                        const paymentHeight = Math.max(
                            point.payments > 0 ? 6 : 2,
                            (point.payments / maximum) * 176,
                        );

                        return (
                            <div
                                key={point.key}
                                className="flex h-full min-w-0 flex-col justify-end gap-2"
                            >
                                <div className="flex flex-1 items-end justify-center gap-1 sm:gap-2">
                                    <div
                                        className="w-full max-w-7 rounded-t-md bg-blue-500 transition-[height]"
                                        style={{ height: turnoverHeight }}
                                        title={`${point.label}: nilai penjualan ${compactCurrencyFormatter.format(point.turnover)}`}
                                        aria-label={`${point.label}, nilai penjualan ${compactCurrencyFormatter.format(point.turnover)}`}
                                    />
                                    <div
                                        className="w-full max-w-7 rounded-t-md bg-emerald-500 transition-[height]"
                                        style={{ height: paymentHeight }}
                                        title={`${point.label}: pembayaran masuk ${compactCurrencyFormatter.format(point.payments)}`}
                                        aria-label={`${point.label}, pembayaran masuk ${compactCurrencyFormatter.format(point.payments)}`}
                                    />
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
