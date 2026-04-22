# 数学题目处理工具

## 文件说明

| 序号 | 文件名 | 功能说明 |
|-----|-------|---------|
| 01 | `01_fix_math_content.js` | 修复数学题目内容格式（$$、HTML标签、LaTeX格式等） |
| 02 | `02_update_question_types.js` | 自动判断并更新题目题型（选择题/填空题/解答题） |
| - | `run_all.js` | 批量执行脚本，按顺序运行上述两个脚本 |

## 执行方法

### 方法1：批量执行（推荐）
```bash
cd f:\Code\uniapp\demo\backend\scripts\math_tools
node run_all.js
```

### 方法2：单独执行
```bash
cd f:\Code\uniapp\demo\backend\scripts\math_tools

# 先执行内容修复
node 01_fix_math_content.js

# 再执行题型更新
node 02_update_question_types.js
```

## 处理内容说明

### 01_fix_math_content.js - 内容格式修复
修复以下问题：
- `$$` → `$ $`
- `<` → `< `
- `.$png` → `.png`
- `$,$$` → `$,$ $`
- `$.$$` → `$.$ $`
- `< span` → `<span`
- `< /span>` → `</span>`
- `< br>` → `<br>`
- `< b>` → `<b>`
- `< /b>` → `</b>`

### 02_update_question_types.js - 题型判断规则
按优先级判断：

1. **选择题**：同时包含 A、B、C、D 四个选项
2. **填空题**：不是选择题，且包含以下任一特征
   - `\underline{...}` 下划线
   - `（ ）` 括号
   - `___` 下划线占位符
3. **解答题**：以上都不是

## 数据库配置

脚本使用以下数据库配置：
- Host: `139.199.9.132`
- Database: `quizmaster`
- 涉及表：`math_questions`, `math_questiondetails`, `math_knowledgepoints`

## 注意事项

1. 执行前请确保数据库连接正常
2. 建议先备份数据库再执行
3. 脚本执行顺序很重要，先修复内容再更新题型
