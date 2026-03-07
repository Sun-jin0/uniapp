-- 删除邀请系统相关数据表
-- 请在 MySQL 数据库中执行此脚本

-- 1. 删除外键约束（如果存在）
ALTER TABLE invite_records DROP FOREIGN KEY IF EXISTS fk_inviter;
ALTER TABLE invite_records DROP FOREIGN KEY IF EXISTS fk_invitee;

-- 2. 删除 invite_records 表
DROP TABLE IF EXISTS invite_records;

-- 3. 删除 user_invites 表
DROP TABLE IF EXISTS user_invites;

-- 完成
