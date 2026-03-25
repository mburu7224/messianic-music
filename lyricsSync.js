// Lyrics sync helpers for the frontend player

export function getActiveLyricIndex(currentTime, lyrics) {
  if (!Array.isArray(lyrics) || lyrics.length === 0) return -1;

  let low = 0;
  let high = lyrics.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].time <= currentTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

export function scrollLyricsToActive(containerEl, lineEls, activeIndex) {
  if (!containerEl || !lineEls || activeIndex < 0) return;

  const activeEl = lineEls[activeIndex];
  if (!activeEl) return;

  const containerRect = containerEl.getBoundingClientRect();
  const activeRect = activeEl.getBoundingClientRect();
  // Center the active line vertically within the container
  const offset = activeEl.offsetTop - containerEl.clientHeight / 2 + activeEl.clientHeight / 2;

  containerEl.scrollTo({
    top: Math.max(0, offset),
    behavior: "smooth",
  });
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
