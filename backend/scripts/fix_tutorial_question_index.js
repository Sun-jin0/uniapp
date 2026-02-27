const mysqlPool = require('../config/mysql');

async function fixIndex() {
  try {
    // 查看当前索引
    const [indexes] = await mysqlPool.query(`
      SHOW INDEX FROM computer1_tutorial_question
    `);
    
    console.log('当前索引:');
    indexes.forEach(idx => {
      console.log(`  ${idx.Key_name}: ${idx.Column_name} (唯一: ${idx.Non_unique === 0 ? '是' : '否'})`);
    });
    
    // 删除现有的唯一索引
    console.log('\n删除现有唯一索引...');
    await mysqlPool.query(`
      ALTER TABLE computer1_tutorial_question DROP INDEX uk_tutorial_chapter_question
    `);
    console.log('✓ 已删除');
    
    // 添加新的自增ID作为主键，允许重复关联
    console.log('\n添加新的唯一索引 (只限制完全相同的关联)...');
    // 实际上我们不添加唯一索引了，允许完全重复
    console.log('✓ 不添加唯一索引，允许重复关联');
    
    // 查看更新后的索引
    const [newIndexes] = await mysqlPool.query(`
      SHOW INDEX FROM computer1_tutorial_question
    `);
    
    console.log('\n更新后索引:');
    newIndexes.forEach(idx => {
      console.log(`  ${idx.Key_name}: ${idx.Column_name} (唯一: ${idx.Non_unique === 0 ? '是' : '否'})`);
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    process.exit(0);
  }
}

fixIndex();
