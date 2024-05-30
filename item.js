var gItems=[]

function gItemMake(item) {
	gItems.push(item)
	item.sizeX = item.sizeX || item.kind.sizeX || gSize
	item.sizeY = item.sizeY || item.kind.sizeY || gSize
	item.speedX = item.speedX||0
	item.speedY = item.speedY||0
	return item
}

function gItemsUpdate() {
	for(var item of gItems) {
		item.x += item.speedX
		item.y += item.speedY+1
		item.speedX *= .99
		item.speedY *= .99
		if(!gRectsHit(0,-22,gSizeX,gSizeY+22,item)) {
			gItems.splice(gItems.indexOf(item),1)
			continue
		}

		if(item.blink) {
			item.blink--
		} else {
			for(var y=0;y<2;y++) {
				for(var x=0;x<2;x++) {
					var spot = gPixelToSpot(item.x+x*gSize, item.y-item.kind.offsetY+y*gSize)
					if(spot && spot.kind) {
						item.x=0
						item.y=0
						gYou.items.push(item)
						gItems.splice(gItems.indexOf(item),1)
						y=9
						break
					}
				}
			}
		}
	}
}

function gItemsDraw() {
	for(var item of gItems) {
		if(item.blink%4>1)continue
		var drawX = item.x
		var drawY = item.y
		item.kind.image.rgb = 0xAAFFAA7F + Math.sin(gloop.updates/5)*9
		gl1.imageDraw(item.kind.image, drawX, drawY)
		item.kind.image.rgb = u
	}
}
