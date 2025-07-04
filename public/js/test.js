//Global Variables

var canvas, ctx;
var base_url = window.location.origin;
//Canvas Variables
var canvas, ctx;
var mouseX, mouseY, mouseDown = 0;
var touchX, touchY;

var base_url = window.location.origin;

const aksara = ["ha/a", "na", "ca", "ra", "ka", "da", "ta", "sa", "wa", "la", "ma", "ga", "ba", "nga", "pa", "ja", "ya", "nya", "ulu", "suku", "taling", "tedong", "pepet"];
var rand = null;
//console.log(aksara);

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

document.getElementById('generate-aksara').addEventListener("click", async function () {

    rand = getRndInteger(0, 22);

    const tempAksara = aksara[rand];

    document.getElementById('aksara-heading').innerHTML = tempAksara;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.getElementById('result').innerHTML = "-";
    document.getElementById('confidence').innerHTML = "-";

});

function draw(ctx, x, y, size, isDown) {

    if (isDown) {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = '5';
        ctx.lineJoin = ctx.lineCap = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
    }
    lastX = x; lastY = y;

}

document.getElementById('clear-canvas').addEventListener("click", function () {
    console.log('clear clicked');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById('result').innerHTML = "-";
    document.getElementById('confidence').innerHTML = "-";
});

function sketchpad_mouseDown() {
    mouseDown = 1;
    draw(ctx, mouseX, mouseY, 12, false);
}

function sketchpad_mouseUp() {
    mouseDown = 0;
}

function sketchpad_mouseMove(e) {

    getMousePos(e);
    if (mouseDown == 1) {
        draw(ctx, mouseX, mouseY, 12, true);
    }
}

function getMousePos(e) {
    if (!e)
        var e = event;

    if (e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
    else if (e.layerX) {
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
}

function sketchpad_touchStart() {

    getTouchPos();
    draw(ctx, touchX, touchY, 12, false);
    event.preventDefault();
}

function sketchpad_touchMove(e) {

    getTouchPos(e);
    draw(ctx, touchX, touchY, 12, true);
    event.preventDefault();
}

function getTouchPos(e) {
    if (!e)
        var e = event;

    if (e.touches) {
        if (e.touches.length == 1) {
            var touch = e.touches[0];
            touchX = touch.pageX - touch.target.offsetLeft;
            touchY = touch.pageY - touch.target.offsetTop;
        }
    }
}

function init() {

    canvas = document.getElementById('canvas-box');
    ctx = canvas.getContext('2d');
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (ctx) {

        canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
        canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
        window.addEventListener('mouseup', sketchpad_mouseUp, false);

        canvas.addEventListener('touchstart', sketchpad_touchStart, false);
        canvas.addEventListener('touchmove', sketchpad_touchMove, false);
    }

    // Initialize feedback popup
    initializeFeedbackPopup();
}

// Model Loader
var model;
(async function () {
    console.log("Model Loading.....");
    model = await tf.loadLayersModel("cnn_model/modeljs/model.json");
    console.log("Model Loaded.....");

})();

function preprocessCanvas(image) {
    // resize the input image to target size of (1, 28, 28)
    let tensor = tf.browser.fromPixels(image,1)
        .resizeNearestNeighbor([32, 32])
        .mean(2)
        .expandDims(2)
        .expandDims()
        .toFloat();
    console.log(tensor.shape);
    //tensor.print();
    // tf.reshape(tensor, shape)
    return tensor.div(255.0);
}

document.getElementById('predict-canvas').addEventListener("click", async function () {

    console.log('predict clicked');
    var imageData = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");;
    //console.log(imageData);

    let tensor = preprocessCanvas(canvas);

    let predictions = await model.predict(tensor).data();

    let results = Array.from(predictions);

    //console.log(results);

    displayLabel(results);

    console.log(results);

});

//Display chart with updated drawing from canvas

function displayLabel(data) {
    var max = data[0];
    var maxIndex = 0;

    for (var i = 1; i < data.length; i++) {
        if (data[i] > max) {
            maxIndex = i;
            max = data[i];
        }
    }
    
    var isCorrect = rand === maxIndex;
    var hasil = isCorrect ? "benar" : "salah";

    console.log(maxIndex);
    document.getElementById('result').innerHTML = aksara[maxIndex];
    document.getElementById('confidence').innerHTML = "Akurasi: " + (max * 100).toFixed(3) + "%";
    
    // Update confidence bar
    const confidenceFill = document.getElementById('confidence-fill');
    if (confidenceFill) {
        confidenceFill.style.width = (max * 100) + '%';
    }
    
    // Show feedback popup
    showFeedbackPopup(isCorrect, aksara[rand], aksara[maxIndex], (max * 100).toFixed(1));
}

// Feedback Popup Functions
function initializeFeedbackPopup() {
    const popup = document.getElementById('result-feedback-popup');
    const closeBtn = document.getElementById('close-feedback-btn');
    const nextBtn = document.getElementById('next-challenge-btn');
    
    console.log('Initializing feedback popup...');
    console.log('Popup element:', popup);
    console.log('Close button:', closeBtn);
    console.log('Next button:', nextBtn);
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            hideFeedbackPopup();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next button clicked');
            hideFeedbackPopup();
            // Generate new challenge
            document.getElementById('generate-aksara').click();
        });
    }
    
    // Close popup when clicking outside
    if (popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                console.log('Clicked outside popup');
                hideFeedbackPopup();
            }
        });
    }
}

function showFeedbackPopup(isCorrect, targetAksara, userAksara, accuracy) {
    const popup = document.getElementById('result-feedback-popup');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const message = document.getElementById('feedback-message');
    const targetElement = document.getElementById('target-aksara');
    const userElement = document.getElementById('your-aksara');
    const accuracyElement = document.getElementById('accuracy-value');
    
    console.log('Showing feedback popup...');
    console.log('Is correct:', isCorrect);
    console.log('Target aksara:', targetAksara);
    console.log('User aksara:', userAksara);
    console.log('Accuracy:', accuracy);
    
    if (isCorrect) {
        popup.classList.add('success');
        popup.classList.remove('error');
        icon.className = 'fas fa-check-circle';
        title.textContent = 'Selamat!';
        message.textContent = 'Anda berhasil menulis aksara dengan benar!';
    } else {
        popup.classList.add('error');
        popup.classList.remove('success');
        icon.className = 'fas fa-times-circle';
        title.textContent = 'Coba Lagi!';
        message.textContent = 'Aksara yang Anda tulis belum tepat. Terus berlatih!';
    }
    
    targetElement.textContent = targetAksara;
    userElement.textContent = userAksara;
    accuracyElement.textContent = accuracy + '%';
    
    popup.classList.add('show');
    console.log('Popup should be visible now');
}

function hideFeedbackPopup() {
    const popup = document.getElementById('result-feedback-popup');
    popup.classList.remove('show');
    console.log('Popup hidden');
} 