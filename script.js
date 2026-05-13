const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");

const ascii = document.getElementById("ascii-output");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture-btn");
// const downloadBtn = document.getElementById("download-btn");

const downloadBox = document.getElementById("download-box");
const previewImg = document.getElementById("preview-img");
const downloadLabel = document.getElementById("download-label");
const checkIcon = document.getElementById("check-icon");

let lastImageURL = null;
let isDownloaded = false;

const switchBtn = document.getElementById("switch-camera");

const ctx = canvas.getContext("2d");

let currentFilter = "none";
let currentFacingMode = "user";
let currentStream;

/* ================= CAMERA ================= */

async function startCamera() {

    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: false
    });

    currentStream = stream;
    video.srcObject = stream;
}

startCamera();

window.addEventListener("load", () => {
    const defaultBtn = document.querySelector(".filter-btn.active");
    setFilter(defaultBtn, "none");
});

/* ================= FILTER ================= */

function setFilter(button, filter) {

    document.querySelectorAll(".filter-btn")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    currentFilter = filter;

    // HEART FILTER
    if (filter === "heart") {
        video.style.filter = "none";
        startHearts();
        stopASCII();
        ascii.style.display = "none";
        video.style.display = "block";
        return;
    } else {
        stopHearts();
    }

    // ASCII FILTER
    if (filter === "ascii") {

        ascii.style.display = "block";
        ascii.style.zIndex = "10";

        video.style.display = "block"; // ✅ KEEP VIDEO ON
        video.style.filter = "none";

        startASCII();
        return;
    }

    stopASCII();

    video.style.display = "block";
    ascii.style.display = "none";
    video.style.filter = filter;
}

/* ================= CAPTURE ================= */

captureBtn.addEventListener("click", () => {

    canvas.style.display = "block";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // mirror fix
    if (currentFacingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    // ================= DRAW VIDEO =================
    const shouldIgnoreCSS = (currentFilter === "ascii" || currentFilter === "heart");

    ctx.filter = shouldIgnoreCSS ? "none" : currentFilter;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ================= HEART FIX =================
    if (currentFilter === "heart") {
        drawHeartsOnCanvas(ctx);
    }

    // ================= ASCII FIX =================
    if (currentFilter === "ascii") {

        ctx.fillStyle = "#00ff66";
        ctx.font = "10px monospace";

        const lines = ascii.textContent.split("\n");

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 10, i * 10);
        }
    }

    const url = canvas.toDataURL("image/png");

    // preview logic
    isDownloaded = false;
    lastImageURL = url;

    downloadBox.classList.remove("hidden");
    previewImg.src = url;

    previewImg.style.display = "block";
    downloadLabel.style.display = "block";
    checkIcon.style.display = "none";
});

downloadBox.addEventListener("click", () => {

    if (!lastImageURL || isDownloaded) return;

    const a = document.createElement("a");
    a.href = lastImageURL;
    a.download = "selfie.png";
    a.click();

    // show check mark
    isDownloaded = true;
    downloadLabel.style.display = "none";
    previewImg.style.display = "none";
    checkIcon.style.display = "block";
});

/* ================= CAMERA SWITCH ================= */

switchBtn.addEventListener("click", () => {

    currentFacingMode =
        currentFacingMode === "user" ? "environment" : "user";

    startCamera();
});

/* ================= HEARTS (same as yours assumed) ================= */

const heartsContainer = document.getElementById("hearts-container");
const heartIcons = ["💖", "💕", "💘", "💗", "💓", "❤️"];

let heartInterval = null;

function createHeart() {

    const heart = document.createElement("div");
    heart.className = "heart";

    heart.innerHTML =
        heartIcons[Math.floor(Math.random() * heartIcons.length)];

    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.fontSize = (Math.random() * 20 + 15) + "px";

    const duration = Math.random() * 3 + 3;
    heart.style.animationDuration = duration + "s";

    heartsContainer.appendChild(heart);

    setTimeout(() => heart.remove(), duration * 1000);
}

function startHearts() {

    if (heartInterval) return;

    heartInterval = setInterval(createHeart, 250);
}

function stopHearts() {
    clearInterval(heartInterval);
    heartInterval = null;
}

/* ================= ASCII (FULL FIXED MIRROR VERSION) ================= */

let asciiRunning = false;

const asciiCanvas = document.createElement("canvas");
const asciiCtx = asciiCanvas.getContext("2d");

const asciiChars = "@#%*+=-:. ";

function startASCII() {

    if (asciiRunning) return;

    asciiRunning = true;

    asciiCanvas.width = 120;
    asciiCanvas.height = 90;

    function loop() {

        if (!asciiRunning) return;

        asciiCtx.setTransform(1, 0, 0, 1, 0, 0);

        asciiCtx.drawImage(video, 0, 0, asciiCanvas.width, asciiCanvas.height);

        const data = asciiCtx.getImageData(
            0,
            0,
            asciiCanvas.width,
            asciiCanvas.height
        ).data;

        let text = "";

        for (let y = 0; y < asciiCanvas.height; y++) {

            for (let x = 0; x < asciiCanvas.width; x++) {

                const i = (y * asciiCanvas.width + x) * 4;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const brightness = (r + g + b) / 3;

                const charIndex = Math.floor(
                    (brightness / 255) * (asciiChars.length - 1)
                );

                text += asciiChars[charIndex];
            }

            text += "\n";
        }

        ascii.textContent = text;

        requestAnimationFrame(loop);
    }

    loop();
}

function stopASCII() {
    asciiRunning = false;
}

const filters = document.getElementById("filters");

// Mouse wheel horizontal scroll
filters.addEventListener("wheel", (e) => {
    e.preventDefault();
    filters.scrollLeft += e.deltaY;
});

// Drag to scroll
let isDown = false;
let startX;
let scrollLeft;

filters.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - filters.offsetLeft;
    scrollLeft = filters.scrollLeft;
});

filters.addEventListener("mouseleave", () => {
    isDown = false;
});

filters.addEventListener("mouseup", () => {
    isDown = false;
});

filters.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();

    const x = e.pageX - filters.offsetLeft;
    const walk = (x - startX) * 2;

    filters.scrollLeft = scrollLeft - walk;
});

function drawHeartsOnCanvas(ctx) {

    const hearts = document.querySelectorAll(".heart");

    hearts.forEach(h => {

        const rect = h.getBoundingClientRect();

        ctx.font = `${h.style.fontSize || 20}px Arial`;
        ctx.fillText(h.innerText, rect.left, rect.top);
    });
}