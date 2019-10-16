const server = require('http').createServer();
const io = require('socket.io')(server);
const ChessBoard = require('./chessboard.js')
let currentUsers = {}
let maxUser = 0
let gameStatus = 0 //0: prepare  1: during
let readyPool = []
let chessBoard = null
let colors = ['white', 'red']
let curUser = null
io.on('connection', socket => {
  console.log('new connection>>>')
  socket.on('test', data => {
    console.log('test>>>>', data)
  })
  socket.on('login', data => {
    console.log('login>>>', data)
    const {username, userid} = data
    if(username && userid) {
      maxUser ++
      currentUsers[username] = userid
    } else if(currentUsers[username]) {
      socket.emit('login fail', '用户名已使用')
    } else {
      maxUser ++
      currentUsers[username] = maxUser
      socket.username = username
      socket.emit('login suc', {
        username: username,
        userid: currentUsers[username]
      })
      sendSystemMessage(`${username}进入房间`)
    }
  })
  socket.on('disconnect', () => {
    console.log('disconnect>>>>>>>')
    sendSystemMessage(`${socket.username}离开房间`)
    delete currentUsers[socket.username]
  })

  socket.on('ready', data => {
    const {username, xNum, yNum} = data
    if(readyPool.length < 2) {
      readyPool.push(username)
    } else {
      return
    }
    if(readyPool.length == 2) {
      curUser = Math.random() > 0.5 ? readyPool[0] : readyPool[1]
      socket.broadcast.emit('game start', {
        username,
        players:readyPool,
        curUser
      })
      gameStatus = 1
      chessBoard = new ChessBoard(xNum, yNum, ...readyPool)
      sendSystemMessage(`游戏开始，当前玩家：${readyPool}`)
    } else {
      socket.emit('ready suc', {
        username,
        userid: currentUsers[username]
      })
      sendSystemMessage(`${username}已经准备`)
    }
  })

  socket.on('cancel ready', username => {
    let index = readyPool.indexOf(username)
    if(index > -1) {
      readyPool.splice(index, 1)
      socket.emit('cancel suc', {
        username,
        userid: currentUsers[username]
      })
      sendSystemMessage(`${username}取消准备`)
    }
  })

  socket.on('put chess', data => {
    const {x, y, username} = data
    if(readyPool.indexOf(username) > -1) {
      if(chessBoard.putChess(x, y, currentUsers[username])) {
        socket.broadcast.emit('put chess', {
          x,
          y,
          username,
          userid: currentUsers[username],
          color: colors[readyPool.indexOf(username)]
        })
        if(chessBoard.isGameOver(x, y)) {
          socket.broadcast.emit('game over', {
            winnerId: currentUsers[username],
            winnerName: username
          })
          sendSystemMessage(`游戏结束，${winnerName}获胜！`)
          gameStatus = 2
          chessBoard = null
          readyPool = null
        }
      } else {
        socket.emit('put fail')
      }
    }
  })

  socket.on('new message', data => {
    const {message, username, userid} = data
    sendBroadcast(username, userid, message)
  })

  function sendSystemMessage(message) {
    sendBroadcast({
      username: '系统消息',
      userid: 9999,
      message
    })
  }

  function sendBroadcast(username, userid, message) {
    socket.broadcast.emit('new message', {
      username,
      userid,
      message
    })
  }
})
server.listen(3000)
console.log('server listening on port 3000')
