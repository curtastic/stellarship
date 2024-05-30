var gShots = [],
	gShotImage = gl1.imageMake(0,35,5,17),
	gShotBallImage = gl1.imageMake(0,27,7,7),
	gZapShotImage = gl1.imageMake(0,56,6,20)

function gShotMake(shot) {
	gShots.push(shot)
}

function gShotsUpdate() {
	for(var shot of gShots) {
		if(shot.ship) {
			if(shot.angle !==u) {
				shot.x += Math.cos(shot.angle)*shot.speed
				shot.y += Math.sin(shot.angle)*shot.speed
			} else {
				shot.y += shot.speed
			}
			for(var y=0; y<2; y++) {
				var spot = gPixelToSpot(shot.x+shot.sizeX/2, shot.y+shot.sizeY*y)
				if(spot && spot.kind) {
					gShipHpAdd(gYou, -shot.damage)
					gShots.splice(gShots.indexOf(shot),1)
				}
			}
			if(shot.y > gSizeY) {
				gShots.splice(gShots.indexOf(shot),1)
			}
		} else {
			shot.y -= shot.speed
			if(shot.y < -shot.sizeY) {
				gShots.splice(gShots.indexOf(shot),1)
				continue
			}
			for(var ship of gShips) {
				if(gRectsHit(shot.x, shot.y, shot.sizeX, shot.sizeY, ship)) {
					gShots.splice(gShots.indexOf(shot),1)
					gShipHpAdd(ship, -shot.damage)
					if(shot.zap) {
						ship.zapped += 15*shot.zap
					}
					break
				}
			}
		}
	}
}

function gShotsDraw() {
	for(var shot of gShots) {
		var drawX = shot.x
		var drawY = shot.y
		var image = shot.zap ? gZapShotImage : gShotImage
		if(shot.ship && shot.ship.kind == gShipKindSchooner)image = gShotBallImage
		image.rgb = shot.spot ? 0x2233FF7F : 0xFF00007F
		gl1.imageDraw(image, drawX, drawY)
	}
}
