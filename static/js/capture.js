// Taken and modified from https://raw.githubusercontent.com/mdn/samples-server/master/s/webrtc-capturestill/capture.js

(function() {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 2056;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null;
//  var startbutton = null;

  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');

    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function(err) {
      console.log("An error occurred: " + err);
    });

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
          height = width / (4/3);
        }

        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }

  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);

      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", '/', true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send(`image=${data}`);
      var body = xhttp.response;
	  xhttp.onreadystatechange = function() {
	    if (xhttp.readyState == XMLHttpRequest.DONE) {
	      console.log(xhttp.responseText)
	      var cards = JSON.parse(xhttp.responseText);
	      if ( cards !== "No card images found") {
		    console.log(cards["cards"])
		    renderimages(cards["cards"])
		  }
	    }
      }
    } else {
      clearphoto();
    }
  }

  function renderimages(cards) {

    var container = document.getElementById('imageContainer');
    var docFrag = document.createDocumentFragment();
    if ( cards.length > 0 ) {
   		cards.forEach(function(cur, index, arr) {
    	  var img = document.createElement('img');
    	  img.src = cur["image_url"];
    	  docFrag.appendChild(img);
    	});
    	try {
		  while (container.firstChild) {
			container.removeChild(container.firstChild);
		  }
    	}
    	catch(error) {
    		console.log("Probably wasn't there to begin with")
    	}
    	container.appendChild(docFrag);
    }

  }

  // Take a picture every five seconds to send to Flask
  setInterval(takepicture, 5000)

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);


})();