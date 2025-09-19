import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import views
import VideoGenerator from './views/VideoGenerator.vue'

// Router configuration
const routes = [
  { path: '/', name: 'VideoGenerator', component: VideoGenerator }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create app
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
