class Chat {
  constructor(userid) {
    this.userid = userid
    this.sendBox = document.querySelector('.send-area')
    this.msgBox = document.querySelector('.message-area')
  }

  addMessage(username, userid, message) {
    const newChatItem = document.createElement('div')
    const nameClass = userid == 9999 ? 'chat-name-system' : userid == this.userid ? 'chat-name-mine':'chat-name-other'
    newChatItem.innerHTML = `<span class=${nameClass}>${username}：</span>${message}`
    if(userid == this.userid) {
      newChatItem.className='item-chat chat-mine'
    } else {
      newChatItem.className='item-chat chat-other'
    }
    this.msgBox.appendChild(newChatItem)
  }

  sendMessage(message) {
    if(this.sendBox.value.trim()) {
      this.sendBox.value = ''
    }
  }

  clearMessage() {
    this.sendBox.value = ''
    this.msgBox.innerHTML = ''
  }
}
