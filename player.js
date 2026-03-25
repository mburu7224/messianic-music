import {
  getActiveLyricIndex,
  scrollLyricsToActive,
  formatTime,
} from "./lyricsSync.js";
import { loadAllSongs, getFallbackLyrics } from "./songStore.js";

console.log("App initialized (player.js)");

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const repeatBtn = document.getElementById("repeat");
const moreBtn = document.getElementById("more");
const moreMenu = document.getElementById("moreMenu");
const sleepMenuBtn = document.getElementById("sleepMenuBtn");
const sleepMenu = document.getElementById("sleepMenu");
const menuSleepEl = document.getElementById("menuSleep");
const menuStartTimerBtn = document.getElementById("menuStartTimer");
const playbackSpeedEl = document.getElementById("playbackSpeed");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const seekEl = document.getElementById("seek");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const coverEl = document.getElementById("cover");
const titleEl = document.getElementById("songTitle");
const artistEl = document.getElementById("songArtist");
const lyricsBody = document.getElementById("lyricsBody");
const lyricsStatus = document.getElementById("lyricsStatus");
const playlistBody = document.getElementById("playlistBody");
const songCountEl = document.getElementById("songCount");
const tabButtons = Array.from(document.querySelectorAll(".tab[data-filter]"));

const sleepMinutesEl = document.getElementById("sleepMinutes");
const startTimerBtn = document.getElementById("startTimer");
const clearTimerBtn = document.getElementById("clearTimer");
const timerStatusEl = document.getElementById("timerStatus");

let songs = [];
let allSongs = [];
let currentIndex = -1;
let lyricLineEls = [];
let activeLyricIndex = -1;
let sleepTimer = null;
let sleepRemaining = 0;
let repeatMode = "off";
let activeFilter = "all";

const playIcon = `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5v14l11-7-11-7z" />
  </svg>
`;
const pauseIcon = `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 5h4v14H7z" />
    <path d="M13 5h4v14h-4z" />
  </svg>
`;

const setPlayIcon = (isPlaying) => {
  playBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
};

setPlayIcon(false);

const isMobileView = window.matchMedia("(max-width: 768px)").matches;

const renderPlaylist = () => {
  if (isMobileView) return;
  playlistBody.innerHTML = "";
  songs.forEach((song, index) => {
    const item = document.createElement("div");
    const pending = !song.audioUrl;
    item.className = `playlist-item${index === currentIndex ? " active" : ""}${
      pending ? " pending" : ""
    }`;
    item.innerHTML = `<strong>${song.title}</strong><br/><span>${
      song.artist || "COGMERS"
    }</span>${pending ? "<br/><em>Audio pending</em>" : ""}`;
    item.addEventListener("click", () => {
      selectSong(index, { autoPlay: false });
    });
    playlistBody.appendChild(item);
  });
  songCountEl.textContent = `${songs.length} songs`;
};

const renderLyrics = (lyrics) => {
  lyricsBody.innerHTML = "";
  lyricLineEls = [];
  activeLyricIndex = -1;

  if (!lyrics || lyrics.length === 0) {
    lyricsStatus.textContent = "No lyrics available";
    lyricsBody.innerHTML = "<p class=\"lyric-line\">Lyrics will appear here.</p>";
    return;
  }

  lyricsStatus.textContent = `${lyrics.length} lines`;

  lyrics.forEach((line) => {
    const el = document.createElement("div");
    el.className = "lyric-line";
    el.textContent = line.text;
    lyricsBody.appendChild(el);
    lyricLineEls.push(el);
  });
};

const selectSong = (index, { autoPlay } = { autoPlay: false }) => {
  const song = songs[index];
  if (!song) return;

  console.log("Selecting song:", { index, id: song.id, title: song.title, audioUrl: song.audioUrl });

  const fallbackLyrics = getFallbackLyrics(song);
  const effectiveLyrics =
    song.lyrics && song.lyrics.length ? song.lyrics : fallbackLyrics;

  currentIndex = index;
  renderPlaylist();

  titleEl.textContent = song.title || "Untitled";
  artistEl.textContent = song.artist || "";
  coverEl.style.backgroundImage = song.coverUrl
    ? `url('${song.coverUrl}')`
    : "linear-gradient(135deg, #1b1f2d, #2a2f43)";

  if (song.audioUrl) {
    if (typeof song.audioUrl === "string" && !/^https?:\/\//i.test(song.audioUrl)) {
      console.warn("Audio URL does not appear to be absolute/HTTPS:", song.audioUrl);
    }
    console.log("Setting audio.src ->", song.audioUrl);
    audio.src = song.audioUrl;
    audio.load();
    if (autoPlay) {
      audio.play();
      setPlayIcon(true);
    } else {
      setPlayIcon(false);
    }
  } else {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    seekEl.value = 0;
    setPlayIcon(false);
  }
  if (playbackSpeedEl) {
    audio.playbackRate = Number(playbackSpeedEl.value) || 1;
  }

  renderLyrics(effectiveLyrics || []);
  if (!song.audioUrl) {
    const lines = (effectiveLyrics || []).length;
    lyricsStatus.textContent = lines
      ? `${lines} lines · audio pending`
      : "Audio pending upload";
  }
};

const updateProgress = () => {
  const current = audio.currentTime || 0;
  const duration = audio.duration || 0;

  currentTimeEl.textContent = formatTime(current);
  durationEl.textContent = formatTime(duration);
  seekEl.value = duration ? (current / duration) * 100 : 0;

  const currentSong = songs[currentIndex];
  const lyrics =
    currentSong && currentSong.lyrics && currentSong.lyrics.length
      ? currentSong.lyrics
      : getFallbackLyrics(currentSong);
  const newIndex = getActiveLyricIndex(current, lyrics);
  if (newIndex !== activeLyricIndex && newIndex >= 0) {
    if (lyricLineEls[activeLyricIndex]) {
      lyricLineEls[activeLyricIndex].classList.remove("active");
    }
    activeLyricIndex = newIndex;
    if (lyricLineEls[activeLyricIndex]) {
      lyricLineEls[activeLyricIndex].classList.add("active");
      scrollLyricsToActive(lyricsBody, lyricLineEls, activeLyricIndex);
    }
  }
};

const togglePlay = async () => {
  if (!audio.src) return;
  if (audio.paused) {
    await audio.play();
    setPlayIcon(true);
  } else {
    audio.pause();
    setPlayIcon(false);
  }
};

const nextSong = () => {
  if (!songs.length) return;
  let nextIndex = currentIndex;
  for (let i = 0; i < songs.length; i += 1) {
    nextIndex = (nextIndex + 1) % songs.length;
    if (songs[nextIndex].audioUrl) break;
  }
  selectSong(nextIndex, { autoPlay: true });
};

const prevSong = () => {
  if (!songs.length) return;
  let nextIndex = currentIndex;
  for (let i = 0; i < songs.length; i += 1) {
    nextIndex = nextIndex - 1 < 0 ? songs.length - 1 : nextIndex - 1;
    if (songs[nextIndex].audioUrl) break;
  }
  selectSong(nextIndex, { autoPlay: true });
};

const toggleRepeat = () => {
  repeatMode =
    repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
  repeatBtn.classList.toggle("active", repeatMode !== "off");
  repeatBtn.title =
    repeatMode === "off"
      ? "Repeat off"
      : repeatMode === "one"
        ? "Repeat one"
        : "Repeat all";
};

const startSleepTimer = () => {
  const minutes = Number(sleepMinutesEl.value);
  if (!minutes || minutes <= 0) {
    timerStatusEl.textContent = "Enter minutes";
    return;
  }

  clearSleepTimer();
  sleepRemaining = minutes * 60;
  timerStatusEl.textContent = `Stops in ${formatTime(sleepRemaining)}`;

  sleepTimer = setInterval(() => {
    sleepRemaining -= 1;
    if (sleepRemaining <= 0) {
      clearSleepTimer();
      audio.pause();
      setPlayIcon(false);
      timerStatusEl.textContent = "Timer ended";
      return;
    }
    timerStatusEl.textContent = `Stops in ${formatTime(sleepRemaining)}`;
  }, 1000);
};

const clearSleepTimer = () => {
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimer = null;
  timerStatusEl.textContent = "Timer off";
};

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);
repeatBtn.addEventListener("click", toggleRepeat);
moreBtn.addEventListener("click", () => {
  moreMenu.classList.toggle("open");
});
if (sleepMenuBtn && sleepMenu) {
  sleepMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    sleepMenu.classList.toggle("open");
  });
}
menuStartTimerBtn.addEventListener("click", () => {
  const val = Number(menuSleepEl.value);
  if (val > 0) {
    sleepMinutesEl.value = val;
    startSleepTimer();
  }
});
playbackSpeedEl.addEventListener("change", (event) => {
  audio.playbackRate = Number(event.target.value) || 1;
});
startTimerBtn.addEventListener("click", startSleepTimer);
clearTimerBtn.addEventListener("click", clearSleepTimer);

seekEl.addEventListener("input", (e) => {
  const pct = Number(e.target.value) / 100;
  if (!audio.duration) return;
  audio.currentTime = pct * audio.duration;
});

audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("ended", () => {
  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
    return;
  }
  if (repeatMode === "all") {
    nextSong();
    return;
  }
  if (repeatMode === "off") {
    nextSong();
  }
});
audio.addEventListener("loadedmetadata", updateProgress);
document.addEventListener("click", (event) => {
  if (!moreMenu.classList.contains("open")) return;
  if (event.target.closest(".more")) return;
  moreMenu.classList.remove("open");
});

document.addEventListener("click", (event) => {
  if (!sleepMenu || !sleepMenu.classList.contains("open")) return;
  if (event.target.closest(".sleep-panel")) return;
  if (event.target.closest("#sleepMenuBtn")) return;
  sleepMenu.classList.remove("open");
});

const applyFilter = () => {
  if (activeFilter === "audio") {
    songs = allSongs.filter((song) => song.audioUrl);
  } else if (activeFilter === "lyrics") {
    songs = allSongs.filter((song) => !song.audioUrl);
  } else {
    songs = [...allSongs];
  }

  console.log("[desktop] allSongs:", allSongs.length, "displayed:", songs.length, "filter:", activeFilter);

  if (isMobileView) return;

  renderPlaylist();

  if (!songs.length) {
    titleEl.textContent = "No songs in this view";
    artistEl.textContent = "";
    lyricsStatus.textContent = "No lyrics yet";
    return;
  }

  const firstPlayable = songs.findIndex((song) => song.audioUrl);
  if (firstPlayable >= 0) {
    selectSong(firstPlayable, { autoPlay: false });
  } else {
    selectSong(0, { autoPlay: false });
  }
};

if (!isMobileView) {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter || "all";
      applyFilter();
    });
  });
}

const loadSongs = async () => {
  try {
    allSongs = await loadAllSongs();
    console.log("[desktop] loaded allSongs:", allSongs.length);
    applyFilter();
  } catch (err) {
    console.error("loadSongs failed:", err);
    lyricsStatus.textContent = "Failed to load songs";
  }
};

loadSongs().catch((err) => {
  console.error(err);
  lyricsStatus.textContent = "Failed to load songs";
});
