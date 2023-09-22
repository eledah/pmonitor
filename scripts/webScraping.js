const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Set this constant to true to enable verbose logging
const VERBOSE = true;

const INPUT_FILE_PATH = '../items.xlsx';
const OUTPUT_DIRECTORY = '../items';
const OUTPUT_FILE_PATH = '../output.xlsx';

async function scrapeWebpages() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

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

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for 10 seconds (adjust as needed)
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds

    // Check if the page is loaded
    const isPageLoaded = await page.evaluate(() => {
      return document.querySelector('div.w-full.px-4.flex.items-center') !== null;
    });

    if (isPageLoaded) {
      if (VERBOSE) {
        console.log(`Page loaded successfully for item: ${itemName}`);
      }

      const priceElement = await page.$('span.text-neutral-800.ml-1.text-h4');
      const price = priceElement
        ? (await (await priceElement.getProperty('textContent')).jsonValue())
            .replace(/,/g, '') // Remove commas
            .replace(/[۱۲۳۴۵۶۷۸۹۰]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 1728)) // Convert Farsi numbers to English
        : 'Price not found';

      console.log("Price: ", price);

      const masterDivSelector = '.flex.items-center.justify-end.w-full'
      const discountDivSelector = '.px-1.text-white.rounded-large.flex.items-center.justify-center.ProductPrice_ProductPrice__discountWrapper__1Ru_1.bg-primary-700.shrink-0.mr-1';
                        
      const masterDiv = await page.$(masterDivSelector)
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
          console.log("Discount Percentage: ", discount);
        } else {
          console.log("No span with class 'text-body2-strong' found inside the first div.");
          discount = "0"
        }
      } else {
        console.log("No div with the specified class found on the page.");
        discount = "0"
      }

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
        itemWorksheet.addRow(['Date', 'Price', 'Discount']); // Header row
      }

      const currentDate = new Date().toISOString().split('T')[0];
      itemWorksheet.addRow([currentDate, price, discount]);

      await itemWorkbook.xlsx.writeFile(itemFilePath);

      console.log(`Data appended to ${itemFileName}`);
      
      // Add the program's output to the outputWorkbook
      let outputSheet = outputWorkbook.getWorksheet(currentDate);
      if (!outputSheet) {
        outputSheet = outputWorkbook.addWorksheet(currentDate);
        outputSheet.addRow(['Name', 'Price', 'Discount', 'Link']); // Header row
      }

      outputSheet.addRow([itemName, price, discount, url]);
      console.log(`Data appended to output.xlsx for item: ${itemName}`);
    } else {
      console.log(`Item: ${itemName}`);
      console.log('Page did not load properly.');
    }
  }

  // Save the outputWorkbook to output.xlsx in the main directory
  await outputWorkbook.xlsx.writeFile(OUTPUT_FILE_PATH);
  await browser.close();
}

// Create the "items" directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIRECTORY)) {
  fs.mkdirSync(OUTPUT_DIRECTORY);
}

scrapeWebpages();
