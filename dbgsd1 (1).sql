-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 09, 2026 at 04:23 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbgsd1`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL,
  `description` text NOT NULL,
  `action` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(124, 'User Logged out', 'LOGOUT', '2025-08-13 03:52:44', 99),
(125, 'User Logged in', 'LOGIN', '2025-08-13 03:53:04', 114),
(126, 'User Logged out', 'LOGOUT', '2025-08-13 03:57:51', 42),
(127, 'User Logged in', 'LOGIN', '2025-08-13 03:58:10', 78),
(128, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-13 04:09:10', 114),
(129, 'User Logged in', 'LOGIN', '2025-08-13 04:11:09', 96),
(130, 'Venue Request submitted', 'Reservation Request', '2025-08-13 04:11:23', 96),
(131, 'Marked notifications as read (count: 24)', 'READ NOTIFICATION', '2025-08-13 04:11:43', 96),
(132, 'User Logged in', 'LOGIN', '2025-08-13 04:12:13', 99),
(133, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-13 04:15:32', 114),
(134, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-13 04:15:35', 99),
(135, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-13 04:15:39', 99),
(136, 'User Logged out', 'LOGOUT', '2025-08-13 04:15:54', 99),
(137, 'User Logged in', 'LOGIN', '2025-08-13 04:16:05', 78),
(138, 'Marked approval notifications as read (count: 1)', 'READ APPROVAL NOTIFI', '2025-08-13 04:17:35', 114),
(139, 'User Logged out', 'LOGOUT', '2025-08-13 04:30:42', 114),
(140, 'User Logged in', 'LOGIN', '2025-08-13 04:30:50', 42),
(141, 'Marked approval notifications as read (count: 1)', 'READ  NOTIFICATION', '2025-08-13 04:32:50', 42),
(142, 'User Logged in', 'LOGIN', '2025-08-13 19:10:33', 114),
(143, 'User Christian Mark S. Valle sent a message to Rusty C. Pisco: \'Hello\'', 'SEND MESSAGE', '2025-08-13 19:11:29', 42),
(144, 'User Rusty C. Pisco sent a message to Christian Mark S. Valle: \'hi\'', 'SEND MESSAGE', '2025-08-13 19:11:39', 114),
(145, 'User Logged out', 'LOGOUT', '2025-08-13 19:30:57', 114),
(146, 'User Logged in', 'LOGIN', '2025-08-13 19:31:12', 72),
(147, 'User Logged in', 'LOGIN', '2025-08-13 19:36:20', 42),
(148, 'User Logged in', 'LOGIN', '2025-08-13 19:37:41', 78),
(149, 'User Logged in', 'LOGIN', '2025-08-13 19:38:01', 107),
(150, 'User Logged in', 'LOGIN', '2025-08-14 21:16:36', 72),
(151, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-08-14 21:21:15', 72),
(152, 'User Logged in', 'LOGIN', '2025-08-14 21:21:56', 72),
(153, 'User Logged in', 'LOGIN', '2025-08-14 21:25:22', 42),
(154, 'User Logged in', 'LOGIN', '2025-08-14 21:33:23', 42),
(155, 'Marked notifications as read (count: 34)', 'READ NOTIFICATION', '2025-08-14 21:51:40', 42),
(156, 'User Logged in', 'LOGIN', '2025-08-15 01:42:38', 42),
(157, 'User Logged in', 'LOGIN', '2025-08-15 01:43:31', 42),
(158, 'User Logged in', 'LOGIN', '2025-08-15 01:44:37', 42),
(159, 'User Logged in', 'LOGIN', '2025-08-15 01:45:12', 42),
(160, 'User Logged in', 'LOGIN', '2025-08-15 01:46:49', 42),
(161, 'User Logged in', 'LOGIN', '2025-08-15 01:49:25', 42),
(162, 'User Logged in', 'LOGIN', '2025-08-15 01:50:33', 42),
(163, 'User Logged in', 'LOGIN', '2025-08-15 02:14:46', 77),
(164, 'User Logged in', 'LOGIN', '2025-08-15 07:23:12', 77),
(165, 'User Logged in', 'LOGIN', '2025-08-15 07:25:14', 96),
(166, 'Venue Request submitted', 'Reservation Request', '2025-08-15 07:27:56', 96),
(167, 'User Logged in', 'LOGIN', '2025-08-15 07:28:15', 42),
(168, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-08-15 07:30:32', 42),
(169, 'Updated Venue: MW 708', 'UPDATE VENUE', '2025-08-15 07:35:21', 42),
(170, 'Venue Request submitted', 'Reservation Request', '2025-08-15 07:35:25', 96),
(171, 'User Logged in', 'LOGIN', '2025-08-15 07:36:00', 99),
(172, 'User Logged in', 'LOGIN', '2025-08-15 07:36:29', 99),
(173, 'User Logged in', 'LOGIN', '2025-08-15 07:37:16', 114),
(174, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-15 07:37:24', 114),
(175, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-15 07:37:32', 99),
(176, 'User Logged in', 'LOGIN', '2025-08-15 07:37:54', 77),
(177, 'User Logged in', 'LOGIN', '2025-08-15 07:39:02', 96),
(178, 'Venue Request submitted', 'Reservation Request', '2025-08-15 08:18:52', 96),
(179, 'Venue Request submitted', 'Reservation Request', '2025-08-15 08:22:18', 96),
(180, 'User Logged in', 'LOGIN', '2025-08-15 15:50:41', 42),
(181, 'User: sample S. sample has been created', 'CREATE USER', '2025-08-15 15:52:28', NULL),
(182, 'User Logged in', 'LOGIN', '2025-08-15 15:52:55', 117),
(183, 'Password updated by: sample s. sample', 'UPDATE PASSWORD', '2025-08-15 15:53:04', 117),
(184, 'User Logged in', 'LOGIN', '2025-08-15 16:05:09', 96),
(185, 'User Logged in', 'LOGIN', '2025-08-15 16:10:17', 117),
(186, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:02:47', 117),
(187, 'User Logged in', 'LOGIN', '2025-08-16 00:03:17', 77),
(188, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:03:53', 117),
(189, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:28:39', 117),
(190, 'User Logged in', 'LOGIN', '2025-08-16 00:29:35', 42),
(191, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:31:45', 117),
(192, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:39:20', 117),
(193, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:44:58', 117),
(194, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-16 00:47:40', 42),
(195, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-16 00:47:50', 42),
(196, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-08-16 00:50:33', 117),
(197, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-16 00:50:33', 117),
(198, 'User Logged in', 'LOGIN', '2025-08-16 00:50:44', 111),
(199, 'Venue Request submitted', 'Reservation Request', '2025-08-16 00:51:03', 111),
(200, 'User Logged in', 'LOGIN', '2025-08-16 00:51:26', 112),
(201, 'Reservation \'asd\' approved by Chris ligan', 'APPROVE', '2025-08-16 00:51:29', 112),
(202, 'Reservation \'asd\' approved by Chris ligan', 'APPROVE', '2025-08-16 00:53:49', 112),
(203, 'Reservation \'asd\' approved by Chris ligan', 'APPROVE', '2025-08-16 00:55:40', 112),
(204, 'User Logged in', 'LOGIN', '2025-08-16 01:11:02', 99),
(205, 'Marked approval notifications as read (count: 6)', 'READ  NOTIFICATION', '2025-08-16 01:11:07', 99),
(206, 'Marked approval notifications as read (count: 6)', 'READ  NOTIFICATION', '2025-08-16 01:11:16', 42),
(207, 'User Logged in', 'LOGIN', '2025-08-16 01:12:03', 114),
(208, 'Marked approval notifications as read (count: 6)', 'READ  NOTIFICATION', '2025-08-16 01:12:08', 114),
(209, 'User Logged in', 'LOGIN', '2025-08-16 01:12:51', 109),
(210, 'Venue Request submitted', 'Reservation Request', '2025-08-16 01:13:18', 109),
(211, 'User Logged in', 'LOGIN', '2025-08-16 01:15:31', 77),
(212, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-08-16 01:15:34', 77),
(213, 'User Logged in', 'LOGIN', '2025-08-16 01:16:15', 84),
(214, 'Password updated by: Jonathan Reyes', 'UPDATE PASSWORD', '2025-08-16 01:16:26', 84),
(215, 'Reservation \'asd\' approved by Jonathan  Reyes', 'APPROVE', '2025-08-16 01:16:29', 84),
(216, 'User Logged in', 'LOGIN', '2025-08-16 01:16:49', 83),
(217, 'Password updated by: Rizhaly B. Maandig', 'UPDATE PASSWORD', '2025-08-16 01:16:57', 83),
(218, 'Reservation \'asd\' approved by Rizhaly B Maandig', 'APPROVE', '2025-08-16 01:16:59', 83),
(219, 'User Logged in', 'LOGIN', '2025-08-16 01:17:23', 114),
(220, 'User Logged in', 'LOGIN', '2025-08-16 01:17:56', 81),
(221, 'Password updated by: Gail D. Norway', 'UPDATE PASSWORD', '2025-08-16 01:18:15', 81),
(222, 'Reservation \'asd\' approved by Gail D Norway', 'APPROVE', '2025-08-16 01:18:18', 81),
(223, 'User Logged in', 'LOGIN', '2025-08-16 01:18:38', 85),
(224, 'Password updated by: Clyde  F. Gamolo', 'UPDATE PASSWORD', '2025-08-16 01:18:52', 85),
(225, 'Reservation \'asd\' approved by Clyde  F Gamolo', 'APPROVE', '2025-08-16 01:18:55', 85),
(226, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-16 01:19:46', 114),
(227, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-16 01:20:01', 99),
(228, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-16 01:20:08', 99),
(229, 'User Logged in', 'LOGIN', '2025-08-16 01:29:48', 109),
(230, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-08-16 01:29:58', 109),
(231, 'Marked approval notifications as read (count: 2)', 'READ  NOTIFICATION', '2025-08-16 01:29:58', 109),
(232, 'Reservation (asd) was cancelled by: Angeline Rolola', 'UPDATE STATUS', '2025-08-16 01:30:44', 109),
(233, 'User Logged in', 'LOGIN', '2025-08-16 01:31:01', 77),
(234, 'Venue Request submitted', 'Reservation Request', '2025-08-16 01:31:19', 77),
(235, 'Venue Request submitted', 'Reservation Request', '2025-08-16 02:30:37', 85),
(236, 'Marked approval notifications as read (count: 12)', 'READ  NOTIFICATION', '2025-08-16 02:39:49', 99),
(237, 'User Logged in', 'LOGIN', '2025-08-16 02:40:10', 117),
(238, 'User Logged in', 'LOGIN', '2025-08-16 02:57:26', 77),
(239, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-08-16 02:57:28', 77),
(240, 'Marked approval notifications as read (count: 3)', 'READ  NOTIFICATION', '2025-08-16 02:57:28', 77),
(241, 'User Logged in', 'LOGIN', '2025-08-16 02:57:40', 78),
(242, 'User Logged in', 'LOGIN', '2025-08-16 02:58:44', 42),
(243, 'Marked approval notifications as read (count: 12)', 'READ  NOTIFICATION', '2025-08-16 20:14:28', 42),
(244, 'User Logged in', 'LOGIN', '2025-08-16 20:14:44', 77),
(245, 'User Logged in', 'LOGIN', '2025-08-16 20:47:03', 109),
(246, 'User Logged in', 'LOGIN', '2025-08-16 20:50:06', 77),
(247, 'User Logged in', 'LOGIN', '2025-08-16 20:58:56', 77),
(248, 'User Logged in', 'LOGIN', '2025-08-16 21:00:38', 42),
(249, 'User Logged in', 'LOGIN', '2025-08-16 22:54:53', 42),
(250, 'User Logged in', 'LOGIN', '2025-08-16 22:55:12', 109),
(251, 'Venue Request submitted', 'Reservation Request', '2025-08-16 22:55:34', 109),
(252, 'Venue Request submitted', 'Reservation Request', '2025-08-16 22:56:15', 109),
(253, 'User Logged in', 'LOGIN', '2025-08-16 22:56:34', 99),
(254, 'User Logged in', 'LOGIN', '2025-08-16 22:56:53', 114),
(255, 'User Logged in', 'LOGIN', '2025-08-16 22:57:22', 109),
(256, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-08-16 22:57:24', 109),
(257, 'Marked approval notifications as read (count: 4)', 'READ  NOTIFICATION', '2025-08-16 22:57:24', 109),
(258, 'User Logged in', 'LOGIN', '2025-08-16 22:57:34', 77),
(259, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-08-16 22:57:47', 77),
(260, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-08-16 22:57:50', 77),
(261, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-16 22:57:57', 77),
(262, 'User Logged in', 'LOGIN', '2025-08-16 22:58:21', 114),
(263, 'Marked approval notifications as read (count: 14)', 'READ  NOTIFICATION', '2025-08-16 22:58:42', 114),
(264, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-16 22:59:28', 114),
(265, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-16 22:59:36', 99),
(266, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-16 22:59:39', 99),
(267, 'Marked approval notifications as read (count: 14)', 'READ  NOTIFICATION', '2025-08-16 22:59:41', 99),
(268, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-16 22:59:54', 114),
(269, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-16 22:59:57', 99),
(270, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-16 23:00:05', 114),
(271, 'Equipment (Monitor X) has new Serial Number: MX-004', 'CREATE UNIT', '2025-08-16 23:11:43', 99),
(272, 'User Logged in', 'LOGIN', '2025-08-16 23:18:13', 78),
(273, 'User Logged in', 'LOGIN', '2025-08-16 23:18:29', 77),
(274, 'User Logged in', 'LOGIN', '2025-08-16 23:18:45', 78),
(275, 'Venue AVR 2 released by: Virjillo Datario', 'RELEASE', '2025-08-16 23:18:48', 78),
(276, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-08-16 23:18:48', 78),
(277, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-08-16 23:18:52', 78),
(278, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-08-16 23:18:53', 78),
(279, 'Venue AVR 2 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-08-16 23:18:57', 78),
(280, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Damage - remarks: Guba naman ni', 'RETURN', '2025-08-16 23:19:05', 78),
(281, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-08-16 23:19:07', 78),
(282, 'Equipment Unit (Big Sound System - SN: BSS-001) availability set to Available by: Jeniffer B. Tuan', 'UPDATE AVAILABILITY', '2025-08-16 23:19:29', 99),
(283, 'Venue (AVR 2) availability set to Available by: Jeniffer B. Tuan', 'UPDATE AVAILABILITY', '2025-08-16 23:19:39', 99),
(284, 'User Logged in', 'LOGIN', '2025-08-16 23:23:24', 78),
(285, 'User Logged in', 'LOGIN', '2025-08-16 23:24:45', 42),
(286, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-08-16 23:49:59', 78),
(287, 'User Logged in', 'LOGIN', '2025-08-17 01:41:30', 78),
(288, 'User Logged in', 'LOGIN', '2025-08-17 02:01:16', 42),
(289, 'Marked approval notifications as read (count: 14)', 'READ  NOTIFICATION', '2025-08-17 02:21:18', 42),
(290, 'User Logged in', 'LOGIN', '2025-08-17 02:26:30', 117),
(291, 'Venue Request submitted', 'Reservation Request', '2025-08-17 02:28:45', 117),
(292, 'User Logged in', 'LOGIN', '2025-08-17 02:32:32', 77),
(293, 'Venue Request submitted', 'Reservation Request', '2025-08-17 02:32:59', 117),
(294, 'Venue Request submitted', 'Reservation Request', '2025-08-17 02:42:00', 77),
(295, 'User Logged in', 'LOGIN', '2025-08-18 00:50:54', 42),
(296, 'Marked approval notifications as read (count: 16)', 'READ  NOTIFICATION', '2025-08-18 01:01:00', 42),
(297, 'User Logged in', 'LOGIN', '2025-08-18 01:04:56', 42),
(298, 'User Logged in', 'LOGIN', '2025-08-18 01:14:11', 42),
(299, 'User Logged in', 'LOGIN', '2025-08-18 01:15:24', 42),
(300, 'User Logged in', 'LOGIN', '2025-08-18 01:15:42', 42),
(301, 'User Logged in', 'LOGIN', '2025-08-18 01:16:13', 42),
(302, 'User Logged in', 'LOGIN', '2025-08-18 01:40:07', 99),
(303, 'User Logged in', 'LOGIN', '2025-08-18 01:40:20', 114),
(304, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-18 01:40:33', 114),
(305, 'Reservation Report (August 2025) generated: 8 record(s) found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-08-18 05:37:12', 99),
(306, 'Marked approval notifications as read (count: 16)', 'READ  NOTIFICATION', '2025-08-18 05:37:41', 99),
(307, 'User Logged in', 'LOGIN', '2025-08-18 21:05:22', 42),
(308, 'User Logged in', 'LOGIN', '2025-08-18 21:11:56', 77),
(309, 'User Logged in', 'LOGIN', '2025-08-19 03:36:45', 42),
(310, 'Added Checklist to venue Sample Venue: No. Checklist (1) by: Christian Mark S. Valle', 'ADD CHECKLIST', '2025-08-19 04:04:30', 42),
(311, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-19 04:04:42', 42),
(312, 'User Logged in', 'LOGIN', '2025-08-19 04:04:58', 78),
(313, 'User Logged in', 'LOGIN', '2025-08-19 04:05:20', 78),
(314, 'Venue AVR 1 released by: Virjillo Datario', 'RELEASE', '2025-08-19 04:05:29', 78),
(315, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-08-19 04:05:29', 78),
(316, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-08-19 04:05:32', 78),
(317, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-08-19 04:05:34', 78),
(318, 'Virjillo Datario checked (All Working)', 'CHECK', '2025-08-19 04:05:34', 78),
(319, 'Venue Sample Venue released by: Virjillo Datario', 'RELEASE', '2025-08-19 04:15:32', 78),
(320, 'Virjillo Datario checked (asd)', 'CHECK', '2025-08-19 04:15:35', 78),
(321, 'User Logged in', 'LOGIN', '2025-08-19 04:17:29', 77),
(322, 'Venue Sample Venue returned by: Virjillo Datario - condition: For Inspection - remarks: asd', 'RETURN', '2025-08-19 04:38:39', 78),
(323, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-08-19 04:38:41', 78),
(324, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-08-19 04:38:44', 77),
(325, 'Marked approval notifications as read (count: 6)', 'READ  NOTIFICATION', '2025-08-19 04:38:44', 77),
(326, 'User Logged in', 'LOGIN', '2025-08-19 04:38:57', 42),
(327, 'User Logged in', 'LOGIN', '2025-08-19 21:58:29', 114),
(328, 'User Logged in', 'LOGIN', '2025-08-19 21:58:40', 99),
(329, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-19 21:58:47', 114),
(330, 'User Logged in', 'LOGIN', '2025-08-19 22:00:23', 117),
(331, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-08-19 22:05:44', 117),
(332, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-19 22:05:44', 117),
(333, 'Vehicle Request submitted', 'Reservation Request', '2025-08-19 22:10:44', 117),
(334, 'User Logged in', 'LOGIN', '2025-08-19 22:11:08', 114),
(335, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-19 22:22:31', 114),
(336, 'Marked approval notifications as read (count: 17)', 'READ  NOTIFICATION', '2025-08-19 23:19:14', 114),
(337, 'User Logged in', 'LOGIN', '2025-08-19 23:19:34', 117),
(338, 'Marked approval notifications as read (count: 17)', 'READ  NOTIFICATION', '2025-08-20 00:16:03', 99),
(339, 'Updated Department: CAS (Academic) -> CAS (Non-Academic)', 'UPDATE', '2025-08-20 00:23:32', 99),
(340, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-08-20 04:04:09', 117),
(341, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-20 04:04:09', 117),
(342, 'User Logged in', 'LOGIN', '2025-08-20 04:09:56', 114),
(343, 'Venue Request submitted', 'Reservation Request', '2025-08-20 04:10:27', 117),
(344, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-20 04:15:23', 114),
(345, 'Venue Request submitted', 'Reservation Request', '2025-08-20 04:16:18', 117),
(346, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-20 04:16:24', 114),
(347, 'Equipment Request submitted', 'Reservation Request', '2025-08-20 04:19:37', 117),
(348, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-20 04:19:44', 114),
(349, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-08-20 04:20:31', 117),
(350, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-20 04:20:31', 117),
(351, 'Venue Request submitted', 'Reservation Request', '2025-08-20 04:21:35', 117),
(352, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-08-20 04:22:05', 117),
(353, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-20 04:22:05', 117),
(354, 'User Logged in', 'LOGIN', '2025-08-20 04:47:48', 77),
(355, 'Venue Request submitted', 'Reservation Request', '2025-08-20 04:48:30', 77),
(356, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-08-20 04:53:16', 114),
(358, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-08-20 04:59:27', 77),
(359, 'Marked approval notifications as read (count: 7)', 'READ  NOTIFICATION', '2025-08-20 04:59:27', 77),
(360, 'User Logged in', 'LOGIN', '2025-08-20 04:59:56', 42),
(361, 'Venue (Sample Venue) availability set to Available by: Christian Mark S. Valle', 'UPDATE AVAILABILITY', '2025-08-20 05:04:08', 42),
(362, 'Marked approval notifications as read (count: 21)', 'READ  NOTIFICATION', '2025-08-20 05:05:05', 42),
(363, 'User Logged in', 'LOGIN', '2025-08-20 15:52:37', 42),
(364, 'User Logged in', 'LOGIN', '2025-08-20 16:11:37', 42),
(365, 'User Logged in', 'LOGIN', '2025-08-20 17:46:26', 77),
(366, 'User Logged in', 'LOGIN', '2025-08-21 02:54:05', 42),
(367, 'User Logged in', 'LOGIN', '2025-08-21 03:04:15', 42),
(368, 'User Logged in', 'LOGIN', '2025-08-21 03:04:50', 99),
(369, 'User Logged in', 'LOGIN', '2025-08-21 03:05:08', 114),
(370, 'Marked approval notifications as read (count: 21)', 'READ  NOTIFICATION', '2025-08-21 03:05:24', 114),
(371, 'User: asd A. asd has been updated. Changes: department: 52 -> 49', 'UPDATE USER', '2025-08-21 03:05:46', NULL),
(372, 'User Logged in', 'LOGIN', '2025-08-21 03:06:13', 111),
(373, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-08-21 03:06:16', 111),
(374, 'Venue Request submitted', 'Reservation Request', '2025-08-21 03:07:16', 111),
(375, 'User Logged in', 'LOGIN', '2025-08-21 03:14:07', 112),
(376, 'Reservation \'asasd\' approved by Chris ligan', 'APPROVE', '2025-08-21 03:14:10', 112),
(377, 'Reservation \'asasd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-21 03:14:16', 114),
(378, 'User Logged in', 'LOGIN', '2025-08-21 04:02:02', 111),
(379, 'User Logged in', 'LOGIN', '2025-08-21 04:05:11', 111),
(380, 'Marked approval notifications as read (count: 22)', 'READ  NOTIFICATION', '2025-08-21 04:07:34', 99),
(381, 'User Logged in', 'LOGIN', '2025-08-21 04:09:11', 111),
(382, 'Venue Request submitted', 'Reservation Request', '2025-08-21 05:40:13', 111),
(383, 'Reservation \'asdasd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-21 05:45:42', 114),
(384, 'User Logged in', 'LOGIN', '2025-08-21 05:45:59', 99),
(385, 'Reservation \'asdasd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-21 05:46:06', 99),
(386, 'Venue Request submitted', 'Reservation Request', '2025-08-21 05:46:48', 111),
(387, 'Venue Request submitted', 'Reservation Request', '2025-08-21 19:29:03', 111),
(388, 'User Logged in', 'LOGIN', '2025-08-21 20:14:13', 114),
(389, 'Reservation \'sd\' declined by Rusty C  Pisco', 'DECLINE', '2025-08-21 20:14:23', 114),
(390, 'Reservation \'sd\' declined by Jeniffer B Tuan', 'DECLINE', '2025-08-21 20:14:34', 99),
(391, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-21 20:15:01', 114),
(392, 'Equipment Request submitted', 'Reservation Request', '2025-08-21 20:45:07', 111),
(393, 'User Logged in', 'LOGIN', '2025-08-21 20:45:49', 96),
(394, 'Venue Request submitted', 'Reservation Request', '2025-08-21 20:47:41', 96),
(395, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-08-21 21:13:15', 96),
(396, 'User Logged in', 'LOGIN', '2025-08-21 21:15:16', 96),
(397, 'Venue Request submitted', 'Reservation Request', '2025-08-21 21:15:50', 96),
(398, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-21 21:16:44', 114),
(399, 'Marked approval notifications as read (count: 24)', 'READ  NOTIFICATION', '2025-08-21 21:23:26', 114),
(400, 'User Logged in', 'LOGIN', '2025-08-21 21:24:15', 42),
(401, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-21 21:26:59', 114),
(402, 'User Logged in', 'LOGIN', '2025-08-21 21:34:44', 117),
(403, 'Marked approval notifications as read (count: 24)', 'READ  NOTIFICATION', '2025-08-21 21:37:08', 42),
(404, 'User Logged in', 'LOGIN', '2025-08-21 21:39:04', 77),
(405, 'User Logged in', 'LOGIN', '2025-08-21 21:39:22', 96),
(406, 'Reservation (asd) was cancelled by: Mark C. Macaventa', 'UPDATE STATUS', '2025-08-21 21:40:28', 96),
(407, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-08-21 21:40:59', 96),
(408, 'User Logged in', 'LOGIN', '2025-08-21 23:17:29', 77),
(409, 'Venue Request submitted', 'Reservation Request', '2025-08-22 02:40:28', 117),
(410, 'Marked approval notifications as read (count: 12)', 'READ  NOTIFICATION', '2025-08-22 02:40:37', 77),
(411, 'User Logged in', 'LOGIN', '2025-08-22 02:41:04', 96),
(412, 'User Logged in', 'LOGIN', '2025-08-22 02:55:26', 77),
(413, 'User Logged in', 'LOGIN', '2025-08-22 02:55:41', 96),
(414, 'User Logged in', 'LOGIN', '2025-08-22 03:39:17', 42),
(415, 'User Logged in', 'LOGIN', '2025-08-22 03:41:49', 96),
(416, 'Vehicle Request submitted', 'Reservation Request', '2025-08-22 03:49:37', 96),
(417, 'User Logged in', 'LOGIN', '2025-08-22 03:59:40', 114),
(418, 'Marked approval notifications as read (count: 27)', 'READ  NOTIFICATION', '2025-08-22 03:59:43', 42),
(419, 'User Logged in', 'LOGIN', '2025-08-22 03:59:57', 42),
(420, 'User Logged in', 'LOGIN', '2025-08-22 04:00:09', 99),
(421, 'Marked approval notifications as read (count: 27)', 'READ  NOTIFICATION', '2025-08-22 04:00:25', 99),
(422, 'Marked approval notifications as read (count: 27)', 'READ  NOTIFICATION', '2025-08-22 04:00:31', 114),
(423, 'User Logged in', 'LOGIN', '2025-08-22 04:00:49', 111),
(424, 'Venue Request submitted', 'Reservation Request', '2025-08-22 04:01:04', 111),
(425, 'Venue Request submitted', 'Reservation Request', '2025-08-22 04:01:47', 111),
(426, 'Venue Request submitted', 'Reservation Request', '2025-08-22 04:03:51', 111),
(427, 'Updated Department: SHS (Academic) -> SHS (Non-Academic)', 'UPDATE', '2025-08-22 04:04:59', 99),
(428, 'Venue Request submitted', 'Reservation Request', '2025-08-22 04:08:26', 111),
(429, 'Venue Request submitted', 'Reservation Request', '2025-08-22 04:08:55', 111),
(430, 'Venue Request submitted', 'Reservation Request', '2025-08-22 04:09:52', 111),
(431, 'User Logged in', 'LOGIN', '2025-08-22 05:41:23', 96),
(432, 'Venue Request submitted', 'Reservation Request', '2025-08-22 05:41:45', 96),
(433, 'User Logged in', 'LOGIN', '2025-08-22 05:42:14', 114),
(434, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-22 05:42:19', 114),
(435, 'Marked approval notifications as read (count: 28)', 'READ  NOTIFICATION', '2025-08-22 05:44:47', 99),
(436, 'Marked approval notifications as read (count: 28)', 'READ  NOTIFICATION', '2025-08-22 05:45:19', 114),
(437, 'User Logged in', 'LOGIN', '2025-08-22 08:43:37', 96),
(438, 'Venue Request submitted', 'Reservation Request', '2025-08-22 08:44:07', 96),
(439, 'Reservation \'Meeting\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-22 08:45:34', 114),
(440, 'User Logged in', 'LOGIN', '2025-08-22 09:23:04', 42),
(441, 'Reservation (Meeting) was cancelled by: Mark C. Macaventa', 'UPDATE STATUS', '2025-08-22 09:23:16', 96),
(442, 'Vehicle Request submitted', 'Reservation Request', '2025-08-22 09:24:08', 96),
(443, 'User Logged in', 'LOGIN', '2025-08-22 09:24:48', 99),
(444, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-22 09:25:04', 114),
(445, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-22 09:26:01', 99),
(446, 'Venue Request submitted', 'Reservation Request', '2025-08-22 09:54:01', 96),
(447, 'Reservation \'asda\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-22 09:58:46', 114),
(448, 'Reservation \'asda\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-22 09:58:54', 99),
(449, 'User Logged in', 'LOGIN', '2025-08-23 04:06:59', 42),
(450, 'Marked approval notifications as read (count: 32)', 'READ  NOTIFICATION', '2025-08-23 04:12:18', 42),
(451, 'User Logged in', 'LOGIN', '2025-08-23 04:35:03', 96),
(452, 'User Logged in', 'LOGIN', '2025-08-23 04:59:32', 96),
(453, 'Venue Request submitted', 'Reservation Request', '2025-08-23 05:52:06', 96),
(454, 'User Logged in', 'LOGIN', '2025-08-23 07:00:25', 77),
(455, 'User Logged in', 'LOGIN', '2025-08-24 04:01:03', 96),
(456, 'User Logged in', 'LOGIN', '2025-08-24 04:07:33', 77),
(457, 'User Logged in', 'LOGIN', '2025-08-24 04:32:00', 96),
(458, 'Venue Request submitted', 'Reservation Request', '2025-08-24 04:32:19', 96),
(459, 'Venue Request submitted', 'Reservation Request', '2025-08-24 04:49:01', 77),
(460, 'Equipment Request submitted', 'Reservation Request', '2025-08-24 04:49:36', 77),
(461, 'User Logged in', 'LOGIN', '2025-08-25 05:37:28', 42),
(462, 'Marked approval notifications as read (count: 34)', 'READ  NOTIFICATION', '2025-08-25 05:37:55', 42),
(463, 'Created Department: Basic Ed. (Type: Academic)', 'CREATE', '2025-08-25 05:38:27', 42),
(464, 'User Logged in', 'LOGIN', '2025-08-25 05:42:24', 42),
(465, 'User Logged in', 'LOGIN', '2025-08-28 03:58:40', 42),
(466, 'Reservation \'asd\' declined by Christian Mark Siahay Valle', 'DECLINE', '2025-08-28 03:59:01', 42),
(467, 'User Logged in', 'LOGIN', '2025-08-28 03:59:23', 77),
(468, 'Venue Request submitted', 'Reservation Request', '2025-08-28 03:59:47', 77),
(469, 'Venue Request submitted', 'Reservation Request', '2025-08-28 04:01:46', 77),
(470, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-08-28 04:14:56', 77),
(471, 'Marked approval notifications as read (count: 22)', 'READ  NOTIFICATION', '2025-08-28 04:14:56', 77),
(472, 'User Logged in', 'LOGIN', '2025-08-28 04:15:35', 96),
(473, 'Venue Request submitted', 'Reservation Request', '2025-08-28 04:16:05', 96),
(474, 'Marked notifications as read (count: 12)', 'READ NOTIFICATION', '2025-08-28 04:16:18', 96),
(475, 'User Logged in', 'LOGIN', '2025-08-28 04:16:53', 114),
(476, 'User Logged in', 'LOGIN', '2025-08-28 04:17:04', 99),
(477, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-28 04:17:17', 114),
(478, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-28 04:17:22', 99),
(479, 'Reservation (asd) was cancelled by: Rusty C. Pisco', 'UPDATE STATUS', '2025-08-28 04:29:47', 114),
(480, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-28 04:29:48', 114),
(481, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-28 04:37:53', 114),
(482, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-28 04:38:24', 99),
(483, 'User Logged in', 'LOGIN', '2025-08-28 04:39:19', 77),
(484, 'Marked approval notifications as read (count: 36)', 'READ  NOTIFICATION', '2025-08-28 04:47:15', 114),
(485, 'User Logged in', 'LOGIN', '2025-08-28 15:05:21', 77),
(486, 'User Logged in', 'LOGIN', '2025-08-28 15:05:38', 96),
(487, 'User Logged in', 'LOGIN', '2025-08-28 15:09:29', 77),
(488, 'User Logged in', 'LOGIN', '2025-08-28 23:48:42', 77),
(489, 'Venue Request submitted', 'Reservation Request', '2025-08-28 23:49:02', 77),
(490, 'User Logged in', 'LOGIN', '2025-08-28 23:49:19', 99),
(491, 'Updated Venue: SHS Ground', 'UPDATE VENUE', '2025-08-28 23:49:53', 99),
(492, 'Venue Request submitted', 'Reservation Request', '2025-08-28 23:50:09', 77),
(493, 'Updated Department: SHS (Non-Academic) -> SHS (Academic)', 'UPDATE', '2025-08-28 23:51:44', 99),
(494, 'Venue Request submitted', 'Reservation Request', '2025-08-28 23:52:36', 77),
(495, 'Venue Request submitted', 'Reservation Request', '2025-08-28 23:53:37', 77),
(496, 'Venue Request submitted', 'Reservation Request', '2025-08-28 23:55:46', 77),
(497, 'Venue Request submitted', 'Reservation Request', '2025-08-28 23:59:06', 77),
(498, 'Venue Request submitted', 'Reservation Request', '2025-08-29 00:02:08', 77),
(499, 'Venue Request submitted', 'Reservation Request', '2025-08-29 00:04:35', 77),
(500, 'User Logged in', 'LOGIN', '2025-08-29 00:05:06', 96),
(501, 'Venue Request submitted', 'Reservation Request', '2025-08-29 00:05:32', 96),
(502, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-08-29 00:09:13', 77),
(503, 'Marked approval notifications as read (count: 30)', 'READ  NOTIFICATION', '2025-08-29 00:09:13', 77),
(504, 'User Logged in', 'LOGIN', '2025-08-29 01:54:43', 99),
(505, 'User Logged in', 'LOGIN', '2025-08-29 01:55:13', 114),
(506, 'User Logged in', 'LOGIN', '2025-08-29 01:55:49', 77),
(507, 'Venue Request submitted', 'Reservation Request', '2025-08-29 01:56:03', 77),
(508, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-29 01:56:35', 114),
(509, 'Vehicle Request submitted', 'Reservation Request', '2025-08-29 02:15:00', 77),
(510, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-29 02:15:06', 114),
(511, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-29 02:15:18', 99),
(512, 'User Logged in', 'LOGIN', '2025-08-29 02:39:18', 42),
(513, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-29 02:39:31', 42),
(514, 'Marked approval notifications as read (count: 37)', 'READ  NOTIFICATION', '2025-08-29 02:39:32', 42),
(515, 'User Logged in', 'LOGIN', '2025-08-29 02:39:46', 78),
(516, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-08-29 02:40:00', 78),
(517, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-08-29 02:40:03', 78),
(518, 'Vehicle L300 (12332) returned by: Virjillo Datario - condition: Damage - remarks: Hello', 'RETURN', '2025-08-29 02:40:16', 78),
(519, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-08-29 02:40:17', 78),
(520, 'User Logged in', 'LOGIN', '2025-08-29 02:40:51', 77),
(521, 'Venue Request submitted', 'Reservation Request', '2025-08-29 02:44:53', 77),
(522, 'User Logged in', 'LOGIN', '2025-08-29 02:45:08', 99),
(523, 'User Logged in', 'LOGIN', '2025-08-29 02:45:31', 114),
(524, 'Marked approval notifications as read (count: 37)', 'READ  NOTIFICATION', '2025-08-29 02:45:40', 114),
(525, 'User Logged in', 'LOGIN', '2025-08-29 02:46:01', 77),
(526, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-08-29 02:52:36', 77),
(527, 'Marked approval notifications as read (count: 33)', 'READ  NOTIFICATION', '2025-08-29 02:52:36', 77),
(528, 'User Logged in', 'LOGIN', '2025-08-29 03:11:52', 114),
(529, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-29 03:12:35', 114),
(530, 'User Logged in', 'LOGIN', '2025-08-29 03:13:33', 77),
(531, 'Venue Request submitted', 'Reservation Request', '2025-08-29 03:23:07', 77),
(532, 'User Logged in', 'LOGIN', '2025-08-29 03:33:32', 114),
(533, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-29 03:33:38', 114),
(534, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-08-29 03:33:42', 99),
(535, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-08-29 03:33:58', NULL),
(536, 'User Logged in', 'LOGIN', '2025-08-29 03:42:22', 77),
(537, 'Venue Request submitted', 'Reservation Request', '2025-08-29 03:42:34', 77),
(538, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-29 03:42:40', 114),
(539, 'User Logged in', 'LOGIN', '2025-08-30 20:20:22', 42),
(540, 'User Logged in', 'LOGIN', '2025-08-30 20:21:12', 42),
(541, 'User Logged in', 'LOGIN', '2025-08-30 21:20:09', 114),
(542, 'User Logged in', 'LOGIN', '2025-08-30 21:21:16', 114),
(543, 'User Logged in', 'LOGIN', '2025-08-30 21:59:06', 96),
(544, 'User Logged in', 'LOGIN', '2025-08-30 22:06:40', 72),
(545, 'User Logged in', 'LOGIN', '2025-08-30 22:07:42', 99),
(546, 'User Logged in', 'LOGIN', '2025-08-30 22:09:59', 114),
(547, 'Venue Request submitted', 'Reservation Request', '2025-08-30 22:10:22', 96),
(548, 'Reservation \'asdasd\' approved by Rusty C  Pisco', 'APPROVE', '2025-08-30 22:10:35', 114),
(549, 'Venue Request submitted', 'Reservation Request', '2025-08-30 22:20:53', 96),
(550, 'User Logged in', 'LOGIN', '2025-08-31 00:42:17', 96),
(551, 'User Logged in', 'LOGIN', '2025-08-31 01:36:22', 96),
(552, 'Venue Request submitted', 'Reservation Request', '2025-08-31 01:43:36', 96),
(553, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-08-31 01:44:34', 96),
(554, 'User Logged in', 'LOGIN', '2025-08-31 01:44:48', 77),
(555, 'Venue Request submitted', 'Reservation Request', '2025-08-31 01:45:16', 77),
(556, 'Venue Request submitted', 'Reservation Request', '2025-08-31 01:45:31', 77),
(557, 'User Logged in', 'LOGIN', '2025-08-31 01:52:00', 96),
(558, 'Venue Request submitted', 'Reservation Request', '2025-08-31 01:56:00', 96),
(559, 'User Logged in', 'LOGIN', '2025-08-31 02:11:42', 99),
(560, 'User Logged in', 'LOGIN', '2025-08-31 02:12:03', 117),
(561, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-08-31 02:28:53', 117),
(562, 'Marked approval notifications as read (count: 5)', 'READ  NOTIFICATION', '2025-08-31 02:28:53', 117),
(563, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-08-31 03:02:23', 99),
(564, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-08-31 03:02:45', 99),
(565, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-08-31 03:02:49', 99),
(566, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-08-31 03:03:13', 99),
(567, 'Unarchived Vehicle resource(s): 1', 'UNARCHIVE', '2025-08-31 03:03:55', 99),
(568, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-08-31 03:04:01', 99),
(569, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-08-31 03:04:04', 99),
(570, 'Marked approval notifications as read (count: 41)', 'READ  NOTIFICATION', '2025-08-31 03:10:31', 99),
(571, 'User Logged in', 'LOGIN', '2025-08-31 03:16:12', 42),
(572, 'Updated Venue: MW 703', 'UPDATE VENUE', '2025-08-31 03:26:54', 42),
(573, 'Updated Venue: MW 704', 'UPDATE VENUE', '2025-08-31 03:26:58', 42),
(574, 'Updated Venue: MW 705', 'UPDATE VENUE', '2025-08-31 03:27:04', 42),
(575, 'Updated Venue: MW 706', 'UPDATE VENUE', '2025-08-31 03:27:08', 42),
(576, 'Updated Venue: MW 707', 'UPDATE VENUE', '2025-08-31 03:27:13', 42),
(577, 'Updated Venue: MW 702', 'UPDATE VENUE', '2025-08-31 03:27:22', 42),
(578, 'Updated Venue: MW 701', 'UPDATE VENUE', '2025-08-31 03:27:28', 42),
(579, 'Updated Venue: MW 608', 'UPDATE VENUE', '2025-08-31 03:27:39', 42),
(580, 'Updated Venue: MW 608', 'UPDATE VENUE', '2025-08-31 03:27:44', 42),
(581, 'Updated Venue: MW 607', 'UPDATE VENUE', '2025-08-31 03:27:54', 42),
(582, 'Updated Venue: MW 606', 'UPDATE VENUE', '2025-08-31 03:28:13', 42),
(583, 'Updated Venue: MW 605', 'UPDATE VENUE', '2025-08-31 03:28:35', 42),
(584, 'Updated Venue: MW 604', 'UPDATE VENUE', '2025-08-31 03:28:41', 42),
(585, 'Updated Venue: MW 603', 'UPDATE VENUE', '2025-08-31 03:28:46', 42),
(586, 'Updated Venue: MW 602', 'UPDATE VENUE', '2025-08-31 03:28:51', 42),
(587, 'Updated Venue: MW 601', 'UPDATE VENUE', '2025-08-31 03:28:58', 42),
(588, 'Updated Venue: MW 508', 'UPDATE VENUE', '2025-08-31 03:29:04', 42),
(589, 'Updated Venue: MW 507', 'UPDATE VENUE', '2025-08-31 03:29:11', 42),
(590, 'Updated Venue: MW 506', 'UPDATE VENUE', '2025-08-31 03:29:18', 42),
(591, 'Updated Venue: MW 505', 'UPDATE VENUE', '2025-08-31 03:29:23', 42),
(592, 'Updated Venue: MW 504', 'UPDATE VENUE', '2025-08-31 03:29:28', 42),
(593, 'Updated Venue: MW 503', 'UPDATE VENUE', '2025-08-31 03:29:34', 42),
(594, 'Updated Venue: MW 502', 'UPDATE VENUE', '2025-08-31 03:29:41', 42),
(595, 'Updated Venue: MW 501', 'UPDATE VENUE', '2025-08-31 03:29:48', 42),
(596, 'Updated Venue: MW 404', 'UPDATE VENUE', '2025-08-31 03:29:59', 42),
(597, 'Updated Venue: MW 403', 'UPDATE VENUE', '2025-08-31 03:30:06', 42),
(598, 'Updated Venue: MW 401', 'UPDATE VENUE', '2025-08-31 03:30:13', 42),
(599, 'Updated Venue: MW 402', 'UPDATE VENUE', '2025-08-31 03:30:21', 42),
(600, 'Updated Venue: MW 308', 'UPDATE VENUE', '2025-08-31 03:30:36', 42),
(601, 'Updated Venue: MW 305', 'UPDATE VENUE', '2025-08-31 03:30:42', 42),
(602, 'Updated Venue: MW 304', 'UPDATE VENUE', '2025-08-31 03:30:47', 42),
(603, 'Updated Venue: MW 304', 'UPDATE VENUE', '2025-08-31 03:30:51', 42),
(604, 'Updated Venue: MW 303', 'UPDATE VENUE', '2025-08-31 03:30:58', 42),
(605, 'Updated Venue: MW 302', 'UPDATE VENUE', '2025-08-31 03:31:05', 42),
(606, 'Updated Venue: MW 301', 'UPDATE VENUE', '2025-08-31 03:31:12', 42),
(607, 'Updated Venue: MW 208', 'UPDATE VENUE', '2025-08-31 03:31:18', 42),
(608, 'Updated Venue: MW 204', 'UPDATE VENUE', '2025-08-31 03:31:22', 42),
(609, 'Updated Venue: MW 203', 'UPDATE VENUE', '2025-08-31 03:31:27', 42),
(610, 'Updated Venue: MW 201', 'UPDATE VENUE', '2025-08-31 03:31:31', 42),
(611, 'Updated Venue: BED 407', 'UPDATE VENUE', '2025-08-31 03:31:39', 42),
(612, 'Updated Venue: BED 406', 'UPDATE VENUE', '2025-08-31 03:31:43', 42),
(613, 'Updated Venue: BED 404', 'UPDATE VENUE', '2025-08-31 03:31:48', 42),
(614, 'Updated Venue: BED 403', 'UPDATE VENUE', '2025-08-31 03:31:53', 42),
(615, 'Updated Venue: BED 402', 'UPDATE VENUE', '2025-08-31 03:31:59', 42),
(616, 'Updated Venue: BED 401', 'UPDATE VENUE', '2025-08-31 03:32:04', 42),
(617, 'Updated Venue: BED 306', 'UPDATE VENUE', '2025-08-31 03:32:09', 42),
(618, 'Updated Venue: BED 305', 'UPDATE VENUE', '2025-08-31 03:32:14', 42),
(619, 'Updated Venue: BED 304', 'UPDATE VENUE', '2025-08-31 03:32:18', 42),
(620, 'Updated Venue: BED 303', 'UPDATE VENUE', '2025-08-31 03:32:24', 42),
(621, 'Marked approval notifications as read (count: 41)', 'READ  NOTIFICATION', '2025-08-31 03:32:33', 42),
(622, 'Vehicle (12332) availability set to Available by: Christian Mark S. Valle', 'UPDATE AVAILABILITY', '2025-08-31 03:33:41', 42),
(623, 'User Logged in', 'LOGIN', '2025-09-02 23:17:38', 77),
(624, 'Vehicle Request submitted', 'Reservation Request', '2025-09-02 23:18:18', 77),
(625, 'Marked notifications as read (count: 9)', 'READ NOTIFICATION', '2025-09-02 23:18:32', 77),
(626, 'Marked approval notifications as read (count: 38)', 'READ  NOTIFICATION', '2025-09-02 23:18:32', 77),
(627, 'User Logged in', 'LOGIN', '2025-09-02 23:18:51', 99),
(628, 'User Logged in', 'LOGIN', '2025-09-02 23:35:55', 114),
(629, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-02 23:42:01', 114),
(630, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-02 23:43:20', 99),
(631, 'User Logged in', 'LOGIN', '2025-09-02 23:44:12', 77),
(632, 'Vehicle Request submitted', 'Reservation Request', '2025-09-02 23:44:42', 77),
(633, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-02 23:45:12', 114),
(634, 'Marked approval notifications as read (count: 41)', 'READ  NOTIFICATION', '2025-09-03 00:57:55', 114),
(635, 'User Logged in', 'LOGIN', '2025-09-03 01:20:15', 77),
(636, 'Venue Request submitted', 'Reservation Request', '2025-09-03 01:50:06', 77),
(637, 'User Logged in', 'LOGIN', '2025-09-03 01:50:31', 99),
(638, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-03 01:50:51', 114),
(639, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 01:50:56', 99),
(640, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-03 01:51:02', 99),
(641, 'User Logged in', 'LOGIN', '2025-09-03 01:59:38', 78),
(642, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-09-03 02:00:04', 78),
(643, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-09-03 02:00:04', 78),
(644, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-09-03 02:00:06', 78),
(645, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-09-03 02:00:07', 78),
(646, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-09-03 02:00:09', 78),
(647, 'Venue Auditorium returned by: Virjillo Datario - condition: Good - remarks: Goods nani sya', 'RETURN', '2025-09-03 02:00:18', 78),
(648, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Missing - remarks: Aha nani?', 'RETURN', '2025-09-03 02:00:28', 78),
(649, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-09-03 02:00:29', 78),
(650, 'User Logged in', 'LOGIN', '2025-09-03 02:01:08', 77),
(651, 'Venue Request submitted', 'Reservation Request', '2025-09-03 02:02:41', 77),
(652, 'User Logged in', 'LOGIN', '2025-09-03 02:04:43', 72),
(653, 'User Logged in', 'LOGIN', '2025-09-03 02:16:52', 96),
(654, 'User Logged in', 'LOGIN', '2025-09-03 02:25:36', 99),
(655, 'User Logged in', 'LOGIN', '2025-09-03 02:26:04', 117),
(656, 'Venue Request submitted', 'Reservation Request', '2025-09-03 03:01:40', 117),
(657, 'User Logged in', 'LOGIN', '2025-09-03 03:02:01', 99),
(658, 'User Logged in', 'LOGIN', '2025-09-03 03:02:11', 114),
(659, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-03 03:02:20', 114),
(660, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:02:23', 99),
(661, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-03 03:02:34', 114),
(662, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:04:00', 99),
(663, 'User Logged in', 'LOGIN', '2025-09-03 03:04:35', 77),
(664, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:06:06', 99),
(665, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:06:44', 99),
(666, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:09:32', 99),
(667, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:10:00', 99),
(668, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:11:13', 99),
(669, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:11:50', 99),
(670, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:15:32', 99),
(671, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:15:52', 99),
(672, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:17:43', 99),
(673, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:21:20', 99),
(674, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:25:39', 99),
(675, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:29:56', 99),
(676, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:31:54', 99),
(677, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:32:16', 99),
(678, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:36:42', 99),
(679, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:37:21', 99),
(680, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:38:15', 99),
(681, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:40:56', 99),
(682, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:49:11', 99),
(683, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 03:58:10', 99),
(684, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:00:50', 99),
(685, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:01:18', 99),
(686, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:04:57', 99),
(687, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:05:25', 99),
(688, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:05:42', 99),
(689, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:07:14', 99),
(690, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:09:10', 99),
(691, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:16:28', 99),
(692, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:20:14', 99),
(693, 'User Logged in', 'LOGIN', '2025-09-03 04:21:24', 77),
(694, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:21:33', 99),
(695, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:21:57', 99),
(696, 'Marked notifications as read (count: 25)', 'READ NOTIFICATION', '2025-09-03 04:23:35', 77),
(697, 'Marked approval notifications as read (count: 41)', 'READ  NOTIFICATION', '2025-09-03 04:23:35', 77),
(698, 'User Logged in', 'LOGIN', '2025-09-03 04:25:05', 96),
(699, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:27:51', 99),
(700, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 04:28:13', 99),
(701, 'User Logged in', 'LOGIN', '2025-09-03 04:46:48', 77),
(702, 'User Logged in', 'LOGIN', '2025-09-03 05:04:32', 99),
(703, 'Venue Request submitted', 'Reservation Request', '2025-09-03 05:07:34', 96),
(704, 'User Logged in', 'LOGIN', '2025-09-03 05:09:10', 96),
(705, 'User Logged in', 'LOGIN', '2025-09-03 05:09:37', 77),
(706, 'Venue Request submitted', 'Reservation Request', '2025-09-03 05:10:11', 77),
(707, 'Venue Request submitted', 'Reservation Request', '2025-09-03 05:10:32', 96),
(708, 'User Logged in', 'LOGIN', '2025-09-03 05:10:56', 99),
(709, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 05:11:09', 99),
(710, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 05:11:41', 99),
(711, 'User Logged in', 'LOGIN', '2025-09-03 05:14:36', 77),
(712, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-09-03 06:29:01', 96),
(713, 'User Logged in', 'LOGIN', '2025-09-03 22:28:55', 99),
(714, 'User Logged in', 'LOGIN', '2025-09-03 22:29:06', 114),
(715, 'Marked approval notifications as read (count: 44)', 'READ  NOTIFICATION', '2025-09-03 22:29:10', 114),
(716, 'User Logged in', 'LOGIN', '2025-09-03 22:29:30', 77),
(717, 'Venue Request submitted', 'Reservation Request', '2025-09-03 22:29:43', 77),
(718, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-03 22:29:51', 114),
(719, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 22:30:03', 99),
(720, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-03 22:30:07', 99),
(721, 'User Logged in', 'LOGIN', '2025-09-03 22:30:21', 96),
(722, 'Venue Request submitted', 'Reservation Request', '2025-09-03 22:30:35', 96),
(723, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-03 22:30:45', 114),
(724, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 22:31:10', 99),
(725, 'User Logged in', 'LOGIN', '2025-09-03 22:31:59', 77),
(726, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-03 23:19:27', 99),
(727, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-03 23:50:05', 99),
(728, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-03 23:59:09', 99),
(729, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-03 23:59:14', 99),
(730, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-04 00:00:22', 99),
(731, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:04:28', 99),
(732, 'User Logged in', 'LOGIN', '2025-09-04 00:14:25', 77),
(733, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:14:42', 114),
(734, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:16:33', 99),
(735, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-04 00:17:12', 99),
(736, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:17:28', 99),
(737, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-04 00:17:58', 99),
(738, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:18:12', 99),
(739, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:19:50', 99),
(740, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:21:24', 99),
(741, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:22:38', 99),
(742, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:28:46', 99),
(743, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:29:00', 99),
(744, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:30:47', 99);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(745, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-04 00:30:50', 99),
(746, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:37:12', 77),
(747, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:41:47', 77),
(748, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:44:56', 77),
(749, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:47:17', 77),
(750, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:50:34', 77),
(751, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:53:04', 77),
(752, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:54:15', 77),
(753, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:55:12', 77),
(754, 'Venue Request submitted', 'Reservation Request', '2025-09-04 00:55:55', 77),
(755, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:00:16', 77),
(756, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:00:54', 77),
(757, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:01:40', 77),
(758, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:06:51', 77),
(759, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:10:20', 77),
(760, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:13:46', 77),
(761, 'User Logged in', 'LOGIN', '2025-09-04 01:16:46', 42),
(762, 'User Logged in', 'LOGIN', '2025-09-04 01:16:53', 77),
(763, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:17:09', 77),
(764, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:21:34', 77),
(765, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:26:23', 77),
(766, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:28:39', 77),
(767, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:29:00', 77),
(768, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:33:40', 77),
(769, 'Marked notifications as read (count: 20)', 'READ NOTIFICATION', '2025-09-04 01:35:59', 42),
(770, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:36:49', 77),
(771, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:38:09', 77),
(772, 'User Logged in', 'LOGIN', '2025-09-04 01:44:57', 42),
(773, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:45:19', 77),
(774, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:46:02', 77),
(775, 'Venue Request submitted', 'Reservation Request', '2025-09-04 01:47:29', 77),
(776, 'User Logged in', 'LOGIN', '2025-09-04 02:01:06', 77),
(777, 'Marked notifications as read (count: 50)', 'READ NOTIFICATION', '2025-09-04 02:02:11', 77),
(778, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:02:27', 77),
(779, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:06:18', 77),
(780, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:06:42', 77),
(781, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:09:10', 77),
(782, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:13:57', 77),
(783, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:15:46', 77),
(784, 'User Logged in', 'LOGIN', '2025-09-04 02:17:39', 42),
(785, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:18:01', 77),
(786, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:21:06', 77),
(787, 'User Logged in', 'LOGIN', '2025-09-04 02:21:55', 42),
(788, 'Venue Request submitted', 'Reservation Request', '2025-09-04 02:22:17', 77),
(789, 'User Logged in', 'LOGIN', '2025-09-04 03:15:52', 77),
(790, 'Venue Request submitted', 'Reservation Request', '2025-09-04 03:16:09', 77),
(791, 'User Logged in', 'LOGIN', '2025-09-04 03:17:08', 96),
(792, 'User Logged in', 'LOGIN', '2025-09-04 03:17:35', 117),
(793, 'Marked notifications as read (count: 15)', 'READ NOTIFICATION', '2025-09-04 03:47:08', 42),
(794, 'User Logged in', 'LOGIN', '2025-09-05 04:29:25', 42),
(795, 'User Logged in', 'LOGIN', '2025-09-05 04:29:37', 77),
(796, 'Venue Request submitted', 'Reservation Request', '2025-09-05 04:29:53', 77),
(797, 'Venue Request submitted', 'Reservation Request', '2025-09-05 04:35:10', 77),
(798, 'Venue Request submitted', 'Reservation Request', '2025-09-05 04:39:52', 77),
(799, 'Venue Request submitted', 'Reservation Request', '2025-09-05 04:44:10', 77),
(800, 'User Logged in', 'LOGIN', '2025-09-05 05:46:41', 42),
(801, 'User Logged in', 'LOGIN', '2025-09-05 05:48:47', 42),
(802, 'User Logged in', 'LOGIN', '2025-09-05 05:49:37', 42),
(803, 'User Logged in', 'LOGIN', '2025-09-05 06:36:20', 42),
(804, 'User Logged in', 'LOGIN', '2025-09-05 06:48:34', 42),
(805, 'User Logged in', 'LOGIN', '2025-09-10 01:21:27', 99),
(806, 'User Logged in', 'LOGIN', '2025-09-10 01:21:50', 114),
(807, 'User Logged in', 'LOGIN', '2025-09-10 01:25:11', 77),
(808, 'Venue Request submitted', 'Reservation Request', '2025-09-10 01:25:24', 77),
(809, 'User Logged in', 'LOGIN', '2025-09-10 01:25:52', 96),
(810, 'Venue Request submitted', 'Reservation Request', '2025-09-10 01:26:05', 96),
(811, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 01:49:13', 114),
(812, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 01:49:53', 99),
(813, 'User Logged in', 'LOGIN', '2025-09-10 01:50:57', 77),
(814, 'Venue Request submitted', 'Reservation Request', '2025-09-10 01:59:09', 77),
(815, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 01:59:21', 114),
(816, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 02:03:25', 99),
(817, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-10 02:03:31', 99),
(818, 'User Logged in', 'LOGIN', '2025-09-10 02:04:04', 99),
(819, 'User Logged in', 'LOGIN', '2025-09-10 02:04:47', 96),
(820, 'Venue Request submitted', 'Reservation Request', '2025-09-10 02:05:12', 96),
(821, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 02:05:19', 114),
(822, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 02:05:52', 99),
(823, 'User Logged in', 'LOGIN', '2025-09-10 02:06:14', 77),
(824, 'Vehicle Request submitted', 'Reservation Request', '2025-09-10 02:14:56', 77),
(825, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 02:20:22', 114),
(826, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 02:20:30', 99),
(827, 'User Logged in', 'LOGIN', '2025-09-10 02:21:04', 96),
(828, 'Vehicle Request submitted', 'Reservation Request', '2025-09-10 02:21:34', 96),
(829, 'User Logged in', 'LOGIN', '2025-09-10 02:21:51', 114),
(830, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 02:22:00', 114),
(831, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 02:34:16', 99),
(832, 'Venue Request submitted', 'Reservation Request', '2025-09-10 03:27:37', 77),
(833, 'Venue Request submitted', 'Reservation Request', '2025-09-10 03:29:17', 77),
(834, 'User Logged in', 'LOGIN', '2025-09-10 03:54:53', 114),
(835, 'Venue Request submitted', 'Reservation Request', '2025-09-10 04:29:20', 77),
(836, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 04:57:32', 114),
(837, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 04:58:32', 99),
(838, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-09-10 04:59:13', 114),
(839, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-09-10 05:00:39', 114),
(840, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 05:01:50', 114),
(841, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-09-10 05:02:06', 114),
(842, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 05:03:14', 114),
(843, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-09-10 05:03:34', 114),
(844, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 05:14:08', 114),
(845, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 05:14:25', 99),
(846, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 05:18:16', 114),
(847, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 05:18:19', 99),
(848, 'User Logged in', 'LOGIN', '2025-09-10 05:18:45', 96),
(849, 'Venue Request submitted', 'Reservation Request', '2025-09-10 05:19:03', 96),
(850, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 05:19:19', 114),
(851, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 05:19:57', 99),
(852, 'User Logged in', 'LOGIN', '2025-09-10 05:20:12', 77),
(853, 'Venue Request submitted', 'Reservation Request', '2025-09-10 06:04:39', 77),
(854, 'User Logged in', 'LOGIN', '2025-09-10 06:05:01', 114),
(855, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 06:05:08', 114),
(856, 'Venue Request submitted', 'Reservation Request', '2025-09-10 07:09:16', 77),
(857, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 07:10:02', 114),
(858, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 07:10:16', 99),
(859, 'User Logged in', 'LOGIN', '2025-09-10 07:11:04', 96),
(860, 'Venue Request submitted', 'Reservation Request', '2025-09-10 07:11:34', 96),
(861, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 07:16:51', 114),
(862, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 07:17:12', 99),
(863, 'User Logged in', 'LOGIN', '2025-09-10 07:17:53', 77),
(864, 'Reschedule request accepted for reservation ID 600', 'RESCHEDULE_ACCEPTED', '2025-09-10 08:03:53', 99),
(865, 'Reschedule request accepted for reservation ID 600', 'RESCHEDULE_ACCEPTED', '2025-09-10 08:11:36', 99),
(866, 'User Logged in', 'LOGIN', '2025-09-10 15:44:13', 114),
(867, 'User Logged in', 'LOGIN', '2025-09-10 15:44:28', 99),
(868, 'User Logged in', 'LOGIN', '2025-09-10 15:44:41', 77),
(869, 'Venue Request submitted', 'Reservation Request', '2025-09-10 15:45:44', 77),
(870, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 15:45:51', 114),
(871, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 15:45:55', 99),
(872, 'Marked notifications as read (count: 67)', 'READ NOTIFICATION', '2025-09-10 15:46:13', 77),
(873, 'User Logged in', 'LOGIN', '2025-09-10 15:46:29', 96),
(874, 'Venue Request submitted', 'Reservation Request', '2025-09-10 15:46:43', 96),
(875, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 15:47:03', 114),
(876, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 15:47:20', 99),
(877, 'User Logged in', 'LOGIN', '2025-09-10 15:48:33', 77),
(878, 'Reschedule request accepted for reservation ID 602', 'RESCHEDULE_ACCEPTED', '2025-09-10 16:08:15', 99),
(879, 'Venue Request submitted', 'Reservation Request', '2025-09-10 16:46:45', 77),
(880, 'User Logged in', 'LOGIN', '2025-09-10 16:47:14', 96),
(881, 'Venue Request submitted', 'Reservation Request', '2025-09-10 16:47:47', 96),
(882, 'User Logged in', 'LOGIN', '2025-09-10 22:11:50', 42),
(883, 'Marked notifications as read (count: 28)', 'READ NOTIFICATION', '2025-09-10 22:14:29', 42),
(884, 'User Logged in', 'LOGIN', '2025-09-10 22:14:42', 42),
(885, 'User Logged in', 'LOGIN', '2025-09-10 22:14:55', 114),
(886, 'User Logged in', 'LOGIN', '2025-09-10 22:15:08', 99),
(887, 'Marked notifications as read (count: 63)', 'READ NOTIFICATION', '2025-09-10 22:15:11', 114),
(888, 'User Logged in', 'LOGIN', '2025-09-10 22:16:10', 77),
(889, 'Venue Request submitted', 'Reservation Request', '2025-09-10 22:16:23', 77),
(890, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 22:16:31', 114),
(891, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 22:16:35', 99),
(892, 'User Logged in', 'LOGIN', '2025-09-10 22:17:00', 96),
(893, 'Venue Request submitted', 'Reservation Request', '2025-09-10 22:17:12', 96),
(894, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 22:17:20', 114),
(895, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 22:17:43', 99),
(896, 'User Logged in', 'LOGIN', '2025-09-10 22:17:57', 77),
(897, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-10 22:29:02', 99),
(898, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-10 22:29:08', 99),
(899, 'User Logged in', 'LOGIN', '2025-09-10 22:42:25', 78),
(900, 'Venue AVR 2 released by: Virjillo Datario', 'RELEASE', '2025-09-10 22:59:21', 78),
(901, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-09-10 22:59:23', 78),
(902, 'Venue AVR 2 returned by: Virjillo Datario - condition: For Inspection - remarks: Inspect The Lights', 'RETURN', '2025-09-10 22:59:33', 78),
(903, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-09-10 22:59:35', 78),
(904, 'User Logged in', 'LOGIN', '2025-09-10 23:00:31', 77),
(905, 'User Logged in', 'LOGIN', '2025-09-10 23:27:36', 99),
(906, 'Marked notifications as read (count: 66)', 'READ NOTIFICATION', '2025-09-10 23:27:45', 99),
(907, 'User Logged in', 'LOGIN', '2025-09-10 23:28:24', 114),
(908, 'User Logged in', 'LOGIN', '2025-09-10 23:29:45', 77),
(909, 'Equipment Request submitted', 'Reservation Request', '2025-09-10 23:30:30', 77),
(910, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 23:30:39', 114),
(911, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-10 23:30:43', 99),
(912, 'Venue Request submitted', 'Reservation Request', '2025-09-10 23:31:15', 77),
(913, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-10 23:31:19', 114),
(914, 'Reschedule request accepted for reservation ID 609', 'RESCHEDULE_ACCEPTED', '2025-09-10 23:49:05', 99),
(915, 'User Logged in', 'LOGIN', '2025-09-14 19:04:11', 77),
(916, 'Marked notifications as read (count: 13)', 'READ NOTIFICATION', '2025-09-14 19:04:15', 77),
(917, 'User Logged in', 'LOGIN', '2025-09-14 19:05:31', 77),
(918, 'User Logged in', 'LOGIN', '2025-09-14 19:06:15', 77),
(919, 'User Logged in', 'LOGIN', '2025-09-14 19:06:24', 99),
(920, 'Venue Request submitted', 'Reservation Request', '2025-09-14 19:06:55', 77),
(921, 'Venue Request submitted', 'Reservation Request', '2025-09-14 20:23:23', 77),
(922, 'User Logged in', 'LOGIN', '2025-09-14 20:24:22', 77),
(923, 'Venue Request submitted', 'Reservation Request', '2025-09-14 20:28:30', 77),
(924, 'User Logged in', 'LOGIN', '2025-09-14 20:29:56', 99),
(925, 'User Logged in', 'LOGIN', '2025-09-14 21:37:51', 77),
(926, 'User Logged in', 'LOGIN', '2025-09-14 21:38:05', 99),
(927, 'Venue Request submitted', 'Reservation Request', '2025-09-14 21:38:38', 77),
(928, 'User Logged in', 'LOGIN', '2025-09-14 22:54:51', 99),
(929, 'User Logged in', 'LOGIN', '2025-09-14 22:55:08', 77),
(930, 'Venue Request submitted', 'Reservation Request', '2025-09-14 22:55:42', 77),
(931, 'User Logged in', 'LOGIN', '2025-09-14 23:07:28', 77),
(932, 'User Logged in', 'LOGIN', '2025-09-14 23:17:23', 77),
(933, 'Venue Request submitted', 'Reservation Request', '2025-09-14 23:17:39', 77),
(934, 'Marked notifications as read (count: 12)', 'READ NOTIFICATION', '2025-09-14 23:34:05', 77),
(935, 'User Logged in', 'LOGIN', '2025-09-15 00:09:50', 99),
(936, 'User Logged in', 'LOGIN', '2025-09-15 00:10:04', 77),
(937, 'Venue Request submitted', 'Reservation Request', '2025-09-15 00:10:31', 77),
(938, 'User Logged in', 'LOGIN', '2025-09-15 08:55:38', 99),
(939, 'User Logged in', 'LOGIN', '2025-09-15 08:55:51', 77),
(940, 'Venue Request submitted', 'Reservation Request', '2025-09-15 08:56:11', 77),
(941, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-09-15 09:00:15', 99),
(942, 'User Logged in', 'LOGIN', '2025-09-15 11:11:56', 99),
(943, 'User Logged in', 'LOGIN', '2025-09-15 20:01:36', 99),
(944, 'User Logged in', 'LOGIN', '2025-09-15 20:01:58', 114),
(945, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-15 20:02:10', 114),
(946, 'User Logged in', 'LOGIN', '2025-09-15 20:10:51', 77),
(947, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-15 20:23:57', 114),
(948, 'Reschedule request accepted for reservation ID 616', 'RESCHEDULE_ACCEPTED', '2025-09-15 20:31:51', 99),
(949, 'User Logged in', 'LOGIN', '2025-09-15 20:42:26', 114),
(950, 'Venue Request submitted', 'Reservation Request', '2025-09-15 20:43:33', 77),
(951, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-15 20:45:04', 114),
(952, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-15 20:46:25', 99),
(953, 'User Logged in', 'LOGIN', '2025-09-15 20:46:51', 96),
(954, 'Venue Request submitted', 'Reservation Request', '2025-09-15 20:47:12', 96),
(955, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-15 20:47:26', 114),
(956, 'User Logged in', 'LOGIN', '2025-09-16 15:13:32', 99),
(957, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-09-16 15:15:48', 99),
(958, 'User Logged in', 'LOGIN', '2025-09-16 15:16:05', 77),
(959, 'User Logged in', 'LOGIN', '2025-09-16 15:16:28', 99),
(960, 'User Logged in', 'LOGIN', '2025-09-16 15:17:57', 96),
(961, 'Marked notifications as read (count: 17)', 'READ NOTIFICATION', '2025-09-16 15:18:29', 96),
(962, 'User Logged in', 'LOGIN', '2025-09-16 15:38:45', 77),
(963, 'User Logged in', 'LOGIN', '2025-09-16 15:39:00', 96),
(964, 'User Logged in', 'LOGIN', '2025-09-17 04:09:40', 96),
(965, 'User Logged in', 'LOGIN', '2025-09-17 04:09:56', 77),
(966, 'Vehicle Request submitted', 'Reservation Request', '2025-09-17 04:11:14', 77),
(967, 'User Logged in', 'LOGIN', '2025-09-17 04:12:09', 99),
(968, 'User Logged in', 'LOGIN', '2025-09-17 04:12:27', 99),
(969, 'User Logged in', 'LOGIN', '2025-09-17 04:12:58', 96),
(970, 'Vehicle Request submitted', 'Reservation Request', '2025-09-17 04:14:17', 96),
(971, 'Venue Request submitted', 'Reservation Request', '2025-09-17 04:20:36', 96),
(972, 'User Logged in', 'LOGIN', '2025-09-17 04:28:39', 77),
(973, 'Venue Request submitted', 'Reservation Request', '2025-09-17 04:36:14', 77),
(974, 'User Logged in', 'LOGIN', '2025-09-17 04:39:36', 99),
(975, 'User Logged in', 'LOGIN', '2025-09-17 04:41:18', 99),
(976, 'User Logged in', 'LOGIN', '2025-09-17 04:41:44', 77),
(977, 'Venue Request submitted', 'Reservation Request', '2025-09-17 04:42:26', 77),
(978, 'User Logged in', 'LOGIN', '2025-09-17 04:59:26', 77),
(979, 'Venue Request submitted', 'Reservation Request', '2025-09-17 04:59:45', 77),
(980, 'User Logged in', 'LOGIN', '2025-09-17 05:04:47', 99),
(981, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:05:35', 77),
(982, 'User Logged in', 'LOGIN', '2025-09-17 05:18:49', 77),
(983, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:19:24', 77),
(984, 'User Logged in', 'LOGIN', '2025-09-17 05:20:16', 77),
(985, 'User Logged in', 'LOGIN', '2025-09-17 05:20:42', 99),
(986, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:21:52', 77),
(987, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:22:57', 77),
(988, 'User Logged in', 'LOGIN', '2025-09-17 05:29:40', 77),
(989, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:30:00', 77),
(990, 'User Logged in', 'LOGIN', '2025-09-17 05:42:51', 99),
(991, 'Marked notifications as read (count: 13)', 'READ NOTIFICATION', '2025-09-17 05:42:56', 99),
(992, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:44:27', 77),
(993, 'Venue Request submitted', 'Reservation Request', '2025-09-17 05:45:50', 77),
(994, 'User Logged in', 'LOGIN', '2025-09-17 05:57:56', 99),
(995, 'User Logged in', 'LOGIN', '2025-09-17 06:23:09', 77),
(996, 'Venue Request submitted', 'Reservation Request', '2025-09-17 06:23:22', 77),
(997, 'User Logged in', 'LOGIN', '2025-09-17 06:28:11', 99),
(998, 'Venue Request submitted', 'Reservation Request', '2025-09-17 06:30:05', 77),
(999, 'Venue Request submitted', 'Reservation Request', '2025-09-17 06:31:13', 77),
(1000, 'User Logged in', 'LOGIN', '2025-09-17 17:21:27', 99),
(1001, 'User Logged in', 'LOGIN', '2025-09-17 17:28:51', 77),
(1002, 'Venue Request submitted', 'Reservation Request', '2025-09-17 17:29:09', 77),
(1003, 'User Logged in', 'LOGIN', '2025-09-17 17:34:22', 99),
(1004, 'User Logged in', 'LOGIN', '2025-09-17 19:34:07', 114),
(1005, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-17 19:34:16', 114),
(1006, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-17 19:34:17', 114),
(1007, 'User Logged in', 'LOGIN', '2025-09-17 19:37:08', 114),
(1008, 'Reservation \'asd\' approved by User ID ', 'APPROVE', '2025-09-17 19:37:20', NULL),
(1009, 'Reservation \'asd\' approved by User ID ', 'APPROVE', '2025-09-17 19:40:38', NULL),
(1010, 'Reservation \'asd\' approved by Christian Mark Siahay Valle', 'APPROVE', '2025-09-17 19:42:38', 42),
(1011, 'User Logged in', 'LOGIN', '2025-09-17 19:46:19', 114),
(1012, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-17 19:46:27', 114),
(1013, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-17 19:48:37', 114),
(1014, 'User Logged in', 'LOGIN', '2025-09-17 19:50:23', 99),
(1015, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-09-17 19:50:29', 99),
(1016, 'User Logged in', 'LOGIN', '2025-09-17 19:58:13', 99),
(1017, 'User Logged in', 'LOGIN', '2025-09-17 20:02:29', 99),
(1018, 'User Logged in', 'LOGIN', '2025-09-17 20:02:55', 99),
(1019, 'User Logged in', 'LOGIN', '2025-09-17 20:04:23', 99),
(1020, 'User Logged in', 'LOGIN', '2025-09-17 20:06:31', 77),
(1021, 'Venue Request submitted', 'Reservation Request', '2025-09-17 20:06:55', 77),
(1022, 'User Logged in', 'LOGIN', '2025-09-17 20:07:28', 82),
(1023, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-09-17 20:07:32', 82),
(1024, 'Venue Request submitted', 'Reservation Request', '2025-09-17 20:21:24', 82),
(1025, 'User Logged in', 'LOGIN', '2025-09-17 21:33:43', 77),
(1026, 'Venue Request submitted', 'Reservation Request', '2025-09-17 21:34:11', 77),
(1027, 'Venue Request submitted', 'Reservation Request', '2025-09-17 21:38:14', 77),
(1028, 'User Logged in', 'LOGIN', '2025-09-17 21:42:48', 77),
(1029, 'Venue Request submitted', 'Reservation Request', '2025-09-17 21:43:08', 77),
(1030, 'User Logged in', 'LOGIN', '2025-09-17 21:44:40', 99),
(1031, 'User Logged in', 'LOGIN', '2025-09-17 21:44:58', 77),
(1032, 'Venue Request submitted', 'Reservation Request', '2025-09-17 21:47:06', 77),
(1033, 'Venue Request submitted', 'Reservation Request', '2025-09-18 03:40:39', 77),
(1034, 'User Logged in', 'LOGIN', '2025-09-18 08:54:02', 77),
(1035, 'Marked notifications as read (count: 58)', 'READ NOTIFICATION', '2025-09-18 08:54:09', 77),
(1036, 'User Logged in', 'LOGIN', '2025-09-18 12:01:57', 77),
(1037, 'User Logged in', 'LOGIN', '2025-09-18 12:10:14', 77),
(1038, 'User Logged in', 'LOGIN', '2025-09-18 12:12:34', 77),
(1039, 'User Logged in', 'LOGIN', '2025-09-18 12:19:04', 77),
(1040, 'User Logged in', 'LOGIN', '2025-09-18 12:48:49', 42),
(1041, 'User Logged in', 'LOGIN', '2025-09-18 13:13:44', 77),
(1042, 'User Logged in', 'LOGIN', '2025-09-18 13:18:14', 77),
(1043, 'User Logged in', 'LOGIN', '2025-09-18 13:19:39', 42),
(1044, 'User Logged in', 'LOGIN', '2025-09-18 13:25:42', 77),
(1045, 'User Logged in', 'LOGIN', '2025-09-18 13:29:38', 77),
(1046, 'User Logged in', 'LOGIN', '2025-09-18 13:30:53', 77),
(1047, 'User Logged in', 'LOGIN', '2025-09-18 13:33:00', 42),
(1048, 'User Logged in', 'LOGIN', '2025-09-18 13:50:06', 72),
(1049, 'User Logged in', 'LOGIN', '2025-09-18 13:50:59', 72),
(1050, 'Marked notifications as read (count: 82)', 'READ NOTIFICATION', '2025-09-18 13:53:20', 72),
(1051, 'User Logged in', 'LOGIN', '2025-09-18 14:07:35', 99),
(1052, 'User Logged in', 'LOGIN', '2025-09-18 14:07:56', 111),
(1053, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-09-18 14:15:51', 99),
(1054, 'User Logged in', 'LOGIN', '2025-09-18 23:39:10', 99),
(1055, 'Updated Checklist in equipment Chairs: \'Complete Quantity\' -> \'Complete Quantitys\'', 'UPDATE CHECKLIST', '2025-09-18 23:40:06', NULL),
(1056, 'Updated Venue: Sample Venues', 'UPDATE VENUE', '2025-09-19 00:23:09', NULL),
(1057, 'User Logged in', 'LOGIN', '2025-09-19 00:30:10', 99),
(1058, 'User Logged out', 'LOGOUT', '2025-09-19 00:50:17', 99),
(1059, 'User Logged in', 'LOGIN', '2025-09-19 00:50:23', 99),
(1060, 'User Logged out', 'LOGOUT', '2025-09-19 00:51:16', 99),
(1061, 'User Logged in', 'LOGIN', '2025-09-19 00:51:23', 77),
(1062, 'User Logged out', 'LOGOUT', '2025-09-19 00:51:34', 77),
(1063, 'User Logged in', 'LOGIN', '2025-09-19 00:51:46', 78),
(1064, 'User Logged in', 'LOGIN', '2025-09-19 00:56:46', 78),
(1065, 'User Logged in', 'LOGIN', '2025-09-19 00:59:03', 77),
(1066, 'User Logged out', 'LOGOUT', '2025-09-19 00:59:08', 77),
(1067, 'User Logged in', 'LOGIN', '2025-09-19 01:11:59', 78),
(1068, 'User Logged in', 'LOGIN', '2025-09-19 01:15:29', 77),
(1069, 'User Logged out', 'LOGOUT', '2025-09-19 01:15:36', 77),
(1070, 'User Logged in', 'LOGIN', '2025-09-19 01:15:49', 78),
(1071, 'Marked notifications as read (count: 14)', 'READ NOTIFICATION', '2025-09-19 01:16:16', 78),
(1072, 'User Logged out', 'LOGOUT', '2025-09-19 01:16:19', 78),
(1073, 'User Logged in', 'LOGIN', '2025-09-19 01:21:02', 77),
(1074, 'User Logged out', 'LOGOUT', '2025-09-19 01:30:13', 77),
(1075, 'User Logged in', 'LOGIN', '2025-09-19 01:30:24', 99),
(1076, 'User Logged in', 'LOGIN', '2025-09-19 02:01:42', 77),
(1077, 'User Logged in', 'LOGIN', '2025-09-19 02:04:13', 77),
(1078, 'User Logged in', 'LOGIN', '2025-09-19 12:47:43', 99),
(1079, 'Created Venue : Sample 1', 'CREATE', '2025-09-19 12:59:12', 99),
(1080, 'Created Vehicle : 2002asda', 'CREATE', '2025-09-19 12:59:48', 99),
(1081, 'Created Vehicle Make: sample', 'CREATE', '2025-09-19 16:39:17', 99),
(1082, 'Created Vehicle Category: \'sample\'', 'CREATE', '2025-09-19 16:39:33', 99),
(1083, 'Created Vehicle Model: \'asd\'', 'CREATE', '2025-09-19 16:39:50', 99),
(1084, 'Created Vehicle Category: \'asd\'', 'CREATE', '2025-09-19 16:43:19', 99),
(1085, 'User Logged in', 'LOGIN', '2025-09-19 16:55:10', 77),
(1086, 'User Logged in', 'LOGIN', '2025-09-20 12:08:43', 99),
(1087, 'User Logged in', 'LOGIN', '2025-09-20 19:01:03', 114),
(1088, 'User Logged in', 'LOGIN', '2025-09-20 19:01:18', 96),
(1089, 'Venue Request submitted', 'Reservation Request', '2025-09-20 19:01:49', 96),
(1090, 'Venue Request submitted', 'Reservation Request', '2025-09-20 19:02:34', 96),
(1091, 'User Logged in', 'LOGIN', '2025-09-20 19:02:52', 99),
(1092, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-20 19:07:07', 114),
(1093, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-20 19:07:11', 114),
(1094, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-20 19:07:56', 114),
(1095, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-20 19:10:54', 114),
(1096, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-20 19:23:00', 99),
(1097, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-20 19:23:09', NULL),
(1098, 'Venue Request submitted', 'Reservation Request', '2025-09-20 19:23:47', 96),
(1099, 'Venue Request submitted', 'Reservation Request', '2025-09-20 19:27:19', 96),
(1100, 'User Logged out', 'LOGOUT', '2025-09-20 19:27:55', 96),
(1101, 'User Logged in', 'LOGIN', '2025-09-20 19:28:07', 77),
(1102, 'Venue Request submitted', 'Reservation Request', '2025-09-20 19:28:28', 77),
(1103, 'User Logged in', 'LOGIN', '2025-09-20 21:12:16', 77),
(1104, 'Venue Request submitted', 'Reservation Request', '2025-09-20 21:12:36', 77),
(1105, 'Venue Request submitted', 'Reservation Request', '2025-09-20 21:14:00', 77),
(1106, 'Venue Request submitted', 'Reservation Request', '2025-09-20 21:14:52', 77),
(1107, 'User Logged in', 'LOGIN', '2025-09-20 21:15:35', 99),
(1108, 'Venue Request submitted', 'Reservation Request', '2025-09-20 21:15:58', 77),
(1109, 'Venue Request submitted', 'Reservation Request', '2025-09-20 21:28:43', 77),
(1110, 'User Logged in', 'LOGIN', '2025-09-20 22:38:57', 77),
(1111, 'Venue Request submitted', 'Reservation Request', '2025-09-20 22:39:18', 77),
(1112, 'Venue Request submitted', 'Reservation Request', '2025-09-20 22:40:20', 77),
(1113, 'Venue Request submitted', 'Reservation Request', '2025-09-20 22:49:42', 77),
(1114, 'Venue Request submitted', 'Reservation Request', '2025-09-20 22:51:50', 77),
(1115, 'User Logged in', 'LOGIN', '2025-09-21 10:46:08', 78),
(1116, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-09-21 10:47:36', 78),
(1117, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-09-21 10:47:39', 78),
(1118, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-09-21 10:47:40', 78),
(1119, 'Venue Auditorium returned by: Virjillo Datario - condition: Good - remarks: hehe', 'RETURN', '2025-09-21 10:48:25', 78),
(1120, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-09-21 10:48:28', 78),
(1121, 'User Logged out', 'LOGOUT', '2025-09-21 10:48:33', 78),
(1122, 'User Logged in', 'LOGIN', '2025-09-21 10:48:43', 96),
(1123, 'User Logged out', 'LOGOUT', '2025-09-21 10:49:37', 96),
(1124, 'User Logged in', 'LOGIN', '2025-09-21 10:49:50', 72),
(1125, 'User Logged out', 'LOGOUT', '2025-09-21 10:50:32', 72),
(1126, 'User Logged in', 'LOGIN', '2025-09-21 10:50:44', 96),
(1127, 'User Logged in', 'LOGIN', '2025-09-21 11:46:11', 114),
(1128, 'User Logged in', 'LOGIN', '2025-09-21 18:05:01', 114),
(1129, 'User Logged in', 'LOGIN', '2025-09-21 18:05:46', 96),
(1130, 'Venue Request submitted', 'Reservation Request', '2025-09-21 18:06:06', 96),
(1131, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-21 18:07:35', 114),
(1132, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-21 18:08:19', 99),
(1133, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-21 18:08:24', NULL),
(1134, 'User Logged out', 'LOGOUT', '2025-09-21 18:08:29', 114),
(1135, 'User Logged in', 'LOGIN', '2025-09-21 18:08:38', 78),
(1136, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-09-21 18:08:59', 78),
(1137, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-09-21 18:09:01', 78),
(1138, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-09-21 18:09:02', 78),
(1139, 'Venue Auditorium returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-09-21 18:09:06', 78),
(1140, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-09-21 18:09:07', 78),
(1141, 'Venue Request submitted', 'Reservation Request', '2025-09-21 18:20:33', 96),
(1142, 'User Logged in', 'LOGIN', '2025-09-21 22:06:57', 111),
(1143, 'User Logged out', 'LOGOUT', '2025-09-21 22:12:13', 111),
(1144, 'User Logged in', 'LOGIN', '2025-09-21 22:12:30', 96),
(1145, 'Venue Request submitted', 'Reservation Request', '2025-09-21 22:15:42', 96),
(1146, 'User Logged out', 'LOGOUT', '2025-09-21 22:16:28', 96),
(1147, 'User Logged in', 'LOGIN', '2025-09-21 22:16:47', 111),
(1148, 'User Logged in', 'LOGIN', '2025-09-21 22:17:26', 77),
(1149, 'Venue Request submitted', 'Reservation Request', '2025-09-21 22:17:50', 111),
(1150, 'Venue Request submitted', 'Reservation Request', '2025-09-21 22:18:20', 111),
(1151, 'Venue Request submitted', 'Reservation Request', '2025-09-21 22:22:22', 111),
(1152, 'User Logged out', 'LOGOUT', '2025-09-21 22:23:07', 77),
(1153, 'User Logged in', 'LOGIN', '2025-09-21 22:23:16', 99),
(1154, 'Venue Request submitted', 'Reservation Request', '2025-09-21 22:23:51', 111),
(1155, 'User Logged out', 'LOGOUT', '2025-09-21 22:24:41', 111),
(1156, 'User Logged in', 'LOGIN', '2025-09-21 22:25:00', 114),
(1157, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-22 01:27:36', 114),
(1158, 'User Logged out', 'LOGOUT', '2025-09-22 01:33:01', 114),
(1159, 'User Logged in', 'LOGIN', '2025-09-22 01:33:34', 111),
(1160, 'Venue Request submitted', 'Reservation Request', '2025-09-22 01:34:02', 111),
(1161, 'User Logged in', 'LOGIN', '2025-09-22 01:37:43', 114),
(1162, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-09-22 01:38:55', 114),
(1163, 'Reservation \'asd\' declined by Jeniffer B Tuan', 'DECLINE', '2025-09-22 01:39:02', 99),
(1164, 'User Logged in', 'LOGIN', '2025-09-22 01:39:18', 96),
(1165, 'Marked notifications as read (count: 17)', 'READ NOTIFICATION', '2025-09-22 01:50:35', 96),
(1166, 'Marked notifications as read (count: 71)', 'READ NOTIFICATION', '2025-09-22 01:53:20', 114),
(1167, 'User Logged out', 'LOGOUT', '2025-09-22 01:53:23', 114),
(1168, 'User Logged in', 'LOGIN', '2025-09-22 01:53:38', 96),
(1169, 'Vehicle Request submitted', 'Reservation Request', '2025-09-22 02:33:09', 96),
(1170, 'User Logged out', 'LOGOUT', '2025-09-22 02:35:18', 96),
(1171, 'User Logged in', 'LOGIN', '2025-09-22 02:35:38', 99),
(1172, 'Vehicle Request submitted', 'Reservation Request', '2025-09-22 02:36:25', 96),
(1173, 'User Logged out', 'LOGOUT', '2025-09-22 02:38:45', 96),
(1174, 'User Logged in', 'LOGIN', '2025-09-22 02:38:58', 114),
(1175, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-22 02:39:10', 114),
(1176, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-22 02:39:23', 99),
(1177, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-22 02:39:30', 99),
(1178, 'User Logged out', 'LOGOUT', '2025-09-22 02:42:41', 114),
(1179, 'User Logged in', 'LOGIN', '2025-09-22 02:42:50', 96),
(1180, 'Reservation \'asd\' declined by Jeniffer B Tuan', 'DECLINE', '2025-09-22 02:46:44', 99),
(1181, 'User Logged out', 'LOGOUT', '2025-09-22 02:46:52', 96),
(1182, 'User Logged in', 'LOGIN', '2025-09-22 02:47:06', 114),
(1183, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-22 02:47:16', 114),
(1184, 'User Logged out', 'LOGOUT', '2025-09-22 02:47:57', 114),
(1185, 'User Logged in', 'LOGIN', '2025-09-22 02:48:09', 96),
(1186, 'User Logged in', 'LOGIN', '2025-09-22 11:29:38', 96),
(1187, 'Venue Request submitted', 'Reservation Request', '2025-09-22 11:33:38', 96),
(1188, 'User Logged out', 'LOGOUT', '2025-09-22 17:44:58', 96),
(1189, 'User Logged in', 'LOGIN', '2025-09-22 17:45:14', 114),
(1190, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-22 17:45:25', 114),
(1191, 'User Logged in', 'LOGIN', '2025-09-22 17:47:04', 96),
(1192, 'User Logged out', 'LOGOUT', '2025-09-22 17:51:43', 114),
(1193, 'User Logged in', 'LOGIN', '2025-09-22 17:51:57', 96),
(1194, 'User Logged in', 'LOGIN', '2025-09-22 19:44:21', 86),
(1195, 'User Logged in', 'LOGIN', '2025-09-23 15:43:15', 99),
(1196, 'Marked notifications as read (count: 35)', 'READ NOTIFICATION', '2025-09-23 16:20:30', 99),
(1197, 'User Logged in', 'LOGIN', '2025-09-23 16:20:58', 77),
(1198, 'Venue Request submitted', 'Reservation Request', '2025-09-23 16:21:39', 77),
(1199, 'User Logged out', 'LOGOUT', '2025-09-23 16:21:52', 77),
(1200, 'User Logged in', 'LOGIN', '2025-09-23 16:22:50', 96),
(1201, 'User Logged out', 'LOGOUT', '2025-09-23 16:23:01', 96),
(1202, 'User Logged in', 'LOGIN', '2025-09-23 16:23:09', 77),
(1203, 'Venue Request submitted', 'Reservation Request', '2025-09-23 16:23:39', 77),
(1204, 'User Logged out', 'LOGOUT', '2025-09-23 16:24:11', 77),
(1205, 'User Logged in', 'LOGIN', '2025-09-23 16:24:19', 96),
(1206, 'User Logged in', 'LOGIN', '2025-09-23 20:19:00', 99),
(1207, 'User Logged in', 'LOGIN', '2025-09-23 20:19:41', 114),
(1208, 'User: Gian Legaspi has been updated. Changes: user level: 17 -> 16', 'UPDATE USER', '2025-09-23 20:20:59', NULL),
(1209, 'User Logged in', 'LOGIN', '2025-09-23 20:21:32', 96),
(1210, 'User Logged out', 'LOGOUT', '2025-09-23 20:21:39', 96),
(1211, 'User Logged in', 'LOGIN', '2025-09-23 20:21:46', 111),
(1212, 'Venue Request submitted', 'Reservation Request', '2025-09-23 20:22:04', 111),
(1213, 'User Logged out', 'LOGOUT', '2025-09-23 20:22:27', 111),
(1214, 'User Logged in', 'LOGIN', '2025-09-23 20:22:59', 77),
(1215, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-09-23 20:29:33', 77),
(1216, 'User Logged out', 'LOGOUT', '2025-09-23 20:30:12', 77),
(1217, 'User Logged in', 'LOGIN', '2025-09-23 20:30:24', 85),
(1218, 'Reservation \'asd\' approved by Clyde  F Gamolo', 'APPROVE', '2025-09-23 20:30:28', 85),
(1219, 'User Logged out', 'LOGOUT', '2025-09-23 20:30:34', 85),
(1220, 'User Logged in', 'LOGIN', '2025-09-23 20:30:43', 84),
(1221, 'Reservation \'asd\' approved by Jonathan  Reyes', 'APPROVE', '2025-09-23 20:30:46', 84),
(1222, 'User Logged out', 'LOGOUT', '2025-09-23 20:30:51', 84),
(1223, 'User Logged in', 'LOGIN', '2025-09-23 20:31:00', 83),
(1224, 'Reservation \'asd\' approved by Rizhaly B Maandig', 'APPROVE', '2025-09-23 20:31:03', 83),
(1225, 'User Logged out', 'LOGOUT', '2025-09-23 20:31:05', 83),
(1226, 'User Logged in', 'LOGIN', '2025-09-23 20:31:27', 82),
(1227, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-09-23 20:31:30', 82),
(1228, 'User Logged out', 'LOGOUT', '2025-09-23 20:31:34', 82),
(1229, 'User Logged in', 'LOGIN', '2025-09-23 20:31:51', 81),
(1230, 'User: Gail D. Norway has been updated. Changes: department: 30 -> 39', 'UPDATE USER', '2025-09-23 20:33:36', NULL),
(1231, 'User Logged out', 'LOGOUT', '2025-09-23 20:34:53', 81),
(1232, 'User Logged in', 'LOGIN', '2025-09-23 20:35:21', 81),
(1233, 'Reservation \'asd\' approved by Gail D Norway', 'APPROVE', '2025-09-23 20:35:24', 81),
(1234, 'User Logged out', 'LOGOUT', '2025-09-23 20:35:37', 81),
(1235, 'User Logged in', 'LOGIN', '2025-09-23 20:35:58', 112),
(1236, 'Reservation \'asd\' approved by Chris ligan', 'APPROVE', '2025-09-23 20:36:00', 112),
(1237, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-23 20:36:21', 114),
(1238, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-23 20:36:34', 99),
(1239, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-23 20:36:38', 99),
(1240, 'User Logged out', 'LOGOUT', '2025-09-23 20:36:43', 112),
(1241, 'User Logged in', 'LOGIN', '2025-09-23 20:38:13', 77),
(1242, 'Vehicle Request submitted', 'Reservation Request', '2025-09-23 20:38:56', 77),
(1243, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-23 20:39:19', 114),
(1244, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-23 20:41:04', 99),
(1245, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-23 20:41:13', 99),
(1246, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-09-23 20:48:10', 99),
(1247, 'User Logged out', 'LOGOUT', '2025-09-23 21:39:25', 99),
(1248, 'User Logged in', 'LOGIN', '2025-09-23 21:39:35', 99),
(1249, 'Reservation Report (September 2025) generated: 2 record(s) found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-09-23 21:45:33', 99),
(1250, 'User Logged in', 'LOGIN', '2025-09-24 02:12:28', 77),
(1251, 'User Logged in', 'LOGIN', '2025-09-24 02:12:56', 77),
(1252, 'Venue Request submitted', 'Reservation Request', '2025-09-24 02:13:30', 77),
(1253, 'Venue Request submitted', 'Reservation Request', '2025-09-24 02:24:04', 77),
(1254, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-09-24 02:24:19', 99),
(1255, 'User Logged out', 'LOGOUT', '2025-09-24 03:09:56', 99),
(1256, 'User Logged in', 'LOGIN', '2025-09-24 03:10:07', 78),
(1257, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-09-24 03:10:14', 78),
(1258, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-09-24 03:10:14', 78),
(1259, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-09-24 03:10:15', 78),
(1260, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-09-24 03:10:25', 78),
(1261, 'User Logged out', 'LOGOUT', '2025-09-24 03:10:29', 78),
(1262, 'User Logged in', 'LOGIN', '2025-09-24 03:10:33', 99),
(1263, 'User Logged in', 'LOGIN', '2025-09-24 03:11:01', 114),
(1264, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-24 03:11:47', 114),
(1265, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-24 03:11:57', 99),
(1266, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-24 03:12:03', 99),
(1267, 'User Logged out', 'LOGOUT', '2025-09-24 03:12:09', 99),
(1268, 'User Logged in', 'LOGIN', '2025-09-24 03:12:43', 77),
(1269, 'User Logged in', 'LOGIN', '2025-09-24 03:12:55', 77),
(1270, 'Venue Request submitted', 'Reservation Request', '2025-09-24 03:13:44', 77),
(1271, 'Venue Request submitted', 'Reservation Request', '2025-09-24 03:14:32', 77),
(1272, 'User Logged out', 'LOGOUT', '2025-09-24 03:15:08', 77),
(1273, 'User Logged in', 'LOGIN', '2025-09-24 03:15:19', 96),
(1274, 'Venue Request submitted', 'Reservation Request', '2025-09-24 03:19:05', 96),
(1275, 'User Logged out', 'LOGOUT', '2025-09-24 03:44:18', 96),
(1276, 'User Logged in', 'LOGIN', '2025-09-24 03:44:27', 72),
(1277, 'User Logged in', 'LOGIN', '2025-09-24 17:48:27', 77),
(1278, 'Venue Request submitted', 'Reservation Request', '2025-09-24 17:49:39', 77),
(1279, 'Venue Request submitted', 'Reservation Request', '2025-09-24 17:50:29', 77),
(1280, 'User Logged out', 'LOGOUT', '2025-09-24 17:51:01', 77),
(1281, 'User Logged in', 'LOGIN', '2025-09-24 17:51:08', 99),
(1282, 'User Logged in', 'LOGIN', '2025-09-24 17:51:49', 99),
(1283, 'User Logged out', 'LOGOUT', '2025-09-24 17:55:46', 99),
(1284, 'User Logged in', 'LOGIN', '2025-09-24 17:55:55', 77),
(1285, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-09-24 18:28:27', 99),
(1286, 'Venue Request submitted', 'Reservation Request', '2025-09-24 18:40:30', 77),
(1287, 'User Logged in', 'LOGIN', '2025-09-24 19:11:06', 99),
(1288, 'User Logged out', 'LOGOUT', '2025-09-24 19:11:21', 99),
(1289, 'User Logged in', 'LOGIN', '2025-09-24 19:11:32', 114),
(1290, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-24 19:11:42', 114),
(1291, 'User Logged in', 'LOGIN', '2025-09-24 19:12:47', 77),
(1292, 'Reschedule request accepted for reservation ID 679', 'RESCHEDULE_ACCEPTED', '2025-09-24 19:14:07', 99),
(1293, 'Marked notifications as read (count: 51)', 'READ NOTIFICATION', '2025-09-24 19:14:12', 77),
(1294, 'User Logged in', 'LOGIN', '2025-09-25 13:07:17', 77),
(1295, 'User Logged in', 'LOGIN', '2025-09-25 13:38:57', 114),
(1296, 'User Logged in', 'LOGIN', '2025-09-25 13:41:16', 77),
(1297, 'Venue Request submitted', 'Reservation Request', '2025-09-25 13:41:52', 77),
(1298, 'Reservation Report (October 2025) generated: no records found by: Rusty C. Pisco', 'GENERATE REPORT', '2025-09-25 13:45:21', 114),
(1299, 'Reservation Report (September 2025) generated: 4 record(s) found by: Rusty C. Pisco', 'GENERATE REPORT', '2025-09-25 13:45:26', 114),
(1300, 'Vehicle Request submitted', 'Reservation Request', '2025-09-25 13:47:53', 77),
(1301, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-09-25 13:48:02', 114),
(1302, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-09-25 13:48:15', 99),
(1303, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-09-25 13:48:20', 99),
(1304, 'User Logged in', 'LOGIN', '2025-09-26 23:19:03', 42),
(1305, 'User Logged in', 'LOGIN', '2025-09-26 23:20:10', 99),
(1306, 'User Logged in', 'LOGIN', '2025-09-26 23:22:59', 42),
(1307, 'User Logged in', 'LOGIN', '2025-09-26 23:39:39', 42),
(1308, 'User Logged in', 'LOGIN', '2025-09-26 23:44:02', 99),
(1309, 'User Logged in', 'LOGIN', '2025-09-27 00:27:47', 99),
(1310, 'User Logged in', 'LOGIN', '2025-09-27 00:45:59', 42),
(1311, 'User Logged in', 'LOGIN', '2025-09-27 00:46:17', 99),
(1312, 'User Logged in', 'LOGIN', '2025-09-27 00:47:34', 99),
(1313, 'User Logged in', 'LOGIN', '2025-09-27 01:19:01', 99),
(1314, 'User Logged in', 'LOGIN', '2025-09-27 01:21:22', 99),
(1315, 'User Logged in', 'LOGIN', '2025-09-27 01:22:41', 42),
(1316, 'User Logged in', 'LOGIN', '2025-09-27 01:27:20', 42),
(1317, 'User Logged in', 'LOGIN', '2025-09-27 01:27:47', 42),
(1318, 'User: Christian Mark S. Valle has enabled 2FA (expires: 2025-09-27 19:28:58)', 'ENABLE 2FA', '2025-09-27 01:28:58', 42),
(1319, 'User Logged out', 'LOGOUT', '2025-09-27 01:29:03', 42),
(1320, 'User Logged in', 'LOGIN', '2025-09-27 01:29:10', 42),
(1321, 'User Logged out', 'LOGOUT', '2025-09-27 01:29:26', 42),
(1322, 'User Logged in', 'LOGIN', '2025-09-27 01:29:32', 42),
(1323, 'User Logged out', 'LOGOUT', '2025-09-27 01:32:29', 42),
(1324, 'User Logged in', 'LOGIN', '2025-09-27 01:32:35', 42),
(1325, 'User Logged in', 'LOGIN', '2025-09-27 01:33:55', 42),
(1326, 'User Logged in', 'LOGIN', '2025-09-27 01:37:35', 42),
(1327, 'User Logged in', 'LOGIN', '2025-09-27 01:46:09', 42),
(1328, 'User Logged in', 'LOGIN', '2025-09-27 01:51:49', 42),
(1329, 'User Logged out', 'LOGOUT', '2025-09-27 01:57:44', 42),
(1330, 'User Logged in', 'LOGIN', '2025-09-27 21:44:24', 42),
(1331, 'User Logged in', 'LOGIN', '2025-09-27 21:44:41', 96),
(1332, 'User Logged in', 'LOGIN', '2025-09-28 00:10:52', 42),
(1333, 'User Logged in', 'LOGIN', '2025-09-28 00:11:41', 96),
(1334, 'User Logged in', 'LOGIN', '2025-09-28 00:30:55', 86),
(1335, 'User Logged in', 'LOGIN', '2025-09-28 00:36:55', 42),
(1336, 'User Logged in', 'LOGIN', '2025-09-28 00:37:37', 86),
(1337, 'User Logged in', 'LOGIN', '2025-09-28 00:41:37', 86),
(1338, 'User Logged out', 'LOGOUT', '2025-09-28 00:42:44', 86),
(1339, 'User Logged in', 'LOGIN', '2025-09-28 00:43:01', 42),
(1340, 'User Logged in', 'LOGIN', '2025-09-29 08:09:21', 42),
(1341, 'User Logged in', 'LOGIN', '2025-09-29 08:09:45', 96),
(1342, 'User Logged out', 'LOGOUT', '2025-09-29 08:10:09', 96),
(1343, 'User Logged in', 'LOGIN', '2025-09-29 08:10:20', 99),
(1344, 'User Logged in', 'LOGIN', '2025-09-29 08:10:37', 114),
(1345, 'User Logged in', 'LOGIN', '2025-09-29 08:11:51', 82),
(1346, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-09-29 08:11:56', 82),
(1347, 'User Logged in', 'LOGIN', '2025-09-29 08:36:05', 82),
(1348, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-09-29 09:04:16', 99),
(1349, 'Reservation Report (September 2025) generated: 5 record(s) found', 'GENERATE REPORT', '2025-09-29 20:38:44', NULL),
(1350, 'Reservation Report (September 2025) generated: 5 record(s) found', 'GENERATE REPORT', '2025-09-29 20:45:05', NULL),
(1351, 'Reservation Report (September 2025) generated: 5 record(s) found', 'GENERATE REPORT', '2025-09-29 20:47:13', NULL),
(1352, 'User Logged in', 'LOGIN', '2025-09-29 20:59:31', 77),
(1353, 'Venue Request submitted', 'Reservation Request', '2025-09-29 20:59:47', 77),
(1354, 'User Logged out', 'LOGOUT', '2025-09-29 21:22:51', 77),
(1355, 'User Logged in', 'LOGIN', '2025-09-29 21:22:58', 77),
(1356, 'User Logged out', 'LOGOUT', '2025-09-29 21:23:03', 77),
(1357, 'User Logged in', 'LOGIN', '2025-09-29 21:23:22', 99),
(1358, 'Reservation Report (September 2025) generated: 6 record(s) found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-09-29 21:24:02', 99),
(1359, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-09-29 21:27:10', 99),
(1360, 'Reservation Report (September 2025) generated: 6 record(s) found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-09-29 21:28:20', 99),
(1361, 'User Logged in', 'LOGIN', '2025-09-29 21:35:01', 77),
(1362, 'User: Darwin M. Galudo has been updated. Changes: title: null -> 1', 'UPDATE USER', '2025-10-01 20:59:07', NULL),
(1363, 'User Logged in', 'LOGIN', '2025-10-01 21:07:28', 77),
(1364, 'Venue Request submitted', 'Reservation Request', '2025-10-01 21:07:55', 77),
(1365, 'User Logged in', 'LOGIN', '2025-10-01 22:30:40', 99),
(1366, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'hi babe\'', 'SEND MESSAGE', '2025-10-01 22:34:09', 99),
(1367, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'hello\'', 'SEND MESSAGE', '2025-10-01 22:35:46', 99),
(1368, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'hello\'', 'SEND MESSAGE', '2025-10-01 22:40:37', 99),
(1369, 'User Logged in', 'LOGIN', '2025-10-01 22:56:55', 114),
(1370, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-01 22:57:05', 114),
(1371, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-01 22:58:18', 99),
(1372, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-01 22:58:28', 99),
(1373, 'Marked notifications as read (count: 23)', 'READ NOTIFICATION', '2025-10-01 22:58:43', 114),
(1374, 'User Logged out', 'LOGOUT', '2025-10-01 22:58:46', 114),
(1375, 'User Logged in', 'LOGIN', '2025-10-01 22:59:04', 78),
(1376, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-01 23:00:00', 78),
(1377, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-01 23:00:03', 78),
(1378, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-01 23:00:04', 78),
(1379, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection - remarks: Here', 'RETURN', '2025-10-01 23:00:14', 78),
(1380, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-01 23:00:16', 78),
(1381, 'Created Department: Basic Ed (Type: Academic)', 'CREATE', '2025-10-01 23:05:32', 99),
(1382, 'Updated Department: Basic Ed (Academic) -> . (Academic)', 'UPDATE', '2025-10-01 23:05:44', 99),
(1383, 'User Logged out', 'LOGOUT', '2025-10-01 23:14:13', 78),
(1384, 'User Logged in', 'LOGIN', '2025-10-01 23:14:25', 107),
(1385, 'User Logged in', 'LOGIN', '2025-10-01 23:14:54', 107),
(1386, 'User Logged in', 'LOGIN', '2025-10-01 23:17:21', 107),
(1387, 'User Logged out', 'LOGOUT', '2025-10-01 23:17:33', 107),
(1388, 'User Logged in', 'LOGIN', '2025-10-01 23:17:40', 99),
(1389, 'User Logged out', 'LOGOUT', '2025-10-01 23:17:45', 99),
(1390, 'User Logged in', 'LOGIN', '2025-10-02 00:17:32', 99),
(1391, 'Updated Vehicle: 12332', 'UPDATE VEHICLE', '2025-10-02 00:38:57', 99),
(1392, 'Updated Vehicle: 122222', 'UPDATE VEHICLE', '2025-10-02 00:39:07', 99),
(1393, 'User Logged out', 'LOGOUT', '2025-10-02 09:37:50', 99),
(1394, 'User Logged in', 'LOGIN', '2025-10-02 09:37:55', 99),
(1395, 'User Logged in', 'LOGIN', '2025-10-02 09:39:41', 99),
(1396, 'User Logged in', 'LOGIN', '2025-10-02 09:39:58', 99),
(1397, 'User Logged in', 'LOGIN', '2025-10-02 09:40:07', 99),
(1398, 'User Logged in', 'LOGIN', '2025-10-02 09:41:22', 99),
(1399, 'User Logged out', 'LOGOUT', '2025-10-02 10:54:35', 99),
(1400, 'User Logged in', 'LOGIN', '2025-10-02 10:54:45', 42),
(1401, 'User Logged in', 'LOGIN', '2025-10-02 10:55:54', 99),
(1402, 'User Logged in', 'LOGIN', '2025-10-02 11:01:01', 99),
(1403, 'User Logged in', 'LOGIN', '2025-10-02 11:01:40', 99),
(1404, 'User Logged in', 'LOGIN', '2025-10-02 11:03:03', 99),
(1405, 'User Logged in', 'LOGIN', '2025-10-02 11:03:16', 99),
(1406, 'User Logged in', 'LOGIN', '2025-10-02 11:04:04', 99),
(1407, 'User Logged in', 'LOGIN', '2025-10-02 11:04:33', 99);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(1408, 'User Logged in', 'LOGIN', '2025-10-02 11:22:01', 42),
(1409, 'User Logged in', 'LOGIN', '2025-10-02 11:23:44', 99),
(1410, 'User Logged in', 'LOGIN', '2025-10-02 12:20:37', 99),
(1411, 'User Logged in', 'LOGIN', '2025-10-02 12:21:14', 42),
(1412, 'User Logged in', 'LOGIN', '2025-10-02 12:23:59', 99),
(1413, 'User Logged out', 'LOGOUT', '2025-10-02 12:24:43', 99),
(1414, 'User Logged in', 'LOGIN', '2025-10-02 12:24:49', 99),
(1415, 'User Logged in', 'LOGIN', '2025-10-02 12:26:40', 99),
(1416, 'User Logged out', 'LOGOUT', '2025-10-02 18:31:52', 99),
(1417, 'User Logged in', 'LOGIN', '2025-10-02 18:39:00', 99),
(1418, 'User Logged out', 'LOGOUT', '2025-10-02 18:39:13', 99),
(1419, 'User Logged in', 'LOGIN', '2025-10-02 18:39:53', 99),
(1420, 'User Logged in', 'LOGIN', '2025-10-02 19:23:35', 99),
(1421, 'User Logged out', 'LOGOUT', '2025-10-02 19:25:38', 99),
(1422, 'User Logged in', 'LOGIN', '2025-10-02 19:26:07', 42),
(1423, 'User Logged in', 'LOGIN', '2025-10-02 19:26:23', 42),
(1424, 'User Logged out', 'LOGOUT', '2025-10-02 19:27:22', 42),
(1425, 'User Logged in', 'LOGIN', '2025-10-02 19:27:41', 42),
(1426, 'User Logged out', 'LOGOUT', '2025-10-02 19:27:48', 42),
(1427, 'User Logged in', 'LOGIN', '2025-10-02 19:28:08', 42),
(1428, 'Marked notifications as read (count: 94)', 'READ NOTIFICATION', '2025-10-02 20:28:45', 42),
(1429, 'User Logged in', 'LOGIN', '2025-10-02 22:02:09', 99),
(1430, 'User Logged in', 'LOGIN', '2025-10-02 22:06:16', 77),
(1431, 'Venue Request submitted', 'Reservation Request', '2025-10-02 22:06:33', 77),
(1432, 'User Logged out', 'LOGOUT', '2025-10-02 22:07:22', 77),
(1433, 'User Logged in', 'LOGIN', '2025-10-02 22:07:36', 114),
(1434, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-02 22:07:44', 114),
(1435, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-02 22:07:49', 99),
(1436, 'User Logged out', 'LOGOUT', '2025-10-02 22:07:59', 114),
(1437, 'User Logged in', 'LOGIN', '2025-10-02 22:08:07', 77),
(1438, 'Marked notifications as read (count: 17)', 'READ NOTIFICATION', '2025-10-02 22:16:27', 77),
(1439, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-02 22:46:16', 99),
(1440, 'Reservation Report (September 2025) generated: no records found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-10-03 11:09:33', 99),
(1441, 'Reservation Report (October 2025) generated: 2 record(s) found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-10-03 11:09:36', 99),
(1442, 'User Logged in', 'LOGIN', '2025-10-03 11:14:13', 77),
(1443, 'Venue Request submitted', 'Reservation Request', '2025-10-03 11:14:29', 77),
(1444, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-03 11:20:37', 77),
(1445, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-03 11:21:01', 99),
(1446, 'User Logged in', 'LOGIN', '2025-10-03 11:30:59', 77),
(1447, 'Venue Request submitted', 'Reservation Request', '2025-10-03 11:31:12', 77),
(1448, 'User Logged in', 'LOGIN', '2025-10-03 21:25:38', 96),
(1449, 'Venue Request submitted', 'Reservation Request', '2025-10-03 21:26:00', 96),
(1450, 'User Logged in', 'LOGIN', '2025-10-03 21:26:15', 77),
(1451, 'Venue Request submitted', 'Reservation Request', '2025-10-03 21:27:18', 96),
(1452, 'User Logged in', 'LOGIN', '2025-10-03 21:29:48', 99),
(1453, 'User Logged out', 'LOGOUT', '2025-10-03 21:54:37', 99),
(1454, 'User Logged in', 'LOGIN', '2025-10-03 21:54:46', 77),
(1455, 'Venue Request submitted', 'Reservation Request', '2025-10-03 21:55:27', 77),
(1456, 'User Logged out', 'LOGOUT', '2025-10-03 22:09:43', 99),
(1457, 'User Logged in', 'LOGIN', '2025-10-03 23:19:54', 77),
(1458, 'User Logged out', 'LOGOUT', '2025-10-03 23:54:13', 96),
(1459, 'User Logged in', 'LOGIN', '2025-10-03 23:56:53', 99),
(1460, 'User Logged in', 'LOGIN', '2025-10-04 01:19:53', 77),
(1461, 'Venue Request submitted', 'Reservation Request', '2025-10-04 01:20:21', 77),
(1462, 'Venue Request submitted', 'Reservation Request', '2025-10-04 01:21:01', 77),
(1463, 'User Logged out', 'LOGOUT', '2025-10-04 01:27:51', 99),
(1464, 'User Logged in', 'LOGIN', '2025-10-04 01:28:14', 99),
(1465, 'User Logged in', 'LOGIN', '2025-10-04 01:42:58', 99),
(1466, 'User Logged in', 'LOGIN', '2025-10-04 02:03:50', 77),
(1467, 'Venue Request submitted', 'Reservation Request', '2025-10-04 02:04:08', 77),
(1468, 'User Logged out', 'LOGOUT', '2025-10-04 02:04:35', 77),
(1469, 'User Logged in', 'LOGIN', '2025-10-04 02:04:47', 114),
(1470, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-04 02:05:02', 114),
(1471, 'User Logged out', 'LOGOUT', '2025-10-04 02:07:06', 114),
(1472, 'User Logged in', 'LOGIN', '2025-10-04 02:07:14', 77),
(1473, 'Venue Request submitted', 'Reservation Request', '2025-10-04 02:07:34', 77),
(1474, 'Venue Request submitted', 'Reservation Request', '2025-10-04 02:09:16', 77),
(1475, 'Venue Request submitted', 'Reservation Request', '2025-10-04 02:12:34', 77),
(1476, 'Venue Request submitted', 'Reservation Request', '2025-10-04 02:15:55', 77),
(1477, 'Venue Request submitted', 'Reservation Request', '2025-10-04 02:18:02', 77),
(1478, 'User Logged in', 'LOGIN', '2025-10-04 15:53:21', 99),
(1479, 'User Logged in', 'LOGIN', '2025-10-04 18:53:55', 114),
(1480, 'User Logged out', 'LOGOUT', '2025-10-04 18:56:45', 99),
(1481, 'User Logged in', 'LOGIN', '2025-10-04 18:57:01', 77),
(1482, 'Vehicle Request submitted', 'Reservation Request', '2025-10-04 18:57:41', 77),
(1483, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-04 19:27:53', 114),
(1484, 'User Logged in', 'LOGIN', '2025-10-04 23:05:54', 114),
(1485, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-04 23:09:46', 114),
(1486, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-04 23:35:06', 99),
(1487, 'Venue Request submitted', 'Reservation Request', '2025-10-04 23:42:21', 77),
(1488, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-04 23:42:49', 114),
(1489, 'Reservation \'asd\' declined by Jeniffer B Tuan', 'DECLINE', '2025-10-04 23:43:01', 99),
(1490, 'Venue Request submitted', 'Reservation Request', '2025-10-04 23:43:33', 77),
(1491, 'Vehicle Request submitted', 'Reservation Request', '2025-10-04 23:43:56', 77),
(1492, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-04 23:44:26', 114),
(1493, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-04 23:47:44', 99),
(1494, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-04 23:47:54', 114),
(1495, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-04 23:47:59', 99),
(1496, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-04 23:48:13', 114),
(1497, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-04 23:48:17', 114),
(1498, 'User Logged out', 'LOGOUT', '2025-10-04 23:48:31', 77),
(1499, 'User Logged in', 'LOGIN', '2025-10-04 23:49:00', 78),
(1500, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-04 23:49:33', 78),
(1501, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-10-04 23:49:33', 78),
(1502, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-04 23:49:39', 78),
(1503, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-04 23:49:39', 78),
(1504, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-04 23:49:41', 78),
(1505, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-04 23:49:43', 78),
(1506, 'Vehicle L300 (200000222) returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-04 23:49:52', 78),
(1507, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-04 23:49:55', 78),
(1508, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-04 23:49:59', 78),
(1509, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-04 23:50:02', 78),
(1510, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-04 23:50:02', 78),
(1511, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-04 23:50:05', 78),
(1512, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-04 23:50:07', 78),
(1513, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-04 23:50:11', 78),
(1514, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-04 23:50:12', 78),
(1515, 'Equipment Unit (Big Sound System - SN: BSS-001) availability set to Unavailable by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-04 23:50:35', 114),
(1516, 'Venue (Auditorium) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-04 23:50:37', 114),
(1517, 'Equipment Unit (Big Sound System - SN: BSS-002) availability set to Unavailable by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-04 23:50:39', 114),
(1518, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-04 23:51:11', 114),
(1519, 'User Logged out', 'LOGOUT', '2025-10-04 23:53:45', 78),
(1520, 'User Logged out', 'LOGOUT', '2025-10-04 23:53:50', 99),
(1521, 'User Logged in', 'LOGIN', '2025-10-05 00:17:18', 99),
(1522, 'User Logged in', 'LOGIN', '2025-10-05 00:17:56', 82),
(1523, 'Vehicle Request submitted', 'Reservation Request', '2025-10-05 00:18:36', 82),
(1524, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-05 00:18:56', 114),
(1525, 'Equipment Request submitted', 'Reservation Request', '2025-10-05 00:23:23', 82),
(1526, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-05 00:23:36', 114),
(1527, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-05 00:23:46', 114),
(1528, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-05 00:23:53', 99),
(1529, 'Added Checklist to equipment Paper: No. Checklist (1) by: Jeniffer B. Tuan', 'ADD CHECKLIST', '2025-10-05 00:24:10', 99),
(1530, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-05 00:24:23', 99),
(1531, 'User Logged out', 'LOGOUT', '2025-10-05 00:24:28', 82),
(1532, 'User Logged in', 'LOGIN', '2025-10-05 00:24:39', 78),
(1533, 'Equipment Paper released by: Virjillo Datario', 'RELEASE', '2025-10-05 00:25:00', 78),
(1534, 'Virjillo Datario checked (if complete)', 'CHECK', '2025-10-05 00:25:04', 78),
(1535, 'Equipment Paper returned by: Virjillo Datario - condition: Damage (good: 10, bad: 10)', 'RETURN', '2025-10-05 00:39:16', 78),
(1536, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-05 00:39:17', 78),
(1537, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-05 00:39:39', 99),
(1538, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-05 01:29:30', 78),
(1539, 'User Logged out', 'LOGOUT', '2025-10-05 01:32:30', 78),
(1540, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-05 01:45:45', 114),
(1541, 'User Logged out', 'LOGOUT', '2025-10-05 01:50:14', 99),
(1542, 'User Logged in', 'LOGIN', '2025-10-05 13:14:44', 99),
(1543, 'User Logged in', 'LOGIN', '2025-10-05 13:16:31', 117),
(1544, 'Venue Request submitted', 'Reservation Request', '2025-10-05 13:16:48', 117),
(1545, 'User Logged out', 'LOGOUT', '2025-10-05 13:18:00', 117),
(1546, 'User Logged in', 'LOGIN', '2025-10-05 13:18:12', 86),
(1547, 'Venue Request submitted', 'Reservation Request', '2025-10-05 13:18:31', 86),
(1548, 'User Logged out', 'LOGOUT', '2025-10-05 13:31:12', 86),
(1549, 'User Logged in', 'LOGIN', '2025-10-05 13:31:22', 117),
(1550, 'Venue Request submitted', 'Reservation Request', '2025-10-05 13:31:37', 117),
(1551, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-05 14:32:10', 117),
(1552, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-05 19:37:05', 99),
(1553, 'User Logged in', 'LOGIN', '2025-10-05 19:41:56', 82),
(1554, 'User Logged out', 'LOGOUT', '2025-10-05 19:47:40', 82),
(1555, 'User Logged in', 'LOGIN', '2025-10-05 19:52:46', 82),
(1556, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-05 19:53:37', 99),
(1557, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-05 19:53:43', 99),
(1558, 'User Logged in', 'LOGIN', '2025-10-05 19:54:04', 78),
(1559, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-05 19:55:06', 78),
(1560, 'Virjillo Datario checked (asd)', 'CHECK', '2025-10-05 19:55:08', 78),
(1561, 'Vehicle L300 (200000222) returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-05 19:55:13', 78),
(1562, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-05 19:55:14', 78),
(1563, 'User Logged out', 'LOGOUT', '2025-10-05 19:55:18', 78),
(1564, 'User Logged in', 'LOGIN', '2025-10-05 19:55:29', 82),
(1565, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-10-05 20:27:44', 82),
(1566, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-10-05 20:28:02', 82),
(1567, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-10-05 20:28:53', 82),
(1568, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-10-05 20:29:15', 82),
(1569, 'User Logged out', 'LOGOUT', '2025-10-06 00:15:31', 82),
(1570, 'User Logged in', 'LOGIN', '2025-10-06 00:15:45', 114),
(1571, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:16:51', 82),
(1572, 'User Logged out', 'LOGOUT', '2025-10-06 00:17:01', 82),
(1573, 'User Logged in', 'LOGIN', '2025-10-06 00:17:13', 77),
(1574, 'User: Gian Legaspi has been updated. Changes: user level: 16 -> 17', 'UPDATE USER', '2025-10-06 00:19:36', NULL),
(1575, 'User Logged out', 'LOGOUT', '2025-10-06 00:19:45', 77),
(1576, 'User Logged in', 'LOGIN', '2025-10-06 00:19:53', 111),
(1577, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:20:20', 111),
(1578, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:20:44', 111),
(1579, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:21:01', 111),
(1580, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:23:17', 111),
(1581, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:25:28', 111),
(1582, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:28:42', 111),
(1583, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:31:06', 111),
(1584, 'User Logged out', 'LOGOUT', '2025-10-06 00:31:36', 111),
(1585, 'User Logged in', 'LOGIN', '2025-10-06 00:31:47', 77),
(1586, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:32:15', 77),
(1587, 'Updated Venue: BED Lobby', 'UPDATE VENUE', '2025-10-06 00:34:15', 99),
(1588, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:34:50', 77),
(1589, 'Venue Request submitted', 'Reservation Request', '2025-10-06 00:36:32', 77),
(1590, 'Marked notifications as read (count: 11)', 'READ NOTIFICATION', '2025-10-06 02:05:43', 99),
(1591, 'User Logged out', 'LOGOUT', '2025-10-06 02:06:39', 99),
(1592, 'User Logged out', 'LOGOUT', '2025-10-06 18:53:50', 77),
(1593, 'User Logged in', 'LOGIN', '2025-10-06 18:54:02', 99),
(1594, 'Created Venue :    ', 'CREATE', '2025-10-06 18:54:40', 99),
(1595, 'Created Vehicle :    ', 'CREATE', '2025-10-06 18:55:38', 99),
(1596, 'Updated Vehicle: \'   \' -> \'092--2\'', 'UPDATE VEHICLE', '2025-10-06 19:02:22', 99),
(1597, 'User: sample S. sample has been updated. Changes: title: null -> 6', 'UPDATE USER', '2025-10-06 19:05:53', NULL),
(1598, 'User: sample S. sample has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-06 19:06:00', NULL),
(1599, 'Updated Holiday: \'Christmas Day\' on \'2025-12-25\' -> \'   \' on \'2025-12-25\'', 'UPDATE', '2025-10-06 19:17:08', 99),
(1600, 'Updated Holiday: \'   \' on \'2025-12-25\' -> \'Christmas Day\' on \'2025-12-25\'', 'UPDATE', '2025-10-06 19:17:16', 99),
(1601, 'Profile updated for: Jeniffer B. Tuan', 'UPDATE PROFILE', '2025-10-06 19:40:55', 99),
(1602, 'Profile updated for: Jeniffer B. Tuan', 'UPDATE PROFILE', '2025-10-06 19:41:43', 99),
(1603, 'User Logged in', 'LOGIN', '2025-10-06 19:42:27', 77),
(1604, 'User Logged out', 'LOGOUT', '2025-10-06 20:13:13', 111),
(1605, 'User Logged in', 'LOGIN', '2025-10-06 20:13:28', 114),
(1606, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-06 20:13:53', 114),
(1607, 'Updated Venue: MS LOBBY', 'UPDATE VENUE', '2025-10-06 20:14:16', 99),
(1608, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-06 20:14:32', 99),
(1609, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-06 20:34:40', 114),
(1610, 'Reschedule request accepted for reservation ID 716', 'RESCHEDULE_ACCEPTED', '2025-10-06 20:37:18', 99),
(1611, 'Marked notifications as read (count: 31)', 'READ NOTIFICATION', '2025-10-06 20:39:50', 77),
(1612, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-06 20:56:40', 114),
(1613, 'Profile updated for: Jeniffer B. Tuan', 'UPDATE PROFILE', '2025-10-06 23:33:35', 99),
(1614, 'Profile updated for: Jeniffer B. Tuan', 'UPDATE PROFILE', '2025-10-06 23:35:46', 99),
(1615, 'User Logged out', 'LOGOUT', '2025-10-06 23:36:14', 99),
(1616, 'User Logged in', 'LOGIN', '2025-10-06 23:36:22', 99),
(1617, 'Profile updated for: Jeniffer B. Tuan', 'UPDATE PROFILE', '2025-10-06 23:36:30', 99),
(1618, 'Profile updated for: Jeniffer B. Tuan (Changes: Title: \'1\' -> \'\')', 'UPDATE PROFILE', '2025-10-06 23:37:59', 99),
(1619, 'Venue Request submitted', 'Reservation Request', '2025-10-07 08:57:40', 77),
(1620, 'Venue Request submitted', 'Reservation Request', '2025-10-07 08:59:29', 77),
(1621, 'Venue Request submitted', 'Reservation Request', '2025-10-07 09:02:44', 77),
(1622, 'Venue Request submitted', 'Reservation Request', '2025-10-07 09:05:55', 77),
(1623, 'Venue Request submitted', 'Reservation Request', '2025-10-07 09:12:45', 77),
(1624, 'Venue Request submitted', 'Reservation Request', '2025-10-07 09:18:06', 77),
(1625, 'Venue Request submitted', 'Reservation Request', '2025-10-07 09:18:49', 77),
(1626, 'User Logged out', 'LOGOUT', '2025-10-07 09:49:30', 99),
(1627, 'User Logged in', 'LOGIN', '2025-10-07 09:49:42', 99),
(1628, 'User Logged in', 'LOGIN', '2025-10-07 10:01:31', 99),
(1629, 'User Logged out', 'LOGOUT', '2025-10-07 10:57:49', 99),
(1630, 'User Logged in', 'LOGIN', '2025-10-07 10:57:58', 99),
(1631, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'Test message from API test\'', 'SEND MESSAGE', '2025-10-07 11:01:30', 42),
(1632, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'hello\'', 'SEND MESSAGE', '2025-10-07 11:05:47', 99),
(1633, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'Test message from API test\'', 'SEND MESSAGE', '2025-10-07 11:16:08', 42),
(1634, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'*****\'', 'SEND MESSAGE', '2025-10-07 12:10:33', 99),
(1635, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'yawa\'', 'SEND MESSAGE', '2025-10-07 12:57:10', 99),
(1636, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'what the ****\'', 'SEND MESSAGE', '2025-10-07 12:57:54', 99),
(1637, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'**** ka ****\'', 'SEND MESSAGE', '2025-10-07 13:00:01', 99),
(1638, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'*****\'', 'SEND MESSAGE', '2025-10-07 13:00:08', 99),
(1639, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'p@kyu\'', 'SEND MESSAGE', '2025-10-07 13:00:11', 99),
(1640, 'User Logged in', 'LOGIN', '2025-10-07 13:17:58', 42),
(1641, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'ha\'', 'SEND MESSAGE', '2025-10-07 13:18:12', 42),
(1642, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'hatdog\'', 'SEND MESSAGE', '2025-10-07 13:18:21', 99),
(1643, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-07 14:07:54', 99),
(1644, 'User Logged in', 'LOGIN', '2025-10-07 14:35:30', 77),
(1645, 'User Logged out', 'LOGOUT', '2025-10-07 14:48:36', 99),
(1646, 'User Logged in', 'LOGIN', '2025-10-07 14:48:52', 77),
(1647, 'User Darwin M. Galudo sent a message to Christian Mark S. Valle: \'hello\'', 'SEND MESSAGE', '2025-10-07 15:39:34', 77),
(1648, 'User Logged in', 'LOGIN', '2025-10-07 19:59:59', 42),
(1649, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'meow\'', 'SEND MESSAGE', '2025-10-07 20:00:09', 42),
(1650, 'Marked notifications as read (count: 30)', 'READ NOTIFICATION', '2025-10-07 20:55:48', 42),
(1651, 'User Logged in', 'LOGIN', '2025-10-07 20:58:10', 114),
(1652, 'User Logged out', 'LOGOUT', '2025-10-07 20:59:10', 114),
(1653, 'User Logged in', 'LOGIN', '2025-10-07 20:59:19', 77),
(1654, 'Vehicle Request submitted', 'Reservation Request', '2025-10-07 20:59:46', 77),
(1655, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-07 21:00:14', 114),
(1656, 'User Logged out', 'LOGOUT', '2025-10-07 21:00:37', 42),
(1657, 'User Logged in', 'LOGIN', '2025-10-07 21:00:47', 99),
(1658, 'User Logged in', 'LOGIN', '2025-10-08 08:41:54', 77),
(1659, 'User: Fatima A. Vergel has been created', 'CREATE USER', '2025-10-08 08:44:35', NULL),
(1660, 'User: Crestal T. Panhay has been created', 'CREATE USER', '2025-10-08 08:45:18', NULL),
(1662, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-08 08:52:38', NULL),
(1663, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-08 08:53:13', NULL),
(1664, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-08 08:53:28', NULL),
(1665, 'Vehicle Request submitted', 'Reservation Request', '2025-10-08 11:56:07', 77),
(1666, 'User Logged out', 'LOGOUT', '2025-10-08 12:27:06', 77),
(1667, 'User Logged in', 'LOGIN', '2025-10-08 12:27:41', 114),
(1668, 'Reservation \'ad\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-08 12:28:07', 114),
(1669, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-08 12:28:28', 99),
(1670, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-08 15:11:32', 114),
(1671, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'meow\'', 'SEND MESSAGE', '2025-10-08 21:23:23', 99),
(1672, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-10-08 21:24:33', 99),
(1673, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-08 22:55:37', 99),
(1674, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-08 23:08:01', 99),
(1675, 'Vehicle (11) availability set to Available by: Jeniffer B. Tuan', 'UPDATE AVAILABILITY', '2025-10-08 23:08:11', 99),
(1676, 'User Logged in', 'LOGIN', '2025-10-08 23:15:09', 77),
(1677, 'Venue Request submitted', 'Reservation Request', '2025-10-08 23:15:31', 77),
(1678, 'User Logged out', 'LOGOUT', '2025-10-08 23:18:21', 77),
(1679, 'User Logged in', 'LOGIN', '2025-10-08 23:18:31', 114),
(1680, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-08 23:28:19', 114),
(1681, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-08 23:32:05', 114),
(1682, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-08 23:32:14', 114),
(1683, 'Venue Request submitted', 'Reservation Request', '2025-10-08 23:44:17', 77),
(1684, 'Marked notifications as read (count: 28)', 'READ NOTIFICATION', '2025-10-08 23:45:00', 114),
(1685, 'User Logged out', 'LOGOUT', '2025-10-09 00:19:20', 99),
(1686, 'User Logged in', 'LOGIN', '2025-10-09 00:19:30', 114),
(1687, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 00:20:29', 114),
(1688, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 00:25:49', 114),
(1689, 'Venue Request submitted', 'Reservation Request', '2025-10-09 00:27:48', 77),
(1690, 'User Logged out', 'LOGOUT', '2025-10-09 00:28:16', 114),
(1691, 'User Logged in', 'LOGIN', '2025-10-09 00:28:23', 99),
(1692, 'User Logged out', 'LOGOUT', '2025-10-09 00:33:55', 77),
(1693, 'User Logged in', 'LOGIN', '2025-10-09 00:34:05', 96),
(1694, 'Venue Request submitted', 'Reservation Request', '2025-10-09 00:34:46', 96),
(1695, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 00:37:23', 114),
(1696, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 00:57:16', 114),
(1697, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 01:01:32', 114),
(1698, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-09 01:01:48', 114),
(1699, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-09 01:01:54', 114),
(1700, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 01:02:32', 114),
(1701, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 01:04:10', 114),
(1702, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-09 01:07:51', 114),
(1703, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 01:08:08', 99),
(1704, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 08:54:44', 99),
(1705, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 08:57:46', 99),
(1706, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 09:03:14', 99),
(1707, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 09:03:53', 99),
(1708, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 09:31:04', 99),
(1709, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 09:32:32', 99),
(1710, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 09:34:09', 99),
(1711, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-09 09:36:10', 99),
(1712, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-09 09:36:15', NULL),
(1713, 'User Jeniffer B. Tuan sent a message to Rusty C. Pisco: \'hello sir good morning\'', 'SEND MESSAGE', '2025-10-09 09:54:23', 99),
(1714, 'User Jeniffer B. Tuan sent a message to Rusty C. Pisco: \'i would like to reserve something\'', 'SEND MESSAGE', '2025-10-09 09:54:29', 99),
(1715, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-09 17:43:59', 99),
(1716, 'User Logged out', 'LOGOUT', '2025-10-09 19:46:46', 99),
(1717, 'User Logged in', 'LOGIN', '2025-10-09 21:20:33', 42),
(1718, 'Profile updated for: Christian Mark S. Valle (Changes: Title: \'6\' -> \'\')', 'UPDATE PROFILE', '2025-10-09 21:21:08', 42),
(1719, 'Profile updated for: Christian Mark S. Valle (Changes: Suffix: \'II\' -> \'\')', 'UPDATE PROFILE', '2025-10-09 21:21:16', 42),
(1720, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-10 10:42:31', 42),
(1721, 'User Logged in', 'LOGIN', '2025-10-10 10:54:37', 111),
(1722, 'Venue Request submitted', 'Reservation Request', '2025-10-10 10:54:53', 111),
(1723, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-10 10:55:29', 42),
(1724, 'User Logged out', 'LOGOUT', '2025-10-10 10:55:30', 42),
(1725, 'User Logged in', 'LOGIN', '2025-10-10 10:55:49', 114),
(1726, 'Marked notifications as read (count: 36)', 'READ NOTIFICATION', '2025-10-10 10:56:09', 111),
(1727, 'User Logged out', 'LOGOUT', '2025-10-10 10:56:11', 111),
(1728, 'User Logged in', 'LOGIN', '2025-10-10 10:56:24', 77),
(1729, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-10 10:56:28', 77),
(1730, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 10:56:35', 114),
(1731, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 11:00:46', 114),
(1732, 'User Logged out', 'LOGOUT', '2025-10-10 11:00:55', 77),
(1733, 'User Logged in', 'LOGIN', '2025-10-10 11:01:06', 114),
(1734, 'User Logged out', 'LOGOUT', '2025-10-10 11:01:18', 114),
(1735, 'User Logged in', 'LOGIN', '2025-10-10 11:01:26', 99),
(1736, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 11:01:37', 99),
(1737, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 11:03:03', 114),
(1738, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 11:03:12', 99),
(1739, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 11:04:06', 99),
(1740, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 11:04:34', 114),
(1741, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 11:04:43', 99),
(1742, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-10 11:05:29', 99),
(1743, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-10 11:05:38', 99),
(1744, 'User Logged out', 'LOGOUT', '2025-10-10 11:05:55', 99),
(1745, 'User Logged in', 'LOGIN', '2025-10-10 11:06:04', 77),
(1746, 'Marked notifications as read (count: 35)', 'READ NOTIFICATION', '2025-10-10 11:06:07', 77),
(1747, 'User Logged out', 'LOGOUT', '2025-10-10 11:22:45', 77),
(1748, 'User Logged in', 'LOGIN', '2025-10-10 11:22:55', 99),
(1749, 'Venue Request submitted', 'Reservation Request', '2025-10-10 11:23:20', 96),
(1750, 'User Logged out', 'LOGOUT', '2025-10-10 11:57:30', 114),
(1751, 'User Logged in', 'LOGIN', '2025-10-10 11:57:44', 114),
(1752, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 12:05:19', 114),
(1753, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 12:09:15', 114),
(1754, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 12:10:09', 99),
(1755, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 12:13:39', 114),
(1756, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 12:15:46', 114),
(1757, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 12:23:10', 114),
(1758, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 12:23:23', 99),
(1759, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-10 12:23:30', 99),
(1760, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-10 12:26:52', 114),
(1761, 'User Rusty C. Pisco sent a message to Jeniffer B. Tuan: \'ok\'', 'SEND MESSAGE', '2025-10-10 12:30:58', 114),
(1762, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-10 12:36:58', 99),
(1763, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-10 12:53:50', NULL),
(1764, 'Venue Request submitted', 'Reservation Request', '2025-10-10 13:11:12', 96),
(1765, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 13:11:27', 114),
(1766, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 13:11:33', 99),
(1767, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-10 13:11:37', NULL),
(1768, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'chat\'', 'SEND MESSAGE', '2025-10-10 13:20:49', 99),
(1769, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-10 13:23:54', 99),
(1770, 'Venue Request submitted', 'Reservation Request', '2025-10-10 14:01:12', 96),
(1771, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 14:58:48', 114),
(1772, 'Venue Request submitted', 'Reservation Request', '2025-10-10 15:01:49', 96),
(1773, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 15:02:03', 114),
(1774, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 15:03:57', 114),
(1775, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 15:05:10', 99),
(1776, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 15:07:06', 114),
(1777, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 15:07:34', 99),
(1778, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-10 15:08:16', 114),
(1779, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-10 15:09:30', 99),
(1780, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 15:15:23', 114),
(1781, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 15:15:29', 99),
(1782, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-10 15:19:50', 114),
(1783, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 18:37:33', 114),
(1784, 'Marked notifications as read (count: 38)', 'READ NOTIFICATION', '2025-10-10 19:09:54', 96),
(1785, 'User Logged out', 'LOGOUT', '2025-10-10 19:09:56', 96),
(1786, 'User Logged in', 'LOGIN', '2025-10-10 19:10:06', 77),
(1787, 'Venue Request submitted', 'Reservation Request', '2025-10-10 19:10:20', 77),
(1788, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 19:10:40', 114),
(1789, 'User Logged out', 'LOGOUT', '2025-10-10 19:11:11', 77),
(1790, 'User Logged in', 'LOGIN', '2025-10-10 19:11:18', 96),
(1791, 'User Logged out', 'LOGOUT', '2025-10-10 19:19:42', 96),
(1792, 'User Logged in', 'LOGIN', '2025-10-10 19:19:53', 72),
(1793, 'User Logged out', 'LOGOUT', '2025-10-10 19:20:15', 72),
(1794, 'User Logged in', 'LOGIN', '2025-10-10 19:20:27', 96),
(1795, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 19:23:22', 99),
(1796, 'Venue Request submitted', 'Reservation Request', '2025-10-10 19:41:49', 96),
(1797, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 19:42:22', 114),
(1798, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 19:42:33', 99),
(1799, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-10 19:43:42', 96),
(1800, 'User Logged out', 'LOGOUT', '2025-10-10 19:44:04', 96),
(1801, 'User Logged in', 'LOGIN', '2025-10-10 19:44:13', 77),
(1802, 'Venue Request submitted', 'Reservation Request', '2025-10-10 19:44:25', 77),
(1803, 'User Logged out', 'LOGOUT', '2025-10-10 19:44:29', 77),
(1804, 'User Logged in', 'LOGIN', '2025-10-10 19:44:35', 96),
(1805, 'Venue Request submitted', 'Reservation Request', '2025-10-10 19:44:53', 96),
(1806, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 19:45:32', 114),
(1807, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 19:59:06', 99),
(1808, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 20:01:25', 99),
(1809, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 20:08:23', 99),
(1810, 'User Logged out', 'LOGOUT', '2025-10-10 20:09:01', 96),
(1811, 'User Logged in', 'LOGIN', '2025-10-10 20:09:09', 77),
(1812, 'Reschedule request accepted for reservation ID 740', 'RESCHEDULE_ACCEPTED', '2025-10-10 20:10:39', 114),
(1813, 'Reschedule request accepted for reservation ID 740', 'RESCHEDULE_ACCEPTED', '2025-10-10 20:12:03', 114),
(1814, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:14:55', 114),
(1815, 'Reschedule request accepted for reservation ID 740', 'RESCHEDULE_ACCEPTED', '2025-10-10 20:16:28', 114),
(1816, 'Reschedule request accepted for reservation ID 740', 'RESCHEDULE_ACCEPTED', '2025-10-10 20:19:05', 114),
(1817, 'Reschedule request accepted for reservation ID 740', 'RESCHEDULE_ACCEPTED', '2025-10-10 20:21:40', 114),
(1818, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:23:47', 114),
(1819, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:30:21', 114),
(1820, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:33:00', 114),
(1821, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:36:40', 114),
(1822, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:43:23', 114),
(1823, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-10 20:52:13', 114),
(1824, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-10 20:57:23', 99),
(1825, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-10 20:57:28', NULL),
(1826, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-10 20:57:37', NULL),
(1827, 'Venue Request submitted', 'Reservation Request', '2025-10-10 21:58:09', 77),
(1828, 'Venue Request submitted', 'Reservation Request', '2025-10-10 21:58:53', 77),
(1829, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-10 22:00:02', 114),
(1830, 'Updated Venue: QUADRANGLE', 'UPDATE VENUE', '2025-10-10 22:00:07', 114),
(1831, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-10-11 01:36:23', 99),
(1832, 'Venue Request submitted', 'Reservation Request', '2025-10-11 01:54:24', 77),
(1833, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 01:56:49', 114),
(1834, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-11 01:57:00', 99),
(1835, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-11 01:57:04', NULL),
(1836, 'User Logged out', 'LOGOUT', '2025-10-11 02:15:16', 77),
(1837, 'User Logged in', 'LOGIN', '2025-10-11 02:15:28', 111),
(1838, 'Venue Request submitted', 'Reservation Request', '2025-10-11 02:15:52', 111),
(1839, 'Venue Request submitted', 'Reservation Request', '2025-10-11 02:18:20', 111),
(1840, 'Venue Request submitted', 'Reservation Request', '2025-10-11 02:20:56', 111),
(1841, 'Venue Request submitted', 'Reservation Request', '2025-10-11 02:24:48', 111),
(1842, 'Venue Request submitted', 'Reservation Request', '2025-10-11 02:25:57', 111),
(1843, 'Venue Request submitted', 'Reservation Request', '2025-10-11 02:27:02', 111),
(1844, 'User Logged in', 'LOGIN', '2025-10-11 12:42:48', 99),
(1845, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-11 12:42:52', 99),
(1846, 'User Logged out', 'LOGOUT', '2025-10-11 12:45:17', 111),
(1847, 'User Logged in', 'LOGIN', '2025-10-11 12:45:29', 77),
(1848, 'Venue Request submitted', 'Reservation Request', '2025-10-11 12:45:42', 77),
(1849, 'User Logged out', 'LOGOUT', '2025-10-11 12:53:01', 114),
(1850, 'User Logged in', 'LOGIN', '2025-10-11 12:53:14', 114),
(1851, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-11 13:07:46', NULL),
(1852, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-11 13:11:04', NULL),
(1853, 'User Logged out', 'LOGOUT', '2025-10-11 15:01:13', 114),
(1854, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-11 15:04:48', 99),
(1855, 'User Logged in', 'LOGIN', '2025-10-11 15:05:07', 114),
(1856, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 15:06:59', 114),
(1857, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 15:08:23', 114),
(1858, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-11 15:08:42', 99),
(1859, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-11 15:08:49', 99),
(1860, 'Updated Venue: PHINMA HALL', 'UPDATE VENUE', '2025-10-11 15:11:23', 114),
(1861, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-11 15:12:54', 99),
(1862, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-11 15:13:04', NULL),
(1863, 'Reschedule request accepted for reservation ID 751', 'RESCHEDULE_ACCEPTED', '2025-10-11 15:44:40', 99),
(1864, 'Marked notifications as read (count: 16)', 'READ NOTIFICATION', '2025-10-11 15:49:12', 114),
(1865, 'Venue Request submitted', 'Reservation Request', '2025-10-11 15:49:35', 77),
(1866, 'Venue Request submitted', 'Reservation Request', '2025-10-11 15:50:33', 77),
(1867, 'User Logged out', 'LOGOUT', '2025-10-11 15:52:01', 99),
(1868, 'User Logged in', 'LOGIN', '2025-10-11 15:52:10', 96),
(1869, 'Venue Request submitted', 'Reservation Request', '2025-10-11 15:52:25', 96),
(1870, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-11 18:06:35', 114),
(1871, 'Equipment (big screen) has new Serial Number: bs-0001', 'CREATE UNIT', '2025-10-11 18:26:23', 114),
(1872, 'Updated Equipment: big screen', 'UPDATE', '2025-10-11 18:26:57', 114),
(1873, 'Updated Equipment: big screen', 'UPDATE', '2025-10-11 18:27:03', 114),
(1874, 'Reservation Report (September 2025) generated: no records found', 'GENERATE REPORT', '2025-10-11 18:34:23', NULL),
(1875, 'User Logged in', 'LOGIN', '2025-10-11 18:35:02', 99),
(1876, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-11 18:35:45', 99),
(1877, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-10-11 18:36:09', 99),
(1878, 'Venue Request submitted', 'Reservation Request', '2025-10-11 18:36:52', 77),
(1879, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-11 18:37:15', 99),
(1880, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-10-11 18:38:01', 99),
(1881, 'Venue Request submitted', 'Reservation Request', '2025-10-11 18:39:10', 77),
(1882, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-11 18:40:23', 114),
(1883, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-11 18:40:45', 99),
(1884, 'User Logged out', 'LOGOUT', '2025-10-11 18:41:52', 77),
(1885, 'User Logged in', 'LOGIN', '2025-10-11 18:42:03', 81),
(1886, 'Reservation \'asd\' approved by Gail D Norway', 'APPROVE', '2025-10-11 18:42:07', 81),
(1887, 'User Logged out', 'LOGOUT', '2025-10-11 18:42:17', 81),
(1888, 'User: Gerry J. Cano has been updated. Changes: password: changed', 'UPDATE USER', '2025-10-11 18:43:08', NULL),
(1889, 'User Logged in', 'LOGIN', '2025-10-11 18:43:14', 82),
(1890, 'User Logged out', 'LOGOUT', '2025-10-11 18:43:44', 82),
(1891, 'User Logged in', 'LOGIN', '2025-10-11 18:43:53', 83),
(1892, 'Reservation \'asd\' approved by Rizhaly B Maandig', 'APPROVE', '2025-10-11 18:43:57', 83),
(1893, 'User Logged out', 'LOGOUT', '2025-10-11 18:43:59', 83),
(1894, 'User Logged in', 'LOGIN', '2025-10-11 18:44:08', 84),
(1895, 'Reservation \'asd\' approved by Jonathan  Reyes', 'APPROVE', '2025-10-11 18:44:11', 84),
(1896, 'User Logged out', 'LOGOUT', '2025-10-11 18:44:13', 84),
(1897, 'User Logged in', 'LOGIN', '2025-10-11 18:44:21', 85),
(1898, 'Reservation \'asd\' approved by Clyde  F Gamolo', 'APPROVE', '2025-10-11 18:44:23', 85),
(1899, 'User Logged out', 'LOGOUT', '2025-10-11 18:44:25', 85),
(1900, 'User: Gail D. Norway has been updated. Changes: department: 39 -> 30', 'UPDATE USER', '2025-10-11 18:45:55', NULL),
(1901, 'User Logged in', 'LOGIN', '2025-10-11 18:46:19', 81),
(1902, 'Reservation \'asd\' approved by Gail D Norway', 'APPROVE', '2025-10-11 18:46:21', 81),
(1903, 'Reservation Report (October 2025) generated: 2 record(s) found by: Jeniffer B. Tuan', 'GENERATE REPORT', '2025-10-11 18:47:21', 99),
(1904, 'User Logged out', 'LOGOUT', '2025-10-11 18:48:32', 81),
(1905, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 18:49:19', 114),
(1906, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-11 18:49:24', 99),
(1907, 'Added Checklist to venue MW 707: No. Checklist (1) by: Jeniffer B. Tuan', 'ADD CHECKLIST', '2025-10-11 18:49:50', 99),
(1908, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-11 18:50:25', 99),
(1909, 'User Logged in', 'LOGIN', '2025-10-11 18:50:29', 83),
(1910, 'Vehicle Request submitted', 'Reservation Request', '2025-10-11 18:51:16', 83),
(1911, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 18:54:05', 114),
(1912, 'User Logged out', 'LOGOUT', '2025-10-11 18:55:53', 83),
(1913, 'User Logged in', 'LOGIN', '2025-10-11 18:56:03', 111),
(1914, 'Marked notifications as read (count: 31)', 'READ NOTIFICATION', '2025-10-11 18:56:12', 111),
(1915, 'User Logged out', 'LOGOUT', '2025-10-11 18:56:14', 111),
(1916, 'User Logged in', 'LOGIN', '2025-10-11 18:56:38', 77),
(1917, 'Venue Request submitted', 'Reservation Request', '2025-10-11 18:56:51', 77),
(1918, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-11 19:04:34', NULL),
(1919, 'Venue Request submitted', 'Reservation Request', '2025-10-11 19:05:37', 77),
(1920, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 19:10:05', 114),
(1921, 'User Logged in', 'LOGIN', '2025-10-11 19:10:24', 114),
(1922, 'User Logged out', 'LOGOUT', '2025-10-11 19:10:38', 114),
(1923, 'User Logged in', 'LOGIN', '2025-10-11 19:10:48', 99),
(1924, 'Venue Request submitted', 'Reservation Request', '2025-10-11 19:14:28', 77),
(1925, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-11 19:37:58', 114),
(1926, 'Vehicle Request submitted', 'Reservation Request', '2025-10-11 20:38:59', 77),
(1927, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 21:28:51', 114),
(1928, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 21:46:42', 114),
(1929, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 21:51:38', 114),
(1930, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 21:53:01', 114),
(1931, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 21:57:04', 114),
(1932, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 22:02:14', 114),
(1933, 'Reservation \'sad\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 22:05:29', 114),
(1934, 'User Logged in', 'LOGIN', '2025-10-11 22:06:00', 99),
(1935, 'Reservation \'sad\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-11 22:10:04', 99),
(1936, 'Added Checklist to vehicle Isuzu  Corollass (2002asda): No. Checklist (1) by: Jeniffer B. Tuan', 'ADD CHECKLIST', '2025-10-11 22:10:17', 99),
(1937, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-11 22:10:25', 99),
(1938, 'Vehicle Request submitted', 'Reservation Request', '2025-10-11 22:25:20', 77),
(1939, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 22:28:21', 114),
(1940, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-11 22:37:52', 114),
(1941, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-11 22:38:01', 99),
(1942, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-11 23:59:09', 99),
(1943, 'Vehicle Request submitted', 'Reservation Request', '2025-10-12 00:47:42', 77),
(1944, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 00:49:35', NULL),
(1945, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 00:51:47', NULL),
(1946, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 00:52:36', NULL),
(1947, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 00:53:19', NULL),
(1948, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 00:56:32', NULL),
(1949, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 01:03:51', 114),
(1950, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 01:05:07', 114),
(1951, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 01:05:17', 99),
(1952, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-12 01:05:22', 99),
(1953, 'Venue Request submitted', 'Reservation Request', '2025-10-12 01:06:11', 77),
(1954, 'User Logged in', 'LOGIN', '2025-10-12 08:53:22', 99),
(1955, 'Vehicle Request submitted', 'Reservation Request', '2025-10-12 08:55:07', 77),
(1956, 'Vehicle Request submitted', 'Reservation Request', '2025-10-12 08:55:23', 77),
(1957, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 08:55:37', 114),
(1958, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-12 09:19:07', 99),
(1959, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 09:34:01', NULL),
(1960, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 09:35:06', NULL),
(1961, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-12 09:35:13', 114),
(1962, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 09:49:22', 114),
(1963, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 09:49:26', 99),
(1964, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 09:49:35', NULL),
(1965, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 10:37:14', NULL),
(1966, 'Marked notifications as read (count: 86)', 'READ NOTIFICATION', '2025-10-12 10:40:05', 77),
(1967, 'Venue Request submitted', 'Reservation Request', '2025-10-12 10:45:06', 77),
(1968, 'Equipment Request submitted', 'Reservation Request', '2025-10-12 10:45:30', 77),
(1969, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 10:45:54', 114),
(1970, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 10:46:00', 99),
(1971, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 10:46:03', 114),
(1972, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 10:46:10', 99),
(1973, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 10:47:46', 99),
(1974, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 10:48:03', 99),
(1975, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 10:49:54', 99),
(1976, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 10:50:27', 99),
(1977, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 10:53:21', NULL),
(1978, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-12 11:22:22', 114),
(1979, 'Venue Request submitted', 'Reservation Request', '2025-10-12 11:23:07', 77),
(1980, 'Venue Request submitted', 'Reservation Request', '2025-10-12 11:23:28', 77),
(1981, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 11:23:39', 114),
(1982, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 11:23:41', 114),
(1983, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 11:24:18', 99),
(1984, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 11:24:28', 99),
(1985, 'User Logged out', 'LOGOUT', '2025-10-12 11:24:33', 77),
(1986, 'User Logged in', 'LOGIN', '2025-10-12 11:24:43', 96),
(1987, 'Venue Request submitted', 'Reservation Request', '2025-10-12 11:24:59', 96),
(1988, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 11:52:22', 114),
(1989, 'User Logged in', 'LOGIN', '2025-10-12 11:52:41', 99),
(1990, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 11:52:52', 99),
(1991, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 11:58:36', 99),
(1992, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 12:00:47', 99),
(1993, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 12:02:06', 99),
(1994, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 12:03:38', 99);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(1995, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 12:08:11', 99),
(1996, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 12:08:12', 99),
(1997, 'User Logged out', 'LOGOUT', '2025-10-12 12:43:44', 96),
(1998, 'User Logged in', 'LOGIN', '2025-10-12 12:43:54', 77),
(1999, 'User Logged out', 'LOGOUT', '2025-10-12 12:45:34', 77),
(2000, 'User Logged in', 'LOGIN', '2025-10-12 12:45:39', 96),
(2001, 'User Logged out', 'LOGOUT', '2025-10-12 12:52:04', 96),
(2002, 'User Logged in', 'LOGIN', '2025-10-12 12:52:11', 77),
(2003, 'Venue Request submitted', 'Reservation Request', '2025-10-12 13:18:08', 77),
(2004, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 13:18:28', 114),
(2005, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 13:26:32', 99),
(2006, 'User Logged in', 'LOGIN', '2025-10-12 18:36:34', 99),
(2007, 'Venue Request submitted', 'Reservation Request', '2025-10-12 18:36:57', 77),
(2008, 'Venue Request submitted', 'Reservation Request', '2025-10-12 18:37:23', 77),
(2009, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 18:37:29', 114),
(2010, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 18:37:34', 114),
(2011, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 18:37:41', 99),
(2012, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 18:37:47', 99),
(2013, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-12 18:37:52', 114),
(2014, 'Marked notifications as read (count: 31)', 'READ NOTIFICATION', '2025-10-12 18:37:59', 77),
(2015, 'User Logged out', 'LOGOUT', '2025-10-12 18:38:01', 77),
(2016, 'User Logged in', 'LOGIN', '2025-10-12 18:38:11', 96),
(2017, 'Venue Request submitted', 'Reservation Request', '2025-10-12 18:38:28', 96),
(2018, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-12 18:38:50', 114),
(2019, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-12 18:45:51', 99),
(2020, 'Venue Request submitted', 'Reservation Request', '2025-10-12 19:01:16', 96),
(2021, 'Marked notifications as read (count: 16)', 'READ NOTIFICATION', '2025-10-12 19:02:02', 96),
(2022, 'User Logged out', 'LOGOUT', '2025-10-12 19:02:03', 96),
(2023, 'User Logged in', 'LOGIN', '2025-10-12 19:02:12', 77),
(2024, 'User Logged out', 'LOGOUT', '2025-10-12 19:02:18', 99),
(2025, 'User Logged in', 'LOGIN', '2025-10-12 19:02:33', 83),
(2026, 'Venue Request submitted', 'Reservation Request', '2025-10-12 19:02:56', 77),
(2027, 'Venue Request submitted', 'Reservation Request', '2025-10-12 19:15:05', 77),
(2028, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 19:15:26', NULL),
(2029, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-12 19:25:08', NULL),
(2030, 'User Logged in', 'LOGIN', '2025-10-12 20:37:35', 83),
(2031, 'Reservation \'asd\' approved by Rizhaly B Maandig', 'APPROVE', '2025-10-12 20:38:00', 83),
(2032, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-12 20:38:14', 83),
(2033, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-12 20:40:04', 114),
(2034, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-12 21:16:18', 114),
(2035, 'User Logged out', 'LOGOUT', '2025-10-12 22:26:17', 114),
(2036, 'User Logged in', 'LOGIN', '2025-10-12 22:26:26', 83),
(2037, 'User Logged out', 'LOGOUT', '2025-10-12 22:26:46', 83),
(2038, 'User Logged in', 'LOGIN', '2025-10-12 22:26:59', 99),
(2039, 'User Logged out', 'LOGOUT', '2025-10-12 22:29:47', 77),
(2040, 'User Logged in', 'LOGIN', '2025-10-12 22:29:56', 83),
(2041, 'User Logged out', 'LOGOUT', '2025-10-12 22:33:02', 99),
(2042, 'User Logged in', 'LOGIN', '2025-10-12 22:33:08', 99),
(2043, 'Venue Request submitted', 'Reservation Request', '2025-10-13 00:01:09', 83),
(2044, 'Venue Request submitted', 'Reservation Request', '2025-10-13 00:02:20', 83),
(2045, 'Venue Request submitted', 'Reservation Request', '2025-10-13 00:05:52', 83),
(2046, 'Venue Request submitted', 'Reservation Request', '2025-10-13 00:06:59', 83),
(2047, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'asd\'', 'SEND MESSAGE', '2025-10-13 00:07:20', 99),
(2048, 'Venue Request submitted', 'Reservation Request', '2025-10-13 00:09:37', 83),
(2049, 'User Logged out', 'LOGOUT', '2025-10-13 00:12:18', 99),
(2050, 'User Logged in', 'LOGIN', '2025-10-13 00:12:37', 77),
(2051, 'User Logged out', 'LOGOUT', '2025-10-13 00:12:55', 77),
(2052, 'User Logged in', 'LOGIN', '2025-10-13 00:13:02', 99),
(2053, 'User Logged out', 'LOGOUT', '2025-10-13 00:14:22', 83),
(2054, 'User Logged in', 'LOGIN', '2025-10-13 00:14:32', 77),
(2055, 'Venue Request submitted', 'Reservation Request', '2025-10-13 00:15:46', 77),
(2056, 'User Logged out', 'LOGOUT', '2025-10-13 00:17:24', 77),
(2057, 'User Logged in', 'LOGIN', '2025-10-13 00:17:39', 83),
(2058, 'User Logged in', 'LOGIN', '2025-10-13 01:47:22', 78),
(2059, 'User Logged out', 'LOGOUT', '2025-10-13 01:48:35', 78),
(2060, 'User Logged in', 'LOGIN', '2025-10-13 01:48:47', 99),
(2061, 'User Logged out', 'LOGOUT', '2025-10-13 01:49:16', 99),
(2062, 'User Logged in', 'LOGIN', '2025-10-13 01:49:40', 114),
(2063, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-13 01:50:25', 114),
(2064, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-13 01:50:39', 99),
(2065, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-13 01:50:49', 99),
(2066, 'Marked notifications as read (count: 21)', 'READ NOTIFICATION', '2025-10-13 01:50:52', 99),
(2067, 'User Logged out', 'LOGOUT', '2025-10-13 02:02:49', 114),
(2068, 'User Logged in', 'LOGIN', '2025-10-13 02:03:23', 77),
(2069, 'User Logged out', 'LOGOUT', '2025-10-13 02:04:10', 83),
(2070, 'User Logged in', 'LOGIN', '2025-10-13 02:04:17', 78),
(2071, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 02:05:07', NULL),
(2072, 'Marked notifications as read (count: 9)', 'READ NOTIFICATION', '2025-10-13 02:16:09', 77),
(2073, 'Marked notifications as read (count: 28)', 'READ NOTIFICATION', '2025-10-13 02:18:21', 78),
(2074, 'User Logged in', 'LOGIN', '2025-10-13 12:43:59', 42),
(2075, 'User Logged out', 'LOGOUT', '2025-10-13 12:46:06', 99),
(2076, 'User Logged in', 'LOGIN', '2025-10-13 12:48:34', 77),
(2077, 'User Logged out', 'LOGOUT', '2025-10-13 12:50:29', 77),
(2078, 'User Logged in', 'LOGIN', '2025-10-13 12:50:50', 77),
(2079, 'User Logged in', 'LOGIN', '2025-10-13 13:00:06', 77),
(2080, 'Venue Request submitted', 'Reservation Request', '2025-10-13 13:02:18', 77),
(2081, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-13 13:04:40', 77),
(2082, 'User Logged out', 'LOGOUT', '2025-10-13 13:04:48', 77),
(2083, 'User Logged in', 'LOGIN', '2025-10-13 13:06:10', 77),
(2084, 'User Logged out', 'LOGOUT', '2025-10-13 13:06:22', 77),
(2085, 'User Logged in', 'LOGIN', '2025-10-13 13:06:42', 77),
(2086, 'User Logged out', 'LOGOUT', '2025-10-13 13:09:19', 77),
(2087, 'User Logged in', 'LOGIN', '2025-10-13 13:09:38', 99),
(2088, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-13 13:09:54', 99),
(2089, 'User Logged in', 'LOGIN', '2025-10-13 13:11:56', 114),
(2090, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-13 13:13:24', 114),
(2091, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-13 13:13:36', 99),
(2092, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-13 13:13:50', 77),
(2093, 'User Logged out', 'LOGOUT', '2025-10-13 13:13:57', 99),
(2094, 'User Logged out', 'LOGOUT', '2025-10-13 13:14:16', 78),
(2095, 'User Logged in', 'LOGIN', '2025-10-13 13:14:23', 96),
(2096, 'User Logged in', 'LOGIN', '2025-10-13 13:14:37', 99),
(2097, 'Venue Request submitted', 'Reservation Request', '2025-10-13 13:14:56', 96),
(2098, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-13 13:16:15', 114),
(2099, 'User Logged out', 'LOGOUT', '2025-10-13 13:16:41', 96),
(2100, 'User Logged in', 'LOGIN', '2025-10-13 13:17:00', 77),
(2101, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-13 13:17:18', 114),
(2102, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:17:46', NULL),
(2103, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-13 13:17:48', 99),
(2104, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:19:24', NULL),
(2105, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-13 13:19:30', 99),
(2106, 'Updated Checklist in vehicle Toyota Hiace (11): \'asd\' -> \'Complete Quantitys\'', 'UPDATE CHECKLIST', '2025-10-13 13:19:52', NULL),
(2107, 'Marked notifications as read (count: 64)', 'READ NOTIFICATION', '2025-10-13 13:22:45', 42),
(2108, 'Updated Vehicle: 092--2', 'UPDATE VEHICLE', '2025-10-13 13:22:59', 42),
(2109, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:23:24', NULL),
(2110, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'hi\'', 'SEND MESSAGE', '2025-10-13 13:24:12', 42),
(2111, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'*****\'', 'SEND MESSAGE', '2025-10-13 13:24:18', 42),
(2112, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:43:39', NULL),
(2113, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:47:04', NULL),
(2114, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:51:13', NULL),
(2115, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-13 13:51:14', 99),
(2116, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-13 13:56:46', NULL),
(2117, 'Reschedule request accepted for reservation ID 785', 'RESCHEDULE_ACCEPTED', '2025-10-13 14:01:04', 99),
(2118, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-13 14:09:37', 99),
(2119, 'Venue Request submitted', 'Reservation Request', '2025-10-13 14:17:17', 77),
(2120, 'Venue Request submitted', 'Reservation Request', '2025-10-13 14:20:38', 77),
(2121, 'User Logged out', 'LOGOUT', '2025-10-13 15:04:47', 77),
(2122, 'User Logged in', 'LOGIN', '2025-10-13 15:04:51', 96),
(2123, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-13 15:20:47', 99),
(2124, 'Venue Request submitted', 'Reservation Request', '2025-10-13 15:24:05', 96),
(2125, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-13 15:28:22', 99),
(2126, 'User Logged out', 'LOGOUT', '2025-10-13 15:31:31', 99),
(2127, 'User Logged in', 'LOGIN', '2025-10-13 15:32:17', 42),
(2128, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-13 15:32:22', 42),
(2129, 'User Logged out', 'LOGOUT', '2025-10-13 15:33:30', 42),
(2130, 'User Logged in', 'LOGIN', '2025-10-13 15:33:55', 42),
(2131, 'User Logged out', 'LOGOUT', '2025-10-13 15:33:58', 42),
(2132, 'User Logged in', 'LOGIN', '2025-10-13 15:44:49', 42),
(2133, 'User Logged out', 'LOGOUT', '2025-10-13 15:57:58', 42),
(2134, 'User Logged in', 'LOGIN', '2025-10-13 15:58:21', 42),
(2135, 'User Logged out', 'LOGOUT', '2025-10-13 16:04:26', 42),
(2136, 'User Logged in', 'LOGIN', '2025-10-13 16:04:39', 42),
(2137, 'User Logged in', 'LOGIN', '2025-10-13 16:04:46', 42),
(2138, 'User Logged in', 'LOGIN', '2025-10-13 16:04:54', 42),
(2139, 'User Logged in', 'LOGIN', '2025-10-13 16:06:36', 42),
(2140, 'User Logged in', 'LOGIN', '2025-10-13 16:08:23', 42),
(2141, 'User Logged in', 'LOGIN', '2025-10-13 16:17:23', 42),
(2142, 'User Logged out', 'LOGOUT', '2025-10-13 16:24:33', 42),
(2143, 'User Logged in', 'LOGIN', '2025-10-13 16:24:39', 99),
(2144, 'User Logged out', 'LOGOUT', '2025-10-13 16:24:43', 99),
(2145, 'User Logged in', 'LOGIN', '2025-10-13 16:25:51', 42),
(2146, 'User Logged in', 'LOGIN', '2025-10-13 16:50:05', 99),
(2147, 'User Logged out', 'LOGOUT', '2025-10-13 16:50:29', 99),
(2148, 'User Logged in', 'LOGIN', '2025-10-13 16:50:35', 99),
(2149, 'User Logged in', 'LOGIN', '2025-10-13 16:51:00', 99),
(2150, 'User Logged in', 'LOGIN', '2025-10-13 17:15:30', 99),
(2151, 'Vehicle Request submitted', 'Reservation Request', '2025-10-13 17:17:06', 96),
(2152, 'User Logged out', 'LOGOUT', '2025-10-13 17:23:59', 99),
(2153, 'User Logged in', 'LOGIN', '2025-10-13 17:24:07', 99),
(2154, 'User Logged in', 'LOGIN', '2025-10-13 17:38:03', 99),
(2155, 'User Logged in', 'LOGIN', '2025-10-13 17:38:15', 114),
(2156, 'Marked notifications as read (count: 15)', 'READ NOTIFICATION', '2025-10-13 17:38:29', 114),
(2157, 'Venue Request submitted', 'Reservation Request', '2025-10-13 17:38:51', 96),
(2158, 'Venue Request submitted', 'Reservation Request', '2025-10-13 17:39:38', 96),
(2159, 'User Logged out', 'LOGOUT', '2025-10-13 17:40:32', 114),
(2160, 'User Logged in', 'LOGIN', '2025-10-13 17:40:45', 42),
(2161, 'User Logged out', 'LOGOUT', '2025-10-13 17:41:45', 114),
(2162, 'User Logged in', 'LOGIN', '2025-10-13 17:41:53', 77),
(2163, 'Venue Request submitted', 'Reservation Request', '2025-10-13 17:42:06', 77),
(2164, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-10-13 17:42:17', 77),
(2165, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-13 17:52:48', 42),
(2166, 'User Logged in', 'LOGIN', '2025-10-13 18:02:05', 99),
(2167, 'User Logged in', 'LOGIN', '2025-10-13 18:02:22', 99),
(2168, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-13 18:05:18', 99),
(2169, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'gsd\'', 'SEND MESSAGE', '2025-10-13 20:16:38', 99),
(2170, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'asd\'', 'SEND MESSAGE', '2025-10-13 20:16:56', 99),
(2171, 'User Logged in', 'LOGIN', '2025-10-13 21:09:32', 77),
(2172, 'Venue Request submitted', 'Reservation Request', '2025-10-13 21:09:55', 77),
(2173, 'User Logged out', 'LOGOUT', '2025-10-13 21:11:18', 77),
(2174, 'User Logged in', 'LOGIN', '2025-10-13 21:11:34', 83),
(2175, 'User Logged out', 'LOGOUT', '2025-10-13 21:16:58', 83),
(2176, 'User Logged in', 'LOGIN', '2025-10-13 21:17:10', 86),
(2177, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-13 21:26:08', 99),
(2178, 'User Logged out', 'LOGOUT', '2025-10-13 21:27:42', 86),
(2179, 'User Logged in', 'LOGIN', '2025-10-13 21:27:52', 114),
(2180, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-13 21:28:41', 114),
(2181, 'Venue Request submitted', 'Reservation Request', '2025-10-13 21:32:00', 96),
(2182, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-13 21:33:59', 99),
(2183, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-13 22:32:58', 42),
(2184, 'Vehicle Request submitted', 'Reservation Request', '2025-10-14 01:41:54', 96),
(2185, 'User Logged in', 'LOGIN', '2025-10-14 01:54:51', 114),
(2186, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 01:55:26', 114),
(2187, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-14 11:28:36', 99),
(2188, 'User Logged out', 'LOGOUT', '2025-10-14 11:28:38', 99),
(2189, 'User Logged in', 'LOGIN', '2025-10-14 11:28:52', 114),
(2190, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 11:32:01', 114),
(2191, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 11:32:55', 114),
(2192, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 11:38:49', 114),
(2193, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 11:47:06', 114),
(2194, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 11:47:51', 114),
(2195, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-14 11:49:57', 114),
(2196, 'User Logged in', 'LOGIN', '2025-10-14 13:06:14', 77),
(2197, 'Venue Request submitted', 'Reservation Request', '2025-10-14 13:06:31', 77),
(2198, 'Reservation Report (September 2025) generated: no records found', 'GENERATE REPORT', '2025-10-14 19:56:52', NULL),
(2199, 'Reservation Report (October 2025) generated: 4 record(s) found', 'GENERATE REPORT', '2025-10-14 19:56:57', NULL),
(2200, 'User Logged out', 'LOGOUT', '2025-10-14 22:27:47', 42),
(2201, 'User Logged in', 'LOGIN', '2025-10-14 22:28:06', 114),
(2202, 'User Logged out', 'LOGOUT', '2025-10-14 23:13:14', 114),
(2203, 'User Logged in', 'LOGIN', '2025-10-14 23:13:37', 99),
(2204, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-14 23:14:05', 99),
(2205, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-14 23:16:51', 99),
(2206, 'Updated Venue: Auditoriums', 'UPDATE VENUE', '2025-10-14 23:56:49', 99),
(2207, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-14 23:56:55', 99),
(2208, 'Updated Vehicle: \'092--2\' -> \'092\'', 'UPDATE VEHICLE', '2025-10-15 00:02:17', 99),
(2209, 'Updated Vehicle: \'092\' -> \'0922\'', 'UPDATE VEHICLE', '2025-10-15 00:04:04', 99),
(2210, 'Updated Equipment Category: \'cxz\' -> \'zxc\'', 'UPDATE', '2025-10-15 01:18:33', 114),
(2211, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-15 01:30:43', 114),
(2212, 'Updated Equipment Category: \'zxc\' -> \'cxzx\'', 'UPDATE', '2025-10-15 01:31:11', 114),
(2213, 'Reservation \'asdsada\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-15 01:39:56', 114),
(2214, 'Updated Checklist in venue QUADRANGLE: \'All Chairs Has been set up 1\' -> \'All Chairs Has been set up \'', 'UPDATE CHECKLIST', '2025-10-15 01:48:51', NULL),
(2215, 'User Logged in', 'LOGIN', '2025-10-15 02:02:31', 77),
(2216, 'User Rusty C. Pisco sent a message to Darwin M. Galudo: \'Asd\'', 'SEND MESSAGE', '2025-10-15 02:02:50', 114),
(2217, 'User Rusty C. Pisco sent a message to Darwin M. Galudo: \'asd\'', 'SEND MESSAGE', '2025-10-15 02:03:41', 114),
(2218, 'User Rusty C. Pisco sent a message to Darwin M. Galudo: \'hello\'', 'SEND MESSAGE', '2025-10-15 02:03:48', 114),
(2219, 'User Rusty C. Pisco sent a message to Darwin M. Galudo: \'hi\'', 'SEND MESSAGE', '2025-10-15 02:13:02', 114),
(2220, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'hello\'', 'SEND MESSAGE', '2025-10-15 02:14:51', 77),
(2221, 'User Logged in', 'LOGIN', '2025-10-15 02:15:55', 114),
(2222, 'User Jeniffer B. Tuan sent a message to Rusty C. Pisco: \'Hello sir\'', 'SEND MESSAGE', '2025-10-15 02:17:59', 99),
(2223, 'User Rusty C. Pisco sent a message to Mark C. Macaventa: \'hello\'', 'SEND MESSAGE', '2025-10-15 02:20:27', 114),
(2224, 'User Mark C. Macaventa sent a message to Rusty C. Pisco: \'meow\'', 'SEND MESSAGE', '2025-10-15 02:20:33', 96),
(2225, 'User Mark C. Macaventa sent a message to Rusty C. Pisco: \'hem\'', 'SEND MESSAGE', '2025-10-15 02:24:19', 96),
(2226, 'User Mark C. Macaventa sent a message to Rusty C. Pisco: \'halaa\'', 'SEND MESSAGE', '2025-10-15 02:24:26', 96),
(2227, 'User Mark C. Macaventa sent a message to Rusty C. Pisco: \'ha\'', 'SEND MESSAGE', '2025-10-15 04:47:44', 96),
(2228, 'User Mark C. Macaventa sent a message to Rusty C. Pisco: \'he\'', 'SEND MESSAGE', '2025-10-15 04:47:52', 96),
(2229, 'User Mark C. Macaventa sent a message to Rusty C. Pisco: \'hehe\'', 'SEND MESSAGE', '2025-10-15 04:48:00', 96),
(2230, 'Reservation \'asdsada\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-15 04:56:50', 99),
(2231, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-15 04:56:56', NULL),
(2232, 'User Logged out', 'LOGOUT', '2025-10-15 04:58:50', 99),
(2233, 'User Logged in', 'LOGIN', '2025-10-15 04:59:13', 78),
(2234, 'Virjillo Datario checked (sample checklist)', 'CHECK', '2025-10-15 05:12:07', 78),
(2235, 'Venue MW 708 returned by: Virjillo Datario - condition: Good - remarks: Daot ni sya', 'RETURN', '2025-10-15 05:12:15', 78),
(2236, 'Reservation (asdsada) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-15 05:12:17', 78),
(2237, 'User Logged out', 'LOGOUT', '2025-10-15 05:15:14', 96),
(2238, 'User Logged in', 'LOGIN', '2025-10-15 05:15:25', 78),
(2239, 'Vehicle Vehicle #159 released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:36:58', 78),
(2240, 'Vehicle Vehicle #160 released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:36:58', 78),
(2241, 'Vehicle Vehicle #161 released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:36:58', 78),
(2242, 'Vehicle Vehicle #159 released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:38:03', 78),
(2243, 'Vehicle Vehicle #160 released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:38:03', 78),
(2244, 'Vehicle Vehicle #161 released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:38:03', 78),
(2245, 'Vehicle Corollass (2002asda) released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:38:58', 78),
(2246, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:38:58', 78),
(2247, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-15 05:38:58', 78),
(2248, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-10-15 05:40:32', 78),
(2249, 'User Logged in', 'LOGIN', '2025-10-15 12:30:33', 99),
(2250, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-15 17:34:52', 99),
(2251, 'User Logged out', 'LOGOUT', '2025-10-15 17:42:51', 99),
(2252, 'User Logged in', 'LOGIN', '2025-10-15 17:43:03', 77),
(2253, 'User Darwin M. Galudo sent a message to Virjillo Datario: \'hey\'', 'SEND MESSAGE', '2025-10-15 17:51:31', 77),
(2254, 'User Virjillo Datario sent a message to Darwin M. Galudo: \'Oh\'', 'SEND MESSAGE', '2025-10-15 17:51:43', 78),
(2255, 'User Virjillo Datario sent a message to Darwin M. Galudo: \'??\'', 'SEND MESSAGE', '2025-10-15 17:51:55', 78),
(2256, 'User Virjillo Datario sent a message to Darwin M. Galudo: \'Unsa man\'', 'SEND MESSAGE', '2025-10-15 17:52:00', 78),
(2257, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-15 17:52:19', 77),
(2258, 'User Virjillo Datario sent a message to Darwin M. Galudo: \'😊\'', 'SEND MESSAGE', '2025-10-15 17:54:25', 78),
(2259, 'User Logged out', 'LOGOUT', '2025-10-15 18:05:27', 77),
(2260, 'User Logged in', 'LOGIN', '2025-10-15 18:05:35', 99),
(2261, 'User Logged out', 'LOGOUT', '2025-10-15 18:10:24', 78),
(2262, 'User Logged in', 'LOGIN', '2025-10-15 18:10:46', 99),
(2263, 'User Logged out', 'LOGOUT', '2025-10-15 19:52:52', 99),
(2264, 'User Logged in', 'LOGIN', '2025-10-15 19:53:14', 77),
(2265, 'User Logged in', 'LOGIN', '2025-10-15 20:38:36', 114),
(2266, 'User Logged out', 'LOGOUT', '2025-10-15 20:38:48', 114),
(2267, 'User Logged in', 'LOGIN', '2025-10-15 20:39:07', 96),
(2268, 'Venue Request submitted', 'Reservation Request', '2025-10-15 20:39:26', 96),
(2269, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-15 20:47:06', 99),
(2270, 'Venue Request submitted', 'Reservation Request', '2025-10-15 20:49:10', 96),
(2271, 'Venue Request submitted', 'Reservation Request', '2025-10-15 20:50:01', 96),
(2272, 'User Logged out', 'LOGOUT', '2025-10-15 20:50:39', 78),
(2273, 'User Logged in', 'LOGIN', '2025-10-15 20:50:53', 114),
(2274, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-15 20:51:00', 114),
(2275, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-15 20:51:18', 114),
(2276, 'Venue Request submitted', 'Reservation Request', '2025-10-15 21:29:50', 96),
(2277, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-15 21:30:15', 114),
(2278, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-15 21:30:19', 99),
(2279, 'User Logged out', 'LOGOUT', '2025-10-15 21:55:25', 114),
(2280, 'User Logged out', 'LOGOUT', '2025-10-16 03:07:43', 99),
(2281, 'User Logged in', 'LOGIN', '2025-10-16 03:07:58', 77),
(2282, 'User Logged in', 'LOGIN', '2025-10-16 11:37:28', 99),
(2283, 'User Logged out', 'LOGOUT', '2025-10-16 12:06:17', 99),
(2284, 'User Logged in', 'LOGIN', '2025-10-16 12:06:41', 77),
(2285, 'Venue Request submitted', 'Reservation Request', '2025-10-16 12:07:23', 77),
(2286, 'Venue Request submitted', 'Reservation Request', '2025-10-16 12:57:30', 77),
(2287, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Hello\'', 'SEND MESSAGE', '2025-10-16 12:58:47', 77),
(2288, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Hello\'', 'SEND MESSAGE', '2025-10-16 13:00:36', 77),
(2289, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-16 13:48:30', 77),
(2290, 'User Logged out', 'LOGOUT', '2025-10-17 05:25:09', 77),
(2291, 'User Logged in', 'LOGIN', '2025-10-17 05:25:20', 99),
(2292, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-17 05:25:26', 99),
(2293, 'User Logged in', 'LOGIN', '2025-10-17 05:25:38', 114),
(2294, 'User Logged in', 'LOGIN', '2025-10-17 05:25:58', 96),
(2295, 'Venue Request submitted', 'Reservation Request', '2025-10-17 05:26:14', 96),
(2296, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 05:26:36', 114),
(2297, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-17 05:26:44', 99),
(2298, 'Added Checklist to venue MW 704: No. Checklist (1) by: Jeniffer B. Tuan', 'ADD CHECKLIST', '2025-10-17 05:27:10', 99),
(2299, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-17 05:27:20', 99),
(2300, 'Marked notifications as read (count: 28)', 'READ NOTIFICATION', '2025-10-17 05:27:31', 96),
(2301, 'User Logged out', 'LOGOUT', '2025-10-17 05:27:32', 96),
(2302, 'User Logged in', 'LOGIN', '2025-10-17 05:27:43', 78),
(2303, 'User Logged out', 'LOGOUT', '2025-10-17 05:27:47', 114),
(2304, 'User Logged in', 'LOGIN', '2025-10-17 05:27:57', 77),
(2305, 'Venue MW 704 released by: Virjillo Datario', 'RELEASE', '2025-10-17 05:54:06', 78),
(2306, 'User Logged out', 'LOGOUT', '2025-10-17 05:56:55', 77),
(2307, 'User Logged in', 'LOGIN', '2025-10-17 05:57:04', 96),
(2308, 'Venue MW 704 released by: Virjillo Datario', 'RELEASE', '2025-10-17 06:27:15', 78),
(2309, 'Virjillo Datario checked (sample checklist)', 'CHECK', '2025-10-17 06:27:17', 78),
(2310, 'User Logged in', 'LOGIN', '2025-10-17 10:15:43', 42),
(2311, 'Marked notifications as read (count: 13)', 'READ NOTIFICATION', '2025-10-17 10:16:03', 42),
(2312, 'User Christian Mark S. Valle sent a message to Jeniffer B. Tuan: \'Hello\'', 'SEND MESSAGE', '2025-10-17 10:19:08', 42),
(2313, 'User Jeniffer B. Tuan sent a message to Christian Mark S. Valle: \'hello\'', 'SEND MESSAGE', '2025-10-17 10:19:20', 99),
(2314, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-17 10:19:25', 99),
(2315, 'User Logged out', 'LOGOUT', '2025-10-17 10:34:07', 42),
(2316, 'User Logged in', 'LOGIN', '2025-10-17 10:34:32', 77),
(2317, 'User Logged in', 'LOGIN', '2025-10-17 10:37:46', 96),
(2318, 'Venue Request submitted', 'Reservation Request', '2025-10-17 10:40:50', 77),
(2319, 'Venue Request submitted', 'Reservation Request', '2025-10-17 10:43:17', 77),
(2320, 'User Logged in', 'LOGIN', '2025-10-17 10:48:18', 42),
(2321, 'User Logged in', 'LOGIN', '2025-10-17 10:51:43', 77),
(2322, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-17 11:01:35', 99),
(2323, 'User Logged in', 'LOGIN', '2025-10-17 12:55:15', 99),
(2324, 'User Logged out', 'LOGOUT', '2025-10-17 12:55:22', 96),
(2325, 'User Logged in', 'LOGIN', '2025-10-17 12:55:35', 114),
(2326, 'Reservation \'Uvuc\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 12:55:53', 114),
(2327, 'Reservation \'Jcjd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 12:58:45', 114),
(2328, 'Reservation \'Ass\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 13:00:21', 114),
(2329, 'User Logged in', 'LOGIN', '2025-10-17 13:06:09', 77),
(2330, 'Venue Request submitted', 'Reservation Request', '2025-10-17 13:06:39', 77),
(2331, 'Reservation \'Jakk\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 13:07:24', 114),
(2332, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-17 13:09:09', 99),
(2333, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-17 13:10:18', 99),
(2334, 'User Logged out', 'LOGOUT', '2025-10-17 13:10:37', 99),
(2335, 'User Logged in', 'LOGIN', '2025-10-17 13:10:48', 78),
(2336, 'Venue AVR 2 released by: Virjillo Datario', 'RELEASE', '2025-10-17 13:11:37', 78),
(2337, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-17 13:11:40', 78),
(2338, 'Venue AVR 2 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-17 13:11:44', 78),
(2339, 'Reservation (Jakk) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-17 13:11:45', 78),
(2340, 'User Logged out', 'LOGOUT', '2025-10-17 13:12:23', 114),
(2341, 'User Logged in', 'LOGIN', '2025-10-17 13:12:32', 77),
(2342, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-10-17 13:15:06', 77),
(2343, 'Venue Request submitted', 'Reservation Request', '2025-10-17 13:15:41', 77),
(2344, 'User Logged out', 'LOGOUT', '2025-10-17 13:33:21', 78),
(2345, 'User Logged in', 'LOGIN', '2025-10-17 13:33:39', 42),
(2346, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-17 13:34:22', 42),
(2347, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-17 13:34:35', 77),
(2348, 'User Logged out', 'LOGOUT', '2025-10-17 14:29:17', 77),
(2349, 'User Logged in', 'LOGIN', '2025-10-17 14:29:40', 114),
(2350, 'User Logged out', 'LOGOUT', '2025-10-17 15:02:47', 42),
(2351, 'User Logged in', 'LOGIN', '2025-10-17 15:02:59', 77),
(2352, 'User Logged out', 'LOGOUT', '2025-10-17 15:10:18', 77),
(2353, 'User Logged in', 'LOGIN', '2025-10-17 15:10:26', 77),
(2354, 'User Logged out', 'LOGOUT', '2025-10-17 15:12:12', 77),
(2355, 'User Logged in', 'LOGIN', '2025-10-17 15:12:19', 99),
(2356, 'Venue Request submitted', 'Reservation Request', '2025-10-17 15:12:39', 77),
(2357, 'Venue Request submitted', 'Reservation Request', '2025-10-17 15:13:51', 77),
(2358, 'Reservation \'Jsosi\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 15:14:22', 114),
(2359, 'Reservation \'Jsosi\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-17 15:14:30', 99),
(2360, 'Added Checklist to equipment Monitor X: No. Checklist (1) by: Jeniffer B. Tuan', 'ADD CHECKLIST', '2025-10-17 15:14:46', 99),
(2361, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-17 15:15:04', 99),
(2362, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-17 15:15:16', 114),
(2363, 'Reservation \'Asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-17 15:15:22', 99),
(2364, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-17 15:15:28', 99),
(2365, 'User Logged out', 'LOGOUT', '2025-10-17 15:15:42', 77),
(2366, 'User Logged in', 'LOGIN', '2025-10-17 15:16:54', 78),
(2367, 'Venue MW 708 released by: Virjillo Datario', 'RELEASE', '2025-10-17 15:17:57', 78),
(2368, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-17 15:18:05', 78),
(2369, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-17 15:18:14', 78),
(2370, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-17 15:18:19', 78),
(2371, 'User Logged out', 'LOGOUT', '2025-10-17 15:20:17', 99),
(2372, 'User Logged in', 'LOGIN', '2025-10-17 15:20:26', 78),
(2373, 'Equipment Unit Unit MX-001 released by: Virjillo Datario', 'RELEASE', '2025-10-17 15:23:27', 78),
(2374, 'Equipment Unit Unit MX-002 released by: Virjillo Datario', 'RELEASE', '2025-10-17 15:23:27', 78),
(2375, 'Equipment Unit Unit MX-001 released by: Virjillo Datario', 'RELEASE', '2025-10-17 15:23:30', 78),
(2376, 'Equipment Unit Unit MX-002 released by: Virjillo Datario', 'RELEASE', '2025-10-17 15:23:31', 78),
(2377, 'Virjillo Datario checked (Sample Checklist)', 'CHECK', '2025-10-17 15:23:36', 78),
(2378, 'Equipment Unit Unit MX-001 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-17 15:23:42', 78),
(2379, 'Equipment Unit Unit MX-002 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-17 15:23:49', 78),
(2380, 'Virjillo Datario checked (sample checklist)', 'CHECK', '2025-10-17 15:23:56', 78),
(2381, 'Venue MW 708 returned by: Virjillo Datario - condition: For Inspection - remarks: Chexk', 'RETURN', '2025-10-17 15:24:01', 78),
(2382, 'Reservation (Jsosi) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-17 15:24:03', 78),
(2383, 'Venue (MW 708) availability set to Unavailable by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-17 15:24:30', 114),
(2384, 'Equipment Unit (Monitor X - SN: MX-002) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-17 15:24:35', 114),
(2385, 'Equipment Unit (Monitor X - SN: MX-001) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-17 15:24:38', 114),
(2386, 'Virjillo Datario checked (sample checklist)', 'CHECK', '2025-10-17 15:31:34', 78),
(2387, 'Venue MW 708 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-17 15:31:53', 78),
(2388, 'Equipment Unit Unit MX-003 released by: Virjillo Datario', 'RELEASE', '2025-10-17 16:16:24', 78),
(2389, 'Equipment Unit Unit MX-004 released by: Virjillo Datario', 'RELEASE', '2025-10-17 16:16:24', 78),
(2390, 'Equipment Unit Unit MX-003 released by: Virjillo Datario', 'RELEASE', '2025-10-17 16:16:26', 78),
(2391, 'Equipment Unit Unit MX-004 released by: Virjillo Datario', 'RELEASE', '2025-10-17 16:16:26', 78),
(2392, 'Virjillo Datario checked (Sample Checklist)', 'CHECK', '2025-10-17 16:16:31', 78),
(2393, 'User Logged in', 'LOGIN', '2025-10-17 16:50:45', 78),
(2394, 'User Logged out', 'LOGOUT', '2025-10-17 16:54:28', 78),
(2395, 'User Logged in', 'LOGIN', '2025-10-17 16:54:47', 77),
(2396, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-10-17 16:58:56', 77),
(2397, 'User Logged out', 'LOGOUT', '2025-10-18 05:33:30', 78),
(2398, 'User Logged in', 'LOGIN', '2025-10-18 05:33:36', 99),
(2399, 'User Logged in', 'LOGIN', '2025-10-18 05:33:55', 114),
(2400, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-18 05:33:58', 99),
(2401, 'User Logged out', 'LOGOUT', '2025-10-18 05:34:14', 78),
(2402, 'User Logged in', 'LOGIN', '2025-10-18 05:34:26', 77),
(2403, 'Vehicle Request submitted', 'Reservation Request', '2025-10-18 05:34:54', 77),
(2404, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-18 06:07:02', 77),
(2405, 'User Logged in', 'LOGIN', '2025-10-18 10:45:17', 77),
(2406, 'User Logged in', 'LOGIN', '2025-10-18 10:46:25', 99),
(2407, 'User Logged in', 'LOGIN', '2025-10-18 10:48:54', 114),
(2408, 'User: Gian Legaspi has been updated. Changes: password: changed', 'UPDATE USER', '2025-10-18 10:49:57', NULL),
(2409, 'User Logged in', 'LOGIN', '2025-10-18 10:52:39', 111),
(2410, 'Venue Request submitted', 'Reservation Request', '2025-10-18 10:53:41', 111),
(2411, 'User Logged in', 'LOGIN', '2025-10-18 10:56:56', 77),
(2412, 'User Logged out', 'LOGOUT', '2025-10-18 11:11:49', 114),
(2413, 'User Logged in', 'LOGIN', '2025-10-18 11:12:12', 77),
(2414, 'User Logged out', 'LOGOUT', '2025-10-19 02:20:43', 99),
(2415, 'User Logged in', 'LOGIN', '2025-10-19 03:40:10', 99),
(2416, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-19 19:36:49', 99),
(2417, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-19 19:36:49', 99),
(2418, 'User Logged in', 'LOGIN', '2025-10-19 22:37:41', 114),
(2419, 'Venue (MW 708) availability set to Available by: Jeniffer B. Tuan', 'UPDATE AVAILABILITY', '2025-10-19 23:07:00', 99),
(2420, 'Equipment Unit (Monitor X - SN: MX-001) availability set to Available by: Jeniffer B. Tuan', 'UPDATE AVAILABILITY', '2025-10-19 23:07:03', 99),
(2421, 'Updated Venue: MW 7081', 'UPDATE VENUE', '2025-10-19 23:19:46', 99),
(2422, 'Updated Venue: MW 708', 'UPDATE VENUE', '2025-10-19 23:19:54', 99),
(2423, 'Vehicle Request submitted', 'Reservation Request', '2025-10-19 23:32:44', 77),
(2424, 'User Logged out', 'LOGOUT', '2025-10-19 23:33:16', 77),
(2425, 'User Logged in', 'LOGIN', '2025-10-19 23:33:21', 96),
(2426, 'Vehicle Request submitted', 'Reservation Request', '2025-10-19 23:34:02', 96),
(2427, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-19 23:34:34', 114),
(2428, 'Marked notifications as read (count: 17)', 'READ NOTIFICATION', '2025-10-19 23:37:40', 114),
(2429, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-20 00:16:55', 99),
(2430, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-20 00:17:03', 99),
(2431, 'User Logged out', 'LOGOUT', '2025-10-20 00:17:22', 96),
(2432, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-20 00:23:36', 99),
(2433, 'User Logged in', 'LOGIN', '2025-10-20 09:20:56', 77),
(2434, 'User Logged out', 'LOGOUT', '2025-10-20 09:43:05', 77),
(2435, 'User Logged in', 'LOGIN', '2025-10-20 09:43:24', 99),
(2436, 'User Logged in', 'LOGIN', '2025-10-20 09:45:29', 96),
(2437, 'Venue Request submitted', 'Reservation Request', '2025-10-20 09:45:48', 96),
(2438, 'User Logged out', 'LOGOUT', '2025-10-20 09:46:22', 99),
(2439, 'User Logged in', 'LOGIN', '2025-10-20 09:46:34', 77),
(2440, 'User Logged out', 'LOGOUT', '2025-10-20 09:46:39', 77),
(2441, 'User Logged in', 'LOGIN', '2025-10-20 09:46:51', 114),
(2442, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 09:47:01', 114),
(2443, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-20 10:51:31', 114),
(2444, 'User Logged in', 'LOGIN', '2025-10-20 10:52:58', 99),
(2445, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-20 10:53:30', 99),
(2446, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-20 10:53:36', 99),
(2447, 'User Logged out', 'LOGOUT', '2025-10-20 12:15:00', 78),
(2448, 'User Logged in', 'LOGIN', '2025-10-20 12:15:50', 77),
(2449, 'Venue Request submitted', 'Reservation Request', '2025-10-20 12:16:29', 77),
(2450, 'Reservation \'This is event\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 12:19:31', 114),
(2451, 'Reservation \'This is event\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-20 12:19:43', 99),
(2452, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-20 12:19:55', 99),
(2453, 'Vehicle Request submitted', 'Reservation Request', '2025-10-20 12:27:05', 77),
(2454, 'Reservation \'This is purpose\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 12:27:34', 114),
(2455, 'Reservation \'This is purpose\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-20 12:39:53', 99),
(2456, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-20 12:40:00', 99),
(2457, 'Reservation Report (October 2025) generated: 5 record(s) found', 'GENERATE REPORT', '2025-10-20 12:40:59', NULL),
(2458, 'Venue Request submitted', 'Reservation Request', '2025-10-20 13:40:29', 96),
(2459, 'User Logged out', 'LOGOUT', '2025-10-20 13:41:27', 77),
(2460, 'User Logged in', 'LOGIN', '2025-10-20 13:42:07', 77),
(2461, 'Venue Request submitted', 'Reservation Request', '2025-10-20 13:43:02', 96),
(2462, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 13:48:34', 114),
(2463, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 13:56:15', 114),
(2464, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 13:57:19', 114),
(2465, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 14:00:23', 114),
(2466, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 14:03:11', 114),
(2467, 'User Logged out', 'LOGOUT', '2025-10-20 14:04:15', 77),
(2468, 'User Logged in', 'LOGIN', '2025-10-20 14:04:38', 114),
(2469, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 14:04:51', 114),
(2470, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 14:05:52', 114),
(2471, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 14:06:37', 114),
(2472, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-20 14:06:56', 114),
(2473, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-20 14:14:47', 114),
(2474, 'Venue Request submitted', 'Reservation Request', '2025-10-20 21:50:55', 77),
(2475, 'Reservation \'Asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-20 22:08:50', 114),
(2476, 'Reservation \'sd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-20 22:09:12', 114),
(2477, 'User Logged in', 'LOGIN', '2025-10-20 23:04:24', 77),
(2478, 'Venue Request submitted', 'Reservation Request', '2025-10-20 23:05:02', 77),
(2479, 'Equipment Request submitted', 'Reservation Request', '2025-10-20 23:14:22', 77),
(2480, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-20 23:19:00', 114),
(2481, 'Marked notifications as read (count: 18)', 'READ NOTIFICATION', '2025-10-20 23:23:36', 77),
(2482, 'Created Venue : Sample Add Venue', 'CREATE', '2025-10-20 23:54:47', 114),
(2483, 'Updated Venue: Edited Venue', 'UPDATE VENUE', '2025-10-20 23:54:52', 114),
(2484, 'Updated Venue: Edited Venue', 'UPDATE VENUE', '2025-10-20 23:55:00', 114),
(2485, 'Created Vehicle : sample-vehicle1', 'CREATE', '2025-10-20 23:55:38', 114),
(2486, 'Updated Vehicle: \'sample-vehicle1\' -> \'edited\'', 'UPDATE VEHICLE', '2025-10-20 23:55:54', 114),
(2487, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-10-20 23:55:57', 114),
(2488, 'Created Equipment : asd', 'CREATE', '2025-10-20 23:58:55', 114),
(2489, 'Created Equipment : Sample Equipment', 'CREATE', '2025-10-20 23:59:37', 114),
(2490, 'Updated Equipment: \'Sample Equipment\' -> \'Edited Equipment\'', 'UPDATE', '2025-10-20 23:59:45', 114),
(2491, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2025-05-07\' -> \'Araw ng Kagitingans\' on \'2025-05-07\'', 'UPDATE', '2025-10-21 00:06:52', 114),
(2492, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2025-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 00:07:17', 114),
(2493, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 00:09:13', 114),
(2494, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 00:09:21', 114),
(2495, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 00:12:07', 114),
(2496, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 00:12:18', 114),
(2497, 'User: Gian A. ad has been created', 'CREATE USER', '2025-10-21 00:24:53', NULL),
(2498, 'User: Fatima  A. Vergel has been updated. Changes: first name: Gian -> Fatima ; middle name: asd -> A; last name: ad -> Vergel; suffix: Jr. -> null', 'UPDATE USER', '2025-10-21 00:28:36', NULL),
(2499, 'User: Crestal  T. Panhay has been created', 'CREATE USER', '2025-10-21 00:29:19', NULL),
(2500, 'User Logged out', 'LOGOUT', '2025-10-21 00:31:02', 77),
(2501, 'User Logged in', 'LOGIN', '2025-10-21 00:31:08', 121),
(2502, 'Password updated by: Crestal  T. Panhay', 'UPDATE PASSWORD', '2025-10-21 00:31:15', 121),
(2503, 'User Logged in', 'LOGIN', '2025-10-21 00:31:36', 121),
(2504, 'User Logged in', 'LOGIN', '2025-10-21 00:32:31', 121),
(2505, 'User Logged in', 'LOGIN', '2025-10-21 00:34:08', 121),
(2506, 'User Logged in', 'LOGIN', '2025-10-21 00:34:55', 121),
(2507, 'User Logged in', 'LOGIN', '2025-10-21 00:35:28', 121),
(2508, 'User Logged out', 'LOGOUT', '2025-10-21 00:36:17', 114),
(2509, 'User Logged in', 'LOGIN', '2025-10-21 00:36:32', 121),
(2510, 'User Logged in', 'LOGIN', '2025-10-21 00:38:02', 121),
(2511, 'User Logged in', 'LOGIN', '2025-10-21 00:38:41', 121),
(2512, 'User Logged in', 'LOGIN', '2025-10-21 00:41:02', 121),
(2513, 'User Logged in', 'LOGIN', '2025-10-21 00:42:26', 121),
(2514, 'User Logged out', 'LOGOUT', '2025-10-21 00:42:33', 121),
(2515, 'User Logged in', 'LOGIN', '2025-10-21 00:44:21', 99),
(2516, 'User Logged in', 'LOGIN', '2025-10-21 00:44:43', 77),
(2517, 'Venue Request submitted', 'Reservation Request', '2025-10-21 00:45:03', 77),
(2518, 'User Logged out', 'LOGOUT', '2025-10-21 00:45:18', 77),
(2519, 'User Logged in', 'LOGIN', '2025-10-21 00:45:28', 121),
(2520, 'Reservation \'asd\' approved by Crestal  T Panhay', 'APPROVE', '2025-10-21 00:45:31', 121),
(2521, 'Marked notifications as read (count: 15)', 'READ NOTIFICATION', '2025-10-21 01:01:48', 99),
(2522, 'User Logged out', 'LOGOUT', '2025-10-21 12:14:54', 99),
(2523, 'User Logged in', 'LOGIN', '2025-10-21 12:15:06', 114),
(2524, 'Vehicle Request submitted', 'Reservation Request', '2025-10-21 12:15:46', 77),
(2525, 'Vehicle Request submitted', 'Reservation Request', '2025-10-21 12:17:53', 77),
(2526, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-21 12:18:25', 114),
(2527, 'Reservation \'Azd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-21 12:18:42', 114),
(2528, 'User Logged in', 'LOGIN', '2025-10-21 12:19:05', 99),
(2529, 'Reservation \'Asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-21 12:19:15', 99),
(2530, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-21 12:19:28', 99),
(2531, 'Reservation \'Azd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-21 12:19:46', 99),
(2532, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-21 12:19:55', 99),
(2533, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-21 12:20:48', 99),
(2534, 'User Logged out', 'LOGOUT', '2025-10-21 12:21:59', 114),
(2535, 'User Logged in', 'LOGIN', '2025-10-21 12:22:12', 77),
(2536, 'User Logged out', 'LOGOUT', '2025-10-21 12:31:53', 77),
(2537, 'User Logged in', 'LOGIN', '2025-10-21 12:32:04', 77),
(2538, 'User Logged out', 'LOGOUT', '2025-10-21 12:32:11', 77),
(2539, 'User Logged in', 'LOGIN', '2025-10-21 12:32:20', 99),
(2540, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:32:37', 99),
(2541, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:32:52', 99),
(2542, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:33:37', 99),
(2543, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:34:04', 99),
(2544, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:34:10', 99),
(2545, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:49:10', 99),
(2546, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:49:17', 99),
(2547, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:49:24', 99),
(2548, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:49:37', 99),
(2549, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:50:13', 99),
(2550, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:50:30', 99),
(2551, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:51:19', 99),
(2552, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:51:22', 99),
(2553, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:51:38', 99),
(2554, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:51:44', 99),
(2555, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:53:44', 99),
(2556, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 12:53:47', 99),
(2557, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 13:00:50', 99),
(2558, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 13:00:53', 99),
(2559, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 13:00:55', 99),
(2560, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 13:02:55', 99),
(2561, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 13:02:59', 99),
(2562, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2024-05-07\'', 'UPDATE', '2025-10-21 13:05:25', 99),
(2563, 'Updated Vehicle Make: \'Hyundai\' -> \'Hyundai\'', 'UPDATE', '2025-10-21 13:05:32', 99),
(2564, 'Updated Vehicle Category: \'Light Commercial Vehicle LCV\' -> \'Light Commercial Vehicle LCV\'', 'UPDATE', '2025-10-21 13:05:37', 99),
(2565, 'Updated Vehicle Category: \'Light Commercial Vehicle LCV\' -> \'Light Commercial Vehicle LCV\'', 'UPDATE', '2025-10-21 13:39:28', 99),
(2566, 'Updated Vehicle Model: \'\' -> \'Hiace1\'', 'UPDATE', '2025-10-21 13:39:42', 99),
(2567, 'Updated Vehicle Model: \'\' -> \'Hiace\'', 'UPDATE', '2025-10-21 13:39:47', 99),
(2568, 'Updated Equipment Category: \'cxzx\' -> \'cxzx\'', 'UPDATE', '2025-10-21 13:43:14', 99),
(2569, 'Updated Equipment Category: \'cxzx\' -> \'edited\'', 'UPDATE', '2025-10-21 15:48:03', 99),
(2570, 'Updated Department: BASIC ED (Academic) -> BASIC ED EDITED (Academic)', 'UPDATE', '2025-10-21 15:48:17', 99),
(2571, 'Updated Department: BASIC ED EDITED (Academic) -> BASIC ED (Academic)', 'UPDATE', '2025-10-21 15:48:21', 99),
(2572, 'Venue Request submitted', 'Reservation Request', '2025-10-21 19:02:54', 96),
(2573, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-21 19:07:43', 99),
(2574, 'User Logged out', 'LOGOUT', '2025-10-21 19:21:54', 99),
(2575, 'User Logged in', 'LOGIN', '2025-10-21 19:22:05', 114),
(2576, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-21 19:22:21', 114),
(2577, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-21 19:22:30', 114),
(2578, 'Venue Request submitted', 'Reservation Request', '2025-10-22 01:08:09', 96);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(2579, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-22 01:33:18', 114),
(2580, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Hello sir\'', 'SEND MESSAGE', '2025-10-22 01:39:38', 77),
(2581, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Goodmorning\'', 'SEND MESSAGE', '2025-10-22 01:39:53', 77),
(2582, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Test goodmorning\'', 'SEND MESSAGE', '2025-10-22 01:40:15', 77),
(2583, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Hello sir\'', 'SEND MESSAGE', '2025-10-22 01:40:37', 77),
(2584, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Test chat sir\'', 'SEND MESSAGE', '2025-10-22 01:43:19', 77),
(2585, 'User Darwin M. Galudo sent a message to Rusty C. Pisco: \'Sir?\'', 'SEND MESSAGE', '2025-10-22 01:43:25', 77),
(2586, 'Reservation Report (October 2025) generated: 2 record(s) found', 'GENERATE REPORT', '2025-10-22 02:00:29', NULL),
(2587, 'Venue Request submitted', 'Reservation Request', '2025-10-22 02:22:58', 96),
(2588, 'Venue Request submitted', 'Reservation Request', '2025-10-22 02:29:36', 96),
(2589, 'Venue Request submitted', 'Reservation Request', '2025-10-22 02:30:06', 96),
(2590, 'Venue Request submitted', 'Reservation Request', '2025-10-22 02:33:26', 96),
(2591, 'Venue Request submitted', 'Reservation Request', '2025-10-22 02:38:25', 96),
(2592, 'Venue Request submitted', 'Reservation Request', '2025-10-22 02:40:42', 96),
(2593, 'User Logged out', 'LOGOUT', '2025-10-22 02:42:26', 99),
(2594, 'User Logged in', 'LOGIN', '2025-10-22 02:42:35', 77),
(2595, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-22 02:42:40', 77),
(2596, 'Equipment Request submitted', 'Reservation Request', '2025-10-22 02:48:56', 96),
(2597, 'User Logged out', 'LOGOUT', '2025-10-22 02:49:01', 77),
(2598, 'User Logged in', 'LOGIN', '2025-10-22 02:49:11', 114),
(2599, 'Equipment Request submitted', 'Reservation Request', '2025-10-22 02:50:04', 96),
(2600, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 02:50:28', 114),
(2601, 'Reservation \'as\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 02:50:35', 114),
(2602, 'User Logged out', 'LOGOUT', '2025-10-22 02:50:56', 114),
(2603, 'User Logged in', 'LOGIN', '2025-10-22 02:51:03', 99),
(2604, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 02:51:10', 99),
(2605, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-22 02:51:18', 99),
(2606, 'Reservation \'as\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 02:51:30', 99),
(2607, 'Added Checklist to equipment big screen: No. Checklist (1) by: Jeniffer B. Tuan', 'ADD CHECKLIST', '2025-10-22 02:51:47', 99),
(2608, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-22 02:51:57', 99),
(2609, 'User Logged out', 'LOGOUT', '2025-10-22 02:51:59', 114),
(2610, 'User Logged out', 'LOGOUT', '2025-10-22 02:53:37', 77),
(2611, 'User Logged in', 'LOGIN', '2025-10-22 02:54:15', 78),
(2612, 'Equipment Unit Unit bs-0001 released by: Virjillo Datario', 'RELEASE', '2025-10-22 02:55:08', 78),
(2613, 'User Logged in', 'LOGIN', '2025-10-22 02:55:25', 78),
(2614, 'Virjillo Datario checked (sample checklist)', 'CHECK', '2025-10-22 02:56:45', 78),
(2615, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 02:59:22', 78),
(2616, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 02:59:30', 78),
(2617, 'Equipment (Chairs) has increase quantity: 490', 'UPDATE QUANTITY', '2025-10-22 03:00:11', 99),
(2618, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 03:00:48', 78),
(2619, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 03:01:30', 78),
(2620, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 03:03:03', 78),
(2621, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 03:03:58', 78),
(2622, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 03:06:41', 78),
(2623, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-22 03:06:45', 78),
(2624, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-22 03:06:47', 78),
(2625, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-22 03:06:48', 78),
(2626, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 03:06:55', 78),
(2627, 'Equipment Chairs returned by: Virjillo Datario - condition: Damage (good: 200, bad: 50) - remarks: Guba ni', 'RETURN', '2025-10-22 03:11:29', 78),
(2628, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-22 03:11:31', 78),
(2629, 'Equipment Unit Unit bs-0001 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-22 03:12:25', 78),
(2630, 'Reservation (as) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-22 03:12:29', 78),
(2631, 'Equipment Unit (big screen - SN: bs-0001) availability set to Available by: Jeniffer B. Tuan', 'UPDATE AVAILABILITY', '2025-10-22 03:12:46', 99),
(2632, 'User Virjillo Datario sent a message to Jeniffer B. Tuan: \'Hello sir\'', 'SEND MESSAGE', '2025-10-22 03:14:10', 78),
(2633, 'Marked notifications as read (count: 30)', 'READ NOTIFICATION', '2025-10-22 03:14:50', 78),
(2634, 'User Logged out', 'LOGOUT', '2025-10-22 03:15:12', 78),
(2635, 'User: Gian Legaspi has been updated. Changes: password: changed', 'UPDATE USER', '2025-10-22 03:15:39', NULL),
(2636, 'User Logged in', 'LOGIN', '2025-10-22 03:15:48', 111),
(2637, 'Venue Request submitted', 'Reservation Request', '2025-10-22 03:16:04', 111),
(2638, 'Marked notifications as read (count: 19)', 'READ NOTIFICATION', '2025-10-22 03:16:27', 99),
(2639, 'Vehicle Request submitted', 'Reservation Request', '2025-10-22 04:23:50', 96),
(2640, 'User Logged out', 'LOGOUT', '2025-10-22 04:51:07', 111),
(2641, 'User Logged in', 'LOGIN', '2025-10-22 04:55:44', 114),
(2642, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 04:55:57', 114),
(2643, 'Reservation \'Asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 05:01:50', 99),
(2644, 'Profile updated for: Jeniffer B. Tuan (Changes: Title: \'\' -> \'1\')', 'UPDATE PROFILE', '2025-10-22 05:10:24', 99),
(2645, 'Reservation \'Asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 05:18:38', 99),
(2646, 'User Logged out', 'LOGOUT', '2025-10-22 05:24:31', 114),
(2647, 'User Logged in', 'LOGIN', '2025-10-22 05:24:36', 99),
(2648, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-22 05:29:43', 99),
(2649, 'Profile updated for: Jeniffer B. Tuan (Changes: Title: \'1\' -> \'\')', 'UPDATE PROFILE', '2025-10-22 05:33:00', 99),
(2650, 'Profile updated for: Jeniffer B. Tuan (Changes: Title: \'\' -> \'1\')', 'UPDATE PROFILE', '2025-10-22 05:35:55', 99),
(2651, 'Marked notifications as read (count: 36)', 'READ NOTIFICATION', '2025-10-22 06:04:55', 96),
(2652, 'Marked notifications as read (count: 12)', 'READ NOTIFICATION', '2025-10-22 06:10:02', 99),
(2653, 'User Logged out', 'LOGOUT', '2025-10-22 06:10:05', 114),
(2654, 'User Logged in', 'LOGIN', '2025-10-22 06:10:16', 77),
(2655, 'Venue Request submitted', 'Reservation Request', '2025-10-22 06:10:45', 77),
(2656, 'Venue Request submitted', 'Reservation Request', '2025-10-22 06:14:33', 77),
(2657, 'Venue Request submitted', 'Reservation Request', '2025-10-22 06:16:51', 77),
(2658, 'Venue Request submitted', 'Reservation Request', '2025-10-22 06:27:05', 77),
(2659, 'User Logged out', 'LOGOUT', '2025-10-22 06:28:00', 77),
(2660, 'User Logged in', 'LOGIN', '2025-10-22 06:28:09', 114),
(2661, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 06:28:25', 114),
(2662, 'Reservation \'asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 06:28:35', 99),
(2663, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-22 06:28:41', 99),
(2664, 'User Logged out', 'LOGOUT', '2025-10-22 06:28:57', 96),
(2665, 'User Logged in', 'LOGIN', '2025-10-22 06:29:05', 111),
(2666, 'Venue Request submitted', 'Reservation Request', '2025-10-22 06:29:26', 111),
(2667, 'Marked notifications as read (count: 23)', 'READ NOTIFICATION', '2025-10-22 06:29:44', 114),
(2668, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-22 06:29:47', 114),
(2669, 'User Logged out', 'LOGOUT', '2025-10-22 06:30:02', 111),
(2670, 'User Logged in', 'LOGIN', '2025-10-22 06:30:10', 78),
(2671, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:30:13', 78),
(2672, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:30:13', 78),
(2673, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-22 06:30:15', 78),
(2674, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-22 06:30:16', 78),
(2675, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-22 06:30:18', 78),
(2676, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-22 06:30:25', 78),
(2677, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-22 06:30:26', 78),
(2678, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:30:50', 78),
(2679, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:34:32', 78),
(2680, 'Equipment Chairs returned by: Virjillo Datario - condition: Missing (good: 200, bad: 50) - remarks: 50', 'RETURN', '2025-10-22 06:34:48', 78),
(2681, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: For Inspection - remarks: 50', 'RETURN', '2025-10-22 06:34:58', 78),
(2682, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:40:44', 78),
(2683, 'Equipment Chairs returned by: Virjillo Datario - condition: Missing (good: 50, bad: 200) - remarks: asd', 'RETURN', '2025-10-22 06:41:15', 78),
(2684, 'Equipment Chairs returned by: Virjillo Datario - condition: Damage (good: 50, bad: 200)', 'RETURN', '2025-10-22 06:42:55', 78),
(2685, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:44:45', 78),
(2686, 'Equipment Chairs returned by: Virjillo Datario - condition: Damage (good: 200, bad: 50)', 'RETURN', '2025-10-22 06:45:25', 78),
(2687, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:48:31', 78),
(2688, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-22 06:48:31', 78),
(2689, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-22 06:48:34', 78),
(2690, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-22 06:48:35', 78),
(2691, 'User Logged out', 'LOGOUT', '2025-10-22 10:42:42', 78),
(2692, 'User Logged in', 'LOGIN', '2025-10-22 10:42:53', 77),
(2693, 'Venue Request submitted', 'Reservation Request', '2025-10-22 10:43:08', 77),
(2694, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-22 10:53:25', 99),
(2695, 'Venue Request submitted', 'Reservation Request', '2025-10-22 11:00:17', 77),
(2696, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-22 11:08:04', 99),
(2697, 'Venue Request submitted', 'Reservation Request', '2025-10-22 11:20:35', 77),
(2698, 'Updated Vehicle: 2002asda', 'UPDATE VEHICLE', '2025-10-22 11:21:56', 99),
(2699, 'Venue Request submitted', 'Reservation Request', '2025-10-22 11:47:18', 96),
(2700, 'User Logged in', 'LOGIN', '2025-10-22 11:47:41', 114),
(2701, 'Reservation \'Asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 11:48:03', 99),
(2702, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 11:48:07', 114),
(2703, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-22 11:48:12', 114),
(2704, 'Vehicle Request submitted', 'Reservation Request', '2025-10-22 11:48:53', 96),
(2705, 'Reservation \'Asd\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 11:49:04', 99),
(2706, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 11:49:09', 114),
(2707, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-22 11:52:40', 114),
(2708, 'User Logged out', 'LOGOUT', '2025-10-22 11:53:15', 114),
(2709, 'User Logged in', 'LOGIN', '2025-10-22 11:53:25', 78),
(2710, 'User Logged out', 'LOGOUT', '2025-10-22 11:53:47', 78),
(2711, 'User Logged in', 'LOGIN', '2025-10-22 11:53:55', 77),
(2712, 'Marked notifications as read (count: 29)', 'READ NOTIFICATION', '2025-10-22 11:56:29', 77),
(2713, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-22 11:56:58', 99),
(2714, 'User Logged in', 'LOGIN', '2025-10-22 15:44:53', 114),
(2715, 'Vehicle Request submitted', 'Reservation Request', '2025-10-22 15:48:54', 77),
(2716, 'Reservation \'SAMPLE TRIP\' approved by Jeniffer B Tuan', 'APPROVE', '2025-10-22 15:51:26', 99),
(2717, 'Reservation \'SAMPLE TRIP\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-22 15:51:39', 114),
(2718, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-22 15:51:46', 114),
(2719, 'User Logged out', 'LOGOUT', '2025-10-22 15:51:53', 99),
(2720, 'User Logged in', 'LOGIN', '2025-10-22 15:52:02', 78),
(2721, 'Vehicle Corollass (2002asda) released by: Virjillo Datario', 'RELEASE', '2025-10-22 15:52:06', 78),
(2722, 'Virjillo Datario checked (asd)', 'CHECK', '2025-10-22 15:52:11', 78),
(2723, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-22 15:52:19', 78),
(2724, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-22 15:52:21', 78),
(2725, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-22 15:52:22', 78),
(2726, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-22 16:04:16', 114),
(2727, 'User Logged out', 'LOGOUT', '2025-10-22 16:11:16', 114),
(2728, 'User Logged out', 'LOGOUT', '2025-10-22 16:16:01', 78),
(2729, 'User Logged in', 'LOGIN', '2025-10-22 16:16:07', 99),
(2730, 'Profile updated for: Jeniffer B. Tubaon (Changes: Last Name: \'Tuan\' -> \'Tubaon\')', 'UPDATE PROFILE', '2025-10-22 16:16:18', 99),
(2731, 'User Logged in', 'LOGIN', '2025-10-22 16:17:03', 114),
(2732, 'User Logged out', 'LOGOUT', '2025-10-22 16:17:10', 114),
(2733, 'Created Venue : Main West Ground', 'CREATE', '2025-10-22 16:23:28', 99),
(2734, 'Created Vehicle : 2025', 'CREATE', '2025-10-22 16:25:17', 99),
(2735, 'Updated Vehicle: \'2025\' -> \'2026\'', 'UPDATE VEHICLE', '2025-10-22 16:25:29', 99),
(2736, 'Created Equipment : New Equipment', 'CREATE', '2025-10-22 16:26:56', 99),
(2737, 'Updated Equipment: New Equipment', 'UPDATE', '2025-10-22 16:27:33', 99),
(2738, 'Equipment (New Equipment) has new Serial Number: NE-001', 'CREATE UNIT', '2025-10-22 16:30:27', 99),
(2739, 'User: Sample  S. Sample has been created', 'CREATE USER', '2025-10-22 16:36:30', NULL),
(2740, 'Created Holiday: \'Sample Holiday\' on \'2025-10-22\'', 'CREATE', '2025-10-22 16:38:30', 99),
(2741, 'Updated Department: CIT (Academic) -> CITE (Academic)', 'UPDATE', '2025-10-22 16:40:21', 99),
(2742, 'Added Checklist to venue MS Stage: No. Checklist (2) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2025-10-22 16:41:30', 99),
(2743, 'Unarchived Vehicle resource(s): 1', 'UNARCHIVE', '2025-10-22 16:42:56', 99),
(2744, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-22 16:44:09', 99),
(2745, 'Reservation Report (October 2025) generated: 5 record(s) found by: Jeniffer B. Tubaon', 'GENERATE REPORT', '2025-10-22 17:08:40', 99),
(2746, 'User Logged in', 'LOGIN', '2025-10-22 17:12:48', 77),
(2747, 'Venue Request submitted', 'Reservation Request', '2025-10-22 17:20:13', 77),
(2748, 'User Logged out', 'LOGOUT', '2025-10-22 17:20:54', 77),
(2749, 'User Logged in', 'LOGIN', '2025-10-22 17:21:34', 96),
(2750, 'Venue Request submitted', 'Reservation Request', '2025-10-22 17:24:35', 96),
(2751, 'User Logged out', 'LOGOUT', '2025-10-22 17:26:42', 99),
(2752, 'User Logged in', 'LOGIN', '2025-10-22 17:26:49', 78),
(2753, 'User Logged out', 'LOGOUT', '2025-10-22 17:28:05', 78),
(2754, 'User Logged in', 'LOGIN', '2025-10-22 17:28:13', 99),
(2755, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-22 17:29:16', 99),
(2756, 'User Logged out', 'LOGOUT', '2025-10-22 17:38:20', 77),
(2757, 'User Logged out', 'LOGOUT', '2025-10-22 20:54:55', 99),
(2758, 'User Logged in', 'LOGIN', '2025-10-22 20:55:04', 77),
(2759, 'Venue Request submitted', 'Reservation Request', '2025-10-22 21:07:08', 77),
(2760, 'User Logged out', 'LOGOUT', '2025-10-22 21:07:35', 77),
(2761, 'User Logged in', 'LOGIN', '2025-10-22 21:07:43', 96),
(2762, 'User Logged in', 'LOGIN', '2025-10-22 21:08:43', 83),
(2763, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-22 21:13:51', 96),
(2764, 'User Logged out', 'LOGOUT', '2025-10-22 21:13:53', 96),
(2765, 'User Logged in', 'LOGIN', '2025-10-22 21:16:05', 99),
(2766, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-22 21:16:14', 99),
(2767, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-22 21:32:59', 99),
(2768, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-22 21:34:08', 99),
(2769, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-22 21:34:18', 99),
(2770, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-22 21:34:20', 99),
(2771, 'Deactivated equipment unit(s): 1', 'DEACTIVATE_UNIT', '2025-10-22 21:39:22', 99),
(2772, 'Reactivated equipment unit(s): 1', 'REACTIVATE_UNIT', '2025-10-22 21:39:35', 99),
(2773, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-22 21:39:52', 99),
(2774, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-10-22 21:54:17', 83),
(2775, 'Venue Request submitted', 'Reservation Request', '2025-10-22 21:54:51', 83),
(2776, 'User Logged out', 'LOGOUT', '2025-10-22 21:59:43', 83),
(2777, 'User Logged in', 'LOGIN', '2025-10-22 21:59:55', 114),
(2778, 'Reservation \'IT DAYS\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-22 22:00:15', 99),
(2779, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-22 22:00:26', 99),
(2780, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-22 22:00:32', 99),
(2781, 'Reservation \'IT GRADUATE\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-22 22:00:43', 99),
(2782, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-22 22:00:50', 99),
(2783, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-22 22:00:56', 99),
(2784, 'User Logged in', 'LOGIN', '2025-10-22 22:01:20', 77),
(2785, 'Venue Request submitted', 'Reservation Request', '2025-10-22 22:01:36', 77),
(2786, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-22 22:10:57', 114),
(2787, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-22 22:13:26', 99),
(2788, 'User Logged out', 'LOGOUT', '2025-10-22 22:13:31', 114),
(2789, 'User Logged in', 'LOGIN', '2025-10-22 22:13:45', 114),
(2790, 'User Logged out', 'LOGOUT', '2025-10-22 23:24:34', 114),
(2791, 'User Logged in', 'LOGIN', '2025-10-22 23:24:44', 96),
(2792, 'Venue Request submitted', 'Reservation Request', '2025-10-22 23:27:42', 96),
(2793, 'Equipment Request submitted', 'Reservation Request', '2025-10-22 23:30:57', 96),
(2794, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-22 23:31:24', 99),
(2795, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-23 00:35:30', 99),
(2796, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-23 00:49:01', 96),
(2797, 'User Logged out', 'LOGOUT', '2025-10-23 00:49:03', 96),
(2798, 'User Logged in', 'LOGIN', '2025-10-23 14:11:57', 77),
(2799, 'Marked notifications as read (count: 14)', 'READ NOTIFICATION', '2025-10-23 14:23:50', 77),
(2800, 'User Logged out', 'LOGOUT', '2025-10-23 14:30:04', 77),
(2801, 'User Logged in', 'LOGIN', '2025-10-23 14:30:15', 114),
(2802, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-23 14:30:33', 114),
(2803, 'User Logged out', 'LOGOUT', '2025-10-23 14:38:01', 114),
(2804, 'User Logged in', 'LOGIN', '2025-10-23 14:38:16', 77),
(2805, 'User Logged in', 'LOGIN', '2025-10-23 21:04:05', 77),
(2806, 'Vehicle Request submitted', 'Reservation Request', '2025-10-23 21:23:07', 77),
(2807, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-23 21:26:27', 99),
(2808, 'User Logged out', 'LOGOUT', '2025-10-23 21:49:40', 77),
(2809, 'User Logged in', 'LOGIN', '2025-10-23 21:49:48', 78),
(2810, 'Vehicle Corollass (2002asda) returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-23 22:00:21', 78),
(2811, 'Reservation (SAMPLE TRIP) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-23 22:00:23', 78),
(2812, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-10-23 22:09:46', 78),
(2813, 'User Logged out', 'LOGOUT', '2025-10-23 22:09:47', 78),
(2814, 'User: Crestal s T. Panhay has been updated. Changes: first name: Crestal  -> Crestal s', 'UPDATE USER', '2025-10-23 22:11:06', NULL),
(2815, 'User: Fatima A. Vergel has been updated. Changes: user level: 18 -> 19', 'UPDATE USER', '2025-10-23 22:11:20', NULL),
(2816, 'Updated Holiday: \'Araw ng Kagitingans\' on \'2024-05-07\' -> \'Araw ng Kagitingans\' on \'2025-05-07\'', 'UPDATE', '2025-10-23 22:11:33', 99),
(2817, 'Updated Vehicle Make: \'Hyundai\' -> \'Hyundais\'', 'UPDATE', '2025-10-23 22:11:38', 99),
(2818, 'Updated Vehicle Category: \'Light Commercial Vehicle LCV\' -> \'Light Commercial Vehicle LCVs\'', 'UPDATE', '2025-10-23 22:11:43', 99),
(2819, 'Updated Vehicle Model: \'Corollass\' -> \'Corollasssss\'', 'UPDATE', '2025-10-23 22:11:50', 99),
(2820, 'Updated Equipment Category: \'edited\' -> \'editeds\'', 'UPDATE', '2025-10-23 22:11:55', 99),
(2821, 'User Logged in', 'LOGIN', '2025-10-24 00:21:12', 77),
(2822, 'User Logged out', 'LOGOUT', '2025-10-24 00:31:34', 77),
(2823, 'User Logged in', 'LOGIN', '2025-10-24 00:31:47', 114),
(2824, 'Venue Request submitted', 'Reservation Request', '2025-10-24 00:32:19', 77),
(2825, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-24 00:34:39', 114),
(2826, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-24 00:34:46', 99),
(2827, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-24 00:34:53', 99),
(2828, 'User Logged out', 'LOGOUT', '2025-10-24 00:34:55', 114),
(2829, 'User Logged in', 'LOGIN', '2025-10-24 00:35:20', 78),
(2830, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:38:59', 78),
(2831, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:40:39', 78),
(2832, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:45:13', 78),
(2833, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:46:06', 78),
(2834, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:48:13', 78),
(2835, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-24 00:48:16', 78),
(2836, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-24 00:48:17', 78),
(2837, 'User Logged out', 'LOGOUT', '2025-10-24 00:50:23', 78),
(2838, 'User Logged in', 'LOGIN', '2025-10-24 00:50:33', 114),
(2839, 'Equipment Request submitted', 'Reservation Request', '2025-10-24 00:51:04', 77),
(2840, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-24 00:51:46', 114),
(2841, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-24 00:51:52', 99),
(2842, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-24 00:51:59', 99),
(2843, 'User Logged out', 'LOGOUT', '2025-10-24 00:52:12', 114),
(2844, 'User Logged in', 'LOGIN', '2025-10-24 00:52:31', 78),
(2845, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:53:01', 78),
(2846, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:53:01', 78),
(2847, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:53:01', 78),
(2848, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-24 00:53:09', 78),
(2849, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-24 00:53:12', 78),
(2850, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-24 00:53:13', 78),
(2851, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-24 00:53:14', 78),
(2852, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:54:01', 78),
(2853, 'Equipment Chairs returned by: Virjillo Datario - condition: Missing (good: 50, bad: 50)', 'RETURN', '2025-10-24 00:54:11', 78),
(2854, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-24 00:54:16', 78),
(2855, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-24 00:54:19', 78),
(2856, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-24 00:54:22', 78),
(2857, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-24 00:56:11', 78),
(2858, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:56:59', 78),
(2859, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:56:59', 78),
(2860, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:57:28', 78),
(2861, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-10-24 00:57:28', 78),
(2862, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-24 01:01:01', 78),
(2863, 'User Logged out', 'LOGOUT', '2025-10-24 01:10:52', 78),
(2864, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-24 08:55:17', 99),
(2865, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-24 08:56:02', 99),
(2866, 'Updated Equipment: \'Monitor X\' -> \'Monitor\'', 'UPDATE', '2025-10-24 08:56:07', 99),
(2867, 'Updated Venue: MULTI PURPOSE HALL', 'UPDATE VENUE', '2025-10-24 09:00:41', 99),
(2868, 'User Logged in', 'LOGIN', '2025-10-24 09:02:11', 114),
(2869, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-10-24 09:03:18', 77),
(2870, 'Venue Request submitted', 'Reservation Request', '2025-10-24 09:06:40', 77),
(2871, 'User Logged out', 'LOGOUT', '2025-10-24 09:14:06', 77),
(2872, 'User Logged in', 'LOGIN', '2025-10-24 09:14:46', 95),
(2873, 'Password updated by: Jeff Henry Condeza', 'UPDATE PASSWORD', '2025-10-24 09:14:56', 95),
(2874, 'User Logged in', 'LOGIN', '2025-10-24 09:15:42', 95),
(2875, 'Password updated by: Jeff Henry Condeza', 'UPDATE PASSWORD', '2025-10-24 09:15:51', 95),
(2876, 'User Logged in', 'LOGIN', '2025-10-24 09:32:01', 82),
(2877, 'Reservation \'asd\' approved by Gerry J Cano', 'APPROVE', '2025-10-24 09:32:04', 82),
(2878, 'User Logged out', 'LOGOUT', '2025-10-24 09:32:11', 82),
(2879, 'User Logged in', 'LOGIN', '2025-10-24 09:33:07', 83),
(2880, 'Reservation \'asd\' approved by Rizhaly B Maandig', 'APPROVE', '2025-10-24 09:33:13', 83),
(2881, 'User Logged out', 'LOGOUT', '2025-10-24 09:33:26', 83),
(2882, 'User Logged in', 'LOGIN', '2025-10-24 09:33:42', 84),
(2883, 'Reservation \'asd\' approved by Jonathan  Reyes', 'APPROVE', '2025-10-24 09:33:45', 84),
(2884, 'User Logged out', 'LOGOUT', '2025-10-24 09:33:58', 84),
(2885, 'User Logged in', 'LOGIN', '2025-10-24 09:34:08', 85),
(2886, 'Reservation \'asd\' approved by Clyde  F Gamolo', 'APPROVE', '2025-10-24 09:34:12', 85),
(2887, 'User Logged out', 'LOGOUT', '2025-10-24 09:34:19', 85),
(2888, 'User Logged in', 'LOGIN', '2025-10-24 09:35:22', 81),
(2889, 'Reservation \'asd\' approved by Gail D Norway', 'APPROVE', '2025-10-24 09:35:25', 81),
(2890, 'User: Rosita  P. Gutierrez has been created', 'CREATE USER', '2025-10-24 09:37:41', NULL),
(2891, 'User Logged out', 'LOGOUT', '2025-10-24 09:37:46', 81),
(2892, 'User Logged in', 'LOGIN', '2025-10-24 09:38:10', 123),
(2893, 'Password updated by: Rosita  P. Gutierrez', 'UPDATE PASSWORD', '2025-10-24 09:38:17', 123),
(2894, 'User Logged in', 'LOGIN', '2025-10-24 09:38:28', 123),
(2895, 'Reservation \'asd\' approved by Rosita  P Gutierrez', 'APPROVE', '2025-10-24 09:38:32', 123),
(2896, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-24 09:38:59', 114),
(2897, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-24 09:39:05', 99),
(2898, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-24 09:39:26', 99),
(2899, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-24 09:39:31', 99),
(2900, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-10-24 09:39:33', 114),
(2901, 'Vehicle Request submitted', 'Reservation Request', '2025-10-24 09:40:00', 123),
(2902, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-24 09:40:16', 114),
(2903, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-24 09:40:31', 99),
(2904, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-24 09:40:41', 99),
(2905, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-24 09:58:34', 99),
(2906, 'Equipment Request submitted', 'Reservation Request', '2025-10-24 10:53:19', 123),
(2907, 'Venue Request submitted', 'Reservation Request', '2025-10-24 10:54:00', 123),
(2908, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-24 10:57:58', 114),
(2909, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-24 10:58:03', 99),
(2910, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2025-10-24 10:59:44', 123),
(2911, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-24 11:00:59', 114),
(2912, 'User Logged out', 'LOGOUT', '2025-10-24 14:53:30', 99),
(2913, 'User Logged in', 'LOGIN', '2025-10-24 14:53:40', 77),
(2914, 'Venue Request submitted', 'Reservation Request', '2025-10-24 14:58:31', 77),
(2915, 'Archived Venue resource(s): 79', 'ARCHIVE', '2025-10-24 20:37:32', 114),
(2916, 'Archived Venue resource(s): 51', 'ARCHIVE', '2025-10-24 20:38:45', 114),
(2917, 'User Logged out', 'LOGOUT', '2025-10-24 20:44:38', 77),
(2918, 'User Logged in', 'LOGIN', '2025-10-24 20:44:46', 99),
(2919, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-24 21:36:43', 99),
(2920, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-24 21:36:46', 99),
(2921, 'Reactivated Vehicle Make: 1 item(s)', 'REACTIVATE', '2025-10-24 21:40:17', 99),
(2922, 'Reactivated Vehicle Make: 1 item(s)', 'REACTIVATE', '2025-10-24 21:40:19', 99),
(2923, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-24 21:45:49', 99),
(2924, 'Deactivated Equipment Category: 1 item(s)', 'DEACTIVATE', '2025-10-24 21:45:57', 99),
(2925, 'Deactivated Equipment Category: 1 item(s)', 'DEACTIVATE', '2025-10-24 21:45:59', 99),
(2926, 'User Logged out', 'LOGOUT', '2025-10-24 21:52:35', 114),
(2927, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-24 22:09:36', 99),
(2928, 'Reactivated Holiday: 1 item(s)', 'REACTIVATE', '2025-10-24 22:41:40', 99),
(2929, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-24 22:41:48', 99),
(2930, 'User Logged in', 'LOGIN', '2025-10-24 22:42:36', 114),
(2931, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-24 22:49:24', 99),
(2932, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-24 22:49:28', 99),
(2933, 'Venue Request submitted', 'Reservation Request', '2025-10-24 23:51:15', 123),
(2934, 'User Logged out', 'LOGOUT', '2025-10-24 23:56:20', 114),
(2935, 'User Logged in', 'LOGIN', '2025-10-24 23:56:48', 77),
(2936, 'Venue Request submitted', 'Reservation Request', '2025-10-24 23:57:16', 123),
(2937, 'Venue Request submitted', 'Reservation Request', '2025-10-25 00:25:20', 123),
(2938, 'Venue Request submitted', 'Reservation Request', '2025-10-25 00:29:51', 123),
(2939, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 00:32:17', 77),
(2940, 'User Logged out', 'LOGOUT', '2025-10-25 01:03:53', 99),
(2941, 'User Logged in', 'LOGIN', '2025-10-25 01:04:02', 77),
(2942, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:12:32', 123),
(2943, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:29:39', 77),
(2944, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:30:31', 77),
(2945, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:33:16', 77),
(2946, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:34:19', 123),
(2947, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:35:26', 77),
(2948, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:35:29', 123),
(2949, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:38:38', 123),
(2950, 'Venue Request submitted', 'Reservation Request', '2025-10-25 01:40:46', 123),
(2951, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:42:12', 77),
(2952, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:44:57', 77),
(2953, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:47:26', 123),
(2954, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:49:52', 77),
(2955, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:51:21', 123),
(2956, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:52:50', 123),
(2957, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 01:52:55', 77),
(2958, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:02:01', 77),
(2959, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:02:11', 123),
(2960, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:09:00', 77),
(2961, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:09:06', 123),
(2962, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:09:56', 123),
(2963, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:15:47', 123),
(2964, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:18:58', 123),
(2965, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:36:51', 77),
(2966, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:37:59', 123),
(2967, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:38:05', 77),
(2968, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 02:39:09', 77),
(2969, 'User Logged out', 'LOGOUT', '2025-10-25 02:43:34', 77),
(2970, 'User Logged in', 'LOGIN', '2025-10-25 02:43:46', 99),
(2971, 'Marked notifications as read (count: 40)', 'READ NOTIFICATION', '2025-10-25 02:43:56', 77),
(2972, 'User Logged out', 'LOGOUT', '2025-10-25 02:44:00', 77),
(2973, 'User Logged in', 'LOGIN', '2025-10-25 02:44:10', 114),
(2974, 'Venue Request submitted', 'Reservation Request', '2025-10-25 02:46:26', 123),
(2975, 'Venue Request submitted', 'Reservation Request', '2025-10-25 02:51:54', 123),
(2976, 'Venue Request submitted', 'Reservation Request', '2025-10-25 02:56:43', 123),
(2977, 'User Logged in', 'LOGIN', '2025-10-25 02:58:27', 77),
(2978, 'User Logged out', 'LOGOUT', '2025-10-25 03:01:40', 96),
(2979, 'User Logged in', 'LOGIN', '2025-10-25 03:03:36', 77),
(2980, 'Venue Request submitted', 'Reservation Request', '2025-10-25 03:05:50', 77),
(2981, 'Venue Request submitted', 'Reservation Request', '2025-10-25 03:07:27', 77),
(2982, 'Venue Request submitted', 'Reservation Request', '2025-10-25 03:11:14', 77),
(2983, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 03:12:54', 77),
(2984, 'Reservation \'ASD\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 03:13:34', 114),
(2985, 'Reservation \'ASD\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 03:13:45', 99),
(2986, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 03:13:50', 99),
(2987, 'User Logged out', 'LOGOUT', '2025-10-25 03:13:59', 99),
(2988, 'User Logged in', 'LOGIN', '2025-10-25 03:14:27', 107),
(2989, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-25 03:48:13', 114),
(2990, 'Marked notifications as read (count: 40)', 'READ NOTIFICATION', '2025-10-25 03:49:46', 114),
(2991, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 04:02:09', 77),
(2992, 'User Logged out', 'LOGOUT', '2025-10-25 04:02:22', 107),
(2993, 'User Logged in', 'LOGIN', '2025-10-25 04:02:29', 99),
(2994, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 04:28:49', 114),
(2995, 'User Logged out', 'LOGOUT', '2025-10-25 05:00:10', 123),
(2996, 'User Logged in', 'LOGIN', '2025-10-25 05:00:18', 77),
(2997, 'Marked notifications as read (count: 40)', 'READ NOTIFICATION', '2025-10-25 05:28:37', 99),
(2998, 'Reservation Report (October 2025) generated: 8 record(s) found by: Jeniffer B. Tubaon', 'GENERATE REPORT', '2025-10-25 05:28:43', 99),
(2999, 'User Logged in', 'LOGIN', '2025-10-25 11:50:11', 114),
(3000, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-25 11:50:44', 77),
(3001, 'Venue Request submitted', 'Reservation Request', '2025-10-25 12:14:36', 77),
(3002, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 12:14:54', 114),
(3003, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 12:15:03', 99),
(3004, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 12:15:11', 99),
(3005, 'User Logged out', 'LOGOUT', '2025-10-25 12:15:29', 77),
(3006, 'User Logged in', 'LOGIN', '2025-10-25 12:15:48', 78),
(3007, 'User Logged out', 'LOGOUT', '2025-10-25 12:18:11', 77),
(3008, 'User Logged in', 'LOGIN', '2025-10-25 12:18:19', 78),
(3009, 'User Logged out', 'LOGOUT', '2025-10-25 12:19:36', 78),
(3010, 'User Logged out', 'LOGOUT', '2025-10-25 12:19:49', 77),
(3011, 'User Logged in', 'LOGIN', '2025-10-25 12:19:56', 78),
(3012, 'User Logged out', 'LOGOUT', '2025-10-25 12:25:17', 78),
(3013, 'User Logged in', 'LOGIN', '2025-10-25 12:25:25', 78),
(3014, 'User Logged out', 'LOGOUT', '2025-10-25 12:25:29', 78),
(3015, 'User Logged in', 'LOGIN', '2025-10-25 12:25:39', 77),
(3016, 'Venue Request submitted', 'Reservation Request', '2025-10-25 12:26:04', 77),
(3017, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 12:26:21', 114),
(3018, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 12:26:31', 99),
(3019, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 12:26:39', 99),
(3020, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-25 12:26:41', 78),
(3021, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-25 12:26:43', 78),
(3022, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-25 12:26:44', 78),
(3023, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 12:27:47', 77),
(3024, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 12:28:10', 114),
(3025, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 12:30:46', 114),
(3026, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 12:33:47', 77),
(3027, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 12:42:58', 99),
(3028, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 12:43:09', 99),
(3029, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 12:49:03', 114),
(3030, 'User Logged out', 'LOGOUT', '2025-10-25 13:03:30', 77),
(3031, 'User Logged in', 'LOGIN', '2025-10-25 13:03:42', 78),
(3032, 'Vehicle Hiace (123) released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:08:12', 78),
(3033, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:08:12', 78),
(3034, 'Vehicle Hiace (123) released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:08:49', 78),
(3035, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:08:49', 78),
(3036, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:08:54', 78),
(3037, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 13:08:56', 78),
(3038, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 13:08:58', 78),
(3039, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-25 13:08:59', 78),
(3040, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-25 13:09:01', 78),
(3041, 'Vehicle L300 (12332) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-25 13:09:58', 78),
(3042, 'Vehicle Hiace (123) returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-25 13:10:01', 78),
(3043, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: For Inspection - remarks: Guba ata ni', 'RETURN', '2025-10-25 13:10:08', 78),
(3044, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-25 13:10:11', 78),
(3045, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-25 13:10:26', 99),
(3046, 'Equipment Unit (Aircon - SN: AR-001) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-25 13:11:20', 99),
(3047, 'User Logged out', 'LOGOUT', '2025-10-25 13:11:30', 78),
(3048, 'User Logged in', 'LOGIN', '2025-10-25 13:11:40', 78),
(3049, 'User Logged out', 'LOGOUT', '2025-10-25 13:11:44', 78),
(3050, 'User Logged in', 'LOGIN', '2025-10-25 13:11:54', 78),
(3051, 'User Logged out', 'LOGOUT', '2025-10-25 13:11:56', 78),
(3052, 'User Logged in', 'LOGIN', '2025-10-25 13:12:06', 77),
(3053, 'Vehicle (12332) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-25 13:12:34', 99),
(3054, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 13:19:25', 77),
(3055, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 13:19:48', 114),
(3056, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 13:20:24', 99),
(3057, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 13:20:32', 99),
(3058, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:20:50', 78),
(3059, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 13:21:42', 99),
(3060, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 13:22:09', 99),
(3061, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:22:20', 78),
(3062, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:23:10', 78),
(3063, 'User Logged out', 'LOGOUT', '2025-10-25 13:23:33', 77),
(3064, 'User Logged in', 'LOGIN', '2025-10-25 13:23:41', 78),
(3065, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:25:02', 78),
(3066, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:28:03', 78),
(3067, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:32:09', 78),
(3068, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-25 13:32:11', 78),
(3069, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-25 13:32:13', 78),
(3070, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-25 13:32:15', 78),
(3071, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:32:50', 78),
(3072, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 13:35:34', 99),
(3073, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:39:05', 78),
(3074, 'User Logged out', 'LOGOUT', '2025-10-25 13:40:56', 78),
(3075, 'User Logged in', 'LOGIN', '2025-10-25 13:41:08', 78),
(3076, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:42:39', 78),
(3077, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:46:02', 78),
(3078, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:49:28', 78),
(3079, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:53:17', 78),
(3080, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-25 13:53:53', 78),
(3081, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-25 13:53:53', 78),
(3082, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-25 13:53:54', 78),
(3083, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 13:54:31', 78),
(3084, 'Equipment Chairs returned by: Virjillo Datario - condition: Damage (good: 200, bad: 200)', 'RETURN', '2025-10-25 13:54:56', 78),
(3085, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-25 13:56:14', 78),
(3086, 'Marked notifications as read (count: 9)', 'READ NOTIFICATION', '2025-10-25 13:59:24', 78),
(3087, 'User Logged out', 'LOGOUT', '2025-10-25 13:59:25', 78),
(3088, 'User Logged in', 'LOGIN', '2025-10-25 13:59:36', 107),
(3089, 'Equipment (Papers) has increase quantity: 10', 'UPDATE QUANTITY', '2025-10-25 14:12:47', 99),
(3090, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-25 14:15:48', 99),
(3091, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-25 14:16:03', 99),
(3092, 'User Logged in', 'LOGIN', '2025-10-25 15:09:58', 77),
(3093, 'Venue Request submitted', 'Reservation Request', '2025-10-25 15:14:08', 77),
(3094, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 15:14:25', 114),
(3095, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 15:35:27', 114),
(3096, 'Venue Request submitted', 'Reservation Request', '2025-10-25 15:53:42', 77),
(3097, 'Marked notifications as read (count: 50)', 'READ NOTIFICATION', '2025-10-25 15:54:00', 77),
(3098, 'User Logged out', 'LOGOUT', '2025-10-25 15:54:02', 77),
(3099, 'User Logged in', 'LOGIN', '2025-10-25 15:54:29', 96),
(3100, 'Reservation \'ASD\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 15:54:44', 114),
(3101, 'Venue Request submitted', 'Reservation Request', '2025-10-25 15:55:28', 96),
(3102, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:04:14', 96),
(3103, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:06:50', 96),
(3104, 'Reservation \'ASD\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 16:09:43', 99),
(3105, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:10:31', 96),
(3106, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:14:20', 96),
(3107, 'User Logged out', 'LOGOUT', '2025-10-25 16:18:36', 107),
(3108, 'User Logged in', 'LOGIN', '2025-10-25 16:18:44', 96),
(3109, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:19:06', 96),
(3110, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:27:54', 96),
(3111, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 16:27:59', 114),
(3112, 'Venue Request submitted', 'Reservation Request', '2025-10-25 16:28:46', 96),
(3113, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 16:28:55', 114),
(3114, 'Marked notifications as read (count: 11)', 'READ NOTIFICATION', '2025-10-25 16:52:55', 99),
(3115, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 16:53:42', 99),
(3116, 'User Logged out', 'LOGOUT', '2025-10-25 17:11:39', 96),
(3117, 'User Logged in', 'LOGIN', '2025-10-25 17:11:48', 77),
(3118, 'Venue Request submitted', 'Reservation Request', '2025-10-25 17:47:06', 77),
(3119, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-25 17:59:52', 77),
(3120, 'User Logged out', 'LOGOUT', '2025-10-25 18:00:43', 77),
(3121, 'User Logged in', 'LOGIN', '2025-10-25 18:00:55', 82),
(3122, 'Venue Request submitted', 'Reservation Request', '2025-10-25 18:01:15', 82),
(3123, 'User Logged out', 'LOGOUT', '2025-10-25 18:01:38', 82),
(3124, 'User Logged in', 'LOGIN', '2025-10-25 18:01:47', 77),
(3125, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-25 18:01:53', 77),
(3126, 'Unarchived Vehicle resource(s): 1', 'UNARCHIVE', '2025-10-25 18:04:42', 99),
(3127, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-10-25 18:04:45', 99),
(3128, 'Reactivated Department: 1 item(s)', 'REACTIVATE', '2025-10-25 18:04:53', 99),
(3129, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-25 21:10:13', 99),
(3130, 'Updated Vehicle: 12332', 'UPDATE VEHICLE', '2025-10-25 21:10:23', 99),
(3131, 'Updated Vehicle: 122222', 'UPDATE VEHICLE', '2025-10-25 21:10:27', 99),
(3132, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-25 21:10:41', 99),
(3133, 'Updated Holiday: \'New Year\'s Day\' on \'2025-01-01\' -> \'New Year\'s Day\' on \'2025-01-02\'', 'UPDATE', '2025-10-25 21:10:47', 99),
(3134, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-25 21:10:49', 99),
(3135, 'Updated Vehicle Make: \'Hyundais\' -> \'Hyundai\'', 'UPDATE', '2025-10-25 21:10:54', 99),
(3136, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-25 21:10:56', 99),
(3137, 'Updated Vehicle Category: \'Light Commercial Vehicle LCVs\' -> \'Light Commercial Vehicle LCV\'', 'UPDATE', '2025-10-25 21:11:02', 99),
(3138, 'Updated Vehicle Category: \'Sedans\' -> \'Sedan\'', 'UPDATE', '2025-10-25 21:11:08', 99),
(3139, 'Deactivated Vehicle Category: 1 item(s)', 'DEACTIVATE', '2025-10-25 21:12:56', 99),
(3140, 'Added Checklist to venue Main West Lobby: No. Checklist (1) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2025-10-25 21:13:12', 99),
(3141, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-25 21:33:32', 99),
(3142, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-10-25 21:34:02', 99),
(3143, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-25 21:35:25', 99),
(3144, 'User Logged out', 'LOGOUT', '2025-10-25 21:39:07', 114),
(3145, 'User Logged in', 'LOGIN', '2025-10-25 21:39:35', 96),
(3146, 'User Logged out', 'LOGOUT', '2025-10-25 21:40:29', 99),
(3147, 'User Logged in', 'LOGIN', '2025-10-25 21:40:36', 77),
(3148, 'Venue Request submitted', 'Reservation Request', '2025-10-25 21:42:20', 77),
(3149, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 21:49:21', 77),
(3150, 'User Logged out', 'LOGOUT', '2025-10-25 21:53:11', 77),
(3151, 'User Logged in', 'LOGIN', '2025-10-25 21:53:21', 99),
(3152, 'Equipment Request submitted', 'Reservation Request', '2025-10-25 21:57:52', 77),
(3153, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-25 22:09:24', 77),
(3154, 'User Logged out', 'LOGOUT', '2025-10-25 22:09:26', 77),
(3155, 'User Logged out', 'LOGOUT', '2025-10-25 22:09:28', 96),
(3156, 'User Logged in', 'LOGIN', '2025-10-25 22:09:36', 99),
(3157, 'User Logged in', 'LOGIN', '2025-10-25 22:09:49', 114),
(3158, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 22:10:29', 114),
(3159, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 22:10:39', 99),
(3160, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 22:10:44', 99),
(3161, 'User Logged out', 'LOGOUT', '2025-10-25 22:10:47', 114),
(3162, 'User Logged in', 'LOGIN', '2025-10-25 22:10:57', 107),
(3163, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-25 22:12:08', 107),
(3164, 'User Logged out', 'LOGOUT', '2025-10-25 22:12:10', 107);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(3165, 'User Logged out', 'LOGOUT', '2025-10-25 22:12:15', 99),
(3166, 'User Logged in', 'LOGIN', '2025-10-25 22:12:23', 107),
(3167, 'User Logged out', 'LOGOUT', '2025-10-25 22:12:36', 107),
(3168, 'User Logged in', 'LOGIN', '2025-10-25 22:13:01', 99),
(3169, 'User Logged out', 'LOGOUT', '2025-10-25 22:13:49', 99),
(3170, 'User Logged in', 'LOGIN', '2025-10-25 22:14:04', 77),
(3171, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 22:14:27', 77),
(3172, 'User Logged in', 'LOGIN', '2025-10-25 22:14:49', 114),
(3173, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 22:15:00', 114),
(3174, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 22:15:16', 99),
(3175, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 22:15:24', 99),
(3176, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-25 22:15:32', 114),
(3177, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 22:23:58', 114),
(3178, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 22:24:09', 99),
(3179, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 22:24:18', 99),
(3180, 'User Logged out', 'LOGOUT', '2025-10-25 22:24:24', 77),
(3181, 'User Logged in', 'LOGIN', '2025-10-25 22:24:33', 78),
(3182, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-25 22:25:08', 78),
(3183, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-25 22:25:08', 78),
(3184, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 22:25:12', 78),
(3185, 'User Logged out', 'LOGOUT', '2025-10-25 22:33:59', 78),
(3186, 'User Logged in', 'LOGIN', '2025-10-25 22:34:12', 77),
(3187, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 22:34:48', 77),
(3188, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 22:35:04', 114),
(3189, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 22:35:20', 99),
(3190, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 22:35:28', 99),
(3191, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-25 22:48:31', 78),
(3192, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-25 22:48:31', 78),
(3193, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-25 22:48:31', 78),
(3194, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 22:49:05', 78),
(3195, 'User Logged out', 'LOGOUT', '2025-10-25 22:49:42', 77),
(3196, 'User Logged in', 'LOGIN', '2025-10-25 22:49:50', 78),
(3197, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 22:55:20', 78),
(3198, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 22:56:49', 78),
(3199, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:07:37', 78),
(3200, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-25 23:07:41', 78),
(3201, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-25 23:07:45', 78),
(3202, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-25 23:07:45', 78),
(3203, 'Updated Vehicle: 12332', 'UPDATE VEHICLE', '2025-10-25 23:17:28', 99),
(3204, 'Updated Vehicle: 122222', 'UPDATE VEHICLE', '2025-10-25 23:17:32', 99),
(3205, 'User Jeniffer B. Tubaon sent a message to Christian Mark S. Valle: \'hello\'', 'SEND MESSAGE', '2025-10-25 23:18:40', 99),
(3206, 'User Logged out', 'LOGOUT', '2025-10-25 23:19:08', 78),
(3207, 'User Logged in', 'LOGIN', '2025-10-25 23:19:49', 109),
(3208, 'Venue Request submitted', 'Reservation Request', '2025-10-25 23:20:42', 109),
(3209, 'Venue Request submitted', 'Reservation Request', '2025-10-25 23:21:14', 109),
(3210, 'Vehicle Request submitted', 'Reservation Request', '2025-10-25 23:22:21', 109),
(3211, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 23:22:55', 114),
(3212, 'Reservation \'Asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 23:22:59', 99),
(3213, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:23:05', 99),
(3214, 'Reservation \'Add\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 23:23:13', 114),
(3215, 'Reservation \'Add\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 23:23:21', 99),
(3216, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:23:29', 99),
(3217, 'User Logged in', 'LOGIN', '2025-10-25 23:23:44', 82),
(3218, 'Reservation \'Asd\' approved by Gerry J Cano', 'APPROVE', '2025-10-25 23:23:47', 82),
(3219, 'User Logged out', 'LOGOUT', '2025-10-25 23:23:52', 82),
(3220, 'User Logged in', 'LOGIN', '2025-10-25 23:23:59', 83),
(3221, 'Reservation \'Asd\' approved by Rizhaly B Maandig', 'APPROVE', '2025-10-25 23:24:03', 83),
(3222, 'User Logged out', 'LOGOUT', '2025-10-25 23:24:21', 83),
(3223, 'User Logged in', 'LOGIN', '2025-10-25 23:24:53', 84),
(3224, 'Reservation \'Asd\' approved by Jonathan  Reyes', 'APPROVE', '2025-10-25 23:24:58', 84),
(3225, 'User Logged out', 'LOGOUT', '2025-10-25 23:25:00', 84),
(3226, 'User Logged in', 'LOGIN', '2025-10-25 23:25:07', 85),
(3227, 'Reservation \'Asd\' approved by Clyde  F Gamolo', 'APPROVE', '2025-10-25 23:25:25', 85),
(3228, 'User Logged out', 'LOGOUT', '2025-10-25 23:25:27', 85),
(3229, 'User Logged in', 'LOGIN', '2025-10-25 23:26:27', 123),
(3230, 'Reservation \'Asd\' approved by Rosita  P Gutierrez', 'APPROVE', '2025-10-25 23:26:40', 123),
(3231, 'User Logged out', 'LOGOUT', '2025-10-25 23:26:46', 123),
(3232, 'User Logged in', 'LOGIN', '2025-10-25 23:26:54', 81),
(3233, 'Reservation \'Asd\' approved by Gail D Norway', 'APPROVE', '2025-10-25 23:26:57', 81),
(3234, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:27:00', 78),
(3235, 'Vehicle Hiace (11) released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:27:00', 78),
(3236, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:28:01', 78),
(3237, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 23:28:47', 114),
(3238, 'Reservation \'Asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 23:28:55', 99),
(3239, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:29:02', 99),
(3240, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:29:12', 78),
(3241, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:29:18', 78),
(3242, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:29:18', 78),
(3243, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:29:59', 78),
(3244, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:33:24', 78),
(3245, 'Reservation (Add) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-25 23:34:38', NULL),
(3246, 'Updated Venue: Roof Deck', 'UPDATE VENUE', '2025-10-25 23:37:23', 99),
(3247, 'Equipment (Chairs) has increase quantity: 599', 'UPDATE QUANTITY', '2025-10-25 23:37:37', 99),
(3248, 'Updated Vehicle: 11', 'UPDATE VEHICLE', '2025-10-25 23:37:48', 99),
(3249, 'Updated Vehicle: 12332', 'UPDATE VEHICLE', '2025-10-25 23:37:53', 99),
(3250, 'Updated Vehicle: 200000222', 'UPDATE VEHICLE', '2025-10-25 23:37:58', 99),
(3251, 'Venue Request submitted', 'Reservation Request', '2025-10-25 23:38:49', 109),
(3252, 'Reservation \'Asx\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 23:39:08', 114),
(3253, 'Reservation \'Asx\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 23:39:11', 99),
(3254, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:39:15', 99),
(3255, 'Venue Request submitted', 'Reservation Request', '2025-10-25 23:39:51', 109),
(3256, 'Reservation \'Ass\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-25 23:40:22', 114),
(3257, 'Reservation \'Ass\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-25 23:40:29', 99),
(3258, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:40:32', 99),
(3259, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:40:51', 78),
(3260, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:40:54', 78),
(3261, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:41:35', 99),
(3262, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-25 23:41:55', 99),
(3263, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-25 23:47:00', 78),
(3264, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-26 00:04:52', 78),
(3265, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-26 00:04:54', 78),
(3266, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-26 00:04:55', 78),
(3267, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 00:04:58', 78),
(3268, 'Reservation (Asx) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 00:05:00', 78),
(3269, 'Virjillo Datario checked (Kani)', 'CHECK', '2025-10-26 00:05:04', 78),
(3270, 'Venue Roof Deck returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 00:05:06', 78),
(3271, 'Reservation (Ass) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 00:05:07', 78),
(3272, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-26 00:12:35', 99),
(3273, 'Venue Request submitted', 'Reservation Request', '2025-10-26 00:12:56', 81),
(3274, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 00:13:34', 114),
(3275, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 00:13:39', 99),
(3276, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 00:13:43', 99),
(3277, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-26 00:13:58', NULL),
(3278, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 00:21:19', 109),
(3279, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 00:21:34', 114),
(3280, 'Reservation \'Asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 00:21:46', 99),
(3281, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 00:21:50', 99),
(3282, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-26 00:29:47', 78),
(3283, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-26 00:29:47', 78),
(3284, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-26 00:29:47', 78),
(3285, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 00:29:53', 78),
(3286, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 00:29:55', 78),
(3287, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 00:30:47', 78),
(3288, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 00:30:50', 78),
(3289, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-26 00:30:51', 78),
(3290, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 00:30:57', 78),
(3291, 'Vehicle L300 (200000222) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 00:54:55', 78),
(3292, 'Vehicle L300 (12332) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 00:54:59', 78),
(3293, 'Vehicle Hiace (122222) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 00:55:02', 78),
(3294, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: Missing', 'RETURN', '2025-10-26 00:55:05', 78),
(3295, 'Reservation (Asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 00:55:07', 78),
(3296, 'Equipment Unit (Aircon - SN: AR-001) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 00:55:25', 99),
(3297, 'Vehicle (122222) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 00:55:28', 99),
(3298, 'Vehicle (12332) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 00:55:29', 99),
(3299, 'Vehicle (200000222) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 00:55:32', 99),
(3300, 'Venue (Auditorium) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 00:55:34', 99),
(3301, 'User Logged out', 'LOGOUT', '2025-10-26 00:56:51', 81),
(3302, 'User Logged in', 'LOGIN', '2025-10-26 00:57:08', 109),
(3303, 'Marked notifications as read (count: 12)', 'READ NOTIFICATION', '2025-10-26 00:57:18', 109),
(3304, 'Venue Request submitted', 'Reservation Request', '2025-10-26 01:46:23', 109),
(3305, 'Reservation \'Asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 01:48:47', 114),
(3306, 'Reservation \'Asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 01:49:02', 99),
(3307, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 01:49:10', 99),
(3308, 'User Logged out', 'LOGOUT', '2025-10-26 01:50:26', 109),
(3309, 'User Logged in', 'LOGIN', '2025-10-26 01:50:42', 78),
(3310, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-26 01:50:45', 78),
(3311, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 01:50:45', 78),
(3312, 'Virjillo Datario checked (Kani)', 'CHECK', '2025-10-26 01:50:50', 78),
(3313, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 01:50:52', 78),
(3314, 'Venue Roof Deck returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 01:52:51', 78),
(3315, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: For Inspection - remarks: Basta kani', 'RETURN', '2025-10-26 01:52:57', 78),
(3316, 'Reservation (Asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 01:53:01', 78),
(3317, 'Equipment Unit (Big Sound System - SN: BSS-001) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 01:54:44', 99),
(3318, 'Venue (Roof Deck) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 01:54:49', 99),
(3319, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 01:55:05', 78),
(3320, 'User Logged out', 'LOGOUT', '2025-10-26 02:02:22', 78),
(3321, 'User Logged in', 'LOGIN', '2025-10-26 02:02:48', 109),
(3322, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 02:09:59', 109),
(3323, 'Reservation \'Jsjsd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 02:10:17', 114),
(3324, 'Reservation \'Jsjsd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 02:10:20', 99),
(3325, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 02:10:25', 99),
(3326, 'Equipment Unit Unit BLK-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 02:10:33', 78),
(3327, 'Equipment Unit Unit CCM-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 02:10:33', 78),
(3328, 'Virjillo Datario checked (Check If Available)', 'CHECK', '2025-10-26 02:10:36', 78),
(3329, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 02:10:37', 78),
(3330, 'Virjillo Datario checked (Check if functional)', 'CHECK', '2025-10-26 02:10:38', 78),
(3331, 'Equipment Unit Unit BLK-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 02:11:12', 78),
(3332, 'Equipment Unit Unit CCM-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 02:11:14', 78),
(3333, 'Reservation (Jsjsd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 02:11:15', 78),
(3334, 'Marked notifications as read (count: 8)', 'READ NOTIFICATION', '2025-10-26 02:31:20', 109),
(3335, 'Venue Request submitted', 'Reservation Request', '2025-10-26 02:44:17', 109),
(3336, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 02:46:49', 109),
(3337, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 02:51:30', 109),
(3338, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 02:52:08', 109),
(3339, 'Reservation \'Jaisis\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 02:52:28', 114),
(3340, 'Reservation \'NJJ\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 02:52:34', 114),
(3341, 'Reservation \'NJJ\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 02:52:50', 99),
(3342, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 02:52:55', 99),
(3343, 'Venue Request submitted', 'Reservation Request', '2025-10-26 02:54:06', 109),
(3344, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 02:55:43', 109),
(3345, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 03:02:50', 109),
(3346, 'Reservation \'Jijh\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 03:03:16', 114),
(3347, 'Reservation \'Jijh\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 03:03:20', 99),
(3348, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 03:03:24', 99),
(3349, 'Reservation \'Jsjdjd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 03:03:29', 114),
(3350, 'Reservation \'Jsjdjd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 03:03:37', 99),
(3351, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 03:03:47', 99),
(3352, 'User Logged out', 'LOGOUT', '2025-10-26 03:03:54', 109),
(3353, 'User Logged in', 'LOGIN', '2025-10-26 03:04:11', 78),
(3354, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-26 03:04:19', 78),
(3355, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 03:04:26', 78),
(3356, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-10-26 03:04:31', 78),
(3357, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 03:04:36', 78),
(3358, 'Equipment Unit Unit BSS-002 released by: Virjillo Datario', 'RELEASE', '2025-10-26 03:04:40', 78),
(3359, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 03:04:42', 78),
(3360, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 03:04:46', 78),
(3361, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 03:04:56', 78),
(3362, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 03:05:57', 78),
(3363, 'Reservation (Jsjdjd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 03:05:59', 78),
(3364, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 03:06:07', 78),
(3365, 'Reservation (Jijh) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 03:06:08', 78),
(3366, 'User Logged out', 'LOGOUT', '2025-10-26 03:06:29', 78),
(3367, 'User Logged in', 'LOGIN', '2025-10-26 03:06:46', 109),
(3368, 'Marked notifications as read (count: 19)', 'READ NOTIFICATION', '2025-10-26 03:07:52', 109),
(3369, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-26 03:08:03', 99),
(3370, 'Created Department: sampel department (Type: Academic)', 'CREATE', '2025-10-26 03:09:05', 99),
(3371, 'Created Equipment Category: \'sample equipment\'', 'CREATE', '2025-10-26 03:09:18', 99),
(3372, 'Created Vehicle Model: \'sample model\'', 'CREATE', '2025-10-26 03:10:09', 99),
(3373, 'Created Vehicle Category: \'sample category\'', 'CREATE', '2025-10-26 03:10:18', 99),
(3374, 'Created Vehicle Make: sample make ', 'CREATE', '2025-10-26 03:10:24', 99),
(3375, 'Created Holiday: \'sample holiday\' on \'2025-10-26\'', 'CREATE', '2025-10-26 03:10:46', 99),
(3376, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:13:13', 99),
(3377, 'Created Holiday: \'samples holiday\' on \'2025-10-27\'', 'CREATE', '2025-10-26 03:13:21', 99),
(3378, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:13:24', 99),
(3379, 'User: sample  S. sample has been created', 'CREATE USER', '2025-10-26 03:14:13', NULL),
(3380, 'Updated Venue: Roof Deck', 'UPDATE VENUE', '2025-10-26 03:22:35', 99),
(3381, 'Created Venue : sample venue', 'CREATE', '2025-10-26 03:28:36', 99),
(3382, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-26 03:28:45', 99),
(3383, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:28:51', 99),
(3384, 'Deactivated Equipment Category: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:28:55', 99),
(3385, 'Deactivated Vehicle Model: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:28:59', 99),
(3386, 'Deactivated Vehicle Category: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:29:05', 99),
(3387, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-26 03:29:08', 99),
(3388, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-10-26 03:29:23', 99),
(3389, 'Reservation \'asd\' declined by Rusty C  Pisco', 'DECLINE', '2025-10-26 03:31:44', 114),
(3390, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-26 03:32:57', 114),
(3391, 'Reservation Report (December 2025) generated: no records found by: Rusty C. Pisco', 'GENERATE REPORT', '2025-10-26 03:33:09', 114),
(3392, 'Reservation Report (October 2025) generated: 6 record(s) found by: Rusty C. Pisco', 'GENERATE REPORT', '2025-10-26 03:33:12', 114),
(3393, 'Equipment Unit (Big Sound System - SN: BSS-002) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-26 03:33:36', 114),
(3394, 'User Rusty C. Pisco sent a message to Jeniffer B. Tubaon: \'ellooo\'', 'SEND MESSAGE', '2025-10-26 03:34:06', 114),
(3395, 'User Jeniffer B. Tubaon sent a message to Rusty C. Pisco: \'hi\'', 'SEND MESSAGE', '2025-10-26 03:34:10', 99),
(3396, 'User Logged out', 'LOGOUT', '2025-10-26 03:42:13', 114),
(3397, 'User Logged in', 'LOGIN', '2025-10-26 03:42:22', 77),
(3398, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:26', 77),
(3399, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:27', 77),
(3400, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:28', 77),
(3401, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:29', 77),
(3402, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:29', 77),
(3403, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:30', 77),
(3404, 'User Logged out', 'LOGOUT', '2025-10-26 03:42:31', 77),
(3405, 'User Logged in', 'LOGIN', '2025-10-26 03:42:42', 109),
(3406, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:42:54', 109),
(3407, 'User Logged out', 'LOGOUT', '2025-10-26 03:43:01', 109),
(3408, 'User Logged in', 'LOGIN', '2025-10-26 03:43:15', 107),
(3409, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 03:43:20', 107),
(3410, 'User Logged out', 'LOGOUT', '2025-10-26 03:43:22', 107),
(3411, 'User Logged in', 'LOGIN', '2025-10-26 03:43:34', 78),
(3412, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-26 03:43:39', 78),
(3413, 'User Logged out', 'LOGOUT', '2025-10-26 03:45:13', 78),
(3414, 'User Logged in', 'LOGIN', '2025-10-26 03:45:22', 114),
(3415, 'User: Rosita  P. Gutierrez has been updated. Changes: user level: 5 -> 20', 'UPDATE USER', '2025-10-26 03:46:21', NULL),
(3416, 'User: Rosita  P. Gutierrez has been updated. Changes: user level: 20 -> 5', 'UPDATE USER', '2025-10-26 03:46:33', NULL),
(3417, 'Venue Request submitted', 'Reservation Request', '2025-10-26 03:47:02', 109),
(3418, 'User Logged out', 'LOGOUT', '2025-10-26 03:47:48', 109),
(3419, 'User Logged in', 'LOGIN', '2025-10-26 03:48:21', 111),
(3420, 'Venue Request submitted', 'Reservation Request', '2025-10-26 03:48:42', 111),
(3421, 'Venue Request submitted', 'Reservation Request', '2025-10-26 03:49:53', 111),
(3422, 'Venue Request submitted', 'Reservation Request', '2025-10-26 03:50:21', 111),
(3423, 'Venue Request submitted', 'Reservation Request', '2025-10-26 03:57:08', 111),
(3424, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:03:10', 111),
(3425, 'Reservation \'Nsjsj\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 04:13:43', 114),
(3426, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:14:33', 109),
(3427, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:26:21', 109),
(3428, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 04:26:30', 114),
(3429, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:27:35', 111),
(3430, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:33:34', 111),
(3431, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:38:14', 111),
(3432, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:42:00', 111),
(3433, 'Reservation \'Nzjzjs\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 04:44:02', 114),
(3434, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:46:06', 111),
(3435, 'Venue Request submitted', 'Reservation Request', '2025-10-26 04:58:51', 111),
(3436, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:05:30', 109),
(3437, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:05:46', 114),
(3438, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:06:40', 111),
(3439, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:09:20', 111),
(3440, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:10:56', 111),
(3441, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:15:27', 111),
(3442, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:16:11', 109),
(3443, 'Reservation \'as\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:16:17', 114),
(3444, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:20:45', 111),
(3445, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 05:21:06', 99),
(3446, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:22:10', 109),
(3447, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:23:27', 109),
(3448, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:24:13', 111),
(3449, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:24:45', 109),
(3450, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:24:45', 111),
(3451, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:25:27', 109),
(3452, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:25:48', 114),
(3453, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:28:58', 109),
(3454, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:29:06', 114),
(3455, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:29:50', 109),
(3456, 'Reservation \'asdasd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:29:58', 114),
(3457, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:53:53', 111),
(3458, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:54:52', 111),
(3459, 'Reservation \'MK\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:56:06', 114),
(3460, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:56:34', 111),
(3461, 'Venue Request submitted', 'Reservation Request', '2025-10-26 05:57:45', 111),
(3462, 'Reservation \'Ndjd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 05:57:52', 114),
(3463, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:58:29', 111),
(3464, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 05:59:14', 111),
(3465, 'Venue Request submitted', 'Reservation Request', '2025-10-26 06:14:39', 111),
(3466, 'Venue Request submitted', 'Reservation Request', '2025-10-26 06:16:15', 111),
(3467, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 06:17:08', 109),
(3468, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 06:17:27', 114),
(3469, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 06:17:37', 99),
(3470, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 06:17:40', 99),
(3471, 'Reservation \'Nsks\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 06:17:47', 114),
(3472, 'Reservation \'Nsks\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 06:17:51', 99),
(3473, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 06:17:56', 99),
(3474, 'User Logged out', 'LOGOUT', '2025-10-26 06:18:50', 111),
(3475, 'User Logged in', 'LOGIN', '2025-10-26 06:19:20', 78),
(3476, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:19:24', 78),
(3477, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:19:24', 78),
(3478, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:19:24', 78),
(3479, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:19:30', 78),
(3480, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:20:20', 78),
(3481, 'Vehicle L300 (200000222) released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:20:28', 78),
(3482, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 06:20:35', 78),
(3483, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 06:20:36', 78),
(3484, 'Vehicle L300 (200000222) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 06:21:11', 78),
(3485, 'Vehicle Hiace (122222) returned by: Virjillo Datario - condition: For Inspection - remarks: Inspect ni', 'RETURN', '2025-10-26 06:21:18', 78),
(3486, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 06:21:22', 78),
(3487, 'Vehicle (122222) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 06:22:05', 99),
(3488, 'Vehicle (200000222) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 06:22:10', 99),
(3489, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-26 06:22:17', 78),
(3490, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-26 06:22:20', 78),
(3491, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-26 06:22:21', 78),
(3492, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-26 06:22:22', 78),
(3493, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-26 06:22:24', 78),
(3494, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-26 06:22:24', 78),
(3495, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 06:22:26', 78),
(3496, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 06:23:48', 78),
(3497, 'User Logged out', 'LOGOUT', '2025-10-26 06:23:58', 109),
(3498, 'User Logged in', 'LOGIN', '2025-10-26 06:24:10', 78),
(3499, 'Equipment Chairs returned by: Virjillo Datario - condition: Good (good: 200, bad: 0)', 'RETURN', '2025-10-26 06:27:47', 78),
(3500, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 06:27:55', 78),
(3501, 'Reservation (Nsks) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 06:27:56', 78),
(3502, 'Venue Request submitted', 'Reservation Request', '2025-10-26 07:02:32', 77),
(3503, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 07:04:38', 114),
(3504, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 07:04:47', 99),
(3505, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 07:04:51', 99),
(3506, 'Venue (Auditorium) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 07:11:31', 99),
(3507, 'Venue (Auditorium) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 07:14:09', 99),
(3508, 'Venue (Auditorium) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 07:16:13', 99),
(3509, 'Venue (Auditorium) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 07:17:25', 99),
(3510, 'Venue (Auditorium) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 07:19:17', 99),
(3511, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-26 07:21:23', 99),
(3512, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-26 07:21:37', NULL),
(3513, 'Venue (Auditorium) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 07:21:51', 99),
(3514, 'Venue Request submitted', 'Reservation Request', '2025-10-26 07:27:39', 77),
(3515, 'User Logged out', 'LOGOUT', '2025-10-26 07:28:02', 77),
(3516, 'User Logged in', 'LOGIN', '2025-10-26 07:28:17', 121),
(3517, 'Reservation \'asd\' approved by Crestal s T Panhay', 'APPROVE', '2025-10-26 07:28:36', 121),
(3518, 'User Logged out', 'LOGOUT', '2025-10-26 07:28:38', 121),
(3519, 'User Logged in', 'LOGIN', '2025-10-26 07:29:02', 120),
(3520, 'Password updated by: Fatima  A. Vergel', 'UPDATE PASSWORD', '2025-10-26 07:30:21', 120),
(3521, 'User Logged in', 'LOGIN', '2025-10-26 07:30:31', 120),
(3522, 'Reservation \'asd\' approved by Fatima  A Vergel', 'APPROVE', '2025-10-26 07:30:34', 120),
(3523, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-26 11:26:55', 99),
(3524, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-26 11:28:48', 99),
(3525, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-26 11:32:52', 99),
(3526, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 11:35:37', 99),
(3527, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 11:35:43', 99),
(3528, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 11:40:24', 99),
(3529, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 11:49:49', 99),
(3530, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-26 11:50:15', 99),
(3531, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-26 11:56:00', 99),
(3532, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-26 11:56:36', 99),
(3533, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:34', 99),
(3534, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:36', 99),
(3535, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:38', 99),
(3536, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:40', 99),
(3537, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:41', 99),
(3538, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:44', 99),
(3539, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-26 11:58:47', 99),
(3540, 'Reactivated Vehicle Make: 1 item(s)', 'REACTIVATE', '2025-10-26 11:58:54', 99),
(3541, 'Reactivated Vehicle Make: 1 item(s)', 'REACTIVATE', '2025-10-26 11:58:56', 99),
(3542, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-26 12:00:14', 114),
(3543, 'Created Department: sample equipment (Type: Academic)', 'CREATE', '2025-10-26 12:00:30', 99),
(3544, 'Updated Department: sample equipment (Academic) -> sample equipments (Academic)', 'UPDATE', '2025-10-26 12:00:36', 99),
(3545, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:00:37', 99),
(3546, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:07:57', 99),
(3547, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:12:34', 99),
(3548, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:13:12', 99),
(3549, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:14:32', 99),
(3550, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:17:44', 99),
(3551, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:17:49', 99),
(3552, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 12:32:04', 99),
(3553, 'Created Vehicle : asd', 'CREATE', '2025-10-26 12:35:37', 99),
(3554, 'User Logged out', 'LOGOUT', '2025-10-26 12:39:40', 78),
(3555, 'User Logged in', 'LOGIN', '2025-10-26 12:40:01', 99),
(3556, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-26 13:03:46', 99),
(3557, 'User Logged out', 'LOGOUT', '2025-10-26 13:03:49', 78),
(3558, 'User Logged in', 'LOGIN', '2025-10-26 13:03:55', 96),
(3559, 'User Logged out', 'LOGOUT', '2025-10-26 13:04:37', 99),
(3560, 'User Logged in', 'LOGIN', '2025-10-26 13:04:55', 77),
(3561, 'Venue Request submitted', 'Reservation Request', '2025-10-26 13:05:27', 77),
(3562, 'Venue Request submitted', 'Reservation Request', '2025-10-26 13:13:09', 77),
(3563, 'Reservation \'KJ\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 13:16:47', 114),
(3564, 'Reservation \'KJ\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 13:16:52', 99),
(3565, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 13:16:56', 99),
(3566, 'Venue Request submitted', 'Reservation Request', '2025-10-26 13:18:45', 77),
(3567, 'Venue Request submitted', 'Reservation Request', '2025-10-26 13:19:36', 77),
(3568, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 13:23:59', 77),
(3569, 'Reservation \'Zkkz\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 13:24:17', 114),
(3570, 'Reservation \'Zkkz\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 13:24:26', 99),
(3571, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 13:24:29', 99),
(3572, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 13:24:53', 77),
(3573, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 13:25:46', 96),
(3574, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 13:26:13', 114),
(3575, 'Reservation \'Kaksk\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 13:26:19', 114),
(3576, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 13:26:26', 99),
(3577, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 13:26:31', 99),
(3578, 'Reservation \'Kaksk\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 13:26:46', 99),
(3579, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 13:26:50', 99),
(3580, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-26 13:27:22', NULL),
(3581, 'Reservation (Kaksk) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-26 13:27:35', NULL),
(3582, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 13:27:57', 77),
(3583, 'Reservation \'Mzkz\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 13:28:13', 114),
(3584, 'Reservation \'Mzkz\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 13:28:16', 99),
(3585, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 13:28:20', 99),
(3586, 'User Logged out', 'LOGOUT', '2025-10-26 13:28:50', 77),
(3587, 'User Logged in', 'LOGIN', '2025-10-26 13:29:09', 78),
(3588, 'Equipment Unit Unit MX-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:15', 78),
(3589, 'Equipment Unit Unit MX-002 released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:15', 78),
(3590, 'Equipment Unit Unit MX-003 released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:15', 78),
(3591, 'Equipment Unit Unit MX-004 released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:15', 78),
(3592, 'Virjillo Datario checked (Sample Checklist)', 'CHECK', '2025-10-26 13:29:20', 78),
(3593, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:24', 78),
(3594, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-26 13:29:26', 78),
(3595, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-26 13:29:27', 78),
(3596, 'Vehicle Hiace (123) released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:32', 78),
(3597, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:32', 78),
(3598, 'Equipment Unit Unit BSS-001 released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:29:32', 78),
(3599, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 13:29:34', 78),
(3600, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-26 13:29:36', 78),
(3601, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-26 13:29:37', 78),
(3602, 'Vehicle Hiace (123) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 13:30:12', 78),
(3603, 'Vehicle L300 (12332) returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 13:30:16', 78),
(3604, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 13:30:40', 78),
(3605, 'Reservation (Zkkz) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 13:30:40', 78),
(3606, 'Equipment Unit Unit MX-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 13:31:03', 78),
(3607, 'Equipment Unit Unit MX-002 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 13:31:06', 78),
(3608, 'Equipment Unit Unit MX-003 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-26 13:31:17', 78),
(3609, 'Equipment Unit Unit MX-004 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-26 13:31:20', 78),
(3610, 'Reservation (Mzkz) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 13:31:24', 78),
(3611, 'Venue Auditorium returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-26 13:31:48', 78),
(3612, 'Reservation (KJ) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 13:31:51', 78),
(3613, 'Equipment Unit (Monitor - SN: MX-003) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 13:32:21', 99),
(3614, 'Equipment Unit (Big Sound System - SN: BSS-001) availability set to Unavailable by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 13:32:24', 99),
(3615, 'Vehicle (123) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 13:32:28', 99),
(3616, 'Equipment Unit (Monitor - SN: MX-004) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-26 13:32:31', 99),
(3617, 'Reservation Report (October 2025) generated: 8 record(s) found', 'GENERATE REPORT', '2025-10-26 13:32:51', NULL),
(3618, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-26 13:33:51', 78),
(3619, 'Reservation Report (October 2025) generated: 8 record(s) found', 'GENERATE REPORT', '2025-10-26 13:34:14', NULL),
(3620, 'User Virjillo Datario sent a message to Jeniffer B. Tubaon: \'Sir\'', 'SEND MESSAGE', '2025-10-26 13:36:19', 78),
(3621, 'User Virjillo Datario sent a message to Jeniffer B. Tubaon: \'Hi\'', 'SEND MESSAGE', '2025-10-26 13:36:28', 78),
(3622, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 13:37:52', 96),
(3623, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 13:38:02', 114),
(3624, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 13:38:11', 99),
(3625, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 13:38:15', 99),
(3626, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 13:38:26', 78),
(3627, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 13:38:27', 78),
(3628, 'Equipment Paper released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:39:00', 78),
(3629, 'Virjillo Datario checked (if complete)', 'CHECK', '2025-10-26 13:39:02', 78),
(3630, 'Equipment Paper released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:39:40', 78),
(3631, 'Equipment Paper returned by: Virjillo Datario - condition: Missing (good: 0, bad: 10)', 'RETURN', '2025-10-26 13:39:52', 78),
(3632, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-26 13:40:05', 78),
(3633, 'Equipment Paper released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:42:14', 78),
(3634, 'Equipment Paper released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:42:23', 78),
(3635, 'Equipment Paper released by: Virjillo Datario', 'RELEASE', '2025-10-26 13:46:51', 78),
(3636, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 14:23:16', 96),
(3637, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 14:23:31', 96),
(3638, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 14:24:30', 114),
(3639, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 14:24:51', 114),
(3640, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-26 14:28:09', 114),
(3641, 'Created Venue : sample venues', 'CREATE', '2025-10-26 14:40:15', 114),
(3642, 'Updated Venue: sample venuess', 'UPDATE VENUE', '2025-10-26 14:40:18', 114),
(3643, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-26 14:40:21', 114),
(3644, 'Created Vehicle : asdddw2', 'CREATE', '2025-10-26 14:40:33', 114),
(3645, 'Updated Vehicle: \'asdddw2\' -> \'asdddw2sss\'', 'UPDATE VEHICLE', '2025-10-26 14:40:37', 114),
(3646, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-10-26 14:40:40', 114),
(3647, 'Created Equipment : samples equipment', 'CREATE', '2025-10-26 14:40:55', 114),
(3648, 'Updated Equipment: \'samples equipment\' -> \'samples equipments\'', 'UPDATE', '2025-10-26 14:41:08', 114),
(3649, 'Updated Equipment: \'samples equipments\' -> \'samplesssss equipments\'', 'UPDATE', '2025-10-26 14:41:14', 114),
(3650, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-26 14:41:20', 114),
(3651, 'User: asd A. asd has been created', 'CREATE USER', '2025-10-26 14:41:43', NULL),
(3652, 'User: asddd A. asd has been updated. Changes: title: null -> 6; first name: asd -> asddd', 'UPDATE USER', '2025-10-26 14:41:49', NULL),
(3653, 'Created Holiday: \'samples holiday\' on \'2025-10-28\'', 'CREATE', '2025-10-26 14:41:59', 114),
(3654, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-26 14:42:05', 114),
(3655, 'Created Vehicle Make: sample makes', 'CREATE', '2025-10-26 14:42:14', 114),
(3656, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-26 14:42:15', 114),
(3657, 'Updated Vehicle Make: \'Isuzu \' -> \'Isuzu s\'', 'UPDATE', '2025-10-26 14:42:20', 114),
(3658, 'Updated Vehicle Make: \'Isuzu s\' -> \'Isuzu\'', 'UPDATE', '2025-10-26 14:42:24', 114),
(3659, 'Created Vehicle Category: \'sample categorys\'', 'CREATE', '2025-10-26 14:42:34', 114),
(3660, 'Deactivated Vehicle Category: 1 item(s)', 'DEACTIVATE', '2025-10-26 14:42:42', 114),
(3661, 'Updated Vehicle Category: \'Sedan\' -> \'Sedans\'', 'UPDATE', '2025-10-26 14:42:45', 114),
(3662, 'Updated Vehicle Category: \'Sedans\' -> \'Sedan\'', 'UPDATE', '2025-10-26 14:42:47', 114),
(3663, 'Created Vehicle Model: \'sample odel\'', 'CREATE', '2025-10-26 14:42:57', 114),
(3664, 'Updated Vehicle Model: \'sample odel\' -> \'sample model\'', 'UPDATE', '2025-10-26 14:43:02', 114),
(3665, 'Deactivated Vehicle Model: 1 item(s)', 'DEACTIVATE', '2025-10-26 14:43:03', 114),
(3666, 'Created Equipment Category: \'samples eq\'', 'CREATE', '2025-10-26 14:43:15', 114),
(3667, 'Updated Equipment Category: \'samples eq\' -> \'samples eqss\'', 'UPDATE', '2025-10-26 14:43:17', 114),
(3668, 'Deactivated Equipment Category: 1 item(s)', 'DEACTIVATE', '2025-10-26 14:43:18', 114),
(3669, 'Created Department: samples dep (Type: Academic)', 'CREATE', '2025-10-26 14:43:27', 114),
(3670, 'Updated Department: samples dep (Academic) -> samples depss (Academic)', 'UPDATE', '2025-10-26 14:43:31', 114),
(3671, 'Deactivated Department: 1 item(s)', 'DEACTIVATE', '2025-10-26 14:43:33', 114),
(3672, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 14:44:23', 96),
(3673, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 14:44:31', 114),
(3674, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 14:44:46', 99),
(3675, 'Added Checklist to equipment Portable Speaker: No. Checklist (1) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2025-10-26 14:45:06', 99),
(3676, 'Updated Checklist in equipment Portable Speaker: \'add checklist\' -> \'edit checklist\'', 'UPDATE CHECKLIST', '2025-10-26 14:45:16', NULL),
(3677, 'Added Checklist to equipment Portable Speaker: No. Checklist (1) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2025-10-26 14:45:19', 99),
(3678, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 14:45:27', 99),
(3679, 'Reservation Report (October 2025) generated: 1 record(s) found', 'GENERATE REPORT', '2025-10-26 14:45:37', NULL),
(3680, 'Venue Request submitted', 'Reservation Request', '2025-10-26 14:46:47', 96),
(3681, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 14:47:02', 96),
(3682, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 14:47:11', 114),
(3683, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 14:47:16', 114),
(3684, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 14:47:22', 99),
(3685, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 14:47:27', 99),
(3686, 'Venue Request submitted', 'Reservation Request', '2025-10-26 14:48:14', 96),
(3687, 'Venue Request submitted', 'Reservation Request', '2025-10-26 14:49:44', 96),
(3688, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 15:03:16', 96),
(3689, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 15:03:49', 96),
(3690, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 15:03:58', 114),
(3691, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 15:04:02', 114),
(3692, 'Equipment Request submitted', 'Reservation Request', '2025-10-26 15:05:45', 96),
(3693, 'Venue Request submitted', 'Reservation Request', '2025-10-26 15:17:32', 96),
(3694, 'Venue Request submitted', 'Reservation Request', '2025-10-26 15:18:01', 96),
(3695, 'Venue Request submitted', 'Reservation Request', '2025-10-26 15:19:00', 96),
(3696, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 15:19:06', 114),
(3697, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 15:19:18', 114),
(3698, 'Venue Request submitted', 'Reservation Request', '2025-10-26 15:19:51', 96),
(3699, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 15:19:57', 114),
(3700, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 15:20:47', 99),
(3701, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-26 15:20:52', 99),
(3702, 'Marked notifications as read (count: 24)', 'READ NOTIFICATION', '2025-10-26 15:22:20', 114),
(3703, 'User Logged out', 'LOGOUT', '2025-10-26 18:16:09', 78),
(3704, 'User Logged in', 'LOGIN', '2025-10-26 18:16:27', 77);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(3705, 'Venue Request submitted', 'Reservation Request', '2025-10-26 18:18:53', 77),
(3706, 'Venue Request submitted', 'Reservation Request', '2025-10-26 18:23:19', 77),
(3707, 'Venue Request submitted', 'Reservation Request', '2025-10-26 18:30:15', 77),
(3708, 'Venue Request submitted', 'Reservation Request', '2025-10-26 18:31:17', 96),
(3709, 'User Logged in', 'LOGIN', '2025-10-26 18:32:46', 109),
(3710, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 18:37:58', 96),
(3711, 'Venue Request submitted', 'Reservation Request', '2025-10-26 18:37:59', 77),
(3712, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 18:39:07', 96),
(3713, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 18:43:42', 114),
(3714, 'User Logged out', 'LOGOUT', '2025-10-26 19:16:44', 96),
(3715, 'User Logged in', 'LOGIN', '2025-10-26 19:16:56', 77),
(3716, 'Venue Request submitted', 'Reservation Request', '2025-10-26 19:18:46', 77),
(3717, 'User Logged out', 'LOGOUT', '2025-10-26 19:23:21', 78),
(3718, 'User Logged in', 'LOGIN', '2025-10-26 19:33:25', 77),
(3719, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 19:40:21', 77),
(3720, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-26 19:40:39', 99),
(3721, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-26 19:40:41', 99),
(3722, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 19:40:54', 114),
(3723, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 19:52:48', 99),
(3724, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-26 20:15:02', 99),
(3725, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-26 20:15:43', 114),
(3726, 'Vehicle Request submitted', 'Reservation Request', '2025-10-26 20:41:33', 109),
(3727, 'Updated Vehicle: asd', 'UPDATE VEHICLE', '2025-10-26 21:14:25', 99),
(3728, 'Venue Request submitted', 'Reservation Request', '2025-10-27 02:20:53', 109),
(3729, 'User Logged out', 'LOGOUT', '2025-10-27 02:22:11', 109),
(3730, 'User Logged in', 'LOGIN', '2025-10-27 02:22:21', 96),
(3731, 'Created Venue : sample venue1', 'CREATE', '2025-10-27 02:29:24', 99),
(3732, 'Updated Venue: sample venue12', 'UPDATE VENUE', '2025-10-27 02:29:28', 99),
(3733, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-27 02:29:34', 99),
(3734, 'Created Vehicle : sampleplateno', 'CREATE', '2025-10-27 02:30:02', 99),
(3735, 'Updated Vehicle: sampleplateno', 'UPDATE VEHICLE', '2025-10-27 02:30:20', 99),
(3736, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2025-10-27 02:30:36', 99),
(3737, 'Created Equipment : sample equipment1', 'CREATE', '2025-10-27 02:30:58', 99),
(3738, 'Updated Equipment: \'sample equipment1\' -> \'sample equipment12\'', 'UPDATE', '2025-10-27 02:31:02', 99),
(3739, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2025-10-27 02:31:05', 99),
(3740, 'Equipment (Monitor) has new Serial Number: MX-005', 'CREATE UNIT', '2025-10-27 02:31:28', 99),
(3741, 'Deactivated equipment unit(s): 1', 'DEACTIVATE_UNIT', '2025-10-27 02:31:32', 99),
(3742, 'User: sampless S. sampless has been created', 'CREATE USER', '2025-10-27 02:32:35', NULL),
(3743, 'User: edited E. edited has been updated. Changes: first name: sampless -> edited; middle name: sampless -> edited; last name: sampless -> edited; password: changed', 'UPDATE USER', '2025-10-27 02:32:49', NULL),
(3744, 'Created Holiday: \'sammple holiday\' on \'2025-10-30\'', 'CREATE', '2025-10-27 02:33:09', 99),
(3745, 'Deactivated Holiday: 1 item(s)', 'DEACTIVATE', '2025-10-27 02:33:15', 99),
(3746, 'Created Vehicle Make: sampleee make', 'CREATE', '2025-10-27 02:33:25', 99),
(3747, 'Updated Vehicle Make: \'sampleee make\' -> \'edited make\'', 'UPDATE', '2025-10-27 02:33:35', 99),
(3748, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2025-10-27 02:33:40', 99),
(3749, 'Created Vehicle Category: \'sample categoryss\'', 'CREATE', '2025-10-27 02:34:30', 99),
(3750, 'Updated Vehicle Category: \'sample categoryss\' -> \'sample categoryss1\'', 'UPDATE', '2025-10-27 02:34:37', 99),
(3751, 'Deactivated Vehicle Category: 1 item(s)', 'DEACTIVATE', '2025-10-27 02:34:39', 99),
(3752, 'Created Vehicle Model: \'samples model\'', 'CREATE', '2025-10-27 02:34:55', 99),
(3753, 'Updated Vehicle Model: \'samples model\' -> \'edited model\'', 'UPDATE', '2025-10-27 02:35:07', 99),
(3754, 'Updated Vehicle Model: \'Hiace\' -> \'Hiace\'', 'UPDATE', '2025-10-27 02:35:15', 99),
(3755, 'Updated Vehicle Model: \'Hiace\' -> \'Hiace\'', 'UPDATE', '2025-10-27 02:36:14', 99),
(3756, 'Updated Vehicle Model: \'Hiace\' -> \'Hiace\'', 'UPDATE', '2025-10-27 02:36:39', 99),
(3757, 'Updated Vehicle: 2026', 'UPDATE VEHICLE', '2025-10-27 02:36:58', 99),
(3758, 'Created Equipment Category: \'samples category\'', 'CREATE', '2025-10-27 02:37:24', 99),
(3759, 'Updated Equipment Category: \'samples category\' -> \'samples categorys\'', 'UPDATE', '2025-10-27 02:37:33', 99),
(3760, 'Deactivated Equipment Category: 1 item(s)', 'DEACTIVATE', '2025-10-27 02:37:35', 99),
(3761, 'Created Department: departments (Type: Academic)', 'CREATE', '2025-10-27 02:37:46', 99),
(3762, 'Updated Department: departments (Academic) -> edited departments (Academic)', 'UPDATE', '2025-10-27 02:37:52', 99),
(3763, 'Added Checklist to venue QUADRANGLE: No. Checklist (1) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2025-10-27 02:38:24', 99),
(3764, 'Updated Checklist in venue QUADRANGLE: \'sample checklist\' -> \'edited checklist\'', 'UPDATE CHECKLIST', '2025-10-27 02:38:32', NULL),
(3765, 'Added Checklist to equipment Fix Flooring Power Supply: No. Checklist (1) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2025-10-27 02:40:06', 99),
(3766, 'Updated Checklist in equipment Fix Flooring Power Supply: \'sample checklist\' -> \'edited\'', 'UPDATE CHECKLIST', '2025-10-27 02:40:27', NULL),
(3767, 'Unarchived Vehicle resource(s): 1', 'UNARCHIVE', '2025-10-27 02:40:40', 99),
(3768, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-10-27 02:40:44', 99),
(3769, 'Unarchived Equipment resource(s): 1', 'UNARCHIVE', '2025-10-27 02:40:47', 99),
(3770, 'Reactivated equipment unit(s): 1', 'REACTIVATE_UNIT', '2025-10-27 02:40:51', 99),
(3771, 'Reactivated Vehicle Make: 1 item(s)', 'REACTIVATE', '2025-10-27 02:40:54', 99),
(3772, 'Reactivated Vehicle Category: 1 item(s)', 'REACTIVATE', '2025-10-27 02:40:58', 99),
(3773, 'Reactivated Vehicle Model: 1 item(s)', 'REACTIVATE', '2025-10-27 02:41:01', 99),
(3774, 'Reactivated Equipment Category: 1 item(s)', 'REACTIVATE', '2025-10-27 02:41:06', 99),
(3775, 'Reactivated Department: 1 item(s)', 'REACTIVATE', '2025-10-27 02:41:11', 99),
(3776, 'Reactivated Holiday: 1 item(s)', 'REACTIVATE', '2025-10-27 02:41:14', 99),
(3777, 'User Logged out', 'LOGOUT', '2025-10-27 02:48:09', 77),
(3778, 'User Logged out', 'LOGOUT', '2025-10-27 03:10:14', 114),
(3779, 'User Logged in', 'LOGIN', '2025-10-27 03:10:24', 109),
(3780, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:10:39', 109),
(3781, 'User Logged out', 'LOGOUT', '2025-10-27 03:18:06', 78),
(3782, 'User Logged in', 'LOGIN', '2025-10-27 03:18:26', 109),
(3783, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:18:38', 109),
(3784, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:18:55', 109),
(3785, 'User Logged out', 'LOGOUT', '2025-10-27 03:19:08', 109),
(3786, 'User Logged in', 'LOGIN', '2025-10-27 03:19:17', 77),
(3787, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:19:44', 77),
(3788, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:19:58', 77),
(3789, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:20:15', 77),
(3790, 'User Logged out', 'LOGOUT', '2025-10-27 03:20:32', 77),
(3791, 'User Logged in', 'LOGIN', '2025-10-27 03:20:40', 111),
(3792, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:20:52', 111),
(3793, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:21:17', 111),
(3794, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:21:56', 111),
(3795, 'User Logged out', 'LOGOUT', '2025-10-27 03:22:36', 111),
(3796, 'User Logged in', 'LOGIN', '2025-10-27 03:22:45', 77),
(3797, 'Venue Request submitted', 'Reservation Request', '2025-10-27 03:24:02', 77),
(3798, 'User Logged out', 'LOGOUT', '2025-10-27 03:24:19', 109),
(3799, 'User Logged in', 'LOGIN', '2025-10-27 03:24:33', 114),
(3800, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 03:24:41', 114),
(3801, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 03:24:59', 99),
(3802, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-27 03:25:03', 99),
(3803, 'User Logged in', 'LOGIN', '2025-10-27 03:25:47', 78),
(3804, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:26:06', 78),
(3805, 'Equipment Unit Unit CCM-001 released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:26:06', 78),
(3806, 'Equipment Chairs released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:26:23', 78),
(3807, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-27 03:26:25', 78),
(3808, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-27 03:26:26', 78),
(3809, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-27 03:26:29', 78),
(3810, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-27 03:26:30', 78),
(3811, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-27 03:26:31', 78),
(3812, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-27 03:26:33', 78),
(3813, 'Virjillo Datario checked (Check if functional)', 'CHECK', '2025-10-27 03:26:33', 78),
(3814, 'Equipment Chairs returned by: Virjillo Datario - condition: Damage (good: 200, bad: 100)', 'RETURN', '2025-10-27 03:27:48', 78),
(3815, 'Equipment Unit Unit CCM-001 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-27 03:27:59', 78),
(3816, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection - remarks: guba ni sya', 'RETURN', '2025-10-27 03:28:12', 78),
(3817, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-27 03:28:13', 78),
(3818, 'Venue (Auditorium) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-27 03:28:25', 99),
(3819, 'Equipment Unit (Computer Monitor - SN: CCM-001) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-27 03:28:31', 99),
(3820, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 03:29:01', 77),
(3821, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 03:30:15', 77),
(3822, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 03:30:48', 114),
(3823, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 03:34:51', 114),
(3824, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 03:36:54', 114),
(3825, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-27 03:40:35', 99),
(3826, 'Vehicle L300 (12332) released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:40:48', 78),
(3827, 'Vehicle Hiace (123) released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:40:48', 78),
(3828, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-27 03:41:20', 78),
(3829, 'Virjillo Datario checked (Good Condition)', 'CHECK', '2025-10-27 03:41:26', 78),
(3830, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 03:49:07', 77),
(3831, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 03:49:19', 114),
(3832, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-27 03:50:59', 114),
(3833, 'Vehicle Hiace (122222) released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:51:02', 78),
(3834, 'Equipment Unit Unit AR-001 released by: Virjillo Datario', 'RELEASE', '2025-10-27 03:51:02', 78),
(3835, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 03:59:50', 77),
(3836, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 04:00:00', 114),
(3837, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 04:00:34', 99),
(3838, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 04:02:24', 99),
(3839, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 04:06:25', 77),
(3840, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 04:06:44', 114),
(3841, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-27 04:11:02', 99),
(3842, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 04:15:22', 99),
(3843, 'User Logged out', 'LOGOUT', '2025-10-27 05:13:19', 78),
(3844, 'User Logged in', 'LOGIN', '2025-10-27 05:14:22', 96),
(3845, 'Venue Request submitted', 'Reservation Request', '2025-10-27 05:15:16', 96),
(3846, 'User Logged in', 'LOGIN', '2025-10-27 08:48:57', 77),
(3847, 'User Logged in', 'LOGIN', '2025-10-27 08:51:30', 77),
(3848, 'Venue Request submitted', 'Reservation Request', '2025-10-27 08:56:51', 96),
(3849, 'User Logged out', 'LOGOUT', '2025-10-27 08:57:10', 99),
(3850, 'User Logged in', 'LOGIN', '2025-10-27 08:57:19', 77),
(3851, 'Marked notifications as read (count: 9)', 'READ NOTIFICATION', '2025-10-27 09:06:45', 77),
(3852, 'User Logged out', 'LOGOUT', '2025-10-27 09:06:46', 77),
(3853, 'User Logged in', 'LOGIN', '2025-10-27 09:06:55', 99),
(3854, 'Venue Request submitted', 'Reservation Request', '2025-10-27 09:14:40', 96),
(3855, 'Venue Request submitted', 'Reservation Request', '2025-10-27 09:24:20', 96),
(3856, 'User Logged in', 'LOGIN', '2025-10-27 09:25:05', 96),
(3857, 'User Logged out', 'LOGOUT', '2025-10-27 09:26:32', 99),
(3858, 'User Logged in', 'LOGIN', '2025-10-27 09:26:43', 82),
(3859, 'User Logged out', 'LOGOUT', '2025-10-27 09:30:56', 96),
(3860, 'User Logged in', 'LOGIN', '2025-10-27 09:31:15', 77),
(3861, 'User Logged out', 'LOGOUT', '2025-10-27 09:31:50', 77),
(3862, 'User Logged in', 'LOGIN', '2025-10-27 09:31:59', 109),
(3863, 'Venue Request submitted', 'Reservation Request', '2025-10-27 09:33:26', 109),
(3864, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 09:34:08', 109),
(3865, 'Venue Request submitted', 'Reservation Request', '2025-10-27 09:35:00', 82),
(3866, 'Equipment Request submitted', 'Reservation Request', '2025-10-27 09:39:00', 109),
(3867, 'User Logged in', 'LOGIN', '2025-10-27 09:41:53', 99),
(3868, 'Updated Venue: Auditoriumss', 'UPDATE VENUE', '2025-10-27 09:43:48', 99),
(3869, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-27 09:43:53', 99),
(3870, 'Archived Venue resource(s): 1', 'ARCHIVE', '2025-10-27 09:44:00', 99),
(3871, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2025-10-27 09:44:11', 99),
(3872, 'User Logged out', 'LOGOUT', '2025-10-27 09:44:24', 82),
(3873, 'User Logged in', 'LOGIN', '2025-10-27 09:44:43', 114),
(3874, 'Reservation \'for use\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 09:44:49', 114),
(3875, 'Reservation \'for use\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 09:44:58', 99),
(3876, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-27 09:45:02', 99),
(3877, 'User Logged out', 'LOGOUT', '2025-10-27 09:45:26', 109),
(3878, 'User Logged in', 'LOGIN', '2025-10-27 09:45:35', 78),
(3879, 'User Logged out', 'LOGOUT', '2025-10-27 09:45:50', 78),
(3880, 'User Logged in', 'LOGIN', '2025-10-27 09:46:03', 77),
(3881, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-27 09:46:42', 77),
(3882, 'User Logged out', 'LOGOUT', '2025-10-27 11:30:12', 96),
(3883, 'User Logged in', 'LOGIN', '2025-10-27 11:30:20', 78),
(3884, 'User Logged out', 'LOGOUT', '2025-10-27 11:37:35', 78),
(3885, 'User Logged in', 'LOGIN', '2025-10-27 11:37:46', 114),
(3886, 'Equipment Request submitted', 'Reservation Request', '2025-10-27 11:38:16', 77),
(3887, 'Reservation \'sample event\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 11:38:29', 114),
(3888, 'Reservation \'sample event\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 11:38:35', 99),
(3889, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-27 11:39:03', 99),
(3890, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-27 13:09:23', 114),
(3891, 'Updated Venue: Roof Deck', 'UPDATE VENUE', '2025-10-27 13:11:12', 114),
(3892, 'Updated Venue: Main West Lobby', 'UPDATE VENUE', '2025-10-27 13:11:25', 114),
(3893, 'Updated Venue: MS Stage', 'UPDATE VENUE', '2025-10-27 13:11:32', 114),
(3894, 'Updated Venue: SHS Ground', 'UPDATE VENUE', '2025-10-27 13:11:38', 114),
(3895, 'Updated Venue: BED Lobby', 'UPDATE VENUE', '2025-10-27 13:11:43', 114),
(3896, 'Updated Venue: MULTI PURPOSE HALL', 'UPDATE VENUE', '2025-10-27 13:11:49', 114),
(3897, 'Updated Venue: PHINMA HALL', 'UPDATE VENUE', '2025-10-27 13:11:55', 114),
(3898, 'Updated Venue: MS LOBBY', 'UPDATE VENUE', '2025-10-27 13:12:06', 114),
(3899, 'Updated Venue: AVR 2', 'UPDATE VENUE', '2025-10-27 13:12:14', 114),
(3900, 'Marked notifications as read (count: 13)', 'READ NOTIFICATION', '2025-10-27 16:43:37', 114),
(3901, 'Created Building: Big Open Space Area', 'CREATE', '2025-10-27 16:59:49', 114),
(3902, 'Deactivated Building: Big Open Space Area', 'DEACTIVATE BUILDING', '2025-10-27 17:05:17', 114),
(3903, 'Reactivated Building: 1 item(s)', 'REACTIVATE', '2025-10-27 17:05:25', 114),
(3904, 'Equipment (Papers) has increase quantity: 59', 'UPDATE QUANTITY', '2025-10-27 17:55:15', 114),
(3905, 'Updated Vehicle: asd', 'UPDATE VEHICLE', '2025-10-27 18:20:52', 114),
(3906, 'User: asd A. asd has been created', 'CREATE USER', '2025-10-27 18:47:41', NULL),
(3907, 'User: dwa S. asd has been created', 'CREATE USER', '2025-10-27 18:49:18', NULL),
(3908, 'User: asd A. asd has been created', 'CREATE USER', '2025-10-27 18:53:23', NULL),
(3909, 'Equipment (Monitor) has new Serial Number: QCPW-200', 'CREATE UNIT', '2025-10-27 19:05:26', 114),
(3910, 'User Logged out', 'LOGOUT', '2025-10-27 19:31:53', 99),
(3911, 'User Logged in', 'LOGIN', '2025-10-27 19:32:25', 72),
(3912, 'Venue Request submitted', 'Reservation Request', '2025-10-27 19:32:39', 72),
(3913, 'Venue Request submitted', 'Reservation Request', '2025-10-27 19:33:06', 72),
(3914, 'Venue Request submitted', 'Reservation Request', '2025-10-27 20:12:53', 72),
(3915, 'User Logged out', 'LOGOUT', '2025-10-27 20:13:32', 72),
(3916, 'User Logged in', 'LOGIN', '2025-10-27 20:13:39', 77),
(3917, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-27 20:14:07', 77),
(3918, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-27 20:16:51', 77),
(3919, 'User Logged out', 'LOGOUT', '2025-10-27 20:30:10', 77),
(3920, 'User Logged in', 'LOGIN', '2025-10-27 20:30:19', 72),
(3921, 'Venue Request submitted', 'Reservation Request', '2025-10-27 20:30:33', 72),
(3922, 'Venue Request submitted', 'Reservation Request', '2025-10-27 20:34:53', 72),
(3923, 'Updated Venue: QUADRANGLE', 'UPDATE VENUE', '2025-10-27 20:50:40', 114),
(3924, 'Updated Venue: AVR 1', 'UPDATE VENUE', '2025-10-27 20:50:48', 114),
(3925, 'Venue Request submitted', 'Reservation Request', '2025-10-27 20:52:09', 72),
(3926, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-27 20:53:59', 114),
(3927, 'Marked notifications as read (count: 19)', 'READ NOTIFICATION', '2025-10-27 20:59:59', 72),
(3928, 'User Logged out', 'LOGOUT', '2025-10-27 21:01:43', 72),
(3929, 'User Logged in', 'LOGIN', '2025-10-27 21:01:52', 77),
(3930, 'Venue Request submitted', 'Reservation Request', '2025-10-27 21:03:31', 77),
(3931, 'Updated Vehicle Category: \'Van\' -> \'Van\'', 'UPDATE', '2025-10-27 21:18:47', 114),
(3932, 'Updated Vehicle Category: \'Van\' -> \'Van\'', 'UPDATE', '2025-10-27 21:20:09', 114),
(3933, 'Created Vehicle Category: \'asd\'', 'CREATE', '2025-10-27 21:20:37', 114),
(3934, 'Updated Vehicle Category: \'Light Commercial Vehicle LCV\' -> \'Light Commercial Vehicle LCV\'', 'UPDATE', '2025-10-27 21:22:45', 114),
(3935, 'Updated Vehicle Category: \'Sedan\' -> \'Sedan\'', 'UPDATE', '2025-10-27 21:24:59', 114),
(3936, 'Updated Vehicle Category: \'Van\' -> \'Van\'', 'UPDATE', '2025-10-27 21:25:05', 114),
(3937, 'Deactivated Vehicle Category: 1 item(s)', 'DEACTIVATE', '2025-10-27 21:25:16', 114),
(3938, 'Created Vehicle : NOSUU', 'CREATE', '2025-10-27 21:35:40', 114),
(3939, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 21:36:07', NULL),
(3940, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 21:46:53', NULL),
(3941, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 21:55:05', NULL),
(3942, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 21:56:04', NULL),
(3943, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 22:05:06', NULL),
(3944, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 22:05:49', NULL),
(3945, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 22:06:11', NULL),
(3946, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-27 22:08:11', NULL),
(3947, 'Vehicle Request submitted', 'Reservation Request', '2025-10-27 22:09:06', 77),
(3948, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-27 22:31:48', 114),
(3949, 'Updated Venue: MS Stage', 'UPDATE VENUE', '2025-10-27 22:32:47', 114),
(3950, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-27 22:34:10', 114),
(3951, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-27 22:36:05', 114),
(3952, 'Updated Venue: SHS Ground', 'UPDATE VENUE', '2025-10-27 22:38:29', 114),
(3953, 'Venue Request submitted', 'Reservation Request', '2025-10-27 22:50:05', 77),
(3954, 'User Logged out', 'LOGOUT', '2025-10-27 22:50:13', 77),
(3955, 'User Logged in', 'LOGIN', '2025-10-27 22:50:26', 114),
(3956, 'User Logged out', 'LOGOUT', '2025-10-27 22:51:47', 114),
(3957, 'User Logged in', 'LOGIN', '2025-10-27 22:52:21', 114),
(3958, 'Venue Request submitted', 'Reservation Request', '2025-10-27 22:53:03', 77),
(3959, 'Venue Request submitted', 'Reservation Request', '2025-10-27 22:53:24', 77),
(3960, 'User Logged out', 'LOGOUT', '2025-10-27 22:53:48', 114),
(3961, 'User Logged in', 'LOGIN', '2025-10-27 22:53:56', 99),
(3962, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-27 22:54:05', 99),
(3963, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-27 22:54:10', 114),
(3964, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-27 22:54:16', 114),
(3965, 'User Logged out', 'LOGOUT', '2025-10-27 22:54:32', 77),
(3966, 'User Logged in', 'LOGIN', '2025-10-27 22:54:45', 78),
(3967, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-27 22:54:56', 78),
(3968, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-27 23:44:55', 78),
(3969, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-27 23:44:58', 78),
(3970, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-27 23:44:59', 78),
(3971, 'User Logged in', 'LOGIN', '2025-10-28 01:00:29', 78),
(3972, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-28 01:24:08', 78),
(3973, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-28 01:28:40', 78),
(3974, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-28 01:28:41', 78),
(3975, 'User Logged in', 'LOGIN', '2025-10-28 01:33:44', 77),
(3976, 'Equipment Request submitted', 'Reservation Request', '2025-10-28 01:34:01', 77),
(3977, 'User Logged in', 'LOGIN', '2025-10-28 01:34:19', 99),
(3978, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-28 01:34:26', 99),
(3979, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-28 01:34:40', 114),
(3980, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-28 01:34:47', 114),
(3981, 'Equipment Chairs released (100 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:07:38', 78),
(3982, 'Equipment Chairs released (50 units, total released: 50/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:19:23', 78),
(3983, 'Equipment Chairs released (50 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:19:55', 78),
(3984, 'Equipment Chairs released (50 units, total released: 50/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:20:35', 78),
(3985, 'Equipment Chairs released (50 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:21:16', 78),
(3986, 'Equipment Chairs released (50 units, total released: 50/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:24:59', 78),
(3987, 'Equipment Chairs released (50 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:25:27', 78),
(3988, 'Equipment Chairs released (100 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:31:56', 78),
(3989, 'Equipment Chairs released (50 units, total released: 50/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:32:48', 78),
(3990, 'Equipment Chairs released (50 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:39:49', 78),
(3991, 'Equipment Chairs released (25 units, total released: 25/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:40:22', 78),
(3992, 'Equipment Chairs released (50 units, total released: 75/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:40:35', 78),
(3993, 'Equipment Chairs released (25 units, total released: 100/100) by: Virjillo Datario', 'RELEASE', '2025-10-28 02:40:48', 78),
(3994, 'Virjillo Datario checked (Complete Quantitys)', 'CHECK', '2025-10-28 02:40:49', 78),
(3995, 'Virjillo Datario checked (Not Damage)', 'CHECK', '2025-10-28 02:40:50', 78),
(3996, 'Virjillo Datario checked (Good to go)', 'CHECK', '2025-10-28 02:40:51', 78),
(3997, 'Equipment Chairs returned by: Virjillo Datario - condition: Missing (good: 50, bad: 50)', 'RETURN', '2025-10-28 02:41:27', 78),
(3998, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-28 02:55:36', 78),
(3999, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-28 02:55:38', 78),
(4000, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-28 02:55:43', 78),
(4001, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 02:55:48', 78),
(4002, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-28 02:56:06', 78),
(4003, 'Reservation (asd) has set to completed by: Virjillo Datario', 'UPDATE STATUS', '2025-10-28 02:56:08', 78),
(4004, 'Equipment Request submitted', 'Reservation Request', '2025-10-28 03:11:51', 77),
(4005, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-28 03:12:08', 99),
(4006, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-28 03:12:15', 114),
(4007, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-28 03:12:23', 114),
(4008, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-28 04:46:30', 114),
(4009, 'Virjillo Datario checked (Sample Checklist)', 'CHECK', '2025-10-28 05:17:36', 78),
(4010, 'Vehicle Request submitted', 'Reservation Request', '2025-10-28 05:27:51', 77),
(4011, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-28 05:28:22', 99),
(4012, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-28 05:28:34', 114),
(4013, 'Added Checklist to vehicle Toyota Hiace (NOSUU): No. Checklist (1) by: Rusty C. Pisco', 'ADD CHECKLIST', '2025-10-28 05:28:46', 114),
(4014, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-28 05:28:53', 114),
(4015, 'Vehicle Hiace (NOSUU) released by: Virjillo Datario', 'RELEASE', '2025-10-28 05:28:58', 78),
(4016, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-28 05:29:08', 78),
(4017, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-28 05:29:09', 78),
(4018, 'Virjillo Datario checked (asd)', 'CHECK', '2025-10-28 05:29:21', 78),
(4019, 'Equipment Unit Unit MX-001 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 05:32:15', 78),
(4020, 'Equipment Unit Unit MX-002 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 05:32:17', 78),
(4021, 'Equipment Unit Unit MX-003 returned by: Virjillo Datario - condition: Missing', 'RETURN', '2025-10-28 05:32:20', 78),
(4022, 'Equipment Unit Unit MX-004 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-28 05:32:21', 78),
(4023, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 05:32:42', 78),
(4024, 'Vehicle Hiace (NOSUU) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 05:32:49', 78),
(4025, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-28 05:36:18', 114),
(4026, 'Venue Request submitted', 'Reservation Request', '2025-10-28 05:50:23', 77),
(4027, 'User Logged in', 'LOGIN', '2025-10-28 13:38:05', 99),
(4028, 'User Logged out', 'LOGOUT', '2025-10-28 13:38:16', 78),
(4029, 'User Logged in', 'LOGIN', '2025-10-28 13:38:23', 96),
(4030, 'Venue Request submitted', 'Reservation Request', '2025-10-28 13:38:35', 96),
(4031, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-28 13:41:51', 99),
(4032, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-28 13:41:59', 114),
(4033, 'Added Checklist to venue Main West Ground: No. Checklist (1) by: Rusty C. Pisco', 'ADD CHECKLIST', '2025-10-28 13:42:09', 114),
(4034, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-28 13:42:14', 114),
(4035, 'Reservation (asd) has set to completed by: Rusty C. Pisco', 'UPDATE STATUS', '2025-10-28 13:44:20', 114),
(4036, 'Reservation (asd) has set to completed by: Rusty C. Pisco', 'UPDATE STATUS', '2025-10-28 13:44:23', 114),
(4037, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-28 13:46:04', 99),
(4038, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-28 13:53:37', 99),
(4039, 'User Logged out', 'LOGOUT', '2025-10-28 13:55:54', 96),
(4040, 'User Logged in', 'LOGIN', '2025-10-28 13:56:02', 77),
(4041, 'User Logged in', 'LOGIN', '2025-10-28 14:16:19', 78),
(4042, 'Venue Main West Ground released by: Virjillo Datario', 'RELEASE', '2025-10-28 14:25:51', 78),
(4043, 'Virjillo Datario checked (asd)', 'CHECK', '2025-10-28 14:25:55', 78),
(4044, 'Venue Main West Ground returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 14:26:30', 78),
(4045, 'Reservation (asd) has set to completed by: Rusty C. Pisco', 'UPDATE STATUS', '2025-10-28 14:26:34', 114),
(4046, 'Venue Request submitted', 'Reservation Request', '2025-10-28 14:49:48', 77),
(4047, 'Venue (Main West Ground) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-28 15:16:04', 114),
(4048, 'Vehicle (NOSUU) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-28 15:16:07', 114),
(4049, 'Equipment Unit (Aircon - SN: AR-001) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-28 15:16:09', 114),
(4050, 'Equipment Unit (Monitor - SN: MX-003) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-28 15:16:11', 114),
(4051, 'Equipment Unit (Monitor - SN: MX-002) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-28 15:16:14', 114),
(4052, 'Equipment Unit (Monitor - SN: MX-001) availability set to Available by: Rusty C. Pisco', 'UPDATE AVAILABILITY', '2025-10-28 15:16:16', 114),
(4053, 'Reservation Report (October 2025) generated: 5 record(s) found', 'GENERATE REPORT', '2025-10-28 15:16:23', NULL),
(4054, 'User Logged out', 'LOGOUT', '2025-10-28 15:30:06', 77),
(4055, 'User Logged in', 'LOGIN', '2025-10-28 15:30:36', 72),
(4056, 'Venue Request submitted', 'Reservation Request', '2025-10-28 15:31:01', 72),
(4057, 'Reservation (qwe) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-28 15:38:17', NULL),
(4058, 'Venue Request submitted', 'Reservation Request', '2025-10-28 15:38:38', 72),
(4059, 'Venue Request submitted', 'Reservation Request', '2025-10-28 15:39:43', 72),
(4060, 'Venue Request submitted', 'Reservation Request', '2025-10-28 15:44:39', 72),
(4061, 'Venue Request submitted', 'Reservation Request', '2025-10-28 15:47:28', 72),
(4062, 'User Logged out', 'LOGOUT', '2025-10-28 15:47:56', 78),
(4063, 'User Logged in', 'LOGIN', '2025-10-28 15:48:06', 77),
(4064, 'User Logged out', 'LOGOUT', '2025-10-28 15:48:59', 77),
(4065, 'User Logged in', 'LOGIN', '2025-10-28 15:49:12', 109),
(4066, 'Venue Request submitted', 'Reservation Request', '2025-10-28 16:11:24', 72),
(4067, 'Reservation \'asd\' approved by Angeline  Rolola', 'APPROVE', '2025-10-28 16:14:12', 109),
(4068, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-28 16:19:54', 114),
(4069, 'Vehicle Request submitted', 'Reservation Request', '2025-10-28 16:24:18', 109),
(4070, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-28 17:06:05', 99),
(4071, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-28 17:06:49', 109),
(4072, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-28 17:22:03', 99),
(4073, 'Venue Request submitted', 'Reservation Request', '2025-10-28 17:22:25', 109),
(4074, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-28 17:22:56', 99),
(4075, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-28 17:23:07', 114),
(4076, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-28 17:25:04', 114),
(4077, 'User Logged out', 'LOGOUT', '2025-10-28 17:25:30', 72),
(4078, 'User Logged in', 'LOGIN', '2025-10-28 17:25:38', 78),
(4079, 'Venue Main West Ground released by: Virjillo Datario', 'RELEASE', '2025-10-28 17:25:42', 78),
(4080, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-28 17:25:47', 78),
(4081, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-28 17:25:48', 78),
(4082, 'Virjillo Datario checked (asd)', 'CHECK', '2025-10-28 17:25:49', 78),
(4083, 'Venue Main West Ground returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-28 17:34:38', 78),
(4084, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-10-28 17:34:41', 78),
(4085, 'User Logged out', 'LOGOUT', '2025-10-28 17:44:22', 78),
(4086, 'User Logged in', 'LOGIN', '2025-10-28 17:44:28', 96),
(4087, 'Venue Request submitted', 'Reservation Request', '2025-10-28 17:44:52', 109),
(4088, 'Venue Request submitted', 'Reservation Request', '2025-10-28 17:44:53', 96),
(4089, 'Venue Request submitted', 'Reservation Request', '2025-10-28 17:51:18', 96),
(4090, 'Venue Request submitted', 'Reservation Request', '2025-10-28 17:51:19', 109),
(4091, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:00:29', 96),
(4092, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:00:30', 109),
(4093, 'User Logged out', 'LOGOUT', '2025-10-28 18:01:02', 109),
(4094, 'User Logged in', 'LOGIN', '2025-10-28 18:01:13', 77),
(4095, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:01:45', 96),
(4096, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:01:46', 77),
(4097, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:11:09', 96),
(4098, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:11:10', 77),
(4099, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:13:10', 96),
(4100, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:13:12', 77),
(4101, 'User Logged out', 'LOGOUT', '2025-10-28 18:17:19', 114),
(4102, 'User Logged in', 'LOGIN', '2025-10-28 18:17:28', 77),
(4103, 'User Logged in', 'LOGIN', '2025-10-28 18:17:37', 109),
(4104, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:18:03', 109),
(4105, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:21:49', 109),
(4106, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:21:50', 77),
(4107, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:22:16', 109),
(4108, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:22:17', 77),
(4109, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:23:09', 109),
(4110, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:23:10', 77),
(4111, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:23:46', 109),
(4112, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:23:47', 77),
(4113, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:24:22', 109),
(4114, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:24:23', 77),
(4115, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:26:08', 77),
(4116, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:26:09', 109),
(4117, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:26:57', 109),
(4118, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:26:58', 77),
(4119, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:31:07', 109),
(4120, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:31:08', 77),
(4121, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:32:36', 77),
(4122, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:32:37', 109),
(4123, 'Equipment Request submitted', 'Reservation Request', '2025-10-28 18:38:43', 109),
(4124, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:39:23', 109),
(4125, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:39:24', 77),
(4126, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:42:39', 77),
(4127, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:42:40', 109),
(4128, 'Vehicle Request submitted', 'Reservation Request', '2025-10-28 18:45:08', 109),
(4129, 'User Logged out', 'LOGOUT', '2025-10-28 18:49:06', 109),
(4130, 'User Logged in', 'LOGIN', '2025-10-28 18:49:22', 99),
(4131, 'Updated Venue: Roof Deck', 'UPDATE VENUE', '2025-10-28 18:50:00', 99),
(4132, 'Updated Venue: MS Stage', 'UPDATE VENUE', '2025-10-28 18:50:05', 99),
(4133, 'Updated Venue: Roof Deck', 'UPDATE VENUE', '2025-10-28 18:50:11', 99),
(4134, 'Updated Venue: BED Lobby', 'UPDATE VENUE', '2025-10-28 18:50:16', 99),
(4135, 'Venue Request submitted', 'Reservation Request', '2025-10-28 18:51:59', 96),
(4136, 'User Logged in', 'LOGIN', '2025-10-28 18:53:14', 114),
(4137, 'User Logged in', 'LOGIN', '2025-10-28 18:53:34', 99),
(4138, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-28 18:53:46', 99),
(4139, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-28 18:53:58', 114),
(4140, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-28 18:54:03', 114),
(4141, 'User Logged out', 'LOGOUT', '2025-10-28 18:54:05', 114),
(4142, 'User Logged in', 'LOGIN', '2025-10-28 18:54:14', 78),
(4143, 'Venue MS Stage released by: Virjillo Datario', 'RELEASE', '2025-10-28 18:54:29', 78),
(4144, 'Venue Main West Lobby released by: Virjillo Datario', 'RELEASE', '2025-10-28 18:54:30', 78),
(4145, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-28 18:54:31', 78),
(4146, 'Venue QUADRANGLE released by: Virjillo Datario', 'RELEASE', '2025-10-28 18:54:33', 78),
(4147, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-28 18:54:36', 78),
(4148, 'Virjillo Datario checked (Lights are working)', 'CHECK', '2025-10-28 18:54:37', 78),
(4149, 'Virjillo Datario checked (Setup)', 'CHECK', '2025-10-28 18:54:37', 78),
(4150, 'Virjillo Datario checked (GSD)', 'CHECK', '2025-10-28 18:54:39', 78),
(4151, 'Virjillo Datario checked (Kani)', 'CHECK', '2025-10-28 18:54:40', 78),
(4152, 'Virjillo Datario checked (edited checklist)', 'CHECK', '2025-10-28 18:54:41', 78),
(4153, 'Virjillo Datario checked (dsa)', 'CHECK', '2025-10-28 18:54:41', 78),
(4154, 'Virjillo Datario checked (dsa)', 'CHECK', '2025-10-28 18:54:42', 78),
(4155, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-28 18:55:57', NULL),
(4156, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-28 18:56:48', 78),
(4157, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-28 18:56:48', 78),
(4158, 'Venue Roof Deck returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 18:57:22', 78),
(4159, 'Venue Main West Lobby returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 18:57:24', 78),
(4160, 'Venue QUADRANGLE returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 18:57:27', 78),
(4161, 'Venue MS Stage returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 18:57:30', 78),
(4162, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-28 18:57:33', 78),
(4163, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-10-28 18:57:35', 78),
(4164, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-10-28 18:57:58', 78),
(4165, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-28 18:58:59', 99),
(4166, 'User Logged out', 'LOGOUT', '2025-10-28 19:01:10', 77),
(4167, 'User Logged in', 'LOGIN', '2025-10-28 19:01:18', 109),
(4168, 'Venue Request submitted', 'Reservation Request', '2025-10-28 19:01:31', 109),
(4169, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-28 19:04:53', NULL),
(4170, 'Reservation (asd) has set to completed by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2025-10-28 19:05:26', 99),
(4171, 'Venue Request submitted', 'Reservation Request', '2025-10-28 19:07:02', 96),
(4172, 'Venue Request submitted', 'Reservation Request', '2025-10-28 19:07:03', 109),
(4173, 'Updated Vehicle Category: \'Sedan\' -> \'Sedan\'', 'UPDATE', '2025-10-28 19:08:23', 99),
(4174, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-28 19:09:23', NULL),
(4175, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-28 19:09:58', 99),
(4176, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-28 19:10:10', 99),
(4177, 'User: asd A. asd has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-10-28 19:12:48', NULL),
(4178, 'Equipment Unit (Aircon - SN: AR-001) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-28 19:13:30', 99),
(4179, 'Venue (MS Stage) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-28 19:13:33', 99),
(4180, 'Venue (QUADRANGLE) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-28 19:13:36', 99),
(4181, 'Venue (Main West Lobby) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-28 19:13:38', 99),
(4182, 'Venue (Roof Deck) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-28 19:13:40', 99),
(4183, 'User Logged out', 'LOGOUT', '2025-10-28 19:52:41', 99),
(4184, 'User Logged in', 'LOGIN', '2025-10-28 19:52:47', 99),
(4185, 'User Logged out', 'LOGOUT', '2025-10-28 19:52:56', 99),
(4186, 'User Logged in', 'LOGIN', '2025-10-28 19:53:05', 77),
(4187, 'User Logged in', 'LOGIN', '2025-10-28 19:53:14', 114),
(4188, 'User Logged out', 'LOGOUT', '2025-10-28 19:53:20', 114),
(4189, 'User Logged in', 'LOGIN', '2025-10-28 19:53:28', 96),
(4190, 'Venue Request submitted', 'Reservation Request', '2025-10-28 19:54:00', 77),
(4191, 'Venue Request submitted', 'Reservation Request', '2025-10-28 19:54:01', 96),
(4192, 'Vehicle Request submitted', 'Reservation Request', '2025-10-28 19:58:12', 96),
(4193, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:00:10', 77),
(4194, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:00:11', 96),
(4195, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:15:22', 96),
(4196, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:15:24', 77),
(4197, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:26:36', 96),
(4198, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:26:39', 77),
(4199, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:33:27', 96),
(4200, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:33:28', 77),
(4201, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:42:05', 77),
(4202, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:42:07', 96),
(4203, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:42:10', 96),
(4204, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:42:14', 96),
(4205, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:44:09', 96),
(4206, 'Venue Request submitted', 'Reservation Request', '2025-10-28 20:45:39', 96),
(4207, 'User Logged out', 'LOGOUT', '2025-10-28 23:34:58', 96),
(4208, 'User Logged in', 'LOGIN', '2025-10-28 23:35:06', 99),
(4209, 'Equipment (Papers) has increase quantity: 100', 'UPDATE QUANTITY', '2025-10-28 23:36:43', 99),
(4210, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-28 23:37:01', 99),
(4211, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-28 23:44:12', 99),
(4212, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-28 23:44:35', 99),
(4213, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-10-28 23:44:41', 99),
(4214, 'User Logged in', 'LOGIN', '2025-10-29 00:16:35', 77),
(4215, 'Venue Request submitted', 'Reservation Request', '2025-10-29 00:25:06', 77),
(4216, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-29 00:45:29', 99),
(4217, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-29 00:46:01', 99),
(4218, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-10-29 01:00:33', 77),
(4219, 'Venue Request submitted', 'Reservation Request', '2025-10-29 01:25:05', 77),
(4220, 'User Logged in', 'LOGIN', '2025-10-29 01:25:38', 114),
(4221, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-29 01:25:51', 99),
(4222, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-29 01:25:57', 114),
(4223, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-29 01:26:00', 114),
(4224, 'User Logged out', 'LOGOUT', '2025-10-29 01:26:12', 96),
(4225, 'User Logged out', 'LOGOUT', '2025-10-29 02:26:05', 99),
(4226, 'User Logged in', 'LOGIN', '2025-10-29 02:26:13', 78),
(4227, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-29 02:26:19', 78),
(4228, 'User Logged out', 'LOGOUT', '2025-10-29 13:17:24', 78),
(4229, 'User Logged in', 'LOGIN', '2025-10-29 13:17:30', 99),
(4230, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-29 13:17:57', 99),
(4231, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-29 13:23:58', 99),
(4232, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-29 13:24:11', 99),
(4233, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-29 13:24:16', 99),
(4234, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-29 13:24:27', 99),
(4235, 'Updated Venue: Main West Ground', 'UPDATE VENUE', '2025-10-29 13:24:41', 99),
(4236, 'Equipment (Monitor) has new Serial Number: asd', 'CREATE UNIT', '2025-10-29 13:25:31', 99),
(4237, 'User: asd A. asd has been created', 'CREATE USER', '2025-10-29 13:26:45', NULL),
(4238, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-29 13:27:24', 99),
(4239, 'User Logged out', 'LOGOUT', '2025-10-29 13:27:36', 99),
(4240, 'User Logged in', 'LOGIN', '2025-10-29 13:27:46', 109),
(4241, 'Venue Request submitted', 'Reservation Request', '2025-10-29 13:30:36', 109),
(4242, 'User Logged in', 'LOGIN', '2025-10-29 13:31:04', 77),
(4243, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-29 13:31:07', 77),
(4244, 'Marked notifications as read (count: 5)', 'READ NOTIFICATION', '2025-10-29 13:31:30', 77),
(4245, 'User Logged out', 'LOGOUT', '2025-10-29 13:31:31', 77),
(4246, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-29 13:32:04', 109),
(4247, 'User Logged out', 'LOGOUT', '2025-10-29 13:32:08', 109),
(4248, 'User Logged in', 'LOGIN', '2025-10-29 13:32:16', 99),
(4249, 'User Logged in', 'LOGIN', '2025-10-29 13:32:59', 109),
(4250, 'Venue Request submitted', 'Reservation Request', '2025-10-29 13:33:30', 109),
(4251, 'Reservation \'asd\' declined by Jeniffer B Tubaon', 'DECLINE', '2025-10-29 13:35:21', 99),
(4252, 'Venue Request submitted', 'Reservation Request', '2025-10-29 13:36:14', 109),
(4253, 'User Logged out', 'LOGOUT', '2025-10-29 13:36:34', 109),
(4254, 'User Logged in', 'LOGIN', '2025-10-29 13:37:06', 72),
(4255, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-29 13:37:09', 72),
(4256, 'Venue Request submitted', 'Reservation Request', '2025-10-29 13:37:30', 72),
(4257, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-29 13:37:47', 72),
(4258, 'User Logged in', 'LOGIN', '2025-10-29 13:38:13', 109),
(4259, 'Reservation \'asd\' approved by Angeline  Rolola', 'APPROVE', '2025-10-29 13:38:19', 109),
(4260, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-29 13:39:48', 99),
(4261, 'User Logged out', 'LOGOUT', '2025-10-29 13:39:53', 72),
(4262, 'User Logged in', 'LOGIN', '2025-10-29 13:40:06', 114),
(4263, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-29 13:40:45', 114),
(4264, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-29 13:41:07', 99),
(4265, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-29 13:41:13', 114),
(4266, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-29 13:41:26', 114),
(4267, 'User Logged out', 'LOGOUT', '2025-10-29 13:41:28', 114),
(4268, 'User Logged in', 'LOGIN', '2025-10-29 13:41:35', 78),
(4269, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-29 13:41:50', 78),
(4270, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-29 13:41:51', 78),
(4271, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-29 13:45:42', 78),
(4272, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-29 13:45:44', 78);
INSERT INTO `audit_log` (`id`, `description`, `action`, `created_at`, `created_by`) VALUES
(4273, 'Virjillo Datario checked (Available)', 'CHECK', '2025-10-29 13:45:45', 78),
(4274, 'Venue Roof Deck released by: Virjillo Datario', 'RELEASE', '2025-10-29 13:46:46', 78),
(4275, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2025-10-29 13:47:24', 78),
(4276, 'Virjillo Datario checked (Kani)', 'CHECK', '2025-10-29 13:47:27', 78),
(4277, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2025-10-29 13:47:28', 78),
(4278, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2025-10-29 13:47:29', 78),
(4279, 'Venue Roof Deck returned by: Virjillo Datario - condition: For Inspection - remarks: Inspect pls', 'RETURN', '2025-10-29 13:47:49', 78),
(4280, 'Venue Auditorium returned by: Virjillo Datario - condition: For Inspection - remarks: Inspect pls', 'RETURN', '2025-10-29 13:47:53', 78),
(4281, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Damage - remarks: Inspect pls', 'RETURN', '2025-10-29 13:48:05', 78),
(4282, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: Good - remarks: Inspect pls', 'RETURN', '2025-10-29 13:48:21', 78),
(4283, 'Equipment Unit Unit AR-001 returned by: Virjillo Datario - condition: Damage - remarks: Inspect pls', 'RETURN', '2025-10-29 13:48:28', 78),
(4284, 'Reservation (asd) has set to completed by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2025-10-29 13:49:12', 99),
(4285, 'Equipment Unit (Aircon - SN: AR-001) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-29 13:50:41', 99),
(4286, 'Equipment Unit (Big Sound System - SN: BSS-001) availability set to Available by: Jeniffer B. Tubaon', 'UPDATE AVAILABILITY', '2025-10-29 13:50:43', 99),
(4287, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2025-10-29 13:51:07', 99),
(4288, 'User Logged out', 'LOGOUT', '2025-10-29 13:52:04', 99),
(4289, 'User Logged in', 'LOGIN', '2025-10-29 13:52:20', 77),
(4290, 'User Logged out', 'LOGOUT', '2025-10-29 13:52:25', 78),
(4291, 'User Logged in', 'LOGIN', '2025-10-29 13:52:35', 109),
(4292, 'Venue Request submitted', 'Reservation Request', '2025-10-29 13:53:29', 77),
(4293, 'User Logged out', 'LOGOUT', '2025-10-29 13:54:49', 109),
(4294, 'User Logged in', 'LOGIN', '2025-10-29 13:55:08', 99),
(4295, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-29 13:55:19', 99),
(4296, 'User Logged out', 'LOGOUT', '2025-10-29 13:57:47', 99),
(4297, 'User Logged in', 'LOGIN', '2025-10-29 13:57:56', 109),
(4298, 'Venue Request submitted', 'Reservation Request', '2025-10-29 13:58:08', 109),
(4299, 'User Logged out', 'LOGOUT', '2025-10-29 13:59:13', 109),
(4300, 'User Logged in', 'LOGIN', '2025-10-29 13:59:27', 77),
(4301, 'User Logged out', 'LOGOUT', '2025-10-29 13:59:38', 77),
(4302, 'User Logged in', 'LOGIN', '2025-10-29 13:59:49', 109),
(4303, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-10-29 14:00:00', 77),
(4304, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-29 14:14:11', 77),
(4305, 'User Logged out', 'LOGOUT', '2025-10-29 14:23:57', 109),
(4306, 'User Logged in', 'LOGIN', '2025-10-29 14:24:10', 99),
(4307, 'Venue Request submitted', 'Reservation Request', '2025-10-29 14:50:32', 77),
(4308, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-29 14:55:21', 99),
(4309, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-10-29 15:22:32', 77),
(4310, 'User Logged out', 'LOGOUT', '2025-10-29 15:58:03', 77),
(4311, 'User Logged in', 'LOGIN', '2025-10-29 16:22:22', 96),
(4312, 'Venue Request submitted', 'Reservation Request', '2025-10-29 16:22:38', 96),
(4313, 'User Logged out', 'LOGOUT', '2025-10-29 17:01:51', 99),
(4314, 'User Logged in', 'LOGIN', '2025-10-29 17:02:07', 107),
(4315, 'User Logged out', 'LOGOUT', '2025-10-29 17:02:22', 107),
(4316, 'User Logged in', 'LOGIN', '2025-10-29 17:02:28', 99),
(4317, 'User: Randy Hereza has been updated. Changes: license number: null -> 123', 'UPDATE USER', '2025-10-29 17:04:27', NULL),
(4318, 'User Logged out', 'LOGOUT', '2025-10-29 17:17:33', 99),
(4319, 'User Logged in', 'LOGIN', '2025-10-29 17:18:05', 107),
(4320, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-29 17:22:04', 107),
(4321, 'Profile updated for: Randy Hereza', 'UPDATE PROFILE', '2025-10-29 17:23:50', 107),
(4322, 'Profile updated for: Randy Hereza', 'UPDATE PROFILE', '2025-10-29 17:27:09', 107),
(4323, 'User Logged out', 'LOGOUT', '2025-10-29 22:42:23', 107),
(4324, 'User Logged in', 'LOGIN', '2025-10-29 22:47:30', 99),
(4325, 'User Logged in', 'LOGIN', '2025-10-29 23:54:45', 114),
(4326, 'Venue Request submitted', 'Reservation Request', '2025-10-29 23:55:04', 96),
(4327, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-29 23:57:59', 99),
(4328, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-29 23:58:05', 114),
(4329, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-29 23:58:09', 114),
(4330, 'User Logged in', 'LOGIN', '2025-10-30 00:51:24', 78),
(4331, 'Venue Main West Ground released by: Virjillo Datario', 'RELEASE', '2025-10-30 00:51:31', 78),
(4332, 'Virjillo Datario checked (asd)', 'CHECK', '2025-10-30 00:51:33', 78),
(4333, 'Equipment Request submitted', 'Reservation Request', '2025-10-30 00:51:54', 96),
(4334, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-30 00:52:06', 99),
(4335, 'Reservation \'asd\' approved by Rusty C  Pisco', 'APPROVE', '2025-10-30 00:52:29', 114),
(4336, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-10-30 00:52:34', 114),
(4337, 'Virjillo Datario checked (Sample Checklist)', 'CHECK', '2025-10-30 00:53:17', 78),
(4338, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-10-30 00:53:20', 78),
(4339, 'Virjillo Datario checked (Check if functional)', 'CHECK', '2025-10-30 00:53:20', 78),
(4340, 'User Logged in', 'LOGIN', '2025-10-30 08:57:50', 77),
(4341, 'Venue Request submitted', 'Reservation Request', '2025-10-30 08:58:06', 77),
(4342, 'Venue Request submitted', 'Reservation Request', '2025-10-30 08:58:22', 77),
(4343, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-30 09:00:42', NULL),
(4344, 'Reservation (asd) was cancelled by: User #0', 'UPDATE STATUS', '2025-10-30 09:02:31', NULL),
(4345, 'Reservation (asd) was cancelled by: Darwin M. Galudo', 'UPDATE STATUS', '2025-10-30 09:05:13', 77),
(4346, 'Venue Request submitted', 'Reservation Request', '2025-10-30 09:07:58', 77),
(4347, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2025-10-31 10:02:02', 99),
(4348, 'User Logged in', 'LOGIN', '2025-10-31 10:10:16', 77),
(4349, 'Venue Request submitted', 'Reservation Request', '2025-10-31 10:10:36', 77),
(4350, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-31 10:11:16', 99),
(4351, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-31 10:11:29', 96),
(4352, 'User Logged out', 'LOGOUT', '2025-10-31 10:11:31', 96),
(4353, 'User Logged in', 'LOGIN', '2025-10-31 10:11:40', 109),
(4354, 'Venue Request submitted', 'Reservation Request', '2025-10-31 10:12:03', 109),
(4355, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-31 10:15:30', 99),
(4356, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-31 10:16:59', 77),
(4357, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-31 10:16:59', 77),
(4358, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-31 10:17:00', 77),
(4359, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2025-10-31 10:19:03', 77),
(4360, 'User Logged out', 'LOGOUT', '2025-10-31 10:19:16', 77),
(4361, 'User Logged in', 'LOGIN', '2025-10-31 10:19:24', 107),
(4362, 'User: asd A. asd has been updated. Changes: license number: null -> 12', 'UPDATE USER', '2025-10-31 10:22:43', NULL),
(4363, 'User Logged in', 'LOGIN', '2025-10-31 11:56:17', 109),
(4364, 'User Logged out', 'LOGOUT', '2025-10-31 11:56:35', 109),
(4365, 'User Logged in', 'LOGIN', '2025-10-31 11:56:45', 77),
(4366, 'User Logged in', 'LOGIN', '2025-10-31 15:03:23', 77),
(4367, 'Vehicle Request submitted', 'Reservation Request', '2025-10-31 15:03:40', 77),
(4368, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-10-31 15:03:52', 99),
(4369, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-10-31 15:10:14', 99),
(4370, 'Vehicle Request submitted', 'Reservation Request', '2025-10-31 15:30:23', 77),
(4371, 'User Logged in', 'LOGIN', '2025-11-01 00:31:59', 99),
(4372, 'User Logged out', 'LOGOUT', '2025-11-01 00:32:10', 99),
(4373, 'User Logged in', 'LOGIN', '2025-11-01 00:32:55', 99),
(4374, 'User Logged out', 'LOGOUT', '2025-11-01 00:32:59', 99),
(4375, 'User Logged in', 'LOGIN', '2025-11-01 00:33:44', 99),
(4376, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-11-01 00:35:18', 99),
(4377, 'User Logged in', 'LOGIN', '2025-11-01 00:37:23', 77),
(4378, 'Venue Request submitted', 'Reservation Request', '2025-11-01 00:37:44', 77),
(4379, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-11-01 00:37:58', 77),
(4380, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2025-11-01 00:53:02', 99),
(4381, 'Created Vehicle : 12233', 'CREATE', '2025-11-01 00:55:53', 99),
(4382, 'User: Fatima A. Vergel has been updated. Changes: license number: null -> asd; user level: 19 -> 20', 'UPDATE USER', '2025-11-01 00:56:31', NULL),
(4383, 'Vehicle Request submitted', 'Reservation Request', '2025-11-01 00:57:17', 77),
(4384, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-11-01 00:57:31', 77),
(4385, 'Venue Request submitted', 'Reservation Request', '2025-11-01 00:59:31', 77),
(4386, 'User Logged in', 'LOGIN', '2025-11-01 11:14:45', 77),
(4387, 'User Logged out', 'LOGOUT', '2025-11-01 12:03:18', 77),
(4388, 'User Logged in', 'LOGIN', '2025-11-01 12:03:54', 99),
(4389, 'User Logged out', 'LOGOUT', '2025-11-01 12:06:48', 99),
(4390, 'User Logged in', 'LOGIN', '2025-11-01 12:07:18', 99),
(4391, 'User Logged in', 'LOGIN', '2025-11-01 12:07:27', 99),
(4392, 'User Logged in', 'LOGIN', '2025-11-01 12:09:30', 99),
(4393, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-11-01 12:15:42', 99),
(4394, 'Updated Venue: Main West Grounds', 'UPDATE VENUE', '2025-11-01 12:20:38', 99),
(4395, 'User Logged out', 'LOGOUT', '2025-11-01 13:34:21', 99),
(4396, 'User Logged in', 'LOGIN', '2025-11-03 11:04:01', 99),
(4397, 'User Logged in', 'LOGIN', '2025-11-05 08:57:30', 99),
(4398, 'User Logged in', 'LOGIN', '2025-11-05 08:57:50', 114),
(4399, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-11-05 09:05:18', 114),
(4400, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2025-11-05 09:09:08', 109),
(4401, 'Updated Venue: Main West Grounds', 'UPDATE VENUE', '2025-11-05 09:14:14', 99),
(4402, 'Updated Venue: Main West Grounds', 'UPDATE VENUE', '2025-11-05 09:14:59', 99),
(4403, 'Updated Venue: Auditorium', 'UPDATE VENUE', '2025-11-05 09:15:04', 99),
(4404, 'Updated Venue: Roof Deck', 'UPDATE VENUE', '2025-11-05 09:15:10', 99),
(4405, 'Venue Request submitted', 'Reservation Request', '2025-11-05 09:16:42', 109),
(4406, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-11-05 09:17:49', 109),
(4407, 'User Logged in', 'LOGIN', '2025-11-05 09:18:11', 77),
(4408, 'Reservation \'asd\' approved by Darwin M Galudo', 'APPROVE', '2025-11-05 09:18:14', 77),
(4409, 'User: Randy Hereza has been updated. Changes: no field changes detected', 'UPDATE USER', '2025-11-05 09:19:10', NULL),
(4410, 'Vehicle Request submitted', 'Reservation Request', '2025-11-05 09:19:59', 109),
(4411, 'Reservation \'ILIGAN\' approved by Jeniffer B Tubaon', 'APPROVE', '2025-11-05 09:20:17', 99),
(4412, 'Reservation \'ILIGAN\' approved by Rusty C  Pisco', 'APPROVE', '2025-11-05 09:20:27', 114),
(4413, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2025-11-05 09:20:33', 114),
(4414, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2025-11-05 09:20:37', 99),
(4415, 'User Logged out', 'LOGOUT', '2025-11-05 09:20:46', 77),
(4416, 'User Logged in', 'LOGIN', '2025-11-05 09:20:56', 78),
(4417, 'Vehicle Hiace (NOSUU) released by: Virjillo Datario', 'RELEASE', '2025-11-05 09:21:00', 78),
(4418, 'Vehicle Hiace (NOSUU) released by: Virjillo Datario', 'RELEASE', '2025-11-05 09:21:42', 78),
(4419, 'Vehicle Hiace (NOSUU) released by: Virjillo Datario', 'RELEASE', '2025-11-05 09:28:26', 78),
(4420, 'Vehicle Hiace (NOSUU) released by: Virjillo Datario', 'RELEASE', '2025-11-05 09:30:53', 78),
(4421, 'Virjillo Datario checked (asd)', 'CHECK', '2025-11-05 09:31:19', 78),
(4422, 'Vehicle Hiace (NOSUU) returned by: Virjillo Datario - condition: For Inspection', 'RETURN', '2025-11-05 09:31:22', 78),
(4423, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-11-05 09:31:26', 78),
(4424, 'Virjillo Datario checked (Check If Working)', 'CHECK', '2025-11-05 09:31:29', 78),
(4425, 'Virjillo Datario checked (Check if functional)', 'CHECK', '2025-11-05 09:31:30', 78),
(4426, 'Equipment Unit Unit BSS-001 returned by: Virjillo Datario - condition: Good', 'RETURN', '2025-11-05 09:31:34', 78),
(4427, 'Equipment Unit Unit BSS-002 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-11-05 09:31:37', 78),
(4428, 'Equipment Unit Unit CCM-001 returned by: Virjillo Datario - condition: Damage', 'RETURN', '2025-11-05 09:31:42', 78),
(4429, 'Reservation (ILIGAN) has set to completed by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2025-11-05 09:31:53', 99),
(4430, 'User Logged in', 'LOGIN', '2026-01-02 20:38:38', 99),
(4431, 'User Logged out', 'LOGOUT', '2026-01-02 21:22:06', 77),
(4432, 'User Logged in', 'LOGIN', '2026-01-02 21:22:20', 99),
(4433, 'User Logged out', 'LOGOUT', '2026-01-02 21:26:12', 99),
(4434, 'User Logged in', 'LOGIN', '2026-01-02 21:26:20', 77),
(4435, 'Vehicle Request submitted', 'Reservation Request', '2026-01-02 21:56:38', 77),
(4436, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-02 22:11:27', 99),
(4437, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2026-01-02 22:11:42', 99),
(4438, 'User Logged in', 'LOGIN', '2026-01-03 22:26:55', 77),
(4439, 'Created Venue : samplevenue', 'CREATE', '2026-01-03 22:29:41', 99),
(4440, 'Updated Venue: samplevenues', 'UPDATE VENUE', '2026-01-03 22:29:49', 99),
(4441, 'Reservation (asd) was cancelled by: Darwin M. Galudo', 'UPDATE STATUS', '2026-01-03 22:34:35', 77),
(4442, 'Created Location: sample', 'CREATE LOCATION', '2026-01-04 02:43:14', 99),
(4443, 'Updated Location #2: samples', 'UPDATE LOCATION', '2026-01-04 02:43:17', 99),
(4444, 'User Logged out', 'LOGOUT', '2026-01-04 03:15:15', 99),
(4445, 'User Logged in', 'LOGIN', '2026-01-04 23:15:55', 99),
(4446, 'User Logged in', 'LOGIN', '2026-01-04 23:16:29', 78),
(4447, 'User Logged out', 'LOGOUT', '2026-01-04 23:43:20', 99),
(4448, 'User Logged in', 'LOGIN', '2026-01-04 23:43:33', 78),
(4449, 'User Logged out', 'LOGOUT', '2026-01-04 23:53:14', 78),
(4450, 'User Logged in', 'LOGIN', '2026-01-04 23:53:24', 77),
(4451, 'Vehicle Request submitted', 'Reservation Request', '2026-01-05 00:13:09', 77),
(4452, 'User Logged in', 'LOGIN', '2026-01-05 19:19:18', 77),
(4453, 'User Logged out', 'LOGOUT', '2026-01-05 19:19:23', 77),
(4454, 'User Logged in', 'LOGIN', '2026-01-05 19:19:31', 99),
(4455, 'User Logged in', 'LOGIN', '2026-01-05 19:27:52', 77),
(4456, 'Vehicle Request submitted', 'Reservation Request', '2026-01-05 19:28:21', 77),
(4457, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-05 19:28:55', 99),
(4458, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2026-01-05 19:29:04', 99),
(4459, 'Archived Vehicle resource(s): 1', 'ARCHIVE', '2026-01-05 19:35:01', 99),
(4460, 'Unarchived Venue resource(s): 1', 'UNARCHIVE', '2026-01-05 19:35:40', 99),
(4461, 'Unarchived Vehicle resource(s): 1', 'UNARCHIVE', '2026-01-05 19:37:07', 99),
(4462, 'Updated Location #2: MS', 'UPDATE LOCATION', '2026-01-05 19:40:58', 99),
(4463, 'Reservation (asd) was cancelled by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-01-05 19:51:19', 99),
(4464, 'Vehicle Request submitted', 'Reservation Request', '2026-01-05 19:55:23', 77),
(4465, 'User Logged in', 'LOGIN', '2026-01-06 07:58:23', 77),
(4466, 'User Logged out', 'LOGOUT', '2026-01-06 08:39:36', 77),
(4467, 'User Logged in', 'LOGIN', '2026-01-06 08:39:49', 78),
(4468, 'User Logged out', 'LOGOUT', '2026-01-06 08:44:00', 78),
(4469, 'User Logged in', 'LOGIN', '2026-01-06 08:44:15', 77),
(4470, 'User Logged in', 'LOGIN', '2026-01-07 14:30:59', 77),
(4471, 'Marked notifications as read (count: 10)', 'READ NOTIFICATION', '2026-01-07 14:31:13', 77),
(4472, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-07 14:38:10', 99),
(4473, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-07 14:38:13', 99),
(4474, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-07 14:46:24', 99),
(4475, 'Reservation (asd) was cancelled by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-01-07 14:46:53', 99),
(4476, 'User Logged out', 'LOGOUT', '2026-01-07 15:41:39', 77),
(4477, 'User Logged out', 'LOGOUT', '2026-01-07 15:41:53', 99),
(4478, 'User Logged in', 'LOGIN', '2026-01-08 08:45:49', 99),
(4479, 'User Logged in', 'LOGIN', '2026-01-08 08:46:12', 77),
(4480, 'Venue Request submitted', 'Reservation Request', '2026-01-08 08:47:03', 77),
(4481, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-08 08:47:12', 99),
(4482, 'Venue Request submitted', 'Reservation Request', '2026-01-08 08:47:31', 77),
(4483, 'Venue Request submitted', 'Reservation Request', '2026-01-08 08:48:03', 77),
(4484, 'User Logged out', 'LOGOUT', '2026-01-08 09:00:49', 77),
(4485, 'User Logged in', 'LOGIN', '2026-01-08 09:00:59', 72),
(4486, 'Reservation (asd) was cancelled by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-01-08 09:01:23', 99),
(4487, 'User Logged in', 'LOGIN', '2026-01-10 02:13:43', 77),
(4488, 'User Logged out', 'LOGOUT', '2026-01-10 02:13:47', 77),
(4489, 'User Logged in', 'LOGIN', '2026-01-10 02:13:56', 99),
(4490, 'Created Venue : dsaa', 'CREATE', '2026-01-10 02:14:39', 99),
(4491, 'Updated Venue: dsaa', 'UPDATE VENUE', '2026-01-10 02:18:37', 99),
(4492, 'Updated Venue: dsaa', 'UPDATE VENUE', '2026-01-10 02:18:43', 99),
(4493, 'Updated Venue: dsaa', 'UPDATE VENUE', '2026-01-10 02:18:47', 99),
(4494, 'Created Vehicle : asd', 'CREATE', '2026-01-10 02:19:10', 99),
(4495, 'Updated Vehicle: \'asd\' -> \'asddddddd\'', 'UPDATE VEHICLE', '2026-01-10 02:19:15', 99),
(4496, 'Created Equipment : dsaaaa', 'CREATE', '2026-01-10 02:19:22', 99),
(4497, 'Created Equipment : asdasdasd', 'CREATE', '2026-01-10 02:19:38', 99),
(4498, 'Created Equipment : asd', 'CREATE', '2026-01-10 02:20:14', 99),
(4499, 'Created Equipment : dsaaad', 'CREATE', '2026-01-10 02:22:09', 99),
(4500, 'Archived Equipment resource(s): 1', 'ARCHIVE', '2026-01-10 02:22:13', 99),
(4501, 'User: asd A. asd has been created', 'CREATE USER', '2026-01-10 02:22:38', NULL),
(4502, 'User Logged in', 'LOGIN', '2026-01-10 02:22:54', 131),
(4503, 'Password updated by: asd a. asd', 'UPDATE PASSWORD', '2026-01-10 02:23:00', 131),
(4504, 'User Logged in', 'LOGIN', '2026-01-10 02:23:09', 131),
(4505, 'User Logged out', 'LOGOUT', '2026-01-10 02:26:14', 131),
(4506, 'User Logged in', 'LOGIN', '2026-01-10 02:26:24', 131),
(4507, 'Password updated by: asd a. asd', 'UPDATE PASSWORD', '2026-01-10 02:26:32', 131),
(4508, 'User Logged out', 'LOGOUT', '2026-01-10 02:27:40', 131),
(4509, 'User Logged in', 'LOGIN', '2026-01-10 02:27:50', 131),
(4510, 'Password updated by: asd a. asd', 'UPDATE PASSWORD', '2026-01-10 02:27:56', 131),
(4511, 'User Logged out', 'LOGOUT', '2026-01-10 02:28:48', 131),
(4512, 'User Logged in', 'LOGIN', '2026-01-10 02:28:58', 77),
(4513, 'Marked notifications as read (count: 9)', 'READ NOTIFICATION', '2026-01-10 02:42:01', 77),
(4514, 'Venue Request submitted', 'Reservation Request', '2026-01-10 02:42:24', 77),
(4515, 'Vehicle Request submitted', 'Reservation Request', '2026-01-10 02:42:38', 77),
(4516, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-10 02:43:08', 99),
(4517, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-10 02:43:11', 99),
(4518, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-10 02:43:16', 99),
(4519, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-10 02:43:19', 99),
(4520, 'User Logged out', 'LOGOUT', '2026-01-10 02:43:37', 77),
(4521, 'User Logged in', 'LOGIN', '2026-01-10 02:43:48', 78),
(4522, 'Venue Auditorium released by: Virjillo Datario', 'RELEASE', '2026-01-10 02:44:24', 78),
(4523, 'Virjillo Datario checked (Clean Venue)', 'CHECK', '2026-01-10 02:44:28', 78),
(4524, 'Virjillo Datario checked (Speakers Working)', 'CHECK', '2026-01-10 02:44:29', 78),
(4525, 'Updated Vehicle: NOSUU', 'UPDATE VEHICLE', '2026-01-10 02:44:45', 99),
(4526, 'Vehicle Hiace (NOSUU) released by: Virjillo Datario', 'RELEASE', '2026-01-10 02:45:09', 78),
(4527, 'Virjillo Datario checked (asd)', 'CHECK', '2026-01-10 02:45:12', 78),
(4528, 'Vehicle Hiace (NOSUU) returned by: Virjillo Datario - condition: For Inspection - remarks: sad', 'RETURN', '2026-01-10 02:45:16', 78),
(4529, 'Venue Auditorium returned by: Virjillo Datario - condition: Good - remarks: asd', 'RETURN', '2026-01-10 02:45:31', 78),
(4530, 'Reservation (asd) has set to completed by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-01-10 02:45:48', 99),
(4531, 'Reservation (asd) has set to completed by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-01-10 02:45:50', 99),
(4532, 'Created Holiday: \'asd\' on \'2026-01-12\'', 'CREATE', '2026-01-10 02:46:14', 99),
(4533, 'Created Building: dsaa', 'CREATE', '2026-01-10 02:46:21', 99),
(4534, 'Updated Building: dsaaa', 'UPDATE BUILDING', '2026-01-10 02:47:44', 99),
(4535, 'Updated Building: dsaaaa', 'UPDATE BUILDING', '2026-01-10 02:47:47', 99),
(4536, 'Updated Building: dsaaaad', 'UPDATE BUILDING', '2026-01-10 02:47:50', 99),
(4537, 'Updated Location #2: MSS', 'UPDATE LOCATION', '2026-01-10 02:47:59', 99),
(4538, 'Created Vehicle Make: cxz', 'CREATE', '2026-01-10 02:48:27', 99),
(4539, 'Updated Vehicle Make: \'cxz\' -> \'zxc\'', 'UPDATE', '2026-01-10 02:48:31', 99),
(4540, 'Deactivated Vehicle Make: 1 item(s)', 'DEACTIVATE', '2026-01-10 02:48:34', 99),
(4541, 'Created Vehicle Category: \'cxz\'', 'CREATE', '2026-01-10 02:48:59', 99),
(4542, 'Updated Vehicle Category: \'cxz\' -> \'zxc\'', 'UPDATE', '2026-01-10 02:49:02', 99),
(4543, 'Deactivated Vehicle Category: 1 item(s)', 'DEACTIVATE', '2026-01-10 02:49:05', 99),
(4544, 'Created Vehicle Model: \'asddda\'', 'CREATE', '2026-01-10 02:49:14', 99),
(4545, 'Updated Vehicle Model: \'asddda\' -> \'asdddad\'', 'UPDATE', '2026-01-10 02:49:18', 99),
(4546, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2026-01-12 00:20:25', 99),
(4547, 'User Logged in', 'LOGIN', '2026-01-12 04:36:38', 77),
(4548, 'Venue Request submitted', 'Reservation Request', '2026-01-12 04:37:39', 77),
(4549, 'Venue Request submitted', 'Reservation Request', '2026-01-12 04:38:00', 77),
(4550, 'Reservation \'as\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-12 04:38:10', 99),
(4551, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-12 04:38:14', 99),
(4552, 'Marked notifications as read (count: 11)', 'READ NOTIFICATION', '2026-01-12 04:39:55', 77),
(4553, 'Profile updated for: Darwin M. Galudo', 'UPDATE PROFILE', '2026-01-12 04:40:45', 77),
(4554, 'User Logged in', 'LOGIN', '2026-01-15 19:48:36', 77),
(4555, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2026-01-15 19:52:06', 99),
(4556, 'User Logged in', 'LOGIN', '2026-01-16 09:10:22', 77),
(4557, 'User Logged in', 'LOGIN', '2026-01-16 09:10:31', 77),
(4558, 'User Logged out', 'LOGOUT', '2026-01-16 09:10:37', 77),
(4559, 'User Logged in', 'LOGIN', '2026-01-16 09:10:46', 99),
(4560, 'Venue Request submitted', 'Reservation Request', '2026-01-16 09:11:05', 77),
(4561, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-16 09:11:20', 99),
(4562, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2026-01-16 09:18:03', 77),
(4563, 'User Logged in', 'LOGIN', '2026-01-22 05:15:31', 77),
(4564, 'Venue Request submitted', 'Reservation Request', '2026-01-22 05:43:15', 77),
(4565, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-22 05:55:40', 99),
(4566, 'Venue Request submitted', 'Reservation Request', '2026-01-22 05:59:36', 77),
(4567, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-22 05:59:52', 99),
(4568, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-22 06:17:58', 99),
(4569, 'User Logged in', 'LOGIN', '2026-01-24 21:41:09', 77),
(4570, 'Venue Request submitted', 'Reservation Request', '2026-01-24 21:44:52', 77),
(4571, 'Venue Request submitted', 'Reservation Request', '2026-01-24 21:47:25', 77),
(4572, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2026-01-24 22:14:17', 77),
(4573, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-24 22:28:48', 99),
(4574, 'Venue Request submitted', 'Reservation Request', '2026-01-24 22:53:47', 77),
(4575, 'Venue Request submitted', 'Reservation Request', '2026-01-24 23:22:49', 77),
(4576, 'Venue Request submitted', 'Reservation Request', '2026-01-25 00:26:17', 77),
(4577, 'Marked notifications as read (count: 7)', 'READ NOTIFICATION', '2026-01-25 00:52:43', 77),
(4578, 'User Logged in', 'LOGIN', '2026-01-26 00:38:33', 77),
(4579, 'Venue Request submitted', 'Reservation Request', '2026-01-26 00:38:58', 77),
(4580, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-01-26 00:39:24', 99),
(4581, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-01-26 00:48:12', 99),
(4582, 'User Logged in', 'LOGIN', '2026-02-01 02:30:56', 99),
(4583, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2026-02-01 02:31:19', 99),
(4584, 'User Logged in', 'LOGIN', '2026-02-02 17:44:47', 99),
(4585, 'User Logged in', 'LOGIN', '2026-02-02 17:45:52', 77),
(4586, 'Venue Request submitted', 'Reservation Request', '2026-02-02 17:46:13', 77),
(4587, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-02-02 17:48:52', 99),
(4588, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-02-02 17:49:00', 99),
(4589, 'Reservation (asd) has set to completed by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-02-02 17:55:14', 99),
(4590, 'User Logged in', 'LOGIN', '2026-02-26 22:24:14', 99),
(4591, 'User Logged in', 'LOGIN', '2026-02-26 22:25:18', 77),
(4592, 'Marked notifications as read (count: 6)', 'READ NOTIFICATION', '2026-02-26 22:25:21', 77),
(4593, 'Venue Request submitted', 'Reservation Request', '2026-02-26 22:26:15', 77),
(4594, 'Venue Request submitted', 'Reservation Request', '2026-02-26 22:26:31', 77),
(4595, 'User Logged in', 'LOGIN', '2026-02-28 22:35:53', 77),
(4596, 'User Logged in', 'LOGIN', '2026-02-28 22:36:13', 99),
(4597, 'Venue Request submitted', 'Reservation Request', '2026-02-28 22:39:04', 77),
(4598, 'Reservation \'515\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-02-28 22:39:16', 99),
(4599, 'User Logged in', 'LOGIN', '2026-02-28 22:39:51', 78),
(4600, 'Marked notifications as read (count: 4)', 'READ NOTIFICATION', '2026-03-08 21:32:09', 99),
(4601, 'User Logged in', 'LOGIN', '2026-03-08 21:37:19', 77),
(4602, 'Venue Request submitted', 'Reservation Request', '2026-03-08 21:37:36', 77),
(4603, 'Venue Request submitted', 'Reservation Request', '2026-03-08 21:39:49', 77),
(4604, 'Venue Request submitted', 'Reservation Request', '2026-03-08 21:41:27', 77),
(4605, 'Updated Location #2: MS', 'UPDATE LOCATION', '2026-03-08 21:43:20', 99),
(4606, 'Created Location: MN', 'CREATE LOCATION', '2026-03-08 21:43:27', 99),
(4607, 'Created Location: MW', 'CREATE LOCATION', '2026-03-08 21:43:37', 99),
(4608, 'Created Location: SHS', 'CREATE LOCATION', '2026-03-08 21:44:13', 99),
(4609, 'Marked notifications as read (count: 3)', 'READ NOTIFICATION', '2026-03-08 21:44:28', 99),
(4610, 'Marked notifications as read (count: 13)', 'READ NOTIFICATION', '2026-03-08 21:45:03', 77),
(4611, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-03-08 21:45:09', 99),
(4612, 'Added Checklist to venue samplevenues: No. Checklist (1) by: Jeniffer B. Tubaon', 'ADD CHECKLIST', '2026-03-08 21:45:24', 99),
(4613, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-03-08 21:45:33', 99),
(4614, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-03-08 21:49:39', 99),
(4615, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-03-08 21:49:42', 99),
(4616, 'Venue Request submitted', 'Reservation Request', '2026-03-08 21:53:51', 77),
(4617, 'Reservation \'asd\' approved by Jeniffer B Tubaon', 'APPROVE', '2026-03-08 21:54:00', 99),
(4618, 'Assigned Checklist to: Virjillo Datario', 'ASSIGN', '2026-03-08 21:54:04', 99),
(4619, 'Reservation (asd) was cancelled by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-03-08 21:59:41', 99),
(4620, 'Reservation (asd) was cancelled by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-03-08 22:01:20', 99),
(4621, 'Marked notifications as read (count: 1)', 'READ NOTIFICATION', '2026-03-09 22:25:39', 99),
(4622, 'User Logged in', 'LOGIN', '2026-03-09 22:26:06', 77),
(4623, 'Venue Request submitted', 'Reservation Request', '2026-03-09 22:26:22', 77),
(4624, 'Venue Request submitted', 'Reservation Request', '2026-03-09 22:26:58', 77),
(4625, 'Marked notifications as read (count: 2)', 'READ NOTIFICATION', '2026-03-09 22:28:23', 99),
(4626, 'Venue Request submitted', 'Reservation Request', '2026-03-09 22:32:26', 77),
(4627, 'Venue Request submitted', 'Reservation Request', '2026-03-09 22:33:30', 77),
(4628, 'Reservation (asd) was cancelled by: Jeniffer B. Tubaon', 'UPDATE STATUS', '2026-03-09 23:17:37', 99);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_otp`
--

CREATE TABLE `password_reset_otp` (
  `password_reset_otp` varchar(255) DEFAULT NULL,
  `password_otp_expiration` datetime DEFAULT NULL,
  `password_otp_email_address` varchar(255) DEFAULT NULL,
  `password_reset_id` int(11) NOT NULL,
  `password_otp_isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblcomments`
--

CREATE TABLE `tblcomments` (
  `comment_id` int(11) NOT NULL,
  `comment_complaintId` int(11) NOT NULL,
  `comment_userId` int(11) DEFAULT NULL,
  `comment_commentText` text NOT NULL,
  `comment_commentImage` varchar(255) DEFAULT NULL,
  `comment_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblcomments`
--

INSERT INTO `tblcomments` (`comment_id`, `comment_complaintId`, `comment_userId`, `comment_commentText`, `comment_commentImage`, `comment_date`) VALUES
(35, 40, 99, 'Hi Maam/Sir! A job order has been created for this ticket. A GSD personnel is going to contact you soon!', NULL, '2026-01-02 20:50:10'),
(36, 41, 99, 'test', NULL, '2026-01-05 19:41:37'),
(37, 42, 99, 'test', NULL, '2026-01-06 08:46:17'),
(38, 42, 99, 'test', NULL, '2026-01-10 02:14:11'),
(39, 43, 99, 'Hi Maam/Sir! A job order has been created for this ticket. A GSD personnel is going to contact you soon!', NULL, '2026-01-10 02:43:26'),
(40, 44, 99, 'Hi Maam/Sir! A job order has been created for this ticket. A GSD personnel is going to contact you soon!', NULL, '2026-01-12 04:37:22');

-- --------------------------------------------------------

--
-- Table structure for table `tblcomplaints`
--

CREATE TABLE `tblcomplaints` (
  `comp_id` int(11) NOT NULL,
  `comp_clientId` int(11) NOT NULL,
  `comp_locationId` int(11) NOT NULL,
  `comp_subject` varchar(255) NOT NULL,
  `comp_description` text NOT NULL,
  `comp_date` datetime NOT NULL,
  `comp_end_date` datetime DEFAULT NULL,
  `comp_date_closed` datetime DEFAULT NULL,
  `comp_locationCategoryId` int(11) NOT NULL,
  `comp_lastUser` int(11) DEFAULT NULL,
  `comp_closedBy` int(11) DEFAULT NULL,
  `comp_operation` varchar(255) DEFAULT NULL,
  `comp_remark` text DEFAULT NULL,
  `comp_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblcomplaints`
--

INSERT INTO `tblcomplaints` (`comp_id`, `comp_clientId`, `comp_locationId`, `comp_subject`, `comp_description`, `comp_date`, `comp_end_date`, `comp_date_closed`, `comp_locationCategoryId`, `comp_lastUser`, `comp_closedBy`, `comp_operation`, `comp_remark`, `comp_image`) VALUES
(40, 77, 1, 'asd', 'asd', '2026-01-02 20:38:05', '2026-01-03 00:00:00', '2026-01-04 23:49:14', 1, 78, 78, '4', 'okay na sya', 'static/complaints/complaint_1767357485_2077.png'),
(41, 77, 2, 'asd', 'asd', '2026-01-05 19:41:16', '2026-01-06 00:00:00', '2026-01-06 08:40:16', 1, 78, 78, '4', 'asd', 'static/complaints/complaint_1767613276_2778.webp'),
(42, 77, 1, 'asd', 'asd', '2026-01-06 08:44:32', '2026-01-07 00:00:00', NULL, 1, NULL, NULL, NULL, NULL, NULL),
(43, 77, 1, 'asd', 'asd', '2026-01-10 02:42:55', '2026-01-12 00:00:00', '2026-01-10 02:44:10', 1, 78, 78, '3', 'asd', 'static/complaints/complaint_1767984175_8398.webp'),
(44, 77, 1, 'asd', 'asd', '2026-01-12 04:37:02', '2026-01-12 00:00:00', '2026-02-28 22:40:15', 1, 78, 78, '3', '51515', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tblcomplaint_status_history`
--

CREATE TABLE `tblcomplaint_status_history` (
  `history_id` int(11) NOT NULL,
  `history_compId` int(11) NOT NULL,
  `history_statusId` int(11) NOT NULL,
  `history_updatedBy` int(11) NOT NULL,
  `history_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblcomplaint_status_history`
--

INSERT INTO `tblcomplaint_status_history` (`history_id`, `history_compId`, `history_statusId`, `history_updatedBy`, `history_date`) VALUES
(75, 40, 1, 77, '2026-01-02 20:38:05'),
(76, 40, 2, 99, '2026-01-02 20:50:10'),
(78, 40, 3, 78, '2026-01-04 23:49:14'),
(79, 41, 1, 77, '2026-01-05 19:41:16'),
(80, 41, 2, 99, '2026-01-05 19:41:37'),
(81, 41, 3, 78, '2026-01-06 08:40:16'),
(82, 42, 1, 77, '2026-01-06 08:44:32'),
(84, 42, 2, 99, '2026-01-10 02:14:11'),
(85, 43, 1, 77, '2026-01-10 02:42:55'),
(86, 43, 2, 99, '2026-01-10 02:43:26'),
(87, 43, 3, 78, '2026-01-10 02:44:10'),
(88, 44, 1, 77, '2026-01-12 04:37:02'),
(89, 44, 2, 99, '2026-01-12 04:37:22'),
(90, 44, 3, 78, '2026-02-28 22:40:15');

-- --------------------------------------------------------

--
-- Table structure for table `tbljobequipment`
--

CREATE TABLE `tbljobequipment` (
  `joEquipment_id` int(11) NOT NULL,
  `joEquipment_equipId` int(11) NOT NULL,
  `joEquipment_personnelId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbljobequipment`
--

INSERT INTO `tbljobequipment` (`joEquipment_id`, `joEquipment_equipId`, `joEquipment_personnelId`) VALUES
(20, 48, 35),
(21, 50, 35),
(22, 48, 35),
(23, 50, 35),
(24, 48, 36),
(25, 50, 36),
(26, 49, 39),
(27, 48, 39),
(28, 49, 40),
(29, 72, 40);

-- --------------------------------------------------------

--
-- Table structure for table `tbljoborderpersonnel`
--

CREATE TABLE `tbljoborderpersonnel` (
  `joPersonnel_id` int(11) NOT NULL,
  `joPersonnel_userId` int(11) NOT NULL,
  `joPersonnel_joId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbljoborderpersonnel`
--

INSERT INTO `tbljoborderpersonnel` (`joPersonnel_id`, `joPersonnel_userId`, `joPersonnel_joId`) VALUES
(35, 78, 35),
(36, 78, 36),
(38, 115, 38),
(39, 78, 39),
(40, 78, 40);

-- --------------------------------------------------------

--
-- Table structure for table `tbljoborders`
--

CREATE TABLE `tbljoborders` (
  `job_id` int(11) NOT NULL,
  `job_complaintId` int(11) NOT NULL,
  `job_title` varchar(255) NOT NULL,
  `job_description` text NOT NULL,
  `job_image` varchar(255) DEFAULT NULL,
  `job_priority` int(11) NOT NULL,
  `job_createdBy` int(11) NOT NULL,
  `job_createDate` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbljoborders`
--

INSERT INTO `tbljoborders` (`job_id`, `job_complaintId`, `job_title`, `job_description`, `job_image`, `job_priority`, `job_createdBy`, `job_createDate`) VALUES
(35, 40, 'asd', 'asd', 'static/complaints/job_1767541754_2904.webp', 1, 99, '2026-01-02 20:50:10'),
(36, 41, 'asd', 'asd', 'static/complaints/job_1767660015_8664.webp', 1, 99, '2026-01-05 19:41:37'),
(38, 42, 'asd', 'asd', NULL, 1, 99, '2026-01-10 02:14:11'),
(39, 43, 'asd', 'asd', 'static/complaints/job_1767984250_5035.webp', 1, 99, '2026-01-10 02:43:26'),
(40, 44, 'asd', 'asd', NULL, 4, 99, '2026-01-12 04:37:22');

-- --------------------------------------------------------

--
-- Table structure for table `tbljoborderstatus`
--

CREATE TABLE `tbljoborderstatus` (
  `joStatus_id` int(11) NOT NULL,
  `joStatus_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbljoborderstatus`
--

INSERT INTO `tbljoborderstatus` (`joStatus_id`, `joStatus_name`) VALUES
(1, 'Pending'),
(2, 'On-Going'),
(3, 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `tbllocation`
--

CREATE TABLE `tbllocation` (
  `location_id` int(11) NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `location_categoryId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbllocation`
--

INSERT INTO `tbllocation` (`location_id`, `location_name`, `location_categoryId`) VALUES
(1, 'PH', 1),
(2, 'MS', 1),
(3, 'MN', 1),
(4, 'MW', 1),
(5, 'SHS', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbllocationcategory`
--

CREATE TABLE `tbllocationcategory` (
  `locCateg_id` int(11) NOT NULL,
  `locCateg_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbllocationcategory`
--

INSERT INTO `tbllocationcategory` (`locCateg_id`, `locCateg_name`) VALUES
(1, 'Building'),
(2, 'Computer Lab');

-- --------------------------------------------------------

--
-- Table structure for table `tbloperation`
--

CREATE TABLE `tbloperation` (
  `operation_id` int(11) NOT NULL,
  `operation_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbloperation`
--

INSERT INTO `tbloperation` (`operation_id`, `operation_name`) VALUES
(1, 'Repaired'),
(2, 'Replaced'),
(3, 'Done'),
(4, 'Okay');

-- --------------------------------------------------------

--
-- Table structure for table `tblpriority`
--

CREATE TABLE `tblpriority` (
  `priority_id` int(11) NOT NULL,
  `priority_name` varchar(255) NOT NULL,
  `priority_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblpriority`
--

INSERT INTO `tblpriority` (`priority_id`, `priority_name`, `priority_order`) VALUES
(1, 'Low', 1),
(2, 'Medium', 2),
(3, 'High', 3),
(4, 'Urgent', 4);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_academic_session`
--

CREATE TABLE `tbl_academic_session` (
  `academic_session_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `semester_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_academic_session`
--

INSERT INTO `tbl_academic_session` (`academic_session_id`, `school_year_id`, `semester_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(2, 1, 2, 1, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(3, 1, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(4, 2, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(5, 2, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(6, 2, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(7, 3, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(8, 3, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(9, 3, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(10, 4, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(11, 4, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(12, 4, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(13, 5, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(14, 5, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(15, 5, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(16, 6, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(17, 6, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(18, 6, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(19, 7, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(20, 7, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(21, 7, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(22, 8, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(23, 8, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(24, 8, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(25, 9, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(26, 9, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(27, 9, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(28, 10, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(29, 10, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(30, 10, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(31, 11, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(32, 11, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(33, 11, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(34, 12, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(35, 12, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(36, 12, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(37, 13, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(38, 13, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(39, 13, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(40, 14, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(41, 14, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(42, 14, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(43, 15, 1, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(44, 15, 2, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37'),
(45, 15, 3, 0, '2025-10-20 15:12:43', '2025-10-22 16:03:37');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_approval_exclusive`
--

CREATE TABLE `tbl_approval_exclusive` (
  `approval_exclusive_id` int(11) NOT NULL,
  `approval_exclusive_user_level_id` int(11) NOT NULL,
  `approval_exclusive_department_id` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_approval_exclusive`
--

INSERT INTO `tbl_approval_exclusive` (`approval_exclusive_id`, `approval_exclusive_user_level_id`, `approval_exclusive_department_id`, `updated_by`, `updated_at`) VALUES
(8, 17, 29, 114, '2025-10-11 02:00:32'),
(11, 16, 29, 114, '2025-10-26 02:45:59');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_approval_in_order`
--

CREATE TABLE `tbl_approval_in_order` (
  `approval_order_id` int(11) NOT NULL,
  `users_id` int(11) NOT NULL,
  `approval_sequence` int(11) NOT NULL,
  `approval_status_status_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_approval_in_order`
--

INSERT INTO `tbl_approval_in_order` (`approval_order_id`, `users_id`, `approval_sequence`, `approval_status_status_id`) VALUES
(105, 99, 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_chat`
--

CREATE TABLE `tbl_chat` (
  `chat_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_read` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_checklist_equipment_master`
--

CREATE TABLE `tbl_checklist_equipment_master` (
  `checklist_equipment_id` int(11) NOT NULL,
  `checklist_name` varchar(255) NOT NULL,
  `checklist_equipment_equip_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_checklist_equipment_master`
--

INSERT INTO `tbl_checklist_equipment_master` (`checklist_equipment_id`, `checklist_name`, `checklist_equipment_equip_id`) VALUES
(19, 'Complete Quantitys', 42),
(20, 'Not Damage', 42),
(21, 'Good to go', 42),
(22, 'Working', 43),
(23, 'Not Damage', 43),
(24, 'Good To Go', 43),
(25, 'Not Damage', 44),
(26, 'Good to deploy', 44),
(27, 'Has Audio Output', 45),
(28, 'Good Condition', 45),
(29, 'Has Output', 46),
(30, 'Check If Working', 49),
(31, 'Available', 49),
(32, 'Check If Available', 50),
(33, 'Check If Working', 51),
(34, 'Check if functional', 51),
(35, 'Check If Working', 48),
(38, 'if complete', 58),
(39, 'Sample Checklist', 62),
(40, 'sample checklist', 64),
(41, 'edit checklist', 47),
(42, 'added', 47),
(43, 'edited', 53);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_checklist_vehicle_master`
--

CREATE TABLE `tbl_checklist_vehicle_master` (
  `checklist_vehicle_id` int(11) NOT NULL,
  `checklist_name` varchar(255) NOT NULL,
  `checklist_vehicle_vehicle_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_checklist_vehicle_master`
--

INSERT INTO `tbl_checklist_vehicle_master` (`checklist_vehicle_id`, `checklist_name`, `checklist_vehicle_vehicle_id`) VALUES
(19, 'Complete Quantitys', 11),
(21, 'Good Condition', 3),
(22, 'Good Condition', 9),
(23, 'Good Condition', 4),
(24, 'Good Condition', 5),
(25, 'asd', 21),
(26, 'asd', 28);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_checklist_venue_master`
--

CREATE TABLE `tbl_checklist_venue_master` (
  `checklist_venue_id` int(11) NOT NULL,
  `checklist_name` varchar(255) NOT NULL,
  `checklist_venue_ven_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_checklist_venue_master`
--

INSERT INTO `tbl_checklist_venue_master` (`checklist_venue_id`, `checklist_name`, `checklist_venue_ven_id`) VALUES
(34, 'Clean Venue', 77),
(35, 'All Working', 77),
(36, 'All Chairs Has been set up ', 76),
(37, 'Clean Venue', 76),
(38, 'dsa', 85),
(39, 'dsa', 85),
(40, 'Clean Venue', 88),
(41, 'Has Chairs', 89),
(42, 'Clean Venue', 89),
(43, 'Has Complete Chairs', 90),
(44, 'Clean Venue', 90),
(46, 'Clean Venue', 87),
(47, 'asd', 100),
(48, 'asd', 101),
(49, 'asd', 104),
(50, 'Clean Venue', 91),
(51, 'Set-up clear', 91),
(52, 'Computers Are working', 103),
(53, 'Clean Venue', 103),
(54, 'Computers Are Working', 102),
(55, 'Clean Venue', 102),
(56, 'Kani', 105),
(57, 'Clean Venue', 350),
(58, 'Speakers Working', 350),
(59, 'asd', 297),
(60, 'sample checklist', 349),
(61, 'Clean The Venue', 250),
(62, 'asd', 93),
(63, 'Check Ground', 92),
(65, 'kay pia ni', 348),
(66, 'sample checklist', 345),
(67, 'Setup', 98),
(68, 'Lights are working', 98),
(69, 'GSD', 99),
(70, 'edited checklist', 85),
(71, 'asd', 364),
(72, 'prepare the venue', 368);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_class_venue_schedule`
--

CREATE TABLE `tbl_class_venue_schedule` (
  `schedule_id` int(11) NOT NULL,
  `academic_session_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `ven_id` int(11) NOT NULL,
  `day_of_week` varchar(10) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_condition`
--

CREATE TABLE `tbl_condition` (
  `id` int(11) NOT NULL,
  `condition_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_condition`
--

INSERT INTO `tbl_condition` (`id`, `condition_name`) VALUES
(2, 'Good Condition'),
(3, 'Missing'),
(4, 'Damaged'),
(5, 'Not Working'),
(6, 'Other'),
(7, 'For Inspection');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_departments`
--

CREATE TABLE `tbl_departments` (
  `departments_id` int(11) NOT NULL,
  `departments_name` varchar(255) DEFAULT NULL,
  `department_type` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_departments`
--

INSERT INTO `tbl_departments` (`departments_id`, `departments_name`, `department_type`, `is_active`) VALUES
(18, 'CITE', 'Academic', 1),
(24, 'CEA', 'Academic', 1),
(27, 'GSD', 'Non-Academic', 1),
(28, 'COO', 'Non-Academic', 1),
(29, 'CSDL', 'Non-Academic', 1),
(30, 'CAS', 'Non-Academic', 1),
(38, 'CMA', 'Academic', 1),
(39, 'CAHS', 'Academic', 1),
(40, 'SCCJ', 'Academic', 1),
(41, 'COE', 'Academic', 1),
(42, 'FINANCE', 'Non-Academic', 1),
(43, 'MARKETING', 'Non-Academic', 0),
(44, 'REGISTRAR', 'Non-Academic', 0),
(45, 'HUMAN RESOURCE', 'Non-Academic', 0),
(48, 'SHS', 'Academic', 1),
(49, 'GRADUATE SCHOOL', 'Non-Academic', 0),
(54, 'BASIC ED', 'Academic', 1),
(56, 'sampel department', 'Academic', 0),
(57, 'sample equipments', 'Academic', 0),
(58, 'samples depss', 'Academic', 1),
(59, 'edited departments', 'Academic', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_department_approval`
--

CREATE TABLE `tbl_department_approval` (
  `department_approval_id` int(11) NOT NULL,
  `department_is_approved` tinyint(1) DEFAULT NULL,
  `department_approval_department_id` int(11) NOT NULL,
  `department_user_id` int(11) DEFAULT NULL,
  `department_updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `department_request_reservation_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_email_verification`
--

CREATE TABLE `tbl_email_verification` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `verification_token` char(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_email_verification`
--

INSERT INTO `tbl_email_verification` (`id`, `user_id`, `verification_token`, `expires_at`, `created_at`) VALUES
(3, 77, '218657', '2025-07-24 13:33:20', '2025-07-23 13:33:20');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_equipments`
--

CREATE TABLE `tbl_equipments` (
  `equip_id` int(11) NOT NULL,
  `equip_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `user_admin_id` int(11) DEFAULT NULL,
  `equip_type` varchar(100) DEFAULT NULL,
  `equip_created_at` datetime DEFAULT current_timestamp(),
  `equipments_category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_equipments`
--

INSERT INTO `tbl_equipments` (`equip_id`, `equip_name`, `is_active`, `user_admin_id`, `equip_type`, `equip_created_at`, `equipments_category_id`) VALUES
(42, 'Chairs', 1, 42, 'Bulk', '2025-05-29 00:46:12', 30),
(43, 'Projector', 1, 42, 'Serialized', '2025-05-29 00:46:21', 29),
(44, 'Tables', 1, 42, 'Bulk', '2025-05-30 23:31:47', 30),
(45, 'Wireless Microphone', 1, 42, 'Serialized', '2025-06-05 22:02:33', 31),
(46, 'Wireless Speaker', 1, 42, 'Serialized', '2025-06-05 22:02:43', 31),
(47, 'Portable Speaker', 1, 42, 'Serialized', '2025-06-05 22:03:02', 31),
(48, 'Big Sound System', 1, 42, 'Serialized', '2025-06-05 22:03:14', 31),
(49, 'Aircon', 1, 42, 'Serialized', '2025-06-05 22:04:02', 32),
(50, 'Blackboard', 1, 42, 'Serialized', '2025-06-05 22:04:34', 33),
(51, 'Computer Monitor', 1, 42, 'Serialized', '2025-06-05 22:05:20', 34),
(52, 'Computer Mouse', 1, 42, 'Serialized', '2025-06-05 22:05:27', 34),
(53, 'Fix Flooring Power Supply', 1, 42, 'Serialized', '2025-06-05 22:06:09', 35),
(54, 'Orbital Fan', 1, 42, 'Serialized', '2025-06-05 22:06:38', 32),
(55, 'Televisions', 1, 42, 'Serialized', '2025-06-05 22:07:05', 32),
(56, 'Voltage Tester', 1, 42, 'Serialized', '2025-06-05 22:07:33', 36),
(57, 'WhiteBoard', 1, 42, 'Serialized', '2025-06-05 22:07:53', 33),
(58, 'Paper', 1, 42, 'Bulk', '2025-06-05 22:08:42', 37),
(60, 'Mouse', 1, 42, 'Serialized', '2025-07-25 10:30:09', 34),
(61, 'Papers', 1, 42, 'Bulk', '2025-08-01 00:23:09', 37),
(62, 'Monitor', 1, 42, 'Serialized', '2025-08-02 09:39:16', 34),
(63, 'Sample1', 0, 114, 'Serialized', '2025-08-05 23:01:07', 33),
(64, 'big screen', 0, 100, 'Serialized', '2025-08-06 11:47:02', 32),
(66, 'Edited Equipment', 0, 114, 'Serialized', '2025-10-20 23:59:37', 32),
(67, 'New Equipment', 0, 99, 'Serialized', '2025-10-22 16:26:56', 31),
(68, 'samplesssss equipments', 0, 114, 'Serialized', '2025-10-26 14:40:55', 33),
(69, 'sample equipment12', 0, 99, 'Bulk', '2025-10-27 02:30:58', 32),
(70, 'dsaaaa', 1, 99, 'Bulk', '2026-01-10 02:19:22', 1),
(71, 'asdasdasd', 1, 99, 'Bulk', '2026-01-10 02:19:38', 1),
(72, 'asd', 1, 99, 'Bulk', '2026-01-10 02:20:14', 1),
(73, 'dsaaad', 0, 99, 'Bulk', '2026-01-10 02:22:09', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_equipment_category`
--

CREATE TABLE `tbl_equipment_category` (
  `equipments_category_id` int(11) NOT NULL,
  `equipments_category_name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_equipment_category`
--

INSERT INTO `tbl_equipment_category` (`equipments_category_id`, `equipments_category_name`, `is_active`) VALUES
(29, 'Electronic', 1),
(30, 'Furniture', 1),
(31, 'Audio', 1),
(32, 'Appliances ', 1),
(33, 'Educational Equipment', 1),
(34, 'Computers', 1),
(35, 'Electrical', 1),
(36, 'Tools', 1),
(37, 'Office Supplies', 1),
(41, 'Sample1', 0),
(42, 'editeds', 0),
(43, 'sample equipment', 0),
(44, 'samples eqss', 0),
(45, 'samples categorys', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_equipment_quantity`
--

CREATE TABLE `tbl_equipment_quantity` (
  `quantity_id` int(11) NOT NULL,
  `equip_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_admin_id` int(11) DEFAULT NULL,
  `on_hand_quantity` int(11) NOT NULL DEFAULT 0,
  `status_availability_id` int(11) NOT NULL DEFAULT 9
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_equipment_quantity`
--

INSERT INTO `tbl_equipment_quantity` (`quantity_id`, `equip_id`, `quantity`, `last_updated`, `user_admin_id`, `on_hand_quantity`, `status_availability_id`) VALUES
(9, 42, 400, '2025-10-29 01:24:39', 99, 100, 9),
(10, 44, 699, '2025-10-26 13:43:29', 42, 686, 9),
(11, 61, 179, '2025-10-28 23:36:43', 99, 179, 9),
(12, 58, 20, '2025-10-26 13:46:51', 42, 10, 9);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_equipment_unit`
--

CREATE TABLE `tbl_equipment_unit` (
  `unit_id` int(11) NOT NULL,
  `equip_id` int(11) DEFAULT NULL,
  `equipment_brand` varchar(100) DEFAULT NULL,
  `equipment_model` varchar(100) DEFAULT NULL,
  `equipment_description` text DEFAULT NULL,
  `equipment_specs` text DEFAULT NULL COMMENT 'Detailed specs (processor, RAM, etc.)',
  `inch` varchar(50) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `status_availability_id` int(11) DEFAULT NULL,
  `unit_created_at` datetime DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `user_admin_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_equipment_unit`
--

INSERT INTO `tbl_equipment_unit` (`unit_id`, `equip_id`, `equipment_brand`, `equipment_model`, `equipment_description`, `equipment_specs`, `inch`, `serial_number`, `status_availability_id`, `unit_created_at`, `is_active`, `user_admin_id`) VALUES
(10, 43, NULL, NULL, NULL, NULL, NULL, 'P-0011', 1, '2025-06-24 09:17:58', 1, 99),
(11, 43, NULL, NULL, NULL, NULL, NULL, 'P-002', 1, '2025-06-24 09:18:13', 1, 42),
(12, 46, NULL, NULL, NULL, NULL, NULL, 'W-001', 1, '2025-06-24 09:18:50', 1, 42),
(13, 45, NULL, NULL, NULL, NULL, NULL, 'wr-001', 1, '2025-06-24 09:19:09', 1, 42),
(14, 43, NULL, NULL, NULL, NULL, NULL, 'P-003', 1, '2025-07-22 23:00:48', 1, 42),
(15, 45, NULL, NULL, NULL, NULL, NULL, 'wr-002', 1, '2025-07-23 13:54:05', 1, 42),
(16, 49, NULL, NULL, NULL, NULL, NULL, 'AR-001', 1, '2025-07-23 13:54:24', 1, 42),
(17, 51, NULL, NULL, NULL, NULL, NULL, 'CCM-001', 1, '2025-07-23 13:54:43', 1, 42),
(18, 50, NULL, NULL, NULL, NULL, NULL, 'BLK-001', 1, '2025-07-23 13:55:00', 1, 42),
(19, 47, NULL, NULL, NULL, NULL, NULL, 'PS-001', 1, '2025-08-01 13:00:28', 1, 42),
(20, 48, NULL, NULL, NULL, NULL, NULL, 'BSS-001', 1, '2025-08-01 13:01:06', 1, 42),
(21, 48, NULL, NULL, NULL, NULL, NULL, 'BSS-002', 1, '2025-08-01 13:04:22', 1, 42),
(22, 46, NULL, NULL, NULL, NULL, NULL, 'w-002', 1, '2025-08-01 13:04:42', 1, 42),
(23, 47, NULL, NULL, NULL, NULL, NULL, 'PS-002', 1, '2025-08-01 13:04:58', 1, 42),
(24, 62, NULL, NULL, NULL, NULL, '2', 'MX-001', 1, '2025-08-02 09:40:34', 1, 42),
(25, 62, NULL, NULL, NULL, NULL, NULL, 'MX-002', 1, '2025-08-13 02:57:41', 1, 42),
(26, 62, NULL, NULL, NULL, NULL, NULL, 'MX-003', 1, '2025-08-13 03:00:50', 1, 42),
(27, 62, 'asd', 'asd', 'asd', 'asd', NULL, 'MX-004', 1, '2025-08-16 23:11:43', 1, 99),
(28, 64, NULL, NULL, NULL, NULL, NULL, 'bs-0001', 1, '2025-10-11 18:26:23', 1, 114),
(29, 67, NULL, NULL, NULL, NULL, NULL, 'NE-001', 1, '2025-10-22 16:30:27', 1, 99),
(30, 62, 'BRAND', 'BRAND', 'BRAND', 'BRAND', '12', 'MX-005', 1, '2025-10-27 02:31:28', 1, 99),
(31, 62, 'Sample Brand', 'samplew', 'samplew', 'samples', NULL, 'QCPW-200', 1, '2025-10-27 19:05:26', 1, 114),
(32, 62, 'asd', 'asd', 'asd', 'asd', '12', 'asd', 1, '2025-10-29 13:25:31', 1, 99);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_holidays`
--

CREATE TABLE `tbl_holidays` (
  `holiday_id` int(11) NOT NULL,
  `holiday_name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_holidays`
--

INSERT INTO `tbl_holidays` (`holiday_id`, `holiday_name`, `holiday_date`, `is_active`) VALUES
(6, 'New Year\'s Day', '2025-01-02', 0),
(7, 'Eidul Fitr', '2025-04-01', 0),
(8, 'Araw ng Kagitingans', '2025-05-07', 0),
(9, 'Maundy Thursday', '2025-04-17', 0),
(10, 'Good Friday', '2025-04-18', 0),
(11, 'Labor Day', '2025-05-01', 0),
(12, 'Eidul Adha', '2025-06-06', 1),
(13, 'Independence Day', '2025-06-12', 1),
(14, 'National Heroes Day', '2025-08-25', 1),
(15, 'Bonifacio Day', '2025-11-30', 1),
(16, 'Christmas Day', '2025-12-25', 1),
(17, 'Rizal Day', '2025-12-30', 1),
(18, 'Sample Holiday', '2025-10-22', 0),
(19, 'sample holiday', '2025-10-26', 0),
(20, 'samples holiday', '2025-10-27', 0),
(21, 'samples holiday', '2025-10-28', 0),
(22, 'sammple holiday', '2025-10-30', 1),
(23, 'asd', '2026-01-12', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_loginfailed`
--

CREATE TABLE `tbl_loginfailed` (
  `loginfailed_id` int(11) NOT NULL,
  `User_schoolid` varchar(255) NOT NULL,
  `User_loginattempt` int(11) DEFAULT 0,
  `Login_until` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_loginfailed`
--

INSERT INTO `tbl_loginfailed` (`loginfailed_id`, `User_schoolid`, `User_loginattempt`, `Login_until`) VALUES
(312, '3-8-3', 1, NULL),
(313, '0-5-0', 3, '2025-10-25 23:28:36'),
(329, '02-2021-01540', 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_notification_reservation`
--

CREATE TABLE `tbl_notification_reservation` (
  `notification_reservation_id` int(11) NOT NULL,
  `notification_message` text NOT NULL,
  `notification_reservation_reservation_id` int(11) NOT NULL,
  `notification_user_id` int(11) NOT NULL,
  `notification_created_at` datetime DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_notification_reservation`
--

INSERT INTO `tbl_notification_reservation` (`notification_reservation_id`, `notification_message`, `notification_reservation_reservation_id`, `notification_user_id`, `notification_created_at`, `is_read`) VALUES
(1, 'Your reservation is waiting for confirmation', 1, 77, '2026-01-26 00:38:58', 1),
(2, 'New Reservation Request', 1, 72, '2026-01-26 00:38:58', 0),
(3, 'New Reservation Request', 1, 77, '2026-01-26 00:38:58', 1),
(4, 'New Reservation Request', 1, 109, '2026-01-26 00:38:58', 0),
(5, 'New Reservation Request', 1, 111, '2026-01-26 00:38:58', 0),
(6, 'New Reservation Request', 1, 42, '2026-01-26 00:38:58', 0),
(7, 'New Reservation Request', 1, 99, '2026-01-26 00:38:58', 1),
(8, 'New Reservation Request', 1, 100, '2026-01-26 00:38:58', 0),
(9, 'New Reservation Request', 1, 108, '2026-01-26 00:38:58', 0),
(10, 'New Reservation Request', 1, 114, '2026-01-26 00:38:58', 0),
(11, 'Your Reservation Request Has Been Approved By GSD', 1, 77, '2026-01-26 00:39:24', 1),
(12, 'You have been assigned new checklist tasks.', 1, 78, '2026-01-26 00:48:12', 0),
(13, 'Your reservation is waiting for confirmation', 2, 77, '2026-02-02 17:46:13', 1),
(14, 'New Reservation Request', 2, 72, '2026-02-02 17:46:13', 0),
(15, 'New Reservation Request', 2, 77, '2026-02-02 17:46:13', 1),
(16, 'New Reservation Request', 2, 109, '2026-02-02 17:46:13', 0),
(17, 'New Reservation Request', 2, 111, '2026-02-02 17:46:13', 0),
(18, 'New Reservation Request', 2, 42, '2026-02-02 17:46:13', 0),
(19, 'New Reservation Request', 2, 99, '2026-02-02 17:46:13', 1),
(20, 'New Reservation Request', 2, 100, '2026-02-02 17:46:13', 0),
(21, 'New Reservation Request', 2, 108, '2026-02-02 17:46:13', 0),
(22, 'New Reservation Request', 2, 114, '2026-02-02 17:46:13', 0),
(23, 'Your Reservation Request Has Been Approved By GSD', 2, 77, '2026-02-02 17:48:52', 1),
(24, 'You have been assigned new checklist tasks.', 2, 78, '2026-02-02 17:48:57', 0),
(25, 'Your reservation is waiting for confirmation', 3, 77, '2026-02-26 22:26:15', 1),
(26, 'New Reservation Request', 3, 72, '2026-02-26 22:26:15', 0),
(27, 'New Reservation Request', 3, 77, '2026-02-26 22:26:15', 1),
(28, 'New Reservation Request', 3, 109, '2026-02-26 22:26:15', 0),
(29, 'New Reservation Request', 3, 111, '2026-02-26 22:26:15', 0),
(30, 'New Reservation Request', 3, 42, '2026-02-26 22:26:15', 0),
(31, 'New Reservation Request', 3, 99, '2026-02-26 22:26:15', 1),
(32, 'New Reservation Request', 3, 100, '2026-02-26 22:26:15', 0),
(33, 'New Reservation Request', 3, 108, '2026-02-26 22:26:15', 0),
(34, 'New Reservation Request', 3, 114, '2026-02-26 22:26:15', 0),
(35, 'Your reservation is waiting for confirmation', 4, 77, '2026-02-26 22:26:31', 1),
(36, 'New Reservation Request', 4, 72, '2026-02-26 22:26:31', 0),
(37, 'New Reservation Request', 4, 77, '2026-02-26 22:26:31', 1),
(38, 'New Reservation Request', 4, 109, '2026-02-26 22:26:31', 0),
(39, 'New Reservation Request', 4, 111, '2026-02-26 22:26:31', 0),
(40, 'New Reservation Request', 4, 42, '2026-02-26 22:26:31', 0),
(41, 'New Reservation Request', 4, 99, '2026-02-26 22:26:31', 1),
(42, 'New Reservation Request', 4, 100, '2026-02-26 22:26:31', 0),
(43, 'New Reservation Request', 4, 108, '2026-02-26 22:26:31', 0),
(44, 'New Reservation Request', 4, 114, '2026-02-26 22:26:31', 0),
(45, 'Your reservation is waiting for confirmation', 5, 77, '2026-02-28 22:39:04', 1),
(46, 'New Reservation Request', 5, 72, '2026-02-28 22:39:04', 0),
(47, 'New Reservation Request', 5, 77, '2026-02-28 22:39:04', 1),
(48, 'New Reservation Request', 5, 109, '2026-02-28 22:39:04', 0),
(49, 'New Reservation Request', 5, 111, '2026-02-28 22:39:04', 0),
(50, 'New Reservation Request', 5, 42, '2026-02-28 22:39:04', 0),
(51, 'New Reservation Request', 5, 99, '2026-02-28 22:39:04', 1),
(52, 'New Reservation Request', 5, 100, '2026-02-28 22:39:04', 0),
(53, 'New Reservation Request', 5, 108, '2026-02-28 22:39:04', 0),
(54, 'New Reservation Request', 5, 114, '2026-02-28 22:39:04', 0),
(55, 'Your Reservation Request Has Been Approved By GSD', 5, 77, '2026-02-28 22:39:16', 1),
(56, 'Your reservation is waiting for confirmation', 6, 77, '2026-03-08 21:37:36', 1),
(57, 'New Reservation Request', 6, 72, '2026-03-08 21:37:36', 0),
(58, 'New Reservation Request', 6, 77, '2026-03-08 21:37:36', 1),
(59, 'New Reservation Request', 6, 109, '2026-03-08 21:37:36', 0),
(60, 'New Reservation Request', 6, 111, '2026-03-08 21:37:36', 0),
(61, 'New Reservation Request', 6, 42, '2026-03-08 21:37:36', 0),
(62, 'New Reservation Request', 6, 99, '2026-03-08 21:37:36', 1),
(63, 'New Reservation Request', 6, 100, '2026-03-08 21:37:36', 0),
(64, 'New Reservation Request', 6, 108, '2026-03-08 21:37:36', 0),
(65, 'New Reservation Request', 6, 114, '2026-03-08 21:37:36', 0),
(66, 'Your reservation is waiting for confirmation', 7, 77, '2026-03-08 21:39:49', 1),
(67, 'New Reservation Request', 7, 72, '2026-03-08 21:39:49', 0),
(68, 'New Reservation Request', 7, 77, '2026-03-08 21:39:49', 1),
(69, 'New Reservation Request', 7, 109, '2026-03-08 21:39:49', 0),
(70, 'New Reservation Request', 7, 111, '2026-03-08 21:39:49', 0),
(71, 'New Reservation Request', 7, 42, '2026-03-08 21:39:49', 0),
(72, 'New Reservation Request', 7, 99, '2026-03-08 21:39:49', 1),
(73, 'New Reservation Request', 7, 100, '2026-03-08 21:39:49', 0),
(74, 'New Reservation Request', 7, 108, '2026-03-08 21:39:49', 0),
(75, 'New Reservation Request', 7, 114, '2026-03-08 21:39:49', 0),
(76, 'Your reservation is waiting for confirmation', 8, 77, '2026-03-08 21:41:27', 1),
(77, 'New Reservation Request', 8, 72, '2026-03-08 21:41:27', 0),
(78, 'New Reservation Request', 8, 77, '2026-03-08 21:41:27', 1),
(79, 'New Reservation Request', 8, 109, '2026-03-08 21:41:27', 0),
(80, 'New Reservation Request', 8, 111, '2026-03-08 21:41:27', 0),
(81, 'New Reservation Request', 8, 42, '2026-03-08 21:41:27', 0),
(82, 'New Reservation Request', 8, 99, '2026-03-08 21:41:27', 1),
(83, 'New Reservation Request', 8, 100, '2026-03-08 21:41:27', 0),
(84, 'New Reservation Request', 8, 108, '2026-03-08 21:41:27', 0),
(85, 'New Reservation Request', 8, 114, '2026-03-08 21:41:27', 0),
(86, 'Your Reservation Request Has Been Approved By GSD', 8, 77, '2026-03-08 21:45:09', 0),
(87, 'You have been assigned new checklist tasks.', 8, 78, '2026-03-08 21:45:32', 0),
(88, 'Your Reservation Request Has Been Approved By GSD', 7, 77, '2026-03-08 21:49:39', 0),
(89, 'You have been assigned new checklist tasks.', 7, 78, '2026-03-08 21:49:42', 0),
(90, 'Your reservation is waiting for confirmation', 1, 77, '2026-03-08 21:53:51', 0),
(91, 'New Reservation Request', 1, 72, '2026-03-08 21:53:51', 0),
(92, 'New Reservation Request', 1, 77, '2026-03-08 21:53:51', 0),
(93, 'New Reservation Request', 1, 109, '2026-03-08 21:53:51', 0),
(94, 'New Reservation Request', 1, 111, '2026-03-08 21:53:51', 0),
(95, 'New Reservation Request', 1, 42, '2026-03-08 21:53:51', 0),
(96, 'New Reservation Request', 1, 99, '2026-03-08 21:53:51', 1),
(97, 'New Reservation Request', 1, 100, '2026-03-08 21:53:51', 0),
(98, 'New Reservation Request', 1, 108, '2026-03-08 21:53:51', 0),
(99, 'New Reservation Request', 1, 114, '2026-03-08 21:53:51', 0),
(100, 'Your Reservation Request Has Been Approved By GSD', 1, 77, '2026-03-08 21:54:00', 0),
(101, 'You have been assigned new checklist tasks.', 1, 78, '2026-03-08 21:54:04', 0),
(102, 'Your reservation is waiting for confirmation', 2, 77, '2026-03-09 22:26:22', 0),
(103, 'New Reservation Request', 2, 72, '2026-03-09 22:26:22', 0),
(104, 'New Reservation Request', 2, 77, '2026-03-09 22:26:22', 0),
(105, 'New Reservation Request', 2, 109, '2026-03-09 22:26:22', 0),
(106, 'New Reservation Request', 2, 111, '2026-03-09 22:26:22', 0),
(107, 'New Reservation Request', 2, 42, '2026-03-09 22:26:22', 0),
(108, 'New Reservation Request', 2, 99, '2026-03-09 22:26:22', 1),
(109, 'New Reservation Request', 2, 100, '2026-03-09 22:26:22', 0),
(110, 'New Reservation Request', 2, 108, '2026-03-09 22:26:22', 0),
(111, 'New Reservation Request', 2, 114, '2026-03-09 22:26:22', 0),
(112, 'Your reservation is waiting for confirmation', 3, 77, '2026-03-09 22:26:58', 0),
(113, 'New Reservation Request', 3, 72, '2026-03-09 22:26:58', 0),
(114, 'New Reservation Request', 3, 77, '2026-03-09 22:26:58', 0),
(115, 'New Reservation Request', 3, 109, '2026-03-09 22:26:58', 0),
(116, 'New Reservation Request', 3, 111, '2026-03-09 22:26:58', 0),
(117, 'New Reservation Request', 3, 42, '2026-03-09 22:26:58', 0),
(118, 'New Reservation Request', 3, 99, '2026-03-09 22:26:58', 1),
(119, 'New Reservation Request', 3, 100, '2026-03-09 22:26:58', 0),
(120, 'New Reservation Request', 3, 108, '2026-03-09 22:26:58', 0),
(121, 'New Reservation Request', 3, 114, '2026-03-09 22:26:58', 0),
(122, 'Your reservation is waiting for confirmation', 1, 77, '2026-03-09 22:32:26', 0),
(123, 'New Reservation Request', 1, 72, '2026-03-09 22:32:26', 0),
(124, 'New Reservation Request', 1, 77, '2026-03-09 22:32:26', 0),
(125, 'New Reservation Request', 1, 109, '2026-03-09 22:32:26', 0),
(126, 'New Reservation Request', 1, 111, '2026-03-09 22:32:26', 0),
(127, 'New Reservation Request', 1, 42, '2026-03-09 22:32:26', 0),
(128, 'New Reservation Request', 1, 99, '2026-03-09 22:32:26', 0),
(129, 'New Reservation Request', 1, 100, '2026-03-09 22:32:26', 0),
(130, 'New Reservation Request', 1, 108, '2026-03-09 22:32:26', 0),
(131, 'New Reservation Request', 1, 114, '2026-03-09 22:32:26', 0),
(132, 'Your reservation is waiting for confirmation', 1, 77, '2026-03-09 22:33:30', 0),
(133, 'New Reservation Request', 1, 72, '2026-03-09 22:33:30', 0),
(134, 'New Reservation Request', 1, 77, '2026-03-09 22:33:30', 0),
(135, 'New Reservation Request', 1, 109, '2026-03-09 22:33:30', 0),
(136, 'New Reservation Request', 1, 111, '2026-03-09 22:33:30', 0),
(137, 'New Reservation Request', 1, 42, '2026-03-09 22:33:30', 0),
(138, 'New Reservation Request', 1, 99, '2026-03-09 22:33:30', 0),
(139, 'New Reservation Request', 1, 100, '2026-03-09 22:33:30', 0),
(140, 'New Reservation Request', 1, 108, '2026-03-09 22:33:30', 0),
(141, 'New Reservation Request', 1, 114, '2026-03-09 22:33:30', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_push_subscriptions`
--

CREATE TABLE `tbl_push_subscriptions` (
  `subscription_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh_key` varchar(255) NOT NULL,
  `auth_key` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `device_type` varchar(50) NOT NULL,
  `device_os` varchar(50) NOT NULL,
  `browser` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_push_subscriptions`
--

INSERT INTO `tbl_push_subscriptions` (`subscription_id`, `user_id`, `endpoint`, `p256dh_key`, `auth_key`, `is_active`, `created_at`, `updated_at`, `device_type`, `device_os`, `browser`, `user_agent`) VALUES
(1, 99, 'https://fcm.googleapis.com/wp/cb78oyBndfo:APA91bEdeKpm6LXScNxkeZRHHi7x88Xyd8s28mvflo9_KGEgasj880_aMycONj2eCVh1R1Yhzj2muKGHtcB5U-pl_Mp_iSxCZwy5malhFJ2ewahHcM_SkeeXaLscjnjCPTBs3wEick4o', 'BL9YYqS8A7dDKDvQZLcCdhbMveEytmw5b6PxkT51k9h3hrmllIKZ1RSTSuqh5YAaH-1nYxoXFA4g6x0ULAqhjJU', 'eZpeGHr-PScan8p1hHawfg', 1, '2026-03-08 21:36:58', '2026-03-08 21:36:58', 'Desktop', 'Windows', 'Google Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reports`
--

CREATE TABLE `tbl_reports` (
  `report_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Name of the person submitting the report',
  `issue` varchar(500) NOT NULL COMMENT 'Brief description of the issue/bug',
  `description` text DEFAULT NULL COMMENT 'Detailed description of the issue/bug',
  `date_reported` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'When the report was submitted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table for storing user-submitted issue and bug reports';

--
-- Dumping data for table `tbl_reports`
--

INSERT INTO `tbl_reports` (`report_id`, `name`, `issue`, `description`, `date_reported`) VALUES
(1, 'asd', 'asd', 'asd', '2026-01-03 18:04:02');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation`
--

CREATE TABLE `tbl_reservation` (
  `reservation_id` int(11) NOT NULL,
  `reservation_title` varchar(255) DEFAULT NULL,
  `reservation_description` text DEFAULT NULL,
  `reservation_start_date` datetime DEFAULT NULL,
  `reservation_end_date` datetime DEFAULT NULL,
  `reschedule_start_date` datetime DEFAULT NULL,
  `reschedule_end_date` datetime DEFAULT NULL,
  `reservation_user_id` int(11) DEFAULT NULL,
  `reservation_created_at` datetime DEFAULT current_timestamp(),
  `additional_note` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `decline_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_reservation`
--

INSERT INTO `tbl_reservation` (`reservation_id`, `reservation_title`, `reservation_description`, `reservation_start_date`, `reservation_end_date`, `reschedule_start_date`, `reschedule_end_date`, `reservation_user_id`, `reservation_created_at`, `additional_note`, `remarks`, `decline_reason`) VALUES
(1, 'asd', 'asd', '2026-03-18 04:00:00', '2026-03-18 22:00:00', '2026-03-10 04:00:00', '2026-03-10 10:00:00', 77, '2026-03-09 22:33:30', '', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_checklist_equipment`
--

CREATE TABLE `tbl_reservation_checklist_equipment` (
  `reservation_checklist_equipment_id` int(11) NOT NULL,
  `reservation_equipment_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `personnel_id` int(11) DEFAULT NULL,
  `isChecked` tinyint(4) DEFAULT NULL,
  `checklist_equipment_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_checklist_vehicle`
--

CREATE TABLE `tbl_reservation_checklist_vehicle` (
  `reservation_checklist_vehicle_id` int(11) NOT NULL,
  `reservation_vehicle_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `personnel_id` int(11) DEFAULT NULL,
  `isChecked` tinyint(4) DEFAULT NULL,
  `checklist_vehicle_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_checklist_venue`
--

CREATE TABLE `tbl_reservation_checklist_venue` (
  `reservation_checklist_venue_id` int(11) NOT NULL,
  `reservation_venue_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `personnel_id` int(11) DEFAULT NULL,
  `isChecked` tinyint(4) DEFAULT NULL,
  `checklist_venue_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_reservation_checklist_venue`
--

INSERT INTO `tbl_reservation_checklist_venue` (`reservation_checklist_venue_id`, `reservation_venue_id`, `admin_id`, `personnel_id`, `isChecked`, `checklist_venue_id`) VALUES
(1, 1, 99, 78, NULL, 71),
(2, 2, 99, 78, NULL, 69),
(3, 8, 99, 78, NULL, 72),
(4, 7, 99, 78, NULL, 72),
(5, 1, 99, 78, NULL, 72);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_condition_equipment`
--

CREATE TABLE `tbl_reservation_condition_equipment` (
  `id` int(11) NOT NULL,
  `reservation_equipment_id` int(11) NOT NULL,
  `condition_id` int(11) NOT NULL,
  `qty_bad` int(11) DEFAULT 0,
  `user_personnel_id` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `admin_remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_condition_unit`
--

CREATE TABLE `tbl_reservation_condition_unit` (
  `id` int(11) NOT NULL,
  `reservation_unit_id` int(11) NOT NULL,
  `condition_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `user_personnel_id` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `admin_remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_condition_vehicle`
--

CREATE TABLE `tbl_reservation_condition_vehicle` (
  `id` int(11) NOT NULL,
  `reservation_vehicle_id` int(11) NOT NULL,
  `condition_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `user_personnel_id` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `admin_remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_condition_venue`
--

CREATE TABLE `tbl_reservation_condition_venue` (
  `id` int(11) NOT NULL,
  `reservation_venue_id` int(11) NOT NULL,
  `condition_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `user_personnel_id` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `admin_remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_driver`
--

CREATE TABLE `tbl_reservation_driver` (
  `reservation_driver_id` int(11) NOT NULL,
  `reservation_driver_user_id` int(11) DEFAULT NULL,
  `reservation_vehicle_id` int(11) NOT NULL,
  `driver_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_equipment`
--

CREATE TABLE `tbl_reservation_equipment` (
  `reservation_equipment_id` int(11) NOT NULL,
  `reservation_equipment_quantity` int(11) DEFAULT NULL,
  `release_quantity` int(11) DEFAULT NULL,
  `reservation_equipment_equip_id` int(11) DEFAULT NULL,
  `reservation_reservation_id` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_passenger`
--

CREATE TABLE `tbl_reservation_passenger` (
  `reservation_passenger_id` int(11) NOT NULL,
  `reservation_passenger_name` varchar(255) DEFAULT NULL,
  `reservation_reservation_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_status`
--

CREATE TABLE `tbl_reservation_status` (
  `reservation_status_id` int(11) NOT NULL,
  `reservation_status_status_id` int(11) DEFAULT NULL,
  `reservation_reservation_id` int(11) DEFAULT NULL,
  `reservation_active` tinyint(1) DEFAULT NULL,
  `reservation_updated_at` datetime DEFAULT NULL,
  `reservation_users_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_reservation_status`
--

INSERT INTO `tbl_reservation_status` (`reservation_status_id`, `reservation_status_status_id`, `reservation_reservation_id`, `reservation_active`, `reservation_updated_at`, `reservation_users_id`) VALUES
(25, 1, 1, 0, '2026-03-09 23:17:37', 99),
(26, 7, 1, 0, '2026-03-09 23:17:37', 99);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_unit`
--

CREATE TABLE `tbl_reservation_unit` (
  `reservation_unit_id` int(11) NOT NULL,
  `reservation_equipment_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_vehicle`
--

CREATE TABLE `tbl_reservation_vehicle` (
  `reservation_vehicle_id` int(11) NOT NULL,
  `reservation_vehicle_vehicle_id` int(11) DEFAULT NULL,
  `reservation_reservation_id` int(11) DEFAULT NULL,
  `reservation_change_vehicle_id` int(11) DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_venue`
--

CREATE TABLE `tbl_reservation_venue` (
  `reservation_venue_id` int(11) NOT NULL,
  `reservation_venue_venue_id` int(11) DEFAULT NULL,
  `reservation_change_venue_id` int(11) DEFAULT NULL,
  `reservation_participants` int(11) DEFAULT NULL,
  `reservation_reservation_id` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_reservation_venue`
--

INSERT INTO `tbl_reservation_venue` (`reservation_venue_id`, `reservation_venue_venue_id`, `reservation_change_venue_id`, `reservation_participants`, `reservation_reservation_id`, `active`) VALUES
(1, 368, NULL, 100, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_school_year`
--

CREATE TABLE `tbl_school_year` (
  `school_year_id` int(11) NOT NULL,
  `school_year_name` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_school_year`
--

INSERT INTO `tbl_school_year` (`school_year_id`, `school_year_name`, `created_at`) VALUES
(1, 'SY 25-26', '2025-10-20 15:11:52'),
(2, 'SY 26-27', '2025-10-20 15:11:52'),
(3, 'SY 27-28', '2025-10-20 15:11:52'),
(4, 'SY 28-29', '2025-10-20 15:11:52'),
(5, 'SY 29-30', '2025-10-20 15:11:52'),
(6, 'SY 30-31', '2025-10-20 15:11:52'),
(7, 'SY 31-32', '2025-10-20 15:11:52'),
(8, 'SY 32-33', '2025-10-20 15:11:52'),
(9, 'SY 33-34', '2025-10-20 15:11:52'),
(10, 'SY 34-35', '2025-10-20 15:11:52'),
(11, 'SY 35-36', '2025-10-20 15:11:52'),
(12, 'SY 36-37', '2025-10-20 15:11:52'),
(13, 'SY 37-38', '2025-10-20 15:11:52'),
(14, 'SY 38-39', '2025-10-20 15:11:52'),
(15, 'SY 39-40', '2025-10-20 15:11:52');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_section`
--

CREATE TABLE `tbl_section` (
  `section_id` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_section`
--

INSERT INTO `tbl_section` (`section_id`, `section_name`, `created_at`) VALUES
(88, 'BSIT 1A', '2025-10-19 01:29:52'),
(89, 'BSIT 1B', '2025-10-19 01:29:52'),
(90, 'BSIT 2A', '2025-10-19 01:29:52'),
(91, 'BSIT 2B', '2025-10-19 01:29:52'),
(92, 'BSIT 3A', '2025-10-19 01:29:52'),
(93, 'BSIT 3B', '2025-10-19 01:29:52'),
(94, 'BSIT 4A', '2025-10-19 01:29:52'),
(95, 'BSIT 4B', '2025-10-19 01:29:52'),
(96, 'COC--FB', '2025-10-19 02:01:28');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_semester`
--

CREATE TABLE `tbl_semester` (
  `semester_id` int(11) NOT NULL,
  `semester_name` varchar(30) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_semester`
--

INSERT INTO `tbl_semester` (`semester_id`, `semester_name`, `created_at`) VALUES
(1, '1st Semester', '2025-10-20 15:12:19'),
(2, '2nd Semester', '2025-10-20 15:12:19'),
(3, 'Summer', '2025-10-20 15:12:19');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_status_availability`
--

CREATE TABLE `tbl_status_availability` (
  `status_availability_id` int(11) NOT NULL,
  `status_availability_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_status_availability`
--

INSERT INTO `tbl_status_availability` (`status_availability_id`, `status_availability_name`) VALUES
(1, 'Available'),
(2, 'Unavailable'),
(5, 'In Use'),
(6, 'For Inspection'),
(7, 'Missing'),
(8, 'Damaged'),
(9, 'Available Stock'),
(10, 'Out of stock');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_status_head_checklist`
--

CREATE TABLE `tbl_status_head_checklist` (
  `head_checklist_id` int(11) NOT NULL,
  `head_checklist_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_status_master`
--

CREATE TABLE `tbl_status_master` (
  `status_master_id` int(11) NOT NULL,
  `status_master_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_status_master`
--

INSERT INTO `tbl_status_master` (`status_master_id`, `status_master_name`) VALUES
(1, 'Pending'),
(2, 'Decline'),
(3, 'Approved'),
(4, 'Completed'),
(5, 'Cancelled'),
(6, 'Reserved'),
(7, 'Processed'),
(8, 'Pending Department Head Approval'),
(9, 'On Going'),
(10, 'Reschedule'),
(11, 'Change Request'),
(12, 'Department Head Approved'),
(13, 'Department Head Declined'),
(14, 'Reschedule Confirmed');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `users_id` int(11) NOT NULL,
  `users_fname` varchar(100) NOT NULL,
  `users_mname` varchar(100) DEFAULT NULL,
  `users_lname` varchar(100) NOT NULL,
  `users_birthdate` date DEFAULT NULL,
  `users_suffix` varchar(10) DEFAULT NULL,
  `users_email` varchar(255) DEFAULT NULL,
  `users_school_id` varchar(255) NOT NULL,
  `users_contact_number` varchar(15) NOT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `users_user_level_id` int(11) NOT NULL,
  `users_password` varchar(255) NOT NULL,
  `first_login` tinyint(1) DEFAULT 1,
  `users_department_id` int(11) NOT NULL,
  `users_pic` varchar(255) DEFAULT NULL,
  `users_created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `users_updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `is_2FAactive` tinyint(1) NOT NULL DEFAULT 0,
  `title_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`users_id`, `users_fname`, `users_mname`, `users_lname`, `users_birthdate`, `users_suffix`, `users_email`, `users_school_id`, `users_contact_number`, `license_number`, `users_user_level_id`, `users_password`, `first_login`, `users_department_id`, `users_pic`, `users_created_at`, `users_updated_at`, `is_active`, `is_2FAactive`, `title_id`) VALUES
(42, 'Christian Mark', 'Siahay', 'Valle', NULL, NULL, 'vallechristianmark@gmail.com', '02-2021-01540', '09533593321', NULL, 1, '$2y$10$QWpgfgOcHvfegWmrmiqt4.wxg2ZmJ1hu3Bosd3Y0HpksFINbGNn46', 0, 27, 'PROFILE_PICTURE_FILENAME', '2025-03-14 13:56:30', '2026-01-05 11:37:36', 1, 1, NULL),
(72, 'Riel Jun', '', 'Cainglet', '2003-12-12', '', 'asd@gmail.com', '1-1-1', '09533593321', NULL, 3, '$2y$10$VPK2Ya/A2kdqaSaGn4JPtO37S4R2DkrvLpPfMgipnDkiMe6Hf.4cC', 0, 18, '', '2025-05-28 16:27:51', '2025-07-19 06:40:55', 1, 0, NULL),
(77, 'Darwin', 'M', 'Galudo', NULL, NULL, 'asddaa@gmail.com', '1-2-1', '09533593321', NULL, 5, '$2y$10$XgekCBIgK5GspsRyLDEob.UQ6GKEvP4i6NFXhrGgKTA49RIKHzdVK', 0, 18, '', '2025-05-28 16:29:30', '2026-01-11 20:40:45', 1, 0, 1),
(78, 'Virjillo', '', 'Datario', '2003-12-21', '', 'asddd@gmail.com', '1-3-1', '09533593321', NULL, 2, '$2y$10$5BI6ebS2xjID5/9VbyaXkeoFTwW/htXJ63zQZWOTho.NLhnYx27/W', 0, 27, '', '2025-05-29 05:19:06', '2025-08-05 17:55:13', 1, 0, NULL),
(81, 'Gail', 'D', 'Norway', NULL, 'V', 'z@gmail.com', '0-0-0', '09533593321', NULL, 5, '$2y$10$iPeVoUvhA9eDHlYQJEafzeZzl7tJNSIeSp758eKi1O1g9Lhdo2qLC', 0, 30, '', '2025-06-05 13:12:50', '2025-10-11 10:45:55', 1, 0, NULL),
(82, 'Gerry', 'J', 'Cano', NULL, '', 'zz@gmail.com', '0-1-0', '09533593321', NULL, 5, '$2y$10$.jdsyG76zACBXRIse1HqVuiVcI18HSPNK4lEO7QHwPpDbW8.wRoJu', 0, 40, '', '2025-06-05 13:22:44', '2025-10-11 10:43:08', 1, 0, NULL),
(83, 'Rizhaly', 'B', 'Maandig', '2003-12-21', '', 'zzz@gmail.com', '0-2-0', '09533593321', NULL, 5, '$2y$10$6JK2.pGKElym.qwYKESuj.iD2evuIDuISzmSRM263Esi5cRPrFh8e', 0, 41, NULL, '2025-06-05 13:23:09', '2025-08-15 17:16:57', 1, 0, NULL),
(84, 'Jonathan', '', 'Reyes', '2003-12-21', '', 'zzz@gmail.com', '0-3-0', '09533593321', NULL, 5, '$2y$10$vWzCUpMVFO5go1tx6CbDEOwWdgBsdNf.e9cwU5YR9Y0cckzabUAMC', 0, 24, NULL, '2025-06-05 13:23:45', '2025-08-15 17:16:26', 1, 0, NULL),
(85, 'Clyde ', 'F', 'Gamolo', '2003-12-21', '', 'zzz@gmail.com', '0-4-0', '09533593321', NULL, 5, '$2y$10$DJV4QVc2pQR30zJAj7tQnOO1FI5la3BUWwVB9Kgd0cqFAvmQlD9lW', 0, 38, NULL, '2025-06-05 13:24:25', '2025-08-15 17:18:52', 1, 0, NULL),
(86, 'Cheryl Marie', 'R', 'Calo', '2003-12-21', 'V', 'aaaa@gmail.com', '2-2-2', '09533593321', NULL, 18, '$2y$10$vhIzq9gAIZy7Pjh8ZjP4ceB0vQq603utnvY18cq1S3hjzGF4P8XPS', 0, 44, NULL, '2025-06-05 13:28:35', '2025-07-08 08:25:13', 1, 0, NULL),
(87, 'Sheila May', 'G', 'Pagente', '2003-12-21', '', 'aaa@gmail.com', '2-1-2', '09533593321', NULL, 18, '$2y$10$qknHAFV66xtZVm5lvzYIsuF70rK9hfLwJud5isPVbTl2Fj12apd66', 1, 45, NULL, '2025-06-05 13:29:16', '2025-06-05 13:29:16', 1, 0, NULL),
(88, 'Alexander ', '', 'Buko', '2003-12-21', 'V', 'chsi.valle.coc@phinamed.com', '2-3-2', '09533593321', NULL, 18, '$2y$10$iLTR27omwTGl.020dCMEZOQpu.Pnbvt2heVK9tJD/5V/de83na07W', 1, 43, NULL, '2025-06-05 13:29:57', '2025-06-05 13:29:57', 1, 0, NULL),
(89, 'Kevin Jones', 'Mejos', 'Lascuna', '2003-12-21', '', 'asdda@gmail.com', '3-3-3', '09533593321', NULL, 17, '$2y$10$fzNjCDUIrpfsCgh0y7h5wuXnQt2dD0kOg2wDn8tTDlv61pKsjCu9m', 1, 38, NULL, '2025-06-05 14:18:07', '2025-06-05 14:18:07', 1, 0, NULL),
(90, 'Conaifa', 'B', 'Sabillo', '2003-12-21', '', 'asdda@gmail.com', '3-4-3', '09533593321', NULL, 17, '$2y$10$0j.KaRjGPWs8L6/PZwxbzObzZqJOGOlPAWTaGoKrgJ21uMImW0hJm', 1, 39, NULL, '2025-06-05 14:18:35', '2025-06-05 14:18:35', 1, 0, NULL),
(91, 'Gezhel ', '', 'Cantutay', '2003-12-21', '', 'asdda@gmail.com', '3-5-3', '09533593321', NULL, 17, '$2y$10$FLJrLrnkk9V6DIt.0HuR/emiXBY5J1YDbSo4JBzGvx5f50PP4RkGO', 1, 24, NULL, '2025-06-05 14:20:21', '2025-06-05 14:20:21', 1, 0, NULL),
(92, 'Johnson ', '', 'Baconguis ', '2003-12-21', '', 'asdda@gmail.com', '3-5-3', '09533593321', NULL, 17, '$2y$10$TjVAtKm0oKuy/Flp0i1oPOQiw5Jbvba4jEFIij6R.oLq98ePEanyO', 1, 24, NULL, '2025-06-05 14:20:34', '2025-06-05 14:20:34', 1, 0, NULL),
(93, 'Hazel Grace', '', 'Ganut', '2003-12-21', '', 'asdda@gmail.com', '3-6-3', '09533593321', NULL, 17, '$2y$10$DKSotLmnTq7A/6LDbfRcT.Y6ArlUFuTndzk5faDL.ntGRfAsi0ek6', 1, 24, NULL, '2025-06-05 14:21:02', '2025-06-05 14:21:02', 1, 0, NULL),
(94, 'Franc ', '', 'Jimenez', '2003-12-21', '', 'asdda@gmail.com', '3-7-3', '09533593321', NULL, 17, '$2y$10$5qtPipkrxGfzbs3DcpTEce2I0QIyVV2I56d2GU4eR652YHlsuj/Ry', 0, 24, NULL, '2025-06-05 14:21:15', '2025-07-15 02:15:20', 1, 0, NULL),
(95, 'Jeff Henry', '', 'Condeza', '2003-12-21', '', 'asdda@gmail.com', '3-8-3', '09533593321', NULL, 17, '$2y$10$UILOqkY9Bg.sH0GPZgXIYOzt.NeQ805fX3YVRgJkDxJvoEsqON55K', 0, 24, NULL, '2025-06-05 14:21:44', '2025-10-24 01:15:51', 1, 0, NULL),
(96, 'Mark', 'C', 'Macaventa', '2003-12-21', '', 'asd1daa@gmail.com', '4-4-4', '09533593321', NULL, 18, '$2y$10$56fECE2YdGxNFo88sWeeEeUgOYsVv9v8dm94bG2IqwUSJ4OWlB.nm', 0, 28, NULL, '2025-06-05 14:36:33', '2025-07-10 05:34:09', 1, 0, NULL),
(99, 'Jeniffer', 'B', 'Tubaon', NULL, NULL, 'mn.mn.coc@phinmaed.com', '1-5-1', '09533593321', NULL, 1, '$2y$10$kPtL0VD7SHPkfGyR3QKywe.0vfoYRy2H/rMRTPCeNZL4w.VRdt3JS', 0, 27, '', '2025-06-10 03:41:58', '2025-10-22 08:16:18', 1, 1, 1),
(100, 'Reina ', 'de los Angeles', 'Alegarbes ', NULL, '', 'rdalegarbes.coc@phinmaed.com', '99-096-A', '09177144010', NULL, 1, '$2y$10$/hqLxmbvXESOHPo.ykxLN.4.N42wDWw1j0OoU8LMj4zWdmvxLcOnq', 0, 27, '', '2025-06-10 03:42:41', '2025-08-06 02:55:39', 1, 0, NULL),
(101, 'Michelle Lovely', 'P', 'Marasigan', '2003-12-21', '', 'a@gmail.com', '6-1-1', '09533593321', NULL, 18, '$2y$10$UGu6c9VbAduVzFpNYTrlN.ndhLgWKZq48iH9LcjqC7wec2/ZSbhGK', 1, 42, NULL, '2025-06-10 03:44:43', '2025-06-10 03:44:43', 1, 0, NULL),
(105, 'Albert', NULL, 'Palaca', '2003-02-12', '', 'chsi.valle.coc@phinmaed.com', '1-7-1', '09533593321', NULL, 2, '$2y$10$G268OogKXHcpnnV9YIsx.efHWBKsQyYRQm1t.pQaDXRv4zL2J7m1S', 1, 27, NULL, '2025-06-24 01:01:29', '2025-07-22 19:47:28', 1, 0, NULL),
(107, 'Randy', '', 'Hereza', NULL, '', 'lkkkj@gmail.com', '00-00-00', '09533593321', '123', 19, '$2y$10$53E/wFgVZBylwhrXspF13O8Z50rQ0DTQR4D4ZGRI4MtEguSv94xqC', 0, 27, '', '2025-07-08 09:32:40', '2025-11-05 01:19:10', 1, 0, NULL),
(108, 'Krystyll Ira Andrei', 'P', 'Gallegos', NULL, '', 'krta.plaza.coc@phinmaed.com', '1-1-111', '09533593321', NULL, 1, '$2y$10$CNtEJk/XS8mifInvjqbMuucJIgoSx/JIjhvk1w6AeHaUF18xLfKGe', 1, 27, NULL, '2025-07-18 02:38:01', '2025-07-18 02:38:01', 1, 0, 6),
(109, 'Angeline', '', 'Rolola', NULL, '', 'mkjs.valle.coc@phinmaed.com', '11-11-11', '09533593321', NULL, 6, '$2y$10$D5qTY6hySNssa7p0l0Mkk.1UguoZeHKSP4gGFpRkfzfdXIShu6fom', 0, 18, '', '2025-07-22 13:15:39', '2025-08-07 13:55:09', 1, 0, NULL),
(111, 'Gian', '', 'Legaspi', NULL, '', 'gian.legaspi.coc@phinmaed.com', '02-2021-04543', '09876543222', NULL, 17, '$2y$10$wZSkzIVyqk3Sg04tvC1swujLmXEBpZvqvqprLJcDdcu5bgyOaATAy', 0, 18, '', '2025-07-26 08:29:13', '2025-10-21 19:15:39', 1, 0, NULL),
(112, 'Chris', NULL, 'ligan', NULL, '', 'chsii.valle.coc@phinmaed.com', '111-111-111', '09988776532', NULL, 18, '$2y$10$bpULe/8tD1UatI72P7Z6tOQmliWNPD8f33Xz7iyEJjkpZIUZLKote', 0, 29, NULL, '2025-07-26 08:34:17', '2025-08-05 15:03:20', 1, 0, NULL),
(114, 'Rusty', 'C ', 'Pisco', NULL, '', 'rb18736@gmail.com', '222-222-222', '09533593321', NULL, 1, '$2y$10$Mjsvzix8L74ZuQ2GhRN7mOS.5uvAYcboLG7FuFiTILU94xdti1tta', 0, 27, '', '2025-08-05 14:52:33', '2025-08-06 00:41:31', 1, 0, 1),
(115, 'Jay', 'M', 'Perez', NULL, '', 'mkjs1.valle.coc@phinmaed.com', '06-028-A', '09177126889', NULL, 2, '$2y$10$tGwnEEteFsZlvIvzFRIG9.cdYi/b8FHHRMMJyPqlnu7C0TMCPNrVC', 1, 27, NULL, '2025-08-06 03:02:29', '2025-08-06 03:02:29', 1, 0, NULL),
(116, 'asd', 'as', 'asd', NULL, 'Sr.', 'asdasd@gmail.com', '222-221-222', '09533593321', NULL, 1, '$2y$10$WkzM49z8jtnNminFiPo9XuVK18lNEEH9fBloDwM0I7n1UnYNM5BdW', 1, 49, '', '2025-08-12 19:01:19', '2025-08-30 18:37:54', 1, 0, NULL),
(117, 'sample', 'sample', 'sample', NULL, 'Sr.', 'chsii.valle.csoc@phinmaed.com', '333-333-333', '09533593321', NULL, 6, '$2y$10$/sotyWgGaAERd6FuFFXJYOA54lJ6ljSGuWR0tO.mb/AVMHdm7386G', 0, 27, '', '2025-08-15 07:52:24', '2025-10-06 11:06:00', 1, 0, NULL),
(118, 'Fatima', 'A', 'Vergel', NULL, '', 'sample1@gmail.com', '00-11-00', '09533593321', 'asd', 20, '$2y$10$LppG5/mnQajWetk8TzDmAuZJzSZV2rWQ4lMd/Pf8BT8mUuK4P20X.', 1, 54, '', '2025-10-08 00:44:35', '2025-10-31 16:56:31', 1, 0, NULL),
(119, 'Crestal', 'T', 'Panhay', NULL, '', 'sample2@gmail.com', '00-22-00', '09533593321', NULL, 18, '$2y$10$pehYCJajSfaIaH6yEH.VquMrNgsQQcMXcnOa1iXJhCbXrARi0TsAy', 1, 48, NULL, '2025-10-08 00:45:18', '2025-10-25 10:04:40', 1, 0, NULL),
(120, 'Fatima ', 'A', 'Vergel', NULL, '', 'mna.mn.coc@phinmaed.com', '1-5-11', '09876543222', NULL, 20, '$2y$10$H5f4kybhR1pfx3M970D7ruB5maNJe.15MYmEOk9pBmEh0wWXqeDuG', 0, 54, '', '2025-10-20 16:24:53', '2025-10-25 23:30:21', 1, 0, NULL),
(121, 'Crestal s', 'T', 'Panhay', NULL, '', 'asdddad@gmail.com', '1-5-111', '09533593321', NULL, 20, '$2y$10$J3alP5JzpMWYfm/LnGYbme6fAV6fVE7ZtEAiLcVkyG/2TWU6UVwf2', 0, 48, '', '2025-10-20 16:29:19', '2025-10-23 14:11:06', 1, 0, NULL),
(122, 'Sample ', 'Sample', 'Sample', NULL, '', 'sample@gmail.com', '1111-111-11', '09533593321', NULL, 6, '$2y$10$n4aG3lAQl.EehNMypozXtOjeq9DqMGmqUjWdr5sRxVO.1KDbTYSZ6', 1, 18, NULL, '2025-10-22 08:36:30', '2025-10-23 06:22:44', 0, 0, NULL),
(123, 'Rosita ', 'P', 'Gutierrez', NULL, '', 'asdddda@gmail.com', '0-6-0', '09533593321', NULL, 5, '$2y$10$zQitdiKwJKee3Z1Rm.QMs.EJj/YD/XI/bpLwk6kuGhLCIDAa/SCVO', 0, 39, '', '2025-10-24 01:37:41', '2025-10-25 19:46:33', 1, 0, NULL),
(124, 'sample ', 'sample', 'sample', NULL, 'Jr.', 'asdddasd@gmail.com', '12-12-12', '09533593321', NULL, 1, '$2y$10$uXxXEA15cyMi90hnCjeOzOvMpifKrn3QK8QOZu9wxBXRAbwSsdMyu', 1, 45, NULL, '2025-10-25 19:14:13', '2026-01-05 11:38:24', 1, 0, NULL),
(125, 'asddd', 'asd', 'asd', NULL, 'Jr.', 'asddasdads@gmail.com', '1212-1212-1212', '09223332332', NULL, 1, '$2y$10$S/GS4G/BBYpT1KtEnkgao.i.sjt.KmKzWJbJY0oUMxk1iX43fN6Ou', 1, 30, '', '2025-10-26 06:41:43', '2026-01-05 11:38:14', 0, 0, 6),
(126, 'edited', 'edited', 'edited', NULL, '', 'sampleno@gmail.com', '12121-21212-21', '09533593321', NULL, 6, '$2y$10$WGgQjL2NuNC7DKXiB/Vales2yaWy09xTe0AwJxWDKY5PQwvBEsLE2', 1, 18, '', '2025-10-26 18:32:35', '2025-10-26 18:32:55', 0, 0, NULL),
(131, 'asd', 'asd', 'asd', NULL, 'Jr.', 'asdasdad@gmail.com', '22-222-22', '09533593321', NULL, 1, '$2y$10$iSwfgrV3QQoymgvU8tVf8.LTAhcB40v9HR85JqHBKK8paIjLOPHje', 0, 59, NULL, '2026-01-09 18:22:38', '2026-01-09 18:27:56', 1, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user_2fa`
--

CREATE TABLE `tbl_user_2fa` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user_level`
--

CREATE TABLE `tbl_user_level` (
  `user_level_id` int(11) NOT NULL,
  `user_level_name` varchar(100) DEFAULT NULL,
  `user_level_desc` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_user_level`
--

INSERT INTO `tbl_user_level` (`user_level_id`, `user_level_name`, `user_level_desc`) VALUES
(1, 'Admin', '100'),
(2, 'Personnel', '1'),
(3, 'SBO Adviser', '3'),
(4, 'Super Admin', 'Has full access to all features and settings'),
(5, 'Dean', 'Responsible for managing the academic department'),
(6, 'Secretary', 'Handles administrative duties and supports faculty'),
(16, 'CSG PRESIDENT', 'CSG PRESIDENT'),
(17, 'SBO GOVERNOR', 'SBO PRESIDENT'),
(18, 'Department Head', 'Leads and manages an academic department, overseeing curriculum, faculty, and daily operations'),
(19, 'Driver', NULL),
(20, 'Principal', 'Oversees departments and academic operations');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vehicle`
--

CREATE TABLE `tbl_vehicle` (
  `vehicle_id` int(11) NOT NULL,
  `vehicle_model_id` int(11) NOT NULL,
  `restriction_id` int(11) DEFAULT NULL,
  `vehicle_license` varchar(50) NOT NULL,
  `year` int(11) DEFAULT NULL,
  `status_availability_id` int(11) DEFAULT NULL,
  `vehicle_pic` varchar(255) DEFAULT NULL,
  `user_admin_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vehicle`
--

INSERT INTO `tbl_vehicle` (`vehicle_id`, `vehicle_model_id`, `restriction_id`, `vehicle_license`, `year`, `status_availability_id`, `vehicle_pic`, `user_admin_id`, `is_active`, `created_at`, `updated_at`) VALUES
(28, 81, NULL, 'NOSUU', 2025, 6, NULL, 99, 1, '2025-10-27 21:35:39', '2026-01-10 02:45:16'),
(29, 81, NULL, '12233', 2025, 1, NULL, 99, 1, '2025-11-01 00:55:53', '2025-11-01 00:55:53'),
(30, 81, NULL, 'asddddddd', 2026, 1, NULL, 99, 1, '2026-01-10 02:19:09', '2026-01-10 02:19:15');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vehicle_category`
--

CREATE TABLE `tbl_vehicle_category` (
  `vehicle_category_id` int(11) NOT NULL,
  `vehicle_category_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `restriction_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vehicle_category`
--

INSERT INTO `tbl_vehicle_category` (`vehicle_category_id`, `vehicle_category_name`, `is_active`, `restriction_id`) VALUES
(31, 'Sedan', 1, 6),
(32, 'Light Commercial Vehicle LCV', 1, 2),
(33, 'SUV', 0, NULL),
(34, 'Van', 1, 6),
(43, 'asd', 0, NULL),
(44, 'zxc', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vehicle_make`
--

CREATE TABLE `tbl_vehicle_make` (
  `vehicle_make_id` int(11) NOT NULL,
  `vehicle_make_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vehicle_make`
--

INSERT INTO `tbl_vehicle_make` (`vehicle_make_id`, `vehicle_make_name`, `is_active`) VALUES
(62, 'Honda', 1),
(63, 'Nissan', 1),
(64, 'Toyota', 1),
(65, 'Mitsubishi', 1),
(66, 'Isuzu', 1),
(67, 'Hyundai', 0),
(82, 'sample make ', 0),
(83, 'sample makes', 0),
(84, 'edited make', 1),
(85, 'zxc', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vehicle_model`
--

CREATE TABLE `tbl_vehicle_model` (
  `vehicle_model_id` int(11) NOT NULL,
  `vehicle_model_name` varchar(255) DEFAULT NULL,
  `vehicle_model_vehicle_make_id` int(11) NOT NULL,
  `vehicle_category_id` int(11) NOT NULL,
  `vehicle_model_created_at` datetime DEFAULT current_timestamp(),
  `vehicle_model_updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vehicle_model`
--

INSERT INTO `tbl_vehicle_model` (`vehicle_model_id`, `vehicle_model_name`, `vehicle_model_vehicle_make_id`, `vehicle_category_id`, `vehicle_model_created_at`, `vehicle_model_updated_at`, `is_active`) VALUES
(79, 'L300', 65, 32, '2025-05-28 15:01:52', '2025-06-05 20:54:34', 1),
(81, 'Hiace', 64, 31, '2025-06-10 11:46:53', '2025-10-27 02:36:39', 1),
(85, 'Corollasssss', 66, 31, '2025-07-25 01:46:28', '2025-10-23 22:11:50', 1),
(92, 'sample model', 66, 32, '2025-10-26 03:10:09', '2025-10-26 03:28:59', 0),
(93, 'sample model', 65, 32, '2025-10-26 14:42:57', '2025-10-27 02:41:01', 1),
(94, 'edited model', 65, 31, '2025-10-27 02:34:55', '2025-10-27 02:35:07', 1),
(95, 'asdddad', 84, 32, '2026-01-10 02:49:14', '2026-01-10 02:49:18', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_venue`
--

CREATE TABLE `tbl_venue` (
  `ven_id` int(11) NOT NULL,
  `ven_name` varchar(255) DEFAULT NULL,
  `ven_occupancy` int(11) DEFAULT NULL,
  `ven_minimum` int(11) DEFAULT NULL,
  `minimum_occupancy` int(11) DEFAULT NULL,
  `ven_created_at` datetime DEFAULT NULL,
  `ven_updated_at` datetime DEFAULT NULL,
  `status_availability_id` int(11) DEFAULT NULL,
  `ven_pic` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `user_admin_id` int(11) DEFAULT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `area_type` varchar(100) DEFAULT NULL,
  `venue_building_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_venue`
--

INSERT INTO `tbl_venue` (`ven_id`, `ven_name`, `ven_occupancy`, `ven_minimum`, `minimum_occupancy`, `ven_created_at`, `ven_updated_at`, `status_availability_id`, `ven_pic`, `is_active`, `user_admin_id`, `event_type`, `area_type`, `venue_building_id`) VALUES
(76, 'QUADRANGLE', 1000, NULL, NULL, '2025-03-06 22:15:43', '2025-03-06 22:15:43', 1, NULL, 1, 42, 'Big Event', NULL, NULL),
(77, 'AVR 1', 75, NULL, NULL, '2025-03-06 22:28:08', '2025-03-06 22:28:08', 1, NULL, 1, 42, 'Small Event', 'Close Area', 1),
(85, 'QUADRANGLE', 123, NULL, NULL, '2025-04-19 04:35:30', '2025-04-19 04:35:30', 1, NULL, 1, 42, 'Big Event', 'Open Area', 7),
(87, 'AVR 2', 75, NULL, NULL, '2025-05-22 10:19:01', '2025-05-22 10:19:01', 1, NULL, 1, 42, 'Small Event', 'Close Area', 1),
(88, 'MS LOBBY', 100, NULL, NULL, '2025-05-22 10:19:20', '2025-05-22 10:19:20', 1, NULL, 1, 42, 'Big Event', 'Open Area', 1),
(89, 'PHINMA HALL', 200, NULL, NULL, '2025-05-22 10:19:32', '2025-05-22 10:19:32', 1, NULL, 1, 42, 'Big Event', 'Open Area', 4),
(90, 'MULTI PURPOSE HALL', 100, NULL, NULL, '2025-05-22 10:20:01', '2025-05-22 10:20:01', 1, NULL, 1, 42, 'Big Event', 'Close Area', 4),
(91, 'BED Lobby', 100, 100, NULL, '2025-05-26 00:28:53', '2025-05-26 00:28:53', 1, NULL, 1, 42, 'Big Event', 'Open Area', 6),
(92, 'SHS Ground', 100, 100, NULL, '2025-05-26 00:33:13', '2025-05-26 00:33:13', 1, NULL, 1, 42, 'Big Event', 'Open Area', 5),
(93, 'SHS 501', 50, NULL, NULL, '2025-05-26 19:30:27', '2025-05-26 19:30:27', 1, NULL, 0, 42, 'Small Event', NULL, NULL),
(94, 'Main West 501', 111, NULL, NULL, '2025-05-27 03:01:20', '2025-05-27 03:01:20', 1, NULL, 0, 42, NULL, NULL, NULL),
(95, 'Main West 502', 123, NULL, NULL, '2025-05-30 22:51:16', '2025-05-30 22:51:16', 1, NULL, 0, 42, NULL, NULL, NULL),
(96, 'Main West 505', 50, NULL, NULL, '2025-06-05 21:16:37', '2025-06-05 21:16:37', 1, NULL, 0, 42, NULL, NULL, NULL),
(97, 'MS 506', 50, NULL, NULL, '2025-06-05 21:16:54', '2025-06-05 21:16:54', 1, NULL, 0, 42, NULL, NULL, NULL),
(98, 'MS Stage', 500, 100, 100, '2025-06-05 21:17:11', '2025-06-05 21:17:11', 1, NULL, 1, 42, 'Big Event', 'Open Area', 3),
(99, 'Main West Lobby', 100, NULL, NULL, '2025-06-05 21:17:24', '2025-06-05 21:17:24', 1, NULL, 1, 42, 'Big Event', 'Open Area', 3),
(100, 'Computer Laboratory 5', 50, NULL, NULL, '2025-06-05 21:18:00', '2025-06-05 21:18:00', 1, NULL, 0, 42, 'Small Event', NULL, NULL),
(101, 'Computer Laboratory 4', 50, NULL, NULL, '2025-06-05 21:18:12', '2025-06-05 21:18:12', 1, NULL, 0, 42, 'Small Event', NULL, NULL),
(102, 'Computer Laboratory 3', 50, NULL, NULL, '2025-06-05 21:18:22', '2025-06-05 21:18:22', 1, NULL, 0, 42, 'Small Event', NULL, NULL),
(103, 'Computer Laboratory 1', 50, NULL, NULL, '2025-06-05 21:18:32', '2025-06-05 21:18:32', 1, NULL, 0, 42, 'Small Event', NULL, NULL),
(104, 'Computer Laboratory 7', 50, NULL, NULL, '2025-06-05 21:18:51', '2025-06-05 21:18:51', 1, NULL, 0, 42, 'Small Event', NULL, NULL),
(105, 'Roof Deck', 200, 100, NULL, '2025-06-21 01:11:38', '2025-06-21 01:11:38', 1, NULL, 1, 42, 'Big Event', 'Open Area', 3),
(229, 'MN 207', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(230, 'MN 206', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(231, 'MN 205', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(232, 'MN 204', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(233, 'MN 203', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(234, 'MN 202', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(235, 'MN 201', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(236, 'MN 307', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(237, 'MN 306', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(238, 'MN 305', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(239, 'MN 304', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(240, 'MN 303', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(241, 'MN 302', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(242, 'MN 301', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(243, 'MN 401', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(244, 'MN 402', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(245, 'MN 403', NULL, NULL, NULL, '2025-06-23 05:44:18', '2025-06-23 05:44:18', 1, NULL, 0, 42, NULL, NULL, NULL),
(246, 'SHS 104', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(247, 'SHS 105', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(248, 'SHS 106', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(249, 'SHS 107', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(250, 'Computer Laboratory 1', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(251, 'Computer Laboratory 2', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(252, 'SHS 201', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(253, 'SHS 202', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(254, 'SHS 203', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(255, 'SHS 204', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(256, 'SHS 205', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(257, 'SHS 206', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(258, 'SHS 207', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(259, 'SHS 305', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(260, 'SHS 306', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(261, 'SHS 307', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(262, 'Computer Laboratory 3', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(263, 'Computer Laboratory 4', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(264, 'SHS 401', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(265, 'SHS 402', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(266, 'SHS 403', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(267, 'SHS 404', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(268, 'SHS 405', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(269, 'SHS 406', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(270, 'SHS 407', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(271, 'SHS 501', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(272, 'SHS 504', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(273, 'SHS 506', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(274, 'SHS 507', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(275, 'SHS 508', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(276, 'SHS 601', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(277, 'SHS 602', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(278, 'SHS 603', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(279, 'SHS 604', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(280, 'SHS 605', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(281, 'SHS 607', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(282, 'SHS 608', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(283, 'SHS 701', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(284, 'SHS 702', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(285, 'SHS 703', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(286, 'SHS 704', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(287, 'SHS 705', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(288, 'SHS 706', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(289, 'SHS 707', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(290, 'SHS 708', NULL, NULL, NULL, '2025-06-23 05:45:28', '2025-06-23 05:45:28', 1, NULL, 0, 42, NULL, NULL, NULL),
(291, 'BED 106', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(292, 'BED 200', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(293, 'BED 201', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(294, 'BED 202', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(295, 'BED 203', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(296, 'BED 204', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(297, 'BED 205', 100, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(298, 'BED 206', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(299, 'BED 207', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(300, 'BED 301', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(301, 'BED 302', NULL, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, NULL, NULL, NULL),
(302, 'BED 303', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(303, 'BED 304', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(304, 'BED 305', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(305, 'BED 306', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(306, 'BED 401', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(307, 'BED 402', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(308, 'BED 403', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(309, 'BED 404', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(310, 'BED 406', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(311, 'BED 407', 50, NULL, NULL, '2025-06-23 05:45:52', '2025-06-23 05:45:52', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(312, 'MW 201', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(313, 'MW 203', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(314, 'MW 204', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(315, 'MW 208', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(316, 'MW 301', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(317, 'MW 302', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(318, 'MW 303', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(319, 'MW 304', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(320, 'MW 305', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(321, 'MW 308', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(322, 'MW 401', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(323, 'MW 402', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(324, 'MW 403', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(325, 'MW 404', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(326, 'MW 501', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(327, 'MW 502', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(328, 'MW 503', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(329, 'MW 504', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(330, 'MW 505', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(331, 'MW 506', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(332, 'MW 507', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(333, 'MW 508', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(334, 'MW 601', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(335, 'MW 602', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(336, 'MW 603', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Open Area', NULL),
(337, 'MW 604', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(338, 'MW 605', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(339, 'MW 606', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(340, 'MW 607', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(341, 'MW 608', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(342, 'MW 701', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(343, 'MW 702', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(344, 'MW 703', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(345, 'MW 704', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(346, 'MW 705', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(347, 'MW 706', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(348, 'MW 707', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(349, 'MW 708', 50, NULL, NULL, '2025-06-23 05:46:16', '2025-06-23 05:46:16', 1, NULL, 0, 42, 'Small Event', 'Close Area', NULL),
(350, 'Auditorium', 250, 100, NULL, '2025-07-09 07:26:20', '2025-07-09 07:26:20', 1, NULL, 1, 42, 'Big Event', 'Close Area', 4),
(363, 'Edited Venue', 500, NULL, NULL, NULL, NULL, 1, NULL, 0, 114, 'Big Event', 'Open Area', NULL),
(364, 'Main West Grounds', 1000, 100, 10, NULL, NULL, 1, NULL, 1, 99, 'Big Event', 'Open Area', 3),
(365, 'sample venue', 20, NULL, NULL, NULL, NULL, 1, NULL, 0, 99, 'Big Event', 'Open Area', NULL),
(366, 'sample venuess', 200, NULL, NULL, NULL, NULL, 1, NULL, 0, 114, 'Big Event', 'Open Area', NULL),
(367, 'sample venue12', 100, NULL, NULL, NULL, NULL, 1, NULL, 0, 99, 'Big Event', 'Open Area', NULL),
(368, 'samplevenues', 100, 100, NULL, NULL, NULL, 1, NULL, 1, 99, 'Big Event', 'Open Area', 1),
(369, 'dsaa', 1, 1, NULL, NULL, NULL, 1, NULL, 1, 99, 'Big Event', 'Open Area', 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_venue_building`
--

CREATE TABLE `tbl_venue_building` (
  `venue_building_id` int(11) NOT NULL,
  `venue_building_name` varchar(255) NOT NULL,
  `venue_added_by` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_venue_building`
--

INSERT INTO `tbl_venue_building` (`venue_building_id`, `venue_building_name`, `venue_added_by`, `is_active`) VALUES
(1, 'Main South Building', 42, 1),
(2, 'Main North Building', 42, 1),
(3, 'Main West Building', 42, 1),
(4, 'Phinma Hall Building', 42, 1),
(5, 'Senior High Building', 42, 1),
(6, 'Basic Education Building', 42, 1),
(7, 'Big Open Space Area', 114, 1),
(8, 'dsaaaad', 99, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_venue_department_approval`
--

CREATE TABLE `tbl_venue_department_approval` (
  `approval_venue_id` int(11) NOT NULL,
  `approval_venue_venue_id` int(11) NOT NULL,
  `approval_venue_department_id` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_venue_department_approval`
--

INSERT INTO `tbl_venue_department_approval` (`approval_venue_id`, `approval_venue_venue_id`, `approval_venue_department_id`, `updated_by`, `updated_at`) VALUES
(160, 91, 18, 114, '2025-10-10 21:48:54'),
(161, 88, 18, 114, '2025-10-10 21:48:54'),
(162, 98, 18, 114, '2025-10-10 21:48:54'),
(164, 92, 18, 114, '2025-10-10 21:48:54'),
(167, 91, 39, 114, '2025-10-10 21:49:51'),
(168, 98, 39, 114, '2025-10-10 21:49:51'),
(169, 105, 39, 114, '2025-10-10 21:49:51'),
(170, 92, 39, 114, '2025-10-10 21:49:51'),
(171, 88, 39, 114, '2025-10-10 21:49:51'),
(172, 91, 41, 114, '2025-10-10 21:50:23'),
(173, 88, 41, 114, '2025-10-10 21:50:23'),
(174, 98, 41, 114, '2025-10-10 21:50:23'),
(175, 105, 41, 114, '2025-10-10 21:50:23'),
(176, 92, 41, 114, '2025-10-10 21:50:23'),
(177, 105, 38, 114, '2025-10-10 21:50:51'),
(178, 91, 38, 114, '2025-10-10 21:50:51'),
(179, 98, 38, 114, '2025-10-10 21:50:51'),
(180, 88, 38, 114, '2025-10-10 21:50:51'),
(181, 92, 38, 114, '2025-10-10 21:50:51'),
(182, 91, 24, 114, '2025-10-10 21:50:59'),
(183, 88, 24, 114, '2025-10-10 21:50:59'),
(184, 98, 24, 114, '2025-10-10 21:50:59'),
(185, 105, 24, 114, '2025-10-10 21:50:59'),
(186, 92, 24, 114, '2025-10-10 21:50:59'),
(187, 91, 30, 114, '2025-10-10 21:51:13'),
(188, 88, 30, 114, '2025-10-10 21:51:13'),
(189, 98, 30, 114, '2025-10-10 21:51:13'),
(190, 105, 30, 114, '2025-10-10 21:51:13'),
(191, 92, 30, 114, '2025-10-10 21:51:13'),
(196, 85, 30, 99, '2025-10-11 01:33:21'),
(197, 85, 24, 99, '2025-10-11 01:33:25'),
(198, 85, 18, 99, '2025-10-11 01:33:29'),
(199, 85, 38, 99, '2025-10-11 01:33:35'),
(200, 85, 39, 99, '2025-10-11 01:33:39'),
(201, 85, 41, 99, '2025-10-11 01:33:43'),
(207, 91, 48, 99, '2025-10-11 02:25:32'),
(208, 92, 48, 99, '2025-10-11 02:25:40'),
(209, 89, 18, 114, '2025-10-11 15:11:31'),
(210, 89, 24, 114, '2025-10-11 15:11:35'),
(211, 89, 30, 114, '2025-10-11 15:11:38'),
(212, 89, 38, 114, '2025-10-11 15:11:41'),
(213, 89, 39, 114, '2025-10-11 15:11:44'),
(214, 89, 41, 114, '2025-10-11 15:12:11'),
(216, 105, 18, 99, '2025-10-13 02:16:00'),
(217, 77, 48, 99, '2025-10-22 11:00:56'),
(218, 88, 40, 99, '2025-10-24 09:03:13'),
(219, 85, 40, 99, '2025-10-24 09:03:13'),
(220, 92, 40, 99, '2025-10-24 09:03:13'),
(221, 105, 40, 99, '2025-10-24 09:03:13'),
(222, 89, 40, 99, '2025-10-24 09:03:13'),
(223, 98, 40, 99, '2025-10-24 09:03:13'),
(224, 364, 40, 99, '2025-10-24 09:03:13'),
(225, 91, 40, 99, '2025-10-24 09:03:13'),
(226, 91, 54, 114, '2025-10-26 02:45:31'),
(227, 92, 54, 114, '2025-10-26 02:45:31');

-- --------------------------------------------------------

--
-- Table structure for table `titles`
--

CREATE TABLE `titles` (
  `id` int(11) NOT NULL,
  `abbreviation` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `titles`
--

INSERT INTO `titles` (`id`, `abbreviation`) VALUES
(6, 'Arch.'),
(3, 'Atty.'),
(2, 'Dr.'),
(1, 'Engr.'),
(5, 'MIT'),
(4, 'Prof.');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `password_reset_otp`
--
ALTER TABLE `password_reset_otp`
  ADD PRIMARY KEY (`password_reset_id`);

--
-- Indexes for table `tblcomments`
--
ALTER TABLE `tblcomments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `fk_comment_complaint` (`comment_complaintId`),
  ADD KEY `fk_comment_user` (`comment_userId`);

--
-- Indexes for table `tblcomplaints`
--
ALTER TABLE `tblcomplaints`
  ADD PRIMARY KEY (`comp_id`),
  ADD KEY `fk_complaint_client` (`comp_clientId`),
  ADD KEY `fk_complaint_location` (`comp_locationId`),
  ADD KEY `fk_complaint_location_category` (`comp_locationCategoryId`),
  ADD KEY `fk_complaint_last_user` (`comp_lastUser`),
  ADD KEY `fk_complaint_closed_by` (`comp_closedBy`);

--
-- Indexes for table `tblcomplaint_status_history`
--
ALTER TABLE `tblcomplaint_status_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `fk_complaint_history_comp` (`history_compId`),
  ADD KEY `fk_complaint_history_status` (`history_statusId`),
  ADD KEY `fk_complaint_history_updatedBy` (`history_updatedBy`);

--
-- Indexes for table `tbljobequipment`
--
ALTER TABLE `tbljobequipment`
  ADD PRIMARY KEY (`joEquipment_id`),
  ADD KEY `fk_jobequipment_equipment` (`joEquipment_equipId`),
  ADD KEY `fk_jobequipment_personnel` (`joEquipment_personnelId`);

--
-- Indexes for table `tbljoborderpersonnel`
--
ALTER TABLE `tbljoborderpersonnel`
  ADD PRIMARY KEY (`joPersonnel_id`),
  ADD KEY `fk_jopersonnel_user` (`joPersonnel_userId`),
  ADD KEY `fk_jopersonnel_joborder` (`joPersonnel_joId`);

--
-- Indexes for table `tbljoborders`
--
ALTER TABLE `tbljoborders`
  ADD PRIMARY KEY (`job_id`),
  ADD KEY `fk_joborders_complaint` (`job_complaintId`),
  ADD KEY `fk_joborders_priority` (`job_priority`),
  ADD KEY `fk_joborders_createdby` (`job_createdBy`);

--
-- Indexes for table `tbljoborderstatus`
--
ALTER TABLE `tbljoborderstatus`
  ADD PRIMARY KEY (`joStatus_id`);

--
-- Indexes for table `tbllocation`
--
ALTER TABLE `tbllocation`
  ADD PRIMARY KEY (`location_id`),
  ADD KEY `fk_location_category` (`location_categoryId`);

--
-- Indexes for table `tbllocationcategory`
--
ALTER TABLE `tbllocationcategory`
  ADD PRIMARY KEY (`locCateg_id`);

--
-- Indexes for table `tbloperation`
--
ALTER TABLE `tbloperation`
  ADD PRIMARY KEY (`operation_id`);

--
-- Indexes for table `tblpriority`
--
ALTER TABLE `tblpriority`
  ADD PRIMARY KEY (`priority_id`);

--
-- Indexes for table `tbl_academic_session`
--
ALTER TABLE `tbl_academic_session`
  ADD PRIMARY KEY (`academic_session_id`),
  ADD KEY `school_year_id` (`school_year_id`),
  ADD KEY `semester_id` (`semester_id`);

--
-- Indexes for table `tbl_approval_exclusive`
--
ALTER TABLE `tbl_approval_exclusive`
  ADD PRIMARY KEY (`approval_exclusive_id`),
  ADD KEY `approval_exclusive_user_level_id` (`approval_exclusive_user_level_id`),
  ADD KEY `approval_exclusive_department_id` (`approval_exclusive_department_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `tbl_approval_in_order`
--
ALTER TABLE `tbl_approval_in_order`
  ADD PRIMARY KEY (`approval_order_id`),
  ADD KEY `fk_users_approval` (`users_id`),
  ADD KEY `fk_approval_status` (`approval_status_status_id`);

--
-- Indexes for table `tbl_chat`
--
ALTER TABLE `tbl_chat`
  ADD PRIMARY KEY (`chat_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `tbl_checklist_equipment_master`
--
ALTER TABLE `tbl_checklist_equipment_master`
  ADD PRIMARY KEY (`checklist_equipment_id`),
  ADD KEY `checklist_equipment_equip_id` (`checklist_equipment_equip_id`);

--
-- Indexes for table `tbl_checklist_vehicle_master`
--
ALTER TABLE `tbl_checklist_vehicle_master`
  ADD PRIMARY KEY (`checklist_vehicle_id`),
  ADD KEY `checklist_vehicle_vehicle_id` (`checklist_vehicle_vehicle_id`);

--
-- Indexes for table `tbl_checklist_venue_master`
--
ALTER TABLE `tbl_checklist_venue_master`
  ADD PRIMARY KEY (`checklist_venue_id`),
  ADD KEY `checklist_venue_ven_id` (`checklist_venue_ven_id`);

--
-- Indexes for table `tbl_class_venue_schedule`
--
ALTER TABLE `tbl_class_venue_schedule`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `academic_session_id` (`academic_session_id`);

--
-- Indexes for table `tbl_condition`
--
ALTER TABLE `tbl_condition`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_departments`
--
ALTER TABLE `tbl_departments`
  ADD PRIMARY KEY (`departments_id`),
  ADD UNIQUE KEY `departments_id` (`departments_id`);

--
-- Indexes for table `tbl_department_approval`
--
ALTER TABLE `tbl_department_approval`
  ADD PRIMARY KEY (`department_approval_id`),
  ADD KEY `department_approval_department_id` (`department_approval_department_id`),
  ADD KEY `department_user_id` (`department_user_id`),
  ADD KEY `department_request_reservation_id` (`department_request_reservation_id`);

--
-- Indexes for table `tbl_email_verification`
--
ALTER TABLE `tbl_email_verification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_equipments`
--
ALTER TABLE `tbl_equipments`
  ADD PRIMARY KEY (`equip_id`),
  ADD KEY `user_admin_id` (`user_admin_id`),
  ADD KEY `fk_category` (`equipments_category_id`);

--
-- Indexes for table `tbl_equipment_category`
--
ALTER TABLE `tbl_equipment_category`
  ADD PRIMARY KEY (`equipments_category_id`);

--
-- Indexes for table `tbl_equipment_quantity`
--
ALTER TABLE `tbl_equipment_quantity`
  ADD PRIMARY KEY (`quantity_id`),
  ADD KEY `equip_id` (`equip_id`),
  ADD KEY `fk_status_availability` (`status_availability_id`);

--
-- Indexes for table `tbl_equipment_unit`
--
ALTER TABLE `tbl_equipment_unit`
  ADD PRIMARY KEY (`unit_id`),
  ADD KEY `equip_id` (`equip_id`);

--
-- Indexes for table `tbl_holidays`
--
ALTER TABLE `tbl_holidays`
  ADD PRIMARY KEY (`holiday_id`),
  ADD UNIQUE KEY `uniq_holiday` (`holiday_name`,`holiday_date`);

--
-- Indexes for table `tbl_loginfailed`
--
ALTER TABLE `tbl_loginfailed`
  ADD PRIMARY KEY (`loginfailed_id`);

--
-- Indexes for table `tbl_notification_reservation`
--
ALTER TABLE `tbl_notification_reservation`
  ADD PRIMARY KEY (`notification_reservation_id`),
  ADD KEY `notification_reservation_reservation_id` (`notification_reservation_reservation_id`),
  ADD KEY `notification_user_id` (`notification_user_id`);

--
-- Indexes for table `tbl_push_subscriptions`
--
ALTER TABLE `tbl_push_subscriptions`
  ADD PRIMARY KEY (`subscription_id`);

--
-- Indexes for table `tbl_reports`
--
ALTER TABLE `tbl_reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `idx_date_reported` (`date_reported`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_issue` (`issue`);

--
-- Indexes for table `tbl_reservation`
--
ALTER TABLE `tbl_reservation`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `reservation_user_id` (`reservation_user_id`);

--
-- Indexes for table `tbl_reservation_checklist_equipment`
--
ALTER TABLE `tbl_reservation_checklist_equipment`
  ADD PRIMARY KEY (`reservation_checklist_equipment_id`),
  ADD KEY `reservation_equipment_id` (`reservation_equipment_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `personnel_id` (`personnel_id`),
  ADD KEY `checklist_equipment_id` (`checklist_equipment_id`);

--
-- Indexes for table `tbl_reservation_checklist_vehicle`
--
ALTER TABLE `tbl_reservation_checklist_vehicle`
  ADD PRIMARY KEY (`reservation_checklist_vehicle_id`),
  ADD KEY `reservation_vehicle_id` (`reservation_vehicle_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `personnel_id` (`personnel_id`),
  ADD KEY `checklist_vehicle_id` (`checklist_vehicle_id`);

--
-- Indexes for table `tbl_reservation_checklist_venue`
--
ALTER TABLE `tbl_reservation_checklist_venue`
  ADD PRIMARY KEY (`reservation_checklist_venue_id`),
  ADD KEY `reservation_venue_id` (`reservation_venue_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `personnel_id` (`personnel_id`),
  ADD KEY `checklist_venue_id` (`checklist_venue_id`);

--
-- Indexes for table `tbl_reservation_condition_equipment`
--
ALTER TABLE `tbl_reservation_condition_equipment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_equipment_id` (`reservation_equipment_id`),
  ADD KEY `condition_id` (`condition_id`),
  ADD KEY `fk_rc_equipment_user_personnel` (`user_personnel_id`);

--
-- Indexes for table `tbl_reservation_condition_unit`
--
ALTER TABLE `tbl_reservation_condition_unit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rc_unit_reservation_unit` (`reservation_unit_id`),
  ADD KEY `fk_rc_unit_condition` (`condition_id`),
  ADD KEY `fk_rc_unit_user_personnel` (`user_personnel_id`);

--
-- Indexes for table `tbl_reservation_condition_vehicle`
--
ALTER TABLE `tbl_reservation_condition_vehicle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_vehicle_id` (`reservation_vehicle_id`),
  ADD KEY `condition_id` (`condition_id`),
  ADD KEY `fk_vehicle_user` (`user_personnel_id`);

--
-- Indexes for table `tbl_reservation_condition_venue`
--
ALTER TABLE `tbl_reservation_condition_venue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservation_venue_id` (`reservation_venue_id`),
  ADD KEY `condition_id` (`condition_id`),
  ADD KEY `fk_venue_user` (`user_personnel_id`);

--
-- Indexes for table `tbl_reservation_driver`
--
ALTER TABLE `tbl_reservation_driver`
  ADD PRIMARY KEY (`reservation_driver_id`),
  ADD KEY `fk_driver_user` (`reservation_driver_user_id`),
  ADD KEY `fk_reservation_vehicle` (`reservation_vehicle_id`);

--
-- Indexes for table `tbl_reservation_equipment`
--
ALTER TABLE `tbl_reservation_equipment`
  ADD PRIMARY KEY (`reservation_equipment_id`),
  ADD KEY `reservation_equipment_equip_id` (`reservation_equipment_equip_id`),
  ADD KEY `reservation_reservation_id` (`reservation_reservation_id`);

--
-- Indexes for table `tbl_reservation_passenger`
--
ALTER TABLE `tbl_reservation_passenger`
  ADD PRIMARY KEY (`reservation_passenger_id`),
  ADD KEY `reservation_reservation_id` (`reservation_reservation_id`);

--
-- Indexes for table `tbl_reservation_status`
--
ALTER TABLE `tbl_reservation_status`
  ADD PRIMARY KEY (`reservation_status_id`),
  ADD KEY `reservation_status_status_id` (`reservation_status_status_id`),
  ADD KEY `reservation_reservation_id` (`reservation_reservation_id`),
  ADD KEY `reservation_users_id` (`reservation_users_id`);

--
-- Indexes for table `tbl_reservation_unit`
--
ALTER TABLE `tbl_reservation_unit`
  ADD PRIMARY KEY (`reservation_unit_id`),
  ADD KEY `reservation_equipment_id` (`reservation_equipment_id`),
  ADD KEY `unit_id` (`unit_id`);

--
-- Indexes for table `tbl_reservation_vehicle`
--
ALTER TABLE `tbl_reservation_vehicle`
  ADD PRIMARY KEY (`reservation_vehicle_id`),
  ADD KEY `reservation_vehicle_vehicle_id` (`reservation_vehicle_vehicle_id`),
  ADD KEY `reservation_reservation_id` (`reservation_reservation_id`),
  ADD KEY `fk_reservation_change_vehicle` (`reservation_change_vehicle_id`);

--
-- Indexes for table `tbl_reservation_venue`
--
ALTER TABLE `tbl_reservation_venue`
  ADD PRIMARY KEY (`reservation_venue_id`),
  ADD KEY `reservation_venue_venue_id` (`reservation_venue_venue_id`),
  ADD KEY `reservation_reservation_id` (`reservation_reservation_id`),
  ADD KEY `fk_reservation_change_venue` (`reservation_change_venue_id`);

--
-- Indexes for table `tbl_school_year`
--
ALTER TABLE `tbl_school_year`
  ADD PRIMARY KEY (`school_year_id`);

--
-- Indexes for table `tbl_section`
--
ALTER TABLE `tbl_section`
  ADD PRIMARY KEY (`section_id`);

--
-- Indexes for table `tbl_semester`
--
ALTER TABLE `tbl_semester`
  ADD PRIMARY KEY (`semester_id`);

--
-- Indexes for table `tbl_status_availability`
--
ALTER TABLE `tbl_status_availability`
  ADD PRIMARY KEY (`status_availability_id`);

--
-- Indexes for table `tbl_status_head_checklist`
--
ALTER TABLE `tbl_status_head_checklist`
  ADD PRIMARY KEY (`head_checklist_id`);

--
-- Indexes for table `tbl_status_master`
--
ALTER TABLE `tbl_status_master`
  ADD PRIMARY KEY (`status_master_id`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`users_id`),
  ADD UNIQUE KEY `users_id` (`users_id`),
  ADD KEY `fk_users_user_level_id` (`users_user_level_id`),
  ADD KEY `fk_title_id` (`title_id`),
  ADD KEY `users_dept_fk_x9z7` (`users_department_id`);

--
-- Indexes for table `tbl_user_2fa`
--
ALTER TABLE `tbl_user_2fa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_user_level`
--
ALTER TABLE `tbl_user_level`
  ADD PRIMARY KEY (`user_level_id`);

--
-- Indexes for table `tbl_vehicle`
--
ALTER TABLE `tbl_vehicle`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD UNIQUE KEY `vehicle_license` (`vehicle_license`),
  ADD KEY `vehicle_model_id` (`vehicle_model_id`),
  ADD KEY `status_availability_id` (`status_availability_id`),
  ADD KEY `user_admin_id` (`user_admin_id`);

--
-- Indexes for table `tbl_vehicle_category`
--
ALTER TABLE `tbl_vehicle_category`
  ADD PRIMARY KEY (`vehicle_category_id`),
  ADD KEY `fk_vehicle_category_restriction_id` (`restriction_id`);

--
-- Indexes for table `tbl_vehicle_make`
--
ALTER TABLE `tbl_vehicle_make`
  ADD PRIMARY KEY (`vehicle_make_id`);

--
-- Indexes for table `tbl_vehicle_model`
--
ALTER TABLE `tbl_vehicle_model`
  ADD PRIMARY KEY (`vehicle_model_id`),
  ADD KEY `fk_vehicle_model_vehicle_make` (`vehicle_model_vehicle_make_id`),
  ADD KEY `vehicle_category_id` (`vehicle_category_id`);

--
-- Indexes for table `tbl_venue`
--
ALTER TABLE `tbl_venue`
  ADD PRIMARY KEY (`ven_id`),
  ADD KEY `fk_venue_status_availability` (`status_availability_id`),
  ADD KEY `fk_venue_user_admin_id` (`user_admin_id`),
  ADD KEY `fk_venue_building_id` (`venue_building_id`);

--
-- Indexes for table `tbl_venue_building`
--
ALTER TABLE `tbl_venue_building`
  ADD PRIMARY KEY (`venue_building_id`),
  ADD KEY `fk_venue_building_added_by` (`venue_added_by`);

--
-- Indexes for table `tbl_venue_department_approval`
--
ALTER TABLE `tbl_venue_department_approval`
  ADD PRIMARY KEY (`approval_venue_id`),
  ADD KEY `approval_venue_venue_id` (`approval_venue_venue_id`),
  ADD KEY `approval_venue_department_id` (`approval_venue_department_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `titles`
--
ALTER TABLE `titles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `abbreviation` (`abbreviation`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4629;

--
-- AUTO_INCREMENT for table `password_reset_otp`
--
ALTER TABLE `password_reset_otp`
  MODIFY `password_reset_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `tblcomments`
--
ALTER TABLE `tblcomments`
  MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `tblcomplaints`
--
ALTER TABLE `tblcomplaints`
  MODIFY `comp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `tblcomplaint_status_history`
--
ALTER TABLE `tblcomplaint_status_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `tbljobequipment`
--
ALTER TABLE `tbljobequipment`
  MODIFY `joEquipment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `tbljoborderpersonnel`
--
ALTER TABLE `tbljoborderpersonnel`
  MODIFY `joPersonnel_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `tbljoborders`
--
ALTER TABLE `tbljoborders`
  MODIFY `job_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `tbljoborderstatus`
--
ALTER TABLE `tbljoborderstatus`
  MODIFY `joStatus_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbllocation`
--
ALTER TABLE `tbllocation`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbllocationcategory`
--
ALTER TABLE `tbllocationcategory`
  MODIFY `locCateg_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbloperation`
--
ALTER TABLE `tbloperation`
  MODIFY `operation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tblpriority`
--
ALTER TABLE `tblpriority`
  MODIFY `priority_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_academic_session`
--
ALTER TABLE `tbl_academic_session`
  MODIFY `academic_session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `tbl_approval_exclusive`
--
ALTER TABLE `tbl_approval_exclusive`
  MODIFY `approval_exclusive_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_approval_in_order`
--
ALTER TABLE `tbl_approval_in_order`
  MODIFY `approval_order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `tbl_chat`
--
ALTER TABLE `tbl_chat`
  MODIFY `chat_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_checklist_equipment_master`
--
ALTER TABLE `tbl_checklist_equipment_master`
  MODIFY `checklist_equipment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `tbl_checklist_vehicle_master`
--
ALTER TABLE `tbl_checklist_vehicle_master`
  MODIFY `checklist_vehicle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `tbl_checklist_venue_master`
--
ALTER TABLE `tbl_checklist_venue_master`
  MODIFY `checklist_venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `tbl_class_venue_schedule`
--
ALTER TABLE `tbl_class_venue_schedule`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `tbl_condition`
--
ALTER TABLE `tbl_condition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_departments`
--
ALTER TABLE `tbl_departments`
  MODIFY `departments_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `tbl_department_approval`
--
ALTER TABLE `tbl_department_approval`
  MODIFY `department_approval_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_email_verification`
--
ALTER TABLE `tbl_email_verification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_equipments`
--
ALTER TABLE `tbl_equipments`
  MODIFY `equip_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT for table `tbl_equipment_category`
--
ALTER TABLE `tbl_equipment_category`
  MODIFY `equipments_category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `tbl_equipment_quantity`
--
ALTER TABLE `tbl_equipment_quantity`
  MODIFY `quantity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_equipment_unit`
--
ALTER TABLE `tbl_equipment_unit`
  MODIFY `unit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `tbl_holidays`
--
ALTER TABLE `tbl_holidays`
  MODIFY `holiday_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `tbl_loginfailed`
--
ALTER TABLE `tbl_loginfailed`
  MODIFY `loginfailed_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=330;

--
-- AUTO_INCREMENT for table `tbl_notification_reservation`
--
ALTER TABLE `tbl_notification_reservation`
  MODIFY `notification_reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- AUTO_INCREMENT for table `tbl_push_subscriptions`
--
ALTER TABLE `tbl_push_subscriptions`
  MODIFY `subscription_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_reports`
--
ALTER TABLE `tbl_reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_reservation`
--
ALTER TABLE `tbl_reservation`
  MODIFY `reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_reservation_checklist_equipment`
--
ALTER TABLE `tbl_reservation_checklist_equipment`
  MODIFY `reservation_checklist_equipment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_checklist_vehicle`
--
ALTER TABLE `tbl_reservation_checklist_vehicle`
  MODIFY `reservation_checklist_vehicle_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_checklist_venue`
--
ALTER TABLE `tbl_reservation_checklist_venue`
  MODIFY `reservation_checklist_venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_reservation_condition_equipment`
--
ALTER TABLE `tbl_reservation_condition_equipment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_condition_unit`
--
ALTER TABLE `tbl_reservation_condition_unit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_condition_vehicle`
--
ALTER TABLE `tbl_reservation_condition_vehicle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_condition_venue`
--
ALTER TABLE `tbl_reservation_condition_venue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_driver`
--
ALTER TABLE `tbl_reservation_driver`
  MODIFY `reservation_driver_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_equipment`
--
ALTER TABLE `tbl_reservation_equipment`
  MODIFY `reservation_equipment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_passenger`
--
ALTER TABLE `tbl_reservation_passenger`
  MODIFY `reservation_passenger_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_status`
--
ALTER TABLE `tbl_reservation_status`
  MODIFY `reservation_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `tbl_reservation_unit`
--
ALTER TABLE `tbl_reservation_unit`
  MODIFY `reservation_unit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_vehicle`
--
ALTER TABLE `tbl_reservation_vehicle`
  MODIFY `reservation_vehicle_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_reservation_venue`
--
ALTER TABLE `tbl_reservation_venue`
  MODIFY `reservation_venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_school_year`
--
ALTER TABLE `tbl_school_year`
  MODIFY `school_year_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbl_section`
--
ALTER TABLE `tbl_section`
  MODIFY `section_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT for table `tbl_semester`
--
ALTER TABLE `tbl_semester`
  MODIFY `semester_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_status_availability`
--
ALTER TABLE `tbl_status_availability`
  MODIFY `status_availability_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbl_status_head_checklist`
--
ALTER TABLE `tbl_status_head_checklist`
  MODIFY `head_checklist_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_status_master`
--
ALTER TABLE `tbl_status_master`
  MODIFY `status_master_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `users_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT for table `tbl_user_2fa`
--
ALTER TABLE `tbl_user_2fa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tbl_user_level`
--
ALTER TABLE `tbl_user_level`
  MODIFY `user_level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `tbl_vehicle`
--
ALTER TABLE `tbl_vehicle`
  MODIFY `vehicle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `tbl_vehicle_category`
--
ALTER TABLE `tbl_vehicle_category`
  MODIFY `vehicle_category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `tbl_vehicle_make`
--
ALTER TABLE `tbl_vehicle_make`
  MODIFY `vehicle_make_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `tbl_vehicle_model`
--
ALTER TABLE `tbl_vehicle_model`
  MODIFY `vehicle_model_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `tbl_venue`
--
ALTER TABLE `tbl_venue`
  MODIFY `ven_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=370;

--
-- AUTO_INCREMENT for table `tbl_venue_building`
--
ALTER TABLE `tbl_venue_building`
  MODIFY `venue_building_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbl_venue_department_approval`
--
ALTER TABLE `tbl_venue_department_approval`
  MODIFY `approval_venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=228;

--
-- AUTO_INCREMENT for table `titles`
--
ALTER TABLE `titles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `tbl_users` (`users_id`);

--
-- Constraints for table `tbl_academic_session`
--
ALTER TABLE `tbl_academic_session`
  ADD CONSTRAINT `tbl_academic_session_ibfk_1` FOREIGN KEY (`school_year_id`) REFERENCES `tbl_school_year` (`school_year_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_academic_session_ibfk_2` FOREIGN KEY (`semester_id`) REFERENCES `tbl_semester` (`semester_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_approval_exclusive`
--
ALTER TABLE `tbl_approval_exclusive`
  ADD CONSTRAINT `tbl_approval_exclusive_ibfk_1` FOREIGN KEY (`approval_exclusive_user_level_id`) REFERENCES `tbl_user_level` (`user_level_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_approval_exclusive_ibfk_2` FOREIGN KEY (`approval_exclusive_department_id`) REFERENCES `tbl_departments` (`departments_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_approval_exclusive_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `tbl_users` (`users_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_approval_in_order`
--
ALTER TABLE `tbl_approval_in_order`
  ADD CONSTRAINT `fk_approval_status` FOREIGN KEY (`approval_status_status_id`) REFERENCES `tbl_status_master` (`status_master_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_approval` FOREIGN KEY (`users_id`) REFERENCES `tbl_users` (`users_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_chat`
--
ALTER TABLE `tbl_chat`
  ADD CONSTRAINT `chat_receiver_fk_final` FOREIGN KEY (`receiver_id`) REFERENCES `tbl_users` (`users_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `chat_sender_fk_final` FOREIGN KEY (`sender_id`) REFERENCES `tbl_users` (`users_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_checklist_equipment_master`
--
ALTER TABLE `tbl_checklist_equipment_master`
  ADD CONSTRAINT `fk_checklist_equipment_equipment` FOREIGN KEY (`checklist_equipment_equip_id`) REFERENCES `tbl_equipments` (`equip_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_checklist_venue_master`
--
ALTER TABLE `tbl_checklist_venue_master`
  ADD CONSTRAINT `fk_checklist_venue_venue` FOREIGN KEY (`checklist_venue_ven_id`) REFERENCES `tbl_venue` (`ven_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
