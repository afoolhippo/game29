const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const homeButton = document.getElementById("homeButton");
const backButton = document.getElementById("backButton");
const shareButton = document.getElementById("shareButton");
const recordButton = document.getElementById("recordButton");

const stageText = document.getElementById("stageText");
const placeText = document.getElementById("placeText");
const timeText = document.getElementById("timeText");
const qualityText = document.getElementById("qualityText");
const scoreText = document.getElementById("scoreText");
const countdownText = document.getElementById("countdownText");

const resultEmoji = document.getElementById("resultEmoji");
const resultScore = document.getElementById("resultScore");
const resultQuality = document.getElementById("resultQuality");
const resultStage = document.getElementById("resultStage");
const resultTitle = document.getElementById("resultTitle");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const wifiBallImg = new Image();
wifiBallImg.src = "wifi_ball.png";

const bgImages = {
  1: "room_bg.png",
  2: "cafe_bg.png",
  3: "tunnel_bg.png"
};

let bgImage = new Image();

let paddle;
let ball;
let bricks;

let currentStage = 1;
let timer = 40;
let score = 0;
let brokenCount = 0;
let qualityLevel = 0;

let gameRunning = false;
let waitingCountdown = false;
let timerInterval;

const stageNames = {
  1: "ワンルーム",
  2: "カフェ",
  3: "トンネル"
};

const stageLayouts = {
  1: [
    [0,1,1,1,0],
    [0,1,1,1,0]
  ],

  2: [
    [1,1,1,1,1],
    [0,1,1,1,0],
    [1,1,0,1,1]
  ],

  3: [
    [1,1,1,1,1],
    [1,0,1,0,1],
    [1,1,1,1,1],
    [0,1,1,1,0]
  ]
};

function startGame(){

  currentStage = 1;
  score = 0;
  brokenCount = 0;

  scoreText.textContent = "通信ポイント：0pt";

  startStage();
}

function startStage(){

  titleScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  gameScreen.classList.add("active");

  stageText.textContent = `STAGE ${currentStage}`;
  placeText.textContent = stageNames[currentStage];

  qualityText.textContent = "通信品質：圏外寸前";

  qualityLevel = 0;

  bgImage.src = bgImages[currentStage];

  let paddleWidth = 165;
  let speed = 2.2;

  if(currentStage === 2){
    paddleWidth = 150;
    speed = 2.5;
  }

  if(currentStage === 3){
    paddleWidth = 138;
    speed = 2.8;
  }

  paddle = {
    x: WIDTH/2 - paddleWidth/2,
    y: HEIGHT - 36,
    w: paddleWidth,
    h: 14
  };

  ball = {
    x: WIDTH/2,
    y: HEIGHT - 82,
    r: 13,
    baseSpeed: speed,
    dx: speed,
    dy: -speed
  };

  createBricks();

  timer = 40;
  timeText.textContent = timer;

  clearInterval(timerInterval);

  gameRunning = false;
  waitingCountdown = true;

  drawScene();

  startCountdown();
}

function startCountdown(){

  let count = 3;

  countdownText.textContent = count;
  countdownText.classList.add("show");

  const interval = setInterval(()=>{

    count--;

    if(count > 0){

      countdownText.textContent = count;

    }else{

      clearInterval(interval);

      countdownText.textContent = "START!";

      setTimeout(()=>{

        countdownText.classList.remove("show");

        waitingCountdown = false;
        gameRunning = true;

        startTimer();

        requestAnimationFrame(update);

      },500);
    }

  },700);
}

function startTimer(){

  clearInterval(timerInterval);

  timerInterval = setInterval(()=>{

    if(!gameRunning) return;

    timer--;

    timeText.textContent = timer;

    if(timer <= 0){
      endGame();
    }

  },1000);
}

function createBricks(){

  bricks = [];

  const layout = stageLayouts[currentStage];

  const brickW = 68;
  const brickH = 34;
  const gap = 8;

  const startX =
    (WIDTH - (5*brickW + 4*gap))/2;

  const startY = 120;

  layout.forEach((row,r)=>{

    row.forEach((cell,c)=>{

      if(cell === 1){

        bricks.push({

          x:startX + c*(brickW+gap),
          y:startY + r*(brickH+gap),
          w:brickW,
          h:brickH,
          alive:true

        });

      }

    });

  });

}

function update(){

  if(!gameRunning) return;

  drawScene();

  moveBall();

  checkCollisions();

  requestAnimationFrame(update);
}

function drawScene(){

  ctx.clearRect(0,0,WIDTH,HEIGHT);

  ctx.drawImage(bgImage,0,0,WIDTH,HEIGHT);

  drawBricks();

  drawPaddle();

  drawBall();
}

function drawPaddle(){

  ctx.fillStyle = "#39d8ff";

  ctx.fillRect(
    paddle.x,
    paddle.y,
    paddle.w,
    paddle.h
  );

  ctx.strokeStyle = "#ffffff";

  ctx.lineWidth = 2;

  ctx.strokeRect(
    paddle.x,
    paddle.y,
    paddle.w,
    paddle.h
  );
}

function drawBall(){

  ctx.drawImage(
    wifiBallImg,
    ball.x - ball.r,
    ball.y - ball.r,
    ball.r * 2,
    ball.r * 2
  );
}

function drawBricks(){

  bricks.forEach(brick=>{

    if(!brick.alive) return;

    ctx.fillStyle = "#3d4e73";

    ctx.fillRect(
      brick.x,
      brick.y,
      brick.w,
      brick.h
    );

    ctx.strokeStyle = "#dff8ff";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      brick.x,
      brick.y,
      brick.w,
      brick.h
    );

  });

}

function moveBall(){

  ball.x += ball.dx;
  ball.y += ball.dy;

  if(ball.x < ball.r){

    ball.x = ball.r;
    ball.dx *= -1;

  }

  if(ball.x > WIDTH - ball.r){

    ball.x = WIDTH - ball.r;
    ball.dx *= -1;

  }

  if(ball.y < ball.r){

    ball.y = ball.r;
    ball.dy *= -1;

  }

  if(
    ball.y + ball.r >= paddle.y &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.dy > 0
  ){

    ball.dy *= -1;

    const hitPos =
      (ball.x - (paddle.x + paddle.w/2))
      / (paddle.w/2);

    ball.dx += hitPos * 0.5;

    normalizeBallSpeed();
  }

  if(ball.y > HEIGHT){

    endGame();

  }

}

function checkCollisions(){

  let remaining = 0;

  bricks.forEach(brick=>{

    if(!brick.alive) return;

    remaining++;

    if(

      ball.x + ball.r > brick.x &&
      ball.x - ball.r < brick.x + brick.w &&
      ball.y + ball.r > brick.y &&
      ball.y - ball.r < brick.y + brick.h

    ){

      brick.alive = false;

      ball.dy *= -1;

      score += 10;

      brokenCount++;

      scoreText.textContent =
        `通信ポイント：${score}pt`;

    }

  });

  updateQuality(remaining);

  if(remaining === 0){

    score += 100;
    score += timer * 2;

    scoreText.textContent =
      `通信ポイント：${score}pt`;

    nextStage();
  }

}

function updateQuality(remaining){

  const total = bricks.length;

  const ratio = remaining / total;

  let newLevel = 0;

  if(ratio > 0.66){

    qualityText.textContent =
      "通信品質：圏外寸前";

    newLevel = 0;

  }else if(ratio > 0.33){

    qualityText.textContent =
      "通信品質：快適";

    newLevel = 1;

  }else{

    qualityText.textContent =
      "通信品質：神回線";

    newLevel = 2;

  }

  if(newLevel !== qualityLevel){

    qualityLevel = newLevel;

    normalizeBallSpeed();
  }

}

function normalizeBallSpeed(){

  const boost = qualityLevel * 0.5;

  const targetSpeed =
    ball.baseSpeed + boost;

  const angle =
    Math.atan2(ball.dy, ball.dx);

  ball.dx = Math.cos(angle) * targetSpeed;
  ball.dy = Math.sin(angle) * targetSpeed;

}

function nextStage(){

  clearInterval(timerInterval);

  gameRunning = false;

  currentStage++;

  if(currentStage > 3){

    score += 300;

    endGame(true);

    return;
  }

  setTimeout(()=>{

    startStage();

  },1000);
}

function endGame(clear=false){

  clearInterval(timerInterval);

  gameRunning = false;

  gameScreen.classList.remove("active");

  resultScreen.classList.add("active");

  const quality =
    qualityText.textContent.replace(
      "通信品質：",
      ""
    );

  resultScore.textContent =
    `通信ポイント：${score}pt`;

  resultQuality.textContent = quality;

  resultStage.textContent =
    `到達：STAGE ${
      Math.min(currentStage,3)
    }`;

  if(clear){

    resultEmoji.textContent = "🚀";
    resultTitle.textContent =
      "称号：光回線の神";

  }else if(quality === "快適"){

    resultEmoji.textContent = "📶";
    resultTitle.textContent =
      "称号：中継器マスター";

  }else{

    resultEmoji.textContent = "📡";
    resultTitle.textContent =
      "称号：圏外の住人";

  }

}

document.addEventListener("mousemove",e=>{

  if(!paddle) return;

  const rect = canvas.getBoundingClientRect();

  paddle.x =
    e.clientX - rect.left - paddle.w/2;

  clampPaddle();

});

document.addEventListener("touchmove",e=>{

  if(!paddle) return;

  e.preventDefault();

  const rect = canvas.getBoundingClientRect();

  paddle.x =
    e.touches[0].clientX
    - rect.left
    - paddle.w/2;

  clampPaddle();

},{passive:false});

function clampPaddle(){

  if(paddle.x < 0){
    paddle.x = 0;
  }

  if(paddle.x + paddle.w > WIDTH){
    paddle.x = WIDTH - paddle.w;
  }

}

function goTitle(){

  clearInterval(timerInterval);

  gameRunning = false;

  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");

  titleScreen.classList.add("active");
}

startButton.onclick = startGame;

retryButton.onclick = goTitle;

backButton.onclick = goTitle;

homeButton.onclick = ()=>{

  location.href =
    "https://afoolhippo.github.io/home/";

};

shareButton.onclick = ()=>{

  const text =
`📶 Wifiないと生きていけない 📶

通信ポイント：${score}pt
崩した壁：${brokenCount}個

無料ブラウザゲーム
「Wifiないと生きていけない」

#Wifiないと生きていけない
#カバゲーセン`;

  const url =
    "https://twitter.com/intent/tweet?text="
    + encodeURIComponent(text);

  window.open(url,"_blank");

};

recordButton.onclick = ()=>{

  alert("ランキング登録は後ほど実装予定！");

};