# LifeContext 2026

Telegram Mini App (TMA) - Foydalanuvchining unumdorligini oshirish, kayfiyatini kuzatish va AI bilan muloqot qilishga mo'ljallangan ilova.

## Xususiyatlar

- **Pomodoro Timer** - 15/25/50 daqiqalik fokus taymer, progress-bar, ovozli signal, mukofotlar tizimi
- **Kayfiyat va Stress kuzatuvi** - Kunlik kayfiyat, stress, uyqu, ijtimoiy tarmoq vaqti, xarajatlarni kuzatish
- **AI Yordamchi** - Gemini AI bilan suhbat, kunlik tahlil, maqsadlar yaratish
- **Kundalik** - Notion uslubidagi yozuv muharriri, shablonlar, teglar
- **Kutubxona** - Kitoblar ro'yxati, o'qish jarayoni, AI tavsiyalar
- **Statistika** - Haftalik, oylik, yillik ko'rsatkichlar, grafiklar, kalendar

## Texnologiyalar

- HTML5, CSS3, Vanilla JavaScript
- Telegram Web App SDK (`telegram-web-app.js`)
- Google Gemini AI API (fallback mexanizm bilan)
- localStorage (ma'lumotlarni saqlash)
- Telegram CloudStorage (bulutga sinxronlash)

## Loyiha strukturasi

```
lifecontext-2026/
├── index.html          # Asosiy HTML - barcha sahifalar
├── style.css           # CSS dizayn tizimi (dark/light mode)
├── js/
│   ├── telegram.js     # Telegram WebApp integratsiyasi
│   ├── pomodoro.js     # Pomodoro timer moduli
│   ├── mood.js         # Kayfiyat kuzatuv moduli
│   ├── chat.js         # AI chat interfeysi
│   ├── diary.js        # Kundalik moduli
│   ├── library.js      # Kutubxona moduli
│   ├── stats.js        # Statistika moduli
│   └── app.js          # Asosiy ilova moduli
└── README.md
```

## Ishga tushirish

```bash
# Oddiy HTTP server bilan
python3 -m http.server 8080

# Brauzerda ochish
# http://localhost:8080
```

## Telegram integratsiya

- ThemeParams orqali dark/light mode avtomatik aniqlash
- MainButton - asosiy harakat tugmasi
- BackButton - orqaga qaytish
- HapticFeedback - tugmalar uchun tebranish effektlari
- Foydalanuvchi ismini profildan olish
- CloudStorage - bulutga ma'lumotlarni sinxronlash

## Muallif

Sardorbek Turdiyev - [t.me/Turdiyev_007](https://t.me/Turdiyev_007)
