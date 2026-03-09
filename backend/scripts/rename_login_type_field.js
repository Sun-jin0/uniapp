const pool = require('../config/mysql');

async function renameField() {
  const connection = await pool.getConnection();
  
  try {
    console.log('检查字段...\n');
    
    // 检查 loginType 是否存在
    const [loginTypeCol] = await connection.query('SHOW COLUMNS FROM users LIKE "loginType"');
    if (loginTypeCol.length > 0) {
      console.log('将 loginType 重命名为 login_type...');
      await connection.query('ALTER TABLE users CHANGE COLUMN loginType login_type VARCHAR(50) DEFAULT NULL');
      console.log('✓ 重命名成功\n');
    } else {
      // 检查 login_type 是否存在
      const [loginTypeCol2] = await connection.query('SHOW COLUMNS FROM users LIKE "login_type"');
      if (loginTypeCol2.length > 0) {
        console.log('✓ login_type 字段已存在\n');
      } else {
        console.log('添加 login_type 字段...');
        await connection.query('ALTER TABLE users ADD COLUMN login_type VARCHAR(50) DEFAULT NULL');
        console.log('✓ login_type 字段添加成功\n');
      }
    }
    
    console.log('完成！');
    
  } catch (error) {
    console.error('执行失败:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

renameField();
