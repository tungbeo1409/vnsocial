// Event bus để mở chat widget từ bất kỳ đâu
const listeners = []

export const chatBus = {
  onOpenChat(callback) {
    listeners.push(callback)
  },
  
  offOpenChat(callback) {
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  },
  
  // openChat với option để không mark as read khi auto-open
  openChat(userId, options = {}) {
    listeners.forEach(callback => callback(userId, options))
  }
}

