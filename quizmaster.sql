/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80039 (8.0.39)
 Source Host           : localhost:3306
 Source Schema         : quizmaster

 Target Server Type    : MySQL
 Target Server Version : 80039 (8.0.39)
 File Encoding         : 65001

 Date: 07/02/2026 00:20:11
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for answer_records
-- ----------------------------
DROP TABLE IF EXISTS `answer_records`;
CREATE TABLE `answer_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `examId` int NULL DEFAULT NULL,
  `subjectId` int NULL DEFAULT NULL,
  `score` int NULL DEFAULT 0,
  `totalQuestions` int NULL DEFAULT 0,
  `correctQuestions` int NULL DEFAULT 0,
  `duration` int NULL DEFAULT 0,
  `answers` json NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `subjectName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bookId` int NULL DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `chapterId` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `chapterName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 515 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for app_configs
-- ----------------------------
DROP TABLE IF EXISTS `app_configs`;
CREATE TABLE `app_configs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键名',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '配置值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '配置描述',
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `config_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for banners
-- ----------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imageUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` tinyint NULL DEFAULT 1,
  `sort` int NULL DEFAULT 0,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chapters
-- ----------------------------
DROP TABLE IF EXISTS `chapters`;
CREATE TABLE `chapters`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subjectId` int NOT NULL,
  `parentId` int NULL DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 51 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for checkin_records
-- ----------------------------
DROP TABLE IF EXISTS `checkin_records`;
CREATE TABLE `checkin_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `points` int NULL DEFAULT 0,
  `consecutiveDays` int NULL DEFAULT 1,
  `checkinDate` date NOT NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_checkin`(`userId` ASC, `checkinDate` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_chapter
-- ----------------------------
DROP TABLE IF EXISTS `computer1_chapter`;
CREATE TABLE `computer1_chapter`  (
  `chapter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `major_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chapter_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chapter_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `parent_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort` int UNSIGNED NULL DEFAULT 0,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total` int UNSIGNED NULL DEFAULT 0,
  `complete_people_number` int UNSIGNED NULL DEFAULT 0,
  PRIMARY KEY (`chapter_id`) USING BTREE,
  INDEX `idx_major_id`(`major_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_chapter_question_set
-- ----------------------------
DROP TABLE IF EXISTS `computer1_chapter_question_set`;
CREATE TABLE `computer1_chapter_question_set`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `chapter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE = utf8mb4_unicode_ci NOT NULL COMMENT '章节ID',
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE = utf8mb4_unicode_ci NOT NULL COMMENT '题目ID',
  `sort` int NULL DEFAULT 0 COMMENT '排序',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE = utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_chapter_question`(`chapter_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic COMMENT = '章节题集 - 用于将题目集合到章节中';

-- ----------------------------
-- Table structure for computer1_corrections
-- ----------------------------
DROP TABLE IF EXISTS `computer1_corrections`;
CREATE TABLE `computer1_corrections`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `major_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_curated_banks
-- ----------------------------
DROP TABLE IF EXISTS `computer1_curated_banks`;
CREATE TABLE `computer1_curated_banks`  (
  `BankID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `SubjectID` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`BankID`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_curated_chapters
-- ----------------------------
DROP TABLE IF EXISTS `computer1_curated_chapters`;
CREATE TABLE `computer1_curated_chapters`  (
  `ChapterID` int NOT NULL AUTO_INCREMENT,
  `BankID` int NOT NULL,
  `ChapterName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SortOrder` int NULL DEFAULT 0,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ChapterID`) USING BTREE,
  INDEX `BankID`(`BankID` ASC) USING BTREE,
  CONSTRAINT `computer1_curated_chapters_ibfk_1` FOREIGN KEY (`BankID`) REFERENCES `computer1_curated_banks` (`BankID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_curated_questions
-- ----------------------------
DROP TABLE IF EXISTS `computer1_curated_questions`;
CREATE TABLE `computer1_curated_questions`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ChapterID` int NOT NULL,
  `QuestionID` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SortOrder` int NULL DEFAULT 0,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`) USING BTREE,
  INDEX `ChapterID`(`ChapterID` ASC) USING BTREE,
  CONSTRAINT `computer1_curated_questions_ibfk_1` FOREIGN KEY (`ChapterID`) REFERENCES `computer1_curated_chapters` (`ChapterID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_favorite_categories
-- ----------------------------
DROP TABLE IF EXISTS `computer1_favorite_categories`;
CREATE TABLE `computer1_favorite_categories`  (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CategoryID`) USING BTREE,
  INDEX `idx_user_id`(`UserID` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_favorites
-- ----------------------------
DROP TABLE IF EXISTS `computer1_favorites`;
CREATE TABLE `computer1_favorites`  (
  `FavoriteID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CategoryID` int NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FavoriteID`) USING BTREE,
  INDEX `idx_user_id`(`UserID` ASC) USING BTREE,
  INDEX `idx_question_id`(`QuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_feedback
-- ----------------------------
DROP TABLE IF EXISTS `computer1_feedback`;
CREATE TABLE `computer1_feedback`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` int NOT NULL DEFAULT 1,
  `AdminRemark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ProcessedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_generated_paper_questions
-- ----------------------------
DROP TABLE IF EXISTS `computer1_generated_paper_questions`;
CREATE TABLE `computer1_generated_paper_questions`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `paper_id` int UNSIGNED NOT NULL,
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int UNSIGNED NULL DEFAULT 0,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_paper_id`(`paper_id` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_generated_papers
-- ----------------------------
DROP TABLE IF EXISTS `computer1_generated_papers`;
CREATE TABLE `computer1_generated_papers`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `major_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config` json NULL,
  `average_difficulty` decimal(3, 2) NULL DEFAULT 0.50,
  `print_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_major_id`(`major_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_knowledge_tag
-- ----------------------------
DROP TABLE IF EXISTS `computer1_knowledge_tag`;
CREATE TABLE `computer1_knowledge_tag`  (
  `tag_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chapter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_group_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int UNSIGNED NULL DEFAULT 0,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_number` int UNSIGNED NULL DEFAULT 0,
  `exam_sort` int UNSIGNED NULL DEFAULT 0,
  PRIMARY KEY (`tag_id`) USING BTREE,
  INDEX `idx_chapter_id`(`chapter_id` ASC) USING BTREE,
  INDEX `idx_exam_group_id`(`exam_group_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_note_likes
-- ----------------------------
DROP TABLE IF EXISTS `computer1_note_likes`;
CREATE TABLE `computer1_note_likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `note_id` int NOT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_note`(`user_id` ASC, `note_id` ASC) USING BTREE,
  INDEX `idx_note_id`(`note_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_notes
-- ----------------------------
DROP TABLE IF EXISTS `computer1_notes`;
CREATE TABLE `computer1_notes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_public` tinyint(1) NULL DEFAULT 1,
  `parent_id` int NULL DEFAULT 0,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_paper
-- ----------------------------
DROP TABLE IF EXISTS `computer1_paper`;
CREATE TABLE `computer1_paper`  (
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `school` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exam_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `major_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `total_score` int NULL DEFAULT 150,
  `duration` int NULL DEFAULT 180,
  `difficulty` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '中等',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_paper_school_year`(`school` ASC, `year` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_paper_question
-- ----------------------------
DROP TABLE IF EXISTS `computer1_paper_question`;
CREATE TABLE `computer1_paper_question`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `paper_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL,
  `score` decimal(5, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_pq_paper`(`paper_id` ASC) USING BTREE,
  INDEX `idx_pq_question`(`question_id` ASC) USING BTREE,
  CONSTRAINT `computer1_paper_question_ibfk_1` FOREIGN KEY (`paper_id`) REFERENCES `computer1_paper` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1737 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_question
-- ----------------------------
DROP TABLE IF EXISTS `computer1_question`;
CREATE TABLE `computer1_question`  (
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `category_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `major_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chapter_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_group_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exercise_type` tinyint NOT NULL COMMENT '1=单选 2=多选 3=填空 4=解答 5=判断',
  `exercise_type_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stem` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `answer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `analysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `from_school` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exam_time` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exam_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exam_full_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exercise_number` int UNSIGNED NULL DEFAULT NULL,
  `level` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '1-5级',
  `total_score` decimal(5, 1) NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `answers_correct_number` int NULL DEFAULT 0,
  `answers_number` int NULL DEFAULT 0,
  `answer_accuracy` decimal(5, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`question_id`) USING BTREE,
  INDEX `idx_major_id`(`major_id` ASC) USING BTREE,
  INDEX `idx_chapter_id`(`chapter_id` ASC) USING BTREE,
  INDEX `idx_exam_group_id`(`exam_group_id` ASC) USING BTREE,
  INDEX `idx_exercise_type`(`exercise_type` ASC) USING BTREE,
  INDEX `idx_exam_time`(`exam_time` ASC) USING BTREE,
  INDEX `idx_exam_code`(`exam_code` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_question_option
-- ----------------------------
DROP TABLE IF EXISTS `computer1_question_option`;
CREATE TABLE `computer1_question_option`  (
  `option_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_key` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `option_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `option_sort` int UNSIGNED NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`option_id`) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_option_sort`(`option_sort` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 43108 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_question_sub
-- ----------------------------
DROP TABLE IF EXISTS `computer1_question_sub`;
CREATE TABLE `computer1_question_sub`  (
  `sub_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_order` tinyint UNSIGNED NOT NULL,
  `stem` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `answer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `analysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `score` decimal(5, 1) NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sub_id`) USING BTREE,
  INDEX `idx_question_id_order`(`question_id` ASC, `question_order` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2216 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_question_tag_relation
-- ----------------------------
DROP TABLE IF EXISTS `computer1_question_tag_relation`;
CREATE TABLE `computer1_question_tag_relation`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_q_tag`(`question_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `idx_tag_id`(`tag_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 78139 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_subject
-- ----------------------------
DROP TABLE IF EXISTS `computer1_subject`;
CREATE TABLE `computer1_subject`  (
  `major_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort` tinyint UNSIGNED NULL DEFAULT 0,
  `is_on_shelf` tinyint UNSIGNED NULL DEFAULT 1 COMMENT '是否上架：0-下架，1-上架',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exam_category` tinyint NULL DEFAULT NULL,
  PRIMARY KEY (`major_id`) USING BTREE,
  UNIQUE INDEX `subject_name`(`subject_name` ASC) USING BTREE,
  INDEX `idx_is_on_shelf`(`is_on_shelf` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_user_progress
-- ----------------------------
DROP TABLE IF EXISTS `computer1_user_progress`;
CREATE TABLE `computer1_user_progress`  (
  `ProgressID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` tinyint NULL DEFAULT 0 COMMENT '0:未完成, 1:已完成',
  `LastAnswer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `IsCorrect` tinyint NULL DEFAULT 0,
  `UpdateTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `duration` int NULL DEFAULT 0,
  PRIMARY KEY (`ProgressID`) USING BTREE,
  INDEX `idx_user_id`(`UserID` ASC) USING BTREE,
  INDEX `idx_question_id`(`QuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for computer1_wrong_book
-- ----------------------------
DROP TABLE IF EXISTS `computer1_wrong_book`;
CREATE TABLE `computer1_wrong_book`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_question`(`UserID` ASC, `QuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for essays
-- ----------------------------
DROP TABLE IF EXISTS `essays`;
CREATE TABLE `essays`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `subjectId` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` int NULL DEFAULT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `suggestions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_questions
-- ----------------------------
DROP TABLE IF EXISTS `exam_questions`;
CREATE TABLE `exam_questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `examId` int NOT NULL,
  `questionId` int NOT NULL,
  `sort` int NULL DEFAULT 0,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_types
-- ----------------------------
DROP TABLE IF EXISTS `exam_types`;
CREATE TABLE `exam_types`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort` int NULL DEFAULT 0,
  `isActive` tinyint(1) NULL DEFAULT 1,
  `status` tinyint(1) NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exams
-- ----------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `subjectId` int NULL DEFAULT NULL,
  `examTypeId` int NULL DEFAULT NULL,
  `questionCount` int NULL DEFAULT 0,
  `duration` int NULL DEFAULT 0,
  `difficulty` tinyint NULL DEFAULT 1,
  `type` tinyint NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `passScore` int NULL DEFAULT NULL,
  `participantCount` int NULL DEFAULT 0,
  `averageScore` decimal(5, 2) NULL DEFAULT 0.00,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for favorites
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questionId` int NULL DEFAULT NULL,
  `mongo_question_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `examTypeId` int NULL DEFAULT NULL,
  `subjectId` int NULL DEFAULT NULL,
  `chapterId` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `isActive` tinyint NULL DEFAULT 1,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for feedbacks
-- ----------------------------
DROP TABLE IF EXISTS `feedbacks`;
CREATE TABLE `feedbacks`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questionId` int NULL DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` tinyint NULL DEFAULT 1,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for generic_redeem_codes
-- ----------------------------
DROP TABLE IF EXISTS `generic_redeem_codes`;
CREATE TABLE `generic_redeem_codes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` int NOT NULL,
  `status` tinyint NULL DEFAULT 1,
  `expiredAt` datetime NULL DEFAULT NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for homepage_cards
-- ----------------------------
DROP TABLE IF EXISTS `homepage_cards`;
CREATE TABLE `homepage_cards`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题',
  `category` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'public' COMMENT '分类：public(公共课), professional(专业课)',
  `description` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '描述',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图标路径或名称',
  `text_icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#ffffff' COMMENT '背景颜色',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '跳转链接',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `is_active` tinyint NULL DEFAULT 1 COMMENT '是否启用',
  `is_tab` tinyint NULL DEFAULT 0 COMMENT '是否是Tab页',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图片URL',
  `height` int NULL DEFAULT 100 COMMENT '卡片高度(rpx)',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_book_subjects
-- ----------------------------
DROP TABLE IF EXISTS `math_book_subjects`;
CREATE TABLE `math_book_subjects`  (
  `BookID` int NOT NULL,
  `SubjectID` int NOT NULL,
  PRIMARY KEY (`BookID`, `SubjectID`) USING BTREE,
  INDEX `SubjectID`(`SubjectID` ASC) USING BTREE,
  CONSTRAINT `math_book_subjects_ibfk_1` FOREIGN KEY (`BookID`) REFERENCES `math_books` (`BookID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `math_book_subjects_ibfk_2` FOREIGN KEY (`SubjectID`) REFERENCES `math_subjects` (`SubjectID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_bookquestions
-- ----------------------------
DROP TABLE IF EXISTS `math_bookquestions`;
CREATE TABLE `math_bookquestions`  (
  `EntryID` int NOT NULL COMMENT 'Unique ID for this book-question entry (from JSON ID field)',
  `BookID` int NOT NULL COMMENT 'Contextual Book ID from JSON',
  `QuestionID` int NOT NULL COMMENT 'Contextual Question ID from JSON',
  `QuestionPage` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `QuestionSort` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Specific sort on page/chapter from JSON (can be repeated)',
  `Sort` int NULL DEFAULT NULL COMMENT 'Overall sort order/number within its context in this book (from JSON Sort - can now be repeated for different EntryIDs)',
  `ChapterName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `BookChapter` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `ChapterSort` int NULL DEFAULT NULL,
  `QuestionImg` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`EntryID`) USING BTREE,
  INDEX `idx_bq_bookid`(`BookID` ASC) USING BTREE,
  INDEX `idx_bq_questionid`(`QuestionID` ASC) USING BTREE,
  INDEX `idx_bq_bookid_sort`(`BookID` ASC, `Sort` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Links Books to Questions with context. Uniqueness by EntryID (JSON ID). Sort can be repeated.' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_books
-- ----------------------------
DROP TABLE IF EXISTS `math_books`;
CREATE TABLE `math_books`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `BookID` int NOT NULL,
  `BookTitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SubjectID` int NOT NULL,
  `SourceJsonFileName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `CreationTimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `VersionInfo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `LearnerCount` int NULL DEFAULT NULL,
  `StyleType` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `IsNew` tinyint(1) NULL DEFAULT 0,
  `OverlayBannerText` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `ThumbnailText` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `ContentType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'book',
  `CountType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `SortOrder` int NULL DEFAULT 0,
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE INDEX `BookID`(`BookID` ASC) USING BTREE,
  INDEX `SubjectID`(`SubjectID` ASC) USING BTREE,
  INDEX `idx_books_bookid_meaningful`(`BookID` ASC) USING BTREE,
  CONSTRAINT `books_ibfk_1` FOREIGN KEY (`SubjectID`) REFERENCES `math_subjects` (`SubjectID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_corrections
-- ----------------------------
DROP TABLE IF EXISTS `math_corrections`;
CREATE TABLE `math_corrections`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `QuestionID` int NOT NULL,
  `BookID` int NULL DEFAULT NULL,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` tinyint NULL DEFAULT 0 COMMENT '0: pending, 1: processed',
  `AdminNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `UpdaterName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_curated_banks
-- ----------------------------
DROP TABLE IF EXISTS `math_curated_banks`;
CREATE TABLE `math_curated_banks`  (
  `BankID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `SubjectID` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`BankID`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_curated_chapters
-- ----------------------------
DROP TABLE IF EXISTS `math_curated_chapters`;
CREATE TABLE `math_curated_chapters`  (
  `ChapterID` int NOT NULL AUTO_INCREMENT,
  `BankID` int NOT NULL,
  `ChapterName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SortOrder` int NULL DEFAULT 0,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ChapterID`) USING BTREE,
  INDEX `BankID`(`BankID` ASC) USING BTREE,
  CONSTRAINT `math_curated_chapters_ibfk_1` FOREIGN KEY (`BankID`) REFERENCES `math_curated_banks` (`BankID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_curated_questions
-- ----------------------------
DROP TABLE IF EXISTS `math_curated_questions`;
CREATE TABLE `math_curated_questions`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ChapterID` int NOT NULL,
  `QuestionID` int NOT NULL,
  `SortOrder` int NULL DEFAULT 0,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`) USING BTREE,
  INDEX `ChapterID`(`ChapterID` ASC) USING BTREE,
  CONSTRAINT `math_curated_questions_ibfk_1` FOREIGN KEY (`ChapterID`) REFERENCES `math_curated_chapters` (`ChapterID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_favorite_categories
-- ----------------------------
DROP TABLE IF EXISTS `math_favorite_categories`;
CREATE TABLE `math_favorite_categories`  (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CategoryID`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_favorites
-- ----------------------------
DROP TABLE IF EXISTS `math_favorites`;
CREATE TABLE `math_favorites`  (
  `FavoriteID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `BookID` int NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `CategoryID` int NULL DEFAULT NULL,
  PRIMARY KEY (`FavoriteID`) USING BTREE,
  UNIQUE INDEX `unique_user_question`(`UserID` ASC, `QuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_generated_paper_questions
-- ----------------------------
DROP TABLE IF EXISTS `math_generated_paper_questions`;
CREATE TABLE `math_generated_paper_questions`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `PaperID` int NOT NULL,
  `QuestionID` int NOT NULL,
  `SortOrder` int NOT NULL,
  `BookID` int NULL DEFAULT NULL,
  `BookChapter` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`ID`) USING BTREE,
  INDEX `PaperID`(`PaperID` ASC) USING BTREE,
  CONSTRAINT `math_generated_paper_questions_ibfk_1` FOREIGN KEY (`PaperID`) REFERENCES `math_generated_papers` (`PaperID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 279 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_generated_papers
-- ----------------------------
DROP TABLE IF EXISTS `math_generated_papers`;
CREATE TABLE `math_generated_papers`  (
  `PaperID` int NOT NULL AUTO_INCREMENT,
  `PrintToken` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `UserID` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SubjectID` int NULL DEFAULT NULL,
  `Config` json NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `AverageDifficulty` decimal(3, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`PaperID`) USING BTREE,
  UNIQUE INDEX `PrintToken`(`PrintToken` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_knowledgepoints
-- ----------------------------
DROP TABLE IF EXISTS `math_knowledgepoints`;
CREATE TABLE `math_knowledgepoints`  (
  `KnowledgePointID` int NOT NULL AUTO_INCREMENT,
  `KPCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'If this is the natural key, data import should use ON DUPLICATE KEY UPDATE on this',
  `KPTitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `KPContent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `KPType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `KPBusType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `KPPCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `KPNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `KPOutlineType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `KPDifficultyType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`KnowledgePointID`) USING BTREE,
  UNIQUE INDEX `KPCode`(`KPCode` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25663 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_questiondetails
-- ----------------------------
DROP TABLE IF EXISTS `math_questiondetails`;
CREATE TABLE `math_questiondetails`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `QuestionID` int NOT NULL,
  `BusType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Context` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `Give` int NULL DEFAULT NULL,
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `JsonData` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `IsProductBook` tinyint(1) NULL DEFAULT 0,
  `LinkedKnowledgePointID` int NULL DEFAULT NULL,
  `SourceDetailID` int NULL DEFAULT NULL COMMENT 'Original ID from JSON second_request item, for reference',
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE INDEX `UQ_QuestionDetailItem`(`QuestionID` ASC, `BusType` ASC, `SourceDetailID` ASC) USING BTREE COMMENT 'Assumes SourceDetailID is unique within a QuestionID & BusType context',
  INDEX `LinkedKnowledgePointID`(`LinkedKnowledgePointID` ASC) USING BTREE,
  INDEX `idx_qdetails_questionid`(`QuestionID` ASC) USING BTREE,
  CONSTRAINT `questiondetails_ibfk_1` FOREIGN KEY (`LinkedKnowledgePointID`) REFERENCES `math_knowledgepoints` (`KnowledgePointID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 51715 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_questions
-- ----------------------------
DROP TABLE IF EXISTS `math_questions`;
CREATE TABLE `math_questions`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `QuestionID` int NOT NULL COMMENT 'Unique Global Question Identifier from external source.',
  `QuestionText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `QuestionType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `IsTypeManuallySet` tinyint(1) NULL DEFAULT 0,
  `OriginalAnswerText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `LegacyOriginalBookID` int NULL DEFAULT NULL,
  `LegacyOriginalQuestionSort` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `LinksCount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `LinkNames` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `Difficulty` decimal(3, 2) NULL DEFAULT 0.50,
  `answers_correct_number` int NULL DEFAULT 0,
  `answers_number` int NULL DEFAULT 0,
  `answer_accuracy` decimal(5, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE INDEX `QuestionID`(`QuestionID` ASC) USING BTREE,
  INDEX `idx_questions_questionid_meaningful`(`QuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 27812 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_relatedquestions
-- ----------------------------
DROP TABLE IF EXISTS `math_relatedquestions`;
CREATE TABLE `math_relatedquestions`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `SourceQuestionID` int NOT NULL,
  `RelatedQuestionOriginalID` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identifier of the related question (e.g. another QuestionID)',
  `RelatedQuestionText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `LinkNames` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `FocalLink` int NULL DEFAULT NULL,
  `QuestionPage` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `SourceThirdRequestID` int NULL DEFAULT NULL COMMENT 'Original ID from JSON third_request item, for reference',
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE INDEX `UQ_RelatedQuestionPair`(`SourceQuestionID` ASC, `RelatedQuestionOriginalID` ASC) USING BTREE COMMENT 'Prevents adding the same related question link twice for a source question',
  INDEX `idx_relatedq_sourceqid`(`SourceQuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 49272 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_subjects
-- ----------------------------
DROP TABLE IF EXISTS `math_subjects`;
CREATE TABLE `math_subjects`  (
  `SubjectID` int NOT NULL AUTO_INCREMENT,
  `SubjectName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `page_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `exam_type_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`SubjectID`) USING BTREE,
  UNIQUE INDEX `SubjectName`(`SubjectName` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 84 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for math_user_books
-- ----------------------------
DROP TABLE IF EXISTS `math_user_books`;
CREATE TABLE `math_user_books`  (
  `UserBookID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `BookID` int NOT NULL,
  `SortOrder` int NULL DEFAULT 0,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserBookID`) USING BTREE,
  UNIQUE INDEX `unique_user_book`(`UserID` ASC, `BookID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for math_user_progress
-- ----------------------------
DROP TABLE IF EXISTS `math_user_progress`;
CREATE TABLE `math_user_progress`  (
  `ProgressID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` int NOT NULL,
  `BookID` int NULL DEFAULT 0,
  `Status` tinyint NULL DEFAULT 0,
  `LastAnswer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `IsCorrect` tinyint(1) NULL DEFAULT NULL,
  `duration` int NULL DEFAULT 0,
  `UpdateTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ProgressID`) USING BTREE,
  UNIQUE INDEX `user_question`(`UserID` ASC, `QuestionID` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_books
-- ----------------------------
DROP TABLE IF EXISTS `med_books`;
CREATE TABLE `med_books`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `book_id`(`book_id` ASC) USING BTREE,
  INDEX `idx_course_id`(`course_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_chapters
-- ----------------------------
DROP TABLE IF EXISTS `med_chapters`;
CREATE TABLE `med_chapters`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `chapter_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `course_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `chapter_id`(`chapter_id` ASC) USING BTREE,
  UNIQUE INDEX `vid`(`vid` ASC) USING BTREE,
  INDEX `idx_course_id`(`course_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 386 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_courses
-- ----------------------------
DROP TABLE IF EXISTS `med_courses`;
CREATE TABLE `med_courses`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `course_id`(`course_id` ASC) USING BTREE,
  UNIQUE INDEX `vid`(`vid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 392 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_feedback
-- ----------------------------
DROP TABLE IF EXISTS `med_feedback`;
CREATE TABLE `med_feedback`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `QuestionID` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` int NULL DEFAULT 1,
  `AdminRemark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `ProcessedAt` timestamp NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_materials
-- ----------------------------
DROP TABLE IF EXISTS `med_materials`;
CREATE TABLE `med_materials`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'link',
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `material_id`(`material_id` ASC) USING BTREE,
  INDEX `idx_course_id`(`course_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_note_likes
-- ----------------------------
DROP TABLE IF EXISTS `med_note_likes`;
CREATE TABLE `med_note_likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `note_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_note`(`user_id` ASC, `note_id` ASC) USING BTREE,
  INDEX `idx_note_id`(`note_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_notes
-- ----------------------------
DROP TABLE IF EXISTS `med_notes`;
CREATE TABLE `med_notes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_public` tinyint NULL DEFAULT 1,
  `parent_id` int NULL DEFAULT 0,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_question_tags
-- ----------------------------
DROP TABLE IF EXISTS `med_question_tags`;
CREATE TABLE `med_question_tags`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_questions
-- ----------------------------
DROP TABLE IF EXISTS `med_questions`;
CREATE TABLE `med_questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chapter_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `topic` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `topic_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `content` json NULL,
  `answer` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `analysis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `basic_analysis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `basic_analysis_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `itemize_analysis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `itemize_analysis_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `comparison_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `comparison_images` json NULL,
  `mind_map` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `mind_map_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `knowledge_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `score` int NULL DEFAULT 0,
  `score_describe` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `question_type_option` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `column_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_course_id`(`course_id` ASC) USING BTREE,
  INDEX `idx_chapter_id`(`chapter_id` ASC) USING BTREE,
  INDEX `idx_year`(`year` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6585 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_user_answers
-- ----------------------------
DROP TABLE IF EXISTS `med_user_answers`;
CREATE TABLE `med_user_answers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` int NOT NULL,
  `user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `is_correct` tinyint(1) NULL DEFAULT NULL,
  `duration` int NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_question`(`user_id` ASC, `question_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_user_favorites
-- ----------------------------
DROP TABLE IF EXISTS `med_user_favorites`;
CREATE TABLE `med_user_favorites`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_question`(`user_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for med_user_progress
-- ----------------------------
DROP TABLE IF EXISTS `med_user_progress`;
CREATE TABLE `med_user_progress`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint NULL DEFAULT 0,
  `last_answer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `duration` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_question`(`user_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 43 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for nav_categories
-- ----------------------------
DROP TABLE IF EXISTS `nav_categories`;
CREATE TABLE `nav_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `page_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 63 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for nav_subjects
-- ----------------------------
DROP TABLE IF EXISTS `nav_subjects`;
CREATE TABLE `nav_subjects`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_type_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `page_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `is_public` tinyint NULL DEFAULT 1 COMMENT '0: 非公共题库, 1: 公共题库',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'books',
  `text_icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#ffffff',
  `category_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'public',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notices
-- ----------------------------
DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '系统通知',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `linkUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `imageUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'general',
  `noticeType` enum('article','link','wechat') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'article',
  `status` tinyint NULL DEFAULT 1,
  `isActive` tinyint NULL DEFAULT 1,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `subCategory` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `viewCount` int NULL DEFAULT 0,
  `author` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '研兔刷题',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pan_categories
-- ----------------------------
DROP TABLE IF EXISTS `pan_categories`;
CREATE TABLE `pan_categories`  (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SortOrder` int NULL DEFAULT 0,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CategoryID`) USING BTREE,
  UNIQUE INDEX `CategoryName`(`CategoryName` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for pan_resources
-- ----------------------------
DROP TABLE IF EXISTS `pan_resources`;
CREATE TABLE `pan_resources`  (
  `ResourceID` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `QuarkUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `BaiduUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `IsNew` tinyint(1) NULL DEFAULT 0,
  `UpdateStatus` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ResourceID`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for points_records
-- ----------------------------
DROP TABLE IF EXISTS `points_records`;
CREATE TABLE `points_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for politics_section_books
-- ----------------------------
DROP TABLE IF EXISTS `politics_section_books`;
CREATE TABLE `politics_section_books`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `book_id` int NOT NULL,
  `sort` int NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_section_book`(`section_id` ASC, `book_id` ASC) USING BTREE,
  CONSTRAINT `politics_section_books_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `politics_sections` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for politics_sections
-- ----------------------------
DROP TABLE IF EXISTS `politics_sections`;
CREATE TABLE `politics_sections`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_rows` int NULL DEFAULT 1 COMMENT '展开时显示的行数',
  `sort` int NULL DEFAULT 0,
  `status` int NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_answer_records
-- ----------------------------
DROP TABLE IF EXISTS `public_answer_records`;
CREATE TABLE `public_answer_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NULL DEFAULT NULL,
  `questionId` int NULL DEFAULT NULL,
  `isCorrect` tinyint(1) NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `duration` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `userId`(`userId` ASC) USING BTREE,
  INDEX `questionId`(`questionId` ASC) USING BTREE,
  CONSTRAINT `public_answer_records_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `public_answer_records_ibfk_2` FOREIGN KEY (`questionId`) REFERENCES `public_questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 91 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_books
-- ----------------------------
DROP TABLE IF EXISTS `public_books`;
CREATE TABLE `public_books`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'book, mock, real, card_set',
  `subject` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_category_id` int NULL DEFAULT NULL,
  `second_category_id` int NULL DEFAULT NULL,
  `third_category_id` int NULL DEFAULT NULL,
  `code_prefix` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '题目编码前缀，用于手动创建题目的ID生成',
  `next_question_code` int NULL DEFAULT 1 COMMENT '下一个题目的序号，用于生成题目ID',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `pic_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` int NULL DEFAULT 1 COMMENT '0: 禁用, 1: 启用',
  `sort` int NULL DEFAULT 0,
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_subject_type`(`subject` ASC, `type` ASC) USING BTREE,
  INDEX `idx_categories`(`first_category_id` ASC, `second_category_id` ASC, `third_category_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 76 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_categories
-- ----------------------------
DROP TABLE IF EXISTS `public_categories`;
CREATE TABLE `public_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int NOT NULL COMMENT '1: 一级, 2: 二级, 3: 三级',
  `parentId` int NULL DEFAULT 0,
  `subject` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '科目标识: politics, math, english, computer等',
  `sort` int NULL DEFAULT 0,
  `is_public` tinyint NULL DEFAULT 1 COMMENT '0: 非公共题库, 1: 公共题库',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_subject`(`subject` ASC) USING BTREE,
  INDEX `idx_parent`(`parentId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_chapters
-- ----------------------------
DROP TABLE IF EXISTS `public_chapters`;
CREATE TABLE `public_chapters`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `parent_id` int NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int NOT NULL,
  `question_count` int NULL DEFAULT 0,
  `start_index` int NULL DEFAULT 0,
  `end_index` int NULL DEFAULT 0,
  `sort_order` int NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `book_id`(`book_id` ASC) USING BTREE,
  CONSTRAINT `public_chapters_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `public_books` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1452 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_favorite_questions
-- ----------------------------
DROP TABLE IF EXISTS `public_favorite_questions`;
CREATE TABLE `public_favorite_questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questionId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_question`(`userId` ASC, `questionId` ASC) USING BTREE,
  INDEX `questionId`(`questionId` ASC) USING BTREE,
  CONSTRAINT `public_favorite_questions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `public_favorite_questions_ibfk_2` FOREIGN KEY (`questionId`) REFERENCES `public_questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_feedback
-- ----------------------------
DROP TABLE IF EXISTS `public_feedback`;
CREATE TABLE `public_feedback`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questionId` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '题目纠错',
  `status` int NULL DEFAULT 0,
  `adminRemark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_note_likes
-- ----------------------------
DROP TABLE IF EXISTS `public_note_likes`;
CREATE TABLE `public_note_likes`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `userId` bigint NOT NULL,
  `noteId` bigint NOT NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_note`(`userId` ASC, `noteId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_question_notes
-- ----------------------------
DROP TABLE IF EXISTS `public_question_notes`;
CREATE TABLE `public_question_notes`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `userId` bigint NOT NULL,
  `questionId` bigint NOT NULL,
  `parentId` bigint NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '未知',
  `isPublic` tinyint NULL DEFAULT 1 COMMENT '1:公开, 0:私密',
  `likeCount` int NULL DEFAULT 0,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_question_id`(`questionId` ASC) USING BTREE,
  INDEX `idx_user_id`(`userId` ASC) USING BTREE,
  INDEX `idx_parentId`(`parentId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_question_stats
-- ----------------------------
DROP TABLE IF EXISTS `public_question_stats`;
CREATE TABLE `public_question_stats`  (
  `questionId` int NOT NULL,
  `totalAttempts` int NULL DEFAULT 0,
  `totalCorrect` int NULL DEFAULT 0,
  `averageScore` decimal(5, 2) NULL DEFAULT 0.00,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`questionId`) USING BTREE,
  CONSTRAINT `public_question_stats_ibfk_1` FOREIGN KEY (`questionId`) REFERENCES `public_questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_questions
-- ----------------------------
DROP TABLE IF EXISTS `public_questions`;
CREATE TABLE `public_questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookId` int NOT NULL,
  `chapterId` int NULL DEFAULT NULL,
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_richtext` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `type` int NULL DEFAULT 1 COMMENT '1: 单选, 2: 多选, 3: 判断, 4: 填空, 10: 知识卡',
  `score` int NULL DEFAULT 0,
  `year` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `options` json NULL COMMENT '选项列表',
  `answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '正确答案',
  `answer_richtext` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '解析/知识点详情',
  `difficulty` int NULL DEFAULT 3,
  `original_book_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原始题号',
  `original_book_title_page` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `original_book_comment_page` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `media` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '多媒体链接',
  `media_type` int NULL DEFAULT 1,
  `isKnowledgeCard` tinyint(1) NULL DEFAULT 0,
  `mnemonic` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '口诀 (针对知识卡)',
  `sort` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `pic_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `answers_correct_number` int NULL DEFAULT 0,
  `answers_number` int NULL DEFAULT 0,
  `answer_accuracy` decimal(5, 2) NULL DEFAULT 0.00,
  `question_source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_book`(`bookId` ASC) USING BTREE,
  INDEX `idx_is_card`(`isKnowledgeCard` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 19010 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_user_progress
-- ----------------------------
DROP TABLE IF EXISTS `public_user_progress`;
CREATE TABLE `public_user_progress`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `bookId` int NOT NULL,
  `lastIndex` int NULL DEFAULT 0,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `duration` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_book`(`userId` ASC, `bookId` ASC) USING BTREE,
  CONSTRAINT `public_user_progress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 327 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for public_wrong_questions
-- ----------------------------
DROP TABLE IF EXISTS `public_wrong_questions`;
CREATE TABLE `public_wrong_questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questionId` int NOT NULL,
  `errorCount` int NULL DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_user_question`(`userId` ASC, `questionId` ASC) USING BTREE,
  INDEX `questionId`(`questionId` ASC) USING BTREE,
  CONSTRAINT `public_wrong_questions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `public_wrong_questions_ibfk_2` FOREIGN KEY (`questionId`) REFERENCES `public_questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 43 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `examTypeId` int NOT NULL,
  `subjectId` int NOT NULL,
  `chapterId` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json NULL,
  `answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `type` tinyint NULL DEFAULT 0,
  `difficulty` tinyint NULL DEFAULT 1,
  `isActive` tinyint NULL DEFAULT 1,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `answers_correct_number` int NULL DEFAULT 0,
  `answers_number` int NULL DEFAULT 0,
  `answer_accuracy` decimal(5, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for redeem_codes
-- ----------------------------
DROP TABLE IF EXISTS `redeem_codes`;
CREATE TABLE `redeem_codes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` int NOT NULL,
  `resource_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `is_used` tinyint NULL DEFAULT 0,
  `used_by` int NULL DEFAULT NULL,
  `used_at` datetime NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for redeem_records
-- ----------------------------
DROP TABLE IF EXISTS `redeem_records`;
CREATE TABLE `redeem_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `redeemCodeId` int NOT NULL,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_redeem_records
-- ----------------------------
DROP TABLE IF EXISTS `user_redeem_records`;
CREATE TABLE `user_redeem_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `redeem_code_id` int NOT NULL COMMENT '兑换码ID',
  `target_type` tinyint NOT NULL COMMENT '兑换类型 1合集 2单个视频',
  `target_id` int NOT NULL COMMENT '目标ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `redeem_code_id`(`redeem_code_id` ASC) USING BTREE,
  CONSTRAINT `user_redeem_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_redeem_records_ibfk_2` FOREIGN KEY (`redeem_code_id`) REFERENCES `generic_redeem_codes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户兑换记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_settings
-- ----------------------------
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings`  (
  `userId` int NOT NULL,
  `autoNext` tinyint(1) NULL DEFAULT 1,
  `nightMode` tinyint(1) NULL DEFAULT 0,
  `fontSize` int NULL DEFAULT 16,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `recitationMode` tinyint(1) NULL DEFAULT 0,
  `autoRemoveWrong` tinyint(1) NULL DEFAULT 1,
  `fontSizeLevel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'standard',
  PRIMARY KEY (`userId`) USING BTREE,
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_videos
-- ----------------------------
DROP TABLE IF EXISTS `user_videos`;
CREATE TABLE `user_videos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `resource_id` int NOT NULL,
  `is_favorite` tinyint NULL DEFAULT 0,
  `has_access` tinyint NULL DEFAULT 0,
  `access_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `last_played_at` datetime NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_resource`(`user_id` ASC, `resource_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `openid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `gender` tinyint NULL DEFAULT 0,
  `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `role` tinyint NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 1,
  `totalQuestions` int NULL DEFAULT 0,
  `correctRate` decimal(5, 2) NULL DEFAULT 0.00,
  `practiceDays` int NULL DEFAULT 0,
  `totalScore` int NULL DEFAULT 0,
  `points` int NULL DEFAULT 0,
  `registerDate` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `lastLoginDate` datetime NULL DEFAULT NULL,
  `SelectedSubjectID` int NULL DEFAULT NULL,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `total_duration` int NULL DEFAULT 0,
  `total_questions` int NULL DEFAULT 0,
  `total_correct` int NULL DEFAULT 0,
  `last_study_time` datetime NULL DEFAULT NULL,
  `study_days` int NULL DEFAULT 0,
  `level` int NOT NULL DEFAULT 1 COMMENT '用户等级',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `studentId`(`studentId` ASC) USING BTREE,
  UNIQUE INDEX `phone`(`phone` ASC) USING BTREE,
  UNIQUE INDEX `openid`(`openid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_feedback
-- ----------------------------
DROP TABLE IF EXISTS `video_feedback`;
CREATE TABLE `video_feedback`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `resource_id` int NULL DEFAULT NULL,
  `type` enum('feedback','recommendation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'feedback',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `resource_id`(`resource_id` ASC) USING BTREE,
  CONSTRAINT `video_feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `video_feedback_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `video_resources` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_recommendations
-- ----------------------------
DROP TABLE IF EXISTS `video_recommendations`;
CREATE TABLE `video_recommendations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_resources
-- ----------------------------
DROP TABLE IF EXISTS `video_resources`;
CREATE TABLE `video_resources`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `vid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `category_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bili_link` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `items_json` json NULL,
  `redeem_codes` json NULL,
  `type` enum('single','collection') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'single',
  `is_public` tinyint NULL DEFAULT 1 COMMENT '1: Show in list, 0: Hidden',
  `requires_redemption` tinyint NULL DEFAULT 0 COMMENT '1: Need code to watch, 0: Free',
  `status` tinyint NULL DEFAULT 1,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  UNIQUE INDEX `vid`(`vid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_subjects
-- ----------------------------
DROP TABLE IF EXISTS `video_subjects`;
CREATE TABLE `video_subjects`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int NULL DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `sort` int NULL DEFAULT 0 COMMENT '排序值',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态 1启用 0禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '视频分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wrong_questions
-- ----------------------------
DROP TABLE IF EXISTS `wrong_questions`;
CREATE TABLE `wrong_questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `questionId` int NULL DEFAULT NULL,
  `mongo_question_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `examId` int NULL DEFAULT NULL,
  `subjectId` int NULL DEFAULT NULL,
  `chapterId` int NULL DEFAULT NULL,
  `userAnswer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `isResolved` tinyint NULL DEFAULT 0,
  `isActive` tinyint NULL DEFAULT 1,
  `createdAt` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
