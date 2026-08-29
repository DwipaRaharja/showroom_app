<?php

declare(strict_types=1);

namespace App\Actions;

use App\Concerns\HandlesFileUploads;
use App\Models\Car;
use App\Models\DocumentProcess;
use App\Models\DocumentProcessEvent;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class RecordDocumentProcessEvent
{
    use HandlesFileUploads;

    public function __construct(
        private readonly ApplyDocumentProcessResult $applyResultAction
    ) {}

    /**
     * @param array<string, mixed> $validated
     * @param array<int, UploadedFile> $files
     * @throws ValidationException|Throwable
     */
    public function execute(DocumentProcess $documentProcess, array $validated, array $files, ?int $userId = null): void
    {
        $storedPaths = [];

        try {
            DB::transaction(function () use (
                $documentProcess,
                $validated,
                $files,
                $userId,
                &$storedPaths,
            ): void {
                Car::query()->lockForUpdate()->findOrFail($documentProcess->car_id);

                /** @var DocumentProcess $process */
                $process = DocumentProcess::query()
                    ->with(['car.documents', 'items'])
                    ->lockForUpdate()
                    ->findOrFail($documentProcess->id);

                if (in_array($process->status, ['completed', 'cancelled'], true)) {
                    throw ValidationException::withMessages([
                        'status' => 'Proses yang sudah selesai atau dibatalkan tidak dapat diperbarui.',
                    ]);
                }

                /** @var DocumentProcessEvent $event */
                $event = $process->events()->create([
                    'status' => $validated['status'],
                    'occurred_at' => $validated['occurred_at'],
                    'description' => $validated['description'],
                    'location' => $validated['location'] ?? null,
                    'recipient_name' => $validated['recipient_name'] ?? null,
                    'recipient_phone' => $validated['recipient_phone'] ?? null,
                    'recipient_relation' => $validated['recipient_relation'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                    'result_data' => $validated['result'] ?? null,
                    'created_by' => $userId,
                ]);

                $receivedItems = $validated['received_items'] ?? [];
                $receivedItemIds = is_array($receivedItems)
                    ? array_values(array_map(
                        static fn (mixed $id): int => (int) $id,
                        $receivedItems,
                    ))
                    : [];

                $process->items()
                    ->whereKey($receivedItemIds)
                    ->update([
                        'custody_status' => 'received',
                        'received_at' => $validated['occurred_at'],
                    ]);

                if ($validated['status'] === 'completed') {
                    $process->items()
                        ->whereIn('custody_status', ['waiting', 'missing'])
                        ->update([
                            'custody_status' => 'received',
                            'received_at' => $validated['occurred_at'],
                        ]);

                    $this->applyResultAction->execute($process, $validated['result'] ?? []);
                }

                $process->update([
                    'status' => $validated['status'],
                    'completed_at' => $validated['status'] === 'completed'
                        ? $validated['occurred_at']
                        : $process->completed_at,
                    'cancelled_at' => $validated['status'] === 'cancelled'
                        ? $validated['occurred_at']
                        : null,
                ]);

                $fileIndex = 1;
                $timestamp = time();
                foreach ($files as $file) {
                    $customName = "proses-berkas-{$process->process_number}-{$event->status}-{$fileIndex}-{$timestamp}";

                    $attributes = $this->storeAndExtractFileAttributes(
                        $file,
                        "document-processes/{$process->id}/events/{$event->id}",
                        $customName,
                        errorKey: 'files',
                        errorMessage: 'Berkas gagal disimpan. Silakan coba lagi.',
                    );
                    $storedPaths[] = $attributes['file_path'];
                    $process->files()->create([
                        'document_process_event_id' => $event->id,
                        'uploaded_by' => $userId,
                        'file_category' => 'event_evidence',
                        ...$attributes,
                    ]);
                    $fileIndex++;
                }

                $process->syncCarCapital();
            });
        } catch (Throwable $exception) {
            $this->deleteStoredFiles($storedPaths);
            throw $exception;
        }
    }
}
