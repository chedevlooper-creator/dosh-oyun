/* ================= ÇOKLU DİL (i18n) ALTYAPISI ================= */

import { S, commitSettings } from "../engine/store.js";

const translations = {
  ce: {
    // Ana Ekran
    "home.start": "Ловза йолае ▶",
    "home.continue": "Кхин дӀа ▶",
    "home.play": "Ловзар",
    // Harita
    "map.title": "ТӀегӀанийн карта",
    "map.pack": "ДАКЪА",
    "map.level": "ТӀегӀа",
    "map.now": "ХӀинца",
    "map.locked": "ГӀайгӀа",
    "map.lockMsg": "Хьалхара тӀегӀа чекхйаккха 🔒",
    // Oyun
    "game.level": "ТӀЕГӀА",
    "game.bonus": "Бонус<br>дешнаш",
    "game.hintLetter": "ХӀарф<br>хьахо",
    "game.hintTarget": "ХӀан<br>хьахо",
    "game.hintWand": "Хьехаман<br>тай",
    "game.found": "ХӀара дош карийна!",
    "game.bonusFound": "Карина бонус",
    "game.wrong": "Дош нийса дац!",
    "game.needCoins": "🪙 оьшу",
    "game.targetMsg": "Яьшка харжа 🎯",
    // Seviye Sonu
    "end.title": "Декъал! 🎉",
    "end.words": "Кхочушдина дешнаш",
    "end.bonus": "Бонус дешнаш 💎",
    "end.earned": "Карина сом",
    "end.map": "Карта",
    "end.next": "Кхин дӀа ▶",
    // İstatistik & Sözlük
    "stats.title": "Статистика 📊",
    "stats.desc": "Хьан кхочушдина болх, ловзарийн маьӀна а сомийн бехкам.",
    "dict.title": "Дошам 📖",
    "dict.desc": "Кхочушдина дешнаш а цар маьӀнаш а хӀокху чу кхолла.",
    "dict.search": "Лаха…",
    "dict.empty": "ХӀинца а цахила.<br>Дешнаш кхочушдича, хьан дошам хӀокху чу йовлар ю.",
    "dict.notFound": "Ца карийна.<br>Кхин а къастам я лаха.",
    // Ayarlar
    "settings.title": "Нисдарш ⚙️",
    "settings.theme": "Кеп",
    "settings.sound": "Аз 🔔",
    "settings.music": "Мукъам 🎵",
    "settings.lang": "Мотт 🌐",
    "settings.tut": "Хьехам",
    "settings.reset": "Юхадаккха",
    "settings.back": "Юха",
    "settings.resetTitle": "Юхадаккха",
    "settings.resetMsg": "Массо а хаамаш дӀадаха?",
    "settings.resetNo": "ХӀан-хӀа",
    "settings.resetYes": "ХӀаъ, юхадаккха",
  },
  tr: {
    // Türkçe örnek çeviriler (diaspora için)
    "home.start": "Başla ▶",
    "home.continue": "Devam Et ▶",
    "home.play": "Oyun",
    "map.title": "Seviye Haritası",
    "map.pack": "BÖLÜM",
    "map.level": "Seviye",
    "map.now": "Şimdi",
    "map.locked": "Kilitli",
    "map.lockMsg": "Önceki seviyeyi tamamlayın 🔒",
    "game.level": "SEVİYE",
    "game.bonus": "Bonus<br>Kelimeler",
    "game.hintLetter": "Harf<br>İpucu",
    "game.hintTarget": "Hedef<br>İpucu",
    "game.hintWand": "Sihirli<br>Değnek",
    "game.found": "Bu kelime zaten bulundu!",
    "game.bonusFound": "Bonus bulundu",
    "game.wrong": "Yanlış kelime!",
    "game.needCoins": "🪙 gerekiyor",
    "game.targetMsg": "Bir kutu seçin 🎯",
    "end.title": "Tebrikler! 🎉",
    "end.words": "Bulunan kelimeler",
    "end.bonus": "Bonus kelimeler 💎",
    "end.earned": "Kazanılan",
    "end.map": "Harita",
    "end.next": "İleri ▶",
    "stats.title": "İstatistikler 📊",
    "stats.desc": "Oyun ilerlemeniz ve başarılarınız.",
    "dict.title": "Sözlük 📖",
    "dict.desc": "Bulduğunuz kelimeler ve anlamları burada toplanır.",
    "dict.search": "Ara…",
    "dict.empty": "Henüz boş.<br>Kelime buldukça sözlüğünüz dolacak.",
    "dict.notFound": "Bulunamadı.<br>Başka bir kelime arayın.",
    "settings.title": "Ayarlar ⚙️",
    "settings.theme": "Tema",
    "settings.sound": "Ses 🔔",
    "settings.music": "Müzik 🎵",
    "settings.lang": "Dil 🌐",
    "settings.tut": "Nasıl Oynanır",
    "settings.reset": "Sıfırla",
    "settings.back": "Geri",
    "settings.resetTitle": "Sıfırla",
    "settings.resetMsg": "Tüm ilerleme silinsin mi?",
    "settings.resetNo": "Hayır",
    "settings.resetYes": "Evet, sil",
  }
};

/**
 * Mevcut dile göre çeviri döndürür
 * @param {string} key - Çeviri anahtarı (örn: "home.start")
 * @param  {...any} args - Format parametreleri
 * @returns {string}
 */
export function t(key, ...args) {
  const lang = S.settings.lang || "ce";
  const dict = translations[lang] || translations["ce"];
  let str = dict[key] || translations["ce"][key] || key;
  
  if (args.length > 0) {
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
  }
  return str;
}

export function getLanguages() {
  return [
    { code: "ce", name: "Нохчийн" },
    { code: "tr", name: "Türkçe" }
  ];
}

export function setLanguage(code) {
  if (translations[code]) {
    commitSettings({ lang: code });
    location.reload(); // Dil değiştiğinde arayüzü yenile
  }
}
