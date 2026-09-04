# Showroom Management App

<p align="center">
  <img src="public/favicon.svg" alt="Showroom Management App Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>Aplikasi Manajemen Operasional & Keuangan Showroom Mobil Bekas</strong>
</p>

<p align="center">
  A modern, high-performance web application built with <strong>Laravel 12/13</strong>, <strong>React 19</strong>, <strong>Inertia.js v3</strong>, <strong>TypeScript</strong>, and <strong>Tailwind CSS v4</strong>.
</p>

---

## 📌 Gambaran Umum (Overview)

**Showroom Management App** adalah sistem manajemen komprehensif yang dirancang khusus untuk mengelola seluruh siklus operasional showroom mobil bekas, mulai dari pengadaan unit kendaraan (*purchase & capital*), inventaris mobil, pengurusan dokumen legalitas (*STNK/BPKB/Faktur*), transaksi penjualan (*SPK Penjualan* dengan skema Cash, Tempo, Kredit Leasing, & Tukar Tambah), pencatatan kas masuk, tracking serah terima kendaraan (*BAST*), hingga pencadangan data (*one-click backup*).

---

## ✨ Fitur Utama (Key Features)

### 1. 📊 Dashboard & Analitik
* **Ringkasan Real-Time:** Total omset, estimasi laba kotor, kas masuk terkonfirmasi, sisa piutang berjalan, serta unit mobil tersedia vs terjual.
* **Pusat Perhatian (Attention Cards):** Peringatan otomatis untuk pajak STNK & masa berlaku plat 5 tahunan yang mendekati jatuh tempo, serta berkas kendaraan yang sedang dalam proses pengurusan di Samsat/Biro Jasa.
* **Grafik Kinerja:** Visualisasi tren penjualan dan arus kas bulanan.

### 2. 🚗 Manajemen Unit Mobil & Modal (Cars & Purchases)
* **Spesifikasi Kendaraan Lengkap:** Merek, model tipe, plat nomor, nomor rangka (VIN), nomor mesin, tahun, warna, jarak tempuh (KM), transmisi (*Automatic*, *Manual*, *CVT*), dan jenis bahan bakar (*Bensin*, *Diesel*, *Hybrid*, *Listrik/EV*).
* **Kalkulasi Modal & HPP:** Pencatatan harga beli perolehan, biaya perbaikan/cat/salon, biaya transport, biaya proses berkas, serta perhitungan otomatis modal total dan margin keuntungan.
* **Status Unit Terpadu:** Siklus status otomatis (*Tersedia*, *Booking*, *Terjual*, *Perawatan*).
* **Foto Unit:** Upload dan preview gambar kendaraan.

### 3. 📄 Dokumen Kendaraan (Vehicle Documents)
* **Tracking Legalitas:** Pengelolaan data BPKB (nomor, nama pemilik, status fisik, lokasi penyimpanan), STNK (nomor, masa berlaku pajak tahunan, masa berlaku plat), dan Faktur kendaraan.
* **Upload Berkas Digital:** Penyimpanan lampiran file PDF atau foto dokumen kendaraan dengan akses unduh terproteksi.

### 4. 📝 Transaksi & SPK Penjualan (Sales)
* **Fleksibilitas Skema Pembayaran:**
  * **Tunai Keras (*Cash Full*):** Pembayaran langsung lunas.
  * **Tunai Bertahap (*Cash Tempo*):** Uang muka (DP) dan sisa piutang dengan tanggal jatuh tempo.
  * **Kredit Leasing (*Credit*):** Terintegrasi dengan lembaga pembiayaan/leasing, pencatatan DP customer, plafon pembiayaan, estimasi & aktual pencairan pokok leasing, serta pencairan bonus leasing.
  * **Tukar Tambah (*Trade-In*):** Input rincian unit milik pembeli yang ditukarkan (merek, tipe, plat nomor, tahun, warna, KM, nilai taksiran harga pasar).
* **Cetak Dokumen:** Cetak Surat Pesanan Kendaraan (SPK) / Invoice siap cetak (*Print Friendly Layout*).
* **Batalkan Penjualan (*Soft Cancellation*):** Pembatalan transaksi aman dengan pencatatan alasan, mengembalikan status mobil menjadi *Tersedia*, dan mempertahankan riwayat audit pembayaran.

### 5. 💰 Kas Masuk & Pembayaran (Payments)
* **Kategori Pembayaran Terperinci:** Uang Muka (DP), Cicilan/Angsuran, Pelunasan Customer, Pencairan Pokok Leasing, dan Pencairan Bonus Leasing.
* **Metode Pembayaran Multi-Channel:** Transfer Bank, Tunai (Cash), QRIS, dan Giro.
* **Pelacakan Sisa Tagihan:** Penghitungan otomatis sisa piutang secara dinamis dan kuitansi pembayaran instan.

### 6. 🤝 Serah Terima Kendaraan & BAST (Vehicle Handovers)
* **Timeline Serah Terima:** Pencatatan waktu kejadian, nama & kontak penerima, hubungan dengan pembeli, lokasi penyerahan, dan petugas showroom.
* **Checklist Fisik Kendaraan:** Pengecekan barang bawaan (unit mobil, BPKB, STNK, faktur, kunci cadangan, buku manual, buku servis, toolkit/dongkrak, P3K, karpet, ban serep).
* **Dokumentasi Foto:** Upload foto serah terima unit langsung di lokasi.
* **Cetak BAST:** Cetak Berita Acara Serah Terima resmi bertandatangan kedua belah pihak.

### 7. 📑 Pengurusan Berkas & Samsat (Document Processes)
* **Kategori Pengurusan:** Mutasi Kendaraan (Masuk/Keluar), Balik Nama (BBN), Perpanjangan Pajak Tahunan, Ganti Plat 5 Tahunan, STNK/BPKB Hilang, dan Blokir Plat.
* **Manajemen Pihak Ketiga:** Pencatatan biro jasa / petugas pelaksana, estimasi & aktual selesai, rincian biaya pengurusan, dan file lampiran.

### 8. 🏢 Master Data & Konfigurasi
* **Merek Kendaraan (`/brands`):** Master merek dengan aktivasi status dan auto-slug.
* **Data Pelanggan (`/customers`):** Master customer lengkap dengan NIK/KTP, nomor HP (integrasi WhatsApp langsung), dan alamat.
* **Lembaga Pembiayaan (`/finance-companies`):** Master perusahaan leasing / finance rekanan beserta PIC dan kontak.

### 9. 💾 Pencadangan Sistem (Database & File Backup)
* **One-Click Backup (`/settings/backup`):** Pencadangan instan database MySQL beserta seluruh file dokumen fisik dan foto ke dalam arsip `.zip`.
* **Riwayat Backup:** Unduh file cadangan langsung dari browser atau hapus arsip lama.

---

## 🛠️ Teknologi & Arsitektur (Tech Stack)

| Lapisan (Layer) | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend** | **PHP 8.3+**, **Laravel Framework** | Arsitektur MVC & Service-Action Pattern, Laravel Fortify |
| **Frontend** | **React 19**, **Inertia.js v3** | Single Page Application (SPA) tanpa rendering REST API terpisah |
| **Language** | **TypeScript 5.7+** | Type-safe strict typing di seluruh komponen frontend |
| **Styling** | **Tailwind CSS v4** | Modern styling, Dark / Light Mode otomatis & manual |
| **UI Components** | **Radix UI**, **Shadcn UI** | Komponen aksesibel, Dialog, Dropdown, Select, Sheet, Popover |
| **Table Engine** | **TanStack Table v9** | Server-like client filtering, sorting, pagination, column visibility |
| **Icons** | **Phosphor Icons** | Ikon vektor presisi dan konsisten |
| **Testing** | **Pest PHP v5** | 140+ unit & feature tests, 1000+ assertions |
| **Code Quality** | **Larastan (PHPStan)**, **Pint**, **ESLint 9**, **Prettier** | Static analysis Level max, auto-formatting, zero error CI |

---

## 🚀 Panduan Instalasi (Installation Guide)

### Prasyarat (Prerequisites)
Pastikan sistem Anda telah terinstal:
* **PHP 8.3** atau versi lebih tinggi dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `zip`
* **Composer 2.x**
* **Node.js 20.x / 22.x** & **npm**
* **MySQL 8.0+** / **MariaDB 10.4+**

### Langkah-langkah Setup:

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/DwipaRaharja/showroom_app.git
   cd showroom_app
   ```

2. **Instal Dependensi Backend:**
   ```bash
   composer install
   ```

3. **Konfigurasi Environment (`.env`):**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Sesuaikan konfigurasi database pada `.env`:
   ```env
   APP_NAME="Showroom Management App"
   APP_URL=http://localhost:8000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=app_showroom_management
   DB_USERNAME=root
   DB_PASSWORD=
   ```

4. **Jalankan Migrasi Database:**
   ```bash
   php artisan migrate
   ```

5. **Instal Dependensi Frontend & Build Aset:**
   ```bash
   npm install
   npm run build
   ```

6. **Jalankan Server Development:**
   ```bash
   # Menjalankan Laravel, Queue Worker, dan Vite secara bersamaan:
   composer dev
   ```
   Atau jalankan secara terpisah:
   ```bash
   # Terminal 1:
   php artisan serve

   # Terminal 2:
   npm run dev
   ```

7. **Akses Aplikasi:**
   Buka browser dan arahkan ke [http://localhost:8000](http://localhost:8000).

---

## 📋 Perintah Bantuan (Available Scripts)

```bash
# Pengujian Otomatis (Testing)
php artisan test              # Menjalankan seluruh test suite Pest
composer test                 # Membersihkan cache, linting, dan test

# Pemeriksaan Kualitas & CI (Code Quality Check)
composer ci:check             # Menjalankan Lint, Format, TypeCheck, dan Test (100% CI pass)
npm run lint                  # Memeriksa dan memperbaiki linting TypeScript/React
npm run format                # Auto-format kode frontend dengan Prettier
npm run types:check           # Pemeriksaan tipe TypeScript tanpa emit

# Standar Kode PHP (Pint & PHPStan)
vendor/bin/pint               # Auto-format kode PHP sesuai standar PSR-12/Laravel
phpstan analyse               # Analisis statis Larastan pada codebase PHP

# Backup Manual
php artisan backup:run        # Menjalankan backup database dan storage
```

---

## 📁 Struktur Direktori Utama (Directory Structure)

```text
showroom_app/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # Controller per domain (Car, Sale, Customer, Handover, dll.)
│   │   └── Requests/         # Form request validation per use-case
│   └── Models/               # Eloquent Models dengan business logic, casting, & relasi
├── config/                   # Konfigurasi sistem (app, backup, database, auth)
├── database/
│   ├── factories/            # Model factories untuk testing
│   ├── migrations/           # Migrasi terstruktur domain-driven (01_core, 02_master, 03_cars, 04_sales, dll.)
│   └── seeders/              # Database seeders
├── resources/
│   ├── css/                  # Styling Tailwind CSS v4 & theme variables
│   └── js/
│       ├── components/       # Reusable UI components (data-table, stat-card, confirm-dialog, dll.)
│       ├── hooks/            # Custom React hooks (useSaleCalculations, useAppearance, dll.)
│       ├── layouts/          # Layout template (AppLayout, AuthLayout, SettingsLayout, PrintLayout)
│       ├── lib/              # Helper utilities & currency/date formatters
│       ├── pages/            # Halaman Inertia.js (dashboard, cars, sales, handovers, dll.)
│       └── types/            # TypeScript definitions
├── routes/
│   └── web.php               # Routing web aplikasi
└── tests/
    └── Feature/              # Pengujian fitur end-to-end (Pest PHP)
```

---

## 🔒 Lisensi (License)

Aplikasi ini bersifat *open-source* dan didistribusikan di bawah lisensi [MIT License](LICENSE).