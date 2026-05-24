const GAME_ID = "game29";

const GAME_TITLE = "Wifiないと生きていけない";

const SUPABASE_URL =
  "https://gmncxnybsovlallxgnkd.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_ly3h5OhL8HDSHhYdmJq_Fw_9pG3mhla";

const kabaDb = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const titleImage = document.getElementById("titleImage");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const arcadeButton = document.getElementById("arcadeButton");
const backButton = document.getElementById("backButton");
const shareButton = document.getElementById("shareButton");
const registerButton = document.getElementById("registerButton");
const resultButtons = document.getElementById("resultButtons");

const stageText = document.getElementById("stageText");
const placeText = document.getElementById("placeText");
const timeText = document.getElementById("timeText");
const qualityText = document.getElementById("qualityText");
const scoreText = document.getElementById("scoreText");
const countdownText = document.getElementById("countdownText");

const resultImage = document.getElementById("resultImage");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const wifiBallImg = new Image();
wifiBallImg.src = "wifi_ball.png";

const bgImage = new Image();

const bgm = new Audio("bgm.mp3");
bgm.loop = true;
bgm.volume = 0.45;

const seHit = new Audio("se_hit.mp3");
seHit.volume = 0.6;

const bgImages = {
  1: "room_bg.png",
  2: "cafe_bg.png",
  3: "tunnel_bg.png"
};

const stageNames = {
  1: "ワンルーム",
  2: "カフェ",
  3: "トンネル"
};

const stageLayouts = {
  1: [
    [0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0]
  ],
  2: [
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1]
  ],
  3: [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0]
  ]
};

let paddle;
let ball;
let bricks = [];

let currentStage = 1;
let timer = 40;
let score = 0;
let brokenCount = 0;
let qualityLevel = 0;

let gameRunning = false;
let waitingCountdown = false;
let timerInterval;

let lastRankTitle = "";
let lastScore = 0;
let scoreRegistered = false;

function playBgm() {
  bgm.currentTime = 0;
  bgm.play().catch(() => {});
}

function stopBgm() {
  bgm.pause();
  bgm.currentTime = 0;
}

function playHitSe() {
  seHit.currentTime = 0;
  seHit.play().catch(() => {});
}

function startGame() {
  currentStage = 1;
  score = 0;
  brokenCount = 0;
  qualityLevel = 0;
  scoreRegistered = false;

  scoreText.textContent = "通信ポイント：0pt";

  registerButton.disabled = false;
  registerButton.textContent = "記録を登録";
  resultButtons.classList.add("hidden");

  playBgm();
  startStage();
}

function startStage() {
  titleScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  gameScreen.classList.add("active");

  stageText.textContent = `STAGE ${currentStage}`;
  placeText.textContent = stageNames[currentStage];
  qualityText.textContent = "通信品質：圏外寸前";
  scoreText.textContent = `通信ポイント：${score}pt`;

  qualityLevel = 0;

  bgImage.src = bgImages[currentStage];

  let paddleWidth = 170;
  const speed = 3.4;

  if (currentStage === 2) {
    paddleWidth = 155;
  }

  if (currentStage === 3) {
    paddleWidth = 145;
  }

  paddle = {
    x: WIDTH / 2 - paddleWidth / 2,
    y: HEIGHT - 36,
    w: paddleWidth,
    h: 14
  };

  ball = {
    x: WIDTH / 2,
    y: HEIGHT - 92,
    r: 18,
    baseSpeed: speed,
    dx: speed,
    dy: -speed
  };

  normalizeBallSpeed();

  createBricks();

  timer = 40;
  timeText.textContent = timer;

  clearInterval(timerInterval);

  gameRunning = false;
  waitingCountdown = true;

  drawScene();
  startCountdown();
}

function startCountdown() {
  let count = 3;

  countdownText.textContent = count;
  countdownText.classList.add("show");

  const interval = setInterval(() => {
    count--;

    if (count > 0) {
      countdownText.textContent = count;
    } else {
      clearInterval(interval);
      countdownText.textContent = "START!";

      setTimeout(() => {
        countdownText.classList.remove("show");
        waitingCountdown = false;
        gameRunning = true;
        startTimer();
        requestAnimationFrame(update);
      }, 500);
    }
  }, 700);
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!gameRunning) return;

    timer--;
    timeText.textContent = timer;

    if (timer <= 0) {
      endGame();
    }
  }, 1000);
}

function createBricks() {
  bricks = [];

  const layout = stageLayouts[currentStage];

  const brickW = 68;
  const brickH = 34;
  const gap = 8;

  const startX = (WIDTH - (5 * brickW + 4 * gap)) / 2;
  const startY = 120;

  layout.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === 1) {
        bricks.push({
          x: startX + c * (brickW + gap),
          y: startY + r * (brickH + gap),
          w: brickW,
          h: brickH,
          alive: true
        });
      }
    });
  });
}

function update() {
  if (!gameRunning) return;

  drawScene();
  moveBall();
  checkCollisions();

  requestAnimationFrame(update);
}

function drawScene() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#cfffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawStageBackground();
  drawBricks();
  drawPaddle();
  drawBall();
}

function drawStageBackground() {
  if (!bgImage.complete) return;

  const bgSize = WIDTH * 0.92;
  const bgX = (WIDTH - bgSize) / 2;
  const bgY = (HEIGHT - bgSize) / 2;

  ctx.drawImage(
    bgImage,
    bgX,
    bgY,
    bgSize,
    bgSize
  );

  ctx.fillStyle = "rgba(210, 252, 255, 0.50)";
  ctx.fillRect(
    bgX,
    bgY,
    bgSize,
    bgSize
  );
}

function drawPaddle() {
  ctx.fillStyle = "#36d9ff";
  ctx.fillRect(
    paddle.x,
    paddle.y,
    paddle.w,
    paddle.h
  );

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    paddle.x + 4,
    paddle.y + 3,
    paddle.w - 8,
    3
  );

  ctx.strokeStyle = "#082530";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    paddle.x,
    paddle.y,
    paddle.w,
    paddle.h
  );
}

function drawBall() {
  const size = ball.r * 2.4;

  if (wifiBallImg.complete) {
    ctx.drawImage(
      wifiBallImg,
      ball.x - size / 2,
      ball.y - size / 2,
      size,
      size
    );
  } else {
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBricks() {
  bricks.forEach(brick => {
    if (!brick.alive) return;

    ctx.fillStyle = "#2f4d75";
    ctx.fillRect(
      brick.x,
      brick.y,
      brick.w,
      brick.h
    );

    ctx.fillStyle = "#5d82bb";
    ctx.fillRect(
      brick.x + 4,
      brick.y + 4,
      brick.w - 8,
      7
    );

    ctx.strokeStyle = "#082530";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      brick.x,
      brick.y,
      brick.w,
      brick.h
    );
  });
}

function moveBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.r) {
    ball.x = ball.r;
    ball.dx *= -1;
    normalizeBallSpeed();
  }

  if (ball.x > WIDTH - ball.r) {
    ball.x = WIDTH - ball.r;
    ball.dx *= -1;
    normalizeBallSpeed();
  }

  if (ball.y < ball.r) {
    ball.y = ball.r;
    ball.dy *= -1;
    normalizeBallSpeed();
  }

  if (
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x - 10 &&
    ball.x <= paddle.x + paddle.w + 10 &&
    ball.dy > 0
  ) {
    ball.y = paddle.y - ball.r;
    ball.dy *= -1;

    const hitPos =
      (ball.x - (paddle.x + paddle.w / 2)) /
      (paddle.w / 2);

    ball.dx += hitPos * 0.55;
    normalizeBallSpeed();
  }

  if (ball.y > HEIGHT) {
    endGame();
  }
}

function checkCollisions() {
  let remaining = 0;

  bricks.forEach(brick => {
    if (!brick.alive) return;

    remaining++;

    if (
      ball.x + ball.r > brick.x &&
      ball.x - ball.r < brick.x + brick.w &&
      ball.y + ball.r > brick.y &&
      ball.y - ball.r < brick.y + brick.h
    ) {
      brick.alive = false;

      playHitSe();

      ball.dy *= -1;
      normalizeBallSpeed();

      score += 10;
      brokenCount++;

      scoreText.textContent = `通信ポイント：${score}pt`;
    }
  });

  updateQuality(remaining);

  if (remaining === 0) {
    score += 100;
    score += timer * 2;
    scoreText.textContent = `通信ポイント：${score}pt`;
    nextStage();
  }
}

function updateQuality(remaining) {
  const total = bricks.length;
  const ratio = remaining / total;

  if (ratio > 0.66) {
    qualityText.textContent = "通信品質：圏外寸前";
    qualityLevel = 0;
  } else if (ratio > 0.33) {
    qualityText.textContent = "通信品質：快適";
    qualityLevel = 1;
  } else {
    qualityText.textContent = "通信品質：神回線";
    qualityLevel = 2;
  }
}

function normalizeBallSpeed() {
  const targetSpeed = ball.baseSpeed;
  const angle = Math.atan2(ball.dy, ball.dx);

  ball.dx = Math.cos(angle) * targetSpeed;
  ball.dy = Math.sin(angle) * targetSpeed;

  if (Math.abs(ball.dy) < 2.0) {
    ball.dy = ball.dy < 0 ? -2.0 : 2.0;

    const signX = ball.dx < 0 ? -1 : 1;
    const rest = Math.sqrt(
      Math.max(targetSpeed * targetSpeed - ball.dy * ball.dy, 0)
    );

    ball.dx = signX * rest;
  }
}

function nextStage() {
  clearInterval(timerInterval);
  gameRunning = false;

  currentStage++;

  if (currentStage > 3) {
    score += 300;
    scoreText.textContent = `通信ポイント：${score}pt`;
    endGame(true);
    return;
  }

  setTimeout(() => {
    startStage();
  }, 1000);
}

function showResultButtonsLater() {
  resultButtons.classList.add("hidden");

  setTimeout(() => {
    resultButtons.classList.remove("hidden");
  }, 1500);
}

function endGame(clear = false) {
  clearInterval(timerInterval);
  stopBgm();

  gameRunning = false;
  waitingCountdown = false;
  countdownText.classList.remove("show");

  gameScreen.classList.remove("active");
  resultScreen.classList.add("active");

  lastScore = score;

  if (clear || score >= 520) {
    lastRankTitle = "光回線の神";
    resultImage.src = "result_good.png";
  } else if (score >= 260) {
    lastRankTitle = "中継器マスター";
    resultImage.src = "result_normal.png";
  } else {
    lastRankTitle = "圏外の住人";
    resultImage.src = "result_bad.png";
  }

  resultTitle.textContent = lastRankTitle;
  resultScore.textContent = `${score}pt`;

  showResultButtonsLater();
}

function goTitle() {
  clearInterval(timerInterval);
  stopBgm();

  gameRunning = false;
  waitingCountdown = false;
  countdownText.classList.remove("show");

  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  titleScreen.classList.add("active");
}

document.addEventListener("mousemove", e => {
  if (!paddle) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;

  paddle.x =
    (e.clientX - rect.left) * scaleX -
    paddle.w / 2;

  clampPaddle();
});

document.addEventListener(
  "touchmove",
  e => {
    if (!paddle) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;

    paddle.x =
      (e.touches[0].clientX - rect.left) * scaleX -
      paddle.w / 2;

    clampPaddle();
  },
  { passive: false }
);

function clampPaddle() {
  if (!paddle) return;

  if (paddle.x < 0) {
    paddle.x = 0;
  }

  if (paddle.x + paddle.w > WIDTH) {
    paddle.x = WIDTH - paddle.w;
  }
}

startButton.onclick = startGame;
titleImage.onclick = startGame;

retryButton.onclick = goTitle;
backButton.onclick = goTitle;

arcadeButton.onclick = () => {
  location.href = "https://afoolhippo.github.io/home/?skipTitle=1";
};

shareButton.onclick = () => {
  const text =
`Wifiないと生きていけない📶

称号：${lastRankTitle}
通信ポイント：${lastScore}pt

無料ブラウザゲーム
「Wifiないと生きていけない」

https://afoolhippo.github.io/game29/

#Wifiないと生きていけない
#カバゲーセン`;

  const url =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(text);

  window.open(url, "_blank");
};

registerButton.onclick = async () => {
  if (scoreRegistered) {
    alert("この記録は登録済みです");
    return;
  }

  const nickname = prompt(
    "ニックネームを入力してね",
    "匿名カバ"
  );

  if (!nickname) return;

  registerButton.disabled = true;
  registerButton.textContent = "登録中...";

  const { error } = await kabaDb
    .from("kaba_scores")
    .insert({
      game_id: GAME_ID,
      game_title: GAME_TITLE,
      nickname: nickname,
      rank_title: lastRankTitle,
      score: lastScore
    });

  if (error) {
    console.error(error);

    registerButton.disabled = false;
    registerButton.textContent = "記録を登録";

    alert("登録に失敗しました");
    return;
  }

  scoreRegistered = true;
  registerButton.textContent = "登録済み";

  alert("記録を登録しました！");
};