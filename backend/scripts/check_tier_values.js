const pool = require('../config/mysql');

async function checkTierValues() {
  try {
    // 查看所有不同的 tier 值
    const [tiers] = await pool.query(`
      SELECT DISTINCT tier, COUNT(*) as count
      FROM cards 
      WHERE is_active = true 
      GROUP BY tier
    `);
    
    console.log('数据库中的 tier 值:');
    tiers.forEach(row => {
      console.log(`  tier='${row.tier}': ${row.count} 张`);
    });
    
    // 查看 consolation 卡牌的详细信息
    const [consolationCards] = await pool.query(`
      SELECT id, name, tier, is_reward, probability
      FROM cards 
      WHERE tier = 'consolation' AND is_active = true
      LIMIT 3
    `);
    
    console.log('\n安慰奖卡牌示例:');
    consolationCards.forEach(card => {
      console.log(`  ${card.name}: tier=${card.tier}, is_reward=${card.is_reward}, prob=${card.probability}`);
    });
    
    // 查看 common 卡牌的详细信息
    const [commonCards] = await pool.query(`
      SELECT id, name, tier, is_reward, probability
      FROM cards 
      WHERE tier = 'common' AND is_active = true
      LIMIT 3
    `);
    
    console.log('\n普通奖励卡牌示例:');
    commonCards.forEach(card => {
      console.log(`  ${card.name}: tier=${card.tier}, is_reward=${card.is_reward}, prob=${card.probability}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkTierValues();
