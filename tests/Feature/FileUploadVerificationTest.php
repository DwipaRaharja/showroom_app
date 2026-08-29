<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use App\Models\DocumentProcess;
use App\Models\Sale;
use App\Models\User;
use App\Models\VehicleHandover;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('local');
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

describe('1. Car Image Upload and Preview/Download', function () {
    test('car creation stores image with standardized naming format and renders image route and show page', function () {
        $brand = Brand::query()->create([
            'name' => 'Toyota Astra',
            'slug' => 'toyota-astra',
            'is_active' => true,
        ]);

        $imageFile = UploadedFile::fake()->image('avanza_depan.jpg', 800, 600)->size(500);

        $response = $this->post(route('cars.store'), [
            'brand_id' => $brand->id,
            'name' => 'Veloz 1.5 Q',
            'license_plate' => 'B 1234 TB',
            'year' => 2024,
            'color' => 'Putih Mutiara',
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 15000,
            'selling_price' => 250000000,
            'status' => 'available',
            'description' => 'Kondisi istimewa, mulus.',
            'image' => $imageFile,
            'capital' => [
                'purchase_date' => '2026-08-28',
                'price' => 210000000,
                'repair_cost' => 2000000,
                'transport_cost' => 1000000,
                'other_cost' => 500000,
                'status' => 'completed',
                'notes' => 'Modal awal pembelian unit.',
            ],
        ]);

        $response->assertRedirect(route('cars.index'));
        $response->assertSessionHasNoErrors();

        $car = Car::query()->where('license_plate', 'B 1234 TB')->firstOrFail();

        // 1. Verify path pattern: cars/{id}/mobil-{id}-{brand}-{name}-{plate}-{timestamp}.ext
        expect($car->image)->not->toBeNull();
        $pattern = '#^cars/'.$car->id.'/mobil-'.$car->id.'-toyota-astra-veloz-15-q-b-1234-tb-\d+\.jpg$#';
        expect($car->image)->toMatch($pattern);

        // 2. Verify file exists in disk
        Storage::disk('local')->assertExists((string) $car->image);

        // 3. Verify show page renders car data with image
        $this->get(route('cars.show', $car))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cars/show')
                ->where('car.id', $car->id)
                ->where('car.name', 'Veloz 1.5 Q')
                ->where('car.image', $car->image)
            );

        // 4. Verify /cars/{id}/image returns inline streamed image with correct headers
        $imageResponse = $this->get(route('cars.image', $car));
        $imageResponse->assertOk();
        $imageResponse->assertHeader('Content-Type', 'image/jpeg');
    });

    test('car update can replace image and cleans up old image file', function () {
        $brand = Brand::query()->create([
            'name' => 'Honda Pro',
            'slug' => 'honda-pro',
            'is_active' => true,
        ]);

        $car = Car::query()->create([
            'brand_id' => $brand->id,
            'name' => 'HR-V SE',
            'license_plate' => 'B 9988 XYZ',
            'year' => 2023,
            'color' => 'Abu-abu Metalik',
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 20000,
            'selling_price' => 320000000,
            'status' => 'available',
        ]);

        $car->capital()->create([
            'purchase_date' => '2026-08-20',
            'price' => 290000000,
            'repair_cost' => 0,
            'transport_cost' => 0,
            'other_cost' => 0,
            'status' => 'completed',
        ]);

        $oldPath = "cars/{$car->id}/mobil-{$car->id}-honda-pro-hr-v-se-b-9988-xyz-1700000000.jpg";
        Storage::disk('local')->put($oldPath, 'old_image_bytes');
        $car->update(['image' => $oldPath]);

        $newImageFile = UploadedFile::fake()->image('hrv_new.png', 800, 600)->size(600);

        $response = $this->post(route('cars.update', $car), [
            '_method' => 'PUT',
            'brand_id' => $brand->id,
            'name' => 'HR-V SE Updated',
            'license_plate' => 'B 9988 XYZ',
            'year' => 2023,
            'color' => 'Abu-abu Metalik',
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 21000,
            'selling_price' => 325000000,
            'status' => 'available',
            'image' => $newImageFile,
            'capital' => [
                'purchase_date' => '2026-08-20',
                'price' => 290000000,
                'repair_cost' => 0,
                'transport_cost' => 0,
                'other_cost' => 0,
                'status' => 'completed',
            ],
        ]);

        $response->assertRedirect(route('cars.show', $car));
        $response->assertSessionHasNoErrors();

        $car->refresh();
        $newPath = $car->image;

        // Old file deleted, new file stored
        expect($newPath)->not->toBe($oldPath);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($newPath);

        $newPattern = '#^cars/'.$car->id.'/mobil-'.$car->id.'-honda-pro-hr-v-se-updated-b-9988-xyz-\d+\.png$#';
        expect($newPath)->toMatch($newPattern);
    });
});

describe('2. Vehicle Document Attachment Upload and Download', function () {
    test('uploading vehicle document attachment standardizes filename and allows clean download', function () {
        $brand = Brand::query()->create([
            'name' => 'Mitsubishi',
            'slug' => 'mitsubishi',
            'is_active' => true,
        ]);

        $car = Car::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Xpander Cross',
            'license_plate' => 'KT 4321 MM',
            'year' => 2023,
            'color' => 'Putih',
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 18000,
            'selling_price' => 275000000,
            'status' => 'available',
        ]);

        $documentFile = UploadedFile::fake()->create('dokumen_gabungan_asli.pdf', 1500, 'application/pdf');

        $response = $this->post(route('vehicle-documents.store', $car), [
            'stnk' => [
                'status' => 'complete',
                'owner_name' => 'Haji Sulaiman',
                'issued_at' => '2025-01-10',
                'expires_at' => '2030-01-10',
                'annual_tax_due_at' => '2027-01-10',
            ],
            'bpkb' => [
                'status' => 'ready',
                'owner_name' => 'Haji Sulaiman',
                'issued_at' => '2025-01-20',
            ],
            'invoice' => [
                'status' => 'ready',
            ],
            'file' => $documentFile,
        ]);

        $response->assertRedirect(route('cars.show', $car));
        $response->assertSessionHasNoErrors();

        $attachment = $car->documentAttachment()->sole();

        // Standardized format: dokumen-kendaraan-{id}-{plate}-{brand}-{name}-{timestamp}.ext
        $pattern = '#^dokumen-kendaraan-'.$car->id.'-kt-4321-mm-mitsubishi-xpander-cross-\d+\.pdf$#';
        expect($attachment->file_name)->toMatch($pattern);

        // Path format: vehicle-documents/{id}/shared/dokumen-kendaraan-...
        $pathPattern = '#^vehicle-documents/'.$car->id.'/shared/dokumen-kendaraan-'.$car->id.'-kt-4321-mm-mitsubishi-xpander-cross-\d+\.pdf$#';
        expect($attachment->file_path)->toMatch($pathPattern);

        Storage::disk('local')->assertExists($attachment->file_path);

        // Download test
        $downloadResponse = $this->get(route('vehicle-documents.download', $car));
        $downloadResponse->assertOk();
        $downloadResponse->assertDownload($attachment->file_name);
    });
});

describe('3. Handover (BAST) Photos Upload and Preview/Download', function () {
    test('handover event creation stores photos with standardized naming format and allows photo preview and download', function () {
        $brand = Brand::query()->create([
            'name' => 'Daihatsu',
            'slug' => 'daihatsu',
            'is_active' => true,
        ]);

        $car = Car::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Rocky 1.0 Turbo',
            'license_plate' => 'B 5544 ZZZ',
            'year' => 2024,
            'color' => 'Merah',
            'transmission' => 'automatic',
            'fuel_type' => 'bensin',
            'mileage' => 8000,
            'selling_price' => 220000000,
            'status' => 'booked',
        ]);

        $customer = Customer::query()->create([
            'name' => 'Ahmad Dahlan',
            'phone' => '081233445566',
        ]);

        $sale = Sale::query()->create([
            'car_id' => $car->id,
            'customer_id' => $customer->id,
            'payment_type' => 'cash_full',
            'deal_price' => 220000000,
            'down_payment' => 220000000,
            'finance_amount' => 0,
            'leasing_bonus' => 0,
            'status' => 'completed',
        ]);

        $photo1 = UploadedFile::fake()->image('serah_terima_unit.jpg', 1024, 768)->size(800);
        $photo2 = UploadedFile::fake()->image('serah_terima_kunci.png', 1024, 768)->size(700);

        $response = $this->post(route('handovers.store'), [
            'sale_id' => $sale->id,
            'occurred_at' => now()->format('Y-m-d H:i:s'),
            'items' => ['vehicle', 'stnk', 'keys'],
            'key_count' => 2,
            'vehicle_condition' => [
                'fuel_level' => 'Full',
                'cleanliness' => 'Bersih & Salon Siap Pakai',
            ],
            'recipient_name' => 'Ahmad Dahlan',
            'recipient_phone' => '081233445566',
            'recipient_relation' => 'buyer_self',
            'officer_name' => 'Staff Serah Terima',
            'handover_location' => 'Showroom Telaga Berlian',
            'photos' => [$photo1, $photo2],
        ]);

        $response->assertRedirect(route('handovers.show', $sale));
        $response->assertSessionHasNoErrors();

        $handover = VehicleHandover::query()->where('sale_id', $sale->id)->firstOrFail();
        $event = $handover->events()->sole();
        $photos = $event->photos()->orderBy('id')->get();

        expect($photos)->toHaveCount(2);

        // Standardized naming format: bast-foto-spk-{sale_id}-{event_type}-{index}-{timestamp}.ext
        // Path: vehicle-handovers/{id}/events/{event_id}/bast-foto-spk-...
        $photo1Model = $photos[0];
        $photo2Model = $photos[1];

        $namePattern1 = '#^bast-foto-spk-'.$sale->id.'-vehicle-delivery-1-\d+\.jpg$#';
        $pathPattern1 = '#^vehicle-handovers/'.$handover->id.'/events/'.$event->id.'/bast-foto-spk-'.$sale->id.'-vehicle-delivery-1-\d+\.jpg$#';

        expect($photo1Model->file_name)->toMatch($namePattern1);
        expect($photo1Model->file_path)->toMatch($pathPattern1);
        Storage::disk('local')->assertExists($photo1Model->file_path);

        $namePattern2 = '#^bast-foto-spk-'.$sale->id.'-vehicle-delivery-2-\d+\.png$#';
        $pathPattern2 = '#^vehicle-handovers/'.$handover->id.'/events/'.$event->id.'/bast-foto-spk-'.$sale->id.'-vehicle-delivery-2-\d+\.png$#';

        expect($photo2Model->file_name)->toMatch($namePattern2);
        expect($photo2Model->file_path)->toMatch($pathPattern2);
        Storage::disk('local')->assertExists($photo2Model->file_path);

        // Preview route: /handover-photos/{photo}
        $previewResponse = $this->get(route('handover-photos.show', $photo1Model));
        $previewResponse->assertOk();
        $previewResponse->assertHeader('Content-Type', 'image/jpeg');

        // Download route: /handover-photos/{photo}/download
        $downloadResponse = $this->get(route('handover-photos.download', $photo1Model));
        $downloadResponse->assertOk();
        $downloadResponse->assertDownload($photo1Model->file_name);

        // Handover proof download route: /handovers/{handover}/proof
        $proofResponse = $this->get(route('handovers.proof.download', $handover));
        $proofResponse->assertOk();
        $proofResponse->assertDownload($photo1Model->file_name);
    });
});

describe('4. Document Process Files and Cost Receipt Upload and Download', function () {
    test('document process event evidence files and cost receipts are stored with standardized names and downloadable', function () {
        $brand = Brand::query()->create([
            'name' => 'Toyota',
            'slug' => 'toyota-proc',
            'is_active' => true,
        ]);

        $car = Car::query()->create([
            'brand_id' => $brand->id,
            'name' => 'Innova Reborn',
            'license_plate' => 'KT 1122 AA',
            'year' => 2022,
            'color' => 'Hitam',
            'transmission' => 'manual',
            'fuel_type' => 'diesel',
            'mileage' => 45000,
            'selling_price' => 310000000,
            'status' => 'available',
        ]);

        $car->capital()->create([
            'purchase_date' => '2026-08-15',
            'price' => 270000000,
            'repair_cost' => 0,
            'transport_cost' => 0,
            'other_cost' => 0,
            'status' => 'completed',
        ]);

        // Create document process
        $storeResponse = $this->post(route('document-processes.store'), [
            'car_id' => $car->id,
            'process_type' => 'five_year_tax',
            'started_at' => now()->toDateString(),
            'estimated_completion_date' => now()->addDays(7)->toDateString(),
            'notes' => 'Perpanjangan plat 5 tahunan',
            'initial_cost' => 500000,
            'initial_cost_paid_by' => 'showroom',
        ]);

        $storeResponse->assertRedirect();
        $process = DocumentProcess::query()->where('car_id', $car->id)->sole();
        $sluggedProcessNum = strtolower($process->process_number);

        // 4A. Store Event with Evidence Files
        $evidence1 = UploadedFile::fake()->create('cek_fisik_gesek_samsat.pdf', 800, 'application/pdf');
        $evidence2 = UploadedFile::fake()->image('foto_cek_fisik.jpg', 800, 600)->size(400);

        $eventResponse = $this->post(route('document-processes.events.store', $process), [
            'status' => 'processing',
            'occurred_at' => now()->format('Y-m-d H:i:s'),
            'description' => 'Cek fisik kendaraan di Samsat selesai.',
            'location' => 'Samsat Balikpapan',
            'files' => [$evidence1, $evidence2],
        ]);

        $eventResponse->assertRedirect();
        $event = $process->events()->latest('id')->firstOrFail();
        $eventFiles = $process->files()->where('document_process_event_id', $event->id)->get();

        expect($eventFiles)->toHaveCount(2);

        $pdfFile = $eventFiles->firstWhere(fn ($f) => str_ends_with($f->file_name, '.pdf'));
        $jpgFile = $eventFiles->firstWhere(fn ($f) => str_ends_with($f->file_name, '.jpg'));

        expect($pdfFile)->not->toBeNull();
        expect($jpgFile)->not->toBeNull();

        $evPdfPattern = '#^proses-berkas-'.preg_quote($sluggedProcessNum, '#').'-processing-\d+-\d+\.pdf$#';
        $evPdfPathPattern = '#^document-processes/'.$process->id.'/events/'.$event->id.'/proses-berkas-'.preg_quote($sluggedProcessNum, '#').'-processing-\d+-\d+\.pdf$#';

        expect($pdfFile->file_name)->toMatch($evPdfPattern);
        expect($pdfFile->file_path)->toMatch($evPdfPathPattern);
        expect($pdfFile->file_category)->toBe('event_evidence');
        Storage::disk('local')->assertExists($pdfFile->file_path);

        $evJpgPattern = '#^proses-berkas-'.preg_quote($sluggedProcessNum, '#').'-processing-\d+-\d+\.jpg$#';
        $evJpgPathPattern = '#^document-processes/'.$process->id.'/events/'.$event->id.'/proses-berkas-'.preg_quote($sluggedProcessNum, '#').'-processing-\d+-\d+\.jpg$#';

        expect($jpgFile->file_name)->toMatch($evJpgPattern);
        expect($jpgFile->file_path)->toMatch($evJpgPathPattern);
        expect($jpgFile->file_category)->toBe('event_evidence');
        Storage::disk('local')->assertExists($jpgFile->file_path);

        // Download event evidence file
        $downloadEvResponse = $this->get(route('document-process-files.download', $pdfFile));
        $downloadEvResponse->assertOk();
        $downloadEvResponse->assertDownload($pdfFile->file_name);

        // 4B. Store Cost with Receipt Upload
        $receiptFile = UploadedFile::fake()->create('kuitansi_pembayaran_pajak.pdf', 600, 'application/pdf');

        $costResponse = $this->post(route('document-processes.costs.store', $process), [
            'description' => 'Pembayaran PKB dan SWDKLLJ',
            'amount' => 3200000,
            'paid_by' => 'showroom',
            'paid_at' => now()->toDateString(),
            'receipt' => $receiptFile,
        ]);

        $costResponse->assertRedirect();
        $cost = $process->costs()->latest('id')->firstOrFail();
        $costFile = $process->files()->where('document_process_cost_id', $cost->id)->sole();

        // Standardized naming format: kuitansi-biaya-{process_number}-cost-{cost_id}-{timestamp}.ext
        // Path: document-processes/{id}/costs/{cost_id}/kuitansi-biaya-...
        $costNamePattern = '#^kuitansi-biaya-'.preg_quote($sluggedProcessNum, '#').'-cost-'.$cost->id.'-\d+\.pdf$#';
        $costPathPattern = '#^document-processes/'.$process->id.'/costs/'.$cost->id.'/kuitansi-biaya-'.preg_quote($sluggedProcessNum, '#').'-cost-'.$cost->id.'-\d+\.pdf$#';

        expect($costFile->file_name)->toMatch($costNamePattern);
        expect($costFile->file_path)->toMatch($costPathPattern);
        expect($costFile->file_category)->toBe('cost_receipt');
        Storage::disk('local')->assertExists($costFile->file_path);

        // Download receipt file
        $downloadReceiptResponse = $this->get(route('document-process-files.download', $costFile));
        $downloadReceiptResponse->assertOk();
        $downloadReceiptResponse->assertDownload($costFile->file_name);
    });
});
