const mysqlPool = require('../config/mysql');

async function checkTables() {
  try {
    // 查看 computer1_question 表结构
    console.log('=== computer1_question 表结构 ===');
    const [qColumns] = await mysqlPool.query('SHOW COLUMNS FROM computer1_question');
    qColumns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // 查看是否已有书籍相关表
    console.log('\n=== 检查是否有书籍相关表 ===');
    const [tables] = await mysqlPool.query("SHOW TABLES LIKE 'computer1_book%'");
    if (tables.length > 0) {
      tables.forEach(t => {
        console.log('已存在表:', Object.values(t)[0]);
      });
    } else {
      console.log('暂无书籍相关表');
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables();
