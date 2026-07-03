# Дош — Kelime Denetim Raporu

**Tarih:** 2 Temmuz 2026
**Yöntem:** Oyundaki 371 ızgara + 395 bonus kelimenin tamamı, (1) projedeki 7 kelime
listesiyle ve (2) Wiktionary'nin resmî Çeçence lemma kategorisiyle (1001 kelime,
API'den indirildi) çapraz kontrol edildi. Şüpheli anlamlar tek tek
en.wiktionary.org'dan doğrulandı.

## 1. Kaldırılan Rusça/geçersiz ızgara kelimeleri (11) → gerçek Çeçence karşılıkları

| Seviye | Eski (hatalı) | Yeni | Anlamı | Doğrulama |
|---|---|---|---|---|
| 20 | цийг (sözde "kedi") | **къийг** | karga | Wiktionary ✓ |
| 56 | долг (Rusça: borç) | **гола** | diz, dirsek | Wiktionary ✓ |
| 60 | удача (Rusça: şans) | **атагӀи** | nehir vadisi | Wiktionary ✓ |
| 63 | землю (Rusça: toprağı) | **кӀомал** | kenevir | Wiktionary ✓ |
| 72 | плач (Rusça: ağlayış) | **агар** | yontma, oyma | Wiktionary ✓ |
| 77 | корова (Rusça: inek) | **морзах** | kerpeten, maşa | Wiktionary ✓ |
| 81 | забыть (Rusça: unutmak) | **баймакх** | ayak | Wiktionary ✓ |
| 82 | зверь (Rusça: canavar) | **бӀежу** | örümcekgillerden hayvan | Wiktionary ✓ |
| 90 | умелый (Rusça: becerikli) | — çıkarıldı (uyan Çeçence kelime yok) | | |
| 95 | истина (Rusça: hakikat) | — çıkarıldı (uyan Çeçence kelime yok) | | |
| 100 | показ (Rusça: gösterim) | **шопар** | şoför | Wiktionary ✓ |

Değişen seviyelerin harf çarkları yeniden hesaplandı; tüm kelime + bonus
tutarlılığı otomatik testle doğrulandı (0 hata).

## 2. Silinen Rusça/bozuk bonus kelimeler (17)

на, лх, не, по, адм, сад, без, мир, рту, дует, вне, нет, мера, тихо, пика, пиво, сук

## 3. Düzeltilen kelime anlamları (16)

| Kelime | Eski (YANLIŞ) | Yeni (doğru) |
|---|---|---|
| пхьид | parmak | **kurbağa** |
| сий | geyik | **şeref, onur** |
| човка | çorba | **küçük karga** |
| борц | buzağı | **darı** |
| пхьар | erkek | **usta, zanaatkâr** |
| Ӏад | uyku | **yay (ok atmak için)** |
| тӀам | damak tadı, tat | **kanat** |
| пӀенда | yanak, avuç | **kaburga** |
| шад | bal | **düğüm** |
| еара | çayır | **perşembe** |
| саца | karar | **durmak** |
| моза | sinek, arı | **sinek** |
| бурам | deve | **feribot, sal** |
| гурма | manda | **saban çarkı** |
| хешт | izin | **su samuru** |
| саба | sebep | **sabun** |

> Not: Bu hataların kaynağı `cechen_curated_for_game.txt` dosyası — orada da aynı
> yanlış anlamlar var. Orijinal projedeki `assets/i18n/ce.json` ve
> `assets/levels/levels.json` da yamalandı (yedekler: `*.bak-kelime-duzeltme`).

## 4. Gözden geçirilmesi önerilen kelimeler (düşük öncelik)

Wiktionary kapsamı sınırlı olduğu için "listede yok" ≠ "yanlış"; ancak
şunlar anadili konuşan birine danışılmalı (çoğu pack 4'ün üretilmiş
seviyelerinden): `гос (lv43)`, `оти (lv63)`, `варе (lv72)`, `пийсак (lv73)`,
`эчена (lv74)`, `бахтар (lv75)`, `эличи (lv70)`, `харриб (lv91)`,
`акхшо (lv91)`, `назбар (lv91)`, `авсал (lv79)`, `пилмот (lv79)`,
`мужца (lv90)`, `вотаца (lv87)`, `лулео (lv47)`, `кхинд (lv44)`,
`баран (lv66)`, `гийзаг (lv100)`.

Rusçadan alıntı ay adları (`март`, `июнь`, `ноябрь`) modern Çeçencede
kullanıldığı için bırakıldı.
