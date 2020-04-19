var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;
var frame = 0;
// Block types
var block_names = [ 'block_e_n', 'block_w_n', 'block_w_s', 'block_e_s' ];
var block_sprites = {};
var block_entry = { 'block_e_n': [ 1,0,1,0 ], 'block_w_n': [1,0,0,1], 'block_w_s': [0,1,0,1], 'block_e_s': [0,1,1,0] }; // NSEW

class Block {
    constructor(x, y, sprite_name, fixed) {
	this.x = x;
	this.y = y;
	this.sprite_name = sprite_name;
	this.fixed = fixed;
    }
}

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

function find_block(x, y) {
    // Find a block which a single pixel is inside, and return its index or -1 if none
    for(var i=0;i<blocks.length;i++) {
	if (x >= blocks[i].x && x < blocks[i].x+blockImage.width && y >= blocks[i].y && y < blocks[i].y+blockImage.height) {
	    return i;
	}
    }
    return -1;
}

function touching_block(x1, y1, sprite1, chain) {
    // Returns the list of blocks touching one sprite at x1, y1, apart from those in 'chain'.
    var touching = new Array();
    for(var i=0;i<blocks.length;i++) {
	if (chain.includes(i) || touching.includes(i)) {
	    // Don't touch yourself
	    continue;
	}
	if (x1 + sprite1.width > blocks[i].x && x1 < blocks[i].x+blockImage.width && y1 + sprite1.height > blocks[i].y && y1 < blocks[i].y+blockImage.height) {
	    touching.push(i);
	}
    }
    return touching;
}

function push_chain_x(x, y, dx, sprite1, chain) {
    var t = touching_block(x+dx, y, sprite1, chain);
    if(t.length > 0) {
	for(var i=0;i<t.length;i++) { chain.push(t[i]); }
	for(var i=0;i<t.length;i++) {
	    push_chain_x(blocks[t[i]].x, blocks[t[i]].y, dx, blockImage, chain);
	}
    }
}

function push_chain_y(x, y, dy, sprite1, chain) {
    var t = touching_block(x, y+dy, sprite1, chain);
    if(t.length > 0) {
	for(var i=0;i<t.length;i++) { chain.push(t[i]); }
	for(var i=0;i<t.length;i++) {
	    push_chain_y(blocks[t[i]].x, blocks[t[i]].y, dy, blockImage, chain);
	}
    }
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
    titlectx.imageSmoothingEnabled = false;
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    winctx.imageSmoothingEnabled = false;
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function resetGame()
{
    x = 128;
    y = 128;
    frame = 0;
    blocks = Array();
    particles = Array();
    for(var i=0;i<10;i++) {
	blockx = Math.random() * SCREENWIDTH;
	blocky = Math.random() * SCREENHEIGHT;
	var overlap = false;
	for (var j=0;j<blocks.length;j++) {
	    if(block_overlaps(blocks[j].x, blocks[j].y, blockx, blocky)) {
		overlap = true;
	    }
	}
	fixed = Math.random() < 0.2? true: false;
	sprite_name = block_names[Math.floor(Math.random()*block_names.length)];
	if (!overlap) {
	    blocks.push(new Block(blockx, blocky, sprite_name, fixed));
	}
    }
}

function load_block_sprite(name) {
    console.log("Loaded "+name);
    block_sprites[name] = getImage(name);
}

function init()
{
    mode = MODE_TITLE;
    ctx.imageSmoothingEnabled = false;

    playerImage = getImage("player");
    block_names.forEach(load_block_sprite);
    blockImage = getImage("block_w_n");
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
	var sn = blocks[i].sprite_name;
	ctx.drawImage(block_sprites[blocks[i].sprite_name], blocks[i].x, blocks[i].y);
	if(blocks[i].fixed) { drawString(ctx, i.toString(), blocks[i].x, blocks[i].y); }
    }
    for(var i=0;i<particles.length; i++) {
	var px = particles[i].x;
	var py = particles[i].y;
	if(particles[i].inBlock > -1) {
	    px += blocks[particles[i].inBlock].x;
	    py += blocks[particles[i].inBlock].y;
	}

	ctx.fillStyle = "#ffffff";
	ctx.fillRect(px, py, 2, 2);
    }
    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function is_entering_block(particle, block) {
    // We already know we're inside the perimeter of a block, now are we close enough to the entrace and travelling in the right direction?

    // are you near the outside edge, and travelling inwards?
    var rx = particle.x - block.x;
    var ry = particle.y - block.y;
    var border = 4;
    var intake_gap = 4;
    var N = 0; var S = 1; var E = 2; var W = 3;
    var intake_map = block_entry[block.sprite_name];
    if(rx <= border && ry >= blockImage.height/2 - intake_gap/2 && ry <= blockImage.height/2 + intake_gap/2 && particle.dx > 0 && intake_map[W]) {
	return [1,0];
    }
    if(rx >= blockImage.width - border && ry >= blockImage.height/2 - intake_gap/2 && ry <= blockImage.height/2 + intake_gap/2 && particle.dx < 0 && intake_map[E]) {
	return [-1,0];
    }
    if(ry <= border && rx >= blockImage.width/2 - intake_gap/2 && rx <= blockImage.width/2 + intake_gap/2 && particle.dy > 0 && intake_map[N]) {
	return [0,1];
    }
    if(ry >= blockImage.height - border && rx >= blockImage.width/2 - intake_gap/2 && rx <= blockImage.width/2 + intake_gap/2 && particle.dy < 0 && intake_map[S]) {
	return [0,-1];
    }
    return -1;
}

function divert_particle(particle) {
    var block = blocks[particle.inBlock];
    var intake_map = block_entry[block.sprite_name];
    if(particle.dx != 0) {
	particle.dx = 0;
	if(intake_map[0] == 1) {
	    // Going north
	    console.log(block.sprite_name + " redirects north");
	    particle.dy = -1;
	} else {
	    console.log(block.sprite_name + " redirects south");
	    particle.dy = 1;
	}
	return;
    }
    if(particle.dy != 0) {
	particle.dy = 0;
	if(intake_map[2] == 1) {
	    console.log(block.sprite_name + " redirects east");
	    // Going east
	    particle.dx = 1;
	} else {
	    console.log(block.sprite_name + " redirects west");
	    particle.dx = -1;
	}
	return;
    }
}

function gameLoop() {
    frame += 1;
    if(frame % 1 == 0) {
	particles.push({x: Math.random() * SCREENWIDTH, y: 0, inBlock: -1, dx: 0, dy: 1, blockTravel: 0});
    }
    var new_particles = new Array();
    for(var i=0;i<particles.length;i++) {
	particles[i].x += particles[i].dx;
	particles[i].y += particles[i].dy;
	if(particles[i].inBlock == -1) {
	    // Not currently inside a block
	    var b = find_block(particles[i].x, particles[i].y);
	    if(b!==-1) {
		block_enter_d = is_entering_block(particles[i], blocks[b]);
		if(block_enter_d != -1) {
		    console.log("Particle entering block "+blocks[b].sprite_name);
		    particles[i].x -= blocks[b].x;
		    particles[i].y -= blocks[b].y;
		    if(block_enter_d[0] != 0) { particles[i].y = blockImage.height/2; }
		    if(block_enter_d[1] != 0) { particles[i].x = blockImage.height/2; }
		    particles[i].inBlock = b;
		    particles[i].blockTravel = 0;
		    particles[i].dx = block_enter_d[0];
		    particles[i].dy = block_enter_d[1];
		}
		else {
		    console.log("Particle blocked by block "+blocks[b].sprite_name);
		    particles[i].y = 999;
		}
	    }
	}
	else {
	    // Inside a block
	    if(particles[i].blockTravel == 16) {
		divert_particle(particles[i]);
	    } else if (particles[i].blockTravel >= 36) {
		var exitBlock = particles[i].inBlock;
		particles[i].inBlock = -1;
		particles[i].x += blocks[exitBlock].x;
		particles[i].y += blocks[exitBlock].y;
		console.log("Restoring particle "+i+" to "+particles[i].x+","+particles[i].y);
	    }
	    particles[i].blockTravel += 1;
	}
	if(particles[i].y < SCREENHEIGHT) {
	    new_particles.push(particles[i]);
	}
    }
    particles = new_particles;
}

function processKeys() {
    var dx = 0;
    var dy = 0;
    if(keysDown[40] || keysDown[83]) dy = 4;
    if(keysDown[38] || keysDown[87]) dy = - 4;
    if(keysDown[37] || keysDown[65]) dx = - 4;
    if(keysDown[39] || keysDown[68]) dx = 4;
    if(x+dx < 0) dx = 0;
    if(x+dx > SCREENWIDTH - playerImage.width) dx = 0;
    if(y+dy < 0) dy = 0;
    if(y+dy > SCREENWIDTH - playerImage.height) dy = 0;
    var overlap_x = false;
    var overlap_y = false;

    var push_chain = new Array();
    push_chain_x(x, y, dx, playerImage, push_chain);
    blocked = false;
    for(var i = 0;i < push_chain.length; i++) {
	if(blocks[push_chain[i]].fixed) {
	    blocked = true;
	    break;
	}
    }
    if(!blocked) {
	x += dx;
	for(var i = 0;i< push_chain.length; i++){
	    blocks[push_chain[i]].x += dx;
	}
    }
    var push_chain = new Array();
    push_chain_y(x, y, dy, playerImage, push_chain);
    blocked = false;
    for(var i = 0;i < push_chain.length; i++) {
	if(blocks[push_chain[i]].fixed) {
	    blocked = true;
	    break;
	}
    }
    if(!blocked) {
	y += dy;
	for(var i = 0;i< push_chain.length; i++){
	    blocks[push_chain[i]].y += dy;
	}
    }
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	gameLoop();
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
