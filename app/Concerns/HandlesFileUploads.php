<?php

declare(strict_types=1);

namespace App\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

trait HandlesFileUploads
{
    /**
     * Sanitize and format a clean filename with extension.
     */
    protected function sanitizeFileName(string $name, ?string $extension = null): string
    {
        $cleanExt = $extension !== null && $extension !== ''
            ? strtolower(ltrim($extension, '.'))
            : null;

        if ($cleanExt !== null) {
            $baseName = $name;
            if (str_ends_with(strtolower($baseName), '.'.$cleanExt)) {
                $baseName = substr($baseName, 0, -(strlen($cleanExt) + 1));
            }
            $slugged = Str::slug($baseName);
        } else {
            $info = pathinfo($name);
            $slugged = Str::slug($info['filename']);
            $cleanExt = strtolower(ltrim($info['extension'] ?? '', '.'));
        }

        if ($slugged === '') {
            $slugged = 'file';
        }

        return $cleanExt !== '' ? "{$slugged}.{$cleanExt}" : $slugged;
    }

    /**
     * Store an uploaded file to a specific directory on a given disk with an optional customized/sanitized name.
     *
     * @throws ValidationException
     */
    protected function storeUploadedFile(
        UploadedFile $file,
        string $directory,
        ?string $customFileName = null,
        string $disk = 'local',
        string $errorKey = 'file',
        string $errorMessage = 'Berkas gagal disimpan. Silakan coba lagi.',
    ): string {
        if ($customFileName !== null && $customFileName !== '') {
            $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
            $finalName = $this->sanitizeFileName($customFileName, $extension);
            $path = $file->storeAs($directory, $finalName, $disk);
        } else {
            $path = $file->store($directory, $disk);
        }

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
    protected function extractFileAttributes(
        UploadedFile $file,
        string $path,
        ?string $customDisplayName = null,
    ): array {
        $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: '';
        $fileName = $customDisplayName !== null && $customDisplayName !== ''
            ? $this->sanitizeFileName($customDisplayName, $extension)
            : $this->sanitizeFileName($file->getClientOriginalName(), $extension);

        return [
            'file_path' => $path,
            'file_name' => $fileName,
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
        ?string $customFileName = null,
        string $disk = 'local',
        string $errorKey = 'file',
        string $errorMessage = 'Berkas gagal disimpan. Silakan coba lagi.',
    ): array {
        $path = $this->storeUploadedFile(
            $file,
            $directory,
            $customFileName,
            $disk,
            $errorKey,
            $errorMessage,
        );

        return $this->extractFileAttributes($file, $path, $customFileName);
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
