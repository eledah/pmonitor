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
- آب معدنی میوا - 1.5 لیتر بسته 6 عددی
- برنج هاشمی ممتاز طبیعت - 10 کیلوگرم
- پنیر پیتزا رنده شده کالین - 1000 گرم
- پنیر فتا دوشه هراز - 400 گرم
- تخم مرغ گرید B پروتانا بسته 20 عددی
- چای سیاه گلستان مدل ممتاز هندوستان - 500 گرم
- خیار شور سالی - 1.5 کیلوگرم
- روغن آفتابگردان غنچه پلاس - 900 میلی لیتر
- عسل طبیعی سبلان
- فلفل سیاه هاتی کارا - 500 گرم
- کره حیوانی پاستوریزه میهن - 100 گرم
- کنسرو ماهی تن در روغن مایع ساحل - 180 گرم
- ماکارونی پنه زر ماکارون 500 گرم
- نوشابه پپسی - 1.5 لیتر بسته 6 عددی

### 👕 Fashion & Accessories
- آویز گردنبند طلا 18 عیار زنانه
- ترازو دیجیتال کمری فیت
- تشک دو نفره رویا مدل اولترا 3
- تونر پاک کننده صورت لافارر
- رژ لب جامد الیزا مدل Mini
- زیرپوش رکابی مردانه امیدنو
- ژل شستشوی صورت لافارر
- ساعت هوشمند مدل K59pro
- شومیز زنانه
- عطر مردانه ساواج دیور 100 میلی لیتر
- کفش پیاده روی مردانه
- کیف کمری چرمی
- نیم‌بوت زنانه چرم مشهد

### 🔧 Electronics & Tech
- آیفون ۱۳ نان‌اکتیو
- آینه بغل پراید
- بخاری برقی پارس خزر
- تلویزیون ال ای دی هوشمند ایکس ویژن
- جعبه ابزار 100 عددی
- دوربین دیجیتال کانن مدل EOS 5D Mark IV
- ساعت هوشمند مدل K59pro
- ست لوازم تحریر 21 عددی
- سرویس 26 پارچه اپال
- فلش مموری کوئین تک
- کامپیوتر همه کاره 23.8 اینچ MSI
- گوشی موبایل شیائومی مدل Redmi Note 12 4G
- لپ تاپ 15.6 اینچی اچ‌پی Pavilion x360
- ماشین لباسشویی دوو
- مانیتور جی پلاس 24 اینچ
- هارد اکسترنال وسترن دیجیتال 1 ترابایت
- هندزفری تسکو مدل TH 5052
- ویدئو پروژکتور T2 Max

### 🏠 Home & Kitchen
- راسته گوسفند مهتا پروتئین - 1 کیلوگرم - با ارز نیمایی
- سینه مرغ بی پوست مهیا پروتئین - 900 گرم
- سیب زمینی طلایی منجمد - 750 گرم
- فیله ماهی حسون جنوب پمینا - 700 گرم
- قرص ماشین ظرفشویی هوم پلاس 48 عددی
- مبل راحتی 7 نفره مدل آرتان
- موتور برق آسترا
- یخچال و فریزر برفاب

### 🧸 Baby & Pet Care
- پوشک بچه هانیز
- پوشک مولفیکس سایز ۴
- غذای خشک گربه 2 کیلوگرم

### 📚 Books & Media
- کتاب هر دو در نهایت می میرند

### 🛡️ Safety & Tools
- کپسول آتش نشانی دریا 3 کیلوگرم
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
- **Modern UI**: Dark theme with animations and responsive design
- **Interactive Charts**: Hover tooltips, color-coded trends, and smooth animations

## 📁 Project Structure

```
pmonitor/
├── dashboard.html          # New RTL dashboard
├── dashboard-styles.css    # Modern styling with RTL support
├── dashboard-script.js     # Dashboard functionality
├── items.xlsx              # Input file for scraping (60 items)
├── items.json              # Dashboard configuration
├── items/                  # Fresh data collection folder
├── items_legacy/           # Historical data archive
├── scripts/
│   └── webScraping.js      # Enhanced scraper with redirect support
└── README.md               # This file
```
