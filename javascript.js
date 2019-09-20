var importedVideos = [

];

var timeline = [

];

var player = {
	fps: 30,
	loop: 0,
	playing: false,
	currentClip: 0,
	currentDragging: 0
}

var mouse = {
	playerX: 0,
	playerY: 0,
	down: false,
	offsetX: 0,
	offsetY: 0,
	lastClicked: 0,
	dragginga: ""
}


var currentVideoData = [];
var currentFrame = 0;

// Clock loop
setInterval(function() {
	mouse.lastClicked++
}, 1);

// Load Video, and process it into frames
var uploadProgress = "";
function uploadFile() {
	var input = document.createElement("input");
	input.type = "file";
	input.click();
	var videoData = [];

	// Begin processing video contents
	input.onchange = function() {
		var file = URL.createObjectURL(input.files[0]);
		var video = document.createElement("video");
		video.id = "video";
		video.src = file;
		document.getElementById('video').appendChild(video);

		document.getElementById('loadingStuff').style.display = "block";

		// Wait for video to finish loading
		video.addEventListener("loadedmetadata", function() {
			video.addEventListener("loadeddata",function() {

				var text = document.getElementById('progresstext');
				progress = "Video uploaded, importing it...";
				text.innerHTML = progress;

				var length = Math.floor(video.duration);
				var wide = video.videoWidth;
				var high = video.videoHeight;

				var fps = Number(document.getElementById('fps').value);
				var framesToProcess = length * fps;

				var canvas = document.createElement("canvas");
				var c = canvas.getContext("2d");
				currentVideoData = [];

				video.currentTime = 0;

				var quality = document.getElementById('quality').value;
				var videoQuality = wide;
				var downgrade = videoQuality
				if (quality == "480p") {
					downgrade = 480;
				} else if (quality == "240p") {
					downgrade = 240;
				}

				var newDowngrade = videoQuality / (videoQuality / downgrade);
				var scale = videoQuality / newDowngrade; // Ex 1.5, 2.25

				canvas.width = video.videoWidth / scale;
				canvas.height = video.videoHeight / scale;

				// Timeout to make sure video loaded
				setTimeout(function() {
					var i = 0;
					var ready = true;
					var loop = setInterval(function() {
						if (i == framesToProcess) {
							importedVideos.push({
								video: video,
								width: wide,
								hight: high,
								fps: fps,
								videoData: currentVideoData,
							});

							progress = "Finished";
							text.innerHTML = progress;
							startPreview();

							var slider = document.getElementById('slider');
							slider.max = framesToProcess - 1;

							clearInterval(loop);
						} else {
							if (ready) {
								drawFrame(video, canvas, function() {
									addFrame(canvas, function() {
										video.currentTime += (1 / fps);
									});
								});

								ready = false;
								video.addEventListener('timeupdate', function () {
									ready = true;
								});

								progress = "Converting frames... " + Math.floor((i + 1) / framesToProcess * 100) + "% Done"
								text.innerHTML = progress;

								i++
							}
						}
					}, 1);

				}, 100);
			});
		});
	}
};

// Callback functions (to prevent lagging)
function drawFrame(video, canvas, callback) {
	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
	callback();
}

function addFrame(canvas, callback) {
	currentVideoData.push(canvas.toDataURL());
	callback();
}

function nextFrame(video, fps, callback) {
	video.currentTime += (1 / fps);
	video.ontimeupdate = function() {
		callback();
	}
}

// Turn on the preview editor
function startPreview() {
	var canvas = document.getElementById('canvas');
	var c = canvas.getContext("2d");
	player.currentClip = 0;

	timeline.push([
		importedVideos[0],
		{
			resize:[480, 240],
			move:[40, 40],
			text:[["Hello, World!", 50, 100, {
				color: "white",
				size: "20"
			}]]
		}
	]);
	var mainVideo = timeline[player.currentClip][0];
	var videoEdits = timeline[player.currentClip][1];

	setInterval(function() {
		currentFrame = document.getElementById('slider').value;
		player.fps = mainVideo.fps;

		// Edit the video and draw on the final product
		var image = new Image();
		image.onload = function() {
			var x = 0;
			var y = 0;
			var resizeX = canvas.width;
			var resizeY = canvas.height;

			if (!videoEdits["move"] == false) {
				x = videoEdits.move[0];
				y = videoEdits.move[1];
			}

			if (!videoEdits["resize"] == false) {
				resizeX = videoEdits.resize[0];
				resizeY = videoEdits.resize[1];
			}

			c.clearRect(0, 0, canvas.width, canvas.height);
			c.drawImage(image, x, y, resizeX, resizeY);

			if (mouseIsOn(mouse.playerX, mouse.playerY, x, y, resizeX, resizeY)) {
				c.lineWidth = 3;
				c.strokeStyle = "black";
				c.strokeRect(x, y, resizeX, resizeY);


				if (mouse.down || mouse.dragging == "video" && mouse.dragging == false) {

						if (!mouse.dragging) {
							mouse.dragging = "video";
							mouse.offsetX = timeline[player.currentClip][1].move[0] - mouse.playerX;
							mouse.offsetY = timeline[player.currentClip][1].move[1] - mouse.playerY;
						}

						// Set the elements X and Y to mouse
						timeline[player.currentClip][1].move = [mouse.playerX + mouse.offsetX, mouse.playerY + mouse.offsetY];
						console.log(mouse.offsetX, mouse.offsetY)

						if (!mouse.down) {
							mouse.dragging = false;
						}
					} else {
						mouse.dragging = false
					}
					c.strokeRect(x1, y1, x2, y2);
					c.strokeStyle = "black";
				}

			// Font Styles
			if (!videoEdits["text"] == false) {
				for (var i = 0; i < videoEdits.text.length; i++) {
					if (videoEdits.text[i][3]["color"]) {
						c.fillStyle = videoEdits.text[i][3].color;
					}

					if (videoEdits.text[i][3]["size"]) {
						c.font = videoEdits.text[i][3].size + "px Arial";
					} else {
						c.font = "12px Times New Roman";
					}

					c.fillText(videoEdits.text[i][0], videoEdits.text[i][1], videoEdits.text[i][2])
				}
			}

			// Draw editor
			var textElements = videoEdits.text;

			for (var i = 0; i < textElements.length; i++) {
				var textWidth = c.measureText(textElements[i][0]).width;

				var fontSize = 12;
				if (!textElements[i][3].size == false) {
					fontSize = textElements[i][3].size;
				}

				// Make text elements draggable (create size and detect if mouse is over it)
				c.font = fontSize + "px Arial";
				var x1 = (textElements[i][1]) - 2;
				var y1 = (textElements[i][2] - fontSize + 3) - 2;
				var x2 = textWidth + 4;
				var y2 = Number(fontSize) + 4;

				if (mouseIsOn(mouse.playerX, mouse.playerY, x1, y1, x2, y2) || mouse.dragging == "text") {
					if (mouse.down || mouse.dragging) {
						c.strokeStyle = "grey";

						if (!mouse.dragging) {
							mouse.dragging = "text";
							mouse.offsetX = timeline[player.currentClip][1].text[i][1] - mouse.playerX;
							mouse.offsetY = timeline[player.currentClip][1].text[i][2] - mouse.playerY;

							if (mouse.lastClicked < 50) {
								// Double Click menu
							}
							mouse.lastClicked = 0;
						}

						// Set the elements X and Y to mouse
						timeline[player.currentClip][1].text[i][1] = mouse.playerX + mouse.offsetX;
						timeline[player.currentClip][1].text[i][2] = mouse.playerY + mouse.offsetY;
						console.log(mouse.offsetX, mouse.offsetY)

						if (!mouse.down) {
							mouse.dragging = false;
						}
					} else {
						c.strokeStyle = "white";
						mouse.dragging = false
					}
					c.strokeRect(x1, y1, x2, y2);
					c.strokeStyle = "black";
				}
			}
		}
		image.src = mainVideo.videoData[currentFrame];
	}, 1);
}

// Function to play video
function play() {
	var slider = document.getElementById('slider');
	var playButton = document.getElementById('play');

	if (player.playing == true) {
		playButton.innerHTML = "Play";
		player.playing = false;
		clearInterval(player.loop);
		player.loop = "0";
	} else {
		playButton.innerHTML = "Stop";
		player.playing = true;
		player.loop = "1";

		player.loop = setInterval(function() {
			if (slider.value !== slider.max && player.playing) {
				slider.value++
				player.playing = true;

			} else {
				slider.value = "0";
				clearInterval(player.loop);
				player.playing = false;
			}
		}, player.fps);
	}
}

function playerMouse(event) {
	var offset = document.getElementById('canvas').getBoundingClientRect();
	mouse.playerX = event.clientX - offset.left;
	mouse.playerY = event.clientY;
}

function mouseIsOn(x, y, x2, y2, width, height) {
	if (x > x2 && x < x2 + width &&  y < y2 + height && y > y2) {
		//console.log(true);
		return true
	} else {
		//console.log(false);
		return false
	}
}