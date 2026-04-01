const pool = require('../config/mysql');

async function checkPityStatus() {
  try {
    // 查看所有用户的保底记录
    const [records] = await pool.query(`
      SELECT * FROM user_pity_records
    `);
    
    console.log('用户保底记录:');
    records.forEach(record => {
      console.log(`  用户 ${record.user_id}:`);
      console.log(`    保底计数: ${record.pity_counter}`);
      console.log(`    今日首抽: ${record.daily_first_draw}`);
      console.log(`    最后抽卡日期: ${record.last_draw_date}`);
    });
    
    // 查看今天的日期
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n今天日期: ${today}`);
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkPityStatus();
