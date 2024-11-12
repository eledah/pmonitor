const puppeteer = require('puppeteer');

async function getPrice(page) {
  const productScript = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Product') {
          return data;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  });

  if (!productScript || !productScript.offers) {
    return 'Price not found';
  }

  return String(productScript.offers.price);
}

async function getDiscount(page) {
  const masterDivSelector = '.flex.items-center.justify-end.w-full.gap-1';
  const discountDivSelector = '.px-1.text-white.rounded-large.flex.items-center.justify-center.ProductPrice_ProductPrice__discountWrapper__1Ru_1.bg-hint-object-error.shrink-0.mr-1.mb-1';

  const masterDiv = await page.$(masterDivSelector)
  if (!masterDiv) {
    console.log("Master div not found - no discount section on page");
    return "0";
  }
  const discountContainer = await masterDiv.$(discountDivSelector);

  let discount = "0";

  if (discountContainer) {
    const nestedSpanSelector = 'span.text-body2-strong';
    const discountHandle = await discountContainer.$(nestedSpanSelector);

    if (discountHandle) {
      discount = await (await page.evaluate(element => element.innerHTML, discountHandle))
        .replace("٪", "")
        .replace(/[۱۲۳۴۵۶۷۸۹۰]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 1728))
      console.log("Discount Percentage: ", discount);
    } else {
      console.log("No span with class 'text-body2-strong' found inside the first div.");
      discount = "0"
    }
  } else {
    console.log("No discount div with the specified class found on the page.");
    discount = "0"
  }

  return discount;
}

async function getIncredible(page) {
  const hasIncredible = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      if (img.src.includes('IncredibleOffer.svg')) {
        return true;
      }
    }
    return false;
  });
  return hasIncredible ? "1" : "0";
}

async function scrapeProduct(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);

  console.log(`Loading ${url}`);
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });
  await new Promise((resolve) => setTimeout(resolve, 17000)); // Wait 17 seconds

  const isPageLoaded = await page.evaluate(() => {
    return document.querySelector('div.w-full.px-4.flex.items-center') !== null;
  });

  if (isPageLoaded) {
    console.log('Page loaded successfully');

    const price = await getPrice(page);
    console.log("Price: ", price);

    const discount = await getDiscount(page);
    console.log("Discount: ", discount);

    const incredible = await getIncredible(page);
    console.log("Incredible:", incredible)
  } else {
    console.log('Page did not load properly.');
  }

  await browser.close();
}

// Run the scraper with the sample URL
scrapeProduct("https://www.digikala.com/fresh/product/dkp-1023378/");
