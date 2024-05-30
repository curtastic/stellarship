var gWayX = [1,0,-1,0]
var gWayY = [0,1,0,-1]

var gRgbMake = (r,g,b) => {
	// have to multiply the r instead of <<24 because js shift operations can't handle a number that big.
	return Math.floor(r)*0x1000000 + Math.floor(g)*0x10000 + Math.floor(b)*0x100 + 0x7F
}

var gEase = (num,start,end,min,max) => {
	var percent = gPercentGet(num, start, end)
	if(percent < .5)
		percent = percent*percent*2
	else
		percent =  1 - (1-percent)*(1-percent) * 2
	
	if(min === u)return percent
	
	return gFarGet(percent, min, max)
}

// As num goes linearly from lo to hi, return an arc from 0 to 1 (at halfway) then back to 0 at hi.
var gArcGet = (num, lo, hi) => {
	if(num <= lo || num >= hi) // clamp but also to prevent an almost 0 return, like .3656456e-16
		return 0
	return Math.sin((num-lo)/(hi-lo)*Math.PI)
}

// Returns a percentage of how far num has gone from start to end
var gPercentGet = (num,start,end) => {
	if(start < end)
		num = gClamp(num,start,end)
	else
		num = gClamp(num,end,start)
	
	return (num-start)/(end-start)
}

var gFarGet = (percent, min, max) => {
	return min + percent*(max-min)
}

var gClamp = (v, lo, hi) => {
	if(hi===u) {
		hi = lo
		lo = -lo
	}
	return Math.min(hi, Math.max(v, lo))
}

var gOr2 = (v,a,b) => v==a||v==b

var gRectsHit = (x1, y1, width1, height1, x2, y2, width2, height2) => {
	if(y2===u) {
		y2 = x2.y
		width2 = x2.sizeX
		height2 = x2.sizeY
		x2 = x2.x
	}
	if(x1 >= x2 + width2) return 0
	if(y1 >= y2 + height2) return 0
	if(x2 >= x1 + width1) return 0
	if(y2 >= y1 + height1) return 0
	return 1
}

var gPointInRect = (pointX, pointY, x,y,sizeX,sizeY) => gRectsHit(pointX,pointY,1,1, x,y,sizeX,sizeY)

var gMouseDownOnBox = (x,y,sizeX,sizeY) => {
	if(gin.clicking && gRectsHit(gin.clickStartX,gin.clickStartY,1,1, x,y,sizeX,sizeY)) {
		return 1
	}
}

var gMouseOnBox = (x,y,sizeX,sizeY) => {
	if(gRectsHit(gin.mouseX,gin.mouseY,1,1, x,y,sizeX,sizeY)) {
		return 1
	}
}

function gAngleTo(x, y, targetX, targetY) {
	var angle = Math.atan2(targetY-y, targetX-x)
	return angle
}

