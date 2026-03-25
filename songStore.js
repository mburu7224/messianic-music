import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
} from "./firebase.js";
import { lyricsCatalog } from "./lyricsCatalog.js";

const lyricsByTitle = new Map(
  lyricsCatalog.map((item) => [item.title.toLowerCase(), item.lines])
);
const lyricsByNo = new Map(lyricsCatalog.map((item) => [item.no, item.lines]));

const songCatalog = [
  { no: 1, title: "SOMA ZEFANIA" },
  { no: 2, title: "YASHUA MASIHI ALIENDA" },
  { no: 3, title: "NINATAMANI" },
  { no: 4, title: "YAHSHUA MESSIAH BWANA WETU" },
  { no: 5, title: "SIKU MOJA" },
  { no: 6, title: "MAISHA YANGU YOTE" },
  { no: 7, title: "KITABU CHA ISAIA" },
  { no: 8, title: "PAULO ALIYETUMWA" },
  { no: 9, title: "TUSOMENI ZABURI" },
  { no: 10, title: "ZABURI HAMSINI NA MOJA" },
  { no: 11, title: "YOHANA TATU" },
  { no: 12, title: "MWISHO WA DUNIA" },
  { no: 13, title: "DUNIANI" },
  { no: 14, title: "ULIPAA" },
  { no: 15, title: "HAMA WE" },
  { no: 16, title: "NINA FURAHA" },
  { no: 17, title: "SIKU ZAJA" },
  { no: 18, title: "NIKITAFAKARI" },
  { no: 19, title: "NATANGAZA JINA" },
  { no: 20, title: "ZAYUNI NINAUTAMANI" },
  { no: 21, title: "SIKU YA KURUDI" },
  { no: 22, title: "SOMA ZABURI MIA MOJA" },
  { no: 23, title: "TAZAMA MBINGU NA NCHI" },
  { no: 24, title: "KAMA WEWE UMEPATA NENO" },
  { no: 25, title: "SIKIENI HABARI YA MWISHO" },
  { no: 26, title: "ELOHIM MUNGU WA YAKOBO" },
  { no: 27, title: "TAZAMENI PENDO" },
  { no: 28, title: "WAEFESO MLANGO WA PILI" },
  { no: 29, title: "KAMA NDEGE WAMWIMBIAVYO" },
  { no: 30, title: "TUIMBE WIMBO" },
  { no: 31, title: "SOMENI UFUNUO ISHIRINI" },
  { no: 32, title: "YULE YOHANA" },
  { no: 33, title: "YOHANA MTUME" },
  { no: 34, title: "BASI NDUGU ZANGU" },
  { no: 35, title: "BWANA MUNGU AKASEMA" },
  { no: 36, title: "TWAINGOJEA SIKU YA BWANA" },
  { no: 37, title: "ELOHIM BABA MWENYEZI" },
  { no: 38, title: "FADHILI ZA BWANA" },
  { no: 39, title: "DUNIANI KUNA GIZA (PRAISE OR PRAYERS)" },
  { no: 40, title: "JIANDAENI KUJA MASIHI" },
  { no: 41, title: "KATIKA UFUNUO" },
  { no: 42, title: "PETERO LISHA KONDOO WANGU" },
  { no: 43, title: "PETERO WA YOHANA" },
  { no: 44, title: "SOMENI EZEKIELI 5:5" },
  { no: 45, title: "AYUBU 1:1" },
  { no: 46, title: "UAMINIFU WA BWANA" },
  { no: 47, title: "UKIANGALIA DUNIA HII" },
  { no: 48, title: "BINTI WA ZAYUNI" },
  { no: 49, title: "ELOHIM AKUPENDA" },
  { no: 50, title: "TAZAMENI MAAJABU" },
  { no: 51, title: "EE BWANA" },
  { no: 52, title: "TUTAKAPOFIKA ZAYUNI" },
  { no: 53, title: "ABARIKIWE BWANA" },
  { no: 54, title: "YAHSHUA NI NGOME" },
  { no: 55, title: "YAHSHUA YU MWEMA" },
];

const normalizeLyricsLines = (lines) =>
  (lines || []).map((line, index) => ({
    time: Number(index * 2),
    text: String(line).trim(),
  }));

export const getFallbackLyrics = (song) => {
  if (!song) return [];
  const byTitle = lyricsByTitle.get((song.title || "").toLowerCase());
  if (byTitle && byTitle.length) return normalizeLyricsLines(byTitle);
  if (typeof song.no === "number") {
    const byNo = lyricsByNo.get(song.no);
    if (byNo && byNo.length) return normalizeLyricsLines(byNo);
  }
  return [];
};

const normalizeKey = (song) =>
  `${String(song.title || "").toLowerCase()}|${String(
    song.artist || ""
  ).toLowerCase()}`;

const sortSongs = (list) =>
  list.sort((a, b) => {
    if (typeof a.no === "number" && typeof b.no === "number") {
      return a.no - b.no;
    }
    return String(a.title || "").localeCompare(String(b.title || ""));
  });

export const loadAllSongs = async () => {
  const merged = new Map();

  songCatalog.forEach((song) => {
    const base = {
      id: `local-${song.no}`,
      no: song.no,
      title: song.title,
      artist: "COGMERS",
      audioUrl: "",
      lyrics: getFallbackLyrics(song),
    };
    merged.set(`no:${song.no}`, base);
  });

  try {
    const songsCol = collection(db, "songs");
    const songsQuery = query(songsCol, orderBy("createdAt", "desc"));
    const songsSnap = await getDocs(songsQuery);
    const songsDocs = songsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const musicCol = collection(db, "MusicSongs");
    const musicQuery = query(musicCol, orderBy("createdAt", "desc"));
    const musicSnap = await getDocs(musicQuery);
    const musicSongs = musicSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    songsDocs.forEach((song) => {
      const key =
        typeof song.no === "number" ? `no:${song.no}` : normalizeKey(song);
      const existing = merged.get(key);
      const lyrics =
        song.lyrics && song.lyrics.length ? song.lyrics : existing?.lyrics;
      merged.set(key, {
        ...existing,
        ...song,
        lyrics: lyrics || getFallbackLyrics(song),
      });
    });

    musicSongs.forEach((song) => {
      const key =
        typeof song.no === "number" ? `no:${song.no}` : normalizeKey(song);
      const existing = merged.get(key) || {};
      const mergedLyrics =
        existing.lyrics && existing.lyrics.length
          ? existing.lyrics
          : song.lyrics && song.lyrics.length
            ? song.lyrics
            : getFallbackLyrics(song);
      const audioUrl = song.audioUrl || existing.audioUrl || "";

      merged.set(key, {
        ...existing,
        ...song,
        audioUrl,
        lyrics: mergedLyrics,
      });
    });
  } catch (err) {
    console.error("loadAllSongs failed, using local catalog:", err);
  }

  return sortSongs(Array.from(merged.values()));
};
