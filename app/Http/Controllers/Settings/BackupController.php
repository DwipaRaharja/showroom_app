<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class BackupController extends Controller
{
    public function index()
    {
        $disk = Storage::disk('local');
        $appName = config('backup.backup.name');
        
        // Ensure directory exists
        if (!$disk->exists($appName)) {
            $disk->makeDirectory($appName);
        }
        
        $files = $disk->files($appName);
        
        $backups = collect($files)
            ->filter(fn($file) => str_ends_with($file, '.zip'))
            ->map(function ($file) use ($disk) {
                return [
                    'name' => basename($file),
                    'size' => $disk->size($file),
                    'date' => $disk->lastModified($file),
                ];
            })
            ->sortByDesc('date')
            ->values();

        return inertia('settings/backup', [
            'backups' => $backups,
        ]);
    }

    public function store()
    {
        try {
            Artisan::call('backup:run', ['--only-db' => true]);
            return back();
        } catch (\Exception $e) {
            Log::error('Backup failed: ' . $e->getMessage());
            return back()->withErrors(['backup' => 'Gagal membuat backup: ' . $e->getMessage()]);
        }
    }

    public function download($fileName)
    {
        $disk = Storage::disk('local');
        $appName = config('backup.backup.name');
        $path = $appName . '/' . $fileName;

        if (! $disk->exists($path)) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return response()->download($disk->path($path));
    }

    public function destroy($fileName)
    {
        $disk = Storage::disk('local');
        $appName = config('backup.backup.name');
        $path = $appName . '/' . $fileName;

        if ($disk->exists($path)) {
            $disk->delete($path);
        }

        return back();
    }
}
