var gShips = [],
	gShipKinds = [],
	gShipKindGunner = gShipKindMake({image:gl1.imageMake(7,44,17,17), hp: 1, reload:222}),
	gShipKindSchooner = gShipKindMake({image:gl1.imageMake(62,47,26,17), hp: 4, reload:88}),
	gShipKindContainer = gShipKindMake({image:gl1.imageMake(33,35,23,26), hp: 5})


function gShipsMake(ship) {
	for(var y=0; y<gWave; y++) {
		for(var i=0; i<3; i++) {
			var ship = gShipMake({x:Math.random()*(gSizeX-20), y:-99, kind:gShipKindGunner})
			ship.y -= y*22
			ship.x = (i+1)*gSizeX/5
			ship.targetX = ship.x
			ship.speedX = .5
			ship.targetY = gSizeY*.3 - y*16
		}
	}
	var kinds = [gTileKindGun,gTileKindThruster,gSpotKindFloor]
	
	for(var i=0; i<3; i++) {
		var ship = gShipMake({x:Math.random()*(gSizeX-133)+50, y:-99, kind:gShipKindSchooner})
		ship.x = (i+1)*gSizeX/5
		ship.y -= 222
		ship.targetY = gSizeY*.22
	}
	
	for(var i=0; i<5; i++) {
		if(i==0||i==4||i==2) {
			var ship = gShipMake({x:Math.random()*(gSizeX-33), y:-99, kind:gShipKindContainer})
			ship.x = i/4*(gSizeX-ship.sizeX)
			ship.y -= Math.abs(i-2)*22 + 777
			if(i==2)ship.y = -99-222
			var kindI=Math.random()*kinds.length|0
			ship.itemKind = kinds[kindI]
			if(i!=2)
				kinds.splice(kindI,1)
		}
	}
}

function gShipMake(ship) {
	if(gShips>99)return
	gShips.push(ship)
	if(ship.kind.reload>1)ship.kind.reload--
	ship.reload = 0
	ship.zapped = 0
	ship.hp = ship.kind.hp
	//ship.targetY = 66-Math.random()*33
	ship.targetY = gSizeY+22
	ship.sizeX = ship.sizeX || ship.kind.image.sizeX
	ship.sizeY = ship.sizeY || ship.kind.image.sizeY
	return ship
}

function gShipKindMake(kind) {
	gShipKinds.push(kind)
	return kind
}

function gShipHpAdd(ship, hp) {
	if(hp < 0)
		ship.damageLoop = gloop.updates
	ship.hp += hp
	if(ship.hp < 1) {
		ship.hp = 0
		if(ship == gYou) {
			return
		}
		gShips.splice(gShips.indexOf(ship),1)
		if(ship.itemKind) {
			gItemMake({kind: ship.itemKind, x:ship.x, y:Math.max(0,ship.y)})
		}
	}
}

function gShipsUpdate() {
	for(var ship of gShips) {
		if(ship.zapped) {
			ship.zapped--
			continue
		}
		if(ship.speedX !== u) {
			ship.x += ship.speedX
			ship.speedX += Math.sign(ship.targetX-ship.x)*.01
		}
		ship.y += ship.kind==gShipKindContainer?1.1:.8
		if(ship.y > ship.targetY) {
			ship.y = ship.targetY
			if(ship.targetX && ship.speedX===u) {
				//ship.speedX = .5
			}
		}
		if(ship.y > gSizeY) {
			gShips.splice(gShips.indexOf(ship),1)
			continue
		}
		if(ship.y > 0 && ship.kind.reload) {
			if(ship.reload > 0) {
				ship.reload--
			} else {
				ship.reload = ship.kind.reload
				gShotMake({x:ship.x+ship.sizeX/2-3, y:ship.y+ship.sizeY/2, sizeX:6, sizeY:20, ship, damage: 1, speed: ship.kind == gShipKindSchooner?3:4})
				if(ship.kind == gShipKindSchooner) {
					gShotMake({x:ship.x+ship.sizeX/2-3+4, y:ship.y+ship.sizeY/2, sizeX:6, sizeY:20, ship, damage: 1, angle: Math.PI*.4, speed: 3})
					gShotMake({x:ship.x+ship.sizeX/2-3-4, y:ship.y+ship.sizeY/2, sizeX:6, sizeY:20, ship, damage: 1, angle: Math.PI*.6, speed: 3})
				}
			}
		}
	}

	if(gState == gStateAttack) {
		if(!gShips.length && !gItems.length) {
			gStateSet(gStateWin)
		}
	}

	var oldX = gYou.x
	var oldY = gYou.y
	gYou.moving = 0
	
	if(gState == gStateWin) {
		gYou.moving = 1
		if(gYouGoToTarget(gSizeX/2,170,gYou.speed*2)) {
			gStateSet(gStateBuild)
		}
	}
	if(gState == gStateAttack) {
		var goX = (gin.keyDown[39]||0) - (gin.keyDown[37]||0)
		var goY = (gin.keyDown[40]||0) - (gin.keyDown[38]||0)
		if(goX || goY) {
			var angle = gAngleTo(0,0,goX,goY)
			gYou.x += Math.cos(angle) * gYou.speed
			gYou.y += Math.sin(angle) * gYou.speed
			gYou.keyControlled = 1
		}
	
		if(gin.clicking)gYou.keyControlled=0
	
		if(!gYou.keyControlled && (gin.mouseX || gin.mouseY)) {
			gYouGoToTarget(gin.mouseX, gin.mouseY)
		}
	}
	
	var far = Math.floor(gGridSizeX/2)*gSize
	if(gYou.x < -far) {
		gYou.x = -far
	} else {
		var max = gSizeX - far - gSize
		if(gYou.x > max) {
			gYou.x = max
		}
	}
	if(gYou.y < -far) {
		gYou.y = -far
	} else {
		var max = gSizeY - far - gSize*2
		if(gYou.y > max) {
			gYou.y = max
		}
	}

	if(Math.abs(gYou.x-oldX)>.1 || Math.abs(gYou.y-oldY)>.1) {
		gYou.moving = 1
	}

	/*
	ship = gYou
	if(ship.reload > 0) {
		ship.reload--
	} else {
		ship.reload = 11
		gShotMake({x:ship.x+ship.sizeX/2-3, y:ship.y, sizeX:6, sizeY:20, damage: 1})
	}
	*/
}

function gYouGoToTarget(targetX, targetY, speed) {
	targetX -= gGridSizeX*gSize/2
	targetY -= gGridSizeY*gSize/2
	var angle = gAngleTo(gYou.x, gYou.y, targetX, targetY)
	if(speed === u) {
		speed = gYou.speed
	}

	var hit
	if(Math.abs(gYou.x-targetX) < speed) {
		gYou.x = targetX
		hit = 1
	} else {
		gYou.x += Math.cos(angle) * speed
	}
	if(Math.abs(gYou.y-targetY) < speed) {
		gYou.y = targetY
		if(hit)return 1
	} else {
		gYou.y += Math.sin(angle) * speed
	}
}

function gShipsDraw() {
	for(var ship of gShips) {
		var drawX = ship.x + Math.sin(ship.zapped)
		var drawY = ship.y
		var b = 255
		if(ship.zapped)b=0
		if(ship.damageLoop || ship.zapped) {
			ship.kind.image.rgb = gRgbMake(255,255,b)+gEase(gloop.updates, ship.damageLoop, ship.damageLoop+6, 0, 20)
			if(gloop.updates > ship.damageLoop+6) {
				ship.damageLoop = 0
			}
		}
		if(ship.itemKind) {
			gl1.imageDraw(ship.itemKind.image, drawX+ship.kind.image.sizeX/2-ship.itemKind.image.sizeX/2, drawY+ship.itemKind.offsetY+(ship.itemKind==gSpotKindFloor?0:11))
		}
		gl1.imageDraw(ship.kind.image, drawX, drawY)
		ship.kind.image.rgb = u
	}

	gYouDraw()
}

function gYouDraw() {
	gYou.speed = 1
	if(gYou.damageLoop) {
		gl1.alpha = 255-gArcGet(gloop.updates, gYou.damageLoop, gYou.damageLoop+10)*99
	}
	var thrusters = 0
	var weight = 0
	for(var layer=0; layer<2; layer++) {
		for(var x=0; x<gGridSizeX; x++) {
			for(var y=0; y<gGridSizeY; y++) {
				var drawX = gYou.x + x*gSize
				var drawY = gYou.y + y*gSize
				var spot = gGrid[x][y]
				if(layer==0) {
					if(spot.kind) {
						//gl1.imageDraw(spot.kind.image, drawX, drawY+spot.kind.offsetY)
						var spotU = gSpotKindGet(x,y-1)
						var spotD = gSpotKindGet(x,y+1)
						var spotL = gSpotKindGet(x-1,y)
						var spotR = gSpotKindGet(x+1,y)
						
						var image = gFloorImageM
						if(!spotU && !spotL) {
							image = gFloorImageUL
						} else if(!spotU) {
							image = gFloorImageU
						} else if(!spotL) {
							image = gFloorImageL
						} else if(!gSpotKindGet(x-1,y-1)) {
							image = gFloorImageULIn
						}
						gl1.imageDraw(image, drawX, drawY+spot.kind.offsetY, 7,7)
						
						var image = gFloorImageM
						if(!spotU && !spotR) {
							image = gFloorImageUR
						} else if(!spotU) {
							image = gFloorImageU
						} else if(!spotR) {
							image = gFloorImageR
						} else if(!gSpotKindGet(x+1,y-1)) {
							image = gFloorImageURIn
						}
						gl1.imageDraw(image, drawX+7, drawY+spot.kind.offsetY, 7,7)
						
						var image = gFloorImageM
						if(!spotD && !spotL) {
							image = gFloorImageDL
						} else if(!spotD) {
							image = gFloorImageD
						} else if(!spotL) {
							image = gFloorImageL
						} else if(!gSpotKindGet(x-1,y+1)) {
							image = gFloorImageDLIn
						}
						gl1.imageDraw(image, drawX, drawY+7+spot.kind.offsetY, 7,7)
						
						var image = gFloorImageM
						if(!spotD && !spotR) {
							image = gFloorImageDR
						} else if(!spotD) {
							image = gFloorImageD
						} else if(!spotR) {
							image = gFloorImageR
						} else if(!gSpotKindGet(x+1,y+1)) {
							image = gFloorImageDRIn
						}
						gl1.imageDraw(image, drawX+7, drawY+7+spot.kind.offsetY, 7,7)
						
						weight++
					}
				} else {
					var tile = spot.tile
					if(tile) {
						gl1.imageDraw(tile.kind.image, drawX+tile.kind.offsetX, drawY+tile.kind.offsetY)
						if(tile.kind == gTileKindThruster) {
							thrusters++
							weight++
							if(gYou.moving) {
								//tile.kind.thrustImage.rgb = 0xDD00007F
								gl1.imageDraw(tile.kind.thrustImage, drawX+tile.kind.offsetX, drawY+tile.kind.offsetY+1)
								//tile.kind.thrustImage.rgb = u
							}
						}
					}
					
					if(spot.kind) {
						if(gItemDragging && gSpotCanHoldItem(spot, gItemDragging)) {
							gl1.rectDraw(drawX, drawY, gSize,gSize, 0x33993300 + 50+Math.abs(Math.sin(gloop.updates/9+x+y)*30))
							gl1.rectDraw(drawX+2, drawY+2, gSize-2*2,gSize-2*2, 0xAAFFAA00 + 50+Math.abs(Math.sin(gloop.updates/9+x+y)*30))
						}
					} else {
						if(gItemDragging && gSpotCanHoldItem(spot, gItemDragging)) {
							gl1.rectDraw(drawX, drawY, gSize,gSize, 0x33993300 + 50+Math.abs(Math.sin(gloop.updates/9+x+y)*30))
							gl1.rectDraw(drawX+2, drawY+2, gSize-2*2,gSize-2*2, 0xAAFFAA00 + 50+Math.abs(Math.sin(gloop.updates/9+x+y)*30))
						}
					}
				}
			}
		}
	}
	gYou.speed = (thrusters+1)*4/weight
	gl1.alpha = 255
}

function gRectDraw(ship, rgba) {
	gl1.drawRect(ship.x, ship.y, ship.sizeX, ship.sizeY, rgba)
}

console.log('ship')