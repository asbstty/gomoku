const server = require('http').createServer();
const io = require('socket.io')(server);
const ChessBoard = require('./chessboard.js')
const maxTime = 10 * 60 //一局游戏最多10分钟
let currentUsers = {}
let maxUser = 0
let gameStatus = 0 //0: prepare  1: during
let readyPool = []
let chessBoard = null
let colors = ['white', 'red']
let curUser = null
let gameInterval = null
io.on('connection', socket => {
  console.log('connection>>>', currentUsers)
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
    if(socket.username) {
      sendSystemMessage(`${socket.username}离开房间`)
      delete currentUsers[socket.username]
      if(gameStatus == 1 && readyPool.indexOf(socket.username) > -1) {
        const leftIndex = readyPool.indexOf(socket.username)
        const winnerName = readyPool[1 - leftIndex]
        const winnerId = currentUsers[readyPool[1 - leftIndex]]
        announceGameOver(winnerName)
      }
    }
    console.log('disconnect>>>', currentUsers)
  })

  socket.on('ready', data => {
    console.log('ready>>>', data)
    const {username, xNum, yNum} = data
    if(readyPool.length < 2) {
      readyPool.push(username)
    } else {
      return
    }
    if(readyPool.length == 2) {
      curUser = Math.random() > 0.5 ? readyPool[0] : readyPool[1]
      io.emit('game start', {
        username,
        players:readyPool,
        curUser
      })
      //todo:添加倒计时
      //gameInterval = setInterval()
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
    console.log('put chess>>>', data)
    const {x, y, username} = data
    if(readyPool.indexOf(username) > -1) {
      if(chessBoard.putChess(x, y, username)) {
        io.emit('put chess', {
          x,
          y,
          username,
          userid: currentUsers[username],
          color: colors[readyPool.indexOf(username)]
        })
        console.log(chessBoard.chess)
        if(chessBoard.isGameOver(x, y)) {
          announceGameOver(username)
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

  function resetState() {
    gameStatus = 0
    chessBoard = null
    readyPool = []
  }

  function announceGameOver(username) {
    io.emit('game over', {
      winnerId: currentUsers[username],
      winnerName: username
    })
    sendSystemMessage(`游戏结束，${username}获胜！`)
    resetState()
  }

  function sendSystemMessage(message) {
    sendBroadcast(
      '系统消息',
      9999,
      message
    )
  }

  function sendBroadcast(username, userid, message) {
    console.log('send new message', message)
    io.emit('new message', {
      username,
      userid,
      message
    })
  }
})
server.listen(3000)
console.log('server listening on port 3000')
