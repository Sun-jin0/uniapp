<template>
  <view class="container">
    <view class="section">
      <text class="section-title">1. 基础 HTML 测试</text>
      <mp-html :content="basicHtml" :plugins="plugins" />
    </view>

    <view class="section">
      <text class="section-title">2. LaTeX 公式测试（行内）</text>
      <mp-html :content="latexInline" :plugins="plugins" />
    </view>

    <view class="section">
      <text class="section-title">3. LaTeX 公式测试（行间）</text>
      <mp-html :content="latexBlock" :plugins="plugins" />
    </view>

    <view class="section">
      <text class="section-title">4. 复杂 LaTeX 公式</text>
      <mp-html :content="complexLatex" :plugins="plugins" />
    </view>

    <view class="section">
      <text class="section-title">5. Markdown 风格内容</text>
      <mp-html :content="markdownContent" :plugins="plugins" />
    </view>

    <view class="section">
      <text class="section-title">6. 混合内容测试</text>
      <mp-html :content="mixedContent" :plugins="plugins" />
    </view>

    <view class="section">
      <text class="section-title">7. 原始 LaTeX 代码显示</text>
      <view class="raw-code">{{ rawLatexCode }}</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      plugins: ['latex', 'markdown', 'highlight'],
      
      basicHtml: '<p>这是一段<strong>加粗</strong>的文字，包含<em>斜体</em>和<u>下划线</u>。</p><p>列表测试：</p><ul><li>项目1</li><li>项目2</li><li>项目3</li></ul>',
      
      latexInline: '<p>爱因斯坦质能方程：$E=mc^2$ 是物理学中最著名的公式之一。</p><p>圆的面积公式：$S = \\pi r^2$，周长公式：$C = 2\\pi r$。</p>',
      
      latexBlock: '<p>以下是行间公式：</p><p>$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$</p><p>这是高斯积分的结果。</p>',
      
      complexLatex: '<p>分数：$\\frac{a+b}{c+d}$</p><p>根号：$\\sqrt{x^2+y^2}$</p><p>求和：$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$</p><p>矩阵：$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$</p><p>希腊字母：$\\alpha, \\beta, \\gamma, \\delta, \\epsilon, \\theta, \\lambda, \\pi, \\sigma, \\omega$</p>',
      
      markdownContent: '<h1>标题测试</h1><h2>二级标题</h2><h3>三级标题</h3><blockquote>这是一段引用文字</blockquote><pre><code class="language-javascript">function hello() { console.log(&quot;Hello World&quot;); }</code></pre><p>表格测试：</p><table><thead><tr><th>姓名</th><th>年龄</th><th>城市</th></tr></thead><tbody><tr><td>张三</td><td>25</td><td>北京</td></tr><tr><td>李四</td><td>30</td><td>上海</td></tr></tbody></table>',
      
      mixedContent: '<p>这是一道数学题：</p><p>已知函数 $f(x) = x^2 + 2x + 1$，求：</p><p>1. 函数的<strong>对称轴</strong>：$x = -1$</p><p>2. 函数的<strong>最小值</strong>：$f(-1) = 0$</p><p>解题过程：</p><p>$$f(x) = x^2 + 2x + 1 = (x+1)^2$$</p><p>由完全平方公式可知，当 $x = -1$ 时，函数取得最小值 $0$。</p>',
      
      rawLatexCode: '$E=mc^2$\n$\\int_{-\\infty}^{\\infty} e^{-x^2} dx$\n$\\frac{a+b}{c+d}$\n$\\sqrt{x^2+y^2}$'
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #eee;
}

.raw-code {
  background-color: #f8f8f8;
  padding: 20rpx;
  border-radius: 8rpx;
  font-family: monospace;
  font-size: 28rpx;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.hl-pre) {
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 24rpx;
  overflow-x: auto;
  margin: 16rpx 0;
  border: 1rpx solid #eee;
}

:deep(.hl-code) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
}

:deep(.hl-token.comment),
:deep(.hl-token.prolog),
:deep(.hl-token.doctype),
:deep(.hl-token.cdata) {
  color: #999;
  font-style: italic;
}

:deep(.hl-token.punctuation) {
  color: #666;
}

:deep(.hl-token.property),
:deep(.hl-token.tag),
:deep(.hl-token.boolean),
:deep(.hl-token.number),
:deep(.hl-token.constant),
:deep(.hl-token.symbol),
:deep(.hl-token.deleted) {
  color: #d73a49;
}

:deep(.hl-token.selector),
:deep(.hl-token.attr-name),
:deep(.hl-token.string),
:deep(.hl-token.char),
:deep(.hl-token.builtin),
:deep(.hl-token.inserted) {
  color: #22863a;
}

:deep(.hl-token.operator),
:deep(.hl-token.entity),
:deep(.hl-token.url) {
  color: #333;
}

:deep(.hl-token.atrule),
:deep(.hl-token.attr-value),
:deep(.hl-token.keyword) {
  color: #d73a49;
}

:deep(.hl-token.function),
:deep(.hl-token.class-name) {
  color: #6f42c1;
}

:deep(.hl-token.regex),
:deep(.hl-token.important),
:deep(.hl-token.variable) {
  color: #e36209;
}
</style>
