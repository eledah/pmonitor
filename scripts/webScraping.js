const https = require('https');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================
const config = {
  verbose: process.env.VERBOSE !== 'false',
  output: process.env.OUTPUT !== 'false',
  inputFile: process.env.INPUT_FILE || '../items.xlsx',
  outputDir: process.env.OUTPUT_DIR || '../items',
  outputFile: process.env.OUTPUT_FILE || '../output.xlsx',
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  delayBetweenRequests: parseInt(process.env.DELAY) || 2500,
  jitterRange: 500,
  cookies: process.env.DIGIKALA_COOKIES || '',
};

// Constants
const ITEMS_DIRECTORY = config.outputDir;
const INPUT_FILE_PATH = config.inputFile;
const OUTPUT_FILE_PATH = config.outputFile;
const SHEET_NAME = 'Sheet 1';
const HEADERS = ['Date', 'Price', 'Discount', 'Incredible'];
const MAX_REDIRECTS = 3;

// Get current date in Tehran timezone (YYYY-MM-DD)
const currentDate = new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Tehran'
});

// ============================================================================
// LOGGER UTILITY
// ============================================================================
const logger = {
  debug: (msg, data) => {
    if (config.verbose) {
      const prefix = data ? `[DEBUG] ${msg}:` : `[DEBUG] ${msg}`;
      console.log(prefix, data || '');
    }
  },
  info: (msg, emoji = '') => {
    if (config.verbose) {
      console.log(`${emoji} ${msg}`);
    }
  },
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg, err) => console.error(`❌ ${msg}`, err ? `- ${err.message || err}` : ''),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  progress: (current, total, item) => console.log(`\n🔍 [${current}/${total}] Processing: ${item}`),
  skip: (msg) => console.log(`⏭️  ${msg}`),
  stats: (price, discount, isIncredible) => {
    const discountEmoji = parseInt(discount) > 0 ? '💰' : '🆓';
    const incredibleEmoji = isIncredible === '1' ? '🔥' : '📦';
    console.log(`${discountEmoji} Price: ${price} | Discount: ${discount}% | ${incredibleEmoji} Incredible: ${isIncredible}`);
  }
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================

function extractProductId(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Support both regular products and fresh products
  const match = url.match(/\/(?:fresh\/)?product\/dkp-(\d{1,20})\//);
  return match ? match[1] : null;
}

function validateItem(url, name, rowNum) {
  const errors = [];
  
  if (!url || typeof url !== 'string') {
    errors.push(`Row ${rowNum}: URL is missing or invalid`);
  } else if (!url.startsWith('https://www.digikala.com/')) {
    errors.push(`Row ${rowNum}: URL is not a valid Digikala URL`);
  }
  
  if (!name || typeof name !== 'string') {
    errors.push(`Row ${rowNum}: Name is missing or invalid`);
  }
  
  const productId = extractProductId(url);
  if (url && !productId) {
    errors.push(`Row ${rowNum}: Could not extract product ID from URL`);
  }
  
  return { isValid: errors.length === 0, errors, productId };
}

// ============================================================================
// FILESYSTEM UTILITIES
// ============================================================================

function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'unknown';
  
  // Replace characters that are invalid in filenames
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // Windows reserved characters
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .trim()
    .substring(0, 200);                // Prevent extremely long filenames
}

function getSafeFilePath(itemName) {
  const safeName = sanitizeFilename(itemName);
  return path.join(ITEMS_DIRECTORY, `${safeName}.xlsx`);
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

function makeHttpRequest(options, maxRedirects = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const attemptRequest = (currentOptions, redirectCount = 0) => {
      const req = https.request(currentOptions, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });

        res.on('end', () => {
          if (res.statusCode === 302 && res.headers.location && redirectCount < maxRedirects) {
            const redirectUrl = res.headers.location;
            let newPath;
            
            if (redirectUrl.startsWith('http')) {
              const url = new URL(redirectUrl);
              newPath = url.pathname + url.search;
            } else {
              newPath = redirectUrl;
            }

            logger.debug(`Redirecting to: ${newPath}`);
            attemptRequest({ ...currentOptions, path: newPath }, redirectCount + 1);
          } else if (res.statusCode === 429) {
            logger.warn(`Rate limited (429). Response headers: ${JSON.stringify(res.headers)}`);
            resolve({ status: 429, data: { retry_after: res.headers['retry-after'] } });
          } else {
            try {
              if (data.trim().startsWith('<') || data.trim().startsWith('<!--')) {
                logger.warn(`Received HTML response instead of JSON. Status: ${res.statusCode}`);
                logger.debug(`HTML preview: ${data.substring(0, 200)}`);
                reject(new Error(`Received HTML response (possible bot detection). Status: ${res.statusCode}`));
                return;
              }
              const jsonData = JSON.parse(data);
              resolve({ status: res.statusCode, data: jsonData });
            } catch (error) {
              logger.debug(`Parse error. Response preview: ${data.substring(0, 300)}`);
              reject(new Error(`Failed to parse JSON: ${error.message}`));
            }
          }
        });
      });

      req.on('error', (error) => reject(new Error(`Request failed: ${error.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      req.setTimeout(config.requestTimeout);
      req.end();
    };

    attemptRequest(options);
  });
}

// ============================================================================
// API RESPONSE PARSING
// ============================================================================

/**
 * Extracts variant data from product response
 * Handles both object (in stock) and array (out of stock) default_variant formats
 * @param {Object} product - The product object from API response
 * @returns {Object|null} - Variant with price data or null if unavailable
 */
function extractVariantFromProduct(product) {
  if (!product || product.default_variant === undefined) {
    logger.debug('Product or default_variant undefined');
    return null;
  }

  const defaultVariant = product.default_variant;
  logger.debug('Extracting variant', { type: Array.isArray(defaultVariant) ? 'array' : 'object' });

  // Handle array case (out of stock or multiple variants)
  if (Array.isArray(defaultVariant)) {
    if (defaultVariant.length > 0 && defaultVariant[0].price) {
      logger.debug('Using first item from default_variant array');
      return defaultVariant[0];
    }
    
    // Empty array - try variants array as fallback
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variantWithPrice = product.variants.find(v => v.price);
      if (variantWithPrice) {
        logger.debug('Using variant from variants array');
        return variantWithPrice;
      }
    }
    
    logger.debug('No variants with price available');
    return null;
  }

  // Handle object case (in stock)
  if (defaultVariant && typeof defaultVariant === 'object' && defaultVariant.price) {
    logger.debug('Using default_variant object');
    return defaultVariant;
  }

  logger.debug('No valid variant structure found');
  return null;
}

// ============================================================================
// PRODUCT DATA FETCHING (with retry logic)
// ============================================================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const jitter = () => Math.floor(Math.random() * config.jitterRange * 2) - config.jitterRange;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

let currentUserAgentIndex = 0;

function getNextUserAgent() {
  const ua = USER_AGENTS[currentUserAgentIndex];
  currentUserAgentIndex = (currentUserAgentIndex + 1) % USER_AGENTS.length;
  return ua;
}

function getRequestHeaders(isFresh = false) {
  const userAgent = getNextUserAgent();
  const chromeVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '131';
  
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.digikala.com/',
    'Origin': 'https://www.digikala.com',
    'sec-ch-ua': `"Google Chrome";v="${chromeVersion}", "Chromium";v="${chromeVersion}", "Not_A Brand";v="24"`,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'dnt': '1',
    'priority': 'u=1, i',
    'connection': 'keep-alive',
  };

  if (config.cookies) {
    headers['Cookie'] = config.cookies;
  }

  return headers;
}

async function fetchWithRetry(operation, retries = config.maxRetries, delayMs = config.retryDelay) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await operation();
      
      if (result.status === 429) {
        const retryAfter = result.data?.retry_after || (delayMs * Math.pow(2, i + 1));
        const waitTime = typeof retryAfter === 'number' ? retryAfter * 1000 : delayMs * Math.pow(2, i + 1);
        logger.warn(`Rate limited (429). Waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
        await delay(waitTime + jitter());
        continue;
      }
      
      return result;
    } catch (err) {
      const isLastAttempt = i === retries - 1;
      const isRetryable = err.message.includes('timeout') || 
                          err.message.includes('ECONNRESET') ||
                          err.message.includes('ETIMEDOUT') ||
                          err.message.includes('rate') ||
                          err.message.includes('429');
      
      if (!isRetryable || isLastAttempt) {
        throw err;
      }
      
      const backoffDelay = delayMs * Math.pow(2, i) + Math.abs(jitter());
      logger.warn(`Retry ${i + 1}/${retries} after error: ${err.message}. Waiting ${backoffDelay}ms`);
      await delay(backoffDelay);
    }
  }
}

async function fetchProductFromAPI(productId, isFresh = false) {
  const apiPath = isFresh 
    ? `/fresh/v1/product/${productId}/`
    : `/v2/product/${productId}/`;
  
  logger.debug(`Fetching from ${isFresh ? 'Fresh' : 'Regular'} API`, { path: apiPath });
  
  const options = {
    hostname: 'api.digikala.com',
    path: apiPath,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.digikala.com/'
    }
  };

  const response = await makeHttpRequest(options);
  logger.debug(`API Response`, { status: response.status, hasData: !!response.data });
  
  return response;
}

async function getProductData(productId) {
  try {
    logger.debug(`Getting product data`, { productId });
    
    // Try regular API first
    const response = await fetchWithRetry(() => fetchProductFromAPI(productId, false));
    
    // Handle redirect to Fresh API
    if (response.data?.redirect_url?.uri) {
      const redirectUri = response.data.redirect_url.uri;
      const redirectMatch = redirectUri.match(/\/fresh\/product\/dkp-(\d{1,20})\//);
      
      if (!redirectMatch) {
        logger.warn(`Could not extract fresh product ID from redirect: ${redirectUri}`);
        return null;
      }
      
      const freshProductId = redirectMatch[1];
      logger.info(`Redirecting to Fresh API`, '🔗');
      logger.debug(`Fresh API details`, { originalId: productId, freshId: freshProductId });
      
      const freshResponse = await fetchWithRetry(() => fetchProductFromAPI(freshProductId, true));
      
      if (freshResponse.status === 200 && freshResponse.data?.data?.product) {
        return extractVariantFromProduct(freshResponse.data.data.product);
      }
      
      if (freshResponse.status === 404) {
        logger.warn(`Fresh API returned 404 for product ${freshProductId}`);
        return null;
      }
      
      throw new Error(`Fresh API error: ${freshResponse.status}`);
    }
    
    // Handle regular API response
    if (response.status === 200 && response.data?.data?.product) {
      return extractVariantFromProduct(response.data.data.product);
    }
    
    logger.warn(`Unexpected API response status: ${response.status}`);
    return null;
    
  } catch (error) {
    logger.error(`Failed to fetch product ${productId}`, error);
    return null;
  }
}

// ============================================================================
// PRICE EXTRACTION
// ============================================================================

function extractPriceInfo(variantData) {
  if (!variantData) {
    logger.debug('variantData is null/undefined');
    return { sellingPrice: 'Price not found', discountPercent: '0', isIncredible: '0' };
  }

  let price = null;

  // Standard case: variant with nested price object
  if (variantData?.price && typeof variantData.price === 'object') {
    price = variantData.price;
    logger.debug('Found price in variantData.price');
  }
  // Legacy array case (shouldn't happen with current API)
  else if (Array.isArray(variantData) && variantData.length > 0 && variantData[0]?.price) {
    price = variantData[0].price;
    logger.debug('Found price in array[0].price (legacy)');
  }
  // Direct price properties fallback
  else if (variantData?.selling_price || variantData?.discount_percent !== undefined) {
    price = variantData;
    logger.debug('Using direct price properties');
  }

  if (!price) {
    logger.debug('No price object found', { keys: Object.keys(variantData) });
    return { sellingPrice: 'Price not found', discountPercent: '0', isIncredible: '0' };
  }

  const result = {
    sellingPrice: price.selling_price ? String(Math.round(price.selling_price / 10)) : 'Price not found',
    discountPercent: String(price.discount_percent || '0'),
    isIncredible: price.is_incredible ? '1' : '0'
  };

  logger.debug('Price extracted', result);
  return result;
}

// ============================================================================
// EXCEL OPERATIONS
// ============================================================================

async function hasDataForToday(itemName) {
  const itemFilePath = getSafeFilePath(itemName);

  if (!fs.existsSync(itemFilePath)) {
    return false;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(itemFilePath);
    const worksheet = workbook.getWorksheet(SHEET_NAME);

    if (!worksheet) return false;

    // Check if today's date exists in any row
    let found = false;
    worksheet.eachRow((row, rowNum) => {
      if (rowNum > 1 && !found) { // Skip header
        const dateCell = row.getCell(1).value;
        if (dateCell?.toString() === currentDate) {
          found = true;
        }
      }
    });

    return found;
  } catch (error) {
    logger.warn(`Error checking data for ${itemName}: ${error.message}`);
    return false;
  }
}

async function writeToExcel(itemName, price, discount, incredible) {
  const itemFilePath = getSafeFilePath(itemName);
  const workbook = new ExcelJS.Workbook();
  let worksheet;
  let isNewFile = false;

  if (fs.existsSync(itemFilePath)) {
    await workbook.xlsx.readFile(itemFilePath);
    worksheet = workbook.getWorksheet(SHEET_NAME);
  }

  if (!worksheet) {
    worksheet = workbook.addWorksheet(SHEET_NAME);
    worksheet.addRow(HEADERS);
    isNewFile = true;
  }

  // Check for existing data today
  let exists = false;
  worksheet.eachRow((row, rowNum) => {
    if (rowNum > 1 && !exists) {
      if (row.getCell(1).value?.toString() === currentDate) {
        exists = true;
      }
    }
  });

  if (exists) {
    logger.skip(`Data for ${currentDate} already exists - skipping`);
    return;
  }

  worksheet.addRow([currentDate, price, discount, incredible]);
  await workbook.xlsx.writeFile(itemFilePath);
  
  logger.success(`${isNewFile ? 'Created' : 'Updated'} ${sanitizeFilename(itemName)}.xlsx`);
}

// ============================================================================
// MAIN SCRAPER
// ============================================================================

async function loadItemsFromExcel() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(INPUT_FILE_PATH);
    const worksheet = workbook.getWorksheet(1);
    
    const items = [];
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const url = worksheet.getCell(`A${i}`).value;
      const name = worksheet.getCell(`B${i}`).value;
      
      const validation = validateItem(url, name, i);
      if (validation.isValid) {
        items.push({ url, name, productId: validation.productId, row: i });
      } else {
        validation.errors.forEach(err => logger.error(err));
      }
    }
    
    return items;
  } catch (error) {
    logger.error(`Failed to load items from Excel`, error);
    throw error;
  }
}

async function processItem(item, outputWorkbook) {
  logger.progress(item.row - 1, totalItems, item.name);
  logger.debug(`Product ID: ${item.productId}`);

  // Check if already scraped today
  const exists = await hasDataForToday(item.name);
  if (exists) {
    logger.skip(`Data already exists for ${currentDate} - skipping API call`);
    return { success: true, skipped: true };
  }

  logger.info(`Fetching from API...`, '🔍');
  
  const variantData = await getProductData(item.productId);
  
  if (!variantData) {
    logger.error(`No data retrieved for "${item.name}" (may be out of stock)`);
    return { success: false, error: 'No data' };
  }

  const priceInfo = extractPriceInfo(variantData);
  logger.stats(priceInfo.sellingPrice, priceInfo.discountPercent, priceInfo.isIncredible);

  if (config.output) {
    await writeToExcel(item.name, priceInfo.sellingPrice, priceInfo.discountPercent, priceInfo.isIncredible);
  }

  // Add to summary workbook
  let outputSheet = outputWorkbook.getWorksheet(currentDate);
  if (!outputSheet) {
    outputSheet = outputWorkbook.addWorksheet(currentDate);
    outputSheet.addRow(['Name', 'Price', 'Discount', 'Link', 'Incredible']);
  }
  outputSheet.addRow([item.name, priceInfo.sellingPrice, priceInfo.discountPercent, item.url, priceInfo.isIncredible]);

  logger.success(`Processed "${item.name}"`);
  return { success: true, skipped: false };
}

async function scrapeWebpages() {
  console.log(`🚀 Starting pMonitor scraping session...`);
  console.log(`📅 Date: ${currentDate}`);
  
  // Create items directory if needed
  if (!fs.existsSync(ITEMS_DIRECTORY)) {
    fs.mkdirSync(ITEMS_DIRECTORY, { recursive: true });
  }

  // Load items from Excel
  const items = await loadItemsFromExcel();
  global.totalItems = items.length;
  
  console.log(`📊 Total items to process: ${totalItems}`);
  
  const outputWorkbook = new ExcelJS.Workbook();
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await processItem(item, outputWorkbook);
      if (result.skipped) skipped++;
      else if (result.success) processed++;
      else failed++;
    } catch (error) {
      logger.error(`Unexpected error processing ${item.name}`, error);
      failed++;
    }

    // Delay between requests (except last item)
    if (items.indexOf(item) < items.length - 1) {
      const wait = config.delayBetweenRequests + jitter();
      logger.debug(`Waiting ${Math.round(wait)}ms before next request`);
      await delay(wait);
    }
  }

  if (config.output) {
    await outputWorkbook.xlsx.writeFile(OUTPUT_FILE_PATH);
    logger.info(`Summary saved to ${OUTPUT_FILE_PATH}`, '📋');
  }

  // Output statistics for CI/CD parsing
  const stats = {
    date: currentDate,
    total: items.length,
    processed: processed,
    skipped: skipped,
    failed: failed,
    inStock: processed,  // Products with price data
    outOfStock: failed,  // Products that returned null (includes API failures and actually out of stock)
    timestamp: new Date().toISOString()
  };
  
  // Save stats to file for workflow to read
  fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
  
  // Also output to console for logs
  console.log(`\n🎊 Scraping completed!`);
  console.log(`   ✅ Processed (with price): ${processed}`);
  console.log(`   ⚠️  Out of stock / Failed: ${failed}`);
  console.log(`   ⏭️  Skipped (already have data): ${skipped}`);
  console.log(`   📊 Total items: ${items.length}`);
  console.log(`   📅 Date: ${currentDate}`);
  
  return stats;
}

// Start scraping
scrapeWebpages().catch(err => {
  logger.error('Fatal error in scraper', err);
  process.exit(1);
});
