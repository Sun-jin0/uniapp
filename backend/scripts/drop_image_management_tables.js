const pool = require('../config/mysql');

async function dropImageManagementTables() {
  try {
    console.log('开始删除图片管理数据表...\n');
    
    // 禁用外键检查
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 删除图片使用记录表
    console.log('删除 image_usage_log 表...');
    await pool.execute('DROP TABLE IF EXISTS image_usage_log');
    console.log('✓ image_usage_log 表删除成功');
    
    // 删除图床统计表
    console.log('删除 image_storage_stats 表...');
    await pool.execute('DROP TABLE IF EXISTS image_storage_stats');
    console.log('✓ image_storage_stats 表删除成功');
    
    // 删除图片管理主表
    console.log('删除 image_management 表...');
    await pool.execute('DROP TABLE IF EXISTS image_management');
    console.log('✓ image_management 表删除成功');
    
    // 启用外键检查
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n========================================');
    console.log('图片管理数据表删除完成！');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('删除数据表失败:', error);
    process.exit(1);
  }
}

dropImageManagementTables();
