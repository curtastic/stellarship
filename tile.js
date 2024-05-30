"use strict"

var gTileKindGun,
	gTileKindYou,
	gTileKindThruster,
	gTileKinds=[],
	gSpotKindFloor,
	gSpotKinds=[],
	gFloorImageULIn,
	gFloorImageURIn,
	gFloorImageDLIn,
	gFloorImageDRIn,
	gFloorImageUL,
	gFloorImageUR,
	gFloorImageDL,
	gFloorImageDR,
	gFloorImageU,
	gFloorImageD,
	gFloorImageL,
	gFloorImageR,
	gFloorImageM,
	asdf

function gTileKindsSetup() {
	var kind = {id:'f', name:'Floor',texX:3,texY:0,texSizeX:14,texSizeY:14}
	gSpotKindFloor = kind
	gSpotKinds.push(kind)
	
	for(var kind of gSpotKinds) {
		kind.offsetX = kind.offsetX||0
		kind.offsetY = kind.offsetY||0
		kind.image = gl1.imageMake(kind.texX, kind.texY, kind.texSizeX||gSize, kind.texSizeY||gSize)
	}

	gFloorImageM = gl1.imageMake(3+7,0+7,1,1)
	gFloorImageU = gl1.imageMake(3+7,0,1,7)
	gFloorImageD = gl1.imageMake(3+7,0+7,1,7)
	gFloorImageL = gl1.imageMake(3,0+7,7,1)
	gFloorImageR = gl1.imageMake(3+7,0+7,7,1)
	gFloorImageUL = gl1.imageMake(3,0,7,7)
	gFloorImageUR = gl1.imageMake(3+7,0,7,7)
	gFloorImageDL = gl1.imageMake(3,0+7,7,7)
	gFloorImageDR = gl1.imageMake(3+7,0+7,7,7)
	gFloorImageULIn = gl1.imageMake(12+8,27+8,7,7)
	gFloorImageURIn = gl1.imageMake(12,27+8,7,7)
	gFloorImageDLIn = gl1.imageMake(12+8,27,7,7)
	gFloorImageDRIn = gl1.imageMake(12,27,7,7)
	
	var kind = {id:'y', name:'You',texX:18,texY:0,texSizeX:10,texSizeY:22,offsetX:2,offsetY:4, reload:22}
	gTileKindYou = kind
	gTileKinds.push(kind)
	
	var kind = {id:'T', name:'Thruster',texX:50,texY:0,texSizeX:10,texSizeY:4,offsetX:3,offsetY:0}
	kind.thrustImage = gl1.imageMake(50,5,10,8)
	gTileKindThruster = kind
	gTileKinds.push(kind)
	
	var kind = {id:'G', name:'Gun',texX:37,texY:0,texSizeX:12,texSizeY:27,offsetX:2,offsetY:-15,reload:11}
	gTileKindGun = kind
	gTileKinds.push(kind)
	
	for(var kind of gTileKinds) {
		kind.reload = kind.reload||0
		kind.offsetX = kind.offsetX||0
		kind.offsetY = kind.offsetY||0
		kind.image = gl1.imageMake(kind.texX, kind.texY, kind.texSizeX||gSize, kind.texSizeY||gSize)
	}
}

function gTileMake(kind) {
	var tile = {kind, reload:kind.reload||-1}
	return tile
}

function gTileGet(gridX, gridY) {
	var spot = gSpotGet(gridX, gridY)
	if(spot) {
		return spot.tile
	}
}

function gSpotKindGet(gridX, gridY) {
	var spot = gSpotGet(gridX, gridY)
	if(spot) {
		return spot.kind
	}
}

function gSpotGet(gridX, gridY) {
	if(gGridIn(gridX, gridY)) {
		return gGrid[gridX][gridY]
	}
}

var gGridIn = (x,y) => x>=0 && y>=0 && x<gGridSizeX && y<gGridSizeY


function gTilesUpdate() {
	for(var x=0; x<gGridSizeX; x++) {
		for(var y=0; y<gGridSizeY; y++) {
			var spot = gSpotGet(x,y)
			var tile = spot.tile
			if(tile && tile.kind && tile.kind.reload) {
				var drawX = gYou.x + x*gSize
				var drawY = gYou.y + y*gSize
				if(tile.reload>0) {
					tile.reload--
				} else {
					if(tile.kind.reload) {
						tile.reload = tile.kind.reload
					} else {
						if(tile.reload < 0) {
							continue
						}
						tile.reload = -1
					}
					var total = 1
					for(var i=0; i<total; i++) {
						gShotMake({x:drawX+gSize/2-3 +(i-(total/2-.5))/total*20+1, y:drawY-6, sizeX:6, sizeY:20, spot, damage: 1, speed: 6})
					}
				}
			}
		}
	}
}

function gPixelToSpot(x,y) {
	var gridX = (x-gYou.x) / gSize | 0
	var gridY = (y-gYou.y) / gSize | 0
	return gSpotGet(gridX, gridY)
}

function gSpotDrawXGet(spot) {
	return gBoardX + spot.x*gSize
}

function gSpotDrawYGet(spot) {
	return gBoardY + spot.y*gSize
}

function gSpotCanHoldItem(spot, item) {
	if(item.kind == gSpotKindFloor) {
		if(!spot.kind && !spot.tile) {
			for(var way=0; way<4; way++) {
				var spot2 = gSpotGet(spot.x+gWayX[way], spot.y+gWayY[way])
				if(spot2) {
					if(spot2.kind) {
						var tile = spot2.tile
						if(!(tile && tile.kind == gTileKindYou && way==1)) {
							return 1
						}
					}
				}
			}
		}
		return 0
	}
	if(item.kind == gTileKindThruster) {
		return !spot.kind && !spot.tile && gSpotKindGet(spot.x, spot.y-1)
	}

	return spot.kind == gSpotKindFloor && !spot.tile
}
