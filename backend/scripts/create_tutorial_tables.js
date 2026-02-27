const mysqlPool = require('../config/mysql');

async function createTutorialTables() {
  const connection = await mysqlPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. 创建教辅书籍表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS computer1_tutorial (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '教辅名称',
        version VARCHAR(20) NOT NULL COMMENT '版本（如25版、26版）',
        year INT COMMENT '年份',
        cover_url VARCHAR(500) COMMENT '封面图',
        description TEXT COMMENT '描述',
        total_questions INT DEFAULT 0 COMMENT '总题数',
        sort_order INT DEFAULT 0 COMMENT '排序',
        status TINYINT DEFAULT 1 COMMENT '状态：0=禁用，1=启用',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_name_version (name, version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计算机教辅书籍表'
    `);
    console.log('✓ 创建 computer1_tutorial 表成功');
    
    // 2. 创建教辅章节表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS computer1_tutorial_chapter (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tutorial_id INT NOT NULL COMMENT '关联教辅ID',
        parent_id INT DEFAULT 0 COMMENT '父章节ID（0=顶级章节）',
        name VARCHAR(200) NOT NULL COMMENT '章节名称',
        level TINYINT NOT NULL COMMENT '层级：1=章，2=节',
        sort_order INT DEFAULT 0 COMMENT '排序',
        question_count INT DEFAULT 0 COMMENT '题目数量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_tutorial_id (tutorial_id),
        KEY idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计算机教辅章节表'
    `);
    console.log('✓ 创建 computer1_tutorial_chapter 表成功');
    
    // 3. 创建教辅题目关联表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS computer1_tutorial_question (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tutorial_id INT NOT NULL COMMENT '关联教辅ID',
        chapter_id INT NOT NULL COMMENT '关联章节ID（小节级别）',
        question_id VARCHAR(50) NOT NULL COMMENT '关联题目ID',
        sort_order INT DEFAULT 0 COMMENT '题目顺序',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_chapter_question (chapter_id, question_id),
        KEY idx_tutorial_id (tutorial_id),
        KEY idx_chapter_id (chapter_id),
        KEY idx_question_id (question_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计算机教辅题目关联表'
    `);
    console.log('✓ 创建 computer1_tutorial_question 表成功');
    
    await connection.commit();
    console.log('\n所有表创建成功！');
    
  } catch (error) {
    await connection.rollback();
    console.error('创建表失败:', error.message);
    throw error;
  } finally {
    connection.release();
  }
  
  process.exit(0);
}

createTutorialTables();
