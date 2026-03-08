-- 添加参与排行榜设置字段
ALTER TABLE users ADD COLUMN participate_ranking TINYINT(1) DEFAULT 1 COMMENT '是否参与排行榜: 1=参与, 0=不参与' AFTER level;

-- 更新现有用户默认参与排行榜
UPDATE users SET participate_ranking = 1 WHERE participate_ranking IS NULL;
