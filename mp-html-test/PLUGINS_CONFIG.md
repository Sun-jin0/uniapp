# mp-html 插件配置指南

## 需要配置的文件

请打开您下载的 mp-html 源码目录：
`F:\Code\uniapp\mp-html-master\mp-html-master\tools\config.js`

## 修改插件配置

找到 `plugins` 数组，修改为：

```javascript
plugins: [
  'latex',
  'markdown'
],
```

## 重新构建组件

在 mp-html 源码目录下运行以下命令：

```bash
# 安装依赖
npm install

# 构建组件（会生成带插件的版本）
npm run build

# 或构建 uni-app 版本
npm run build:uni-app
```

## 替换项目中的组件

构建完成后，将生成的文件复制到您的项目中：

**方式 1：使用 uni-modules 方式（推荐）**

1. 在 HBuilderX 中，将构建后的文件复制到：
   `你的项目/uni_modules/mp-html/`

2. 在页面中直接使用：
```vue
<template>
  <view>
    <mp-html :content="html" :plugins="['latex', 'markdown']" />
  </view>
</template>
```

**方式 2：源码方式**

1. 将 `dist/uni-app` 目录下的内容复制到项目根目录
2. 在页面中使用：
```vue
<template>
  <view>
    <mp-html :content="html" :plugins="['latex', 'markdown']" />
  </view>
</template>

<script>
import mpHtml from '@/components/mp-html/mp-html'

export default {
  components: {
    mpHtml
  },
  data() {
    return {
      html: '<p>测试内容</p>'
    }
  }
}
</script>
```

## 测试内容示例

```vue
<template>
  <view>
    <!-- LaTeX 公式 -->
    <mp-html :content="latexContent" :plugins="['latex', 'markdown']" />
    
    <!-- Markdown 内容 -->
    <mp-html :content="markdownContent" :plugins="['latex', 'markdown']" />
  </view>
</template>

<script>
export default {
  data() {
    return {
      latexContent: `
        <p>行内公式：$E = mc^2$</p>
        <p>行间公式：</p>
        <p>$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$</p>
      `,
      
      markdownContent: `
        # 标题
        这是**加粗**文字和*斜体*文字
        
        ## 公式测试
        质能方程：$E = mc^2$
        
        ## 代码块
        \`\`\`javascript
        function hello() {
          console.log("Hello World");
        }
        \`\`\`
      `
    }
  }
}
</script>
```

## 注意事项

1. **必须在组件中指定 `plugins` 属性**，否则插件不会生效
2. LaTeX 公式使用 `$...$` 表示行内公式，`$$...$$` 表示行间公式
3. Markdown 内容会自动解析并渲染
4. 确保在微信开发者工具中点击"工具 - 构建 npm"
