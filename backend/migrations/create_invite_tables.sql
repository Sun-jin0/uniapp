-- 用户邀请信息表
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

-- 邀请记录表
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

-- 用户答题统计表（如果还没有的话）
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
