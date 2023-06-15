const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const STATE = {
  x_pos : 0,
  y_pos : 0,
  move_right: false,
  move_left: false,
  shoot: false,
  lasers: [],
  enemyLasers: [],
  enemies : [],
  spaceship_width: 50,
  enemy_width: 50,
  cooldown : 0,
  score : 0,
  number_of_enemies: 16,
  enemy_cooldown : 0,
  gameOver: false,
  total_lifes: 3,
}

function setPosition($element, x, y) {
    if (!STATE.gameOver)
      $element.style.transform = `translate(${x}px, ${y}px)`;
}

function setSize($element, width) {
  $element.style.width = `${width}px`;
  $element.style.height = "auto";
}

function bound(x){
  if (x >= GAME_WIDTH-STATE.spaceship_width){
    STATE.x_pos = GAME_WIDTH-STATE.spaceship_width;
    return GAME_WIDTH-STATE.spaceship_width
  } if (x <= 0){
    STATE.x_pos = 0;
    return 0
  } else {
    return x;
  }
}

function collideRect(rect1, rect2){
  return!(rect2.left > rect1.right || 
    rect2.right < rect1.left || 
    rect2.top > rect1.bottom || 
    rect2.bottom < rect1.top);
}

function createEnemy($container, x, y){
  const $enemy = document.createElement("img");
  $enemy.src = "img/ufo-3.png";
  $enemy.className = "enemy";
  $container.appendChild($enemy);
  const enemy_cooldown = Math.floor(Math.random()*100);
  const enemy = {x, y, $enemy, enemy_cooldown}
  STATE.enemies.push(enemy);
  setSize($enemy, STATE.enemy_width);
  setPosition($enemy, x, y)
}

function updateEnemies($container){
  const dx = Math.sin(Date.now()/1000)*40;
  const dy = Math.cos(Date.now()/1000)*30;
  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++){
    const enemy = enemies[i];
    var a = enemy.x + dx;
    var b = enemy.y + dy;
    setPosition(enemy.$enemy, a, b);
    enemy.cooldown = Math.random(0,100);
    if (enemy.enemy_cooldown == 0){
      createEnemyLaser($container, a, b);
      enemy.enemy_cooldown = Math.floor(Math.random()*50)+100 ;
    }
    enemy.enemy_cooldown -= 0.5;
  }
}

function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "img/spaceship-3.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

function updatePlayer(){
  if(STATE.move_left){
    STATE.x_pos -= 3;
  } if(STATE.move_right){
    STATE.x_pos += 3;
  } if(STATE.shoot && STATE.cooldown == 0){
    createLaser($container, STATE.x_pos - STATE.spaceship_width/2, STATE.y_pos);
    STATE.cooldown = 30;
  }
  const $player = document.querySelector(".player");
  setPosition($player, bound(STATE.x_pos), STATE.y_pos-10);
  if(STATE.cooldown > 0){
    STATE.cooldown -= 0.5;
  }
}

function createLaser($container, x, y){
  const $laser = document.createElement("img");
  $laser.src = "img/laser.png";
  $laser.className = "laser";
  $container.appendChild($laser);
  const laser = {x, y, $laser};
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
  playAllyShot()
}

function updateLaser($container){
  const lasers = STATE.lasers;
  for(let i = 0; i < lasers.length; i++){
    const laser = lasers[i];
    laser.y -= 2;
    if (laser.y < 0){
      deleteLaser(lasers, laser, laser.$laser);
    }
    setPosition(laser.$laser, laser.x, laser.y);
    const laser_rectangle = laser.$laser.getBoundingClientRect();
    const enemies = STATE.enemies;
    for(let j = 0; j < enemies.length; j++){
      const enemy = enemies[j];
      const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
      if(collideRect(enemy_rectangle, laser_rectangle)){
        deleteLaser(lasers, laser, laser.$laser);
        const index = enemies.indexOf(enemy);
        enemies.splice(index,1);
        $container.removeChild(enemy.$enemy);
        playEnemyHit()
        STATE.score += 1
        $('.points').text(STATE.score)
      }
    }
  }
}

function createEnemyLaser($container, x, y){
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "img/enemyLaser.png";
  $enemyLaser.className = "enemyLaser";
  $container.appendChild($enemyLaser);
  const enemyLaser = {x, y, $enemyLaser};
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
  playEnemyShot()
}

function updateEnemyLaser($container){
  const enemyLasers = STATE.enemyLasers;
  for(let i = 0; i < enemyLasers.length; i++){
    const enemyLaser = enemyLasers[i];
    enemyLaser.y += 2;
    if (enemyLaser.y > GAME_HEIGHT-30){
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    if (document.querySelector(".player") == null) continue
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document.querySelector(".player").getBoundingClientRect();
    if(collideRect(spaceship_rectangle, enemyLaser_rectangle)){
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
      STATE.total_lifes = STATE.total_lifes - 1
      updateLife()
      $('.lives img').first().remove();
      playAllyHit()
      if(STATE.total_lifes == 0){
        $('.lives').text('Sem Vidas')
        STATE.gameOver = true;
        playAllyExplosion()
        playDeadNotification()
        
        $container.removeChild(document.querySelector(".player"));
        for (let i = 0; i < STATE.enemies.length; i++){
          $container.removeChild(document.querySelector(".enemy"));
        }
        $('.enemyLaser').css('display', 'none')
        $container.removeChild(document.querySelector(".enemyLaser"));
      }
    }
    setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width/2, enemyLaser.y+15);
  }
}

function deleteLaser(lasers, laser, $laser){
  if (!STATE.gameOver){
    const index = lasers.indexOf(laser);
    lasers.splice(index,1);
    $container.removeChild($laser);
  }
}

function updateLife(){
  $('#qtdLife').text(STATE.total_lifes)
}

function setVolumes(){
  $('#soundtrack')[0].volume = 0.4;
  $('#allyShot')[0].volume = 0.5;
  $('#allyHit')[0].volume = 0.5;
  $('#allyExplosion')[0].volume = 0.5;
  $('#enemyShot')[0].volume = 0.5;
  $('#enemyHit')[0].volume = 0.5;
}

function playSoundtrack(){
  $('#soundtrack')[0].currentTime = 0;
  $('#soundtrack').trigger("play");
}

function playAllyShot(){
  $('#allyShot')[0].currentTime = 0;
  $('#allyShot').trigger("play");
}

function playAllyExplosion(){
  $('#allyExplosion')[0].currentTime = 0;
  $('#allyExplosion').trigger("play");
}

function playEnemyShot(){
  if(!STATE.gameOver){
    $('#enemyShot').trigger("play");
  }
}

function playEnemyHit(){
  $('#enemyHit')[0].currentTime = 0;
  $('#enemyHit').trigger("play");
}

function playDeadNotification(){
  $('#deadNotification').trigger("play");
}

function playWinNotification(){
  $('#winNotificaion').trigger("play");
}

function playAllyHit(){
  $('#allyHit')[0].currentTime = 0;
  $('#allyHit').trigger("play");
}

function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true;
  }
}

function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false;
  }
}

function update(){
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);

  window.requestAnimationFrame(update);
  
  if (STATE.gameOver) {
    document.querySelector(".lose").style.display = "block";
  } if (STATE.enemies.length == 0) {
    document.querySelector(".win").style.display = "block";
    playWinNotification()
  }
}

function createEnemies($container) {
  for(var i = 0; i <= STATE.number_of_enemies/2; i++){
    createEnemy($container, i*80, 100);
  } for(var i = 0; i <= STATE.number_of_enemies/2; i++){
    createEnemy($container, i*80, 180);
  }
}

const $container = document.querySelector(".main");

$("#btnStartGame").click(function(){
  if(!$('#chkAudio').prop("checked")){
    for(var i = 0; i < $('audio').length; i++){
      $('audio')[i].volume = 0;
    }
  }else{
    setVolumes()
    playSoundtrack()
  }
  document.querySelector(".menu").style.display = "none";
  createPlayer($container);
  createEnemies($container);
  updateLife()
  update();
})

window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
