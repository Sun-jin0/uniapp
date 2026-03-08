const pool = require('../config/mysql');

async function testUpload() {
  try {
    // 测试数据库连接
    const [rows] = await pool.query('SELECT 1 as test');
    console.log('✓ 数据库连接正常:', rows);
    
    // 测试 image_management 表是否存在
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'image_management'
    `);
    console.log('✓ image_management 表:', tables.length > 0 ? '存在' : '不存在');
    
    if (tables.length > 0) {
      // 测试插入
      const [result] = await pool.execute(`
        INSERT INTO image_management 
        (image_name, image_type, image_size, image_hash, oss_url, oss_status, source_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['test.jpg', 'jpg', 1024, 'testhash', 'https://test.com/test.jpg', 1, 'test']);
      console.log('✓ 测试插入成功, ID:', result.insertId);
      
      // 删除测试数据
      await pool.execute('DELETE FROM image_management WHERE id = ?', [result.insertId]);
      console.log('✓ 测试数据已清理');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    process.exit(1);
  }
}

testUpload();
