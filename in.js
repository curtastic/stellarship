/*
	gin.js
	An input library.
	This is for projects that have a game loop running.
	You don't set callbacks, you just check if(gin.clickStarted) etc. inside your game loop.
	Features:
	- Check which keys are currently down, or just now hit, or just now released.
	- Mouse position and speed and scroll speed.
	- Dragging/swipe direction.
	- Scroll acceleration.
	- Two finger scroll.
	- Pinch detection, with position and speed.
	- Which HTML element the mouse is over and clicked.
	- Supports old devices/browsers including IE11 and iOS9.
	Does not include:
	- Controller support.
*/

var gin = {
	scale: 1, 
	// Is keyDown[keycode] is true if that key is currently being pressed down.
	keyDown: [],
	// Is keyHit[keycode] is true if that key was just pressed this frame.
	keyHit: [],
	keyHitDraw: [],
	// Is keyReleased[keycode] is true if that key was just released this frame.
	keyReleased: [],
	// How fast the user scrolled their mouse wheel during this frame.
	mouseWheelSpeed: 0,
	// Is the current position of the mouse, or the position of the most recent touch.
	mouseX: 0,
	mouseY: 0,
	// Is the current position of the most recent click or drag. Doesn't get reset to 0 after the user lets go.
	clickX: 0,
	clickY: 0,
	// Where the last click started. It doesn't change when dragging.
	clickStartX: 0,
	clickStartY: 0,
	// Is a mouse object if a click/touch just started during this frame. Otherwise null.
	clickStarted: null,
	// Is a mouse object if a the screen is being pressed down right now by a mouse/finger. Otherwise null.
	clicking: null,
	// Is a mouse object if the user just let go during this frame. Otherwise null.
	clickReleased: null,
	// Is a mouse object if the user just let go during this frame and didn't drag at all during this click. Otherwise null.
	clicked: null,
	// Set this to true when you don't want the default web page behaviour to happen, such as swipe to scroll the page.
	// When set to true this still allows default clicks on buttons and anchors and inputs. You can set it to a function instead.
	preventDefault: false,
	// An array of mouse objects created, where [0] is the standard mouse, and [1] is a finger that has pressed the screen.
	// indexes after 1 only exist if multiple fingers have pressed the screen at the same time.
	mouses: [],
	setup: function() {
		var gin = this
		
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			gin.mobile = 1
		}
		gin._mouseSpeedOldX = [0,0,0]
		gin._mouseSpeedOldY = [0,0,0]
		
		document.addEventListener("contextmenu", (e) => {e.preventDefault()})
		
		window.addEventListener("keydown", function(e) {
			if(!gin.keyDown[e.keyCode]) {
				gin.keyDown[e.keyCode] = 1
				gin.keyHit[e.keyCode] = gin.keyHitDraw[e.keyCode] = 1
			}
		})
		
		window.addEventListener("keyup", function(e) {
			gin.keyDown[e.keyCode] = 0
			gin.keyReleased[e.keyCode] = 1
		})
		
		// In case gin thinks shift or control is down when it isn't. Like if you were holding control while the window loses focus.
		var keysCheck = function(e) {
			if(gin.keyDown[16] && !e.shiftKey) {
				gin.keyDown[16] = 0
				gin.keyReleased[16] = 1
			}
			if(gin.keyDown[17] && !e.ctrlKey) {
				gin.keyDown[17] = 0
				gin.keyReleased[17] = 1
			}
		}
		
		var onScroll = function(e) {
			var speed
			if(e.detail) {
				speed = e.detail * -120
			} else {
				speed = e.wheelDelta
			}
			gin.mouseWheelSpeed = speed
		}
		document.addEventListener("DOMMouseScroll", onScroll)
		window.addEventListener("mousewheel", onScroll)
		
		var blockTaps = function(e) {
			if(!gin.preventDefault)
				return false
			
			if(gin.preventDefault === true) {
				// By default if you don't set a gin.preventDefault function, gin will do this: block default behavior except on buttons, anchors and inputs.
				var div = e.target
				if(div.tagName == 'INPUT' || div.tagName == 'TEXTAREA' || div.tagName == 'SELECT')
					return false
				while(1) {
					if(div.tagName == 'BUTTON' || div.tagName == 'A')
						return false
					div = div.parentNode
					if(!div)
						return true
				}
			} else {
				return gin.preventDefault(e)
			}
		}
		
		var clickMoved = function(mouse) {
			var x = mouse.x
			var y = mouse.y
			gin.clickX = mouse.clickX = x
			gin.clickY = mouse.clickY = y
			
			// If you drag more than 4 pixels, gin will consider it a swipe and not a click.
			var max = 4
			var distX = mouse.clickStartX - x
			var distY = mouse.clickStartY - y
			if(Math.abs(distX) > max || Math.abs(distY) > max) {
				if(Math.abs(distX) > Math.abs(distY)) {
					mouse.dragWay = distX > 0 ? 'r' : 'l'
				} else {
					mouse.dragWay = distY > 0 ? 'd' : 'u'
				}
			}
		}
		
		var clickStarted = function(e, mouse) {
			mouse.clicking = true
			gin.clickStarted = mouse
			gin.clicking = mouse
			mouse.clickX = mouse.clickStartX = mouse.oldX = gin.clickX = gin.clickStartX = gin.mouseX = mouse.x
			mouse.clickY = mouse.clickStartY = mouse.oldY = gin.clickY = gin.clickStartY = gin.mouseY = mouse.y
			
			mouse.dragWay = ''
			
			gin.mouseHitDiv = e.target
			mouse.overDiv = e.target
		}

		var clickEnded = function(e, mouse) {
			mouse.clicking = false
			
			gin.mouseX = mouse.x
			gin.mouseY = mouse.y
			
			gin.clickReleased = mouse
			
			gin.clicking = null
			for(var i in gin.mouses) {
				if(gin.mouses[i].clicking) {
					gin.clicking = gin.mouses[i]
					break
				}
			}
			
			if(!mouse.dragWay) {
				gin.clicked = mouse
			}
			
			if(mouse != gin.mouseReal) {
				if(!gin.clicking) {
					// On iphone every tap has a new identifier. So I'll delete finished taps so my array doesn't keep growing.
					gin.mouses = [gin.mouseReal]
					mousesById = {}
					mousesById[gin.mouseReal.id] = gin.mouseReal
				}
			}
		}
		
		var touchHandler = function(e) {
			for(var i=0; i<e.changedTouches.length; i++) {
				var touch = e.changedTouches[i]
				var mouse = mouseAdd(touch.identifier)
				gin.mouseX = mouse.x = (touch.clientX - gOffsetX)/gin.scale
				gin.mouseY = mouse.y = (touch.clientY - gOffsetY)/gin.scale
				
				if(e.type == 'touchstart')
					clickStarted(e, mouse)
				else if(e.type == 'touchend' || e.type == 'touchcancel')
					clickEnded(e, mouse)
				else if(e.type == 'touchmove')
				{
					clickMoved(mouse)
					
					//e.target is not the div under the finger, it's the div the touch started at for some reason.
					mouse.overDiv = document.elementFromPoint(mouse.x, mouse.y)
				}
			}
			if(!blockTaps(e)) {
				return true
			}
			e.preventDefault()
			return false
		}
		
		document.addEventListener("touchstart", touchHandler, {passive:false})
		document.addEventListener("touchend", touchHandler, {passive:false})
		document.addEventListener("touchcancel", touchHandler, {passive:false})
		document.addEventListener("touchmove", touchHandler, {passive:false})
		
		// On iPhone it also makes a onmouseup on around the frame after touchend. So we'd get double clicks if we listen for both touchend and mouseup.
		if(!gin.mobile) {
			window.addEventListener("mousemove", function(e) {
				var mouse = gin.mouseReal
				gin.mouseX = mouse.x = (e.clientX - gOffsetX)/gin.scale
				gin.mouseY = mouse.y = (e.clientY - gOffsetY)/gin.scale
				
				mouse.overDiv = e.target
				
				if(mouse.clicking) {
					clickMoved(mouse)
				}
			})
			
			window.addEventListener("mousedown", function(e) {
				keysCheck(e)
				gin.mouseReal.x = (e.clientX - gOffsetX)/gin.scale
				gin.mouseReal.y = (e.clientY - gOffsetY)/gin.scale
				clickStarted(e, gin.mouseReal)
				if(!blockTaps(e)) {
					return true
				}
				e.preventDefault()
			})
			
			window.addEventListener("mouseup", function(e) {
				keysCheck(e)
				clickEnded(e, gin.mouseReal)
			})
		}
		
		var mousesById = {}
		var mouseAdd = function(id) {
			var mouse = mousesById[id]
			if(!mouse) {
				mousesById[id] = mouse = {
					id: id,
					x: 0,
					y: 0,
					oldX: 0,
					oldY: 0,
					clicking: false,
					clickX: 0,
					clickY: 0,
					dragWay: '',
				}
				gin.mouses.push(mouse)
			}
			return mouse
		}
		gin.mouseReal = mouseAdd('real')
	},
	dragSpeedRecentXGet: function() {
		return this._mouseSpeedOldX[0] + this._mouseSpeedOldX[1] + this._mouseSpeedOldX[2]
	},
	dragSpeedRecentYGet: function() {
		return this._mouseSpeedOldY[0] + this._mouseSpeedOldY[1] + this._mouseSpeedOldY[2]
	},
	update: function() {
		var speedX = 0
		var speedY = 0
		for(var i=0; i<this.mouses.length; i++)
		{
			var mouse = this.mouses[i]
			if(i==0 || mouse.clicking)
			{
				speedX = mouse.speedX = mouse.oldX - mouse.x
				speedY = mouse.speedY = mouse.oldY - mouse.y
				mouse.oldX = mouse.x
				mouse.oldY = mouse.y
			}
			else
			{
				mouse.speedX = 0
				mouse.speedY = 0
			}
		}
		
		this._mouseSpeedOldX.push(speedX)
		this._mouseSpeedOldY.push(speedY)
		if(this._mouseSpeedOldX.length > 3) {
			this._mouseSpeedOldX.shift()
			this._mouseSpeedOldY.shift()
		}
		
		if(this.clicking && this.mouses[1] && this.mouses[2] && this.mouses[1].clicking && this.mouses[2].clicking) {
			var distX = this.mouses[1].x - this.mouses[2].x
			var distY = this.mouses[1].y - this.mouses[2].y
			var dist = Math.sqrt(distX*distX + distY*distY)
			if(this.pinchDist)
			{
				this.pinchSpeed = dist - this.pinchDist
			}
			this.pinchDist = dist
			this.pinchX = (this.mouses[1].x + this.mouses[2].x)/2
			this.pinchY = (this.mouses[1].y + this.mouses[2].y)/2
			
			this.twoFingerScrollX = (this.mouses[1].speedX + this.mouses[2].speedX)/2
			this.twoFingerScrollY = (this.mouses[1].speedY + this.mouses[2].speedY)/2
		} else {
			this.pinchDist = 0
			this.pinchSpeed = 0
			this.twoFingerScrollX = 0
			this.twoFingerScrollY = 0
		}
		
		this.clear()
	},
	mouseDownOnBox: function(x,y,sizeX,sizeY) {
		if(gRectsHit(gin.clickStartX,gin.clickStartY,1,1, x+gl1.offsetX,y+gl1.offsetY,sizeX,sizeY)) {
			return 1
		}
	},
	clear: function() {
		this.keyHit = []
		this.keyReleased = []
		this.mouseWheelSpeed = 0
		this.clickStarted = null
		this.clicked = null
		this.clickReleased = null
	},
	clearDraw: function() {
		this.clickedDraw = 0
		this.keyHitDraw = []
	},
	clearAll: function() {
		this.clear()
		this.clicking = null
	}
}


gin.setup()
