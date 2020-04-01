//環境變數
let updateFPS = 30
let showMouse = true
let time = 0
const bgColor = "black"
const redColor = "#ed1c24"
//GUI控制項
// const controls = {
//   value: 0,
// }
// const gui = new dat.GUI()
// gui.add(controls,"value",-2,2).step(0.01).onChange(function(value){})

//預設PI不給定值=1倍的PI
let PI = n => n==undefined ? Math.PI : Math.PI * n

//***************************
//2維向量 Vec2
class Vec2 {
  constructor(x,y) {
    this.x = x
    this.y = y
  }
  //設定
  set(x,y) {
    this.x = x
    this.y = y
  }
  //移動
  move(x,y) {
    this.x += x
    this.y += y
  }
  //相加
  add(v){
    return new Vec2(this.x + v.x,this.y + v.y)
  }
  //相減
  sub(v){
    return new Vec2(this.x - v.x,this.y - v.y)
  }
  //縮放
  mul(s){
    return new Vec2(this.x * s,this.y * s)
  }
  //向量相等判斷
  equal(v){
    return this.x == v.x && this.y == v.y
  }
  //複製
  clone() {
    return new Vec2(this.x,this.y)
  }
  //計算屬性
  get length(){
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  //設定新長度
  set length(nv){
    let temp = this.unit.mul(nv)
    this.set(temp.x,temp.y)
  }
  //角度計算
  get angle(){
    return Math.atan2(this.y,this.x)
  }
  //單位向量計算
  get unit(){
    return this.mul(1/this.length)
  }
  static get ZERO() {
    return new Vec2(0,0)
  }
  static get UP() {
    return new Vec2(0,-1)
  }
  static get DOWN() {
    return new Vec2(0,1)
  }
  static get LEFT() {
    return new Vec2(-1,0)
  }
  static get RIGHT() {
    return new Vec2(1,0)
  }
  //防止大小寫
  static DIR(str) {
    //判斷不給值就指定ZERO
    if(!str) {
      return Vec2.ZERO
    }
    //強制轉換字串後進行大寫轉換
    let type = ("" + str).toUpperCase()
    return Vec2[type]
  }
  //方向-角度對應 不使用break(執行就停止)
  static DIR_ANGLE(str) {
    switch(str) {
      case "right":
        return 0
      case "left":
        return PI()
      case "up":
        return PI(-0.5)
      case "down":
        return PI(0.5)
    }
    return 0
  }
  //字串轉換
  toString(){
    return `(${this.x}, ${this.y})`
  }
}
//*******

const canvas = document.getElementById("myCanvas")
const ctx = canvas.getContext("2d")
//繪製物件
ctx.circle = function(v,r) {
  this.arc(v.x,v.y,r,0,Math.PI*2)
  this.fill()
}
ctx.line = function(v1,v2) {
  this.moveTo(v1.x,v1.y)
  this.lineTo(v2.x,v2.y)
}
//建立可共用向量物件
let getVec2 = (args) => {
  if(args.length==1) {
    return args[0]
  } else if (args.length==2) {
    return new Vec2(args[0],args[1])
  }
}

let moveTo = function() {
  let v = getVec2(arguments)
  ctx.moveTo(v.x,v.y)
}
let lineTo = function() {
  let v = getVec2(arguments)
  ctx.lineTo(v.x,v.y)
}
let translate = function() {
  let v = getVec2(arguments)
  ctx.translate(v.x,v.y)
}
let arc = function() {
  ctx.arc.apply(ctx,arguments)
}
let rotate = (angle) => {
  if(angle!=0) {
    ctx.rotate(angle)
  }
}
let beginPath = () => {ctx.beginPath()}
let closePath = () => {ctx.closePath()}

//顏色填充
let setFill = (color) => {ctx.fillStyle=color}
let setStroke = (color) => {ctx.strokeStyle=color}

let fill = (color) => {
  if(color) { setFill(color) }
  ctx.fill()
}
let stroke = (color) => {
  if(color) { setStroke(color) }
  ctx.stroke()
}
//座標轉移
let save = (func) => {
  ctx.save()
  func()
  ctx.restore()
}

//Canvas初始設定
function initCanvas() {
  ww = canvas.width = window.innerWidth
  wh = canvas.height = window.innerHeight
}
initCanvas()

//20*20格子大小計算 除以20~25數值 確保在畫面寬度內
let WSPAN = Math.min(ww,wh)/24
function GETPOS() {
  let sourceV = getVec2(arguments)
  //將繪製座標移動到格子中心
  return sourceV.mul(WSPAN).add(new Vec2(WSPAN/2,WSPAN/2))
}

//建立角色物件
class GameObject {
  constructor(args) {
    let def = {
      p: Vec2.ZERO,
      gridP: Vec2.ZERO //格點座標
    }
    Object.assign(def,args)
    Object.assign(this,def)
    //位置座標與格點座標設定為同步
    this.p = GETPOS(this.gridP)
  }
  //物件碰撞
  collide(gobj) {
    //偵測兩個物件向量長度是否小於一格大小
    //小於=true有碰撞 大於=false沒碰撞
    return this.p.sub(gobj.p).length < WSPAN
  }
}

//建立食物物件
class Food extends GameObject {
  constructor(args) {
    super(args) //呼叫GameObject的建構子
    let def = {
      eaten: false, //預設沒有被吃掉
      super: false //不是超級食物
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  draw() {
    if(!this.eaten) {
      save(() => {
        translate(this.p)
        setFill("#ffed89")
        //繪製超級食物
        if(this.super) {
          //取餘數 <5才進行繪製 製造閃爍效果
          if(time%20 < 5) {
            beginPath()
            arc(0,0,WSPAN/5,0,PI(2))
            fill("#afffba")
          }
        } else {
          //繪製一般食物
          let r = WSPAN/10
          //偏移一半自己的大小繪製在中央 
          ctx.fillRect(-r,-r,r*2,r*2)
        }
      })
    }
  }
}

//建立玩家物件 繼承GameObject
class Player extends GameObject {
  constructor(args) {
    super(args) //呼叫GameObject的建構子
    let def = {
      nextDirection: null, //下一個方向
      currentDirection: null, //目前方向
      isMoving: false, //移動狀態
      speed: 30 //移動速度
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  //繪製暫存圖像 執行時會覆蓋
  draw() {
    beginPath()
    circle(this.p,5)
    fill("#fff")
  }
  //取得玩家移動角度
  get directionAngle() {
    return Vec2.DIR_ANGLE(this.currentDirection)
  }
  //移動
  moveStep() {
    //指定現在位置座標
    let i0 = this.gridP.x,
        o0 = this.gridP.y
    //紀錄舊位置座標=目前座標
    let oldDirection = this.currentDirection
    //判斷是否有牆(取得地圖牆面座標)
    let haveWall = map.getWalls(this.gridP.x,this.gridP.y)
    //建立可前進方向
    let avail = ["up","down","left","right"]
                //判斷前進方向是否有牆 留下可行進方向(true)
                .filter(d => !haveWall[d])
    //判斷下一個行進方向&正在行進方向如果沒有牆
    if(!haveWall[this.nextDirection] && this.nextDirection) {
      //目前方向就等於玩家指定的下一個方向
      this.currentDirection = this.nextDirection
    }
    //將現在格點座標加上移動方向的向量位置
    this.gridP = this.gridP.add(Vec2.DIR(this.currentDirection))
    //判斷前方是否為牆
    let isWall = map.isWall(this.gridP.x,this.gridP.y)
    //如果不是牆
    if(!isWall) {
      this.isMoving = true //執行移動
      let moveStepTime = 10/this.speed //移動時間10秒/遊戲速度
      //偵測移動到左邊地圖邊界 & 往左前進
      if(this.gridP.x <= -1 && this.currentDirection=="left") {
        this.gridP.x = 18 //重置座標至最右側
        moveStepTime = 0 //取消動畫緩衝時間
      }
      //偵測移動到右邊地圖邊界 & 往右前進
      if(this.gridP.x >= 19 && this.currentDirection=="right") {
        this.gridP.x = 0 //重置座標
        moveStepTime = 0 //取消動畫緩衝時間
      }
      TweenMax.to(this.p,moveStepTime,{
        //展開運算符(將座標x,y展開至物件中)
        ...GETPOS(this.gridP),
        ease: Linear.easeNone,
        //使用箭頭函數才能存取到外部物件
        onComplete: () => {
          //取消移動
          this.isMoving = false
          //重置移動
          this.moveStep()
        }
      })
    } else {
      //重設座標
      this.gridP.set(i0,o0)
      //目前行進方向就等於上一個行進方向
      this.currentDirection = oldDirection
    }
  }
}

//建立小精靈物件 繼承Player
class Pacman extends Player {
  constructor(args) {
    super(args) //呼叫Player GameObject的建構子
    let def = {
      r: WSPAN/2, //半徑:格子寬度一半
      deg: Math.PI/4, //嘴巴張開角度 正45 負45
      isDead: false, //死亡狀態
      deadDeg: 0 //死掉後轉化角度
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  draw() {
    //嘴巴角度
    let useDeg = PI(0.25)
    useDeg = this.deg //增加變數進行嘴巴開闔操作
    if(this.isDead) {
      useDeg = this.deadDeg
    }
    save(() => {
      translate(this.p)
      rotate(this.directionAngle)
      moveTo(Vec2.ZERO)
      rotate(useDeg) //旋轉到嘴巴張開下角度
      lineTo(this.r,0)
      //畫360度圓減掉嘴巴上下張開角度(*2)
      arc(0,0,this.r,0,PI(2) - useDeg * 2)
      closePath()
      fill("#FFE43B")
    })
  }
  die() {
    //如果是否在存活狀態
    if(!this.isDead) {
      this.isDead = true //如果死亡
      TweenMax.killAll() //移除所有動畫
      this.deadDeg = 0
      TweenMax.to(this,1.5,{
        deadDeg: PI(),
        ease: Linear.easeNone,
        delay: 1
      })
    }
  }
}

//建立鬼物件 繼承Player
class Ghost extends Player {
  constructor(args) {
    super(args) //呼叫Player GameObject的建構子
    let def = {
      r: WSPAN/2,
      color: "#f54d27", //預設顏色
      isEatable: false, //預設不可被吃
      isDead: false, //預設未死亡
      isEatableCounter: 0, //可被吃的持續時間
      //判斷對象方位 改變前進方向
      traceGoCondition: [
        //傳進目標位置
        {
          name: "left",condition: (target) => (this.gridP.x > target.x)
        },{
          name: "right",condition: (target) => (this.gridP.x < target.x)
        },{
          name: "up",condition: (target) => (this.gridP.y > target.y)
        },{
          name: "down",condition: (target) => (this.gridP.y < target.y)
        }
      ]
    }
    Object.assign(def,args)
    Object.assign(this,def)
  }
  draw() {
    save(() => {
      translate(this.p)
      if(!this.isDead) {
        //繪製上半圓
        beginPath()
        arc(0,0,this.r,PI(),0) //半圓形
        //繪製身體直線
        lineTo(this.r,this.r)
        //定義移動(3個鋸齒 012=0 345=1)
        let tt = parseInt(time/3)
        //定義鋸齒寬度:身體寬度(半徑*2)/7(3鋸齒共7個點)
        let ttSpan = this.r * 2/7
        //定義鋸齒高度:身體高度的3分之1
        let ttHeight = this.r/3

        //繪製下半身鋸齒狀
        for(let i = 0; i < 7; i++) {
          //X:較身體略縮(*0.9)減掉每段差距的寬(*i)
          //Y:i取2的餘數-1(由起點0開始繪製)*高度+身體半徑
          //i+tt%2(0or1) 隨時間改變繪製順序高低
          lineTo(this.r * 0.9 - ttSpan * i,((i + tt)%2 - 1) * ttHeight + this.r)
        }
        lineTo(-this.r,this.r)
        closePath()
        //可吃狀態倒數3秒 轉換閃爍顏色
        let eatableColor = (this.isEatableCounter > 3 || (time%10<3)) ? "#0c7fcc":"rgba(255,255,255,0.8)"
        //如果狀態為不可吃才維持動態填色 可吃改為單色
        fill(!this.isEatable ? this.color:eatableColor)
      }

      //設定眼睛繪製狀態變化
      let hasEye = !this.isEatable || this.isDead
      //定義眼睛大小
      let eyeR = this.r/3
      //定義眼球大小(眼睛的一半)
      let innerEyeR = eyeR/2
      //繪製眼睛 不可吃:繪製 可吃:不繪製
      if(hasEye) {
        beginPath()
        arc(-this.r/2.5,-eyeR,eyeR,0,PI(2))
        arc(this.r/2.5,-eyeR,eyeR,0,PI(2))
        fill("#fff")
      }
      //繪製眼球
      save(() => {
        //設定眼球隨移動方向偏移(座標乘上眼球大小)
        let innerEyePan = Vec2.DIR(this.currentDirection).mul(innerEyeR)
        translate(innerEyePan)
        
        beginPath()
        arc(-this.r/2.5,-eyeR,innerEyeR,0,PI(2))
        arc(this.r/2.5,-eyeR,innerEyeR,0,PI(2))
        fill(hasEye ? "#222":"#eee")
      })     
    })
  }
  //加上可被吃時間倒數
  setEatable(t) {
    this.isEatableCounter = t
    //判斷如果不是可被吃的狀態
    if(!this.isEatable) {
      this.isEatable = true //設為可被吃的狀態
      let func = (() => {
        //console.log(this.isEatableCounter)
        this.isEatableCounter--
        //如果計時小於等於0
        if(this.isEatableCounter<=0) {
          this.isEatable = false //取消可被吃的狀態
        } else {
          setTimeout(func,1000) //每秒執行1次func(-1)
        }
      })
      func()
    }
  }
  //更新狀態
  update() {
    //讓鬼移動略慢
    this.speed = 32
    //可被吃狀態: 移動減緩
    if(this.isEatable) { this.speed = 25 }
    //死亡狀態: 移動加速
    if(this.isDead) { this.speed = 80 }
    //檢查鬼死亡&是否回到鬼巢
    if(this.isDead && this.gridP.equal(new Vec2(9,9))) {
      this.reLive() //執行復活
    }
    //console.log(this.speed)
  }
  //取得地圖&小精靈位置做判斷
  getNextDirection(map,pacman) {
    //設定目標的方向 如果死掉就回鬼巢 不然就追著目標
    let currentTarget = this.isDead ? (new Vec2(9,9)):pacman.gridP
    //狀態:不可吃&非死亡 才朝目標方向前進
    let go = (!this.isEatable) || this.isDead
    //抓出鬼要行進的方向
    let traceGo = this.traceGoCondition.filter(obj => {
      //取得目標方向進行判斷
      let cond = obj.condition(currentTarget)
      return go ? cond:!cond //判斷是否要接近
    }).map(obj => obj.name) //轉換為方向的陣列
    //取得所有牆面位置
    let haveWall = map.getWalls(this.gridP.x,this.gridP.y)
    //判斷可前進的方向(留下沒有牆的方向) & 前進方向與要走的方向沒有互相抵銷
    let traceGoAndCanGo = traceGo
        .filter(d => !haveWall[d])
        .filter(d => Vec2.DIR(d).add(Vec2.DIR(this.currentDirection)).length!=0)
    //找到(過濾)現在可走的方向
    let availGo = ["up","down","left","right"].filter(d => !haveWall[d])
    //當移動方向只有2個 上&下 or 左&右 就維持目前方向
    if(availGo.length==2) {
      if((haveWall.up && haveWall.down) || (haveWall.left && haveWall.right)) {
        return this.currentDirection
      }
    }
    //設定要走的方向or目前可走的方向
    let finalPossibleSets = traceGoAndCanGo.length ? traceGoAndCanGo:availGo
    //隨機執行兩個走法or往上走
    let finalDecision = finalPossibleSets[parseInt(Math.random() * finalPossibleSets.length)] || "top"
    
    return finalDecision
  }
  die() {
    this.isDead = true
  }
  reLive() {
    this.isDead = false
    this.isEatable = false
  }
}

//建立地圖
class Map {
  constructor() {
    this.mapData = [
      "ooooooooooooooooooo",
      "o        o        o",
      "o oo ooo o ooo oo o",
      "o+               +o",
      "o oo o ooooo o oo o",
      "o    o   o   o    o", 
      "oooo ooo o ooo oooo",
      "xxxo o       o oxxx",
      "oooo o oo+oo o oooo", 
      "       oxxxo       ",
      "oooo o ooooo o oooo",
      "xxxo o   x   o oxxx",
      "oooo ooo o ooo oooo",
      "o    o   o   o    o",
      "o oo o ooooo o oo o",
      "o+               +o",
      "o oo ooo o ooo oo o",
      "o        o        o",
      "ooooooooooooooooooo",
    ]
    this.init()
  }
  init() {
    //建立角色:小精靈
    this.pacman = new Pacman({
      gridP: new Vec2(9,11) //指定產生位置
    })
    //建立角色:鬼--4隻
    this.ghosts = []
    for(let i = 0; i < 4; i++) {
      this.ghosts.push(new Ghost({
        gridP: new Vec2(9 + i%3 - 1,9), //動態產生位置
        //第i隻鬼就套用第i個色票
        color: ["#f54d27","#e7a4e4","#ffba5a","#52de97"][i]
      }))
    }
    //小精靈嘴巴開闔動畫
    TweenMax.to(this.pacman,0.2,{
      deg: 0,ease: Linear.easeNone,repeat: -1,yoyo: true
    })
    //建立食物空陣列
    this.foods = []
    //檢查地圖20格上的值
    for(let i = 0; i < 20; i++) {
      for(let o = 0; o < 20; o++) {
        let foodType = this.isFood(i,o)
        if(foodType) {
          let food = new Food({
            gridP: new Vec2(i,o),
            super: foodType.super
          })
          //將產生的食物推入陣列
          this.foods.push(food)
        }
      }
    }
  }
  //檢查是否有食物
  isFood(i,o) {
    let type = this.getWallContent(i,o)
    if(type=="+" || type==" ") {
      return {
        super: type=="+" //符號+:判斷為超級食物
      }
    }
    return false
  }
  
  draw() {
    //繪製20*20的格子
    for(let i = 0; i < 19; i++) {
      for(let o = 0; o < 19; o++) {
        save(() => {
          translate(GETPOS(i,o))
          //繪製地圖對照用格線
          // setStroke("#333")
          // ctx.strokeRect(-WSPAN/2,-WSPAN/2,WSPAN,WSPAN)
          
          //取得牆面種類
          let wallType = this.getWalls(i,o)
          setStroke("rgb(20,100,245)")
          ctx.lineWidth = WSPAN/5
          ctx.shadowColor = "rgb(40,120,255)"
          ctx.shadowBlur = 25
          
          //判斷四面是否有牆 d=方向 true=1 false=0
          let typeCode = ["up","down","left","right"]
              .map(d => wallType[d] ? 1:0).join("")
          //清除格子承襲問題 如果不是牆=空字串
          if(wallType.none) { typeCode = "" }
          setFill("#ddd")
          //ctx.fillText(typeCode,0,0) //繪製觀察使用
          //利用正則搜索值=1 g=全部搜索 沒有1使用空字串[]
          let countSide = (typeCode.match(/1/g) || []).length
          
          //牆的間隙
          let wallSpan = WSPAN/4.5
          //一半的牆(格子的一半)
          let wallLen = WSPAN/2
          
          //牆面繪製
          if(typeCode=="1100" || typeCode=="0011") {
            //橫向牆面轉90度
            save(() => {
              if(typeCode=="0011") {
                rotate(PI(0.5))
              }
              //直向牆面
              beginPath()
              moveTo(wallSpan,-wallLen)
              lineTo(wallSpan,wallLen)
              moveTo(-wallSpan,-wallLen)
              lineTo(-wallSpan,wallLen)
              stroke()
            })
          } else if(countSide==2) {
            let angles = {
              //PI的旋轉角度
              "1010": 0, //上面 左邊 有牆
              "1001": 0.5, //上面 右邊 有牆
              "0101": 1, //下面 右邊 有牆
              "0110": -0.5, //下面 左邊 有牆
            }
            save(() => {
              //附予旋轉角度
              rotate(PI(angles[typeCode]))
              //繪製轉彎牆面
              beginPath()
              //格子一半的寬度 繪製90度圓弧
              arc(-wallLen,-wallLen,wallLen+wallSpan,0,PI(0.5))
              stroke()
              beginPath()
              //格子四分之ㄧ的寬度 繪製90度內圓弧
              arc(-wallLen,-wallLen,wallLen-wallSpan,0,PI(0.5))
              stroke()
            })
          }
          //判斷只有一面有牆
          if(countSide==1) {
            let angles = {
              //PI的旋轉角度
              "1000": 0, //上面有牆
              "0001": 0.5, //右邊有牆
              "0100": 1, //下面有牆
              "0010": -0.5, //左邊有牆
            }
            save(() => {
              rotate(PI(angles[typeCode]))
              //繪製U型牆
              beginPath()
              arc(0,0,wallSpan,0,PI())
              stroke()
              //U型直向長度
              beginPath()
              moveTo(wallSpan,-wallLen)
              lineTo(wallSpan,0)
              moveTo(-wallSpan,-wallLen)
              lineTo(-wallSpan,0)
              stroke()
            })
          }
          //梯形牆(左右圓弧 上or下直線)
          if(countSide==3) {
            let angles = {
              //PI的旋轉角度
              "1011": 0, //上左右有牆
              "1101": 0.5, //上右下有牆
              "0111": 1, //下左右有牆
              "1110": -0.5, //上左下有牆
            }
            save(() => {
              rotate(PI(angles[typeCode]))
              beginPath()
              //格子四分之ㄧ的寬度 繪製90度內圓弧
              arc(-wallLen,-wallLen,wallLen-wallSpan,0,PI(0.5))
              stroke()
              
              beginPath()
              //格子四分之ㄧ的寬度 繪製90度內圓弧
              arc(wallLen,-wallLen,wallLen-wallSpan,PI(0.5),PI(1))
              stroke()
              
              beginPath()
              moveTo(-wallLen,wallSpan)
              lineTo(wallLen,wallSpan)
              stroke()
            })
          }
        })
      }
    }
  }
  //取得地圖的狀態 i陣列取值會對應到y 所以反轉取值
  getWallContent(o,i) {
    //如果列存在 才往後取值
    return this.mapData[i] &&　this.mapData[i][o]
  }
  //判斷是否為牆
  isWall(i,o) {
    let type = this.getWallContent(i,o)
    //狀態o=牆
    return type == "o"
  }
  //取得所有牆資料
  getWalls(i,o) {
    return {
      up: this.isWall(i,o-1),
      down: this.isWall(i,o+1),
      left: this.isWall(i-1,o),
      right: this.isWall(i+1,o),
      none: !this.isWall(i,o) //判斷本身有沒有值(牆) 有值=false
    }
  }
}

let map
//邏輯初始化
function init() {
  map = new Map()
}
//邏輯更新
function update() {
  time++
  //更新鬼的移動
  map.ghosts.forEach(ghost => {
    ghost.update() //先執行狀態判斷
    //加上AI走法判斷
    ghost.nextDirection = ghost.getNextDirection(map,map.pacman)
      //隨機給鬼移動方向
      //["up","down","left","right"][parseInt(Math.random() * 4)]
    //判斷鬼是否沒有移動
    if(!ghost.isMoving) {
      ghost.moveStep() //執行移動
    }
    //小精靈跟鬼的碰撞檢查(兩者都活著且碰撞到)
    if(!ghost.isDead && !map.pacman.isDead && ghost.collide(map.pacman)) {
      //鬼狀態:不可吃
      if(!ghost.isEatable) {
        map.pacman.die() //小精靈死亡
        //3秒後 遊戲重置
        setTimeout(() => {
          map.init()
        },3000)
      } else {
        ghost.die()
      }
    }
  })
  //食物碰撞判斷 先過濾所有食物
  //與小精靈距離小於等於3 & 與小精靈相減小於等於格子一半長度
  let currentFood = map.foods.find(food => food.gridP.sub(map.pacman.gridP).length <= 3 && food.p.sub(map.pacman.p).length <= WSPAN/2)
  //如果有找到 & 還沒被吃掉
  if(currentFood && !currentFood.eaten) {
    currentFood.eaten = true //食物被吃掉
    //判斷吃掉的是超級食物時
    if(currentFood.super) {
      map.ghosts.forEach(ghost => {
        ghost.setEatable(10) //設定10秒內可被吃
      })
    }
  }
}
//畫面繪製更新
function draw() {
  //清空背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0,0,ww,wh)
  //*** 開始繪製 *****************
  save(() => {
    //移動到畫面中央 額外減掉地圖格子(20)的一半
    translate(ww/2 - WSPAN * 10, wh/2 - WSPAN * 10)
    map.draw()
    //食物繪製在前面才不會覆蓋住角色
    map.foods.forEach(food => food.draw())
    map.pacman.draw()
    map.ghosts.forEach(ghost => ghost.draw())
    setFill("#fff")
    //分數計算(取出被吃的食物總長度*一個10分)
    let score = map.foods.filter(f => f.eaten).length * 10
    //分數顯示
    ctx.font = "1.5em Arial"
    ctx.fillText("Score: " + score,0,-10)
  })
  
  
  //************
  //*** 滑鼠物件 *****************
  ctx.fillStyle = redColor
  ctx.beginPath()
  ctx.circle(mousePos,3)
  
  ctx.save()
    ctx.beginPath()
    ctx.translate(mousePos.x,mousePos.y)
    ctx.strokeStyle = redColor
    let len = 20
    ctx.line(new Vec2(-len,0),new Vec2(len,0))
    ctx.fillText(mousePos,10,-10)
    ctx.rotate(Math.PI/2)
    ctx.line(new Vec2(-len,0),new Vec2(len,0))
    ctx.stroke()
  ctx.restore()
  
  //************
  requestAnimationFrame(draw)
}
//頁面載入
function loaded() {
  initCanvas()
  init()
  requestAnimationFrame(draw)
  setInterval(update,1000/updateFPS)
}
//載入+縮放的事件
window.addEventListener("load",loaded)
window.addEventListener("resize",initCanvas)

//建立滑鼠物件
let mousePos = new Vec2(0,0)
let mousePosUp = new Vec2(0,0)
let mousePosDown = new Vec2(0,0)
//滑鼠事件監聽
window.addEventListener("mousemove",mousemove)
window.addEventListener("mouseup",mouseup)
window.addEventListener("mousedown",mousedown)
//滑鼠事件紀錄
function mousemove(evt) {
  mousePos.set(evt.x,evt.y)
  //console.log(mousePos)
}
function mouseup(evt) {
  mousePos.set(evt.x,evt.y)
  mousePosUp = mousePos.clone()
}
function mousedown(evt) {
  mousePos.set(evt.x,evt.y)
  mousePosDown = mousePos.clone()
}
//監聽鍵盤事件
window.addEventListener("keydown", function(evt) {
  //小精靈沒有死亡才執行
  if(!map.pacman.isDead) {
    map.pacman.nextDirection = evt.key.replace("Arrow","").toLowerCase()
    //判斷小精靈如果不在移動狀態
    if(!map.pacman.isMoving) {
      //執行移動
      map.pacman.moveStep()
    }
  }
})