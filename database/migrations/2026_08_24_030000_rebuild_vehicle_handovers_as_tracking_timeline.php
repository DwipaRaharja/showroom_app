<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<string, string> */
    private const ITEM_LABELS = [
        'vehicle' => 'Unit kendaraan',
        'stnk' => 'STNK asli',
        'bpkb' => 'BPKB asli',
        'invoice' => 'Faktur kendaraan',
        'keys' => 'Kunci kendaraan',
        'manual_book' => 'Buku manual',
        'service_book' => 'Buku servis',
        'toolkit' => 'Toolkit dan dongkrak',
        'spare_tire' => 'Ban cadangan',
        'blanko' => 'Blanko dokumen',
    ];

    public function up(): void
    {
        Schema::create('vehicle_handover_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_handover_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 40)->default('item_delivery');
            $table->dateTime('occurred_at');
            $table->string('recipient_name', 100);
            $table->string('recipient_phone', 30)->nullable();
            $table->string('recipient_id_card', 50)->nullable();
            $table->string('recipient_relation', 50)->default('buyer_self');
            $table->string('officer_name', 100);
            $table->string('handover_location', 100)->default('Showroom Telaga Berlian');
            $table->text('handover_address')->nullable();
            $table->json('vehicle_condition')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['vehicle_handover_id', 'occurred_at']);
        });

        Schema::create('vehicle_handover_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_handover_event_id')->constrained()->cascadeOnDelete();
            $table->string('item_code', 50);
            $table->string('item_name', 100);
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['vehicle_handover_event_id', 'item_code'],
                'handover_event_item_unique',
            );
        });

        Schema::create('vehicle_handover_photos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vehicle_handover_event_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_mime', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('caption', 150)->nullable();
            $table->timestamps();
        });

        $this->migrateLegacyHandovers();

        Schema::table('vehicle_handovers', function (Blueprint $table): void {
            $table->unique('sale_id');
            $table->dropColumn([
                'recipient_name',
                'recipient_phone',
                'recipient_id_card',
                'recipient_relation',
                'officer_name',
                'handover_location',
                'handover_address',
                'vehicle_delivered_at',
                'bpkb_delivered_at',
                'bpkb_recipient_type',
                'checklist',
                'proof_file',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_handovers', function (Blueprint $table): void {
            $table->string('recipient_name', 100)->nullable();
            $table->string('recipient_phone', 30)->nullable();
            $table->string('recipient_id_card', 50)->nullable();
            $table->string('recipient_relation', 50)->default('buyer_self');
            $table->string('officer_name', 100)->nullable();
            $table->string('handover_location', 100)->default('Showroom Telaga Berlian');
            $table->text('handover_address')->nullable();
            $table->dateTime('vehicle_delivered_at')->nullable();
            $table->dateTime('bpkb_delivered_at')->nullable();
            $table->string('bpkb_recipient_type', 50)->nullable();
            $table->json('checklist')->nullable();
            $table->string('proof_file')->nullable();
        });

        $this->restoreLegacyHandovers();

        Schema::table('vehicle_handovers', function (Blueprint $table): void {
            $table->dropUnique(['sale_id']);
        });

        Schema::dropIfExists('vehicle_handover_photos');
        Schema::dropIfExists('vehicle_handover_items');
        Schema::dropIfExists('vehicle_handover_events');
    }

    private function migrateLegacyHandovers(): void
    {
        DB::table('vehicle_handovers')
            ->orderBy('id')
            ->get()
            ->each(function (stdClass $handover): void {
                $checklist = $this->decodeJson($handover->checklist);
                $vehicleEventId = null;
                $bpkbEventId = null;

                if ($handover->vehicle_delivered_at !== null) {
                    $vehicleEventId = $this->insertEvent(
                        $handover,
                        'vehicle_delivery',
                        $handover->vehicle_delivered_at,
                        [
                            'fuel_level' => $checklist['fuel_level'] ?? null,
                            'cleanliness' => $checklist['cleanliness'] ?? null,
                        ],
                    );

                    $this->insertItem($vehicleEventId, 'vehicle');
                    $this->insertChecklistItems($vehicleEventId, $checklist, false);
                }

                if ($handover->bpkb_delivered_at !== null) {
                    $bpkbEventId = $this->insertEvent(
                        $handover,
                        'document_delivery',
                        $handover->bpkb_delivered_at,
                        null,
                    );

                    $this->insertItem($bpkbEventId, 'bpkb');

                    if ((bool) ($checklist['has_faktur'] ?? false)) {
                        $this->insertItem($bpkbEventId, 'invoice');
                    }
                }

                if ($handover->proof_file !== null) {
                    $eventId = $vehicleEventId ?? $bpkbEventId;

                    if ($eventId !== null) {
                        DB::table('vehicle_handover_photos')->insert([
                            'vehicle_handover_event_id' => $eventId,
                            'file_path' => $handover->proof_file,
                            'file_name' => basename((string) $handover->proof_file),
                            'file_mime' => null,
                            'file_size' => null,
                            'caption' => 'Bukti dari data penyerahan lama',
                            'created_at' => $handover->created_at,
                            'updated_at' => $handover->updated_at,
                        ]);
                    }
                }
            });
    }

    /** @param array<string, mixed>|null $vehicleCondition */
    private function insertEvent(
        stdClass $handover,
        string $eventType,
        mixed $occurredAt,
        ?array $vehicleCondition,
    ): int {
        return (int) DB::table('vehicle_handover_events')->insertGetId([
            'vehicle_handover_id' => $handover->id,
            'event_type' => $eventType,
            'occurred_at' => $occurredAt,
            'recipient_name' => $handover->recipient_name,
            'recipient_phone' => $handover->recipient_phone,
            'recipient_id_card' => $handover->recipient_id_card,
            'recipient_relation' => $handover->recipient_relation,
            'officer_name' => $handover->officer_name,
            'handover_location' => $handover->handover_location,
            'handover_address' => $handover->handover_address,
            'vehicle_condition' => $vehicleCondition === null
                ? null
                : json_encode($vehicleCondition),
            'notes' => $handover->notes,
            'created_by' => null,
            'created_at' => $handover->created_at,
            'updated_at' => $handover->updated_at,
        ]);
    }

    /** @param array<string, mixed> $checklist */
    private function insertChecklistItems(
        int $eventId,
        array $checklist,
        bool $includeLegalDocuments,
    ): void {
        $mapping = [
            'has_stnk' => 'stnk',
            'has_manual_book' => 'manual_book',
            'has_service_book' => 'service_book',
            'has_toolkit' => 'toolkit',
            'has_spare_tire' => 'spare_tire',
            'has_jack' => 'toolkit',
            'has_blanko' => 'blanko',
        ];

        if ($includeLegalDocuments) {
            $mapping['has_bpkb'] = 'bpkb';
            $mapping['has_faktur'] = 'invoice';
        }

        foreach ($mapping as $checklistKey => $itemCode) {
            if (! (bool) ($checklist[$checklistKey] ?? false)) {
                continue;
            }

            $this->insertItem($eventId, $itemCode);
        }

        $keyCount = (int) ($checklist['key_count'] ?? 0);

        if ($keyCount > 0) {
            $this->insertItem($eventId, 'keys', $keyCount);
        }
    }

    private function insertItem(int $eventId, string $itemCode, int $quantity = 1): void
    {
        DB::table('vehicle_handover_items')->insertOrIgnore([
            'vehicle_handover_event_id' => $eventId,
            'item_code' => $itemCode,
            'item_name' => self::ITEM_LABELS[$itemCode],
            'quantity' => $quantity,
            'notes' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function restoreLegacyHandovers(): void
    {
        DB::table('vehicle_handovers')
            ->orderBy('id')
            ->get()
            ->each(function (stdClass $handover): void {
                $events = DB::table('vehicle_handover_events')
                    ->where('vehicle_handover_id', $handover->id)
                    ->orderBy('occurred_at')
                    ->get();
                $vehicleEvent = $events->first(
                    fn (stdClass $event): bool => DB::table('vehicle_handover_items')
                        ->where('vehicle_handover_event_id', $event->id)
                        ->where('item_code', 'vehicle')
                        ->exists(),
                );
                $bpkbEvent = $events->first(
                    fn (stdClass $event): bool => DB::table('vehicle_handover_items')
                        ->where('vehicle_handover_event_id', $event->id)
                        ->where('item_code', 'bpkb')
                        ->exists(),
                );
                $latestEvent = $events->last();

                if ($latestEvent === null) {
                    return;
                }

                $sourceEvent = $vehicleEvent ?? $latestEvent;
                $vehicleItems = $vehicleEvent === null
                    ? collect()
                    : DB::table('vehicle_handover_items')
                        ->where('vehicle_handover_event_id', $vehicleEvent->id)
                        ->get()
                        ->keyBy('item_code');
                $condition = $this->decodeJson($vehicleEvent?->vehicle_condition);
                $keyItem = $vehicleItems->get('keys');
                $proof = DB::table('vehicle_handover_photos')
                    ->whereIn('vehicle_handover_event_id', $events->pluck('id'))
                    ->orderBy('id')
                    ->value('file_path');

                DB::table('vehicle_handovers')
                    ->where('id', $handover->id)
                    ->update([
                        'recipient_name' => $sourceEvent->recipient_name,
                        'recipient_phone' => $sourceEvent->recipient_phone,
                        'recipient_id_card' => $sourceEvent->recipient_id_card,
                        'recipient_relation' => $sourceEvent->recipient_relation,
                        'officer_name' => $sourceEvent->officer_name,
                        'handover_location' => $sourceEvent->handover_location,
                        'handover_address' => $sourceEvent->handover_address,
                        'vehicle_delivered_at' => $vehicleEvent?->occurred_at,
                        'bpkb_delivered_at' => $bpkbEvent?->occurred_at,
                        'bpkb_recipient_type' => $bpkbEvent?->recipient_relation === 'leasing_officer'
                            ? 'finance_company'
                            : ($bpkbEvent === null ? null : 'customer'),
                        'checklist' => json_encode([
                            'key_count' => $keyItem instanceof stdClass
                                ? (int) $keyItem->quantity
                                : 0,
                            'has_stnk' => $vehicleItems->has('stnk'),
                            'has_bpkb' => $bpkbEvent !== null,
                            'has_faktur' => $bpkbEvent !== null
                                && DB::table('vehicle_handover_items')
                                    ->where('vehicle_handover_event_id', $bpkbEvent->id)
                                    ->where('item_code', 'invoice')
                                    ->exists(),
                            'has_manual_book' => $vehicleItems->has('manual_book'),
                            'has_service_book' => $vehicleItems->has('service_book'),
                            'has_toolkit' => $vehicleItems->has('toolkit'),
                            'has_spare_tire' => $vehicleItems->has('spare_tire'),
                            'fuel_level' => $condition['fuel_level'] ?? null,
                            'cleanliness' => $condition['cleanliness'] ?? null,
                        ]),
                        'proof_file' => $proof,
                    ]);
            });
    }

    /** @return array<string, mixed> */
    private function decodeJson(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
};
