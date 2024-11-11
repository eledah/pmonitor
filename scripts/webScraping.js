const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Set this constant to true to enable verbose logging
const VERBOSE = true;

// Set OUTPUT to true to alter .xlsx files, or false to skip altering
const OUTPUT = true;

const INPUT_FILE_PATH = '../items.xlsx';
const OUTPUT_DIRECTORY = '../items';
const OUTPUT_FILE_PATH = '../output.xlsx';

// Declare currentDate at the beginning of the script
const currentDate = new Date().toISOString().split('T')[0];

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

  return String(productScript.offers.price / 10);
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
    // Use divHandle.$ to select the nested span
    const nestedSpanSelector = 'span.text-body2-strong';
    const discountHandle = await discountContainer.$(nestedSpanSelector);

    if (discountHandle) {
      // Get the innerHTML of the selected span
      discount = await (await page.evaluate(element => element.innerHTML, discountHandle))
        .replace("٪", "")
        .replace(/[۱۲۳۴۵۶۷۸۹۰]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 1728))
      // console.log("Discount Percentage: ", discount);
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

async function writeToExcel(itemName, price, discount, incredible) {
  // Create an Excel file for each item and append data
  const itemFileName = `${itemName}.xlsx`;
  const itemFilePath = path.join(OUTPUT_DIRECTORY, itemFileName);

  const itemWorkbook = new ExcelJS.Workbook();
  if (fs.existsSync(itemFilePath)) {
    await itemWorkbook.xlsx.readFile(itemFilePath);
  }

  let itemWorksheet = itemWorkbook.getWorksheet(1);
  if (!itemWorksheet) {
    itemWorksheet = itemWorkbook.addWorksheet('Sheet 1');
    itemWorksheet.addRow(['Date', 'Price', 'Discount', 'Incredible']); // Header row
  }

  // Check if last row has today's date
  const lastRow = itemWorksheet.lastRow;
  if (lastRow && lastRow.getCell(1).value === currentDate) {
    // Overwrite the last row
    lastRow.getCell(1).value = currentDate;
    lastRow.getCell(2).value = price;
    lastRow.getCell(3).value = discount;
    lastRow.getCell(4).value = incredible;
    console.log(`Data updated in ${itemFileName} for ${currentDate}`);
  } else {
    // Add new row
    itemWorksheet.addRow([currentDate, price, discount, incredible]);
    console.log(`Data appended to ${itemFileName}`);
  }

  await itemWorkbook.xlsx.writeFile(itemFilePath);
}

async function scrapeWebpages() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0); 

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(INPUT_FILE_PATH);
  const worksheet = workbook.getWorksheet(1);

  const outputWorkbook = new ExcelJS.Workbook();

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const url = worksheet.getCell(`A${i}`).value;
    const itemName = worksheet.getCell(`B${i}`).value;

    if (VERBOSE) {
      console.log(`Loading ${url}`);
    }

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

    // Wait for 10 seconds (adjust as needed)
    await new Promise((resolve) => setTimeout(resolve, 17000)); // 17 seconds

    // Check if the page is loaded
    const isPageLoaded = await page.evaluate(() => {
      return document.querySelector('div.w-full.px-4.flex.items-center') !== null;
    });

    if (isPageLoaded) {
      if (VERBOSE) {
        console.log(`Page loaded successfully for item: ${itemName}`);
      }

      const price = await getPrice(page);
      console.log("Price: ", price);

      const discount = await getDiscount(page);
      console.log("Discount: ", discount);

      const incredible = await getIncredible(page);
      console.log("Incredible: ", incredible);

      if (OUTPUT) {
        await writeToExcel(itemName, price, discount, incredible);
      }
      
      // Add the program's output to the outputWorkbook
      let outputSheet = outputWorkbook.getWorksheet(currentDate);
      if (!outputSheet) {
        outputSheet = outputWorkbook.addWorksheet(currentDate);
        outputSheet.addRow(['Name', 'Price', 'Discount', 'Link', 'Incredible']); // Header row
      }

      outputSheet.addRow([itemName, price, discount, url, incredible]);
      console.log(`Data appended to output.xlsx for item: ${itemName}`);
    } else {
      console.log(`Item: ${itemName}`);
      console.log('Page did not load properly.');
    }
  }

  if (OUTPUT) {
    // Save the outputWorkbook to output.xlsx in the main directory
    await outputWorkbook.xlsx.writeFile(OUTPUT_FILE_PATH);
  }
  
  await browser.close();
}

// Create the "items" directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIRECTORY)) {
  fs.mkdirSync(OUTPUT_DIRECTORY);
}

scrapeWebpages();