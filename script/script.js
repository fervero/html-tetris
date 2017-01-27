function htmlWell(htmlTarget, width) {

    this.emptyHtmlList = function(oldList) {    
// The oldList is expected to be an array of jQuery objects, with a "remove" method. The emptyHtmlList() function 
// both empties the list and removes the objects from the DOM.
        if ( (!oldList) || ( oldList.length === 0 ) ) return [];
        while (oldList.length > 0) {
            oldList.pop().remove();
        }
        //$(".garbage").remove();
        return oldList;
    };
    
    this.resetDeadBlocks = function() {
// Initializes, or re-initializes for a new game, the well.        
        abstractWell.call(this, this.width, 2 * this.width);
        this.deadBlocks = [];
        this.htmlTarget.empty();
    }
    
    this.rebuildOldBlocks = function() {
// removes all the fallen bricks and recreates the stack, based on the abstract well
            this.htmlTarget.empty();
            var newDiv;
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.depth; y++) {
                    if (!this.freeAt (x,y)) {
                        newDiv = this.createHtmlSquare (x, y);
                        this.addDeadBrick(newDiv.shake().repaintDead());
                    }  // if...
                } // for y...
            } //for x...
    }
    
    this.calculateSquareSize = function() {
/* Sets the size of a basic square. For a default well, the basic square would be 10% wide and 5% high. Which makes a square.
   Also, caches the coordinates, expressed in %, of every field on the board. Hence, if we want to put a square with the coordinates        
   (x, y) on the board, we express it in CSS terms as: left: sqWidth[x]; top: sqHeight[y].
   Note that the width and the height of the basic square can be accessed as sqWidth[1] and sqHeight[1], respectively.
   */
        var x = 100 / this.width,
            y = 100 / this.depth;
        for (var i = 0; i < this.width; i++) {
            this.sqWidth[i] = (x * i).toFixed(3) + "%";
        }
        for (var i = 0; i < this.depth; i++) {
            this.sqHeight[i] = (y * i).toFixed(3) + "%";
        }
    }
    
    this.createHtmlSquare = function(x, y) {
        var newDiv = $("<div></div>").basicSquare(this.sqWidth[1], this.sqHeight[1]);
        if(this.moveHtmlSquare(newDiv, x, y) ) {
            this.htmlTarget.append(newDiv);
            return newDiv;
        } else
            return false;
    }
    
    this.append = function (elem) {
        this.htmlTarget.append(elem);
    }
    
    this.addDeadBrick = function(brick) {
// takes a single html basic square, jQuery-wrapped, and appends to the well
        this.deadBlocks.push(brick);
        this.append(brick);
    }
    
    this.moveHtmlSquare = function (div, x, y) {
        if((x >= this.width) || (y >= this.depth) ) return false;
        return div
            .css("left", this.sqWidth[x])
            .css("top", this.sqHeight[y])
    };
        
    this.sqWidth = [];
    this.sqHeight = [];
    this.htmlTarget = htmlTarget;    
    this.width = width || 10;
    this.resetDeadBlocks();
    this.calculateSquareSize();    
}

function htmlBlock (well, blockType) {
    abstractBlock.call(this, well || {}, blockType);    
    this.emptyHtmlList = this.myWorld.emptyHtmlList;
    this.resetBlocks = function() {
        this.htmlSquares = this.emptyHtmlList(this.htmlSquares) || [];
    }    
 
    this.initHtml = function() {
        this.resetBlocks();
        var newDiv;
        for (var i = 0; i < this.xy.length; i++ ) {
            newDiv = this.myWorld.createHtmlSquare (this.pos[0] + this.xy[i][0], 
                                                   this.pos[1] + this.xy[i][1]);
            this.myWorld.append(newDiv);
            this.htmlSquares.push(newDiv);
        }    
    }
        
    this.addClass = function (newClass) {
        for (var i = 0; i < this.htmlSquares.length; i++) {
            this.htmlSquares[i].addClass(newClass);
        }
        return this;
    }

    this.removeClass = function (oldClass) {
        for (var i = 0; i < this.htmlSquares.length; i++) {
            this.htmlSquares[i].removeClass(oldClass);
        }
        return this;
    }
    
    this.updateHtml = function() {
        if (this.htmlSquares) 
            for (var i = 0; i < this.htmlSquares.length; i++ ) {
                this.myWorld.moveHtmlSquare(
                    this.htmlSquares[i],
                    this.pos[0] + this.xy[i][0],
                    this.pos[1] + this.xy[i][1]
                );
            } else
                this.initHtml();
    }
    
    this.done = function() {
        var block,
            rows;
        while (this.htmlSquares.length > 0) {
            block = this.htmlSquares.pop();
            this.myWorld.addDeadBrick(
                block
                    .shake()
                    .repaintDead()                
        );}
        this.myWorld.update(this);
        rows = this.myWorld.findFullRows();
        if ( rows > 0 ) {
            this.myWorld.rebuildOldBlocks();
        }
        return rows;
    }
}

$.fn.basicSquare = function(x, y) {
    return this
        .addClass("brick")
        .css("left", x)
        .css("top", y);
}

$.fn.repaintDead = function() {
    return this.addClass("dead-brick").css(
        "background-position", 
        "-" + this.css("left") + " -" + this.css("top")
        );
}

$.fn.shake = function() {
    return this.css(
        "transform", 
        "rotate(" + ( Math.round((Math.random() * 15 - 7.5) ) ) + "deg)");
}

$.fn.shakeEach = function() {
    return this.each(function (index, brick) {
        $(brick).shake();
    });
}

var well, currentBlock, nextBlock, lineCount = 0, step = 250, timeoutNumber, animationNumber, scoreHtml;

function getNewBlock(well) {
    currentBlock = new htmlBlock(well);
    currentBlock.initHtml();
}

function readKeyboard(e) {
    switch (e.key) {
        case "a": currentBlock.moveLeft();
            break;
        case "d": currentBlock.moveRight();
            break;
        case "s": currentBlock.rotate();
            break;
        case " ": currentBlock.stepDown();
        }
}

function readButton() {
    this.blur();
    readKeyboard($(this).data());
}

function animationLoop() {
    if(currentBlock)
        currentBlock.updateHtml();
    scoreHtml.html(lineCount.toString());
    window.requestAnimationFrame(animationLoop);
}

function gameLoop() {
    if(currentBlock.stepDown()) {
// if it can fall, let it
        currentBlock.updateHtml();
        timeoutNumber = setTimeout (gameLoop, step);
    } else {
// and if it cannot: update the well with new bricks,
        lineCount += currentBlock.done();
// get another block: can it move at all?
        getNewBlock(well);
        if (currentBlock.collision(currentBlock.xy, currentBlock.pos)) {
            console.log ("Game over.");
            return;
        }
    timeoutNumber = setTimeout(gameLoop, step);    
    }
}

function initGame() {
    lineCount = 0;
    if(timeoutNumber) clearTimeout(timeoutNumber);
    well.resetDeadBlocks();
    getNewBlock(well);
    timeoutNumber = setTimeout(gameLoop, step);
    animationNumber = animationLoop();
}

window.onload =  function initAll() {
    well = new htmlWell($("#well"));
    scoreHtml = $("#score");
    $("body").on("keypress", readKeyboard);
    $("#left").click(readButton);
    $("#right").click(readButton);
    $("#rotate").click(readButton);
    $("#new-game").click(
        function() {
            this.blur();
            initGame();
        }
    );
}