import { Head } from '@inertiajs/react';
import DocumentProcessController from '@/actions/App/Http/Controllers/DocumentProcessController';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
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

            <PageContainer className="mx-auto w-full max-w-5xl">
                <PageHeader
                    title="Tambah proses berkas"
                    description="Catat pengurusan pajak, balik nama, mutasi, atau pekerjaan dokumen kendaraan lainnya."
                />

                <ProcessForm
                    cars={cars}
                    users={users}
                    typeOptions={typeOptions}
                    initialCarId={selectedCarId}
                />
            </PageContainer>
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
