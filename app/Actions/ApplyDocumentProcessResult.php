<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\DocumentProcess;

class ApplyDocumentProcessResult
{
    /**
     * Apply mutations to the car documents and license plate based on the process result.
     *
     * @param  array<string, mixed>  $result
     */
    public function execute(DocumentProcess $process, array $result): void
    {
        if (isset($result['annual_tax_due_at']) || isset($result['stnk_expires_at'])) {
            $stnk = $process->car->documents()->firstOrCreate(
                ['document_type' => 'stnk'],
                ['status' => 'incomplete', 'original_received' => false],
            );
        }

        if (isset($stnk, $result['annual_tax_due_at'])) {
            $stnk->update([
                'annual_tax_due_at' => $result['annual_tax_due_at'],
                'status' => 'complete',
                'original_received' => true,
            ]);
        }

        if (isset($stnk, $result['stnk_expires_at'])) {
            $stnk->update([
                'expires_at' => $result['stnk_expires_at'],
                'status' => 'complete',
                'original_received' => true,
            ]);
        }

        $ownerName = $result['owner_name']
            ?? ($process->process_type === 'name_transfer'
                ? $process->target_owner_name
                : null);

        if (is_string($ownerName) && filled($ownerName)) {
            foreach (['stnk', 'bpkb'] as $documentType) {
                $process->car->documents()->firstOrCreate(
                    ['document_type' => $documentType],
                    ['status' => 'incomplete', 'original_received' => false],
                )->update(['owner_name' => $ownerName]);
            }
        }

        if (isset($result['license_plate'])) {
            $process->car->update(['license_plate' => $result['license_plate']]);
        }
    }
}
