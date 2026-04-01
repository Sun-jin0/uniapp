const fs = require('fs');
const path = require('path');
const http = require('http');
const pool = require('../config/mysql');

const cardsDir = 'f:\\Code\\uniapp\\demo\\uni-preset-vue-vite-mp-weixin\\src\\static\\cards';

// 卡片名称映射
const cardFiles = {
  '一战成硕卡': '一战成硕卡.jpg',
  '上岸卡': '上岸卡.jpg',
  '加分卡': '加分卡.jpg',
  '录取通知书': '录取通知书.jpg',
  '抽卡': '抽卡.jpg',
  '逢考必过': '逢考必过.jpg'
};

// 上传单张图片
function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`文件不存在: ${filePath}`));
      return;
    }

    const imageBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileContent = imageBuffer.toString('binary');

    const postData = `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n` +
      fileContent + `\r\n` +
      `--${boundary}--\r\n`;

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload/image',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0 && result.data && result.data.url) {
            resolve(result.data.url);
          } else {
            reject(new Error(result.message || '上传失败'));
          }
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function uploadAllCards() {
  console.log('开始上传卡片图片...\n');

  for (const [cardName, fileName] of Object.entries(cardFiles)) {
    const filePath = path.join(cardsDir, fileName);
    
    try {
      console.log(`上传 ${cardName}...`);
      const url = await uploadImage(filePath);
      console.log(`  ✓ 上传成功: ${url}`);

      // 更新数据库
      await pool.query(
        'UPDATE cards SET image_url = ? WHERE name = ?',
        [url, cardName]
      );
      console.log(`  ✓ 数据库已更新\n`);
    } catch (error) {
      console.error(`  ✗ 失败: ${error.message}\n`);
    }
  }

  console.log('所有卡片上传完成！');
  process.exit(0);
}

uploadAllCards();
