// global constants
var IMAGE_HEIGHT = 155;
var IMAGE_TOP_MARGIN = 5;
var IMAGE_BOTTOM_MARGIN = 5;
var SLOT_SEPARATOR_HEIGHT = 2;
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN + SLOT_SEPARATOR_HEIGHT;
var RUNTIME = 3000; // how long all slots spin before starting countdown
var SPINTIME = 500; // how long each slot spins at minimum
var ITEM_COUNT = 6 // item count in slots
var SLOT_SPEED = 35; // how many pixels per second slots roll
var DRAW_OFFSET = 0; // how much draw offset in slot display from top
var BALANCE = 20; // amount of coins

var BLURB_TBL = [
    'No win!',
    'Good!',
    'Excellent!',
    'JACPOT!'
];

// images must be preloaded before they are used to draw into canvas
function preloadImages(images, callback) {
    //console.log('preloadImages');
    function _preload(asset) {
    //console.log('_preload from preloadImages');
        asset.img = new Image();
        asset.img.src = 'img/'+ asset.id + '.png';

        asset.img.addEventListener('load', function() {
            _check();
        }, false);

        asset.img.addEventListener('error', function(err) {
            _check(err, asset.id);
        }, false);
    }

    var loadc = 0;
    function _check (err, id) {
        //console.log('_check from preloadImages');
        if(err) {
            alert('Failed to load' + id);
        }
        loadc++;
        if(images.length == loadc) {
            return callback();
        }
    }
    images.forEach(function(asset) {
        _preload(asset);
    });
}

// copy elements from first array to second array
function copyArray (array) {
    //console.log('copyArray');
    var copy = [];
    for (var i = 0; i < array.length; i++) {
        copy.push( array[i]);
    }
    return copy;
}

// shuffle elements of array 
function shuffleArray(array) {
    //console.log('shuffleArray');
    for (var i = array.length-1; i > 0; i--) {
        var j = parseInt(Math.random() * i);
        var tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
}

function SlotGame() {
    //console.log('SlotGame');
    var game = new Game();
    
    $('#balance').text(BALANCE);

    var items = [
        {id: 'sym1'},
        {id: 'sym2'},
        {id: 'sym3'},
        {id: 'sym4'},
        {id: 'sym5'},
        {id: 'sym6'}
    ];
 
    $('canvas').attr('height', IMAGE_HEIGHT * ITEM_COUNT * 2);
    $('canvas').css('height', IMAGE_HEIGHT * ITEM_COUNT * 2);

    game.items = items;

    // load assets and predraw the reel canvases
    preloadImages (items, function() {
        // images are preloaded 
        // draws canvas strip
        function _fill_canvas(canvas, items) {
            //console.log(' _fill_canvas from preloadImages');
            ctx = canvas.getContext('2d');
            ctx.fillStyle = 'hsl(271, 76%, 53%)';

            for (var i = 0; i < ITEM_COUNT; i++) {
                var asset = items[i];
                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
                ctx.shadowBlur = 5;
                ctx.drawImage(asset.img, 30, i * SLOT_HEIGHT + IMAGE_TOP_MARGIN);
                ctx.drawImage(asset.img, 30, (i + ITEM_COUNT) * SLOT_HEIGHT + IMAGE_TOP_MARGIN);
                ctx.restore();
                ctx.fillRect(0, (i + 1) * SLOT_HEIGHT,297, SLOT_SEPARATOR_HEIGHT);
                ctx.fillRect(0, (i + 1 + ITEM_COUNT)  * SLOT_HEIGHT, 297, SLOT_SEPARATOR_HEIGHT);
            }
        }

        // draw the canvases with shuffled arrays
        game.items1 = copyArray(items);
        shuffleArray(game.items1);
        _fill_canvas(game.c1[0], game.items1);
        game.items2 = copyArray(items);
        shuffleArray(game.items2);
        _fill_canvas(game.c2[0], game.items2);
        game.items3 = copyArray(items);
        shuffleArray(game.items3);
        _fill_canvas(game.c3[0], game.items3);
        game.resetOffset = (ITEM_COUNT + 3) * SLOT_HEIGHT;
        game.loop();
    });
        // start game on button click
        $('#btnSpin').click( function(e) {
            //console.log('click event');
            if (game.gameRunning && BALANCE > 0) {
                game.gameRunning = false;
                BALANCE--;
                $('#balance').text(BALANCE);
                $('.winLine').hide();
            
                $('#btnSpin').removeClass("btnSpin").addClass("btnSpinD");
                game.restart();  
            } 
        });
        
        // add 20 coins to balance
        $('#add').click( function(e) {
            //console.log('click event');
            BALANCE += 20;
            $('#balance').text(BALANCE); 
            $('#scoreWindow').hide();
            $('#overlay').hide();
            $(resultsWindow).hide();
            $('#btnSpin').removeClass("btnSpinD").addClass("btnSpin");
            game.gameRunning = true;
        } );
}

function Game() {   
    //console.log('Game');
    this.gameRunning = true;

    // reel canvases
    this.c1 = $('#canvas1');
    this.c2 = $('#canvas2');
    this.c3 = $('#canvas3');

    // set random canvas offsets
    this.offset1 = -parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.offset2 = - parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.offset3 = - parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.speed1 = this.speed2 = this.speed3 = 0;
    this.lastUpdate = new Date();

    // needed for CSS translates
    this.vendor = (/webkit/i).test(navigator.appVersion) ? '-webkit': 
    (/firefox/i).test(navigator.userAgent) ? '-moz' :
    (/msie/i).test(navigator.userAgent) ? '-ms':
    'opera' in window ? '-o': '';

    this.cssTransform = this.vendor + '-transform';
    this.has3d = ('WebKitCSSMatrix'in window && 'm11' in new WebKitCSSMatrix());
    this.trnOpen = 'translate' + (this.has3d ? '3d(':'(');
    this.trnClose = this.has3d ? ',0)':')';

    // draw the slots to initial locations
    this.draw(true);
}

window.requestAnimFrame = (function() {
    //console.log('requestAnimFrame');
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (/* function */ callback, /* DOMElement */ element) {
        window.setTimeout(callback, 1000/60);
    };
})();

// restar the game and determine the stopping locations for reels
Game.prototype.restart = function() {
    //console.log('restart');
    this.lastUpdate = new Date();
    this.speed1 = this.speed2 = this.speed3 = SLOT_SPEED;

    // get index for  final offset
    this.index1 = parseInt(Math.random() * this.items1.length);
    this.index2 = parseInt(Math.random() * this.items2.length);
    this.index3 = parseInt(Math.random() * this.items3.length);

    // clear stop locations
    this.stopped1 = false;
    this.stopped2 = false;
    this.stopped3 = false;

    // randomize start reel locations
    this.offset1 = - parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.offset2 = - parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.offset3 = - parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;


    $('#resultsWindow').hide();
    $('#overlay').hide();

    this.state = 1;
    this.draw();
}

// Game prototype 
Game.prototype.update = function( force ) {
    //console.log('update');
    var now = new Date();
    var that = this;

    // Check slot status and if spun long enough stop it on result
    function _check_slot(offset) {
        //console.log('_check_slot');
        if(now - that.lastUpdate > SPINTIME) {
            if(Math.abs(offset + (ITEM_COUNT * SLOT_HEIGHT)) < (SLOT_SPEED * 1.5)) {
                return true; // done
            }
        }
        return false;       
    }
    
    switch (this.state) {
        // all slots spinning
        case 1: 
            //console.log('update: case 1');
            if(now - this.lastUpdate >= RUNTIME) {
                this.state = 2;
                this.lastUpdate = now;
            }
        break;
        // slot 1
        case 2: 
            //console.log('update: case 2');
            this.stopped1 = _check_slot(this.offset1);
            if(this.stopped1) {
                this.speed1 = 0;
                this.state++;
                this.lastUpdate = now;
            }
        break;
        // slot 1 stopped, slot 2
        case 3:
            //console.log('update: case 3');
            this.stopped2 = _check_slot(this.offset2);
            if(this.stopped2) {
                this.speed2 = 0;
                this.state++;
                this.lastUpdate = now;
            }
        break;
        // slot 2 stopped, slot 3
        case 4:
            //console.log('update: case 4');
            this.stopped3 = _check_slot(this.offset3);
            if(this.stopped3) {
                this.speed3 = 0;
                this.state++;
            }
        break;
        // slot stopped
        case 5: 
            //console.log('update: case 5');
            if(now - this.lastUpdate > 1000) {
                this.state = 6;
            }
        break;
        // check results
        case 6:
            // console.log('update: case 6');
            $('#overlay').show();
            // element index on canvas1
            var indexc11 = that.index1;
            var indexc12 = (that.index1 + 1) % that.items1.length;
            var indexc13 = (that.index1 + 2) % that.items1.length;
            // element index on canvas2
            var indexc21 = that.index2;
            var indexc22 = (that.index2 + 1) % that.items2.length;
            var indexc23 = (that.index2 + 2) % that.items2.length;
            // element index on canvas3
            var indexc31 = that.index3;
            var indexc32 = (that.index3 + 1) % that.items3.length;
            var indexc33 = (that.index3 + 2) % that.items3.length;

            var winLine = 0;
            if(that.items1[indexc11].id == that.items2[indexc21].id  && that.items2[indexc21].id==that.items3[indexc31].id) {
                winLine++;
                $('#winLine1').show();
            }
            if(that.items1[indexc12].id == that.items2[indexc22].id && that.items2[indexc22].id == that.items3[indexc32].id) {
                winLine++;
                $('#winLine2').show();
            }
            if(that.items1[indexc13].id == that.items2[indexc23].id && that.items2[indexc23].id == that.items3[indexc33].id) {
                winLine++;
                $('#winLine3').show();
            }
            if(that.items1[indexc11].id == that.items2[indexc22].id && that.items2[indexc22].id == that.items3[indexc33].id) {
                winLine++;
                $('#winLine4').show();
            }
            if(that.items1[indexc13].id == that.items2[indexc22].id && that.items2[indexc22].id== that.items3[indexc31].id) {
                winLine++;
                $('#winLine5').show();
            }
            window.setTimeout( function() { $('#resultsWindow').show(); }, 500 );
            $('#multiplier').text(winLine);

            var winStatus ='';
            switch(winLine){
                case 0: winStatus = BLURB_TBL[0];break;
                case 1: winStatus = BLURB_TBL[1];break;
                case 2: winStatus = BLURB_TBL[2];break;
                case 3: winStatus = BLURB_TBL[2];break;
                case 4: winStatus = BLURB_TBL[2];break;
                case 5: winStatus = BLURB_TBL[3];break;
            }

            BALANCE += 3*winLine;

            if(BALANCE > 0) {
                $('#status').text(winStatus);
                $('#balance').text(BALANCE);
                $('#btnSpin').removeClass("btnSpinD").addClass("btnSpin");
                this.gameRunning = true;
            } else {
                $('#scoreWindow').show();
            }
            this.state = 7;
        break;
        // game ends
        case 7:
            // console.log('update: case 7');
        break;
        default:
    }
    this.lastupdate = now;
}

Game.prototype.draw = function( force ) {
    //console.log('draw');
    if(this.state >= 6) return;

    // draw the spinning slots based on current state
    for(var i = 1; i <= 3; i++) {
        var indexp = 'index' + i;
        var stopped = 'stopped' + i;
        var speedp = 'speed' + i;
        var offsetp = 'offset' + i;
        var cp = 'c'+ i;
        if (this[stopped]|| this[speedp]|| force) {
            if(this[stopped]) {
                this[speedp] = 0;
                // get stop location
                var c = this[indexp];
                this[offsetp] = -(c * SLOT_HEIGHT); 
                if(this[offsetp] + DRAW_OFFSET > 0) {
                    // reset back to beginning
                    this[offsetp] = - this.resetOffset + SLOT_HEIGHT * 3;
                }
            } else {
                this[offsetp] += this[speedp]; 
                if(this[offsetp] + DRAW_OFFSET > 0) {
                    // reset back to beginning
                    this[offsetp] = - this.resetOffset + SLOT_HEIGHT * 3 - DRAW_OFFSET;
                }
            }
            // translate canvas location 
            this[cp].css(this.cssTransform, this.trnOpen +'0px, '+ (this[offsetp] + DRAW_OFFSET) + 'px'+ this.trnClose);
        }
    }
}

Game.prototype.loop = function() {
    //console.log('loop');
    var that = this;
    that.running =  true;
    (function gameLoop() {
        that.update();
        that.draw();
        if (that.running) {
            requestAnimFrame(gameLoop);
        }
    })();
}