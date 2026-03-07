-- 添加登录类型字段到用户表
ALTER TABLE users ADD COLUMN login_type VARCHAR(20) DEFAULT 'wechat' COMMENT '登录类型: wechat=微信登录, password=账号密码登录' AFTER openid;

-- 更新现有用户（有openid的是微信登录，否则是账号密码登录）
UPDATE users SET login_type = 'wechat' WHERE openid IS NOT NULL AND openid != '';
UPDATE users SET login_type = 'password' WHERE openid IS NULL OR openid = '';

-- 修改 user_invites 表，添加是否需要邀请的标记
ALTER TABLE user_invites ADD COLUMN need_invite TINYINT(1) DEFAULT 1 COMMENT '是否需要邀请: 0=不需要, 1=需要' AFTER is_unlocked;

-- 更新现有数据
-- 账号密码登录的用户不需要邀请
UPDATE user_invites ui
JOIN users u ON ui.user_id = u.id
SET ui.need_invite = 0, ui.is_unlocked = 1
WHERE u.login_type = 'password';
