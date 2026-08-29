import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { DatePreset } from '@/lib/formatters';

interface DateRangeFilterProps {
    datePreset: DatePreset;
    onDatePresetChange: (val: DatePreset) => void;
    customStartDate: string;
    onCustomStartDateChange: (val: string) => void;
    customEndDate: string;
    onCustomEndDateChange: (val: string) => void;
    onReset?: () => void;
    className?: string;
}

export function DateRangeFilter({
    datePreset,
    onDatePresetChange,
    customStartDate,
    onCustomStartDateChange,
    customEndDate,
    onCustomEndDateChange,
    onReset,
    className = '',
}: DateRangeFilterProps) {
    return (
        <div
            className={`flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-xs ${className}`}
        >
            <div className="flex items-center gap-2">
                <CalendarBlankIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter Tanggal:</span>
            </div>

            <Select
                value={datePreset}
                onValueChange={(value) =>
                    onDatePresetChange(value as DatePreset)
                }
            >
                <SelectTrigger className="h-9 w-40 bg-background">
                    <SelectValue placeholder="Semua tanggal" />
                </SelectTrigger>
                <SelectContent align="start">
                    <SelectItem value="all">Semua tanggal</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="this_week">Minggu Ini</SelectItem>
                    <SelectItem value="this_month">Bulan Ini</SelectItem>
                    <SelectItem value="last_month">Bulan Lalu</SelectItem>
                    <SelectItem value="this_year">Tahun Ini</SelectItem>
                    <SelectItem value="custom">Rentang Kustom...</SelectItem>
                </SelectContent>
            </Select>

            {datePreset === 'custom' && (
                <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1 shadow-xs">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="custom-start-date" className="sr-only">
                            Tanggal Awal
                        </Label>
                        <Input
                            id="custom-start-date"
                            type="date"
                            value={customStartDate}
                            onChange={(e) =>
                                onCustomStartDateChange(e.target.value)
                            }
                            className="h-8 w-auto border-0 bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
                            aria-label="Tanggal awal"
                        />
                    </div>
                    <span className="text-sm text-muted-foreground">s/d</span>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="custom-end-date" className="sr-only">
                            Tanggal Akhir
                        </Label>
                        <Input
                            id="custom-end-date"
                            type="date"
                            value={customEndDate}
                            onChange={(e) =>
                                onCustomEndDateChange(e.target.value)
                            }
                            className="h-8 w-auto border-0 bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
                            aria-label="Tanggal akhir"
                        />
                    </div>
                </div>
            )}

            {onReset && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="ml-auto h-9 text-muted-foreground hover:text-foreground"
                >
                    <XIcon className="mr-1.5 size-4" />
                    Reset Filter
                </Button>
            )}
        </div>
    );
}
