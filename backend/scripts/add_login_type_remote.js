const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'rm-bp11cadkau5p4h7to.mysql.rds.aliyuncs.com',
  user: 'yizhancs',
  password: 'Yizhancs123!',
  database: 'quizmaster',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

async function addMissingColumns() {
  try {
    console.log('开始检查并添加缺失的字段（远程数据库）...\n');

    // 检查并添加 openid 字段
    try {
      await pool.query('ALTER TABLE users ADD COLUMN openid VARCHAR(255) UNIQUE AFTER phone');
      console.log('✓ 添加 openid 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ openid 字段已存在');
      } else {
        console.log('openid 字段:', e.message);
      }
    }

    // 检查并添加 loginType 字段
    try {
      await pool.query('ALTER TABLE users ADD COLUMN loginType VARCHAR(50) DEFAULT NULL AFTER status');
      console.log('✓ 添加 loginType 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ loginType 字段已存在');
      } else {
        console.log('loginType 字段:', e.message);
      }
    }

    console.log('\n========================================');
    console.log('处理完成！');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('处理失败:', error.message);
    process.exit(1);
  }
}

addMissingColumns();
