<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_document_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('car_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_mime', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();
        });

        Schema::table('vehicle_documents', function (Blueprint $table): void {
            $table->string('status', 32)->default('incomplete')->change();
        });

        DB::table('vehicle_documents')
            ->orderBy('id')
            ->get(['id', 'document_type', 'status'])
            ->each(function (object $document): void {
                $status = match ($document->document_type) {
                    'stnk' => match ($document->status) {
                        'complete' => 'complete',
                        'processing' => 'printing',
                        default => 'incomplete',
                    },
                    'bpkb' => match ($document->status) {
                        'complete' => 'ready',
                        'processing' => 'printing',
                        default => 'uncollected',
                    },
                    'invoice' => $document->status === 'complete'
                        ? 'ready'
                        : 'not_ready',
                    default => $document->status,
                };

                DB::table('vehicle_documents')
                    ->where('id', $document->id)
                    ->update(['status' => $status]);
            });

        $migratedCars = [];

        DB::table('vehicle_documents')
            ->whereNotNull('file_path')
            ->orderBy('car_id')
            ->orderByDesc('id')
            ->get([
                'car_id',
                'file_path',
                'file_name',
                'file_mime',
                'file_size',
                'created_at',
                'updated_at',
            ])
            ->each(function (object $document) use (&$migratedCars): void {
                if (isset($migratedCars[$document->car_id])) {
                    return;
                }

                DB::table('vehicle_document_attachments')->insert([
                    'car_id' => $document->car_id,
                    'file_path' => $document->file_path,
                    'file_name' => $document->file_name,
                    'file_mime' => $document->file_mime,
                    'file_size' => $document->file_size,
                    'created_at' => $document->created_at ?? now(),
                    'updated_at' => $document->updated_at ?? now(),
                ]);

                $migratedCars[$document->car_id] = true;
            });

    }

    public function down(): void
    {
        DB::table('vehicle_documents')
            ->orderBy('id')
            ->get(['id', 'document_type', 'status'])
            ->each(function (object $document): void {
                $status = match ($document->document_type) {
                    'stnk' => match ($document->status) {
                        'complete' => 'complete',
                        'printing' => 'processing',
                        default => 'missing',
                    },
                    'bpkb' => match ($document->status) {
                        'ready', 'uncollected' => 'complete',
                        'printing' => 'processing',
                        default => 'pending',
                    },
                    'invoice' => $document->status === 'ready'
                        ? 'complete'
                        : 'pending',
                    default => in_array(
                        $document->status,
                        ['complete', 'pending', 'processing', 'missing'],
                        true,
                    ) ? $document->status : 'pending',
                };

                DB::table('vehicle_documents')
                    ->where('id', $document->id)
                    ->update(['status' => $status]);
            });

        Schema::table('vehicle_documents', function (Blueprint $table): void {
            $table->enum('status', ['complete', 'pending', 'processing', 'missing'])
                ->default('pending')
                ->change();
        });

        Schema::dropIfExists('vehicle_document_attachments');
    }
};
