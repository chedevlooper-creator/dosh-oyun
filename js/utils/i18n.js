// @ts-check
/* ================= ÇOKLU DİL (i18n) ALTYAPISI ================= */

import { S, commitSettings } from "../engine/store.js";

/** Dil kodu → yön eşlemesi */
export const DIR_MAP = {
  ce: "ltr",
  ru: "ltr",
  tr: "ltr",
  // Gelecekte RTL diller: ar: "rtl", fa: "rtl", he: "rtl", ku: "rtl", ur: "rtl"
};

/** Mevcut dilin yönünü döndürür */
export function getDir() {
  const lang = S.settings.lang || "ce";
  return DIR_MAP[lang] || "ltr";
}

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
    "game.needCoins": "{0} 🪙 оьшу",
    "game.targetMsg": "Яьшка харжа 🎯",
    "game.bonusMsg": "💎 Карина бонус +{0} 🪙",
    "game.combo": "🔥 x{0}  +{1} 🪙",
    "game.bonusChest": "💎 {0}",
    "game.gridLabel": "Ловзаран майда",
    "game.cellPos": "МогӀа {0}, хилам {1}",
    "game.cellFilled": "МогӀа {0}, хилам {1}, хӀарф {2}",
    "game.letterLabel": "ХӀарф {0}",
    // Seviye Sonu
    "end.title": "Декъал! 🎉",
    "end.level": "ТӀегӀа",
    "end.words": "Кхочушдина дешнаш",
    "end.bonus": "Бонус дешнаш 💎",
    "end.earned": "Карина сом",
    "end.map": "Карта",
    "end.next": "Кхин дӀа ▶",
    // İstatistik
    "stats.title": "Статистика 📊",
    "stats.desc": "Хьан кхочушдина болх, ловзарийн маьӀна а сомийн бехкам.",
    "stats.progress": "Кхочушдар",
    "stats.levels": "ТӀегӀан",
    "stats.stars": "Седийн",
    "stats.gameplay": "Ловзар",
    "stats.wordsFound": "Кхочушдина дешнаш",
    "stats.bonusFound": "Карина бонус",
    "stats.hints": "Хьехамаш",
    "stats.streak": "Уггаре дукха могӀа",
    "stats.coins": "Сом",
    "stats.earned": "Даьккхина 🪙",
    "stats.spent": "Доьхна 🪙",
    // Sözlük
    "dict.title": "Дошам 📖",
    "dict.desc": "Кхочушдина дешнаш а цар маьӀнаш а хӀокху чу кхолла.",
    "dict.search": "Лаха…",
    "dict.searchLabel": "Лаха дош",
    "dict.empty": "ХӀинца а цахила.<br>Дешнаш кхочушдича, хьан дошам хӀокху чу йовлар ю.",
    "dict.notFound": "Ца карийна.<br>Кхин а къастам я лаха.",
    // Ayarlar
    "settings.title": "Нисдарш ⚙️",
    "settings.theme": "Кеп",
    "settings.sound": "Аз 🔔",
    "settings.music": "Мукъам 🎵",
    "settings.lang": "Мотт 🌐",
    "settings.tut": "Хьехам",
    "settings.report": "Эшам 🐞",
    "settings.feedback": "Хаам ✍️",
    "fb.title": "Хаам",
    "fb.desc": "Дош ➕ я нисдар ✏️ — хаам.",
    "fb.new": "Дош",
    "fb.fix": "Нисдар",
    "fb.word": "Дош…",
    "fb.msg": "Хаам…",
    "settings.reset": "Юхадаккха",
    "settings.back": "Юха",
    "settings.resetTitle": "Юхадаккха",
    "settings.resetMsg": "Массо а хаамаш дӀадаха?",
    "settings.resetNo": "ХӀан-хӀа",
    "settings.resetYes": "ХӀаъ, юхадаккха",
    // Rehber (Tutorial)
    "tut.0.title": "Дош ойлане!",
    "tut.0.body": "Харфаш харжа, дешнаш лаха.",
    "tut.0.btn": "Болх бале!",
    "tut.1.title": "Харфаш харжа",
    "tut.1.body": "ПӀелг харфех хьекха: «Д», «О», «Ш» → «ДОШ».",
    "tut.1.btn": "Кхин дӀа",
    "tut.2.title": "ГӀирс",
    "tut.2.body": "Хьехам 💡 — 25 🪙. ХӀан хьахо 🎯 — 35 🪙. Хьехаман тай 🪄 — 60 🪙.",
    "tut.2.btn": "Кхин дӀа",
    "tut.3.title": "Кечдина!",
    "tut.3.body": "ХӀинца ловза.",
    "tut.3.btn": "Ловза йолае!",
    "tut.skip": "Арадовла",
    // Panel
    "panel.close": "ДӀачӀагӀа",
  },
  ru: {
    // Russian (для второй аудитории)
    "home.start": "Начать ▶",
    "home.continue": "Продолжить ▶",
    "home.play": "Играть",
    "map.title": "Карта уровней",
    "map.pack": "ПАКЕТ",
    "map.level": "Уровень",
    "map.now": "Сейчас",
    "map.locked": "Заблокировано",
    "map.lockMsg": "Сначала завершите предыдущий уровень 🔒",
    "game.level": "УРОВЕНЬ",
    "game.bonus": "Бонусные<br>слова",
    "game.hintLetter": "Буква<br>подсказка",
    "game.hintTarget": "Цель<br>подсказка",
    "game.hintWand": "Волшебная<br>палочка",
    "game.found": "Это слово уже найдено!",
    "game.bonusFound": "Бонус найден",
    "game.wrong": "Неверное слово!",
    "game.needCoins": "{0} 🪙 нужно",
    "game.targetMsg": "Выберите клетку 🎯",
    "game.bonusMsg": "💎 Бонус найден +{0} 🪙",
    "game.combo": "🔥 x{0}  +{1} 🪙",
    "game.bonusChest": "💎 {0}",
    "game.gridLabel": "Сетка кроссворда",
    "game.cellPos": "Строка {0}, столбец {1}",
    "game.cellFilled": "Строка {0}, столбец {1}, буква {2}",
    "game.letterLabel": "Буква {0}",
    "end.title": "Поздравляем! 🎉",
    "end.level": "Уровень",
    "end.words": "Найденные слова",
    "end.bonus": "Бонусные слова 💎",
    "end.earned": "Заработано",
    "end.map": "Карта",
    "end.next": "Дальше ▶",
    "stats.title": "Статистика 📊",
    "stats.desc": "Ваш прогресс и достижения.",
    "stats.progress": "Прогресс",
    "stats.levels": "Уровни",
    "stats.stars": "Звёзды",
    "stats.gameplay": "Игра",
    "stats.wordsFound": "Найденные слова",
    "stats.bonusFound": "Бонусов найдено",
    "stats.hints": "Подсказки",
    "stats.streak": "Лучшая серия",
    "stats.coins": "Монеты",
    "stats.earned": "Заработано 🪙",
    "stats.spent": "Потрачено 🪙",
    "dict.title": "Словарь 📖",
    "dict.desc": "Найденные слова и их значения собираются здесь.",
    "dict.search": "Поиск…",
    "dict.searchLabel": "Поиск слова",
    "dict.empty": "Пока пусто.<br>По мере нахождения слов ваш словарь будет заполняться.",
    "dict.notFound": "Не найдено.<br>Попробуйте другой поиск.",
    "settings.title": "Настройки ⚙️",
    "settings.theme": "Тема",
    "settings.sound": "Звук 🔔",
    "settings.music": "Музыка 🎵",
    "settings.lang": "Язык 🌐",
    "settings.tut": "Обучение",
    "settings.report": "Отчёты об ошибках 🐞",
    "settings.feedback": "Обратная связь ✍️",
    "fb.title": "Обратная связь",
    "fb.desc": "Предложите новое слово или сообщите об ошибке — мы рассмотрим.",
    "fb.new": "Новое слово",
    "fb.fix": "Исправление",
    "fb.word": "Слово…",
    "fb.msg": "Ваше сообщение…",
    "settings.reset": "Сброс",
    "settings.back": "Назад",
    "settings.resetTitle": "Сброс",
    "settings.resetMsg": "Удалить весь прогресс?",
    "settings.resetNo": "Нет",
    "settings.resetYes": "Да, сбросить",
    "tut.0.title": "Дош — давай начнём!",
    "tut.0.body": "Выбирай буквы, собирай слова.",
    "tut.0.btn": "Поехали!",
    "tut.1.title": "Выбор букв",
    "tut.1.body": "Проведи пальцем по буквам: «Д», «О», «Ш» → «ДОШ».",
    "tut.1.btn": "Далее",
    "tut.2.title": "Инструменты",
    "tut.2.body": "Подсказка 💡 — 25 🪙. Цель 🎯 — 35 🪙. Волшебная палочка 🪄 — 60 🪙.",
    "tut.2.btn": "Далее",
    "tut.3.title": "Готов!",
    "tut.3.body": "Теперь играй!",
    "tut.3.btn": "Начать игру!",
    "tut.skip": "Пропустить",
    "panel.close": "Закрыть",
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
    "game.needCoins": "{0} 🪙 gerekiyor",
    "game.targetMsg": "Bir kutu seçin 🎯",
    "game.bonusMsg": "💎 Bonus bulundu +{0} 🪙",
    "game.combo": "🔥 x{0}  +{1} 🪙",
    "game.bonusChest": "💎 {0}",
    "game.gridLabel": "Bulmaca ızgarası",
    "game.cellPos": "Satır {0}, sütun {1}",
    "game.cellFilled": "Satır {0}, sütun {1}, harf {2}",
    "game.letterLabel": "Harf {0}",
    "end.title": "Tebrikler! 🎉",
    "end.level": "Seviye",
    "end.words": "Bulunan kelimeler",
    "end.bonus": "Bonus kelimeler 💎",
    "end.earned": "Kazanılan",
    "end.map": "Harita",
    "end.next": "İleri ▶",
    "stats.title": "İstatistikler 📊",
    "stats.desc": "Oyun ilerlemeniz ve başarılarınız.",
    "stats.progress": "İlerleme",
    "stats.levels": "Seviyeler",
    "stats.stars": "Yıldızlar",
    "stats.gameplay": "Oynanış",
    "stats.wordsFound": "Bulunan kelimeler",
    "stats.bonusFound": "Bulunan bonus",
    "stats.hints": "İpuçları",
    "stats.streak": "En iyi seri",
    "stats.coins": "Paralar",
    "stats.earned": "Kazanılan 🪙",
    "stats.spent": "Harcanan 🪙",
    "dict.title": "Sözlük 📖",
    "dict.desc": "Bulduğunuz kelimeler ve anlamları burada toplanır.",
    "dict.search": "Ara…",
    "dict.searchLabel": "Kelime ara",
    "dict.empty": "Henüz boş.<br>Kelime buldukça sözlüğünüz dolacak.",
    "dict.notFound": "Bulunamadı.<br>Başka bir kelime arayın.",
    "settings.title": "Ayarlar ⚙️",
    "settings.theme": "Tema",
    "settings.sound": "Ses 🔔",
    "settings.music": "Müzik 🎵",
    "settings.lang": "Dil 🌐",
    "settings.tut": "Nasıl Oynanır",
    "settings.report": "Hata bildirimi 🐞",
    "settings.feedback": "Geri bildirim ✍️",
    "fb.title": "Geri bildirim",
    "fb.desc": "Yeni kelime öner ya da hatalı kelimeyi bildir — ekip değerlendirir.",
    "fb.new": "Yeni kelime",
    "fb.fix": "Düzeltme",
    "fb.word": "Kelime…",
    "fb.msg": "Mesajınız…",
    "settings.reset": "Sıfırla",
    "settings.back": "Geri",
    "settings.resetTitle": "Sıfırla",
    "settings.resetMsg": "Tüm ilerleme silinsin mi?",
    "settings.resetNo": "Hayır",
    "settings.resetYes": "Evet, sil",
    "tut.0.title": "Dosh — başlayalım!",
    "tut.0.body": "Harfleri seç, kelimeleri bul.",
    "tut.0.btn": "Başla!",
    "tut.1.title": "Harfleri seç",
    "tut.1.body": "Parmağını harflerde gezdir: «Д», «О», «Ш» → «ДОШ».",
    "tut.1.btn": "İleri",
    "tut.2.title": "Araçlar",
    "tut.2.body": "İpucu 💡 — 25 🪙. Hedef 🎯 — 35 🪙. Sihirli değnek 🪄 — 60 🪙.",
    "tut.2.btn": "İleri",
    "tut.3.title": "Hazır!",
    "tut.3.body": "Şimdi oyna.",
    "tut.3.btn": "Oyuna başla!",
    "tut.skip": "Atla",
    "panel.close": "Kapat",
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
    { code: "ce", name: "Нохчийн", dir: "ltr" },
    { code: "tr", name: "Türkçe", dir: "ltr" },
    { code: "ru", name: "Русский", dir: "ltr" },
  ];
}

export function setLanguage(code) {
  if (translations[code]) {
    commitSettings({ lang: code });
    if (typeof document !== "undefined") {
      document.documentElement.lang = code;
      document.documentElement.dir = DIR_MAP[code] || "ltr";
    }
    location.reload();
  }
}
