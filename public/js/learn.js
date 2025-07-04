//Global Variables

var canvas, ctx;
var base_url = window.location.origin;
//Canvas Variables
var canvas, ctx;
var mouseX, mouseY, mouseDown = 0;
var touchX, touchY;

var base_url = window.location.origin;

const aksara = ["ha-a", "na", "ca", "ra", "ka", "da", "ta", "sa", "wa", "la", "ma", "ga", "ba", "nga", "pa", "ja", "ya", "nya", "ulu", "suku", "taling", "tedong", "pepet"];
var activeAksara = null;
var aksaraIndex = null;
var activeCard = null;
//console.log(aksara);

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


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
    document.getElementById('confidence').innerHTML = "Confidence -";
    
    // Reset confidence bar
    const confidenceFill = document.getElementById('confidence-fill');
    if (confidenceFill) {
        confidenceFill.style.width = '0%';
    }
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

    // inisiasi modal part 
    const viewBtn = document.querySelector(".view-modal"),
        popup = document.querySelector(".popup"),
        close = popup.querySelector(".close"),
        inputresult = popup.querySelector(".input-result");
    viewBtn.onclick = () => {
        popup.classList.toggle("show");

    }
    close.onclick = () => {
        viewBtn.click();

    }
    
    // Initialize feedback popup
    const feedbackPopup = document.getElementById('result-feedback-popup');
    if (feedbackPopup) {
        // Close popup when clicking outside
        feedbackPopup.onclick = function(e) {
            if (e.target === feedbackPopup) {
                feedbackPopup.classList.remove('show');
            }
        };
    }
}




// Model Loader
var model;
(async function () {
    console.log("Model Loading.....");
    model = await tf.loadLayersModel("cnn_model/modeljs/model.json");
    console.log("Model Loaded.....");

})();
//let model;


function preprocessCanvas(image) {
    // resize the input image to target size of (1, 28, 28)
    let tensor = tf.browser.fromPixels(image, 1)
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

//Bounding Box

// function bound/

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

//var first_time = 0;
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
    
    var hasil = "salah";
    var isCorrect = false;
    
    if (parseInt(activeAksara) === maxIndex) {
        hasil = "benar";
        isCorrect = true;
    }

    console.log(maxIndex);
    document.getElementById('result').innerHTML = aksara[maxIndex];
    document.getElementById('confidence').innerHTML = "Confidence: " + (max * 100).toFixed(3) + "%";
    document.getElementById('input-result').innerHTML = "Aksara yang anda tuliskan " + hasil + ". Anda menuliskan " + aksara[maxIndex] + " yang seharusnya dituliskan " + aksara[activeAksara];
    
    // Update confidence bar
    const confidenceFill = document.getElementById('confidence-fill');
    if (confidenceFill) {
        confidenceFill.style.width = (max * 100) + '%';
    }
    
    // Show feedback popup
    showFeedbackPopup(isCorrect, aksara[activeAksara], aksara[maxIndex], (max * 100).toFixed(1));
}

function showFeedbackPopup(isCorrect, referenceAksara, predictedAksara, accuracy) {
    const popup = document.getElementById('result-feedback-popup');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const message = document.getElementById('feedback-message');
    const referenceElement = document.getElementById('reference-aksara');
    const yourAksaraElement = document.getElementById('your-aksara');
    const accuracyElement = document.getElementById('accuracy-value');
    
    // Update content based on result
    if (isCorrect) {
        popup.className = 'result-feedback-popup success';
        icon.className = 'fas fa-check-circle';
        title.textContent = 'Selamat!';
        message.textContent = 'Anda berhasil menulis aksara dengan benar!';
    } else {
        popup.className = 'result-feedback-popup error';
        icon.className = 'fas fa-times-circle';
        title.textContent = 'Belum Tepat';
        message.textContent = 'Coba lagi, Anda hampir benar!';
    }
    
    // Update details
    referenceElement.textContent = referenceAksara;
    yourAksaraElement.textContent = predictedAksara;
    accuracyElement.textContent = accuracy + '%';
    
    // Show popup
    popup.classList.add('show');
    
    // Add event listeners for buttons
    document.getElementById('try-again-btn').onclick = function() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        document.getElementById('result').innerHTML = "-";
        document.getElementById('confidence').innerHTML = "Confidence -";
        
        // Reset confidence bar
        const confidenceFill = document.getElementById('confidence-fill');
        if (confidenceFill) {
            confidenceFill.style.width = '0%';
        }
        
        // Hide popup
        popup.classList.remove('show');
    };
    
    document.getElementById('close-feedback-btn').onclick = function() {
        popup.classList.remove('show');
    };
    
    // Close popup when clicking outside
    popup.onclick = function(e) {
        if (e.target === popup) {
            popup.classList.remove('show');
        }
    };
}

document.querySelector(".browse-btn").addEventListener("click", () => {
    console.log(activeCard, activeAksara)
    initiateCard();

});

// const browseBtn = document.querySelector(".browse-btn")


// browseBtn.onclick = () => {
//     initiateCard();
//     console.log('browse clicked')

// }

function initiateCard() {
    const cardWrapper = document.querySelector('.aksara-card-wrapper');
    
    if(cardWrapper.innerHTML === "") {
        console.log("card kosong");
        aksara.forEach((huruf, i) => {
            createCard(cardWrapper, huruf, i);
        });
    }

    const cardEl = document.querySelectorAll(".aksara-card");
    console.log(cardEl.length);

    for (temp = 0; temp < cardEl.length; temp++) {
        cardEl[temp].addEventListener("click", doSomething, true)
    }

    document.querySelector(".button-close").addEventListener("click", () => {

        document.getElementById('aksara-heading').innerHTML = "Tuliskan Aksara " + aksara[activeAksara];
        document.getElementById('aksara-title').innerHTML = aksara[activeAksara];
        document.getElementById('image-box').src = `aksara/${parseInt(activeAksara) + 1}_${aksara[activeAksara]}.png`;
    });



    // document.getElementsByTagName('aksara-card-wrapper').addEventListener("click", async function ()
    // console.log("clicked");
    // };

    // cardWrapper.onclick = () => {
    //     console.log(cardWrapper[onclick])

    // }



}

function doSomething(e) {
    if (e.target !== e.currentTarget) {
        newCSS = " aksara-card-active";
        oldCSS = "card aksara-card";
        // var clickedItem = e.target.id;

        if (activeCard !== null && activeAksara !== this.id) {

            activeCard.className = oldCSS;
            this.className += newCSS;

            aksaraIndex = this.id;
            activeCard = this;
            activeAksara = this.id;
            console.log("pindah state")

        } else if (activeAksara === this.id) {
            console.log("sudah terpilih");
            this.className = oldCSS;
            aksaraIndex = null;

            activeCard = null;
            activeAksara = null;
        }
        else {
            aksaraIndex = this.id;
            this.className += newCSS;
            console.log("baru dipilih");

            activeCard = this;
            activeAksara = this.id;

        }
        console.log("active aksara " + activeAksara);



    }

}





function createCard(cardWrapper, huruf, a) {
    cardWrapper.innerHTML += `
    <div class="card aksara-card" style="width: 5rem" id="${a}">
    <img
      src="aksara/${a + 1}_${huruf}.png"
      width="50"
      height="50"
      class="card-img-top"
      alt="..."
    />
    <div class="card-body">
      <h5 class="card-title">${huruf}</h5>
    </div>
  </div>`

}





