var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;

function getImage(name)
{
    image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}

function drawChar(context, c, x, y)
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, 12, 16);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(i = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += 12;
    }
}

function block_overlaps(x1, y1, x2, y2) {
    return (x1 + blockImage.width >= x2 && x1 < x2+blockImage.width && y1 + blockImage.height >= y2 && y1 < y2+blockImage.height);
}

function overlaps(x1, y1, sprite1, x2, y2, sprite2) {
    return (x1 + sprite1.width >= x2 && x1 < x2+sprite2.width && y1 + sprite1.height >= y2 && y1 < y2+sprite2.height);
}

function paintTitleBitmaps()
{
    drawString(titlectx, 'This is a demo of the JavaScript/HTML5 game loop',32,32);
    drawString(winctx, 'Your game should always have an ending',32,32);
}

function makeTitleBitmaps()
{
    titleBitmap = document.createElement('canvas');
    titleBitmap.width = SCREENWIDTH;
    titleBitmap.height = SCREENHEIGHT;
    titlectx = titleBitmap.getContext('2d');
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function resetGame()
{
    x = 128;
    y = 128;
    blocks = Array();
    for(var i=0;i<100;i++) {
	blockx = Math.random() * SCREENWIDTH;
	blocky = Math.random() * SCREENHEIGHT;
	var overlap = false;
	for (var j=0;j<blocks.length;j++) {
	    if(block_overlaps(blocks[j].x, blocks[j].y, blockx, blocky)) {
		overlap = true;
	    }
	}
	if (!overlap) {
	    blocks.push({ x: blockx, y: blocky});
	}
    }
}

function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("player");
    blockImage = getImage("block");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    return true;
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    ctx.drawImage(playerImage, x, y);
    for(var i=0;i<blocks.length; i++) {
	ctx.drawImage(blockImage, blocks[i].x, blocks[i].y);
    }

    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function processKeys() {
    var tx = x;
    var ty = y;
    if(keysDown[40] || keysDown[83]) ty  = y + 4;
    if(keysDown[38] || keysDown[87]) ty  = y - 4;
    if(keysDown[37] || keysDown[65]) tx = x - 4;
    if(keysDown[39] || keysDown[68]) tx = x + 4;
    if(tx < 0) tx = 0;
    if(tx > SCREENWIDTH - playerImage.width) tx = SCREENHEIGHT - playerImage.width;
    if(ty < 0) ty = 0;
    if(ty > SCREENWIDTH - playerImage.height) ty = SCREENHEIGHT - playerImage.height;
    var overlap_x = false;
    var overlap_y = false;
    for(var i=0;i<blocks.length;i++) {
	if(overlaps(tx, y, playerImage, blocks[i].x, blocks[i].y, blockImage)) {
	    overlap_x = true;
	}
    }
    if(!overlap_x) { x = tx; }
    for(var i=0;i<blocks.length;i++) {
	if(overlaps(x, ty, playerImage, blocks[i].x, blocks[i].y, blockImage)) {
	    overlap_y = true;
	}
    }
    if(!overlap_y) { y = ty; }
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
    }
    draw();
    if(!stopRunloop) setTimeout('drawRepeat()',20);
}

function press(c) {
    console.log("press "+c);
    if(c==32) {
	if(mode == MODE_TITLE) {
	    resetGame();
	    mode = MODE_PLAY;
	}
    } else {
	keysDown[c] = 1;
    }
}

function unpress(c) {
    console.log("unpress "+c);
    keysDown[c] = 0;
}


if (canvas.getContext('2d')) {
    stopRunloop = false;
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
        keysDown[c] = 1;
	if(c == 81) {
	    stopRunloop=true;
	}
	if(c == 32) {
	    if(mode == MODE_TITLE) {
		resetGame();
		mode = MODE_PLAY;
	    }
	}
	if(c == 82) {
	    if(mode == MODE_WIN) {
		mode = MODE_TITLE;
	    }
	}
    };


    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    if(init()) {
      drawRepeat();
    }
}
