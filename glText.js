var glText = {
	letters: `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`,
	iconsByName: {},
	iconsByCode: {},
	letterImages: [],
	setup: function() {
		var x=0, y=212
		for(var i=0; i<this.letters.length; i++) {
			var letter = this.letters[i]
			this.letterImages[letter.charCodeAt(0)] = gl1.imageMake(x, y, 20, 14)
			x += 20
			if(x > 234) {
				x = 0
				y += 15
			}
		}
	},
	iconAdd: function(name, imageOrX, y, sizeX, sizeY) {
		var code = String.fromCharCode(226+Object.keys(this.iconsByName).length)
		var icon = {code}
		if(imageOrX.sizeX) {
			icon.image = imageOrX
			icon.offsetY = y||-1
			icon.sizeX = imageOrX.sizeX
			icon.sizeY = imageOrX.sizeY
		} else {
			icon.image = gl1.imageMake(imageOrX,y,sizeX,sizeY)
			icon.sizeX = sizeX
			icon.sizeY = sizeY
			icon.offsetY = -1
		}
		this.iconsByCode[code] = this.iconsByName[name.toUpperCase()] = icon
	},
	letterSizeXget: function(letter, scale) {
		size = this.letterSizeXBaseGet(letter)
		return Math.ceil(size*scale)
	},
	letterSizeXBaseGet: function(letter) {
		var icon = this.iconsByCode[letter]
		if(icon) {
			return icon.sizeX
		}
		return 20
	},
	sizeXGet: function(text, scale, convertedAlready) {
		text = text+''
		if(!convertedAlready) {
			text = this.iconsConvert(text)
		}
		scale = scale || 1
		var spacing = -scale*7
		var x = 0
		for(var i=0; i<text.length; i++)
		{
			var letter = text.charAt(i)
			var size = this.letterSizeXget(letter, scale)
			x += size+spacing|0
		}
		
		return x|0
	},
	iconsConvert: function(text) {
		text = text.toUpperCase()
		for(var name in this.iconsByName) {
			text = text.replaceAll('['+name+']', this.iconsByName[name].code)
		}
		return text
	},
	draw: function(text, x, y, scale, center, rgb, rgbfix) {
		text = text+''
		x = ~~x
		y = ~~y
		scale = scale || 1
		text = this.iconsConvert(text)
		
		var texts = text.split('\n')
		var startX = x
		if(center == 2) {
			y -= 7*Math.floor(scale)*texts.length | 0
		}
		
		rgb = rgb || 0xFFFFFF7F
		for(var text of texts) {
			var rgbnow = rgb
			
			var iconyadd = scale*3-5 | 0
			
			if(center) {
				this.drawSizeX = this.sizeXGet(text,scale,1)+scale*4
				x -= this.drawSizeX/(center==3 ? 1: 2) | 0
			}
			
			for(var i=0; i<text.length; i++) {
				var letter = text.charAt(i)
				var code = letter.charCodeAt(0)
				var image = this.letterImages[code]
				var addy = 0
				if(image) {
					image.rgb = rgbnow
					if(letter == ',')addy=3
					if(scale != 1) {
						gl1.imageDraw(image, x-(letter=='j')*3*scale, y+addy, image.sizeX*(scale), image.sizeY*(scale))
					} else
						gl1.imageDraw(image, x, y+addy)
				} else {
					var icon = this.iconsByCode[letter]
					if(icon) {
						icon.image.rgb = rgbnow
						gl1.imageDraw(icon.image, x, (y+icon.offsetY)*scale, icon.sizeX*scale, icon.sizeY*scale)
					}
				}
				x += (this.sizeXGet(letter,scale,1)) | 0
			}
			this.drawX = x
			y += 16*scale | 0
			x = startX
		}
	}
}