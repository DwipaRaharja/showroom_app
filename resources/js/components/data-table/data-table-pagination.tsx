import {
    CaretDoubleLeftIcon,
    CaretDoubleRightIcon,
    CaretLeftIcon,
    CaretRightIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type DataTablePaginationTable = {
    state: {
        pagination: {
            pageIndex: number;
            pageSize: number;
        };
    };
    getPageCount: () => number;
    getFilteredRowModel: () => {
        rows: unknown[];
    };
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    setPageSize: (pageSize: number) => void;
    firstPage: () => void;
    previousPage: () => void;
    nextPage: () => void;
    lastPage: () => void;
};

type TableProps = {
    table: DataTablePaginationTable;
    pageSizeOptions?: number[];
};

type ManualProps = {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    filteredCount: number;
    canPreviousPage: boolean;
    canNextPage: boolean;
    onPageSizeChange: (pageSize: number) => void;
    onFirstPage: () => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onLastPage: () => void;
    pageSizeOptions?: number[];
};

type Props = TableProps | ManualProps;

const defaultPageSizeOptions = [10, 20, 50];

export function DataTablePagination(props: Props) {
    const pageSizeOptions = props.pageSizeOptions ?? defaultPageSizeOptions;

    let pageIndex: number;
    let pageSize: number;
    let pageCount: number;
    let filteredCount: number;
    let canPreviousPage: boolean;
    let canNextPage: boolean;
    let onPageSizeChange: (pageSize: number) => void;
    let onFirstPage: () => void;
    let onPreviousPage: () => void;
    let onNextPage: () => void;
    let onLastPage: () => void;

    if ('table' in props) {
        const { table } = props;
        pageIndex = table.state.pagination.pageIndex;
        pageSize = table.state.pagination.pageSize;
        pageCount = Math.max(table.getPageCount(), 1);
        filteredCount = table.getFilteredRowModel().rows.length;
        canPreviousPage = table.getCanPreviousPage();
        canNextPage = table.getCanNextPage();
        onPageSizeChange = (size) => table.setPageSize(size);
        onFirstPage = () => table.firstPage();
        onPreviousPage = () => table.previousPage();
        onNextPage = () => table.nextPage();
        onLastPage = () => table.lastPage();
    } else {
        pageIndex = props.pageIndex;
        pageSize = props.pageSize;
        pageCount = props.pageCount;
        filteredCount = props.filteredCount;
        canPreviousPage = props.canPreviousPage;
        canNextPage = props.canNextPage;
        onPageSizeChange = props.onPageSizeChange;
        onFirstPage = props.onFirstPage;
        onPreviousPage = props.onPreviousPage;
        onNextPage = props.onNextPage;
        onLastPage = props.onLastPage;
    }
    const firstVisibleRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
    const lastVisibleRow = Math.min((pageIndex + 1) * pageSize, filteredCount);

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
                Menampilkan {firstVisibleRow}–{lastVisibleRow} dari{' '}
                {filteredCount} data
            </p>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm">Baris per halaman</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) =>
                            onPageSizeChange(Number(value))
                        }
                    >
                        <SelectTrigger size="sm" className="w-18">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end" className="min-w-18">
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <span className="min-w-28 text-center text-sm font-medium">
                    Halaman {pageIndex + 1} dari {pageCount}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={onFirstPage}
                        disabled={!canPreviousPage}
                        aria-label="Halaman pertama"
                    >
                        <CaretDoubleLeftIcon />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={onPreviousPage}
                        disabled={!canPreviousPage}
                        aria-label="Halaman sebelumnya"
                    >
                        <CaretLeftIcon />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={onNextPage}
                        disabled={!canNextPage}
                        aria-label="Halaman berikutnya"
                    >
                        <CaretRightIcon />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={onLastPage}
                        disabled={!canNextPage}
                        aria-label="Halaman terakhir"
                    >
                        <CaretDoubleRightIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
}
