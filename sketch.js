// Chat Application with Firebase

var initialized;

var database;
var userID;
var friendID;

var userBG;
var friendBG;
var userDrawing;
var friendDrawing;

var sendButton;
var userClearButton;
var friendClearButton;

var drawColor;
var colorButtons;

var userIDLabel;
var friendIDLabel;
var userIDInput;
var friendIDInput;
var submitButton;

const Color = {
  BLACK: { r: 0, g: 0, b: 0 },
  WHITE: { r: 255, g: 255, b: 255 },
  RED: { r: 255, g: 0, b: 0 },
  GREEN: { r: 0, g: 255, b: 0 },
  BLUE: { r: 0, g: 0, b: 255 },
  ORANGE: { r: 255, g: 165, b: 0 },
  PINK: { r: 255, g: 0, b: 255 },
  LIGHT_BLUE: { r: 100, g: 149, b: 255 }
};

function setup() {
  initialized = false;
  createLoginScreen();
}

function createLoginScreen() {
  userIDLabel = createSpan("Enter your name:");
  userIDLabel.size(200, 20);
  userIDLabel.position(40, 43);
  friendIDLabel = createSpan("Enter your friend's name:")
  friendIDLabel.size(200, 20);
  friendIDLabel.position(40, 83);
  userIDInput = createInput();
  userIDInput.size(200, 20);
  userIDInput.position(250, 40);
  friendIDInput = createInput();
  friendIDInput.size(200, 20);
  friendIDInput.position(250, 80);
  submitButton = createButton("Start");
  submitButton.size(100, 30);
  submitButton.position(500, 60);
  submitButton.mousePressed(onSubmitButtonPress);
}

function onSubmitButtonPress() {
  if (userIDInput.value() && friendIDInput.value()) {
    createApp(userIDInput.value(), friendIDInput.value());
    userIDLabel.remove();
    friendIDLabel.remove();
    userIDInput.remove();
    friendIDInput.remove();
    submitButton.remove();
  }
}

function createApp(user, friend) {
  initializeFirebase();
  userID = user;
  friendID = friend;
  userBG = new HitArea(-550, 75, 500, 400, Color.BLACK);
  friendBG = new HitArea(50, 75, 500, 400, Color.BLACK);
  sendButton = new TextButton(userBG.x + 75, userBG.y + userBG.h + 100, 150, 40, "Send", Color.LIGHT_BLUE);
  userClearButton = new TextButton(userBG.x + 275, userBG.y + userBG.h + 100, 150, 40, "Clear", Color.LIGHT_BLUE);
  friendClearButton = new TextButton(friendBG.x + 175, friendBG.y + friendBG.h + 25, 150, 40, "Clear", Color.LIGHT_BLUE);
  colorButtons = [
    new ColorButton(userBG.x + 50, userBG.y + userBG.h + 25, 50, 50, Color.WHITE),
    new ColorButton(userBG.x + 120, userBG.y + userBG.h + 25, 50, 50, Color.RED),
    new ColorButton(userBG.x + 190, userBG.y + userBG.h + 25, 50, 50, Color.GREEN),
    new ColorButton(userBG.x + 260, userBG.y + userBG.h + 25, 50, 50, Color.BLUE),
    new ColorButton(userBG.x + 330, userBG.y + userBG.h + 25, 50, 50, Color.ORANGE),
    new ColorButton(userBG.x + 400, userBG.y + userBG.h + 25, 50, 50, Color.PINK)
  ];
  drawColor = colorButtons[0].color;
  userDrawing = new Drawing(userBG);
  friendDrawing = new Drawing(friendBG);
  setupCanvas();
  initialized = true;
}

function initializeFirebase() {
  firebase.initializeApp(FIREBASE_CONFIG);
  database = firebase.database();
  clearDatabase();
  startListeningToChanges();
}

function clearDatabase() {
  database.ref(userID).remove();
  database.ref(friendID).remove();
}

function startListeningToChanges() {
  database.ref(friendID).on("value", (snapshot) => {
    if (snapshot.val() && snapshot.val()[friendID]) {
      friendDrawing.traces = snapshot.val()[friendID].traces;
    }
  });
}

function setupCanvas() {
  let canvas = createCanvas(windowWidth, userBG.h + 300);
  window.onresize = function(event) {
    canvas.size(windowWidth, userBG.h + 300);
  };
  canvas.parent("canvas_container");
}

function mousePressed() {
  if (initialized) {
    let adjustedMouseX = mouseX - windowWidth / 2;
    if (userDrawing.frame.containsPoint({ x: adjustedMouseX, y: mouseY })) {
      userDrawing.startTrace();
    }
    if (sendButton.containsPoint({ x: adjustedMouseX, y: mouseY })) {
      onSendButtonPress();
    } else if (userClearButton.containsPoint({ x: adjustedMouseX, y: mouseY })) {
      onUserClearButtonPress();
    } else if (friendClearButton.containsPoint({ x: adjustedMouseX, y: mouseY })) {
      onFriendClearButtonPress();
    }
    for (button of colorButtons) {
      if (button.containsPoint({ x: adjustedMouseX, y: mouseY })) {
        onColorButtonPress(button.color);
      }
    }
  }
}

function mouseReleased() {
  if (initialized) {
    userDrawing.endTrace();
  }
}

function draw() {
  if (initialized) {
    background(255);
    translate(windowWidth / 2, 0);
    createText();
    createButtons();
    createDrawingBackgrounds();
    userDrawing.collectPoint({ x: mouseX - windowWidth / 2, y: mouseY });
    userDrawing.createDrawing();
    friendDrawing.createDrawing();
  }
}

function createText() {
  stroke(0);
  strokeWeight(1);
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Draw Here:", userBG.x + userBG.w / 2, 40);
  text("From " + friendID + ":", friendBG.x + friendBG.w / 2, 40);
}

function createButtons() {
  sendButton.draw();
  userClearButton.draw();
  friendClearButton.draw();
  for (let button of colorButtons) {
    button.draw();
  }
}

function createDrawingBackgrounds() {
  userBG.draw();
  friendBG.draw();
}

function uploadDrawing() {
  let data = { traces: userDrawing.traces };
  database.ref(userID).set(data);
}

function onColorButtonPress(color) {
  drawColor = color;
}

function onSendButtonPress() {
  uploadDrawing();
  userDrawing.resetDrawing();
}

function onUserClearButtonPress() {
  userDrawing.resetDrawing();
}

function onFriendClearButtonPress() {
  friendDrawing.resetDrawing();
}

class Drawing {
  constructor(frame) {
    this.frame = frame;
    this.traces = [];
    this.currentTrace = new Trace();
    this.isDrawing = false;
  }

  createDrawing() {
    strokeWeight(5);
    noFill();
    for (let trace of this.traces) {
      if (trace.points) {
        beginShape();
        for (let point of trace.points) {
          stroke(trace.color.r, trace.color.g, trace.color.b);
          vertex(point.x + this.frame.x, point.y + this.frame.y);
        }
        endShape();
      }
    }
  }

  collectPoint(point) {
    if (this.frame.containsPoint(point)) {
      if (this.isDrawing) {
        let adjustedPoint = {
          x: point.x - this.frame.x,
          y: point.y - this.frame.y
        };
        if (this.currentTrace.lastPoint() !== adjustedPoint) {
          this.currentTrace.addPoint(adjustedPoint);
        }
      }
    }
  }

  startTrace() {
    this.isDrawing = true;
    this.traces.push(new Trace(drawColor));
    this.currentTrace = this.traces[this.traces.length - 1];
  }

  endTrace() {
    this.isDrawing = false;
  }

  resetDrawing() {
    this.traces = [];
  }
}

class Trace {
  constructor(color) {
    this.points = [];
    this.color = color || Color.WHITE
  }

  addPoint(point) {
    this.points.push(point);
  }

  lastPoint() {
    return this.points[this.points.length - 1];
  }

  clearPoints() {
    this.points = [];
  }
}

class HitArea {
  constructor(x, y, w, h, color) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color || Color.WHITE;
  }

  draw() {
    stroke(this.color.r, this.color.g, this.color.b);
    strokeWeight(1);
    fill(this.color.r, this.color.g, this.color.b);
    rect(this.x, this.y, this.w, this.h);
  }

  containsPoint(point) {
    if (point.x > this.x && point.x < this.x + this.w
     && point.y > this.y && point.y < this.y + this.h) {
      return true;
    }
    return false;
  }
}

class TextButton extends HitArea {
  constructor(x, y, w, h, text, color) {
    super(x, y, w, h, color);
    this.text = text;
  }

  draw() {
    stroke(this.color.r, this.color.g, this.color.b);
    strokeWeight(1);
    fill(this.color.r, this.color.g, this.color.b);
    rect(this.x, this.y, this.w, this.h);
    textSize(16);
    textAlign(CENTER, CENTER);
    stroke(255);
    strokeWeight(0.5);
    fill(255);
    text(this.text, this.x + this.w / 2, this.y + this.h / 2);
  }
}

class ColorButton extends HitArea {
  constructor(x, y, w, h, color) {
    super(x, y, w, h, color);
  }

  draw() {
    stroke(0);
    strokeWeight((this.color === drawColor) ? 3 : 1);
    fill(this.color.r, this.color.g, this.color.b);
    rect(this.x, this.y, this.w, this.h);
  }
}
