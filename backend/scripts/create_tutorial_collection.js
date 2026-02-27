const mysqlPool = require('../config/mysql');

async function createTutorialCollection() {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 创建教辅合集表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS computer1_tutorial_collection (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '合集名称（如：王道考研）',
        version VARCHAR(20) NOT NULL COMMENT '版本（如25版、26版）',
        year INT COMMENT '年份',
        cover_url VARCHAR(500) COMMENT '封面图',
        description TEXT COMMENT '描述',
        total_questions INT DEFAULT 0 COMMENT '总题数（所有科目合计）',
        sort_order INT DEFAULT 0 COMMENT '排序',
        status TINYINT DEFAULT 1 COMMENT '状态：0=禁用，1=启用',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_name_version (name, version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计算机教辅合集表'
    `);
    console.log('✓ 创建 computer1_tutorial_collection 表成功');

    // 2. 修改教辅表，添加合集关联和科目字段
    try {
      await connection.query(`
        ALTER TABLE computer1_tutorial
        ADD COLUMN collection_id INT DEFAULT NULL COMMENT '关联合集ID' AFTER id,
        ADD COLUMN subject VARCHAR(50) DEFAULT NULL COMMENT '科目（如：数据结构、操作系统）' AFTER name,
        ADD KEY idx_collection_id (collection_id)
      `);
      console.log('✓ 修改 computer1_tutorial 表成功');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('✓ computer1_tutorial 表已包含新字段');
      } else {
        throw e;
      }
    }

    // 3. 修改章节表，添加科目字段（方便查询）
    try {
      await connection.query(`
        ALTER TABLE computer1_tutorial_chapter
        ADD COLUMN subject VARCHAR(50) DEFAULT NULL COMMENT '科目' AFTER tutorial_id
      `);
      console.log('✓ 修改 computer1_tutorial_chapter 表成功');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('✓ computer1_tutorial_chapter 表已包含新字段');
      } else {
        throw e;
      }
    }

    await connection.commit();
    console.log('\n✅ 教辅合集结构创建完成！');
    console.log('\n新的数据结构：');
    console.log('- computer1_tutorial_collection: 合集表（如王道考研 2026版）');
    console.log('- computer1_tutorial: 教辅表（关联合集，包含具体科目）');
    console.log('- computer1_tutorial_chapter: 章节表（关联教辅）');
    console.log('- computer1_tutorial_question: 题目关联表');

  } catch (error) {
    await connection.rollback();
    console.error('创建失败:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

createTutorialCollection();
