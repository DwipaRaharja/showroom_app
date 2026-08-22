<?php

namespace Database\Seeders;

use App\Models\FinanceCompany;
use Illuminate\Database\Seeder;

class FinanceCompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companies = [
            [
                'name' => 'BCA Finance',
                'code' => 'BCAF',
                'pic_name' => 'Budi Santoso',
                'pic_phone' => '081234567890',
                'is_active' => true,
                'notes' => 'Kerjasama bunga rendah untuk unit mobil passenger tahun 2018 ke atas.',
            ],
            [
                'name' => 'Mandiri Utama Finance',
                'code' => 'MUF',
                'pic_name' => 'Agus Prasetyo',
                'pic_phone' => '081398765432',
                'is_active' => true,
                'notes' => 'Proses approval cepat 1 hari kerja, program DP ringan.',
            ],
            [
                'name' => 'Adira Dinamika Multi Finance',
                'code' => 'ADIRA',
                'pic_name' => 'Rina Wijaya',
                'pic_phone' => '081555667788',
                'is_active' => true,
                'notes' => 'Melayani pembiayaan mobil niaga dan passenger komprehensif.',
            ],
            [
                'name' => 'Astra Credit Companies (ACC)',
                'code' => 'ACC',
                'pic_name' => 'Denny Kurniawan',
                'pic_phone' => '081822334455',
                'is_active' => true,
                'notes' => 'Spesialis mobil grup Astra (Toyota, Daihatsu, Isuzu).',
            ],
            [
                'name' => 'OTO Multiartha',
                'code' => 'OTO',
                'pic_name' => 'Ferry Gunawan',
                'pic_phone' => '081911223344',
                'is_active' => true,
                'notes' => 'Paket kredit tenor fleksibel hingga 5 tahun.',
            ],
            [
                'name' => 'CIMB Niaga Auto Finance',
                'code' => 'CNAF',
                'pic_name' => 'Maya Kartika',
                'pic_phone' => '082133445566',
                'is_active' => true,
                'notes' => 'Program syariah dan konvensional tersedia.',
            ],
        ];

        foreach ($companies as $company) {
            FinanceCompany::query()->updateOrCreate(
                ['code' => $company['code']],
                $company
            );
        }
    }
}
