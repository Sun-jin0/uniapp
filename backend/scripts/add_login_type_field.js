const pool = require('../config/mysql');

async function addMissingFields() {
  const connection = await pool.getConnection();
  
  try {
    console.log('检查 users 表缺失的字段...\n');
    
    // 检查 openid 字段
    const [openidCol] = await connection.query('SHOW COLUMNS FROM users LIKE "openid"');
    if (openidCol.length === 0) {
      console.log('添加 openid 字段...');
      await connection.query('ALTER TABLE users ADD COLUMN openid VARCHAR(255) UNIQUE');
      console.log('✓ openid 字段添加成功\n');
    } else {
      console.log('✓ openid 字段已存在\n');
    }
    
    // 检查 loginType 字段
    const [loginTypeCol] = await connection.query('SHOW COLUMNS FROM users LIKE "loginType"');
    if (loginTypeCol.length === 0) {
      console.log('添加 loginType 字段...');
      await connection.query('ALTER TABLE users ADD COLUMN loginType VARCHAR(50) DEFAULT NULL');
      console.log('✓ loginType 字段添加成功\n');
    } else {
      console.log('✓ loginType 字段已存在\n');
    }
    
    console.log('完成！');
    
  } catch (error) {
    console.error('执行失败:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addMissingFields();
