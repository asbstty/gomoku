const dirctEnum = {
  HORIZONTAL: 0,
  VERTICAL: 1,
  POSITIVE_DIAGONAL: 2,    //正对角线: '\'
  NEGTIVE_DIAGONAL: 3      //反对角线: '/'
}
class ChessBoard {
  constructor(x, y, player1, player2) {
    this.sept = 20;
    this.chess = [];  //棋子二维数组
    this.xNum = x;
    this.yNum = y;
    this.players = {
      [player1]: -1,
      [player2]: 1
    }
    this.initChess()
  }

  initChess() {
    this.chess = new Array(this.yNum).fill([]).map(item => {
      return new Array(this.xNum).fill(0)
    })
  }

  putChess(x, y, userid) {
    if(!this.chess[y][x]) {
      this.chess[y][x] = this.players[userid]
      return true
    }
    return false
  }

  isGameOver(x, y) {
    return this.judgeHorDirection(x, y) ||
           this.judgeVerDirection(x, y) ||
           this.judgeDiagDirection(x, y) ||
           this.judgeAntiDiagDirection(x, y)
  }

  //判断横向方向
  judgeHorDirection(x, y) {
    let startX = x - 4 >= 0 ? x - 4 : 0
    let endX = x + 4 <= this.xNum ? x + 4 : this.xNum
    let total = 0
    let totalStep = 0
    while(startX <= endX) {
      total += this.chess[y][startX]
      totalStep += 1
      if(Math.abs(total) != totalStep) {
        total = this.chess[y][startX]
        totalStep = Math.abs(total)
      } else if(Math.abs(total) === 5 && totalStep === 5) {
        return true
      }
      startX += 1
    }
    return false
  }

  //判断纵向方向
  judgeVerDirection(x, y) {
    let startY = y - 4 >= 0 ? y - 4 : 0
    let endY = y + 4 <= this.yNum ? y + 4: this.yNum
    let total = 0
    let totalStep = 0
    while(startY <= endY) {
      total += this.chess[startY][x]
      totalStep += 1
      if(Math.abs(total) != totalStep) {
        total = this.chess[startY][x]
        totalStep = Math.abs(total)
      } else if(Math.abs(total) === 5 && totalStep === 5) {
        return true
      }
      startY += 1
    }
    return false;
  }

  //判断正对角线方向'\'
  judgeDiagDirection(x, y) {
    let startX = x - 4 >= 0 ? x - 4 : 0
    let startY = y - 4 >= 0 ? y - 4 : 0
    let minDel = Math.min(x - startX, y - startY)
    startX = x - minDel
    startY = y - minDel
    let endX = x + 4 <= this.xNum ? x + 4 : this.xNum
    let endY = y + 4 <= this.yNum ? y + 4: this.yNum
    minDel = Math.min(endX - x, endY - y)
    endX = x + minDel
    endY = y + minDel
    let total = 0
    let totalStep = 0
    while(startX <= endX) {
      total += this.chess[startY][startX]
      totalStep += 1
      if(Math.abs(total) != totalStep) {
        total = this.chess[startY][startX]
        totalStep = Math.abs(total)
      } else if(Math.abs(total) === 5 && totalStep === 5) {
        return true
      }
      startX += 1
      startY += 1
    }
    return false;
  }

  //判断反对角线方向'/'
  judgeAntiDiagDirection(x, y) {
    let startX = x - 4 >= 0 ? x - 4 : 0
    let startY = y - 4 >= 0 ? y - 4 : 0
    let endX = x + 4 <= this.xNum ? x + 4 : this.xNum
    let endY = y + 4 <= this.yNum ? y + 4: this.yNum
    let minDel = Math.min(x - startX, endY - y)
    startX = x - minDel
    endY = y + minDel
    minDel = Math.min(endX - x, y - startY)
    endX = x + minDel
    startY = y - minDel
    console.log('startX:%d, startY:%d, endX:%d, endY:%d', startX, startY, endX, endY)
    let total = 0
    let totalStep = 0
    while(startX <= endX) {
      total += this.chess[endY][startX]
      totalStep += 1
      if(Math.abs(total) != totalStep) {
        total = this.chess[endY][startX]
        totalStep = Math.abs(total)
      } else if(Math.abs(total) === 5 && totalStep === 5) {
        return true
      }
      startX += 1
      endY -= 1
    }
    return false;
  }

  judge(startX, startY, endX, endY, type) {
    let total = 0
    let totalStep = 0
    let startPoint = {}
    let endPoint = {}
    switch(type) {
      case dirctEnum.HORIZONTAL:
      case dirctEnum.VERTICAL:
      case dirctEnum.POSITIVE_DIAGONAL:
        startPoint = {startX, startY}
        endPoint = {endX, endY}
        break;
      case dirctEnum.NEGTIVE_DIAGONAL:
        startPoint = {startX, endY}
        endPoint = {endX, startY}
        break;
    }
  }
}
module.exports = ChessBoard
