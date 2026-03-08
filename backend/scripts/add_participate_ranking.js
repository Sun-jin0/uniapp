const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || '139.199.9.132',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'quizmaster',
  port: process.env.MYSQL_PORT || 3306
};

async function addParticipateRankingColumn() {
  let connection;
  
  try {
    console.log('连接远程数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    console.log('1. 检查 participate_ranking 字段是否存在...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'participate_ranking'
    `);

    if (columns.length > 0) {
      console.log('   ✓ participate_ranking 字段已存在，无需添加\n');
      return;
    }

    console.log('   字段不存在，开始添加...\n');

    console.log('2. 添加 participate_ranking 字段...');
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN participate_ranking TINYINT(1) DEFAULT 1 
      COMMENT '是否参与排行榜: 1=参与, 0=不参与' 
      AFTER level
    `);
    console.log('   ✓ 成功添加 participate_ranking 字段\n');

    console.log('3. 更新现有用户默认值...');
    const [result] = await connection.execute(`
      UPDATE users 
      SET participate_ranking = 1 
      WHERE participate_ranking IS NULL
    `);
    console.log(`   ✓ 已更新 ${result.affectedRows} 条用户记录\n`);

    console.log('========================================');
    console.log('✅ 数据库迁移完成！');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行迁移
addParticipateRankingColumn();
