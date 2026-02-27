const mysqlPool = require('../config/mysql');

async function check() {
  try {
    // 获取所有教辅
    const [tutorials] = await mysqlPool.query('SELECT id, name FROM computer1_tutorial');
    console.log('教辅数量:', tutorials.length);
    
    for (const tutorial of tutorials) {
      const [chapters] = await mysqlPool.query(
        'SELECT id, name, level, parent_id FROM computer1_tutorial_chapter WHERE tutorial_id = ? ORDER BY level, id',
        [tutorial.id]
      );
      const level1 = chapters.filter(c => c.level === 1).length;
      const level2 = chapters.filter(c => c.level === 2).length;
      console.log(`\n教辅 ${tutorial.id} (${tutorial.name}):`);
      console.log(`  章(level=1): ${level1}个`);
      console.log(`  节(level=2): ${level2}个`);
      
      if (level2 === 0 && level1 > 0) {
        console.log('  ⚠️ 警告: 没有小节数据!');
        chapters.forEach(c => {
          console.log(`    - ${c.name} (ID: ${c.id})`);
        });
      }
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    process.exit(0);
  }
}

check();
