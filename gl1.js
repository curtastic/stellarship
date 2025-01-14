"use strict"
/*
	gl1.js
	A webGL 2D graphics library.
	Designed and optimized for 2D web games where all the graphics fit into 1 PNG.
	Features:
	- Real time rotation, without slowdown.
	- Real time semi-transparent drawing, without slowdown.
	- Real time color tinting/brightening, without slowdown.
	- Renders 50,000 moving images with real time rotation, tinting, and transparency at 60FPS on an old iPhone SE 2015.
	- Works like a regular canvas where you draw images in the order you want. When you want to remove something, simply stop drawing it.
	- You can pass in a canvas instead of a PNG, alter the pixels of your canvas, and reload it into webGL's texture quickly.
	- Supports old devices/browsers including IE11 and iOS9.
	- Only 4KB minified.
	Does not include:
	- No hue-shift effect, blur effects, or Skew/3D effects.
	- No rotate about a point that isn't the image's center. But you can do that with your own math before passing drawX/drawY.
	- No camera object. But you can offset things yourself if you want scrolling.
	- No drawing other primitive shapes besides images and rectangles.
	- No font or svg support.
*/

var gl1 = {
	// Max amount of images on the screen at the same time. You can set this to any number, it's just the array size.
	maxDraws: 10000,
	// Internal count of images drawn so far this frame.
	draws: 0,
	// Set these to transform.
	scale: 1,
	offsetX: 0,
	offsetY: 0,
	clipX: 0,
	clipX2: 0,
	clipY: 0,
	clipY2: 0,
	// Global rotation about the center of the screen. Radians. Not perfect.
	shake: 0,
	// Global alpha. Is multiplied with the passed in rgba.
	alpha: 255,
	// texPart is what rectangular part of your big PNG you want to draw right now. In pixels.
	// drawX/drawY is a pixel position on the screen where 0,0 is top left of the screen, and the top left of the image.
	// sizeX/sizeY is the size in pixels you want to draw at. If you don't want to scale, it should be the same as texPartSizeX/texPartSizeY.
	// rgba is optional. You can tint the image for example to green by passing 0x00FF007F.
	//  rgba alpha goes from 0 to 127 (0x7F) where 127 is not transparent at all. Higher than 127 will brighten the image more than normal.
	// rotation is optional. In radians. Negative is allowed. Rotated about its center.
	drawImage: function(texPartX, texPartY, texPartSizeX, texPartSizeY, drawX, drawY, sizeX, sizeY, rgba, rotation) {
		
		drawX += this.offsetX
		drawY += this.offsetY
		
		var i = this.draws * 6
		
		// Store rgba after position/texture.
		if(rgba >= 0) {
			if(this.alpha == 255) {
				this.rgbas[i+4] = rgba
			} else {
				var a = rgba%256
				rgba -= a
				if(this.alpha > 255) {
					this.rgbas[i+4] = rgba + (this.alpha>>1)
				} else {
					if(a>127)a=127
					this.rgbas[i+4] = rgba + a*this.alpha/255 | 0
				}
			}
		} else {
			// Default to white and fully opaque.
			this.rgbas[i+4] = 0xFFFFFF00 + (this.alpha >> 1)
		}
		
		// Store how rotated we want this image to be.
		this.rotations[i+5] = (rotation || 0) + this.shake
		
		// Use a local variable so it's faster to access.
		var positions = this.positions
		
		// Positions array is 2-byte shorts not 4-byte floats so there's twice as many slots.
		i *= 2
		
		//
		if(this.clipX2 > this.clipX) {
			if(drawX+sizeX < this.clipX)return
			if(drawX > this.clipX2)return
			if(drawX+sizeX > this.clipX2) {
				if(texPartX || texPartY) {
					texPartSizeX *= (this.clipX2 - drawX) / sizeX
				}
				sizeX = this.clipX2 - drawX
			}
			if(drawX < this.clipX) {
				var add = this.clipX - drawX
				var sizeX0 = sizeX
				sizeX -= this.clipX - drawX
				drawX = this.clipX
				if(texPartX || texPartY) {
					add *= texPartSizeX / sizeX0
					texPartX += add
					texPartSizeX -= add
				}
			}
		}
		
		//
		if(this.clipY2 > this.clipY) {
			var size = sizeY
			if(rotation==1 || rotation==3) {
				size = sizeY
			}
			if(drawY+size < this.clipY)return
			if(drawY > this.clipY2)return
			if(drawY+size > this.clipY2) {
				if(texPartX || texPartY) {
					if(rotation==1 || rotation==3) {
						texPartSizeX *= (this.clipY2 - drawY) / size
					} else {
						texPartSizeY *= (this.clipY2 - drawY) / size
					}
				}
				if(rotation==1 || rotation==3) {
					sizeX = this.clipY2 - drawY
				} else {
					sizeY = this.clipY2 - drawY
				}
			}
			if(drawY < this.clipY) {
				var add = this.clipY - drawY
				var sizeY0 = sizeY
				sizeY -= this.clipY - drawY
				drawY = this.clipY
				if(texPartX || texPartY) {
					add *= texPartSizeY / sizeY0
					texPartY += add
					texPartSizeY -= add
				}
			}
		}
		
		// Store where we want to draw the image.
		positions[i  ] = drawX * this.scale
		positions[i+1] = drawY * this.scale
		positions[i+2] = sizeX * this.scale
		positions[i+3] = sizeY * this.scale


		if(this.shake) {
			var midx = this.canvasSizeX/this.scale / 2
			var midy = this.canvasSizeY/this.scale / 2
			for(var addi=0; addi<4; addi+=2) {
				var distx = positions[i  ]-midx
				var disty = positions[i+1]-midy
				var atan = Math.atan2(disty, distx)
				var dist = Math.sqrt(distx*distx + disty*disty)
				positions[i  ] = midx + Math.cos(atan+this.shake)*dist | 0
				positions[i+1] = midy + Math.sin(atan+this.shake)*dist | 0
			}
		}
		
		// Store what portion of our PNG we want to draw.
		positions[i+4] = texPartX
		positions[i+5] = texPartY
		positions[i+6] = texPartSizeX
		positions[i+7] = texPartSizeY
		
		this.draws++
	},
	// A handy function for when you want to draw rectangles. For example debugging hitboxes, or to darken everything with semi-transparent black overlay.
	// This assumes the top left pixel in your texture is white, so you can stretch/tint it to any size/color rectangle.
	rectDraw: function(drawX, drawY, sizeX, sizeY, rgba, rotation) {
		this.drawImage(0, 0, 1, 1, drawX, drawY, sizeX, sizeY, rgba, rotation)
	},
	// Call this every frame to actually draw everything onto your canvas. Renders all drawImage calls since the last time you called render.
	render: function() {
		var gl = this.gl
		
		// Clear the canvas.
		gl.clear(gl.COLOR_BUFFER_BIT)
		
		// Only send to gl the amount slots in our arrayBuffer that we used this frame.
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.rgbas.subarray(0, this.draws*6))
		
		// Draw everything. 6 is because 2 triangles make a rectangle.
		this.extension.drawElementsInstancedANGLE(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0, this.draws)
		
		// Go back to index 0 of our arrayBuffer, since we overwrite its slots every frame.
		this.draws = 0
	},
	// Call gl1.resize() after your canvas resizes.
	resize: function() {
		var gl = this.gl

		this.canvasSizeX = this.canvas.width
		this.canvasSizeY = this.canvas.height
		
		// Resize the gl viewport to be the new size of the canvas.
		gl.viewport(0, 0, this.canvasSizeX, this.canvasSizeY)
		
		// Update the shader variables for canvas size.
		// Sending it to gl now so we don't have to do the math in JavaScript on every draw,
		// since gl wants to draw at a position from 0 to 1, and we want to do drawImage with a screen pixel position.
		gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "uCanvasSize"), this.canvasSizeX/2, this.canvasSizeY/2)
	},
	setup: function(canvas, texFileName) {
		// Get the canvas/context from html.
		this.canvas = canvas
		var gl = canvas.getContext('experimental-webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true })
		this.gl = gl
		
		// This extension allows us to repeat the draw operation 6 times (to make 2 triangles) on the same 12 slots in this.positions,
		//  so we only have to put the image data into this.positions once for each image each time we want to draw an image.
		var extension = gl.getExtension('ANGLE_instanced_arrays')
		this.extension = extension
		
		// Set the gl canvas background color. Sky blue.
		gl.clearColor(0.5, 0.7, 1.0, 1)
		
		// Vertex shader source code.
		// Each time we draw an image it will run this 6 times. Once for each point of the 2 triangles we use to make the image's rectangle area.
		// The only thing that changes on each repeated draw for the same image is aSizeMult, so we can get to each corner of the image's rectangle area.
		var vertCode = "\
			attribute vec2 aSizeMult;\
			attribute vec2 aPos;\
			attribute vec2 aSize;\
			attribute vec4 aTexPos;\
			attribute vec4 aRgba;\
			attribute float aRotation;\
			\
			varying highp vec2 fragTexturePos;\
			varying vec4 fragAbgr;\
			\
			uniform vec2 uCanvasSize;\
			uniform vec2 uTexSize;\
			\
			void main(void){\
				vec2 drawPos;\
				if(aRotation != 0.0){\
					vec2 cornerPos = aSize * aSizeMult;\
					if(aRotation == 1.0){\
						drawPos = (aPos + vec2(-cornerPos.y, cornerPos.x) + vec2(aSize.y,0.0)) / uCanvasSize;\
					}else if(aRotation == 2.0){\
						drawPos = (aPos + vec2(-cornerPos.x, -cornerPos.y) + aSize) / uCanvasSize;\
					}else if(aRotation == 3.0){\
						drawPos = (aPos + vec2(cornerPos.y, -cornerPos.x) + vec2(0.0,aSize.x)) / uCanvasSize;\
					}else{\
						float goX = cos(aRotation);\
						float goY = sin(aRotation);\
						vec2 cornerPos = aSize * (aSizeMult-0.5);\
						drawPos = (aPos + vec2(goX*cornerPos.x - goY*cornerPos.y, goY*cornerPos.x + goX*cornerPos.y) + aSize/2.0) / uCanvasSize;\
					}\
				}else{\
					drawPos = (aPos + aSize*aSizeMult) / uCanvasSize;\
				}\
				gl_Position = vec4(drawPos.x - 1.0, 1.0 - drawPos.y, 0.0, 1.0);\
				fragTexturePos = (aTexPos.xy + aTexPos.zw * aSizeMult) / uTexSize;\
				if(aRgba.x > 127.0){\
					float colorMult = pow(2.0, (aRgba.x-127.0)/16.0) / 255.0;\
					fragAbgr = vec4(aRgba.w*colorMult, aRgba.z*colorMult, aRgba.y*colorMult, 1.0);\
				}else\
					fragAbgr = vec4(aRgba.w/255.0, aRgba.z/255.0, aRgba.y/255.0, aRgba.x/127.0);\
			}\
		"

		// Create a vertex shader object with code.
		var vertShader = gl.createShader(gl.VERTEX_SHADER)
		gl.shaderSource(vertShader, vertCode)
		gl.compileShader(vertShader)

		// Fragment shader source code.
		var fragCode = "\
			varying highp vec2 fragTexturePos;\
			varying highp vec4 fragAbgr;\
			uniform sampler2D uSampler;\
			\
			void main(void){\
				gl_FragColor = texture2D(uSampler, fragTexturePos) * fragAbgr;\
			}\
		"
		
		// Create fragment shader object with code.
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER)
		gl.shaderSource(fragShader, fragCode)
		gl.compileShader(fragShader)

		// Create a shader program object and attach the shaders.
		var shaderProgram = gl.createProgram()
		gl.attachShader(shaderProgram, vertShader)
		gl.attachShader(shaderProgram, fragShader)
		gl.linkProgram(shaderProgram)
		gl.useProgram(shaderProgram)
		this.shaderProgram = shaderProgram
		
		// Tell gl that when we set the opacity, it should be semi transparent above what was already drawn.
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.enable(gl.BLEND)
		gl.disable(gl.DEPTH_TEST)
		
		// Map triangle vertexes to our multiplier array, for which corner of the image drawn's rectangle each triangle point is at.
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2, 2, 1, 3]), gl.STATIC_DRAW)

		// Our multiplier array for sizeX/sizeY so we can get to each corner of the image drawn.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 0,1, 1,0, 1,1]), gl.STATIC_DRAW)

		// Size multiplier vec2 variable. This code goes here so that it's linked to the Float32Array above, using those values.
		var attribute = gl.getAttribLocation(shaderProgram, "aSizeMult")
		gl.enableVertexAttribArray(attribute)
		gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)

		// Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for position (drawX,drawY)
		var shortsPerImagePosition = 2
		// Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for size (sizeX,sizeY)
		var shortsPerImageSize = 2
		// Whenever we call our drawImage(), we also store 4 shorts into our arrayBuffer (texX,texY,texSizeX,texSizeY)
		var shortsPerImageTexPos = 4
		// Whenever we call our drawImage(), we also store 4 bytes into our arrayBuffer (r,g,b,a) for color and alpha.
		var bytesPerImageRgba = 4
		// Whenever we call our drawImage(), we also put a float for rotation.
		var floatsPerImageRotation = 1
		
		// Total bytes stored into arrayBuffer per image = 24
		var bytesPerImage = shortsPerImagePosition*2 + shortsPerImageSize*2 + shortsPerImageTexPos*2 + bytesPerImageRgba + floatsPerImageRotation*4
		
		// Make a buffer big enough to have all the data for the max images we can show at the same time.
		var arrayBuffer = new ArrayBuffer(this.maxDraws * bytesPerImage)
		
		// Make 3 views on the same arrayBuffer, because we store 3 data types into this same byte array.
		// When we store image positions/UVs into our arrayBuffer we store them as shorts (int16's)
		this.positions = new Int16Array(arrayBuffer)
		// When we store image rotation into our arrayBuffer we store it as float, because it's radians.
		this.rotations = new Float32Array(arrayBuffer)
		// When we store image rgbas into our arrayBuffer we store it as 1 4-byte int32.
		this.rgbas = new Uint32Array(arrayBuffer)
		
		// Make the gl vertex buffer and link it to our arrayBuffer. Using DYNAMIC_DRAW because these change as images move around the screen.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.DYNAMIC_DRAW)
		
		var byteOffset = 0
		
		// Tell gl where read from our arrayBuffer to set our shader attibute variables each time an image is drawn.
		var setupAttribute = function(name, dataType, amount) {
			var attribute = gl.getAttribLocation(shaderProgram, name)
			gl.enableVertexAttribArray(attribute)
			gl.vertexAttribPointer(attribute, amount, dataType, false, bytesPerImage, byteOffset)
			extension.vertexAttribDivisorANGLE(attribute, 1)
			if(dataType == gl.SHORT)
				amount *= 2
			if(dataType == gl.FLOAT)
				amount *= 4
			byteOffset += amount
		}
		
		// Tell gl that each time an image is drawn, have it read 2 array slots from our arrayBuffer as short, and store them in the vec2 I made "aPos"
		setupAttribute("aPos", gl.SHORT, shortsPerImagePosition)
		
		// Then read the next 2 array slots and store them in my vec2 "aSize"
		setupAttribute("aSize", gl.SHORT, shortsPerImageSize)
		
		// Then read the next 4 array slots and store them in my vec4 "aTexPos"
		setupAttribute("aTexPos", gl.SHORT, shortsPerImageTexPos)
		
		// Then read the next 4 bytes and store them in my vec4 "aRgba"
		setupAttribute("aRgba", gl.UNSIGNED_BYTE, bytesPerImageRgba)
		
		// Then read the next 4 bytes as 1 float and store it in my float "aRotation"
		setupAttribute("aRotation", gl.FLOAT, floatsPerImageRotation)
		
		// Load the texture image.
		if(texFileName) {
			var image = new Image()
			var gl1 = this
			image.onload = function() {
				gl1.ready = true
				gl1.loadTexFromJsImage(image)
			}
			image.src = texFileName
		}
	},
	// This is a separate function so that you can call it again mid-game to change the artwork if you load a new image or canvas.
	loadTexFromJsImage: function(image) {
		var gl = this.gl
		
		this.jsImage = image
		
		// Create a gl texture from image file.
		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
		gl.generateMipmap(gl.TEXTURE_2D)
		gl.activeTexture(gl.TEXTURE0)
		
		// Tell gl that when draw images scaled up, keep it pixellated and don't smooth it.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		
		// Store texture size in vertex shader.
		this.texSizeX = image.width
		this.texSizeY = image.height
		gl.uniform2f(gl.getUniformLocation(this.shaderProgram, "uTexSize"), this.texSizeX, this.texSizeY)
		
		this.resize()
		if(this.ready) {
			this.canvas.style.display = 'block'
		}
	}
}


gl1.imageDraw = function(image, x, y, sizeX, sizeY, flipX, flipY, rot) {
	if(!image)debugger
	sizeX = sizeX||image.sizeX
	sizeY = sizeY||image.sizeY
	if(flipX) {
		x += sizeX
		sizeX *= -1
	}
	if(flipY) {
		y += sizeY
		sizeY *= -1
	}
	if(rot) {
		//x += image.sizeY/2*sin + (1 - cos)*image.sizeX/2
		//y += image.sizeX/2*-sin - (1 - cos)*image.sizeY/2
		if(rot == -1) {
			rot*=-1
			x += image.sizeX/2 + image.sizeY/2
			y += -image.sizeX/2 + image.sizeY/2
		} else if(rot == -2) {
			rot*=-1
			x += image.sizeX
			y += image.sizeY
		} else if(rot == -3) {
			rot*=-1
			x += image.sizeX/2 - image.sizeY/2
			y += image.sizeX/2 + image.sizeY/2
		} else if(rot == -4) {
			rot = 0
			x -= image.sizeX/2
			y -= image.sizeY/2
		} else {
			if(rot!=1 && rot!=2 && rot!=3)
				rot*=Math.PI/2
		}
	}
	gl1.drawImage(image.texX, image.texY, image.sizeX, image.sizeY, x, y, sizeX, sizeY, image.rgb, rot)
}

gl1.imageMake = function(texX, texY, sizeX, sizeY) {
	if(!sizeY)debugger
	
	var image = {}
	image.texX = texX
	image.texY = texY
	image.sizeX = sizeX
	image.sizeY = sizeY
	image.rgb = 0xFFFFFF7F
	return image
}
