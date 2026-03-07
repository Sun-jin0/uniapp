-- 邀请系统数据库初始化脚本
-- 在宝塔面板 phpMyAdmin 或 MySQL 命令行中执行

-- 1. 创建 user_invites 表
CREATE TABLE IF NOT EXISTS user_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  invite_code VARCHAR(10) NOT NULL COMMENT '邀请码（6位）',
  invite_count INT DEFAULT 0 COMMENT '成功邀请人数',
  need_invite TINYINT(1) DEFAULT 1 COMMENT '是否需要邀请（0=不需要，1=需要）',
  is_unlocked TINYINT(1) DEFAULT 0 COMMENT '是否已永久解锁（0=未解锁，1=已解锁）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  UNIQUE KEY uk_invite_code (invite_code),
  KEY idx_invite_count (invite_count),
  KEY idx_is_unlocked (is_unlocked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户邀请信息表';

-- 2. 创建 invite_records 表
CREATE TABLE IF NOT EXISTS invite_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inviter_id INT NOT NULL COMMENT '邀请人ID',
  invitee_id INT NOT NULL COMMENT '被邀请人ID',
  invite_code VARCHAR(10) NOT NULL COMMENT '使用的邀请码',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_invitee (invitee_id),
  KEY idx_inviter (inviter_id),
  KEY idx_invite_code (invite_code),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请记录表';

-- 3. 创建 user_answer_stats 表
CREATE TABLE IF NOT EXISTS user_answer_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  total_answer_count INT DEFAULT 0 COMMENT '总答题数',
  today_answer_count INT DEFAULT 0 COMMENT '今日答题数',
  last_answer_date DATE COMMENT '最后答题日期',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  KEY idx_total_count (total_answer_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户答题统计表';

-- 4. 为所有用户生成邀请码
-- 账号密码登录用户（studentId 不以 WX 开头）：不需要邀请，直接解锁
-- 微信登录用户（studentId 以 WX 开头）：需要邀请

-- 先删除可能存在的旧数据（谨慎操作）
-- DELETE FROM user_invites;

-- 为账号密码登录用户生成邀请码（直接解锁）
INSERT INTO user_invites (user_id, invite_code, invite_count, need_invite, is_unlocked, created_at, updated_at)
SELECT 
  u.id,
  UPPER(SUBSTRING(MD5(CONCAT(u.id, UNIX_TIMESTAMP())), 1, 6)) as invite_code,
  0 as invite_count,
  0 as need_invite,
  1 as is_unlocked,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
WHERE u.studentId IS NOT NULL 
  AND u.studentId NOT LIKE 'WX%'
  AND u.id NOT IN (SELECT user_id FROM user_invites)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 为微信登录用户生成邀请码（需要邀请）
INSERT INTO user_invites (user_id, invite_code, invite_count, need_invite, is_unlocked, created_at, updated_at)
SELECT 
  u.id,
  UPPER(SUBSTRING(MD5(CONCAT(u.id, UNIX_TIMESTAMP(), 'wx')), 1, 6)) as invite_code,
  0 as invite_count,
  1 as need_invite,
  0 as is_unlocked,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
WHERE u.studentId IS NOT NULL 
  AND u.studentId LIKE 'WX%'
  AND u.id NOT IN (SELECT user_id FROM user_invites)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 检查创建结果
SELECT 'user_invites 表记录数:' as info, COUNT(*) as count FROM user_invites
UNION ALL
SELECT 'invite_records 表记录数:' as info, COUNT(*) as count FROM invite_records
UNION ALL
SELECT 'user_answer_stats 表记录数:' as info, COUNT(*) as count FROM user_answer_stats;

-- 显示用户邀请状态
SELECT 
  u.username,
  u.studentId,
  ui.invite_code,
  ui.invite_count,
  CASE 
    WHEN u.studentId LIKE 'WX%' THEN '微信登录-需邀请'
    ELSE '账号密码登录-已解锁'
  END as user_type,
  CASE 
    WHEN ui.is_unlocked = 1 THEN '已解锁'
    ELSE '需邀请3人'
  END as status
FROM user_invites ui
JOIN users u ON ui.user_id = u.id
ORDER BY ui.id;
