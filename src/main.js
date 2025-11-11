import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth before mounting to ensure auth state is ready
// This ensures Firebase Auth persistence is restored before router guards run
const authStore = useAuthStore()
authStore.initAuth().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Error initializing auth:', error)
  // Mount anyway, auth will be handled by router guards
  app.mount('#app')
})

