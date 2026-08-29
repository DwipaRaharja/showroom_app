<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function index(): Response
    {
        $disk = Storage::disk('local');
        $appName = (string) config('backup.backup.name', 'laravel-backup');

        // Ensure directory exists
        if (! $disk->exists($appName)) {
            $disk->makeDirectory($appName);
        }

        $files = $disk->files($appName);

        $backups = collect($files)
            ->filter(fn ($file) => str_ends_with((string) $file, '.zip'))
            ->map(function ($file) use ($disk) {
                return [
                    'name' => basename((string) $file),
                    'size' => $disk->size((string) $file),
                    'date' => $disk->lastModified((string) $file),
                ];
            })
            ->sortByDesc('date')
            ->values();

        return Inertia::render('settings/backup', [
            'backups' => $backups,
        ]);
    }

    public function store(): RedirectResponse
    {
        try {
            if (PHP_OS_FAMILY === 'Windows') {
                $systemRoot = (string) (getenv('SystemRoot') ?: getenv('WINDIR') ?: 'C:\Windows');
                putenv("SystemRoot={$systemRoot}");
                putenv("WINDIR={$systemRoot}");
                $_ENV['SystemRoot'] = $systemRoot;
                $_ENV['WINDIR'] = $systemRoot;
                $_SERVER['SystemRoot'] = $systemRoot;
                $_SERVER['WINDIR'] = $systemRoot;
            }

            $exitCode = Artisan::call('backup:run', ['--only-db' => true]);

            if ($exitCode !== 0) {
                $output = Artisan::output();
                Log::error('Backup failed: '.$output);

                return back()->withErrors(['backup' => 'Gagal membuat backup database: '.$output]);
            }

            return back();
        } catch (\Throwable $e) {
            Log::error('Backup failed: '.$e->getMessage());

            return back()->withErrors(['backup' => 'Gagal membuat backup: '.$e->getMessage()]);
        }
    }

    public function download(string $fileName): BinaryFileResponse
    {
        $disk = Storage::disk('local');
        $appName = (string) config('backup.backup.name', 'laravel-backup');
        $path = $appName.'/'.$fileName;

        if (! $disk->exists($path)) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return response()->download($disk->path($path));
    }

    public function destroy(string $fileName): RedirectResponse
    {
        $disk = Storage::disk('local');
        $appName = (string) config('backup.backup.name', 'laravel-backup');
        $path = $appName.'/'.$fileName;

        if ($disk->exists($path)) {
            $disk->delete($path);
        }

        return back();
    }
}
