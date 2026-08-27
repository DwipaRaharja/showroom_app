import { Head } from '@inertiajs/react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
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
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Tambah proses berkas
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Catat pengurusan pajak, balik nama, mutasi, atau
                        pekerjaan dokumen kendaraan lainnya.
                    </p>
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
