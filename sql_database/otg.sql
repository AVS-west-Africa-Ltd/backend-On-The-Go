-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 05, 2025 at 11:06 AM
-- Server version: 10.6.20-MariaDB-cll-lve-log
-- PHP Version: 8.3.15

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `onthelbo_otgdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `Businesses`
--

CREATE TABLE `Businesses` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `amenities` text DEFAULT NULL,
  `cacDoc` varchar(255) DEFAULT NULL,
  `social` text DEFAULT NULL,
  `hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}' CHECK (json_valid(`hours`)),
  `wifi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}' CHECK (json_valid(`wifi`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Businesses`
--

INSERT INTO `Businesses` (`id`, `userId`, `name`, `type`, `address`, `description`, `logo`, `amenities`, `cacDoc`, `social`, `hours`, `wifi`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Oladimeji Ventures', 'Partnership', 'Kubwa, Abuja', 'Startup', NULL, 'Wifi, Coffee', NULL, '[]', '{}', '{}', '2024-12-11 07:13:51', '2024-12-11 07:13:51'),
(2, 2, 'My new tech company', 'Service', 'Kubwa, Abuja', 'We are into lots of tech deliverables', NULL, '\"[\\\"Parking\\\",\\\"Wi-Fi\\\"]\"', NULL, '[]', '{}', '{}', '2024-12-11 07:14:47', '2025-01-07 11:17:52'),
(3, 1, 'Nacho Gadget store', 'Sole', 'SUITE 113, NWUKPABI PLAZA, PLOT 14 Ibrahim Jalo Waziri St, DISTRICT, Abuja 900118, Federal Capital Territory', 'Business management consultant in Abuja', NULL, 'Wifi', NULL, '[]', '{}', '{}', '2024-12-12 13:50:27', '2024-12-12 13:50:27'),
(4, 1, 'Nacho Gadget store', 'Sole', 'SUITE 113, NWUKPABI PLAZA, PLOT 14 Ibrahim Jalo Waziri St, DISTRICT, Abuja 900118, Federal Capital Territory', 'Business management consultant in Abuja', NULL, 'Wifi', NULL, '[{\"facebook\":\"url\"},{\"instagram\":\"url\"}]', '{}', '{}', '2024-12-12 13:54:40', '2024-12-12 13:54:40'),
(5, 1, 'WAYBY CLASSIC FURNITURE', 'Sole', '5 Yohana Madaki Street, Road, off Kubwa Express Road, Kaba, Abuja 900110, Federal Capital Territory', 'Business management consultant in Abuja', NULL, 'Wifi', NULL, '[{\"facebook\":\"url\"},{\"instagram\":\"url\"}]', '{}', '{}', '2024-12-12 14:00:28', '2024-12-12 14:00:28'),
(6, 1, 'TheShowroomng | Furniture Store In Abuja', 'Sole', '145 Adetokunbo Ademola Cres, Wuse 2, Abuja 904101, Federal Capital Territory', 'Business management consultant in Abuja', NULL, 'Wifi, Defibrilator', NULL, '[{\"facebook\":\"url\"},{\"instagram\":\"url\"}]', '{}', '{}', '2024-12-12 14:05:17', '2024-12-12 14:05:17'),
(7, 1, 'Betro Furniture', 'Sole', 'Plot 404 Ahmadu Bello Wy, off Gimbiya Street, Garki, Abuja 900103, Federal Capital Territory', 'Business management consultant in Abuja', NULL, 'Wifi', NULL, '[{\"facebook\":\"url\"},{\"instagram\":\"url\"}]', '{}', '{}', '2024-12-12 14:07:19', '2024-12-12 14:07:19'),
(8, 1, 'Gudu Mechanic Village', 'Sole', 'XFVC+JFJ, Unnamed Road, Abuja 900110, Federal Capital Territory', 'Business management consultant in Abuja', NULL, 'Wifi', NULL, '[{\"facebook\":\"url\"},{\"instagram\":\"url\"}]', '{}', '{}', '2024-12-12 14:11:54', '2024-12-12 14:11:54'),
(9, 10, 'Ola Tech', 'Service', 'Gwarimpa, Abuja', 'We tends to solve economic problems with tech', 'https://api.onthegoafrica.com/uploads/business_posts/1734974206657-rn_image_picker_lib_temp_c6ddfe2b-15fa-40de-81fb-e9ab692f73ed.jpg', '\"Wi-Fi,Parking\"', 'https://api.onthegoafrica.com/uploads/business_posts/1734974206616-Untitled document.pdf', '{\"twitter\":\"twitter.com\",\"instagram\":\"ig.com\",\"website\":\"olawebsite.com\"}', '\"{\\\"Monday\\\":{\\\"opening\\\":\\\"2024-12-23T17:15:59.249Z\\\",\\\"closing\\\":\\\"2024-12-23T17:15:59.249Z\\\"},\\\"Tuesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Wednesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Thursday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Friday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Saturday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"}}\"', '\"[{\\\"id\\\":\\\"1734974197810\\\",\\\"name\\\":\\\"Ola wife\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2024-12-23 17:16:47', '2024-12-23 17:16:47'),
(10, 14, 'Ola OTG', 'Service', 'Abuja', 'On the Go', 'https://api.onthegoafrica.com/uploads/business_posts/1734994501902-rn_image_picker_lib_temp_be4fff86-14c1-4a56-8ae7-54ce21a9dc24.jpg', '\"Wi-Fi\"', NULL, NULL, '\"\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2024-12-23 22:55:03', '2024-12-23 22:55:03'),
(11, 15, 'Ola Tech Nig Ltd', 'Service', 'Abuja', 'null', 'https://api.onthegoafrica.com/uploads/1734995623904-rn_image_picker_lib_temp_5a2f0f4f-26ce-409c-94ee-7dc5ee10bf2a.jpg', '\"Wi-Fi,Air Conditioning\"', NULL, NULL, '\"\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2024-12-23 23:13:43', '2024-12-23 23:13:43'),
(12, 17, 'Ola Dev Nig Ltd', 'Service', 'Kubwa, Abuja', 'All tech solutions', 'https://api.onthegoafrica.com/uploads/1736253031952-1000203560.jpg', '\"[\\\"Parking\\\",\\\"Wi-Fi\\\",\\\"Air Conditioning\\\"]\"', NULL, NULL, '\"\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2025-01-06 02:32:05', '2025-01-07 12:30:34'),
(13, 22, 'Kk ventures', 'Service', 'Ggghhh', 'Hjjjj', 'https://api.onthegoafrica.com/uploads/1736513909471-rn_image_picker_lib_temp_4f1ec602-230e-429b-97b3-e488fe7e68ca.jpg', '\"Wi-Fi\"', NULL, NULL, '\"{\\\"Monday\\\":{\\\"opening\\\":\\\"2025-01-10T12:57:43.369Z\\\",\\\"closing\\\":\\\"2025-01-10T12:57:43.369Z\\\"},\\\"Tuesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Wednesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Thursday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Friday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Saturday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"}}\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2025-01-10 12:58:29', '2025-01-10 12:58:29'),
(14, 22, 'Kk ventures', 'Service', 'Ggghhh', 'Hjjjj', 'https://api.onthegoafrica.com/uploads/1736513928911-rn_image_picker_lib_temp_4f1ec602-230e-429b-97b3-e488fe7e68ca.jpg', '\"Wi-Fi\"', NULL, NULL, '\"{\\\"Monday\\\":{\\\"opening\\\":\\\"2025-01-10T12:57:43.369Z\\\",\\\"closing\\\":\\\"2025-01-10T12:57:43.369Z\\\"},\\\"Tuesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Wednesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Thursday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Friday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Saturday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"}}\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2025-01-10 12:58:49', '2025-01-10 12:58:49'),
(15, 23, 'Vvb', 'Retail', 'Fgg', 'Ggg', 'https://api.onthegoafrica.com/uploads/1736514649946-rn_image_picker_lib_temp_844562af-0270-43fb-bee7-313802d758fc.jpg', '\"Parking\"', NULL, NULL, '\"{\\\"Monday\\\":{\\\"opening\\\":\\\"2025-01-10T13:06:32.415Z\\\",\\\"closing\\\":\\\"2025-01-10T13:06:32.415Z\\\"},\\\"Tuesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Wednesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Thursday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Friday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Saturday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"}}\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2025-01-10 13:10:49', '2025-01-10 13:10:49'),
(16, 25, 'Ola tech Nig Ltd', 'Service', 'Kubwa, Abuja', 'Description', 'https://api.onthegoafrica.com/uploads/1736516126316-rn_image_picker_lib_temp_26df2093-7c6d-4d3a-8d6b-3c8d6cd24e57.jpg', '\"Wi-Fi\"', NULL, NULL, '\"{\\\"Monday\\\":{\\\"opening\\\":\\\"2025-01-10T13:06:32.415Z\\\",\\\"closing\\\":\\\"2025-01-10T13:06:32.415Z\\\"},\\\"Tuesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Wednesday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Thursday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Friday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"},\\\"Saturday\\\":{\\\"opening\\\":\\\"2024-01-01T09:00:00.000Z\\\",\\\"closing\\\":\\\"2024-01-01T16:00:00.000Z\\\"}}\"', '\"[{\\\"id\\\":\\\"1734994494854\\\",\\\"name\\\":\\\"Nokia C200\\\",\\\"password\\\":\\\"12345\\\",\\\"dateAdded\\\":\\\"12/23/2024\\\"}]\"', '2025-01-10 13:35:26', '2025-01-10 13:35:26');

-- --------------------------------------------------------

--
-- Table structure for table `BusinessPosts`
--

CREATE TABLE `BusinessPosts` (
  `id` int(11) NOT NULL,
  `media` text DEFAULT NULL,
  `postText` text NOT NULL,
  `likes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`likes`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `businessId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `BusinessPosts`
--

INSERT INTO `BusinessPosts` (`id`, `media`, `postText`, `likes`, `createdAt`, `updatedAt`, `businessId`) VALUES
(1, '\"\"', 'Testing 2', '[null,null,null,null,null,null,null,null,null,17]', '2024-12-11 07:19:07', '2025-01-10 13:13:33', 2),
(2, '\"\"', 'Testing 2', '[null,null,null,null,17]', '2024-12-11 07:19:30', '2025-01-06 09:26:48', 2),
(3, '[\"https://res.cloudinary.com/duoowadag/image/upload/v1734980144/business_posts/1734980144000-image_0.jpg.jpg\",\"https://res.cloudinary.com/duoowadag/image/upload/v1734980144/business_posts/1734980144000-image_1.jpg.jpg\"]', 'Ghhhh', '[]', '2024-12-23 18:55:45', '2024-12-23 18:55:45', 9),
(4, '[\"https://res.cloudinary.com/duoowadag/image/upload/v1734994632/business_posts/1734994632420-image_0.jpg.jpg\"]', 'Testing', '[]', '2024-12-23 22:57:13', '2024-12-23 22:57:13', 10),
(5, '[\"https://res.cloudinary.com/duoowadag/image/upload/v1734995729/business_posts/1734995728704-image_0.jpg.jpg\"]', 'This game is so interesting. #SniperStrike', '[17]', '2024-12-23 23:15:29', '2025-01-07 13:29:44', 11);

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `sender_id` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `media_url` varchar(255) DEFAULT NULL,
  `status` enum('sent','delivered','read') DEFAULT 'sent',
  `timestamp` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `room_id`, `sender_id`, `content`, `media_url`, `status`, `timestamp`, `createdAt`, `updatedAt`) VALUES
(1, 1, '3', 'Hi', NULL, 'sent', '2024-12-15 01:51:45', '2024-12-15 01:51:45', '2024-12-15 01:51:45'),
(2, 1, '5', 'Hello guys.', NULL, 'sent', '2024-12-15 22:26:59', '2024-12-15 22:26:59', '2024-12-15 22:26:59'),
(3, 1, '5', 'Hello', NULL, 'sent', '2024-12-15 22:32:06', '2024-12-15 22:32:06', '2024-12-15 22:32:06'),
(4, 1, '5', 'Dhhdfjfj', NULL, 'sent', '2024-12-15 22:45:13', '2024-12-15 22:45:13', '2024-12-15 22:45:13'),
(5, 1, '1', 'Hello', NULL, 'sent', '2024-12-16 13:38:18', '2024-12-16 13:38:18', '2024-12-16 13:38:18'),
(6, 1, '1', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_a20bfcc4-90e7-4755-9bd6-2d627a1ca64a.jpg', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_a20bfcc4-90e7-4755-9bd6-2d627a1ca64a.jpg', 'sent', '2024-12-16 13:38:45', '2024-12-16 13:38:45', '2024-12-16 13:38:45'),
(7, 2, '9', 'Hello', NULL, 'sent', '2024-12-17 12:11:24', '2024-12-17 12:11:24', '2024-12-17 12:11:24'),
(8, 12, '9', 'content://com.android.providers.media.documents/document/image%3A1000059870', 'content://com.android.providers.media.documents/document/image%3A1000059870', 'sent', '2024-12-17 12:20:09', '2024-12-17 12:20:09', '2024-12-17 12:20:09'),
(9, 12, '5', 'Standup.', NULL, 'sent', '2024-12-17 13:24:24', '2024-12-17 13:24:24', '2024-12-17 13:24:24'),
(10, 13, '5', 'Hello sir. How are you doing.', NULL, 'sent', '2024-12-17 13:26:14', '2024-12-17 13:26:14', '2024-12-17 13:26:14'),
(11, 13, '8', 'I\'m here too Idris', NULL, 'sent', '2024-12-17 13:26:25', '2024-12-17 13:26:25', '2024-12-17 13:26:25'),
(12, 13, '5', 'Hey Idris.', NULL, 'sent', '2024-12-18 13:20:11', '2024-12-18 13:20:11', '2024-12-18 13:20:11'),
(13, 1, '5', 'Hejk', NULL, 'sent', '2024-12-22 01:12:25', '2024-12-22 01:12:25', '2024-12-22 01:12:25'),
(14, 2, '9', 'Hi', NULL, 'sent', '2024-12-23 09:03:43', '2024-12-23 09:03:43', '2024-12-23 09:03:43'),
(15, 12, '5', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_43c014fc-f49e-45a8-80f2-52d25188fd4d.jpg', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_43c014fc-f49e-45a8-80f2-52d25188fd4d.jpg', 'sent', '2024-12-24 13:32:51', '2024-12-24 13:32:51', '2024-12-24 13:32:51'),
(16, 1, '18', 'I\'m staying jiggy.', NULL, 'sent', '2025-01-07 23:25:41', '2025-01-07 23:25:41', '2025-01-07 23:25:41'),
(17, 1, '18', 'I really did say I was staying jiggy.', NULL, 'sent', '2025-01-07 23:31:49', '2025-01-07 23:31:49', '2025-01-07 23:31:49'),
(18, 1, '18', '', 'file:///data/user/0/com.otg/cache/rn_image_picker_lib_temp_72ddaa07-6ce3-419e-a0ca-469afee79cab.jpg', 'sent', '2025-01-08 00:50:52', '2025-01-08 00:50:52', '2025-01-08 00:50:52'),
(19, 1, '21', 'Hello.', NULL, 'sent', '2025-01-09 12:56:17', '2025-01-09 12:56:17', '2025-01-09 12:56:17'),
(20, 1, '21', 'This is John wick.', NULL, 'sent', '2025-01-09 12:57:04', '2025-01-09 12:57:04', '2025-01-09 12:57:04');

-- --------------------------------------------------------

--
-- Table structure for table `Comments`
--

CREATE TABLE `Comments` (
  `id` int(11) NOT NULL,
  `postId` int(11) NOT NULL,
  `authorId` int(11) NOT NULL,
  `content` text NOT NULL,
  `parentId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Comments`
--

INSERT INTO `Comments` (`id`, `postId`, `authorId`, `content`, `parentId`, `createdAt`, `updatedAt`) VALUES
(1, 10, 1, 'Wow I love it', NULL, '2024-12-23 14:28:31', '2024-12-23 14:28:31'),
(2, 10, 1, 'Great work', NULL, '2024-12-23 15:21:52', '2024-12-23 15:21:52'),
(3, 11, 11, 'Okah, testing comments', NULL, '2024-12-23 17:31:29', '2024-12-23 17:31:29'),
(4, 9, 12, 'Hi', NULL, '2024-12-23 22:14:59', '2024-12-23 22:14:59'),
(5, 12, 11, 'My comments', NULL, '2024-12-23 22:16:08', '2024-12-23 22:16:08'),
(6, 12, 1, 'Idris this is not you FR', NULL, '2024-12-23 22:17:34', '2024-12-23 22:17:34'),
(7, 12, 11, 'We want kondipress back!!!', NULL, '2024-12-23 22:22:16', '2024-12-23 22:22:16'),
(8, 12, 12, 'Good ones ', NULL, '2024-12-23 23:21:49', '2024-12-23 23:21:49'),
(9, 14, 5, 'I agree.', NULL, '2024-12-24 10:29:52', '2024-12-24 10:29:52');

-- --------------------------------------------------------

--
-- Table structure for table `Images`
--

CREATE TABLE `Images` (
  `id` int(11) NOT NULL,
  `postId` int(11) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `filePath` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Invitations`
--

CREATE TABLE `Invitations` (
  `id` int(11) NOT NULL,
  `inviter_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `invitees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`invitees`)),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedAt` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Notifications`
--

CREATE TABLE `Notifications` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `followerId` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `notificationType` text NOT NULL,
  `read` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Notifications`
--

INSERT INTO `Notifications` (`id`, `userId`, `followerId`, `message`, `notificationType`, `read`, `createdAt`, `updatedAt`) VALUES
(7, 3, 1, 'You started following Amose.', 'following', 0, '2024-12-16 01:16:39', '2024-12-16 01:16:39'),
(9, 1, 3, 'John started following you.', 'followed', 0, '2024-12-16 02:14:52', '2024-12-16 02:14:52'),
(10, 3, 1, 'You started following Amose.', 'following', 0, '2024-12-16 02:14:52', '2024-12-16 02:14:52'),
(11, 1, 3, 'John started following you.', 'followed', 0, '2024-12-16 02:23:43', '2024-12-16 02:23:43'),
(12, 3, 1, 'You started following Amose.', 'following', 0, '2024-12-16 02:23:43', '2024-12-16 02:23:43'),
(13, 3, 1, 'Amose started following you.', 'followed', 0, '2024-12-16 02:26:05', '2024-12-16 02:26:05'),
(14, 1, 3, 'You started following John.', 'following', 0, '2024-12-16 02:26:05', '2024-12-16 02:26:05'),
(15, 1, 3, 'John started following you.', 'followed', 0, '2024-12-16 13:32:39', '2024-12-16 13:32:39'),
(16, 3, 1, 'You started following Amose.', 'following', 0, '2024-12-16 13:32:39', '2024-12-16 13:32:39'),
(17, 9, 1, 'Black James bond started following you.', 'followed', 0, '2024-12-17 12:17:28', '2024-12-17 12:17:28'),
(18, 1, 9, 'You started following John.', 'following', 0, '2024-12-17 12:17:28', '2024-12-17 12:17:28'),
(19, 9, 3, 'Black James bond started following you.', 'followed', 0, '2024-12-17 12:17:34', '2024-12-17 12:17:34'),
(20, 3, 9, 'You started following Amose.', 'following', 0, '2024-12-17 12:17:34', '2024-12-17 12:17:34'),
(21, 9, 8, 'Black James bond started following you.', 'followed', 0, '2024-12-17 12:17:42', '2024-12-17 12:17:42'),
(22, 8, 9, 'You started following Kondi.', 'following', 0, '2024-12-17 12:17:42', '2024-12-17 12:17:42'),
(23, 9, 1, 'Black James bond started following you.', 'followed', 0, '2024-12-17 13:14:38', '2024-12-17 13:14:38'),
(24, 1, 9, 'You started following John.', 'following', 0, '2024-12-17 13:14:38', '2024-12-17 13:14:38'),
(25, 5, 9, 'Great001 started following you.', 'followed', 0, '2024-12-17 13:23:44', '2024-12-17 13:23:44'),
(26, 9, 5, 'You started following Black James bond.', 'following', 0, '2024-12-17 13:23:44', '2024-12-17 13:23:44'),
(27, 8, 9, 'Kondi started following you.', 'followed', 0, '2024-12-17 13:24:37', '2024-12-17 13:24:37'),
(28, 9, 8, 'You started following Black James bond.', 'following', 0, '2024-12-17 13:24:37', '2024-12-17 13:24:37'),
(29, 9, 5, 'Black James bond started following you.', 'followed', 0, '2024-12-17 13:25:32', '2024-12-17 13:25:32'),
(30, 5, 9, 'You started following Great001.', 'following', 0, '2024-12-17 13:25:32', '2024-12-17 13:25:32'),
(31, 9, 8, 'Black James bond started following you.', 'followed', 0, '2024-12-17 13:25:36', '2024-12-17 13:25:36'),
(32, 8, 9, 'You started following Kondi.', 'following', 0, '2024-12-17 13:25:36', '2024-12-17 13:25:36'),
(33, 5, 9, 'Great001 started following you.', 'followed', 0, '2024-12-17 22:22:01', '2024-12-17 22:22:01'),
(34, 9, 5, 'You started following Black James bond.', 'following', 0, '2024-12-17 22:22:01', '2024-12-17 22:22:01'),
(35, 5, 9, 'Great001 started following you.', 'followed', 0, '2024-12-17 22:22:05', '2024-12-17 22:22:05'),
(36, 9, 5, 'You started following Black James bond.', 'following', 0, '2024-12-17 22:22:05', '2024-12-17 22:22:05'),
(37, 5, 9, 'Great001 started following you.', 'followed', 0, '2024-12-18 20:07:52', '2024-12-18 20:07:52'),
(38, 9, 5, 'You started following Black James bond.', 'following', 0, '2024-12-18 20:07:52', '2024-12-18 20:07:52'),
(39, 5, 9, 'Great001 started following you.', 'followed', 0, '2024-12-18 20:07:59', '2024-12-18 20:07:59'),
(40, 9, 5, 'You started following Black James bond.', 'following', 0, '2024-12-18 20:07:59', '2024-12-18 20:07:59'),
(41, 1, 3, 'John started following you.', 'followed', 0, '2024-12-23 03:40:12', '2024-12-23 03:40:12'),
(42, 3, 1, 'You started following Amose.', 'following', 0, '2024-12-23 03:40:12', '2024-12-23 03:40:12'),
(43, 1, 9, 'John started following you.', 'followed', 0, '2024-12-23 03:40:29', '2024-12-23 03:40:29'),
(44, 9, 1, 'You started following Black James bond.', 'following', 0, '2024-12-23 03:40:29', '2024-12-23 03:40:29'),
(46, 8, 1, 'You started following Kondi.', 'following', 0, '2024-12-23 03:40:42', '2024-12-23 03:40:42'),
(47, 1, 8, 'John unfollowed you.', 'unfollowed', 0, '2024-12-23 04:40:19', '2024-12-23 04:40:19'),
(48, 11, 9, 'Oladimeji started following you.', 'followed', 0, '2024-12-23 17:35:08', '2024-12-23 17:35:08'),
(49, 9, 11, 'You started following Black James bond.', 'following', 0, '2024-12-23 17:35:08', '2024-12-23 17:35:08'),
(50, 11, 8, 'Oladimeji started following you.', 'followed', 0, '2024-12-23 17:35:17', '2024-12-23 17:35:17'),
(51, 8, 11, 'You started following Kondi.', 'following', 0, '2024-12-23 17:35:17', '2024-12-23 17:35:17'),
(52, 11, 1, 'Oladimeji started following you.', 'followed', 0, '2024-12-23 17:35:20', '2024-12-23 17:35:20'),
(53, 1, 11, 'You started following John.', 'following', 0, '2024-12-23 17:35:20', '2024-12-23 17:35:20'),
(54, 12, 1, 'Idris  started following you.', 'followed', 0, '2024-12-23 22:18:03', '2024-12-23 22:18:03'),
(55, 1, 12, 'You started following John.', 'following', 0, '2024-12-23 22:18:03', '2024-12-23 22:18:03'),
(56, 11, 12, 'Oladimeji started following you.', 'followed', 0, '2024-12-23 22:20:50', '2024-12-23 22:20:50'),
(57, 12, 11, 'You started following Idris .', 'following', 0, '2024-12-23 22:20:50', '2024-12-23 22:20:50'),
(58, 12, 11, 'Idris  started following you.', 'followed', 0, '2024-12-23 22:22:03', '2024-12-23 22:22:03'),
(59, 11, 12, 'You started following Oladimeji.', 'following', 0, '2024-12-23 22:22:03', '2024-12-23 22:22:03'),
(60, 16, 1, 'Oladev started following you.', 'followed', 0, '2025-01-03 14:22:15', '2025-01-03 14:22:15'),
(61, 1, 16, 'You started following John.', 'following', 0, '2025-01-03 14:22:15', '2025-01-03 14:22:15'),
(62, 16, 1, 'Oladev started following you.', 'followed', 0, '2025-01-03 14:22:16', '2025-01-03 14:22:16'),
(63, 1, 16, 'You started following John.', 'following', 0, '2025-01-03 14:22:16', '2025-01-03 14:22:16');

-- --------------------------------------------------------

--
-- Table structure for table `Posts`
--

CREATE TABLE `Posts` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `businessId` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `media` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`media`)),
  `likes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`likes`)),
  `rating` float NOT NULL DEFAULT 0,
  `ratingsCount` int(11) NOT NULL DEFAULT 0,
  `bookmarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bookmarks`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Posts`
--

INSERT INTO `Posts` (`id`, `userId`, `businessId`, `description`, `media`, `likes`, `rating`, `ratingsCount`, `bookmarks`, `createdAt`, `updatedAt`) VALUES
(2, 1, 4, 'I love it', '\"https://api.onthegoafrica.com/uploads/1734216933280-Screenshot 2022-09-15 112425.png\"', '[\"1\"]', 5, 0, '[]', '2024-12-14 22:55:33', '2024-12-15 01:50:13'),
(3, 1, 7, 'I love it', '\"https://api.onthegoafrica.com/uploads/1734218081582-image_0.jpg\"', '[\"1\",\"3\",\"12\"]', 5, 0, '[]', '2024-12-14 23:14:41', '2024-12-23 22:23:32'),
(4, 1, 8, 'Amazing', '\"https://api.onthegoafrica.com/uploads/1734223907134-image_0.jpg,https://api.onthegoafrica.com/uploads/1734223907181-image_1.jpg,https://api.onthegoafrica.com/uploads/1734223907183-image_2.jpg,https://api.onthegoafrica.com/uploads/1734223907183-image_3.jpg\"', '[\"3\",\"1\"]', 0, 0, '[]', '2024-12-15 00:51:47', '2024-12-23 03:36:28'),
(5, 1, 2, 'Good', '\"https://api.onthegoafrica.com/uploads/1734225423751-image_0.jpg,https://api.onthegoafrica.com/uploads/1734225423754-image_1.jpg\"', '[\"3\",\"1\",\"12\"]', 3, 0, '[]', '2024-12-15 01:17:03', '2024-12-23 22:23:29'),
(6, 3, 5, 'Good work', '\"https://api.onthegoafrica.com/uploads/1734275273378-image_0.jpg,https://api.onthegoafrica.com/uploads/1734275273663-image_1.jpg\"', '[\"3\",\"1\",\"12\"]', 4, 0, '[]', '2024-12-15 15:07:53', '2024-12-23 22:39:58'),
(7, 1, 8, 'This was a cool experience', '\"https://api.onthegoafrica.com/uploads/1734433518825-image_0.jpg\"', '[\"5\",\"12\"]', 4, 0, '[]', '2024-12-17 11:05:18', '2024-12-23 22:40:09'),
(8, 8, 2, 'Experience Idris is here', '\"https://api.onthegoafrica.com/uploads/1734434007068-image_0.jpg\"', '[\"8\",\"5\",\"12\"]', 4, 0, '[]', '2024-12-17 11:13:27', '2024-12-23 22:39:48'),
(9, 9, 4, 'Good', '\"https://api.onthegoafrica.com/uploads/1734437941156-image_0.jpg\"', '[\"8\",\"5\",\"12\"]', 4, 0, '[]', '2024-12-17 12:19:01', '2024-12-23 22:23:18'),
(10, 9, 1, 'Good', '\"https://api.onthegoafrica.com/uploads/1734441165250-image_0.jpg\"', '[\"8\",\"1\",\"12\"]', 4, 0, '[]', '2024-12-17 13:12:45', '2024-12-23 22:40:14'),
(11, 11, 9, 'Great!!', '\"https://api.onthegoafrica.com/uploads/1734974875999-image_0.jpg,https://api.onthegoafrica.com/uploads/1734974876000-image_1.jpg\"', '[\"11\",\"12\",\"2\"]', 0, 0, '[]', '2024-12-23 17:27:56', '2025-02-03 21:49:04'),
(12, 12, 5, 'Hiiiiiiiiiiiiiiiiiiiiiiiii ', '\"https://api.onthegoafrica.com/uploads/1734975683359-image_0.jpg\"', '[\"11\",\"12\",\"2\"]', 5, 0, '[]', '2024-12-23 17:41:23', '2025-02-03 21:48:51'),
(13, 11, 3, 'Their services are great!', '\"https://api.onthegoafrica.com/uploads/1734992086099-image_0.jpg,https://api.onthegoafrica.com/uploads/1734992086165-image_1.jpg\"', '[\"11\",\"12\"]', 0, 0, '[]', '2024-12-23 22:14:46', '2024-12-23 22:23:03'),
(14, 5, 2, 'Not bad actually, could be better', '\"https://api.onthegoafrica.com/uploads/1735036060007-image_0.jpg\"', '[\"5\",\"10\",\"2\"]', 3, 0, '[]', '2024-12-24 10:27:40', '2025-02-03 21:48:39');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `type` enum('direct','group') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Public','Private') NOT NULL DEFAULT 'Public',
  `created_by` varchar(255) NOT NULL,
  `total_members` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `type`, `description`, `image_url`, `status`, `created_by`, `total_members`, `createdAt`, `updatedAt`) VALUES
(1, 'Test', 'group', 'Testing group ', '', 'Public', '3', 3, '2024-12-15 01:51:11', '2025-01-09 12:55:48'),
(2, 'AVS official ', 'group', 'The official page ', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_b1d305a5-4446-46b2-9dc5-45f4651b0ff3.jpg', 'Public', '5', 2, '2024-12-15 23:12:20', '2024-12-24 10:24:42'),
(3, 'Coin shop ', 'group', 'Official crypto.', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_50d1fc9b-7a7b-4252-bdaa-1377057a2272.jpg', 'Private', '5', 0, '2024-12-15 23:16:40', '2024-12-23 17:22:03'),
(4, 'Rf', 'group', 'Xdd', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_51e362d7-7c16-4952-8fe6-e9542e089be1.jpg', 'Public', '5', 0, '2024-12-16 00:20:56', '2024-12-23 17:27:19'),
(5, 'Rf', 'group', 'Xdd', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_51e362d7-7c16-4952-8fe6-e9542e089be1.jpg', 'Public', '5', 0, '2024-12-16 00:21:01', '2024-12-23 17:28:27'),
(6, 'Rf', 'group', 'Xdd', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_51e362d7-7c16-4952-8fe6-e9542e089be1.jpg', 'Public', '5', 0, '2024-12-16 00:21:31', '2024-12-23 17:27:51'),
(7, 'T', 'group', 'Dd,', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_7a34bdde-a83a-40cd-a75d-cd196c3fdf5c.jpg', 'Public', '5', 0, '2024-12-16 00:24:11', '2024-12-23 17:28:12'),
(8, 'F', 'group', 'Sddd', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_563c5417-cffc-4600-9038-f50b25d89ec8.jpg', 'Public', '5', 0, '2024-12-16 00:32:25', '2024-12-23 17:22:50'),
(9, 'Hlgkfjfj', 'group', 'Eghhe', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_abda3bf6-7505-42da-b605-cc950df8f13a.jpg', 'Public', '5', 0, '2024-12-16 00:35:09', '2024-12-23 17:22:14'),
(10, 'Hlgkfjfj', 'group', 'Eghhe', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_abda3bf6-7505-42da-b605-cc950df8f13a.jpg', 'Public', '5', 0, '2024-12-16 00:38:50', '2024-12-23 17:27:42'),
(11, 'Ffg', 'group', 'Xfg', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_8aa0556c-1db6-4ed2-a0df-45d5077622a9.jpg', 'Private', '5', 0, '2024-12-16 11:26:57', '2024-12-23 17:28:42'),
(12, 'Standup', 'group', 'Testing', '', 'Public', '1', 3, '2024-12-16 13:36:42', '2025-01-06 06:13:16'),
(13, 'Beach trips', 'group', 'For like minded beach lovers , share your favourite bea h locations', 'file:///data/user/0/com.onthego/cache/rn_image_picker_lib_temp_507dbe1f-abd6-429d-a7a1-3bb70bb08f2e.jpg', 'Public', '9', 2, '2024-12-17 12:16:54', '2024-12-24 10:08:51');

-- --------------------------------------------------------

--
-- Table structure for table `room_members`
--

CREATE TABLE `room_members` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `joined_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `room_members`
--

INSERT INTO `room_members` (`id`, `room_id`, `user_id`, `joined_at`, `createdAt`, `updatedAt`) VALUES
(1, 1, '3', '2024-12-15 01:51:11', '2024-12-15 01:51:11', '2024-12-15 01:51:11'),
(13, 12, '1', '2024-12-16 13:36:42', '2024-12-16 13:36:42', '2024-12-16 13:36:42'),
(15, 2, '9', '2024-12-17 12:09:19', '2024-12-17 12:09:19', '2024-12-17 12:09:19'),
(16, 13, '9', '2024-12-17 12:16:55', '2024-12-17 12:16:55', '2024-12-17 12:16:55'),
(17, 12, '9', '2024-12-17 12:19:58', '2024-12-17 12:19:58', '2024-12-17 12:19:58'),
(20, 13, '8', '2024-12-17 13:26:10', '2024-12-17 13:26:10', '2024-12-17 13:26:10'),
(28, 2, '5', '2024-12-24 10:24:42', '2024-12-24 10:24:42', '2024-12-24 10:24:42'),
(30, 1, '18', '2025-01-06 06:08:32', '2025-01-06 06:08:32', '2025-01-06 06:08:32'),
(31, 12, '18', '2025-01-06 06:13:16', '2025-01-06 06:13:16', '2025-01-06 06:13:16'),
(32, 1, '21', '2025-01-09 12:55:48', '2025-01-09 12:55:48', '2025-01-09 12:55:48');

-- --------------------------------------------------------

--
-- Table structure for table `UserFollowers`
--

CREATE TABLE `UserFollowers` (
  `followerId` int(11) NOT NULL,
  `followedId` int(11) NOT NULL,
  `followedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `UserFollowers`
--

INSERT INTO `UserFollowers` (`followerId`, `followedId`, `followedAt`, `createdAt`, `updatedAt`) VALUES
(1, 11, '2024-12-23 17:35:20', '2024-12-23 17:35:20', '2024-12-23 17:35:20'),
(1, 12, '2024-12-23 22:18:03', '2024-12-23 22:18:03', '2024-12-23 22:18:03'),
(1, 16, '2025-01-03 14:22:15', '2025-01-03 14:22:15', '2025-01-03 14:22:15'),
(3, 1, '2024-12-23 03:40:12', '2024-12-23 03:40:12', '2024-12-23 03:40:12'),
(5, 9, '2024-12-17 13:25:32', '2024-12-17 13:25:32', '2024-12-17 13:25:32'),
(8, 9, '2024-12-17 12:17:42', '2024-12-17 12:17:42', '2024-12-17 12:17:42'),
(8, 11, '2024-12-23 17:35:17', '2024-12-23 17:35:17', '2024-12-23 17:35:17'),
(9, 1, '2024-12-23 03:40:29', '2024-12-23 03:40:29', '2024-12-23 03:40:29'),
(9, 5, '2024-12-17 13:23:44', '2024-12-17 13:23:44', '2024-12-17 13:23:44'),
(9, 8, '2024-12-17 13:24:37', '2024-12-17 13:24:37', '2024-12-17 13:24:37'),
(9, 11, '2024-12-23 17:35:08', '2024-12-23 17:35:08', '2024-12-23 17:35:08'),
(11, 12, '2024-12-23 22:22:03', '2024-12-23 22:22:03', '2024-12-23 22:22:03'),
(12, 11, '2024-12-23 22:20:50', '2024-12-23 22:20:50', '2024-12-23 22:20:50');

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `picture` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `interests` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`interests`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`id`, `firstName`, `lastName`, `username`, `email`, `password`, `phone_number`, `picture`, `bio`, `interests`, `createdAt`, `updatedAt`) VALUES
(1, 'John', 'Otitoju ', 'John', 'john@gmail.com', '$2a$10$RAzhRyhY6SfmlErgRyqUCuv1HKQDNa3Ov300eDIqXRL6oq0UapxQy', '09055932268', NULL, 'Just testing ', NULL, '2024-12-04 11:09:28', '2024-12-10 15:10:36'),
(2, NULL, NULL, 'otitoju', 'otitojuoluwapelumi@gmail.com', '$2a$10$ajOv3B.AzJiwqRK7I/OtxuIvLCBcMsiSeNbYbKOe9GDBhSvAGzNbu', NULL, NULL, NULL, NULL, '2024-12-10 12:33:55', '2024-12-10 12:33:55'),
(3, 'amos', 'amos', 'Amose', 'amos@gmail.com', '$2a$10$RPoR1Wo5D9WiJy.7hHpem.nfkYGr5dvrqZjsZViy3Pnh9N85GZuXW', NULL, NULL, NULL, NULL, '2024-12-12 12:54:52', '2024-12-12 12:54:52'),
(4, 'ola', 'dim', 'dim', 'ol', '$2a$10$kmNsO/7phqQQ2E4uKMVtV.AUb4AicD2kfXWpCMYZpgEUFmD6AbIDu', NULL, NULL, NULL, NULL, '2024-12-14 13:44:29', '2024-12-14 13:44:29'),
(5, 'great', 'attai', 'Great001', 'greatattai442442@gmail.com', '$2a$10$25Zz73pPmGKVMEPRWLad6e7awBbreh/RqiXR1/8uk.AWU2uFgf2Ru', '8146139334', NULL, 'This my bio.', NULL, '2024-12-14 13:44:56', '2024-12-14 15:01:09'),
(6, 'ola', 'ola', 'Ola', 'ola@gmail.com', '$2a$10$07U3GbG.zZCLJ.0IEHQyi.EzQcJGeXY/W6mEap08NLHoSc2k36NM6', NULL, NULL, NULL, NULL, '2024-12-14 14:04:46', '2024-12-14 14:04:46'),
(7, 'idris', 'abdulkadri kondi', 'Idris kondi', 'abdulkadri42@gmail.com', '$2a$10$GG3amf7vz/D6yjiz6i5xN.C6E6I48.6gsqwFDeWqPojPNWpo6scl6', NULL, NULL, NULL, NULL, '2024-12-17 11:04:38', '2024-12-17 11:04:38'),
(8, 'idris', 'abdulkadri kondi', 'Kondi', 'kondi@gmail.com', '$2a$10$K/gaMZ9DyTvcr/OJbmB5F.TouXsxIsfJa9QAoflMsYYx.MxmLRiEG', NULL, NULL, NULL, NULL, '2024-12-17 11:07:23', '2024-12-17 11:07:23'),
(9, 'Ayo', 'Adewale ', 'Black James bond', 'a.adewale@live.co.uk', '$2a$10$2WdM5x6cM51bkv0zHTlgTeYizufPm4paQyoR959nxK7vPrmJ4GqoS', '', NULL, '', NULL, '2024-12-17 12:05:41', '2024-12-17 12:08:10'),
(10, 'abdulrazaq', 'oladimeji', 'Oladimeji', 'abdulrazaq2a@gmail.com', '$2a$10$7/2NZF9urKEzvST7lESLG.vnhtxcYoWnkmxobQp61YZ7bcU2Do.im', NULL, NULL, NULL, NULL, '2024-12-23 17:13:07', '2024-12-23 17:13:07'),
(11, 'abdulrazaq', 'oladimeji', 'Oladimeji', 'ola@aventurestud.io', '$2a$10$fBi0PQqQeYUm1Irp1Qoi/.xO6CuWmN/2fX3c40h0MHh.dlkPCAeve', NULL, NULL, 'Fullstack dev @ AVS', NULL, '2024-12-23 17:24:05', '2024-12-23 17:36:56'),
(12, 'idris', 'abdulkadri kondi', 'Idris ', 'idris@aventurestud.io', '$2a$10$jua3oIFnF4ki7uUBqxqfF.5z00GRHY1btSsCtj/f2iNIVjtWERvAu', NULL, NULL, NULL, NULL, '2024-12-23 17:28:06', '2024-12-23 17:28:06'),
(13, 'abdulrazaq', 'oladimeji', 'Ol', 'kijijieducation@outlook.com', '$2a$10$45bz4STHJh2r2bp9JBAewu768hDvj8UT2l3PPNuMcNgDBVuvlUZqK', NULL, NULL, NULL, NULL, '2024-12-23 18:29:29', '2024-12-23 18:29:29'),
(14, 'abdulrazaq', 'oladimeji', 'Olaa', 'kijijieducation@gmail.com', '$2a$10$SCF64UT38BkGZPtuk7wfBuX.3K.MwUxplq4VaJgyzgoo6ataFf5yy', NULL, NULL, NULL, NULL, '2024-12-23 22:53:37', '2024-12-23 22:53:37'),
(15, 'abdulrazaq', 'oladimeji', 'Dimeji', 'abdulrazaq2a@gmail.co', '$2a$10$LFGRtmF6O49jwEzq4bC84O9cQsTfZY7j8DK1QcJrvpmeYAa7l92Tm', NULL, NULL, NULL, NULL, '2024-12-23 23:12:18', '2024-12-23 23:12:18'),
(16, 'abdulrazaq', 'oladimeji', 'Oladev', 'oladev', '$2a$10$EP8aktlOxV72FAAvzHoQAeai5vhC/HJ7tLS7e0wy/aRC5tHM29FUO', NULL, NULL, NULL, NULL, '2025-01-03 14:20:51', '2025-01-03 14:20:51'),
(17, 'abdulrazaq', 'oladimeji', 'Oladev', 'ola', '$2a$10$dTfyePntjQXweoLjfLGEseV9MlQyuEW0YOHfIj2qcclqWC04wraty', NULL, NULL, NULL, NULL, '2025-01-06 02:30:49', '2025-01-06 02:30:49'),
(18, 'great', 'a', 'Romeoscross', 'greatattai@gmail.com', '$2a$10$JGAE1b5g9E5spf0ZH9FNku.eQEt576y5bYlAJAKb9wKc0bob7hGlS', NULL, NULL, NULL, NULL, '2025-01-06 06:02:17', '2025-01-06 06:02:17'),
(19, 'gabriel ', 'anie', 'Gabrielanie', 'younganiel@gmail.com', '$2a$10$W94VwLnE801q6e6NGT2cU.UYdhNWt5HhthFMm/TNwusCC9Ncm028a', NULL, NULL, NULL, NULL, '2025-01-06 10:11:55', '2025-01-06 10:11:55'),
(20, 'idris', 'karri', 'Welded', 'welbed@gmail.com', '$2a$10$V28F9.LT2tyNwfmPY9D21eSybke/XS9dNrYnttwX3QVnCaaJszdzm', NULL, NULL, NULL, NULL, '2025-01-08 14:17:25', '2025-01-08 14:17:25'),
(21, 'john', 'wick', 'John wick', 'johnwick@gmail.com', '$2a$10$HNk76z0kyV0yEQ3eke01n.FaJ7Ky8EizH4P8Azg5FfdPDl1ZllxWm', NULL, NULL, NULL, NULL, '2025-01-09 12:54:45', '2025-01-09 12:54:45'),
(22, 'abdulrazaq', 'oladimeji', 'Kk', 'kk', '$2a$10$HG3SsbOPO3h02YqYy3gWmu9Kfi2MRc262W2OzuhHbjpwI7uQrAGo2', NULL, NULL, NULL, NULL, '2025-01-10 12:57:01', '2025-01-10 12:57:01'),
(23, 'abdulrazaq', 'oladimeji', 'Gg', 'dd', '$2a$10$ofBnfj75Vv99ShcH.gxRIOAljJRHDZHK1e7EIw4yjJJ0WwkLEMhfC', NULL, NULL, NULL, NULL, '2025-01-10 13:10:15', '2025-01-10 13:10:15'),
(24, 'abdulrazaq', 'oladimeji', 'Ola', 'ola1@gmail.com', '$2a$10$aL.TBJFBXpZxcraeC6ERHOsKglmyRf9F/8xVHOAtZz3xABCd.M/bS', NULL, NULL, NULL, NULL, '2025-01-10 13:30:37', '2025-01-10 13:30:37'),
(25, 'abdulrazaq', 'oladimeji', 'Ola', 'ola1a@gmail.com', '$2a$10$f0rldSn4gnaGMzcaaAWA5O9QA9dBKoGKaPlEZQB7z11bM70dx.Xaq', NULL, NULL, NULL, NULL, '2025-01-10 13:34:19', '2025-01-10 13:34:19'),
(26, 'king', 'von', 'kingvon', 'kingvon@gmail.com', '$2a$10$h0Psvl7Ao8o5queNNYZ2k.VZ1CZpf1k9r4k2oZOt9UG5UBh/ZoNDS', NULL, NULL, NULL, NULL, '2025-01-31 08:41:03', '2025-01-31 08:41:03'),
(27, 'john', 'smile ', 'Doejo', 'reel407hotmail.co.uk', '$2a$10$W1micLgDDaQ/SmN2fIlsXuGgvq6vvk/o27aHwqZNVs/2fICtBUn5u', NULL, NULL, NULL, NULL, '2025-01-31 18:56:12', '2025-01-31 18:56:12'),
(28, 'mary ', 'john', 'Mary John', 'maryjohn@gmail.com', '$2a$10$Sa/3Nl0ebZ.uim7J29Ss8.dm0H07yUwOogIMznxj2aslvmHEHCI7m', NULL, NULL, NULL, NULL, '2025-02-04 13:40:11', '2025-02-04 13:40:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Businesses`
--
ALTER TABLE `Businesses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `BusinessPosts`
--
ALTER TABLE `BusinessPosts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `businessId` (`businessId`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `Comments`
--
ALTER TABLE `Comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `postId` (`postId`),
  ADD KEY `authorId` (`authorId`),
  ADD KEY `parentId` (`parentId`);

--
-- Indexes for table `Images`
--
ALTER TABLE `Images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `postId` (`postId`);

--
-- Indexes for table `Invitations`
--
ALTER TABLE `Invitations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Notifications`
--
ALTER TABLE `Notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Posts`
--
ALTER TABLE `Posts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room_members`
--
ALTER TABLE `room_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `UserFollowers`
--
ALTER TABLE `UserFollowers`
  ADD PRIMARY KEY (`followerId`,`followedId`),
  ADD UNIQUE KEY `UserFollowers_followerId_followedId_unique` (`followerId`,`followedId`),
  ADD KEY `followedId` (`followedId`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Businesses`
--
ALTER TABLE `Businesses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `BusinessPosts`
--
ALTER TABLE `BusinessPosts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `Comments`
--
ALTER TABLE `Comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `Images`
--
ALTER TABLE `Images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Invitations`
--
ALTER TABLE `Invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Notifications`
--
ALTER TABLE `Notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `Posts`
--
ALTER TABLE `Posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `room_members`
--
ALTER TABLE `room_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Businesses`
--
ALTER TABLE `Businesses`
  ADD CONSTRAINT `Businesses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `BusinessPosts`
--
ALTER TABLE `BusinessPosts`
  ADD CONSTRAINT `BusinessPosts_ibfk_1` FOREIGN KEY (`businessId`) REFERENCES `Businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Comments`
--
ALTER TABLE `Comments`
  ADD CONSTRAINT `Comments_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `Posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Comments_ibfk_2` FOREIGN KEY (`authorId`) REFERENCES `Users` (`id`),
  ADD CONSTRAINT `Comments_ibfk_3` FOREIGN KEY (`parentId`) REFERENCES `Comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Images`
--
ALTER TABLE `Images`
  ADD CONSTRAINT `Images_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `Posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `room_members`
--
ALTER TABLE `room_members`
  ADD CONSTRAINT `room_members_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `UserFollowers`
--
ALTER TABLE `UserFollowers`
  ADD CONSTRAINT `UserFollowers_ibfk_1` FOREIGN KEY (`followerId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserFollowers_ibfk_2` FOREIGN KEY (`followedId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
