<?php

namespace App\Http\Controllers;

use App\Concerns\HandlesFileUploads;
use App\Http\Requests\VehicleDocument\StoreVehicleDocumentRequest;
use App\Models\Car;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class VehicleDocumentController extends Controller
{
    use HandlesFileUploads;

    public function store(
        StoreVehicleDocumentRequest $request,
        Car $car,
    ): RedirectResponse {
        $validated = $request->validated();
        $uploadedFile = $request->file('file');
        $newFileAttributes = [];

        if ($uploadedFile instanceof UploadedFile) {
            $newFileAttributes = $this->storeAndExtractFileAttributes(
                $uploadedFile,
                "vehicle-documents/{$car->id}/shared",
                errorKey: 'file',
                errorMessage: 'Lampiran dokumen gagal disimpan. Silakan coba lagi.',
            );
        }

        $car->loadMissing('documentAttachment');
        $oldFilePath = $car->documentAttachment?->file_path;

        try {
            DB::transaction(function () use (
                $car,
                $validated,
                $newFileAttributes,
                $request,
            ): void {
                $stnk = $validated['stnk'];
                $bpkb = $validated['bpkb'];
                $invoice = $validated['invoice'];

                $car->documents()->updateOrCreate(
                    ['document_type' => 'stnk'],
                    [
                        'document_number' => null,
                        'owner_name' => $stnk['owner_name'] ?? null,
                        'issued_at' => $stnk['issued_at'] ?? null,
                        'expires_at' => $stnk['expires_at'] ?? null,
                        'annual_tax_due_at' => $stnk['annual_tax_due_at'] ?? null,
                        'status' => $stnk['status'],
                        'original_received' => $stnk['status'] === 'complete',
                        'notes' => null,
                    ],
                );

                $car->documents()->updateOrCreate(
                    ['document_type' => 'bpkb'],
                    [
                        'document_number' => null,
                        'owner_name' => $bpkb['owner_name'] ?? null,
                        'issued_at' => $bpkb['issued_at'] ?? null,
                        'expires_at' => null,
                        'status' => $bpkb['status'],
                        'original_received' => in_array(
                            $bpkb['status'],
                            ['ready', 'uncollected'],
                            true,
                        ),
                        'notes' => null,
                    ],
                );

                $car->documents()->updateOrCreate(
                    ['document_type' => 'invoice'],
                    [
                        'document_number' => null,
                        'owner_name' => null,
                        'issued_at' => null,
                        'expires_at' => null,
                        'status' => $invoice['status'],
                        'original_received' => $invoice['status'] === 'ready',
                        'notes' => null,
                    ],
                );

                if ($newFileAttributes !== []) {
                    $car->documentAttachment()->updateOrCreate(
                        [],
                        $newFileAttributes,
                    );
                } elseif ($request->boolean('remove_file')) {
                    $car->documentAttachment?->update([
                        'file_path' => null,
                        'file_name' => null,
                        'file_mime' => null,
                        'file_size' => null,
                    ]);
                }
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($newFileAttributes['file_path'] ?? null);

            throw $exception;
        }

        $fileWasReplaced = isset($newFileAttributes['file_path']);
        $fileWasRemoved = $request->boolean('remove_file') && ! $fileWasReplaced;

        if (
            $oldFilePath !== null
            && ($fileWasReplaced || $fileWasRemoved)
            && $oldFilePath !== ($newFileAttributes['file_path'] ?? null)
        ) {
            $this->deleteStoredFiles($oldFilePath);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data STNK, BPKB, dan faktur berhasil disimpan.',
        ]);

        return to_route('cars.show', $car);
    }

    public function download(Car $car): StreamedResponse
    {
        $attachment = $car->documentAttachment;

        abort_if(
            $attachment === null
                || $attachment->file_path === null
                || ! Storage::disk('local')->exists($attachment->file_path),
            404,
        );

        return Storage::disk('local')->download(
            $attachment->file_path,
            $attachment->file_name ?? basename($attachment->file_path),
        );
    }
}
