import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './utils/uni-adapter'
import Navigator from './components/Navigator.vue'
import View from './components/View.vue'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.component('navigator', Navigator)
app.component('view', View)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
