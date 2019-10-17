class Drawer {
  constructor() {
    this.cvs = document.getElementById('myCanvas')
    this.ctx = this.cvs.getContext('2d')
    this.sept = 20
    this.ctx.fillStyle='black';
    this.xNum = 1;
    this.yNum = 1;
    this.curX = 20;
    this.curY = 20
  }

  //画棋盘
  initChessBoard() {
    while(this.curY + this.sept < 600) {
      this.yNum ++;
      this.curY += this.sept;
    }
    while(this.curX + this.sept < 900) {
      this.xNum ++;
      this.curX += this.sept;
    }
    //画横线
    for(let i = 1 ; i <= this.yNum; i++) {
      this.ctx.moveTo(this.sept, i * this.sept);
      this.ctx.lineTo(this.curX, i * this.sept);
      this.ctx.stroke();
    }
    //画竖线
    for(let i = 1; i <= this.xNum; i++) {
      this.ctx.moveTo(i * this.sept, this.sept);
      this.ctx.lineTo(i * this.sept, this.curY);
      this.ctx.stroke();
    }
  }

  //画棋子
  drawChess(x, y, color) {
    const realX = (x + 1) * this.sept
    const realY = (y + 1) * this.sept
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    const radius = 5
    this.ctx.arc(realX, realY, radius, 0, 2 * Math.PI)
    this.ctx.fill()
  }

  //清空棋子
  clearChess() {
    this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)
    this.initChessBoard()
  }
}
