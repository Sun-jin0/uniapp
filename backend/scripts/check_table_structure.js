const mysqlPool = require('../config/mysql');

async function checkTableStructure() {
  try {
    // 查看 math_relatedquestions 表结构
    const [columns] = await mysqlPool.query(`
      SHOW COLUMNS FROM math_relatedquestions
    `);
    
    console.log('math_relatedquestions 表结构：');
    console.log('========================================');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // 查看表中的示例数据
    const [sampleData] = await mysqlPool.query(`
      SELECT * FROM math_relatedquestions LIMIT 3
    `);
    
    console.log('\n示例数据：');
    console.log('========================================');
    console.log(JSON.stringify(sampleData, null, 2));
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();
