---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Sentry durumunu doğrula ve build analizini belgele

Sentry zaten ayrı bir chunk (sentry-IucMPv48.js, 463KB/153KB gzip) ve sadece reportError çağrıldığında lazy-load oluyor. main chunk 56KB/20KB gzip ile hedefin altında. Bu task'ta mevcut durumu belgeleyip S01'i kapatacağız. Eğer ek optimizasyon gerekirse (örn. Sentry chunk'ının daha da ertelenmesi), onu not edeceğiz.

## Inputs

- `js/utils/report.js`
- `js/main.js`

## Expected Output

- `js/utils/report.js`

## Verification

npm run build && ls -lh dist/assets/sentry-*.js dist/assets/main-*.js
