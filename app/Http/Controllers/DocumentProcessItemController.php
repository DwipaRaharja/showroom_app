<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentProcess\UpdateDocumentProcessItemRequest;
use App\Models\DocumentProcessItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DocumentProcessItemController extends Controller
{
    public function update(
        UpdateDocumentProcessItemRequest $request,
        DocumentProcessItem $documentProcessItem,
    ): RedirectResponse {
        $validated = $request->validated();
        $documentProcessItem->load([
            'documentProcess.sale',
            'vehicleDocument',
        ]);

        $process = $documentProcessItem->documentProcess;
        $sale = $process->sale;

        if ($process->status === 'cancelled') {
            throw ValidationException::withMessages([
                'status' => 'Checklist pada proses yang dibatalkan tidak dapat diubah.',
            ]);
        }

        if (
            in_array($validated['status'], ['ready', 'completed', 'handed_over'], true)
            && (
                ! $documentProcessItem->vehicleDocument
                || $documentProcessItem->vehicleDocument->status !== 'complete'
                || ! $documentProcessItem->vehicleDocument->original_received
            )
        ) {
            throw ValidationException::withMessages([
                'status' => 'Dokumen asli harus tercatat lengkap sebelum melanjutkan status ini.',
            ]);
        }

        if ($validated['status'] === 'handed_over' && ! $sale->is_settled) {
            throw ValidationException::withMessages([
                'status' => 'Dokumen belum dapat diserahkan karena transaksi penjualan belum lunas.',
            ]);
        }

        DB::transaction(function () use ($validated, $documentProcessItem, $process, $request): void {
            $oldStatus = $documentProcessItem->status;

            if ($validated['status'] !== 'handed_over') {
                $validated['handed_over_at'] = null;
            }

            $documentProcessItem->update($validated);
            $process->refreshWorkflowStatus();
            $process->activities()->create([
                'user_id' => $request->user()?->id,
                'type' => 'item_updated',
                'description' => "Status {$documentProcessItem->document_type} diubah dari {$oldStatus} menjadi {$validated['status']}.",
                'metadata' => [
                    'document_type' => $documentProcessItem->document_type,
                    'old_status' => $oldStatus,
                    'new_status' => $validated['status'],
                ],
            ]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Checklist dokumen berhasil diperbarui.',
        ]);

        return back();
    }
}
