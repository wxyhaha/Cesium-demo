import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import './style.css'

declare global {
    interface Window {
        CESIUM_BASE_URL: string
    }
}

const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')
