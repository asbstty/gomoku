const server = require('http').createServer();
const io = require('socket.io')(server);
const ObjectId = require('mongodb').ObjectId
const ChessBoard = require('./chessboard.js')
const appendLog = require('./writeLog.js')
const {saveUser, queryUser} = require('./user')
const maxTime = 10 * 60 //一局游戏最多10分钟
let currentUsers = {}
let gameStatus = 0 //0: prepare  1: during 2: gameover
let readyPool = []
let chessBoard = null
let colors = ['white', 'black']
let curUser = null
let gameInterval = null
let nextPlayer = null   //下一步轮到哪个用户下
let reconnectPool = {}
let currentVcode = '2.0'
io.on('connection', socket => {
  console.log('connection>>>', currentUsers)
  socket.on('login', async data => {
    const {username, userid, v_code} = data
    console.log('>>>>>>',username, userid, v_code)
    if(username || username && userid && v_code) {
      const queryObj = {}
      if(userid) {
        queryObj._id = ObjectId(userid)
      }
      if(username) {
        queryObj.name = username
      }
      const queryResult = await queryUser(queryObj)
      let loginResult = {}
      if(queryResult.length > 0) {
        if(!userid) {
          socket.emit('login fail', '用户名已存在')
          return 
        }
      } else {
        loginResult = await saveUser(username)
      }
      socket.username = username
      if(gameStatus > 0) {
        socket.emit('login suc', {
          username,
          userid: loginResult._id ? loginResult._id.toString() : userid,
          v_code: currentVcode,
          currentboard: getCurrentBoard(),
          gameStatus,
          nextPlayer
        })
        io.emit('nextPlayer', {
          nextPlayer,
          gameStatus
        })
        if(reconnectPool.username) {
          clearTimeout(reconnectPool.username)
          delete reconnectPool.username
        }
      } else {
        socket.emit('login suc', {
          username: username,
          v_code: currentVcode,
          userid: loginResult._id ? loginResult._id.toString() : userid
        })
      }
      currentUsers[username] = loginResult._id ? loginResult._id.toString() : userid
      sendSystemMessage(`${username}进入房间`)
      const leftUsers = getCurrentUsers()
      sendSystemMessage(`房间当前用户：${leftUsers}`)
      appendLog(`${username}进入房间`)
    } else {
      socket.emit('login fail', '登录失败')
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
        const idx = readyPool.indexOf(username)
        const nextName = readyPool[1 - idx]
        nextPlayer = {nextName,userid:currentUsers[nextName]}
        console.log('nextPlayer>>>>>', nextPlayer)
        io.emit('put chess', {
          x,
          y,
          nextName,
          userid: currentUsers[nextName],
          color: colors[1 - readyPool.indexOf(nextName)],
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
        waitTime --
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
