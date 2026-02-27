const mysqlPool = require('../config/mysql');

async function fixUniqueConstraint() {
  const connection = await mysqlPool.getConnection();
  
  try {
    // 1. 查看当前索引
    const [indexes] = await connection.query(`
      SHOW INDEX FROM computer1_tutorial_question
    `);
    console.log('当前索引:');
    indexes.forEach(idx => {
      console.log(`  ${idx.Key_name}: ${idx.Column_name}`);
    });
    
    // 2. 删除旧的唯一索引
    try {
      await connection.query(`
        ALTER TABLE computer1_tutorial_question DROP INDEX uk_chapter_question
      `);
      console.log('✓ 删除旧索引 uk_chapter_question');
    } catch (e) {
      console.log('索引不存在或已删除');
    }
    
    // 3. 添加新的唯一索引 (tutorial_id + chapter_id + question_id)
    await connection.query(`
      ALTER TABLE computer1_tutorial_question 
      ADD UNIQUE KEY uk_tutorial_chapter_question (tutorial_id, chapter_id, question_id)
    `);
    console.log('✓ 添加新唯一索引 uk_tutorial_chapter_question');
    
    // 4. 查看更新后的索引
    const [newIndexes] = await connection.query(`
      SHOW INDEX FROM computer1_tutorial_question
    `);
    console.log('\n更新后索引:');
    newIndexes.forEach(idx => {
      console.log(`  ${idx.Key_name}: ${idx.Column_name}`);
    });
    
  } catch (error) {
    console.error('操作失败:', error.message);
  } finally {
    connection.release();
  }
  
  process.exit(0);
}

fixUniqueConstraint();
