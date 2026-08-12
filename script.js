/* =====================================================
   ASHIK VOVON — OFFICIAL MUSIC
   Frontend Script
===================================================== */

const API_BASE = "";

// Elements
const songsContainer = document.getElementById("songsContainer");
const galleryContainer = document.getElementById("galleryContainer");

const songCount = document.getElementById("songCount");
const photoCount = document.getElementById("photoCount");

const audio = document.getElementById("audio");
const audioPlayer = document.getElementById("audioPlayer");

const playerTitle = document.getElementById("playerTitle");
const playerCover = document.getElementById("playerCover");

const playPauseBtn = document.getElementById("playPauseBtn");
const closePlayer = document.getElementById("closePlayer");

const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const year = document.getElementById("year");


// =====================================================
// YEAR
// =====================================================

if (year) {
    year.textContent = new Date().getFullYear();
}


// =====================================================
// TIME FORMAT
// =====================================================

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${secs}`;
}


// =====================================================
// SHOW ERROR
// =====================================================

function showMessage(container, message) {

    if (!container) return;

    container.innerHTML = `
        <div class="loading-card">
            <p>${message}</p>
        </div>
    `;
}


// =====================================================
// LOAD SONGS
// =====================================================

async function loadSongs() {

    if (!songsContainer) return;

    try {

        const response = await fetch(`${API_BASE}/api/songs`);

        if (!response.ok) {
            throw new Error("Songs API unavailable");
        }

        const songs = await response.json();

        renderSongs(songs);

    } catch (error) {

        console.error("Song loading error:", error);

        /*
         * API route এখনো তৈরি না থাকলে
         * website ভেঙে যাবে না।
         */

        songsContainer.innerHTML = `
            <div class="loading-card">
                <p>এখনো কোনো গান যোগ করা হয়নি।</p>
            </div>
        `;

        if (songCount) {
            songCount.textContent = "0";
        }
    }
}


// =====================================================
// RENDER SONGS
// =====================================================

function renderSongs(songs) {

    if (!Array.isArray(songs)) {
        songs = [];
    }

    if (songCount) {
        songCount.textContent = songs.length;
    }

    if (!songs.length) {

        songsContainer.innerHTML = `
            <div class="loading-card">
                <p>এখনো কোনো গান যোগ করা হয়নি।</p>
            </div>
        `;

        return;
    }

    songsContainer.innerHTML = "";

    songs.forEach((song, index) => {

        const card = document.createElement("div");

        card.className = "song-card";

        const title =
            song.title ||
            song.name ||
            `গান ${index + 1}`;

        const artist =
            song.artist ||
            "আশিক ভবন";

        const audioUrl =
            song.audio ||
            song.url ||
            song.file;

        const cover =
            song.cover ||
            song.image ||
            "";

        card.innerHTML = `

            <div class="song-cover">

                ${
                    cover
                    ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(title)}">`
                    : "♪"
                }

            </div>


            <div class="song-info">

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(artist)}
                </p>

            </div>


            <button
                class="song-play"
                type="button"
                aria-label="গান চালান"
            >
                ▶
            </button>

        `;


        const playButton =
            card.querySelector(".song-play");


        playButton.addEventListener("click", () => {

            if (!audioUrl) {

                alert("এই গানের অডিও ফাইল পাওয়া যায়নি।");

                return;
            }

            playSong(
                audioUrl,
                title,
                cover
            );

        });


        songsContainer.appendChild(card);

    });
}


// =====================================================
// PLAY SONG
// =====================================================

function playSong(url, title, cover) {

    if (!audio || !url) return;

    audio.src = url;

    audio.load();

    playerTitle.textContent = title || "আশিক ভবন";

    if (cover) {

        playerCover.innerHTML = `
            <img
                src="${escapeHTML(cover)}"
                alt=""
            >
        `;

    } else {

        playerCover.textContent = "♪";

    }

    audioPlayer.classList.remove("hidden");

    audio.play()
        .then(() => {

            updatePlayButton();

        })
        .catch(error => {

            console.log("Audio play error:", error);

            updatePlayButton();

        });

}


// =====================================================
// PLAY / PAUSE
// =====================================================

if (playPauseBtn) {

    playPauseBtn.addEventListener("click", () => {

        if (!audio.src) return;

        if (audio.paused) {

            audio.play();

        } else {

            audio.pause();

        }

    });

}


// =====================================================
// AUDIO EVENTS
// =====================================================

if (audio) {

    audio.addEventListener("play", () => {

        updatePlayButton();

    });


    audio.addEventListener("pause", () => {

        updatePlayButton();

    });


    audio.addEventListener("loadedmetadata", () => {

        if (duration) {
            duration.textContent =
                formatTime(audio.duration);
        }

    });


    audio.addEventListener("timeupdate", () => {

        if (!audio.duration) return;

        const percent =
            (audio.currentTime / audio.duration) * 100;

        if (progress) {
            progress.value = percent;
        }

        if (currentTime) {
            currentTime.textContent =
                formatTime(audio.currentTime);
        }

    });


    audio.addEventListener("ended", () => {

        if (progress) {
            progress.value = 0;
        }

        updatePlayButton();

    });

}


// =====================================================
// PLAY BUTTON ICON
// =====================================================

function updatePlayButton() {

    if (!playPauseBtn || !audio) return;

    playPauseBtn.textContent =
        audio.paused ? "▶" : "Ⅱ";

}


// =====================================================
// PROGRESS BAR
// =====================================================

if (progress) {

    progress.addEventListener("input", () => {

        if (!audio.duration) return;

        const percentage =
            Number(progress.value) / 100;

        audio.currentTime =
            audio.duration * percentage;

    });

}


// =====================================================
// CLOSE PLAYER
// =====================================================

if (closePlayer) {

    closePlayer.addEventListener("click", () => {

        audio.pause();

        audio.removeAttribute("src");

        audio.load();

        audioPlayer.classList.add("hidden");

    });

}


// =====================================================
// LOAD GALLERY
// =====================================================

async function loadGallery() {

    if (!galleryContainer) return;

    try {

        const response =
            await fetch(`${API_BASE}/api/photos`);

        if (!response.ok) {
            throw new Error("Photos API unavailable");
        }

        const photos =
            await response.json();

        renderGallery(photos);

    } catch (error) {

        console.error("Gallery loading error:", error);

        galleryContainer.innerHTML = `
            <div class="loading-card">
                <p>এখনো কোনো ছবি যোগ করা হয়নি।</p>
            </div>
        `;

        if (photoCount) {
            photoCount.textContent = "0";
        }

    }

}


// =====================================================
// RENDER GALLERY
// =====================================================

function renderGallery(photos) {

    if (!Array.isArray(photos)) {
        photos = [];
    }

    if (photoCount) {
        photoCount.textContent = photos.length;
    }

    if (!photos.length) {

        galleryContainer.innerHTML = `
            <div class="loading-card">
                <p>এখনো কোনো ছবি যোগ করা হয়নি।</p>
            </div>
        `;

        return;
    }

    galleryContainer.innerHTML = "";

    photos.forEach((photo, index) => {

        const item =
            document.createElement("div");

        item.className =
            "gallery-item";


        const imageUrl =
            typeof photo === "string"
                ? photo
                : (
                    photo.url ||
                    photo.image ||
                    photo.file ||
                    ""
                );


        const altText =
            typeof photo === "object"
                ? (
                    photo.title ||
                    "আশিক ভবন"
                )
                : "আশিক ভবন";


        if (imageUrl) {

            item.innerHTML = `
                <img
                    src="${escapeHTML(imageUrl)}"
                    alt="${escapeHTML(altText)}"
                    loading="lazy"
                >
            `;

        }


        galleryContainer.appendChild(item);

    });

}


// =====================================================
// BASIC HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadSongs();

    loadGallery();

});