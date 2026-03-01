const http = require('http');

// 测试不带 token（应该返回未授权）
const testWithoutAuth = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/study/leaderboard?type=questions&period=all',
      method: 'GET'
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n=== 测试1: 不带Token ===');
        console.log('Response:', data);
        resolve();
      });
    });

    req.on('error', e => {
      console.error('Error:', e.message);
      resolve();
    });
    req.end();
  });
};

// 测试带无效 token
const testWithInvalidAuth = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/study/leaderboard?type=questions&period=all',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n=== 测试2: 带无效Token ===');
        console.log('Response:', data);
        resolve();
      });
    });

    req.on('error', e => {
      console.error('Error:', e.message);
      resolve();
    });
    req.end();
  });
};

// 测试 period=week
const testWeekPeriod = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/study/leaderboard?type=questions&period=week',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n=== 测试3: period=week ===');
        console.log('Response:', data);
        resolve();
      });
    });

    req.on('error', e => {
      console.error('Error:', e.message);
      resolve();
    });
    req.end();
  });
};

// 顺序执行测试
async function runTests() {
  await testWithoutAuth();
  await testWithInvalidAuth();
  await testWeekPeriod();
  console.log('\n=== 所有测试完成 ===');
}

runTests();
