<?php

declare(strict_types=1);

namespace App\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

trait HandlesFileUploads
{
    /**
     * Store an uploaded file to a specific directory on a given disk.
     *
     * @throws ValidationException
     */
    protected function storeUploadedFile(
        UploadedFile $file,
        string $directory,
        string $disk = 'local',
        string $errorKey = 'file',
        string $errorMessage = 'Berkas gagal disimpan. Silakan coba lagi.',
    ): string {
        $path = $file->store($directory, $disk);

        if (! is_string($path)) {
            throw ValidationException::withMessages([
                $errorKey => $errorMessage,
            ]);
        }

        return $path;
    }

    /**
     * Extract standard database attributes for a stored file.
     *
     * @return array{file_path: string, file_name: string, file_mime: string|null, file_size: int}
     */
    protected function extractFileAttributes(UploadedFile $file, string $path): array
    {
        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getMimeType() ?: null,
            'file_size' => (int) $file->getSize(),
        ];
    }

    /**
     * Store an uploaded file and return its database attributes.
     *
     * @return array{file_path: string, file_name: string, file_mime: string|null, file_size: int}
     *
     * @throws ValidationException
     */
    protected function storeAndExtractFileAttributes(
        UploadedFile $file,
        string $directory,
        string $disk = 'local',
        string $errorKey = 'file',
        string $errorMessage = 'Berkas gagal disimpan. Silakan coba lagi.',
    ): array {
        $path = $this->storeUploadedFile($file, $directory, $disk, $errorKey, $errorMessage);

        return $this->extractFileAttributes($file, $path);
    }

    /**
     * Safely delete multiple paths from disk.
     *
     * @param  array<int, string>|string|null  $paths
     */
    protected function deleteStoredFiles(array|string|null $paths, string $disk = 'local'): void
    {
        if ($paths === null || $paths === [] || $paths === '') {
            return;
        }

        Storage::disk($disk)->delete($paths);
    }
}
