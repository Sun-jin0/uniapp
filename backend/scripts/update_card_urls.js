const pool = require('../config/mysql');

const cardUrls = {
  '一战成硕卡': 'https://s3.hi168.com/hi168-26998-7111ilq6/uploads/1774971239300-j3xuh8.jpg',
  '上岸卡': 'https://s3.hi168.com/hi168-26998-7111ilq6/uploads/1774971242298-16hx9x.jpg',
  '加分卡': 'https://s3.hi168.com/hi168-26998-7111ilq6/uploads/1774971243406-g4gxe7.jpg',
  '录取通知书': 'https://s3.hi168.com/hi168-26998-7111ilq6/uploads/1774971244737-d8zhka.jpg',
  '抽卡': 'https://s3.hi168.com/hi168-26998-7111ilq6/uploads/1774971246056-gyumul.jpg',
  '逢考必过': 'https://s3.hi168.com/hi168-26998-7111ilq6/uploads/1774971247367-fuu9xt.jpg'
};

async function updateUrls() {
  console.log('开始更新数据库中的图片链接...\n');

  for (const [cardName, url] of Object.entries(cardUrls)) {
    try {
      await pool.query(
        'UPDATE cards SET image_url = ? WHERE name = ?',
        [url, cardName]
      );
      console.log(`✓ ${cardName}: ${url}`);
    } catch (error) {
      console.error(`✗ ${cardName}: ${error.message}`);
    }
  }

  console.log('\n数据库更新完成！');
  process.exit(0);
}

updateUrls();
