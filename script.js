const glow = document.querySelector(".cursor-glow");

document.addEventListener("mousemove", (e) => {

    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";

});


// MUSIC

const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");

let isPlaying = false;

musicBtn.addEventListener("click", () => {

    if (!isPlaying) {

        music.play();

        musicBtn.innerText = "STOP MUSIC";

        isPlaying = true;

    } else {

        music.pause();

        musicBtn.innerText = "PLAY MUSIC";

        isPlaying = false;

    }

});