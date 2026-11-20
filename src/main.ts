import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initLocale } from './i18n'
import './assets/styles/main.css'

initLocale()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
