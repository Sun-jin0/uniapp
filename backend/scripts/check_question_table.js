const mysqlPool = require('../config/mysql');

async function checkQuestionTable() {
  try {
    // 查看 computer1_question 表结构
    const [columns] = await mysqlPool.query('SHOW COLUMNS FROM computer1_question');
    
    console.log('computer1_question 表结构:');
    console.log('================');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 检查是否有 options 字段
    const hasOptions = columns.some(col => col.Field === 'options');
    console.log('\n是否有 options 字段:', hasOptions ? '是' : '否');
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkQuestionTable();
