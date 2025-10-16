# pMonitor

![pMonitor](https://raw.githubusercontent.com/eledah/pmonitor/master/pmonitor.jpg)

- [pMonitor Dashboard](https://eledah.github.io/pmonitor/dashboard.html) is an ongoing price monitor for [Digikala.com](https://digikala.com). It is a passion project and a result of personal curiosity about price fluctuation in the Iranian market.
- **NEW**: Beautiful RTL dashboard with Jalali calendar dates and IRR pricing display
- The items are provided via an [Excel file](https://github.com/eledah/pmonitor/blob/master/items.xlsx) which contains the name and the URL for each item. If you want to add your own items, edit `items.xlsx`. The current items (60 total) are chosen to reflect the general sense of the market across different categories.
- **Enhanced**: Now supports both regular products and supermarket items with automatic redirect handling
- Every day at 8AM GMT the code scans the price and discount for each item using advanced scraping techniques
- **Fresh Data Collection**: New data is saved to the [items](https://github.com/eledah/pmonitor/tree/master/items) folder, with historical data preserved in [items_legacy](https://github.com/eledah/pmonitor/tree/master/items_legacy)
- The [new dashboard](https://eledah.github.io/pmonitor/dashboard.html) features:
    - RTL (Right-to-Left) interface for Persian text
    - Jalali calendar dates (شمسی)
    - IRR (ریال) price formatting with Persian number separators
    - Interactive charts with hover tooltips
    - Responsive grid layout (1, 2, or 3 columns)
    - Modern dark theme with animations

## Current Items (60 total):

The complete list of monitored items includes a diverse range of products across multiple categories:

### 🥤 Food & Beverages
- آب معدنی میوا - ۱٫۵ لیتر بسته ۶ عددی
- برنج هاشمی گیلان رفتاری - ۱۰ کیلوگرم
- مغز پسته خام رویال - ۱ کیلوگرم
- پنیر پیتزا رنده شده کالین - ۱ کیلوگرم
- پنیر فتا دوشه هراز - ۴۰۰ گرم
- تخم مرغ Fresh بسته ۲۰ عددی گرید A
- چای سیاه گلستان مدل ممتاز هندوستان - ۵۰۰ گرم
- خیارشور درجه یک مکنزی - ۶۶۰ گرم
- روغن آفتابگردان غنچه پلاس - ۹۰۰ میلی لیتر
- عسل سنتی چند گیاه زنبورداران - ۱۰۰۰ گرم
- دان فلفل سیاه آسیابی گلها - ۴۰ گرم
- کره حیوانی پاستوریزه رامک ۱۰۰ گرم
- کنسرو ماهی تن در روغن مایع شیلتون - ۱۸۰ گرم
- ماکارونی پنه زر ماکارون ۵۰۰ گرم
- نوشابه پپسی - ۱٫۵ لیتر بسته ۶ عددی

### 👕 Fashion & Accessories
- شمش طلا ۲۴ عیار پارسیس مدل 01
- رژ لب جامد الیزا مدل Mini
- زیرپوش رکابی مردانه امیدنو
- شومیز زنانه
- عطر مردانه ساواج دیور ۱۰۰ میلی لیتر
- کفش پیاده روی مردانه
- کیف کمری چرمی
- نیم‌بوت زنانه چرم مشهد

### 🔧 Electronics & Tech
- گوشی اپل iPhone 16 Pro Max
- آینه بغل پراید
- بخاری برقی پارس خزر
- تلفن بی‌سیم پاناسونیک
- تلویزیون ال ای دی هوشمند ایکس ویژن ۵۵ اینچ
- دوربین دیجیتال کانن مدل EOS 5D Mark IV
- جعبه ابزار ۱۲۵ عددی
- ترازو دیجیتال کمری فیت
- ساعت هوشمند مدل T900 Pro Max
- کامپیوتر همه کاره ۲۷ اینچ MSI
- گوشی موبایل شیائومی مدل Redmi Note 14 4G
- لپ تاپ 15.6 اینچی اچ‌پی G10 255
- ماشین لباسشویی ۹ کیلوگرمی دوو
- مانیتور جی پلاس ۲۴ اینچ
- موتور برق آسترا
- هارد اکسترنال وسترن دیجیتال ۱ ترابایت
- هندزفری QKZ
- ویدئو پروژکتور T6 Max
- یخچال و فریزر ایستکول

### 🏠 Home & Kitchen
- گوشی خورشتی بدون استخوان گوسفند مهیا پروتئین - ۱ کیلوگرم
- ران مرغ بی پوست مهیا پروتئین - ۹۰۰ گرم
- سیب‌زمینی نیمه آماده باتو - ۷۵۰ گرم
- قرص ماشین ظرفشویی هوم پلاس ۲۴ عددی
- سرویس غذاخوری ۳۰ پارچه ۶ نفره
- مبل تخت‌خواب شو تک‌نفره
- تشک دو نفره رویا مدل اولترا ۳
- بسته لوازم تحریر مدل فلزی ۵ تایی

### 🧴 Beauty & Personal Care
- تونر پاک کننده صورت لافارر
- ژل شستشوی صورت لافارر
- کرم ضدآفتاب لافارر

### 🧸 Baby & Pet Care
- پوشک بچه هانیز
- پوشک مولفیکس سایز ۴
- غذای خشک گربه ۲ کیلوگرم

### 📚 Books & Media
- کتاب هر دو در نهایت می میرند

### 🛡️ Safety & Tools
- کپسول آتش نشانی دریا ۳ کیلوگرم
- کنسول Playstation 5

*View the complete list in [items.json](https://github.com/eledah/pmonitor/blob/master/items.json)*

## 🚀 How to Use

### For Users
1. **View Dashboard**: Visit [pMonitor Dashboard](https://eledah.github.io/pmonitor/dashboard.html)
2. **Browse Items**: Use the table of contents to navigate to specific products
3. **Analyze Trends**: Each chart shows price history with Jalali dates and IRR pricing
4. **Adjust Layout**: Use the control buttons to change chart grid layout (1, 2, or 3 columns)

### For Developers
1. **Add Items**: Edit `items.xlsx` with new product URLs and names
2. **Run Scraper**: Execute `node scripts/webScraping.js` to collect fresh data
3. **Update JSON**: Keep `items.json` synchronized with `items.xlsx`
4. **Deploy**: The dashboard automatically reads from the GitHub repository

## ✨ New Features

- **RTL Interface**: Complete right-to-left support for Persian text
- **Jalali Calendar**: All dates displayed in Persian calendar format (jYYYY/jMM/jDD)
- **IRR Pricing**: Prices shown in Iranian Rial with proper formatting
- **Smart Redirects**: Automatic handling of supermarket product redirects
- **Fresh Data Collection**: New data collection system with legacy preservation
- **Pre-Check Optimization**: Smart checking for existing data before API calls to improve performance
- **Modern UI**: Dark theme with animations and responsive design
- **Interactive Charts**: Hover tooltips, color-coded trends, and smooth animations

## 📁 Project Structure

```
pmonitor/
├── dashboard.html          # New RTL dashboard with Jalali calendar
├── dashboard-styles.css    # Modern styling with RTL support
├── dashboard-script.js     # Dashboard functionality with IRR formatting
├── items.xlsx              # Input file for scraping (60 items)
├── items.json              # Dashboard configuration and item list
├── items/                  # Fresh data collection folder (individual .xlsx files)
├── items_legacy/           # Historical data archive
├── scripts/
│   └── webScraping.js      # Enhanced scraper with pre-check optimization
├── output.xlsx             # Daily summary output
└── README.md               # This file
```
