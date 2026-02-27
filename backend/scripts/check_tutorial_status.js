const mysqlPool = require('../config/mysql');

async function checkTutorialStatus() {
  try {
    // 查看所有教辅
    const [tutorials] = await mysqlPool.query('SELECT * FROM computer1_tutorial ORDER BY id DESC');
    
    console.log('所有教辅:');
    console.log('================');
    tutorials.forEach(t => {
      console.log(`ID=${t.id}, 名称=${t.name}, 版本=${t.version}, 状态=${t.status}, 题目数=${t.total_questions}`);
    });
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTutorialStatus();
