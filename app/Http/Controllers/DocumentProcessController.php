<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\DocumentProcess\StoreDocumentProcessCostRequest;
use App\Http\Requests\DocumentProcess\StoreDocumentProcessEventRequest;
use App\Http\Requests\DocumentProcess\StoreDocumentProcessRequest;
use App\Models\Car;
use App\Models\DocumentProcess;
use App\Models\DocumentProcessCost;
use App\Models\DocumentProcessEvent;
use App\Models\DocumentProcessFile;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class DocumentProcessController extends Controller
{
    /** @var array<string, array<string, string>> */
    private const REQUIREMENT_TEMPLATES = [
        'annual_tax' => [
            'stnk' => 'STNK asli',
            'owner_id' => 'KTP pemilik',
        ],
        'five_year_tax' => [
            'stnk' => 'STNK asli',
            'bpkb' => 'BPKB asli',
            'owner_id' => 'KTP pemilik',
            'physical_check' => 'Hasil cek fisik kendaraan',
        ],
        'name_transfer' => [
            'stnk' => 'STNK asli',
            'bpkb' => 'BPKB asli',
            'invoice' => 'Faktur kendaraan',
            'receipt' => 'Kuitansi pembelian bermeterai',
            'new_owner_id' => 'KTP pemilik baru',
        ],
        'mutation' => [
            'stnk' => 'STNK asli',
            'bpkb' => 'BPKB asli',
            'invoice' => 'Faktur kendaraan',
            'owner_id' => 'KTP pemilik',
            'physical_check' => 'Hasil cek fisik kendaraan',
        ],
        'document_reissue' => [
            'police_report' => 'Surat kehilangan kepolisian',
            'owner_id' => 'KTP pemilik',
            'document_copy' => 'Salinan dokumen lama',
        ],
        'other' => [
            'supporting_document' => 'Dokumen pendukung',
        ],
    ];

    public function index(): Response
    {
        $processes = DocumentProcess::query()
            ->with([
                'car.brand:id,name',
                'customer:id,name,phone',
                'assignee:id,name',
                'items',
                'events.creator:id,name',
                'costs',
                'files',
            ])
            ->latest('id')
            ->get();

        $activeStatuses = [
            'waiting_documents',
            'documents_ready',
            'submitted',
            'processing',
            'ready_for_pickup',
            'issue',
        ];

        return Inertia::render('document-processes/index', [
            'processes' => $processes,
            'summary' => [
                'active' => $processes->whereIn('status', $activeStatuses)->count(),
                'overdue' => $processes
                    ->whereIn('status', $activeStatuses)
                    ->filter(function (DocumentProcess $process): bool {
                        $targetDate = $process->getRawOriginal(
                            'estimated_completion_date',
                        );

                        return is_string($targetDate)
                            && $targetDate < today()->toDateString();
                    })->count(),
                'completed' => $processes->whereIn('status', ['completed', 'returned'])->count(),
                'capitalized_cost' => (int) $processes
                    ->where('status', '!=', 'cancelled')
                    ->sum('capitalized_cost'),
            ],
            'type_options' => DocumentProcess::TYPE_LABELS,
            'status_options' => DocumentProcess::STATUS_LABELS,
        ]);
    }

    public function create(Request $request): Response
    {
        $cars = Car::query()
            ->with([
                'brand:id,name',
                'sale.customer:id,name,phone',
                'capital:id,car_id,status,document_process_cost',
            ])
            ->latest('id')
            ->get([
                'id',
                'brand_id',
                'name',
                'license_plate',
                'status',
            ]);
        $selectedCarId = $request->integer('car_id');

        return Inertia::render('document-processes/create', [
            'cars' => $cars,
            'selected_car_id' => $cars->contains('id', $selectedCarId)
                ? $selectedCarId
                : null,
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
            'type_options' => DocumentProcess::TYPE_LABELS,
        ]);
    }

    public function store(StoreDocumentProcessRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        /** @var DocumentProcess $process */
        $process = DB::transaction(function () use ($request, $validated): DocumentProcess {
            /** @var Car $car */
            $car = Car::query()
                ->with(['sale.customer', 'documents'])
                ->lockForUpdate()
                ->findOrFail($validated['car_id']);
            $sale = $this->resolveSale($car, $validated['sale_id'] ?? null);

            /** @var DocumentProcess $process */
            $process = DocumentProcess::query()->create([
                'car_id' => $car->id,
                'sale_id' => $sale?->id,
                'customer_id' => $validated['customer_id']
                    ?? $sale?->customer_id,
                'assigned_to' => $validated['assigned_to'] ?? null,
                'created_by' => $request->user()?->id,
                'process_type' => $validated['process_type'],
                'status' => 'waiting_documents',
                'started_at' => $validated['started_at'],
                'estimated_completion_date' => $validated['estimated_completion_date'] ?? null,
                'processor_name' => $validated['processor_name'] ?? null,
                'processor_phone' => $validated['processor_phone'] ?? null,
                'origin_region' => $validated['origin_region'] ?? null,
                'destination_region' => $validated['destination_region'] ?? null,
                'target_owner_name' => $validated['target_owner_name'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $documents = $car->documents->keyBy('document_type');

            foreach (self::REQUIREMENT_TEMPLATES[$process->process_type] as $key => $name) {
                $document = $documents->get($key);
                $process->items()->create([
                    'vehicle_document_id' => $document?->id,
                    'item_key' => $key,
                    'item_name' => $name,
                    'required' => true,
                    'custody_status' => 'waiting',
                ]);
            }

            $process->events()->create([
                'status' => 'waiting_documents',
                'occurred_at' => Carbon::parse(
                    $validated['started_at'],
                    'Asia/Makassar',
                )->startOfDay()->utc(),
                'description' => 'Proses berkas dibuat.',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $process->costs()->create([
                'cost_type' => 'other',
                'description' => 'Biaya awal proses',
                'amount' => $validated['initial_cost'],
                'paid_by' => $validated['initial_cost_paid_by'],
                'paid_at' => $validated['started_at'],
                'created_by' => $request->user()?->id,
            ]);

            return $process;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Proses berkas berhasil dibuat.',
        ]);

        return to_route('document-processes.show', $process);
    }

    public function show(DocumentProcess $documentProcess): Response
    {
        $documentProcess->load([
            'car.brand:id,name',
            'car.capital',
            'sale',
            'customer:id,name,phone',
            'assignee:id,name',
            'creator:id,name',
            'items.vehicleDocument',
            'events.creator:id,name',
            'events.files',
            'costs.creator:id,name',
            'costs.receipt',
            'files',
        ]);

        return Inertia::render('document-processes/show', [
            'process' => $documentProcess,
            'type_options' => DocumentProcess::TYPE_LABELS,
            'status_options' => DocumentProcess::STATUS_LABELS,
        ]);
    }

    public function storeEvent(
        StoreDocumentProcessEventRequest $request,
        DocumentProcess $documentProcess,
    ): RedirectResponse {
        $validated = $request->validated();
        /** @var array<int, UploadedFile> $files */
        $files = $request->file('files', []);
        $storedPaths = [];

        try {
            DB::transaction(function () use (
                $request,
                $documentProcess,
                $validated,
                $files,
                &$storedPaths,
            ): void {
                /** @var DocumentProcess $process */
                $process = DocumentProcess::query()
                    ->with(['car.documents', 'items'])
                    ->lockForUpdate()
                    ->findOrFail($documentProcess->id);

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
                    'created_by' => $request->user()?->id,
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

                if ($validated['status'] === 'submitted') {
                    $process->items()
                        ->where('custody_status', 'received')
                        ->update(['custody_status' => 'submitted']);
                }

                if ($validated['status'] === 'returned') {
                    $process->items()
                        ->whereIn('custody_status', ['received', 'submitted'])
                        ->update([
                            'custody_status' => 'returned',
                            'returned_at' => $validated['occurred_at'],
                        ]);
                }

                if ($validated['status'] === 'completed') {
                    $this->applyProcessResult(
                        $process,
                        $validated['result'] ?? [],
                    );
                }

                $process->update([
                    'status' => $validated['status'],
                    'completed_at' => $validated['status'] === 'completed'
                        ? $validated['occurred_at']
                        : $process->completed_at,
                    'returned_at' => $validated['status'] === 'returned'
                        ? $validated['occurred_at']
                        : $process->returned_at,
                    'cancelled_at' => $validated['status'] === 'cancelled'
                        ? $validated['occurred_at']
                        : null,
                ]);

                foreach ($files as $file) {
                    $path = $this->storeFile(
                        $file,
                        "document-processes/{$process->id}/events/{$event->id}",
                    );
                    $storedPaths[] = $path;
                    $process->files()->create([
                        'document_process_event_id' => $event->id,
                        'uploaded_by' => $request->user()?->id,
                        'file_category' => 'event_evidence',
                        ...$this->fileAttributes($file, $path),
                    ]);
                }

                $process->syncCarCapital();
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Perkembangan proses berhasil dicatat.',
        ]);

        return back();
    }

    public function storeCost(
        StoreDocumentProcessCostRequest $request,
        DocumentProcess $documentProcess,
    ): RedirectResponse {
        if ($documentProcess->status === 'cancelled') {
            throw ValidationException::withMessages([
                'amount' => 'Biaya tidak dapat ditambahkan ke proses yang dibatalkan.',
            ]);
        }

        $validated = $request->validated();
        $receipt = $request->file('receipt');
        $storedPath = null;

        try {
            DB::transaction(function () use (
                $request,
                $documentProcess,
                $validated,
                $receipt,
                &$storedPath,
            ): void {
                /** @var DocumentProcessCost $cost */
                $cost = $documentProcess->costs()->create([
                    'cost_type' => 'other',
                    'description' => $validated['description'],
                    'amount' => $validated['amount'],
                    'paid_by' => $validated['paid_by'],
                    'paid_at' => $validated['paid_at'] ?? now()->toDateString(),
                    'created_by' => $request->user()?->id,
                ]);

                if ($receipt instanceof UploadedFile) {
                    $storedPath = $this->storeFile(
                        $receipt,
                        "document-processes/{$documentProcess->id}/costs/{$cost->id}",
                    );
                    $documentProcess->files()->create([
                        'document_process_cost_id' => $cost->id,
                        'uploaded_by' => $request->user()?->id,
                        'file_category' => 'cost_receipt',
                        ...$this->fileAttributes($receipt, $storedPath),
                    ]);
                }
            });
        } catch (Throwable $exception) {
            if ($storedPath !== null) {
                Storage::disk('local')->delete($storedPath);
            }

            throw $exception;
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Biaya proses berhasil ditambahkan.',
        ]);

        return back();
    }

    public function downloadFile(DocumentProcessFile $file): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($file->file_path), 404);

        return Storage::disk('local')->download($file->file_path, $file->file_name);
    }

    private function resolveSale(Car $car, mixed $saleId): ?Sale
    {
        if ($saleId !== null) {
            return Sale::query()->find((int) $saleId);
        }

        return $car->sale;
    }

    /** @param array<string, mixed> $result */
    private function applyProcessResult(DocumentProcess $process, array $result): void
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

    private function storeFile(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, 'local');

        if ($path === false) {
            throw ValidationException::withMessages([
                'files' => 'Berkas gagal disimpan. Silakan coba lagi.',
            ]);
        }

        return $path;
    }

    /** @return array{file_path: string, file_name: string, file_mime: string|null, file_size: int} */
    private function fileAttributes(UploadedFile $file, string $path): array
    {
        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getMimeType() ?: null,
            'file_size' => (int) $file->getSize(),
        ];
    }
}
