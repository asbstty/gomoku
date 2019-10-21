const server = require('http').createServer();
const io = require('socket.io')(server);
const ChessBoard = require('./chessboard.js')
const appendLog = require('./writeLog.js')
const maxTime = 10 * 60 //一局游戏最多10分钟
let currentUsers = {}
let maxUser = 0
let gameStatus = 0 //0: prepare  1: during 2: gameover
let readyPool = []
let chessBoard = null
let colors = ['white', 'black']
let curUser = null
let gameInterval = null
let nextPlayer = null   //下一步轮到哪个用户下
let reconnectPool = {}
io.on('connection', socket => {
  console.log('connection>>>', currentUsers)
  socket.on('login', data => {
    console.log('login>>>', data)
    const {username, userid} = data
    if(currentUsers[username] && currentUsers[username] !== userid) {
      socket.emit('login fail', '用户名已使用')
    } else {
      maxUser ++
      currentUsers[username] = userid || maxUser
      socket.username = username
      if(gameStatus > 0) {
        socket.emit('login suc', {
          username,
          userid: currentUsers[username],
          currentboard: getCurrentBoard(),
          gameStatus,
          nextPlayer
        })
        if(reconnectPool.username) {
          clearTimeout(reconnectPool.username)
          delete reconnectPool.username
        }
      } else {
        socket.emit('login suc', {
          username: username,
          userid: currentUsers[username]
        })
      }
      sendSystemMessage(`${username}进入房间`)
      const leftUsers = getCurrentUsers()
      sendSystemMessage(`房间当前用户：${leftUsers}`)
      appendLog(`${username}进入房间`)
    }
  })
  socket.on('disconnect', () => {
    if(socket.username) {
      sendSystemMessage(`${socket.username}离开房间`)
      appendLog(`${socket.username}离开房间`)
      if(gameStatus == 1 && readyPool.indexOf(socket.username) > -1) {
        waitForReconnection(socket.username)
      } else {
        delete currentUsers[socket.username]
      }
      const leftUsers = getCurrentUsers()
      sendSystemMessage(`房间当前用户：${leftUsers}`)
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
        nextPlayer = {username,userid:currentUsers[username]}
        io.emit('put chess', {
          x,
          y,
          username,
          userid: currentUsers[username],
          color: colors[readyPool.indexOf(username)],
          nextPlayer
        })
        console.log(chessBoard.chess)
        if(chessBoard.isGameOver(x, y)) {
          setTimeout(() => {
            announceGameOver(username)
          }, 300)
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
    nextPlayer = null
    readyPool = []
    reconnectPool = {}
  }

  function getCurrentBoard() {
    const formatBoard = chessBoard.getFormatBoard()
    const result = formatBoard.map(item => {
      return item.map(innerItem => {
        return colors[readyPool.indexOf(innerItem)]
      })
    })
    return result
  }

  function getCurrentUsers() {
    return Object.keys(currentUsers).join(', ')
  }

  //等待用户重连
  function waitForReconnection(username) {
    let waitTime = 10
    reconnectPool.username = setTimeout(handleCountdown, 1000)
    function handleCountdown() {
      if(waitTime > 0) {
        sendSystemMessage(`等待用户${username}重连....${waitTime}`)
        waitTimeout --
        setTimeout(handleCountdown, 1000)
      } else {
        delete currentUsers[username]
        const leftIndex = readyPool.indexOf(username)
        const winnerName = readyPool[1 - leftIndex]
        announceGameOver(winnerName)
      }
    }
  }

  function announceGameOver(username) {
    io.emit('game over', {
      winnerId: currentUsers[username],
      winnerName: username
    })
    gameStatus = 2
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
