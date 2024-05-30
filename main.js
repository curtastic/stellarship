"use strict"
var w = window,
	gVersion = 8,
	gLog = console.log.bind(console),
	gStorage = window.localStorage||{},
	gStateOld = '',
	gStateLoop = 0,
	gStateLoops = 0,
	gCamX = 0,
	gCamY = 0,
	gYou,
	gGhost = {},
	gSpots = [],
	gSpots2 = [],
	gSize = 14,
	gOffsetX = 0,
	gOffsetY = 0,
	gSizeX = 0,
	gSizeY = 0,
	gScale = 1,
	gMouseTileX,gMouseTileY,
	gMobile,
	gGrid=[],
	gGridSizeX=9,
	gGridSizeY=9,
	gItemDragging,
	gTileDragging,
	gHitLoops=0,
	gWave=0,
	gCursor='auto',
	gCursor0='auto',
	gStateLoading = 'loading',
	gStateAttack = 'attack',
	gStatePaused = 'paused',
	gStateBuild = 'build',
	gStateTitle = 'title',
	gStateWin = 'win',
	gPlayButtonImage = gl1.imageMake(0,112,45,23),
	gInvBoxImage = gl1.imageMake(48,105,22,22),
	u

var gState = gStateLoading

console.log('main2')

function gStateSet(state) {
	gLog("stateSet() from",gState,"to",state)
	
	gStateOld = gState
	gState = state
	gStateLoop = gloop.updates
	gStateLoops = 0

	if(state == gStateBuild) {
		gYouGoToTarget(gSizeX/2,170,9999)
		gWave++
	}

	gin.clearAll()
}

function gGameUpdate() {
	gStateLoops = gloop.updates - gStateLoop
	gCursor = 'auto'

	gInputUpdate()

	if(gState == gStateAttack) {
		gBackgroundY++
	}
	if(gState == gStateWin) {
		gBackgroundY+=gYou.speed*8
	}
	
	if(gState != gStateLoading) {
	
		if(gin.keyHit[27]) {
			gStateSet(gState == gStatePaused ? gStateAttack: gStatePaused)
		}
	
		if(gState != gStatePaused) {
			if(gOr2(gState, gStateAttack, gStateWin)) {
				gItemsUpdate()
				gShipsUpdate()
			}
			gTilesUpdate()
			gShotsUpdate()
		}
	}

	if(gState == gStateBuild) {
		if(gItemDragging) {
			gItemDragging.x = gin.mouseX-gItemDragging.kind.image.sizeX/2
			gItemDragging.y = gin.mouseY-gItemDragging.kind.image.sizeY/2
			if(gin.clickReleased) {
				var spot = gPixelToSpot(gin.mouseX, gin.mouseY)
				if(spot && gSpotCanHoldItem(spot, gItemDragging)) {
					if(gItemDragging.kind == gSpotKindFloor) {
						spot.kind = gItemDragging.kind
					} else {
						spot.tile = {kind:gItemDragging.kind}
					}
					gYou.items.splice(gYou.items.indexOf(gItemDragging), 1)
				}
				gItemDragging = u
			}
		} else {
			var spot = gPixelToSpot(gin.mouseX, gin.mouseY)
			if(spot) {
				if(gin.clickStarted) {
					if(spot.tile) {
						if(spot.tile.kind != gTileKindYou) {
							gItemDragging = {kind:spot.tile.kind}
							gYou.items.push(gItemDragging)
							spot.tile = u
						}
					} else if(spot.kind) {
						gItemDragging = {kind:spot.kind}
						gYou.items.push(gItemDragging)
						var spotD = gSpotGet(spot.x, spot.y+1)
						if(spotD && spotD.tile && spotD.tile.kind == gTileKindThruster) {
							gYou.items.push({kind:spotD.tile.kind})
							spotD.tile = u
						}
						gGrid[spot.x][spot.y].kind =  u
					}
				} else if(spot.tile || spot.kind) {
					if(!(spot.tile && spot.tile.kind == gTileKindYou)) {
						gCursor = 'pointer'
					}
				}
			}
		}
	}
	
	gin.update()
}

function gInputUpdate() {
	gMouseTileX = gin.mouseX/gScale/gSize
	gMouseTileY = gin.mouseY/gScale/gSize

	if(gin.clicked) {
		gin.clickedDraw = 1
	}
}

var gStars = []
var gBackgroundY = 0
var gBackgroundDraw = () => {
	for(var star of gStars) {
		gl1.rectDraw(star.x, (star.y+gBackgroundY*(.1+star.z*.1))%(gSizeY*2)-2, star.z, star.z, 0xDDDD887F)
	}
}

var gGameDraw = () => {
	if(gState == 'loading') {
		if(!gl1.ready) {
			return
		}
		gStateSet(gStateBuild)
		//gShipsMake()
	}

	gBackgroundDraw()

	if(gOr2(gState, gStateAttack, gStateWin) || gState == gStatePaused) {
		gShipsDraw()
		gItemsDraw()
	
		var i=0
		for(var item of gYou.items) {
			gl1.imageDraw(item.kind.image,i*11,gSizeY-22,10,12)
			i++
		}
	
		var pad = 5
		var sizeY = 6
		gl1.rectDraw(pad-1, gSizeY-sizeY-pad-1, gSizeX-pad*2+2, sizeY+2, 0x0000AA7F)
		gl1.rectDraw(pad, gSizeY-sizeY-pad, gSizeX-pad*2, sizeY, 0xAA99777F)
		gl1.rectDraw(pad, gSizeY-sizeY-pad, (gSizeX-pad*2)*gYou.hp/gYou.hpMax, sizeY, 0x3333CC00+(127-20))
	}

	var offsetY = 0
	if(gState == gStateBuild) {
		var y = 66
		var x
		offsetY = Math.min(0,-99+gStateLoops*gYou.speed*2)
		if(offsetY) {
			gBackgroundY += gYou.speed*8
		}
		for(var i=0; i<7; i++) {
			x = 20+i*gInvBoxImage.sizeX
			gl1.imageDraw(gInvBoxImage,x,y+offsetY)
			var item = gYou.items[i]
			if(item) {
				if(gItemDragging != item) {
					item.x = x+gInvBoxImage.sizeX/2-item.kind.image.sizeX/2
					item.y = y+gInvBoxImage.sizeY/2-item.kind.image.sizeY/2-2
				}
				if(!gItemDragging) {
					if(gin.clicking && gMouseDownOnBox(x,y,gInvBoxImage.sizeX,gInvBoxImage.sizeY)) {
						gItemDragging = item
					}
					if(!gin.clicking && gPointInRect(gin.mouseX,gin.mouseY,x,y,gInvBoxImage.sizeX,gInvBoxImage.sizeY)) {
						gCursor = 'pointer'
					}
				}
			}
		}

		for(var item of gYou.items) {
			if(item != gItemDragging)
				gl1.imageDraw(item.kind.image, item.x, item.y+offsetY)
		}
		
		var x = gSizeX/2-gPlayButtonImage.sizeX/2
		var y = 220
		var onBox = gPointInRect(gin.mouseX,gin.mouseY,x,y,gPlayButtonImage.sizeX,gPlayButtonImage.sizeY)
		var down = gin.clicking && !gin.clicking.dragWay && onBox
		gPlayButtonImage.rgb = down ? 0xFFFFFF88 : u
		if(offsetY) {
			gPlayButtonImage.rgb = 0xFFFFFF00 + gEase(gStateLoops, 0, 20, 0, 127)
		}
		if(onBox && !offsetY)gCursor = 'pointer'
		gl1.imageDraw(gPlayButtonImage, x, y+(down?1:0))
		if(!offsetY && ((gin.clickedDraw && onBox) || gin.keyHitDraw[13])) {
			gin.clearAll()
			gStateSet(gStateAttack)
			gShipsMake()
		}
	}
	gShotsDraw()
	
	if(gState == gStateBuild) {
		gYou.moving = (gloop.updates/15)&1
		if(offsetY) {
			gYou.moving = 1
		}
		gYouDraw()
		
		if(gItemDragging) {
			
			var spot = gPixelToSpot(gin.mouseX, gin.mouseY)
			if(spot && gSpotCanHoldItem(spot, gItemDragging)) {
				var drawX = gYou.x + spot.x*gSize + gItemDragging.kind.offsetX
				var drawY = gYou.y + spot.y*gSize + gItemDragging.kind.offsetY
				gItemDragging.kind.image.rgb = 0xFFFFFF00 + 60+Math.abs(Math.sin(gloop.updates/6)*30)
				gl1.imageDraw(gItemDragging.kind.image, drawX, drawY)
				gItemDragging.kind.image.rgb = u
			} else {
				gl1.imageDraw(gItemDragging.kind.image, gItemDragging.x, gItemDragging.y)
			}
		}
		
	}

	if(gState == gStatePaused) {
		gl1.rectDraw(0,0,gSizeX,gSizeY,0x44)
		glText.draw("PAUSED", gSizeX/2, gSizeY/2, 1, 2)
	}

	if(gState == gStatePaused || gState == gStateBuild) {
		glText.draw("WAVE "+gWave,gSizeX/2,18+offsetY,1,1)
	}
	
	
	gl1.render()

	gin.clearDraw()

	if(gCursor0 != gCursor) {
		gCursor0 = gCursor
		gGameCanvas.style.cursor = gCursor
	}
}

function gShieldAdd(total) {
	gShield += total
	if(gShield > 100)gShield = 100
}

function gYouHit() {
	gHitLoops=1
	gShield--
}

function glLoaded() {
	gGameCanvas.style.display = 'block'
	document.body.style.background = '#FFF'
	gLogDb('appLoad')
}

w.onload = () => {
	gMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	gl1.setup(gGameCanvas, "tex.png?"+gVersion)
	gl1.gl.clearColor(.1,.02,.16,1)

	gTileKindsSetup()

	onresize = () => {
		var screenRatio = innerWidth/innerHeight

		gSizeX = 152
		gSizeY = 266
		gScale = gin.scale = 2
		
		gGameCanvas.setAttribute('width', ~~gSizeX)
		gGameCanvas.setAttribute('height', ~~gSizeY)
		
		gGameCanvas.style.width = ~~(gSizeX*gScale)+'px'
		gGameCanvas.style.height = ~~(gSizeY*gScale)+'px'

		gOffsetX = innerWidth/2 - gSizeX*gScale/2 | 0
		gOffsetY = innerHeight/2 - gSizeY*gScale/2 | 0
		gGameCanvas.style.left = gOffsetX+'px'
		gGameCanvas.style.top = gOffsetY+'px'
		
		document.body.style.backgroundPositionX = gOffsetX%38+2+'px'
		document.body.style.backgroundPositionY = gOffsetY%38+2+'px'

		gl1.resize()
	}

	ondragstart = () => false 
	onselectstart = () => false 

	onresize()

	glText.setup()
	
	gYou = {x:22,y:222,hp:20,hpMax:20,sizeX:25,sizeY:28, speed:2, reload:0, items:[]}
	
	for(var i=0; i<99; i++) {
		var star = {}
		star.x = Math.random()*(gSizeX-1)|0
		star.y = Math.random()*gSizeY*2|0
		star.z = (Math.random()*2|0)+1
		gStars.push(star)
	}
	
	gReset()
	
	gloop.start(gGameUpdate, gGameDraw)
}

var gReset = () => {
	for(var x=0; x<gGridSizeX; x++) {
		gGrid[x] = []
		for(var y=0; y<gGridSizeY; y++) {
			gGrid[x][y] = {x,y}
		}
	}

	gGrid[4][4].kind = gSpotKindFloor
	gGrid[4][5].kind = gSpotKindFloor
	gGrid[4][4].tile = {kind:gTileKindYou}

	gYou.items = []
	gYou.items.push({kind:gSpotKindFloor})
	gYou.items.push({kind:gSpotKindFloor})
	//gYou.items.push({kind:gTileKindYou})
	gYou.items.push({kind:gTileKindThruster})
}
