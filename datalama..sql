
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Toyota',1,'2026-07-07 21:13:43','2026-07-07 21:16:45',NULL),(2,'Daihatsu',1,'2026-07-07 22:05:04','2026-07-07 22:05:04',NULL),(3,'Honda',1,'2026-07-07 22:05:34','2026-07-07 22:05:34',NULL),(4,'Volkswagen',1,'2026-07-07 22:05:41','2026-07-07 22:05:41',NULL),(5,'Suzuki',1,'2026-07-07 22:06:12','2026-07-07 22:06:12',NULL),(6,'Nissan',1,'2026-07-07 23:26:07','2026-07-07 23:26:07',NULL);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `car_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_deliveries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned NOT NULL,
  `handover_date` datetime NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivered_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `received_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `odometer` int NOT NULL,
  `status` enum('Scheduled','Completed','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Scheduled',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `handover_items` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `car_deliveries_sale_id_foreign` (`sale_id`),
  CONSTRAINT `car_deliveries_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `car_deliveries` WRITE;
/*!40000 ALTER TABLE `car_deliveries` DISABLE KEYS */;
INSERT INTO `car_deliveries` VALUES (2,4,'2026-07-06 06:22:00','Showroom','Semua','NI PUTU SUTARINI',62000,'Completed',NULL,'[\"Car (Mobil)\", \"BPKB\", \"Faktur\", \"STNK\", \"Spare Key (Kunci Cadangan)\", \"Manual Book (Buku Manual)\", \"Service Booklet (Buku Servis)\", \"Tool Kit / Jack (Dongkrak)\", \"First Aid Kit (P3K)\", \"Floor Mats (Karpet)\", \"Spare Tire (Ban Serep)\"]','2026-07-07 22:23:57','2026-07-07 22:23:57',NULL),(3,5,'2026-07-18 05:55:00','Showroom','Pak Gon','I GUSTI LANANG MANTRA,SH',45000,'Completed','Lengkap semuanya','[\"Car (Mobil)\", \"BPKB\", \"Faktur\", \"STNK\", \"Spare Key (Kunci Cadangan)\", \"Manual Book (Buku Manual)\", \"Service Booklet (Buku Servis)\", \"Tool Kit / Jack (Dongkrak)\", \"First Aid Kit (P3K)\", \"Floor Mats (Karpet)\", \"Spare Tire (Ban Serep)\"]','2026-07-27 21:56:31','2026-07-27 21:56:31',NULL);
/*!40000 ALTER TABLE `car_deliveries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `car_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `car_id` bigint unsigned NOT NULL,
  `bpkb_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_on_bpkb` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bpkb_status` enum('Ready','Pledged','In Process','Released') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bpkb_storage_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bpkb_notes` text COLLATE utf8mb4_unicode_ci,
  `stnk_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_on_stnk` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annual_tax_expired` date DEFAULT NULL,
  `plate_expired` date DEFAULT NULL,
  `stnk_status` enum('Active','Expired','Blocked','In Process') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stnk_notes` text COLLATE utf8mb4_unicode_ci,
  `faktur_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faktur_is_available` tinyint(1) NOT NULL DEFAULT '0',
  `faktur_notes` text COLLATE utf8mb4_unicode_ci,
  `tnkb_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tnkb_notes` text COLLATE utf8mb4_unicode_ci,
  `combined_pdf_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `car_documents_bpkb_number_unique` (`bpkb_number`),
  UNIQUE KEY `car_documents_stnk_number_unique` (`stnk_number`),
  UNIQUE KEY `car_documents_faktur_number_unique` (`faktur_number`),
  KEY `car_documents_car_id_foreign` (`car_id`),
  CONSTRAINT `car_documents_car_id_foreign` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `car_documents` WRITE;
/*!40000 ALTER TABLE `car_documents` DISABLE KEYS */;
INSERT INTO `car_documents` VALUES (2,3,'W-03033469','NGAKAN MADE WIDIATMIKA','Ready','Showroom',NULL,'01894625-J','NGAKAN MADE WIDIATMIKA','2027-06-12','2031-06-12','Active',NULL,'I19F/00025/AA1B/2022',1,NULL,NULL,NULL,'documents/cars/vLVAclINC9wj7kPjALesan9lfpMDsIXUaRfpFOhj.pdf','2026-07-07 22:15:53','2026-07-07 22:15:53',NULL),(3,4,'W-03005203','NINYOMAN MARNI','Ready','Showroom',NULL,'15959312-I','NINYOMAN MARNI','2026-12-12','2030-12-12','Active',NULL,'IPF/00020/ABBA/2024',1,NULL,NULL,NULL,'documents/cars/rTobO59rDGXfrfATm3FeoYnT9U3swILUzwmD2Nc6.pdf','2026-07-07 22:32:48','2026-07-07 22:32:48',NULL),(4,5,'T-02769025','PT. PULO AIRBLRU','Ready','Showroom',NULL,'09353897-I','PT. PULO AIRBLRU','2027-01-10','2028-01-10','Active',NULL,'22116225-RV3DN2443-010',1,NULL,NULL,NULL,'documents/cars/XajOabNtvQ7RhRXxvi4mlpmnDngZGwXtqHCNdoqA.pdf','2026-07-07 22:41:26','2026-07-07 22:41:26',NULL),(5,6,'V-03238026','INYOMAN MUDITA','Ready','Showroom',NULL,'12351915-I','INYOMAN MUDITA','2026-08-22','2030-08-22','Active',NULL,'F/00017/ZR69/2014',1,NULL,NULL,NULL,'documents/cars/1D42JiVfGQX9OsLV14DSvXRw8SJXZhoFjKCsFcO7.pdf','2026-07-07 22:48:34','2026-07-07 22:48:34',NULL),(6,7,'S-01748841','I WAYAN SUTAWAN','Pledged','Finance',NULL,'11918822-F','I WAYAN SUTAWAN','2026-07-24','2028-07-24','Active',NULL,NULL,0,NULL,NULL,NULL,'documents/cars/kvgg1NQdIVkJQjIfTwwn6HYGvVM6G8LhB5LyeNxa.pdf','2026-07-07 23:19:16','2026-07-07 23:19:16',NULL),(7,8,'V-00422020','I GEDE RASA YADNYA','Ready','Showroom',NULL,'06756059-H','I GEDE RASA YADNYA','2026-05-18','2029-05-18','Expired',NULL,'YJF/00040/ABID/2024',1,NULL,NULL,NULL,'documents/cars/4Wf4tYpFmM5qLdBwMB2gGPoxrJikOEpNWvwKGCtW.pdf','2026-07-07 23:25:15','2026-07-07 23:25:28',NULL),(8,9,'S-04967693','MUCHAMAD HARUN ROSIDI','Ready','Showroom',NULL,'03282773-G','MUCHAMAD HARUN ROSIDI','2026-07-26','2028-07-26','Active',NULL,'113424',1,NULL,NULL,NULL,'documents/cars/c8J6fwoMF1PR5B2YYvs5o7GiUJVkGvMBKNhFoSP8.pdf','2026-07-07 23:30:24','2026-07-07 23:30:24',NULL),(9,10,'V-06551817','I KOMANG AGUS PARIANA','Ready','Showroom',NULL,'20149088-H','I KOMANG AGUS PARIANA','2026-12-12','2029-12-12','Active',NULL,'FW2016-000560',1,NULL,NULL,NULL,'documents/cars/j11mSuL1CQtAL4jJPfAuJT04qt3YPV8fC1ISqut6.pdf','2026-07-07 23:35:16','2026-07-07 23:35:16',NULL),(10,11,'W-03034351','NGAKAN MADE WIDIATMIKA','Ready','Showroom',NULL,'16132206-1','NGAKAN MADE WIDIATMIKA','2027-01-09','2031-01-09','Active',NULL,'IDF/01101/6386/2019',1,NULL,NULL,NULL,'documents/cars/Ki3YjpXGDHDfvKdU7NOi5z4bYPMtjjNYeX2OwZXu.pdf','2026-07-07 23:39:52','2026-07-07 23:39:52',NULL),(11,12,'R-02311175','ALIFAH VANIA SUBRATA','Ready','Showroom',NULL,'03290189E','ALIFAH VANIA SUBRATA','2026-08-24','2026-08-23','Active','Segera di samsat','D265-P000000337-21',1,NULL,NULL,NULL,'documents/cars/yPxT68XAAr6lJziZbSZ0xfom7cu7D9PcVVnKu5Ih.pdf','2026-07-13 19:54:19','2026-07-13 19:54:19',NULL),(12,14,'O-04572321','I NENGAH SUDINDRA','Ready','Showroom',NULL,'13187144 .G','I NENGAH SUDINDRA','2025-12-03','2028-12-03','Active',NULL,'IE2F/01015/EA3J/2015',1,NULL,NULL,NULL,'documents/cars/fqpJaBnUKRumpewZGlNgHs8bYgU5jESv5TmKR2Yk.pdf','2026-07-21 20:42:22','2026-07-21 20:42:22',NULL),(13,15,'W-03003156','NIKADEK DIAN PUSPITA DEWI','Ready','Showroom',NULL,'16053686.I','NIKADEK DIAN PUSPITA DEWI','2027-03-12','2031-03-12','Active',NULL,'IFF/00144/AB1B/2022',1,NULL,NULL,NULL,'documents/cars/qjJjY9hjsKc9yKnPxLBjDwTYNKUzLH5ZT4wjkbi2.pdf','2026-07-21 20:45:54','2026-07-21 20:47:50',NULL),(14,16,'O-04571233','NI KETUT SUMIATI','Ready','Showroom',NULL,'05107521.G','NI KETUT SUMIATI','2026-10-03','2028-10-03','Active',NULL,'-',0,'Faktur Tidak Tersedia',NULL,NULL,'documents/cars/ztlW7YuKfMe2a9E2h4OgqYH0VYDK99AvUE537EqO.pdf','2026-07-21 20:53:27','2026-07-21 20:54:48',NULL);
/*!40000 ALTER TABLE `car_documents` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `car_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_expenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `car_id` bigint unsigned NOT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `car_expenses_car_id_foreign` (`car_id`),
  CONSTRAINT `car_expenses_car_id_foreign` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `car_expenses` WRITE;
/*!40000 ALTER TABLE `car_expenses` DISABLE KEYS */;
INSERT INTO `car_expenses` VALUES (1,16,'2026-07-25',1700000.00,'Cat mobil','2026-07-27 21:46:12','2026-07-27 21:46:12',NULL);
/*!40000 ALTER TABLE `car_expenses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cars` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `brand_id` bigint unsigned NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `car_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transmission` enum('Manual','Matic') COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_plate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chassis_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `engine_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `entry_date` date NOT NULL,
  `initial_selling_price` decimal(15,2) NOT NULL,
  `status` enum('Available','Sold','Pending') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cars_license_plate_unique` (`license_plate`),
  UNIQUE KEY `cars_chassis_number_unique` (`chassis_number`),
  KEY `cars_brand_id_foreign` (`brand_id`),
  CONSTRAINT `cars_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cars` WRITE;
/*!40000 ALTER TABLE `cars` DISABLE KEYS */;
INSERT INTO `cars` VALUES (3,1,'GR Turbo','Raize',2022,'Hitam','Matic','DK 1886 KAE','MHKAA1BA9NJ043692','1KRA687246',200000000.00,'2026-06-01',215000000.00,'Sold',NULL,'2026-07-07 22:10:50','2026-07-07 22:22:13',NULL),(4,1,'2.0 Hybrid TSS','Innova Zenix',2023,'Hitam','Matic','DK 1696 AEB','MHFABBAAXPO417576','M20ANB54240',465000000.00,'2026-06-01',489000000.00,'Sold',NULL,'2026-07-07 22:30:55','2026-07-21 21:25:24',NULL),(5,3,'SE CVT 1.5','H-RV',2022,'Abu Abu Meteor Metalik','Matic','82949FRM','MHRRV3070N7212002','L15ZF1317646',290000000.00,'2026-06-01',325000000.00,'Available',NULL,'2026-07-07 22:37:54','2026-07-07 22:37:54',NULL),(6,1,'G Disel VNT Turbo 2.0','Fortuner',2014,'Hitam Metalik','Matic','DK 1145 ADW','MHFZR69G4E3086536','2KDU435571',255500000.00,'2026-06-01',269000000.00,'Available',NULL,'2026-07-07 22:46:10','2026-07-07 22:46:10',NULL),(7,5,'MT 1.0L','Spresso',2023,'Oranye','Manual','DK 1341 MP','MA3RFL61SPA-421933','K10CNC-228107',0.00,'2026-06-01',0.00,'Available',NULL,'2026-07-07 23:17:13','2026-07-07 23:17:13',NULL),(8,1,'G 1.5','Avanza',2024,'Hitam Metalik','Manual','DK1649V0','MHKAB1BY8RK081330\'','2NR4C16513',190000000.00,'2026-06-01',225000000.00,'Available',NULL,'2026-07-07 23:22:22','2026-07-07 23:22:22',NULL),(9,6,'2.5 2WD CVT XT','X-Trail',2010,'Hitam Metalik','Matic','DK 1542 FBR','MHBF2CFIAAJ005289','QR25931630A',86000000.00,'2026-06-01',108000000.00,'Available',NULL,'2026-07-07 23:28:27','2026-07-07 23:28:27',NULL),(10,4,'GT 1.5 Turbo','Polo',2016,'Hitam Metalik','Matic','DK 1285 KD','WVWZZZ6OZGT075584','CBZK34322',135000000.00,'2026-06-01',135000000.00,'Available',NULL,'2026-07-07 23:33:18','2026-07-07 23:33:18',NULL),(11,1,'TRD Sportivo','Fortuner',2019,'Abu Abu Metalik','Matic','DK 1654 KAD','MHFGB8GS1K0905126','2GDC643788',0.00,'2026-06-01',0.00,'Available',NULL,'2026-07-07 23:37:32','2026-07-07 23:37:32',NULL),(12,2,'ADS Turbo','Rocky',2021,'Abu Abu','Matic','D 1025 UBG','MHKAA1AAXMJ001242','1KRA594806',160000000.00,'2026-06-01',188000000.00,'Available',NULL,'2026-07-13 19:49:24','2026-07-13 19:51:33',NULL),(13,3,'Satya E','Brio',2020,'Putih','Manual','DK 1610 ABZ','MHRDD1750LJ900844','L12B32390517',112000000.00,'2026-07-01',146000000.00,'Available',NULL,'2026-07-15 03:22:26','2026-07-27 22:06:31',NULL),(14,1,'G','Avanza',2015,'Putih','Manual','DK 1031 QI','MHKM5EA3JFJ018164','1NRF056439',115000000.00,'2026-07-13',134000000.00,'Pending',NULL,'2026-07-15 03:24:33','2026-07-27 22:04:29',NULL),(15,1,'Veloz Q TSS','Avanza',2022,'Hitam','Matic','DK 1218 FCU','MHFAB1BY4N0014907','2NRX812463',220000000.00,'2026-07-20',237000000.00,'Available',NULL,'2026-07-21 20:45:13','2026-07-27 21:57:37',NULL),(16,1,'G 1.5','Avanza',2014,'Silver Metalik','Manual','DK 1552 QG','MHKM1BA3JEJ078682','ME25740',100000000.00,'2026-07-16',125000000.00,'Available',NULL,'2026-07-21 20:51:40','2026-07-27 21:59:14',NULL);
/*!40000 ALTER TABLE `cars` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_id_number_unique` (`id_number`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (2,'5105036009750003','NI PUTU SUTARINI','-','Dusun Gede Desa Akah','2026-07-07 22:18:52','2026-07-07 22:18:52',NULL),(3,'5107021410730001','I GUSTI LANANG MANTRA, SH','-','Br. Dinas Budamanis','2026-07-21 20:57:45','2026-07-21 20:57:45',NULL),(4,'5106041303890010','GUSTI PUTU YASTIKA','085739601141','Br. Glagalingah','2026-07-27 21:52:24','2026-07-27 21:52:24',NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `document_processes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_processes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `car_id` bigint unsigned NOT NULL,
  `process_type` enum('Perpanjangan STNK Tahunan','Perpanjangan STNK 5 Tahunan','Balik Nama BPKB','Mutasi','Pembuatan Plat Baru','Lain-lain') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','In Process','Completed','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `processor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date NOT NULL,
  `estimated_completion_date` date DEFAULT NULL,
  `actual_completion_date` date DEFAULT NULL,
  `cost` decimal(15,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `document_processes_car_id_foreign` (`car_id`),
  CONSTRAINT `document_processes_car_id_foreign` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `document_processes` WRITE;
/*!40000 ALTER TABLE `document_processes` DISABLE KEYS */;
INSERT INTO `document_processes` VALUES (1,12,'Mutasi','In Process','Aipda Teddy','2026-07-15','2026-07-22',NULL,1250000.00,'Kirim JNT : 21.200','2026-07-15 03:26:15','2026-07-15 03:26:15',NULL);
/*!40000 ALTER TABLE `document_processes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_06_27_161054_create_brands_table',1),(5,'2026_06_27_161057_create_cars_table',1),(6,'2026_06_27_161057_create_customers_table',1),(7,'2026_06_27_161058_create_car_expenses_table',1),(8,'2026_06_27_161058_create_sales_table',1),(9,'2026_06_27_161059_create_payments_table',1),(10,'2026_06_27_161059_create_trade_ins_table',1),(11,'2026_06_27_161100_create_photos_table',1),(12,'2026_07_04_064834_create_document_processes_table',1),(13,'2026_07_04_223046_create_car_documents_table',1),(14,'2026_07_05_083222_create_car_deliveries_table',1),(15,'2026_07_05_083222_create_tasks_table',1),(16,'2026_07_05_144033_add_items_to_car_deliveries',1),(17,'2026_07_06_081108_add_company_details_to_users_table',1),(18,'2026_07_07_100450_add_soft_deletes_to_all_tables',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_type` enum('Down Payment','Installment','Settlement') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` enum('Cash','Transfer','Finance','QRIS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_sale_id_foreign` (`sale_id`),
  CONSTRAINT `payments_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (3,4,'2026-07-08',1000000.00,'Down Payment','Transfer','Di transfer ke bank BCA rama','2026-07-07 22:21:14','2026-07-07 22:21:14',NULL),(4,4,'2026-07-06',214000000.00,'Settlement','Cash',NULL,'2026-07-07 22:22:13','2026-07-07 22:22:13',NULL),(5,5,'2026-07-25',260000000.00,'Settlement','Transfer',NULL,'2026-07-21 21:25:24','2026-07-21 21:25:24',NULL),(6,6,'2026-07-26',5000000.00,'Down Payment','Cash',NULL,'2026-07-27 21:54:28','2026-07-27 21:54:28',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `imageable_id` bigint unsigned NOT NULL,
  `imageable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
INSERT INTO `photos` VALUES (4,1,'App\\Models\\CarDelivery','deliveries/photos/0WwmfTBImCoNSub8JjRlTB1MWR0xoLIGG087xjWY.jpg','Kaoruko Waguri.jpg',0,'2026-07-07 21:50:28','2026-07-07 21:50:28',NULL),(5,3,'App\\Models\\Car','cars/photos/aIb2gFFdmjZrzFDuEjpLsMwChdMJT82UMiIEVAbZ.jpg','WhatsApp Image 2026-07-08 at 2.10.18 PM.jpeg',0,'2026-07-07 22:10:50','2026-07-07 22:10:50',NULL),(6,2,'App\\Models\\Customer','customers/photos/Y7G4dTExG6KaH6xJL00lYlo28GEhXsJHmZ1CaVUL.jpg','WhatsApp Image 2026-07-08 at 2.17.08 PM.jpeg',0,'2026-07-07 22:18:52','2026-07-07 22:18:52',NULL),(7,2,'App\\Models\\CarDelivery','deliveries/photos/7fyB7Mievf61t2aYrYLqav7NTLG6cWYvG0TzJQEq.jpg','WhatsApp Image 2026-07-08 at 2.23.37 PM.jpeg',0,'2026-07-07 22:23:57','2026-07-07 22:23:57',NULL),(8,4,'App\\Models\\Car','cars/photos/io3sSexwVcOu3SOfxPUIcpIWcrEQlzzGl3PeJx0C.jpg','IMG_20260525_135057_656.jpg',0,'2026-07-07 22:30:55','2026-07-07 22:30:55',NULL),(9,5,'App\\Models\\Car','cars/photos/7SRRAiB4adAPMMJIxCjqNRgWALcrvqPBzguhCpxn.jpg','WhatsApp Image 2026-07-08 at 2.37.28 PM.jpeg',0,'2026-07-07 22:37:54','2026-07-07 22:37:54',NULL),(10,6,'App\\Models\\Car','cars/photos/scfVuOXv3DyhloYR77BfyIUpji79BBqlNlnV1dwG.jpg','WhatsApp Image 2026-07-08 at 2.45.17 PM.jpeg',0,'2026-07-07 22:46:10','2026-07-07 22:46:10',NULL),(11,11,'App\\Models\\Car','cars/photos/g52poYBnHGic5QcYNeQprzduczC9xERSM34QS9WB.jpg','IMG_20260525_141725_219.jpg',0,'2026-07-07 23:37:32','2026-07-07 23:37:32',NULL),(12,12,'App\\Models\\Car','cars/photos/4gTN9Zo3WvC99O4yY18wmNGTlD5NzVpMZ3aFw4yv.jpg','1.jpg',0,'2026-07-13 19:49:24','2026-07-13 19:51:33','2026-07-13 19:51:33'),(13,12,'App\\Models\\Car','cars/photos/QZbax05fISSGumEfAgHkXNw9EEeoaTe4lBXtLmfo.jpg','2.jpg',0,'2026-07-13 19:49:24','2026-07-13 19:51:33','2026-07-13 19:51:33'),(14,15,'App\\Models\\Car','cars/photos/QHX2hv5wdL5FXxAZGA8BXyHjjTu8C5vw9ENKcYl5.jpg','WhatsApp Image 2026-07-19 at 10.03.43 AM.jpeg',0,'2026-07-21 20:45:13','2026-07-21 20:45:13',NULL),(15,13,'App\\Models\\Car','cars/photos/BvyQSNGjmfz8nib7t4f2ge2i0lhwnu8ryb1UxXRb.jpg','WhatsApp Image 2026-07-19 at 10.04.05 AM.jpeg',0,'2026-07-21 20:48:40','2026-07-21 20:48:40',NULL),(16,3,'App\\Models\\Customer','customers/photos/FtbSRpCFXDMEsrrYnpG78x76FGQEsZYoAfMyL8Js.jpg','WhatsApp Image 2026-07-18 at 5.31.44 PM.jpeg',0,'2026-07-21 20:57:45','2026-07-21 20:57:45',NULL),(17,4,'App\\Models\\Customer','customers/photos/8gzsqH4TVYbIFQIJbXAgSbKl81qe5QhUitVtSAfO.jpg','WhatsApp Image 2026-07-28 at 1.47.19 PM.jpeg',0,'2026-07-27 21:52:24','2026-07-27 21:52:24',NULL);
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `car_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `transaction_date` date NOT NULL,
  `agreed_price` decimal(15,2) NOT NULL,
  `transaction_type` enum('Cash','Credit','Trade-In') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_status` enum('Pending','Installment','Paid','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_car_id_foreign` (`car_id`),
  KEY `sales_customer_id_foreign` (`customer_id`),
  CONSTRAINT `sales_car_id_foreign` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`),
  CONSTRAINT `sales_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (4,3,2,'2026-07-01',215000000.00,'Credit','Paid',NULL,'2026-07-07 22:20:37','2026-07-07 22:22:13',NULL),(5,4,3,'2026-07-18',480000000.00,'Trade-In','Paid',NULL,'2026-07-21 20:58:37','2026-07-21 21:25:24',NULL),(6,14,4,'2026-07-26',129500000.00,'Cash','Installment','Baru ter DP Rp. 5.000.000','2026-07-27 21:53:46','2026-07-27 21:59:14',NULL);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('Dua3DK0rB0ahWPoar6JmcDBNLjrFlgrGt62nRG2n',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.129.1 Chrome/148.0.7778.280 Electron/42.6.0 Safari/537.36','eyJfdG9rZW4iOiJ2cDZ3bmVnTjFxUVpRMUloTUxtYlpRakZMaVJyc3VvRkxad2NiTE81IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9sb2dpbiIsInJvdXRlIjoibG9naW4ifSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1785217493),('qH11DjVbQCODsIfRFz5euA3oTXa0QbAyhkomqNgZ',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJQaHg5YkxaTDBhaXZ0SlJQM1pEMXZPeDVKTGp4NUpoM1c5WndhSmFvIiwidXJsIjp7ImludGVuZGVkIjoiaHR0cDpcL1wvMTI3LjAuMC4xOjgwMDBcL3NhbGVzIn0sIl9wcmV2aW91cyI6eyJ1cmwiOiJodHRwOlwvXC8xMjcuMC4wLjE6ODAwMFwvY2FycyIsInJvdXRlIjoiY2Fycy5pbmRleCJ9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX0sImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjoxfQ==',1785226211);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `priority` enum('Low','Medium','High') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `status` enum('Pending','In Progress','Completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `taskable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taskable_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_taskable_type_taskable_id_index` (`taskable_type`,`taskable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (2,'Samsat Tahunan','Suzuki Spresso','2026-07-20','High','Completed','App\\Models\\Car',7,'2026-07-07 23:19:49','2026-07-27 21:58:20',NULL),(3,'Kirim Berkas Rocky Ke Bandung','Sudah terkirim dari bali tanggal : 15/07/2026 (JNT)','2026-08-01','High','Completed','App\\Models\\Car',12,'2026-07-13 19:55:08','2026-07-21 20:00:21',NULL),(4,'Samsat Tahunan',NULL,'2026-07-23','High','Completed','App\\Models\\Car',9,'2026-07-21 20:01:23','2026-07-27 21:58:16',NULL),(5,'Samsat Tahunan','Mati Pajak 1 kali, mobil sudah ter DP tetapi belum di samsat',NULL,'High','Pending','App\\Models\\Car',14,'2026-07-21 20:42:47','2026-07-27 22:00:06',NULL),(6,'Ambil notis pajak di samsat renon','Mobil X-Trail 2010','2026-07-29','Medium','Pending',NULL,NULL,'2026-07-27 22:00:32','2026-07-27 22:00:32',NULL);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `trade_ins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trade_ins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned NOT NULL,
  `brand_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_plate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appraisal_price` decimal(15,2) NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `trade_ins_sale_id_foreign` (`sale_id`),
  CONSTRAINT `trade_ins_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `trade_ins` WRITE;
/*!40000 ALTER TABLE `trade_ins` DISABLE KEYS */;
INSERT INTO `trade_ins` VALUES (4,5,'Toyota','Avanza Veloz Q TSS','2022','DK 1218 FCU',220000000.00,NULL,'2026-07-21 21:00:04','2026-07-21 21:24:56',NULL);
/*!40000 ALTER TABLE `trade_ins` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_address` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Rama Dwipa','telagaberlian@tbm-motor.ac.id',NULL,'$2y$12$PNUidDC1Wv7SZ3kG9b7SCOqyMCg.tcV9L2VR2Cumd9m2Hrw5xzXye','xAWjB5tM9M','2026-07-07 21:13:10','2026-07-13 19:42:36','Telaga Berlian Motor','logos/Rce7DAzrYCBiYPKvJiR2UsAbQ7kiVCcHFhbA85X3.png','Jalan Raya Batubulan No.99X Sukawati Gianyar',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

