# Git 操作指南

## 本地环境信息

- **Git 安装路径**: `D:\Downloads\Git`
- **项目路径**: `F:\Code\uniapp\demo`
- **GitHub 仓库**: `https://github.com/Sun-jin0/uniapp.git`

---

## 一、本地更新 GitHub（Windows）

### 1. 进入项目目录
```powershell
cd F:\Code\uniapp\demo
```

### 2. 查看当前状态
```powershell
D:\Downloads\Git\bin\git.exe status
```

### 3. 添加修改的文件到暂存区
```powershell
# 添加所有修改的文件
D:\Downloads\Git\bin\git.exe add .

# 或者添加指定文件
D:\Downloads\Git\bin\git.exe add backend/admin-panel/src/App.vue
D:\Downloads\Git\bin\git.exe add uni-preset-vue-vite/src/pages/index/index.vue
```

### 4. 提交更改
```powershell
D:\Downloads\Git\bin\git.exe commit -m '提交说明'
```

**常用提交说明格式**:
- `feat: 添加新功能`
- `fix: 修复bug`
- `docs: 更新文档`
- `style: 代码格式调整`
- `refactor: 代码重构`
- `chore: 其他修改`

### 5. 推送到 GitHub
```powershell
D:\Downloads\Git\bin\git.exe push origin main
```

### 6. 完整的更新流程（一键执行）
```powershell
cd F:\Code\uniapp\demo
D:\Downloads\Git\bin\git.exe add .
D:\Downloads\Git\bin\git.exe commit -m 'update: 更新内容'
D:\Downloads\Git\bin\git.exe push origin main
```

---

## 二、服务器拉取最新代码（Linux）

### 1. 进入项目目录
```bash
cd /www/wwwroot/uniapp
```

### 2. 拉取最新代码
```bash
git pull origin main
```

### 3. 如果本地有修改，先暂存再拉取
```bash
# 暂存本地修改
git stash

# 拉取最新代码
git pull origin main

# 恢复本地修改
git stash pop
```

### 4. 强制拉取（覆盖本地修改，慎用）
```bash
git fetch origin
git reset --hard origin/main
```

---

## 三、服务器更新后操作

### 1. 更新后端依赖（如有新增）
```bash
cd /www/wwwroot/uniapp/backend
npm install
```

### 2. 重启后端服务
```bash
# 如果使用 PM2
pm2 restart uniapp-backend

# 或者手动重启
pm2 stop uniapp-backend
pm2 start app.js --name "uniapp-backend"
```

### 3. 更新管理员后台（如修改了前端代码）
```bash
cd /www/wwwroot/uniapp/backend
npm run admin:build
```

### 4. 完整的更新流程（服务器端）
```bash
cd /www/wwwroot/uniapp
git pull origin main
cd backend
npm install
npm run admin:build
pm2 restart uniapp-backend
```

---

## 四、常见问题

### 1. 推送失败 - 权限不足
```bash
# 检查远程仓库地址
git remote -v

# 如果使用的是 HTTPS，需要输入用户名和密码（或 Token）
# 建议使用 Personal Access Token 代替密码
```

### 2. 拉取失败 - 本地有冲突
```bash
# 查看冲突文件
git status

# 放弃本地修改，使用远程版本
git checkout -- <文件名>

# 然后重新拉取
git pull origin main
```

### 3. 提交前查看修改内容
```powershell
D:\Downloads\Git\bin\git.exe diff
```

### 4. 查看提交历史
```powershell
D:\Downloads\Git\bin\git.exe log --oneline -10
```

---

## 五、快捷命令（可添加到环境变量）

### Windows 添加 Git 到环境变量
1. 右键"此电脑" → 属性 → 高级系统设置
2. 环境变量 → Path → 编辑
3. 添加: `D:\Downloads\Git\bin`
4. 确定保存

### 添加后可直接使用
```powershell
git status
git add .
git commit -m 'update'
git push origin main
```

---

## 六、WebHook 自动部署（进阶）

配置 WebHook 后，GitHub 推送代码时服务器自动更新：

### 1. 在 GitHub 仓库设置 WebHook
- URL: `http://你的服务器IP:3000/webhook`
- Content type: `application/json`
- Secret: 设置一个密钥

### 2. 服务器端配置 WebHook 服务
参考文档: `https://github.com/adnanh/webhook`

---

**最后更新**: 2026-02-27
