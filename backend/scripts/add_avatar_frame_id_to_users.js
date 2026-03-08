const pool = require('../config/mysql');

async function addAvatarFrameIdField() {
  const connection = await pool.getConnection();
  
  try {
    console.log('检查 users 表是否有 avatar_frame_id 字段...\n');
    
    const [columns] = await connection.query('SHOW COLUMNS FROM users LIKE "avatar_frame_id"');
    
    if (columns.length > 0) {
      console.log('✓ avatar_frame_id 字段已存在\n');
      return;
    }
    
    console.log('添加 avatar_frame_id 字段到 users 表...');
    await connection.query(
      'ALTER TABLE users ADD COLUMN avatar_frame_id INT DEFAULT NULL COMMENT "用户使用的头像框ID"'
    );
    
    console.log('✓ avatar_frame_id 字段添加成功\n');
    
    console.log('添加外键约束...');
    await connection.query(
      'ALTER TABLE users ADD FOREIGN KEY (avatar_frame_id) REFERENCES avatar_frames(id) ON DELETE SET NULL'
    );
    
    console.log('✓ 外键约束添加成功\n');
    
    console.log('完成！');
    
  } catch (error) {
    console.error('执行失败:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addAvatarFrameIdField();
