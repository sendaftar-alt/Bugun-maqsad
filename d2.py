import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

# Siz taqdim etgan API Token va Netlify manzili
TOKEN = "8702403411:AAGphx6weBuK8r0e3aDk4T4VpBeDg5bkIzI"
APP_URL = "https://super-bienenstitch-9acef7.netlify.app/"

# Loglarni sozlash (xatolarni ko'rish uchun)
logging.basicConfig(level=logging.INFO)

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_command(message: types.Message):
    # Foydalanuvchi ismini olish
    user_name = message.from_user.first_name
    
    # Mini App-ni ochish uchun tugma yaratish
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🚀 Ilovani ochish", 
            web_app=WebAppInfo(url=APP_URL)
        )]
    ])
    
    await message.answer(
        f"Salom, {user_name}! 👋\n\n"
        "**Bugungi Kun** — shaxsiy o'sish va unumdorlik ilovasiga xush kelibsiz.\n"
        "Ilovani ishga tushirish uchun pastdagi tugmani bosing:",
        reply_markup=kb,
        parse_mode="Markdown"
    )

async def main():
    print("Bot muvaffaqiyatli ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("Bot to'xtatildi")
