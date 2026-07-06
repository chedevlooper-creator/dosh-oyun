# M002: Time Attack Skor Kaydı ve Kalıcı Leaderboard

**Vision:** Time Attack skorlarını S.stats'a kaydet, ana ekranda ve istatistiklerde en iyi skoru göster, leaderboard'u kalıcı ve erişilebilir yap.

## Slices

- [x] **S01: Skor Kalıcılığı ve Store Entegrasyonu** `risk:low` `depends:[]`
  > After this: Time Attack bitince skor S.stats.taBest'e kaydedilir; sayfa yenilense bile skor kalır.

- [x] **S02: Ana Ekran ve İstatistiklerde Skor Gösterimi** `risk:low` `depends:[S01]`
  > After this: Ana ekranda 'En İyi TA: 850' gösterilir; istatistikler panelinde TA bölümü vardır.

## Boundary Map

Not provided.
