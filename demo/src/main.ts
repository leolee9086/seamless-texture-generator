import { createApp } from 'vue'
import 'virtual:uno.css'
import './style.css'
import App from './App.vue'
import Desktop from './Desktop.vue'

// 检测是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

// 根据设备类型加载对应的组件
const AppComponent = isMobile ? App : Desktop

import VueKonva from 'vue-konva'

const app = createApp(AppComponent)
app.use(VueKonva)
app.mount('#app')