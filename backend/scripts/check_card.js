const pool = require('../config/mysql');

async function check() {
  const [cards] = await pool.query('SELECT id, name, tier FROM cards WHERE name = ?', ['录取通知书']);
  console.log(cards);
  process.exit(0);
}

check();
