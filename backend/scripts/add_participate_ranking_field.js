/**
 * 添加 participate_ranking 字段到 users 表
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || '139.199.9.132',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'quizmaster',
  port: process.env.MYSQL_PORT || 3306
};

async function addParticipateRankingField() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功！\n');

    // 检查字段是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'participate_ranking'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (columns.length > 0) {
      console.log('✓ participate_ranking 字段已存在');
    } else {
      // 添加字段
      console.log('添加 participate_ranking 字段...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN participate_ranking TINYINT(1) DEFAULT 1 COMMENT '是否参与排行榜：1-参与，0-不参与'
      `);
      console.log('✓ participate_ranking 字段添加成功');
    }

    // 验证字段
    const [verify] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'participate_ranking'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (verify.length > 0) {
      console.log('\n字段信息:');
      console.log('  - 字段名:', verify[0].COLUMN_NAME);
      console.log('  - 默认值:', verify[0].COLUMN_DEFAULT);
      console.log('  - 注释:', verify[0].COLUMN_COMMENT);
    }

    console.log('\n========================================');
    console.log('参与排行榜字段设置完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行
addParticipateRankingField();
