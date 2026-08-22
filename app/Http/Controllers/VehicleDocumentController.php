<?php

namespace App\Http\Controllers;

use App\Http\Requests\VehicleDocument\StoreVehicleDocumentRequest;
use App\Http\Requests\VehicleDocument\UpdateVehicleDocumentRequest;
use App\Models\Car;
use App\Models\VehicleDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class VehicleDocumentController extends Controller
{
    public function store(
        StoreVehicleDocumentRequest $request,
        Car $car,
    ): RedirectResponse {
        $validated = $request->validated();
        $fileAttributes = [];

        $uploadedFile = $request->file('file');

        if ($uploadedFile instanceof UploadedFile) {
            $fileAttributes = $this->storeFile($uploadedFile, $car);
        }

        try {
            $car->documents()->create([
                ...Arr::except($validated, ['file', 'remove_file']),
                ...$fileAttributes,
            ]);
        } catch (Throwable $exception) {
            if (isset($fileAttributes['file_path'])) {
                Storage::disk('local')->delete($fileAttributes['file_path']);
            }

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Dokumen kendaraan berhasil ditambahkan.',
        ]);

        return to_route('cars.index');
    }

    public function update(
        UpdateVehicleDocumentRequest $request,
        VehicleDocument $vehicleDocument,
    ): RedirectResponse {
        $validated = $request->validated();
        $oldFilePath = $vehicleDocument->file_path;
        $fileAttributes = [];

        $uploadedFile = $request->file('file');

        if ($uploadedFile instanceof UploadedFile) {
            $car = $vehicleDocument->car;

            abort_unless($car instanceof Car, 404);

            $fileAttributes = $this->storeFile(
                $uploadedFile,
                $car,
            );
        } elseif ($request->boolean('remove_file')) {
            $fileAttributes = [
                'file_path' => null,
                'file_name' => null,
                'file_mime' => null,
                'file_size' => null,
            ];
        }

        try {
            $vehicleDocument->update([
                ...Arr::except($validated, ['file', 'remove_file']),
                ...$fileAttributes,
            ]);
        } catch (Throwable $exception) {
            if (isset($fileAttributes['file_path'])) {
                Storage::disk('local')->delete($fileAttributes['file_path']);
            }

            throw $exception;
        }

        if ($oldFilePath !== null && array_key_exists('file_path', $fileAttributes)) {
            Storage::disk('local')->delete($oldFilePath);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Dokumen kendaraan berhasil diperbarui.',
        ]);

        return to_route('cars.index');
    }

    public function download(VehicleDocument $vehicleDocument): StreamedResponse
    {
        abort_if(
            $vehicleDocument->file_path === null
                || ! Storage::disk('local')->exists($vehicleDocument->file_path),
            404,
        );

        return Storage::disk('local')->download(
            $vehicleDocument->file_path,
            $vehicleDocument->file_name ?? basename($vehicleDocument->file_path),
        );
    }

    public function destroy(VehicleDocument $vehicleDocument): RedirectResponse
    {
        $vehicleDocument->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Dokumen kendaraan berhasil dihapus.',
        ]);

        return to_route('cars.index');
    }

    /**
     * @return array{file_path: string, file_name: string, file_mime: string|null, file_size: int}
     */
    private function storeFile(UploadedFile $file, Car $car): array
    {
        $path = $file->store("vehicle-documents/{$car->id}", 'local');

        if ($path === false) {
            throw ValidationException::withMessages([
                'file' => 'Berkas dokumen gagal disimpan. Silakan coba lagi.',
            ]);
        }

        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getMimeType() ?: null,
            'file_size' => (int) $file->getSize(),
        ];
    }
}
