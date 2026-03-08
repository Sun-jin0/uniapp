-- 创建头像框管理表
CREATE TABLE IF NOT EXISTS avatar_frames (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '头像框ID',
  name VARCHAR(50) NOT NULL COMMENT '头像框名称',
  image_url VARCHAR(500) NOT NULL COMMENT '头像框图片URL',
  effect_code TEXT COMMENT '特效CSS/JS代码',
  required_level INT DEFAULT 1 COMMENT '需要的用户等级',
  required_points INT DEFAULT 0 COMMENT '需要的积分',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用: 1=启用, 0=禁用',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='头像框管理表';

-- 插入默认头像框数据
INSERT INTO avatar_frames (name, image_url, effect_code, required_level, required_points, is_active, sort_order) VALUES
('珍品传说', '/static/images/珍品传说.png', '', 10, 0, 1, 1),
('浪一下', '/static/images/浪一下.png', '', 5, 0, 1, 2);
