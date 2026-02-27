const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'quizmaster',
  multipleStatements: true
};

async function updateDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('开始更新数据库...\n');
    
    // 禁用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 1. 检查并添加 paper_type 字段到 computer1_paper 表
    console.log('1. 检查 computer1_paper 表的字段...');
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'computer1_paper'`,
      [dbConfig.database]
    );
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    
    if (!columnNames.includes('paper_type')) {
      console.log('   - 添加 paper_type 字段...');
      await connection.execute(`
        ALTER TABLE computer1_paper 
        ADD COLUMN paper_type TINYINT(1) DEFAULT 1 COMMENT '试卷类型:1=真题卷,2=模拟题卷'
      `);
      console.log('   ✓ paper_type 字段添加成功');
    } else {
      console.log('   ✓ paper_type 字段已存在');
    }

    // 2. 删除 computer1_generated_papers 表
    console.log('\n2. 删除 computer1_generated_papers 表...');
    await connection.execute('DROP TABLE IF EXISTS computer1_generated_papers');
    console.log('   ✓ computer1_generated_papers 表已删除');

    // 3. 删除 computer1_generated_paper_questions 表
    console.log('\n3. 删除 computer1_generated_paper_questions 表...');
    await connection.execute('DROP TABLE IF EXISTS computer1_generated_paper_questions');
    console.log('   ✓ computer1_generated_paper_questions 表已删除');

    // 启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // 4. 显示 computer1_paper 表结构
    console.log('\n4. computer1_paper 表当前结构:');
    const [tableInfo] = await connection.execute('DESCRIBE computer1_paper');
    tableInfo.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });

    console.log('\n========================================');
    console.log('✅ 数据库更新完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  } finally {
    await connection.end();
  }
}

updateDatabase();
