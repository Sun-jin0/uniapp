import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni()
  ],
  build: {
    // 确保生成正确的资源路径
    assetsInlineLimit: 0,
    // 启用代码压缩
    minify: true,
    // 确保 CSS 被正确提取
    cssCodeSplit: false
  },
  optimizeDeps: {
    include: ['@dcloudio/uni-app', '@dcloudio/uni-app-plus']
  },
  // App-Plus 打包配置
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
  // Sass 配置 - 使用现代 API
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  }
})
