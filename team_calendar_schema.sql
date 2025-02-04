-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: team_calendar
-- ------------------------------------------------------
-- Server version	8.0.41-0ubuntu0.22.04.1

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

--
-- Table structure for table `Announcements`
--

DROP TABLE IF EXISTS `Announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Announcements`
--

LOCK TABLES `Announcements` WRITE;
/*!40000 ALTER TABLE `Announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `Announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EventTags`
--

DROP TABLE IF EXISTS `EventTags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EventTags` (
  `event_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`event_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `EventTags_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `EventTags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EventTags`
--

LOCK TABLES `EventTags` WRITE;
/*!40000 ALTER TABLE `EventTags` DISABLE KEYS */;
INSERT INTO `EventTags` VALUES (98,1),(99,1),(98,2),(98,3),(16,6);
/*!40000 ALTER TABLE `EventTags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `tag_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reminder_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `tag_id` (`tag_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `Events_ibfk_1` FOREIGN KEY (`tag_id`) REFERENCES `Tags` (`id`),
  CONSTRAINT `Events_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Events`
--

LOCK TABLES `Events` WRITE;
/*!40000 ALTER TABLE `Events` DISABLE KEYS */;
INSERT INTO `Events` VALUES (16,'교육과정 세움주간','교육과정 세움주간 테스트','2025-02-19 08:00:00','2025-02-21 16:30:00',NULL,1,'2025-01-04 04:24:26','2025-01-04 04:24:26',0),(40,'1월1일','공휴일','2024-01-01 09:00:00','2024-01-01 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-27 09:23:09',0),(41,'설날','공휴일','2024-02-09 09:00:00','2024-02-09 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-27 09:53:01',0),(42,'설날','공휴일','2024-02-10 09:00:00','2024-02-10 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-27 09:53:19',0),(43,'설날','공휴일','2024-02-11 09:00:00','2024-02-11 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(44,'대체공휴일(설날)','공휴일','2024-02-12 09:00:00','2024-02-12 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(45,'삼일절','공휴일','2024-03-01 09:00:00','2024-03-01 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(46,'국회의원선거','공휴일','2024-04-10 09:00:00','2024-04-10 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(47,'어린이날','공휴일','2024-05-05 09:00:00','2024-05-05 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(48,'대체공휴일(어린이날)','공휴일','2024-05-06 09:00:00','2024-05-06 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(49,'부처님오신날','공휴일','2024-05-15 09:00:00','2024-05-15 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(50,'현충일','공휴일','2024-06-06 09:00:00','2024-06-06 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(51,'광복절','공휴일','2024-08-15 09:00:00','2024-08-15 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(52,'추석','공휴일','2024-09-16 09:00:00','2024-09-16 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(53,'추석','공휴일','2024-09-17 09:00:00','2024-09-17 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(54,'추석','공휴일','2024-09-18 09:00:00','2024-09-18 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(55,'임시공휴일','공휴일','2024-10-01 09:00:00','2024-10-01 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(56,'개천절','공휴일','2024-10-03 09:00:00','2024-10-03 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(57,'한글날','공휴일','2024-10-09 09:00:00','2024-10-09 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(58,'기독탄신일','공휴일','2024-12-25 09:00:00','2024-12-25 09:00:00',9,1,'2025-01-06 03:56:11','2025-01-23 07:56:41',0),(59,'1월1일','공휴일','2025-01-01 09:00:00','2025-01-01 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(60,'설날','공휴일','2025-01-28 09:00:00','2025-01-28 09:00:00',9,1,'2025-01-06 03:57:14','2025-02-02 11:16:36',0),(61,'설날','공휴일','2025-01-29 09:00:00','2025-01-29 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(62,'설날','공휴일','2025-01-30 09:00:00','2025-01-30 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(63,'삼일절','공휴일','2025-03-01 09:00:00','2025-03-01 09:00:00',9,1,'2025-01-06 03:57:14','2025-02-02 11:16:36',1),(64,'대체공휴일','공휴일','2025-03-03 09:00:00','2025-03-03 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(65,'어린이날','공휴일','2025-05-05 09:00:00','2025-05-05 09:00:00',9,1,'2025-01-06 03:57:14','2025-02-02 11:16:36',0),(66,'부처님오신날','공휴일','2025-05-05 09:00:00','2025-05-05 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(67,'대체공휴일','공휴일','2025-05-06 09:00:00','2025-05-06 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(68,'현충일','공휴일','2025-06-06 09:00:00','2025-06-06 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(69,'광복절','공휴일','2025-08-15 09:00:00','2025-08-15 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(70,'개천절','공휴일','2025-10-03 09:00:00','2025-10-03 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(71,'추석','공휴일','2025-10-05 09:00:00','2025-10-05 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(72,'추석','공휴일','2025-10-06 09:00:00','2025-10-06 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(73,'추석','공휴일','2025-10-07 09:00:00','2025-10-07 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(74,'대체공휴일','공휴일','2025-10-08 09:00:00','2025-10-08 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(75,'한글날','공휴일','2025-10-09 09:00:00','2025-10-09 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(76,'기독탄신일','공휴일','2025-12-25 09:00:00','2025-12-25 09:00:00',9,1,'2025-01-06 03:57:14','2025-01-23 07:56:41',0),(82,'시간확인예시2','0909','2025-01-09 00:00:00','2025-01-09 01:00:00',NULL,1,'2025-01-23 02:56:46','2025-01-23 02:56:46',0),(98,'123태스트','test','2025-01-15 09:00:00','2025-01-15 10:00:00',NULL,1,'2025-01-25 08:02:30','2025-01-25 08:02:30',0),(99,'테스트1','','2025-02-04 09:00:00','2025-02-04 10:00:00',NULL,1,'2025-02-02 08:55:49','2025-02-02 08:55:49',0);
/*!40000 ALTER TABLE `Events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Periods`
--

DROP TABLE IF EXISTS `Periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `period` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `Periods_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Periods`
--

LOCK TABLES `Periods` WRITE;
/*!40000 ALTER TABLE `Periods` DISABLE KEYS */;
/*!40000 ALTER TABLE `Periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PurchaseItems`
--

DROP TABLE IF EXISTS `PurchaseItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `participant_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `specification` varchar(255) DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` int NOT NULL,
  `delivery_fee` int NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `participant_id` (`participant_id`),
  CONSTRAINT `PurchaseItems_ibfk_1` FOREIGN KEY (`participant_id`) REFERENCES `PurchaseParticipants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseItems`
--

LOCK TABLES `PurchaseItems` WRITE;
/*!40000 ALTER TABLE `PurchaseItems` DISABLE KEYS */;
INSERT INTO `PurchaseItems` VALUES (25,33,'자','10cm',10,1000,3000,'지마켓','2025-02-04 06:54:53');
/*!40000 ALTER TABLE `PurchaseItems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PurchaseParticipants`
--

DROP TABLE IF EXISTS `PurchaseParticipants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseParticipants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `participant_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `PurchaseParticipants_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `PurchaseRequests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseParticipants`
--

LOCK TABLES `PurchaseParticipants` WRITE;
/*!40000 ALTER TABLE `PurchaseParticipants` DISABLE KEYS */;
INSERT INTO `PurchaseParticipants` VALUES (33,7,'1반','2025-02-04 06:53:09'),(34,7,'2반','2025-02-04 06:53:12');
/*!40000 ALTER TABLE `PurchaseParticipants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PurchaseRequests`
--

DROP TABLE IF EXISTS `PurchaseRequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseRequests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PurchaseRequests`
--

LOCK TABLES `PurchaseRequests` WRITE;
/*!40000 ALTER TABLE `PurchaseRequests` DISABLE KEYS */;
INSERT INTO `PurchaseRequests` VALUES (7,'테스트1','2025-02-04 06:52:59',100000),(8,'테스트2','2025-02-04 06:54:36',100000);
/*!40000 ALTER TABLE `PurchaseRequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Tags`
--

DROP TABLE IF EXISTS `Tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `color` varchar(7) DEFAULT '#FFFFFF',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Tags`
--

LOCK TABLES `Tags` WRITE;
/*!40000 ALTER TABLE `Tags` DISABLE KEYS */;
INSERT INTO `Tags` VALUES (1,'1반','#fb0909','2025-01-03 01:17:16'),(2,'2반','#5a03dd','2025-01-03 01:17:19'),(3,'3반','#bbff00','2025-01-03 01:17:22'),(4,'4반','#c436b1','2025-01-03 01:17:24'),(5,'5반','#462020','2025-01-03 01:17:27'),(6,'학년','#880c0c','2025-01-03 01:17:38'),(9,'holiday','#2e1e1e','2025-01-06 03:32:44');
/*!40000 ALTER TABLE `Tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'Admin User','admin@example.com','admin','2024-12-15 00:27:23');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-04 17:43:17
