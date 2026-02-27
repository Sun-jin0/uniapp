const mysqlPool = require('../config/mysql');

async function resetTutorialTables() {
  try {
    console.log('开始重置教辅相关表的自增ID...\n');
    
    // 重置 computer1_tutorial 表
    console.log('1. 重置 computer1_tutorial 表...');
    await mysqlPool.query('ALTER TABLE computer1_tutorial AUTO_INCREMENT = 1');
    console.log('   ✓ 完成');
    
    // 重置 computer1_tutorial_chapter 表
    console.log('2. 重置 computer1_tutorial_chapter 表...');
    await mysqlPool.query('ALTER TABLE computer1_tutorial_chapter AUTO_INCREMENT = 1');
    console.log('   ✓ 完成');
    
    // 重置 computer1_tutorial_question 表
    console.log('3. 重置 computer1_tutorial_question 表...');
    await mysqlPool.query('ALTER TABLE computer1_tutorial_question AUTO_INCREMENT = 1');
    console.log('   ✓ 完成');
    
    console.log('\n所有表重置完成！');
    
  } catch (error) {
    console.error('重置失败:', error.message);
  } finally {
    process.exit(0);
  }
}

resetTutorialTables();
