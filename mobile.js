/**
 * COGMERS Mobile Player
 * Touch-optimized interface for mobile devices
 */

import { loadAllSongs, getFallbackLyrics } from "./songStore.js";

console.log("Mobile app initialized (mobile.js)");

// DOM Elements - Desktop playlist
const playlistBody = document.getElementById("playlistBody");
const songCountEl = document.getElementById("songCount");
const tabButtons = Array.from(document.querySelectorAll(".tab[data-filter]"));

// Mobile Menu Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenuPanel = document.getElementById("mobileMenuPanel");
const mobileMenuClose = document.getElementById("mobileMenuClose");
const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

// Song Overlay Elements
const songOverlay = document.getElementById("songOverlay");
const songOverlayClose = document.getElementById("songOverlayClose");
const overlaySongTitle = document.getElementById("overlaySongTitle");
const overlaySongArtist = document.getElementById("overlaySongArtist");
const overlayLyrics = document.getElementById("overlayLyrics");
const overlayAudio = document.getElementById("overlayAudio");
const overlayPlay = document.getElementById("overlayPlay");
const overlayPrev = document.getElementById("overlayPrev");
const overlayNext = document.getElementById("overlayNext");
const overlayRepeat = document.getElementById("overlayRepeat");
const overlaySeek = document.getElementById("overlaySeek");
const overlayCurrentTime = document.getElementById("overlayCurrentTime");
const overlayDuration = document.getElementById("overlayDuration");

// Mobile Player Elements
// Fix missing selectors
const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
const mobileCategoriesList = document.querySelectorAll('.mobile-category');
const mobileSongList = document.getElementById('mobileSongList');
const mobileNowPlaying = document.getElementById('mobileNowPlaying');
const mobileMiniPlayer = document.getElementById('mobileMiniPlayer');
const mobilePlayer = document.getElementById('mobilePlayer');
const mobileSearchToggle = document.getElementById('mobileSearchToggle');
const mobileSearchClose = document.getElementById('mobileSearchClose');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const mobileSearchResults = document.getElementById('mobileSearchResults');
const mobileSearch = document.getElementById('mobileSearch');
const mobilePlayerClose = document.getElementById('mobilePlayerClose');

const mobileCover = document.getElementById("mobileCover");
const mobileSongTitle = document.getElementById("mobileSongTitle");
const mobileSongArtist = document.getElementById("mobileSongArtist");
const mobileMiniPlay = document.getElementById("mobileMiniPlay");
const miniCover = document.getElementById("miniCover");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniPlayBtn = document.getElementById("miniPlayBtn");
const mobilePlayerCover = document.getElementById("mobilePlayerCover");
const mobilePlayerTitle = document.getElementById("mobilePlayerTitle");
const mobilePlayerArtist = document.getElementById("mobilePlayerArtist");
const mobilePlayerLyrics = document.getElementById("mobilePlayerLyrics");
const mobileAudio = document.getElementById("mobileAudio");
const mobilePlay = document.getElementById("mobilePlay");
const mobilePrev = document.getElementById("mobilePrev");
const mobileNext = document.getElementById("mobileNext");
const mobileRepeat = document.getElementById("mobileRepeat");
const mobileShuffle = document.getElementById("mobileShuffle");
const mobileSeek = document.getElementById("mobileSeek");
const mobileCurrentTime = document.getElementById("mobileCurrentTime");
const mobileDuration = document.getElementById("mobileDuration");

const mobileQuery = window.matchMedia("(max-width: 768px)");
let isMobileView = mobileQuery.matches;

// State
let allSongs = [];
let displayedSongs = [];
let playbackList = [];
let playbackIndex = -1;
let searchResultsCache = [];
let currentIndex = -1;
let isPlaying = false;
let playbackMode = "all";
let activeFilter = "all";
let activeCategory = "all";

// Icons
const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7-11-7z"/></svg>`;
const pauseIcon = `<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`;
const repeatAllIcon = `<svg viewBox="0 0 24 24"><path d="M7 7h10a4 4 0 0 1 0 8h-1v-2h1a2 2 0 0 0 0-4H7v3L3 8l4-4v3z"/><path d="M17 17H7a4 4 0 0 1 0-8h1v2H7a2 2 0 0 0 0 4h10v-3l4 4-4 4v-3z"/></svg>`;
const repeatOneIcon = `<svg viewBox="0 0 24 24"><path d="M7 7h10a4 4 0 0 1 0 8h-1v-2h1a2 2 0 0 0 0-4H7v3L3 8l4-4v3z"/><path d="M17 17H7a4 4 0 0 1 0-8h1v2H7a2 2 0 0 0 0 4h10v-3l4 4-4 4v-3z"/><text x="12" y="13.5" text-anchor="middle" font-size="8" fill="currentColor">1</text></svg>`;
const shuffleIcon = `<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`;

const getActiveAudio = () =>
  songOverlay && songOverlay.classList.contains("active") ? overlayAudio : mobileAudio;

const updateOverlayPlayButton = (playing) => {
  if (!overlayPlay) return;
  overlayPlay.innerHTML = playing ? pauseIcon : playIcon;
};

const setPlayingState = (playing) => {
  isPlaying = playing;
  updatePlayButton();
  updateOverlayPlayButton(playing);
};

const setAudioSource = (audioEl, song, { autoPlay = false } = {}) => {
  if (!audioEl) return;
  if (song && song.audioUrl) {
    audioEl.src = song.audioUrl;
    audioEl.load();
    if (autoPlay) {
      audioEl.play().catch(() => {});
    }
  } else {
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
  }
};

const syncAudioSources = (song) => {
  setAudioSource(mobileAudio, song, { autoPlay: false });
  setAudioSource(overlayAudio, song, { autoPlay: false });
};

const setPlaybackContext = (list, index = 0) => {
  if (!Array.isArray(list) || list.length === 0) {
    playbackList = [];
    playbackIndex = -1;
    return;
  }
  playbackList = list;
  playbackIndex = Math.max(0, Math.min(index, playbackList.length - 1));
};

const updatePlaybackContextFromDisplayed = () => {
  if (!displayedSongs || displayedSongs.length === 0) {
    playbackList = [];
    playbackIndex = -1;
    return;
  }
  const currentSong = allSongs[currentIndex];
  const idx = currentSong ? displayedSongs.indexOf(currentSong) : -1;
  setPlaybackContext(displayedSongs, idx >= 0 ? idx : 0);
};

const getPlaybackList = () =>
  playbackList && playbackList.length ? playbackList : allSongs;

const playSongInContext = (list, listIndex, { openOverlay = false } = {}) => {
  if (!Array.isArray(list) || list.length === 0) return;

  setPlaybackContext(list, listIndex);
  const song = playbackList[playbackIndex];
  if (!song) return;

  const allIndex = allSongs.indexOf(song);
  if (allIndex >= 0) {
    currentIndex = allIndex;
  }

  updateNowPlaying(song);
  updateMiniPlayer(song);
  updateFullPlayer(song);
  renderSongList();

  if (mobileMiniPlayer) {
    mobileMiniPlayer.classList.add("active");
  }

  if (openOverlay || (songOverlay && songOverlay.classList.contains("active"))) {
    loadOverlaySong(song, currentIndex, { showOverlay: openOverlay, autoPlay: true });
  } else {
    syncAudioSources(song);
  }

  const activeAudio = getActiveAudio();
  const canPlay = Boolean(activeAudio && song.audioUrl);
  if (canPlay) {
    activeAudio.play().catch(() => {});
    setPlayingState(true);
  } else {
    setPlayingState(false);
  }

  window.audioPlayerState = {
    currentIndex,
    isPlaying: canPlay ? true : false,
    song
  };

  window.dispatchEvent(new CustomEvent("mobilePlayerChange", { 
    detail: { currentIndex, isPlaying: canPlay ? true : false, song } 
  }));
};

// Initialize
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadSongs();
  renderPlaylistItems();
  renderSongList();
  setupEventListeners();
  setupMobileMenu();
  setupSongOverlay();
  updatePlaybackModeUI();
  mobileQuery.addEventListener("change", (e) => {
    isMobileView = e.matches;
    if (isMobileView) {
      renderPlaylistItems();
      renderSongList();
    }
  });
  
  // Sync with desktop player if available
  if (window.audioPlayerState) {
    syncWithDesktopPlayer();
  }
}

// Mobile Menu Functions
function setupMobileMenu() {
  console.log("Setting up mobile menu...", { mobileMenuBtn, mobileMenuPanel, mobileMenuClose });
  
  if (!mobileMenuBtn) {
    console.log("Mobile menu button not found");
    return;
  }
  if (!mobileMenuPanel) {
    console.log("Mobile menu panel not found");
    return;
  }
  
  // Add click handler to open menu
  mobileMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Menu button clicked");
    mobileMenuPanel.classList.add("active");
    if (mobileMenuOverlay) {
      mobileMenuOverlay.classList.add("active");
    }
  });
  
  // Add close button handler
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", () => {
      mobileMenuPanel.classList.remove("active");
      if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove("active");
      }
    });
  }
  
  // Close on outside click
  mobileMenuPanel.addEventListener("click", (e) => {
    if (e.target === mobileMenuPanel) {
      mobileMenuPanel.classList.remove("active");
      if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove("active");
      }
    }
  });

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener("click", () => {
      mobileMenuPanel.classList.remove("active");
      mobileMenuOverlay.classList.remove("active");
    });
  }
  
  console.log("Mobile menu setup complete");
}

// Song Overlay Functions
function setupSongOverlay() {
  if (!songOverlay || !songOverlayClose) return;
  
  songOverlayClose.addEventListener("click", closeSongOverlay);
  
  // Overlay controls
  if (overlayPlay) {
    overlayPlay.addEventListener("click", toggleOverlayPlay);
  }
  if (overlayPrev) {
    overlayPrev.addEventListener("click", playPrev);
  }
  if (overlayNext) {
    overlayNext.addEventListener("click", playNext);
  }
  if (overlayRepeat) {
    overlayRepeat.addEventListener("click", togglePlaybackMode);
  }
  if (overlaySeek) {
    overlaySeek.addEventListener("input", handleOverlaySeek);
  }
  
  // Audio events
  overlayAudio.addEventListener("timeupdate", updateOverlayProgress);
  overlayAudio.addEventListener("ended", handleSongEnd);
  overlayAudio.addEventListener("play", () => setPlayingState(true));
  overlayAudio.addEventListener("pause", () => setPlayingState(false));
}

function openSongOverlay(song, index) {
  loadOverlaySong(song, index, { showOverlay: true, autoPlay: isPlaying });
}

function loadOverlaySong(song, index, { showOverlay = false, autoPlay = false } = {}) {
  if (!song) return;
  currentIndex = index;

  if (overlaySongTitle) overlaySongTitle.textContent = song.title;
  if (overlaySongArtist) overlaySongArtist.textContent = song.artist || "COGMERS";

  const fallbackLyrics = getFallbackLyrics(song);
  if (song.lyrics && song.lyrics.length > 0) {
    renderOverlayLyrics(song.lyrics);
  } else if (fallbackLyrics.length > 0) {
    renderOverlayLyrics(fallbackLyrics);
  } else if (overlayLyrics) {
    overlayLyrics.innerHTML = '<div class="lyric-line">No lyrics available</div>';
  }

  syncAudioSources(song);

  if (showOverlay) {
    songOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    if (mobileAudio && !mobileAudio.paused) {
      mobileAudio.pause();
    }
  }

  if (autoPlay && song.audioUrl) {
    overlayAudio.play().catch(() => {});
    setPlayingState(true);
  } else if (!song.audioUrl) {
    setPlayingState(false);
  }
}

// Direct function for inline onclick - make it global
window.openSongOverlayDirect = function(index) {
  console.log("Opening song overlay for index:", index);
  if (allSongs[index]) {
    playSongInContext(allSongs, index, { openOverlay: true });
  } else {
    console.log("Song not found at index:", index);
  }
};

function closeSongOverlay() {
  songOverlay.classList.remove("active");
  document.body.style.overflow = "";
  if (overlayAudio) {
    overlayAudio.pause();
  }
  if (mobileAudio && overlayAudio && overlayAudio.src) {
    if (mobileAudio.src !== overlayAudio.src) {
      mobileAudio.src = overlayAudio.src;
      mobileAudio.load();
    }
    if (isPlaying) {
      mobileAudio.currentTime = overlayAudio.currentTime || 0;
      mobileAudio.play().catch(() => {});
    }
  }
}

function toggleOverlayPlay() {
  togglePlay(overlayAudio);
}

function renderOverlayLyrics(lyrics) {
  if (!overlayLyrics) return;
  
  overlayLyrics.innerHTML = lyrics.map((line, index) => {
    const text = line.text || line;
    return `<div class="lyric-line" data-index="${index}">${text}</div>`;
  }).join("");
}

function updateOverlayProgress() {
  if (!overlayAudio.duration) return;
  
  const percent = (overlayAudio.currentTime / overlayAudio.duration) * 100;
  if (overlaySeek) overlaySeek.value = percent;
  if (overlayCurrentTime) overlayCurrentTime.textContent = formatTime(overlayAudio.currentTime);
  if (overlayDuration) overlayDuration.textContent = formatTime(overlayAudio.duration);
  
  // Update active lyric
  updateActiveOverlayLyric();
}

function updateActiveOverlayLyric() {
  const lines = overlayLyrics.querySelectorAll(".lyric-line");
  const currentTime = overlayAudio.currentTime;
  
  // Find current lyric based on timestamps if available
  // For now, just highlight randomly based on time
  const lineIndex = Math.floor(currentTime / 4) % lines.length;
  
  lines.forEach((line, i) => {
    line.classList.toggle("active", i === lineIndex);
  });
  
  // Scroll to active line
  const activeLine = overlayLyrics.querySelector(".lyric-line.active");
  if (activeLine) {
    activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function handleOverlaySeek(e) {
  const value = e.target.value;
  const duration = overlayAudio.duration || 0;
  const time = (value / 100) * duration;
  overlayAudio.currentTime = time;
}

function handleSongEnd() {
  if (playbackMode === "one") {
    overlayAudio.currentTime = 0;
    overlayAudio.play();
  } else {
    playNext();
  }
}

async function loadSongs() {
  try {
    allSongs = await loadAllSongs();
  } catch (error) {
    console.log("loadAllSongs failed, using empty list", error);
    allSongs = [];
  }

  displayedSongs = [...allSongs];
  console.log("Loaded songs:", allSongs.length);
}

const getFilteredSongs = ({ includeCategory = true } = {}) => {
  let filtered = allSongs;

  if (activeFilter === "audio") {
    filtered = allSongs.filter((song) => song.audioUrl);
  } else if (activeFilter === "lyrics") {
    filtered = allSongs.filter((song) => !song.audioUrl);
  }

  if (includeCategory && activeCategory !== "all") {
    filtered = filtered.filter((song) => song.category === activeCategory);
  }

  return filtered;
};

// Render desktop-style playlist items (visible on mobile)
function renderPlaylistItems() {
  if (!isMobileView) return;
  renderFilteredPlaylist();
}

function renderSongList() {
  displayedSongs = getFilteredSongs({ includeCategory: true });
  updatePlaybackContextFromDisplayed();

  if (!mobileSongList) return;

  mobileSongList.innerHTML = displayedSongs.map((song, index) => {
    const songIndex = allSongs.indexOf(song);
    const isActive = songIndex === currentIndex;
    return `
    <div class="mobile-song-item ${isActive ? 'active' : ''}" data-index="${songIndex}" data-playlist-index="${index}">
      <span class="song-number">${song.no}</span>
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">${song.artist || 'COGMERS'}</div>
      </div>
      <span class="song-duration">${song.duration || '--:--'}</span>
    </div>
  `;
  }).join('');
  
  // Add click handlers
  document.querySelectorAll(".mobile-song-item").forEach(item => {
    item.addEventListener("click", () => {
      const playlistIndex = parseInt(item.dataset.playlistIndex);
      playSongInContext(displayedSongs, playlistIndex, { openOverlay: false });
    });
  });
}

function playSong(index) {
  playSongInContext(allSongs, index, { openOverlay: false });
}

function updateNowPlaying(song) {
  mobileSongTitle.textContent = song.title;
  mobileSongArtist.textContent = song.artist || "COGMERS";
}

function updateMiniPlayer(song) {
  miniTitle.textContent = song.title;
  miniArtist.textContent = song.artist || "COGMERS";
}

function updateFullPlayer(song) {
  mobilePlayerTitle.textContent = song.title;
  mobilePlayerArtist.textContent = song.artist || "COGMERS";
  
  // Load lyrics if available
  if (song.lyrics && song.lyrics.length > 0) {
    renderMobileLyrics(song.lyrics);
  } else {
    const fallbackLyrics = getFallbackLyrics(song);
    if (fallbackLyrics.length > 0) {
      renderMobileLyrics(fallbackLyrics);
    } else {
      mobilePlayerLyrics.innerHTML = '<div class="lyric-line">No lyrics available</div>';
    }
  }
}

function renderMobileLyrics(lyrics) {
  mobilePlayerLyrics.innerHTML = lyrics.map((line, index) => `
    <div class="lyric-line" data-index="${index}">${line.text || line}</div>
  `).join('');
}

function updatePlayButton() {
  const playBtnHTML = isPlaying ? pauseIcon : playIcon;
  mobilePlay.innerHTML = playBtnHTML;
  mobileMiniPlay.innerHTML = playBtnHTML;
  miniPlayBtn.innerHTML = playBtnHTML;
}

function togglePlay(audioEl = getActiveAudio()) {
  if (!audioEl || !audioEl.src) return;

  if (audioEl.paused) {
    audioEl.play().catch(() => {});
    setPlayingState(true);
  } else {
    audioEl.pause();
    setPlayingState(false);
  }
  
  // Sync with desktop player
  window.dispatchEvent(new CustomEvent("mobilePlayPause", { 
    detail: { isPlaying } 
  }));
}

function playNext() {
  const list = getPlaybackList();
  if (!list.length) return;

  if (playbackMode === "one") {
    playSongInContext(list, playbackIndex, { openOverlay: songOverlay && songOverlay.classList.contains("active") });
    return;
  }

  let nextIndex = playbackIndex >= 0 ? playbackIndex : 0;
  if (playbackMode === "shuffle" && list.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * list.length);
    } while (nextIndex === playbackIndex);
  } else {
    nextIndex = nextIndex + 1;
    if (nextIndex >= list.length) {
      nextIndex = playbackMode === "all" ? 0 : list.length - 1;
    }
  }

  playSongInContext(list, nextIndex, { openOverlay: songOverlay && songOverlay.classList.contains("active") });
}

function playPrev() {
  const list = getPlaybackList();
  if (!list.length) return;

  if (playbackMode === "one") {
    playSongInContext(list, playbackIndex, { openOverlay: songOverlay && songOverlay.classList.contains("active") });
    return;
  }

  let prevIndex = playbackIndex >= 0 ? playbackIndex : 0;
  if (playbackMode === "shuffle" && list.length > 1) {
    do {
      prevIndex = Math.floor(Math.random() * list.length);
    } while (prevIndex === playbackIndex);
  } else {
    prevIndex = prevIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playbackMode === "all" ? list.length - 1 : 0;
    }
  }

  playSongInContext(list, prevIndex, { openOverlay: songOverlay && songOverlay.classList.contains("active") });
}

function getPlaybackModeIcon(mode) {
  switch (mode) {
    case "one":
      return repeatOneIcon;
    case "shuffle":
      return shuffleIcon;
    case "all":
    default:
      return repeatAllIcon;
  }
}

function updatePlaybackModeUI() {
  if (overlayRepeat) {
    overlayRepeat.innerHTML = getPlaybackModeIcon(playbackMode);
  }
  if (mobileRepeat) {
    mobileRepeat.innerHTML = getPlaybackModeIcon(playbackMode);
    mobileRepeat.style.color = "var(--accent)";
  }
  if (mobileShuffle) {
    mobileShuffle.style.color = playbackMode === "shuffle" ? "var(--accent)" : "var(--text)";
  }
}

function setPlaybackMode(mode) {
  playbackMode = mode;
  updatePlaybackModeUI();
}

function togglePlaybackMode() {
  const modes = ["all", "one", "shuffle"];
  const currentModeIndex = modes.indexOf(playbackMode);
  const nextMode = modes[(currentModeIndex + 1) % modes.length];
  setPlaybackMode(nextMode);
}

function openFullPlayer() {
  mobilePlayer.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeFullPlayer() {
  mobilePlayer.classList.remove("active");
  document.body.style.overflow = "";
}

function setupEventListeners() {
  // Now playing card click
  mobileNowPlaying.addEventListener("click", openFullPlayer);
  mobileMiniPlayer.addEventListener("click", openFullPlayer);
  
  // Player controls
  mobilePlay.addEventListener("click", togglePlay);
  mobileMiniPlay.addEventListener("click", togglePlay);
  miniPlayBtn.addEventListener("click", togglePlay);
  mobilePrev.addEventListener("click", playPrev);
  mobileNext.addEventListener("click", playNext);
  mobileRepeat.addEventListener("click", togglePlaybackMode);
  mobileShuffle.addEventListener("click", () => {
    setPlaybackMode(playbackMode === "shuffle" ? "all" : "shuffle");
  });
  mobilePlayerClose.addEventListener("click", closeFullPlayer);
  
  // Navigation
  mobileNavItems.forEach(item => {
    item.addEventListener("click", () => {
      mobileNavItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const nav = item.dataset.nav;
      handleNavigation(nav);
    });
  });
  
  // Categories
  mobileCategoriesList.forEach(cat => {
    cat.addEventListener("click", () => {
      mobileCategoriesList.forEach(c => c.classList.remove("active"));
      cat.classList.add("active");
      activeCategory = cat.dataset.category;
      renderSongList();
    });
  });
  
  // Search
  mobileSearchToggle.addEventListener("click", () => {
    mobileSearch.classList.add("active");
    mobileSearchInput.focus();
  });
  
  mobileSearchClose.addEventListener("click", () => {
    mobileSearch.classList.remove("active");
  });
  
  mobileSearchInput.addEventListener("input", handleSearch);
  
  // Seek
  mobileSeek.addEventListener("input", (e) => {
    const value = e.target.value;
    const duration = mobileAudio.duration || 0;
    const time = (value / 100) * duration;
    mobileAudio.currentTime = time;
    mobileCurrentTime.textContent = formatTime(time);
  });
  
  // Audio time update
  mobileAudio.addEventListener("timeupdate", () => {
    if (mobileAudio.duration) {
      const percent = (mobileAudio.currentTime / mobileAudio.duration) * 100;
      mobileSeek.value = percent;
      mobileCurrentTime.textContent = formatTime(mobileAudio.currentTime);
      mobileDuration.textContent = formatTime(mobileAudio.duration);
    }
  });

  mobileAudio.addEventListener("play", () => setPlayingState(true));
  mobileAudio.addEventListener("pause", () => setPlayingState(false));
  
  // Audio ended
  mobileAudio.addEventListener("ended", () => {
    if (playbackMode === "one") {
      mobileAudio.currentTime = 0;
      mobileAudio.play();
    } else {
      playNext();
    }
  });
  
  // Tab buttons for filtering playlist
  if (isMobileView && tabButtons && tabButtons.length > 0) {
    tabButtons.forEach(tab => {
      tab.addEventListener("click", () => {
        tabButtons.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        activeFilter = tab.dataset.filter;
        renderFilteredPlaylist();
      });
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (!mobilePlayer.classList.contains("active")) return;
    
    switch(e.key) {
      case " ":
      case "Play":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        playNext();
        break;
      case "ArrowLeft":
        playPrev();
        break;
      case "Escape":
        closeFullPlayer();
        break;
    }
  });
  
  // Swipe to close player
  let touchStartY = 0;
  mobilePlayer.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  });
  
  mobilePlayer.addEventListener("touchend", (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 100) {
      closeFullPlayer();
    }
  });
}

function handleNavigation(nav) {
  switch(nav) {
    case "home":
      activeFilter = "all";
      renderSongList();
      break;
    case "search":
      mobileSearch.classList.add("active");
      mobileSearchInput.focus();
      break;
    case "library":
      activeFilter = "audio";
      renderSongList();
      break;
    case "favorites":
      activeFilter = "favorites";
      renderSongList();
      break;
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  
  if (query.length < 2) {
    mobileSearchResults.innerHTML = '';
    searchResultsCache = [];
    return;
  }
  
  const results = allSongs.filter(song => 
    song.title.toLowerCase().includes(query) ||
    (song.artist && song.artist.toLowerCase().includes(query))
  );
  searchResultsCache = results;
  
  mobileSearchResults.innerHTML = results.map((song, index) => `
    <div class="mobile-song-item" data-index="${allSongs.indexOf(song)}" data-playlist-index="${index}">
      <span class="song-number">${song.no}</span>
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">${song.artist || 'COGMERS'}</div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  mobileSearchResults.querySelectorAll(".mobile-song-item").forEach(item => {
    item.addEventListener("click", () => {
      const playlistIndex = parseInt(item.dataset.playlistIndex);
      playSongInContext(searchResultsCache, playlistIndex, { openOverlay: false });
      mobileSearch.classList.remove("active");
      mobileSearchInput.value = '';
      mobileSearchResults.innerHTML = '';
      searchResultsCache = [];
    });
  });
}

function renderFilteredPlaylist() {
  if (!playlistBody || !isMobileView) return;

  displayedSongs = getFilteredSongs({ includeCategory: false });
  console.log("[mobile] allSongs:", allSongs.length, "displayed:", displayedSongs.length, "filter:", activeFilter);
  updatePlaybackContextFromDisplayed();
  
  playlistBody.innerHTML = displayedSongs.map((song, index) => `
    <div class="playlist-item" data-index="${allSongs.indexOf(song)}" data-playlist-index="${index}">
      <span class="song-num">${song.no}</span>
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-meta">${song.artist || 'COGMERS'}</div>
      </div>
      <span class="song-duration">${song.duration || '--:--'}</span>
    </div>
  `).join("");
  
  // Add click handlers
  document.querySelectorAll(".playlist-item").forEach(item => {
    item.addEventListener("click", () => {
      const playlistIndex = parseInt(item.dataset.playlistIndex);
      playSongInContext(displayedSongs, playlistIndex, { openOverlay: true });
    });
  });
  
  // Update song count
  if (songCountEl) {
    songCountEl.textContent = `${displayedSongs.length} songs`;
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function syncWithDesktopPlayer() {
  // Listen for desktop player events
  window.addEventListener("desktopPlayerChange", (e) => {
    const { currentIndex: idx, isPlaying: playing, song } = e.detail;
    currentIndex = idx;
    isPlaying = playing;
    
    if (song) {
      updateNowPlaying(song);
      updateMiniPlayer(song);
      updateFullPlayer(song);
    }
    
    updatePlayButton();
    renderSongList();
  });
}

// Export for external use
window.mobilePlayerAPI = {
  playSong,
  togglePlay,
  playNext,
  playPrev,
  getCurrentSong: () => allSongs[currentIndex],
  getIsPlaying: () => isPlaying,
  getSongs: () => allSongs
};
