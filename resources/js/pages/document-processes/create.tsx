import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { Button } from '@/components/ui/button';
import { ProcessForm } from '@/pages/document-processes/process-form';
import type {
    LabelOptions,
    ProcessCar,
    UserOption,
} from '@/pages/document-processes/types';

type Props = {
    cars: ProcessCar[];
    selected_car_id: number | null;
    users: UserOption[];
    type_options: LabelOptions;
};

export default function DocumentProcessesCreate({
    cars,
    selected_car_id: selectedCarId,
    users,
    type_options: typeOptions,
}: Props) {
    return (
        <>
            <Head title="Tambah Proses Berkas" />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={DocumentProcessController.index.url()}
                            aria-label="Kembali ke proses berkas"
                        >
                            <ArrowLeftIcon />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Tambah Proses Berkas
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Catat pengurusan pajak, balik nama, mutasi, atau
                            pekerjaan dokumen kendaraan lainnya.
                        </p>
                    </div>
                </div>

                <ProcessForm
                    cars={cars}
                    users={users}
                    typeOptions={typeOptions}
                    initialCarId={selectedCarId}
                />
            </div>
        </>
    );
}

DocumentProcessesCreate.layout = {
    breadcrumbs: [
        {
            title: 'Proses Berkas',
            href: DocumentProcessController.index.url(),
        },
        {
            title: 'Tambah Proses',
            href: DocumentProcessController.create.url(),
        },
    ],
};
