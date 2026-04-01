const fs = require('fs');
const path = require('path');
const http = require('http');

const gifPath = 'f:\\Code\\uniapp\\demo\\抽卡\\E1307F46582722ED6DD9623F956E8EE0.gif';

// 上传GIF
function uploadGif(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`文件不存在: ${filePath}`));
      return;
    }

    const imageBuffer = fs.readFileSync(filePath);
    const fileName = 'draw-animation.gif';
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    // 构建multipart body
    const preBuffer = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n` +
      `Content-Type: image/gif\r\n\r\n`,
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
    req.write(body);
    req.end();
  });
}

async function upload() {
  console.log('上传抽卡动效GIF...\n');

  try {
    const url = await uploadGif(gifPath);
    console.log(`✓ 上传成功: ${url}\n`);

    // 保存URL到配置文件
    const configPath = path.join(__dirname, '../config/animation.json');
    const config = { drawAnimationUrl: url };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ 配置已保存到: ${configPath}`);
  } catch (error) {
    console.error(`✗ 失败: ${error.message}`);
  }

  process.exit(0);
}

upload();
