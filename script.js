// Shim for requestAnimationFrame for compatibility across browsers
window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

// Set up the canvas and basic variables
var canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  cw = window.innerWidth,
  ch = window.innerHeight,
  fireworks = [],
  particles = [],
  hue = 120,
  limiterTotal = 5,
  limiterTick = 0,
  timerTotal = 80,
  timerTick = 0,
  mousedown = false,
  mx, my;

canvas.width = cw;
canvas.height = ch;

// Function to get random number within a range
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Function to calculate distance between two points
function calculateDistance(p1x, p1y, p2x, p2y) {
  var xDistance = p1x - p2x,
    yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// Firework object constructor
function Firework(sx, sy, tx, ty) {
  this.x = sx;
  this.y = sy;
  this.sx = sx;
  this.sy = sy;
  this.tx = tx;
  this.ty = ty;
  this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
  this.distanceTraveled = 0;
  this.coordinates = [];
  this.coordinateCount = 3;

  // Track time for showing image
  this.showImageTime = 0; // Time counter for showing image
  this.imageShown = false; // Flag to check if the image has been shown

  // Initialize coordinates for trail effect
  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }

  this.angle = Math.atan2(ty - sy, tx - sx);
  this.speed = 2;
  this.acceleration = 1;
  this.brightness = random(1000, 4000);
  this.targetRadius = 1;
}

// Update firework
Firework.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);

  if (this.targetRadius < 8) {
    this.targetRadius += 0.3;
  } else {
    this.targetRadius = 1;
  }

  this.speed *= this.acceleration;
  var vx = Math.cos(this.angle) * this.speed,
    vy = Math.sin(this.angle) * this.speed;

  this.distanceTraveled = calculateDistance(
    this.sx,
    this.sy,
    this.x + vx,
    this.y + vy
  );

  if (this.distanceTraveled >= this.distanceToTarget) {
    createParticles(this.tx, this.ty);
    fireworks.splice(index, 1);
  } else {
    this.x += vx;
    this.y += vy;
  }

  // Track time and show image for 2 seconds
  if (!this.imageShown && this.showImageTime <= 2) {
    this.showImageTime += 0.016; // Increment for each frame (about 16ms)
  } else if (this.showImageTime > 2) {
    this.imageShown = true; // Image has been shown
  }
};

// Draw firework
Firework.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(
    this.coordinates[this.coordinates.length - 1][0],
    this.coordinates[this.coordinates.length - 1][1]
  );
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle = "hsl(" + hue + ", 100%, " + this.brightness + "%)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Show image for 2 seconds after firework is launched
  if (!this.imageShown && this.showImageTime <= 2) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(faceImage, this.tx - 50, this.ty - 50, 100, 200); // Adjust position and size
    ctx.restore();
  }
};

// Particle object constructor
function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.coordinates = [];
  this.coordinateCount = 5;

  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }

  this.angle = random(0, Math.PI * 2);
  this.speed = random(1, 10);
  this.friction = 0.95;
  this.gravity = 1;
  this.hue = random(hue - 20, hue + 20);
  this.brightness = random(50, 80);
  this.alpha = 1;
  this.decay = random(0.015, 0.03);
}

// Update particle
Particle.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);

  this.speed *= this.friction;
  this.x += Math.cos(this.angle) * this.speed;
  this.y += Math.sin(this.angle) * this.speed + this.gravity;
  this.alpha -= this.decay;

  if (this.alpha <= this.decay) {
    particles.splice(index, 1);
  }
};

// Draw particle
Particle.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(
    this.coordinates[this.coordinates.length - 1][0],
    this.coordinates[this.coordinates.length - 1][1]
  );
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle =
    "hsla(" +
    this.hue +
    ", 100%, " +
    this.brightness +
    "%, " +
    this.alpha +
    ")";
  ctx.stroke();
};

// Create particles and explosion effect
function createParticles(x, y) {
  var particleCount = 100;
  while (particleCount--) {
    particles.push(new Particle(x, y));
  }
}

// Display text on screen
function displayText() {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "white";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Happy New Year", cw / 2, ch / 2);
  ctx.restore();
}

var faceImage = new Image();
faceImage.src = "image.png"; // Replace with correct image path or base64
faceImage.onload = function () {
  console.log("Image loaded");
};

// Main loop
function loop() {
  requestAnimFrame(loop);
  hue += 1;

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, cw, ch);

  // Display text
  displayText();

  ctx.globalCompositeOperation = "lighter";

  var i = fireworks.length;
  while (i--) {
    fireworks[i].draw();
    fireworks[i].update(i);
  }

  var i = particles.length;
  while (i--) {
    particles[i].draw();
    particles[i].update(i);
  }

  if (timerTick >= timerTotal) {
    if (!mousedown && Math.random() > 0.5) {
      fireworks.push(
        new Firework(cw / 2, ch, random(0, cw), random(0, ch / 2))
      );
      timerTick = 0;
    }
  } else {
    timerTick++;
  }

  if (limiterTick >= limiterTotal) {
    if (mousedown) {
      fireworks.push(new Firework(cw / 2, ch, mx, my));
      limiterTick = 0;
    }
  } else {
    limiterTick++;
  }
}

window.onload = loop;

// Mouse event bindings
canvas.addEventListener("mousemove", function (e) {
  mx = e.pageX - canvas.offsetLeft;
  my = e.pageY - canvas.offsetTop;
});
canvas.addEventListener("mousedown", function (e) {
  e.preventDefault();
  mousedown = true;
});
canvas.addEventListener("mouseup", function (e) {
  e.preventDefault();
  mousedown = false;
});
