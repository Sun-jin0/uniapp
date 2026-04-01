const fs = require('fs');
const path = require('path');
const http = require('http');

const consolationDir = 'f:\\Code\\uniapp\\demo\\普通奖池';

// 上传图片
function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`文件不存在: ${filePath}`));
      return;
    }

    const imageBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    // 构建multipart body
    const preBuffer = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`,
      'utf-8'
    );
    const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

    const body = Buffer.concat([preBuffer, imageBuffer, postBuffer]);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload/image',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0 && result.data && result.data.url) {
            resolve({ fileName, url: result.data.url });
          } else {
            reject(new Error(result.message || '上传失败'));
          }
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}

// 安慰奖描述
const consolationDescriptions = [
  '再接再厉，下次一定！',
  '运气正在积攒中...',
  '坚持就是胜利！',
  '每一次尝试都是进步',
  '好运即将到来',
  '继续努力，奖励在等你',
  '失败是成功之母',
  '保持信心，下次更好',
  '学习使我快乐',
  '今天的努力，明天的收获',
  '加油，你是最棒的！',
  '永不放弃，终会成功',
  '相信自己，你可以的',
  '每一步都算数',
  '成功就在不远处',
  '坚持学习，必有回报',
  '知识就是力量',
  '努力不会白费',
  '天道酬勤',
  '厚积薄发',
  '千里之行，始于足下',
  '积少成多，聚沙成塔'
];

async function uploadConsolationCards() {
  console.log('开始上传安慰奖卡牌图片...\n');

  try {
    // 读取目录中的所有图片
    const files = fs.readdirSync(consolationDir)
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .sort();

    console.log(`找到 ${files.length} 张图片\n`);

    const uploadedCards = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(consolationDir, file);
      
      console.log(`[${i + 1}/${files.length}] 上传 ${file}...`);
      
      try {
        const result = await uploadImage(filePath);
        
        // 生成卡牌数据
        const cardData = {
          name: `安慰奖 ${i + 1}`,
          description: consolationDescriptions[i % consolationDescriptions.length],
          image_url: result.url,
          rarity: 'common',
          tier: 'consolation',
          probability: 0.03, // 每张约3%概率
          is_reward: false,  // 非奖励卡牌，不加入卡池
          is_active: true
        };
        
        uploadedCards.push(cardData);
        console.log(`  ✓ 上传成功: ${result.url}`);
      } catch (error) {
        console.error(`  ✗ 上传失败: ${error.message}`);
      }
    }

    console.log(`\n✓ 共上传 ${uploadedCards.length} 张图片\n`);

    // 保存到SQL文件
    const sqlPath = path.join(__dirname, 'consolation_cards_data.sql');
    let sqlContent = '-- 安慰奖卡牌数据\n';
    sqlContent += `INSERT INTO cards (name, description, image_url, rarity, tier, probability, is_reward, is_active) VALUES\n`;
    
    const values = uploadedCards.map((card, index) => {
      return `  ('${card.name}', '${card.description}', '${card.image_url}', '${card.rarity}', '${card.tier}', ${card.probability}, ${card.is_reward}, ${card.is_active})${index < uploadedCards.length - 1 ? ',' : ';'}`;
    });
    
    sqlContent += values.join('\n');
    
    fs.writeFileSync(sqlPath, sqlContent);
    console.log(`✓ SQL数据已保存到: ${sqlPath}`);

    // 同时保存JSON配置
    const jsonPath = path.join(__dirname, 'consolation_cards.json');
    fs.writeFileSync(jsonPath, JSON.stringify(uploadedCards, null, 2));
    console.log(`✓ JSON配置已保存到: ${jsonPath}`);

    console.log('\n请执行以下SQL语句将卡牌插入数据库：');
    console.log(`mysql -u root -p exam_system < ${sqlPath}`);

  } catch (error) {
    console.error(`\n✗ 失败: ${error.message}`);
  }

  process.exit(0);
}

uploadConsolationCards();
