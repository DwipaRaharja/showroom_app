<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentProcess\StoreDocumentProcessRequest;
use App\Http\Requests\DocumentProcess\UpdateDocumentProcessRequest;
use App\Models\DocumentProcess;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DocumentProcessController extends Controller
{
    public function index(): Response
    {
        $processes = DocumentProcess::query()
            ->with([
                'sale:id,invoice_number,car_id,customer_id,payment_type,status',
                'sale.car:id,brand_id,name,license_plate,year',
                'sale.car.brand:id,name',
                'sale.customer:id,name,phone',
                'assignee:id,name',
                'items',
            ])
            ->latest('id')
            ->get();

        return Inertia::render('document-processes/index', [
            'processes' => $processes,
            'summary' => [
                'total' => $processes->count(),
                'waiting' => $processes->where('status', 'waiting_documents')->count(),
                'in_progress' => $processes->whereIn('status', ['ready', 'processing', 'issue'])->count(),
                'completed' => $processes->whereIn('status', ['completed', 'handed_over'])->count(),
                'overdue' => $processes->filter(fn (DocumentProcess $process) => $process->estimated_completion_date !== null
                    && Carbon::parse($process->estimated_completion_date)->isPast()
                    && ! in_array($process->status, ['completed', 'handed_over', 'cancelled'], true))->count(),
            ],
        ]);
    }

    public function create(Sale $sale): Response|RedirectResponse
    {
        $existingProcess = $sale->documentProcess;

        if ($existingProcess) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'Penjualan ini sudah memiliki proses berkas.',
            ]);

            return to_route('document-processes.show', $existingProcess);
        }

        abort_if($sale->status === 'cancelled', 422, 'Penjualan yang dibatalkan tidak dapat diproses.');

        $sale->load([
            'car' => fn ($query) => $query->with(['brand:id,name', 'documents']),
            'customer:id,name,phone,ktp_number,address',
            'financeCompany:id,name',
        ]);

        return Inertia::render('document-processes/create', [
            'sale' => $sale,
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreDocumentProcessRequest $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validated();

        $process = DB::transaction(function () use ($validated, $sale, $request): DocumentProcess {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::query()->lockForUpdate()->findOrFail($sale->id);

            if ($lockedSale->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'process_type' => 'Penjualan yang dibatalkan tidak dapat diproses.',
                ]);
            }

            if ($lockedSale->documentProcess()->exists()) {
                throw ValidationException::withMessages([
                    'process_type' => 'Penjualan ini sudah memiliki proses berkas.',
                ]);
            }

            /** @var DocumentProcess $process */
            $process = $lockedSale->documentProcess()->create($validated);
            $process->syncItemsFromVehicleDocuments();
            $process->activities()->create([
                'user_id' => $request->user()?->id,
                'type' => 'created',
                'description' => 'Proses berkas dibuat dan checklist dokumen disiapkan.',
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
            'sale' => fn ($query) => $query->with([
                'car' => fn ($carQuery) => $carQuery->with(['brand:id,name', 'documents']),
                'customer',
                'financeCompany',
                'payments',
            ]),
            'assignee:id,name',
            'items.vehicleDocument',
            'activities.user:id,name',
        ]);

        return Inertia::render('document-processes/show', [
            'process' => $documentProcess,
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(
        UpdateDocumentProcessRequest $request,
        DocumentProcess $documentProcess,
    ): RedirectResponse {
        if ($documentProcess->status === 'cancelled') {
            throw ValidationException::withMessages([
                'process_type' => 'Proses yang dibatalkan harus dibuka kembali sebelum diedit.',
            ]);
        }

        $documentProcess->update($request->validated());
        $documentProcess->activities()->create([
            'user_id' => $request->user()?->id,
            'type' => 'updated',
            'description' => 'Informasi proses berkas diperbarui.',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Informasi proses berkas berhasil diperbarui.',
        ]);

        return back();
    }

    public function cancel(DocumentProcess $documentProcess): RedirectResponse
    {
        $documentProcess->update([
            'status' => 'cancelled',
            'completed_at' => null,
            'handed_over_at' => null,
        ]);
        $documentProcess->activities()->create([
            'user_id' => request()->user()?->id,
            'type' => 'cancelled',
            'description' => 'Proses berkas dibatalkan.',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Proses berkas berhasil dibatalkan.',
        ]);

        return back();
    }

    public function reopen(DocumentProcess $documentProcess): RedirectResponse
    {
        abort_unless($documentProcess->status === 'cancelled', 422);

        $documentProcess->update(['status' => 'waiting_documents']);
        $documentProcess->refreshWorkflowStatus();
        $documentProcess->activities()->create([
            'user_id' => request()->user()?->id,
            'type' => 'reopened',
            'description' => 'Proses berkas dibuka kembali.',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Proses berkas berhasil dibuka kembali.',
        ]);

        return back();
    }
}
