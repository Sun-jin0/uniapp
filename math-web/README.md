# 数学刷题网页应用

独立的数学刷题网页应用，支持微信小程序跳转和自动登录。

## 功能特性

- ✅ 微信小程序一键跳转
- ✅ 自动登录（通过 token 参数）
- ✅ 用户名密码登录
- ✅ 书架管理
- ✅ 试卷列表（模考卷/真题圈）
- ✅ 科目切换
- ✅ 学习进度显示

## 技术栈

- Vue 3 + Vite
- Vue Router
- Element Plus
- Axios

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 访问地址

- 开发环境: http://localhost:5175
- 生产环境: 部署后访问对应域名

## 微信小程序跳转

在微信小程序中使用以下代码跳转到网页：

```javascript
// 方法1: 使用 web-view 组件
<navigator url="/pages/webview/index?url=https://yourdomain.com?token={{token}}" target="_blank">
  打开数学刷题
</navigator>

// 方法2: 使用 wx.navigateToMiniProgram
wx.navigateToMiniProgram({
  appId: 'your-web-app-id',
  path: 'pages/index/index?token=' + token,
  success(res) {
    console.log('跳转成功')
  }
})

// 方法3: 使用 web-view 组件（推荐）
<web-view src="https://yourdomain.com?token={{token}}"></web-view>
```

## Token 传递方式

网页应用支持通过 URL 参数传递 token 进行自动登录：

```
https://yourdomain.com/?token=your_wechat_token
```

网页会自动：
1. 从 URL 中获取 token
2. 调用后端 `/api/user/wechat-login` 接口
3. 保存登录信息到 localStorage
4. 跳转到书架页面

## API 代理配置

开发环境通过 Vite 代理请求到后端：

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

## 页面结构

- `/` - 登录页
- `/bookshelf` - 书架
- `/practice` - 试卷列表
- `/book/:bookId` - 试卷详情
- `/question/:questionId` - 题目详情
- `/smart-paper` - 智能组卷
- `/my-papers` - 我的组卷
- `/favorites` - 我的收藏

## 注意事项

1. 确保后端服务运行在 `http://localhost:3000`
2. 微信小程序需要配置业务域名白名单
3. 生产环境需要配置 HTTPS 和正确的域名
