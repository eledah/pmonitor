const https = require('https');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Set this constant to true to enable verbose logging
const VERBOSE = true;

// Set this constant to true to enable ultra-detailed logging
const ULTRA_VERBOSE = true;

// Set OUTPUT to true to alter .xlsx files, or false to skip altering
const OUTPUT = true;

const INPUT_FILE_PATH = '../items.xlsx';
const OUTPUT_DIRECTORY = '../items';
const OUTPUT_FILE_PATH = '../output.xlsx';

// Ensure we're creating fresh data in items folder
const ITEMS_DIRECTORY = '../items';

// Declare currentDate at the beginning of the script
const currentDate = new Date().toISOString().split('T')[0];

// Extract product ID from Digikala URL
function extractProductId(url) {
  // Support both regular products and fresh products
  // Regular: /product/dkp-123456/
  // Fresh: /fresh/product/dkp-123456/
  const match = url.match(/\/(?:fresh\/)?product\/dkp-(\d+)\//);
  return match ? match[1] : null;
}

// Make HTTP request and return a promise
function makeHttpRequest(options, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const attemptRequest = (currentOptions, redirectCount = 0) => {
      const req = https.request(currentOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
          // Check if we got a redirect
          if (res.statusCode === 302 && res.headers.location && redirectCount < maxRedirects) {
            const redirectUrl = res.headers.location;

            // Handle relative URLs
            let newPath;
            if (redirectUrl.startsWith('http')) {
              const url = new URL(redirectUrl);
              newPath = url.pathname + url.search;
            } else {
              newPath = redirectUrl;
            }

            const newOptions = {
              ...currentOptions,
              path: newPath
            };

            if (VERBOSE) {
              console.log(`Redirecting to: ${newPath}`);
            }

            attemptRequest(newOptions, redirectCount + 1);
          } else {
        try {
          const jsonData = JSON.parse(data);
              resolve({
                status: res.statusCode,
                data: jsonData
              });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
          }
        });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000); // 30 seconds timeout
    req.end();
    };

    attemptRequest(options);
  });
}

async function getProductData(productId) {
  try {
    if (ULTRA_VERBOSE) {
      console.log(`   🔧 Calling getProductData for ID: ${productId}`);
    }

    const options = {
      hostname: 'api.digikala.com',
      path: `/v2/product/${productId}/`, // Always include trailing slash
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.digikala.com/'
      }
    };

    if (ULTRA_VERBOSE) {
      console.log(`   🌐 Making HTTP request to: ${options.hostname}${options.path}`);
    }

    const response = await makeHttpRequest(options);

    if (ULTRA_VERBOSE) {
      console.log(`   📡 HTTP Response status: ${response.status}`);
      console.log(`   📄 Response data keys:`, Object.keys(response.data));
    }

    if (VERBOSE) {
      console.log(`📡 Response status: ${response.status}`);
    }

    // Check if this is a redirect response (status 302 in JSON, not HTTP status)
    if (response.data && response.data.redirect_url) {
      if (ULTRA_VERBOSE) {
        console.log(`   🔄 REDIRECT DETECTED!`);
        console.log(`   📋 Redirect data:`, response.data.redirect_url);
      }

      if (VERBOSE) {
        console.log(`🔄 Got redirect response for product ${productId}`);
      }

      // Extract the redirect URI
      const redirectUri = response.data.redirect_url.uri;
      if (!redirectUri) {
        console.log(`❌ Redirect response missing URI`);
        throw new Error('Redirect response missing URI');
      }

      if (ULTRA_VERBOSE) {
        console.log(`   🔗 Raw redirect URI: "${redirectUri}"`);
      }

      // For fresh products, use the /fresh/v1/product/ endpoint format
      // Extract product ID from the redirect URI
      const redirectMatch = redirectUri.match(/\/fresh\/product\/dkp-(\d+)\//);
      if (redirectMatch) {
        const freshProductId = redirectMatch[1];
        const freshUri = `/fresh/v1/product/${freshProductId}/`;

        if (ULTRA_VERBOSE) {
          console.log(`   🎯 Extracted product ID from redirect: ${freshProductId}`);
          console.log(`   🔗 Original URI: ${redirectUri}`);
          console.log(`   🆕 Fresh API URI: ${freshUri}`);
        }

        if (VERBOSE) {
          console.log(`🔗 Original URI: ${redirectUri}`);
          console.log(`🆕 Fresh API URI: ${freshUri}`);
        }

        // Make request to the fresh API endpoint
        const freshOptions = {
          hostname: 'api.digikala.com',
          path: freshUri,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.digikala.com/'
          }
        };

        if (ULTRA_VERBOSE) {
          console.log(`   🌐 Making fresh API request to: ${freshOptions.hostname}${freshOptions.path}`);
        }

        const freshResponse = await makeHttpRequest(freshOptions);

        if (ULTRA_VERBOSE) {
          console.log(`   📡 Fresh API HTTP status: ${freshResponse.status}`);
          console.log(`   📄 Fresh API response keys:`, Object.keys(freshResponse.data));
          if (freshResponse.data.product) {
            console.log(`   📦 Fresh API product keys:`, Object.keys(freshResponse.data.product));
          }
        }

        if (VERBOSE) {
          console.log(`🆕 Fresh API response status: ${freshResponse.status}`);
        }

        // Handle fresh API response
        if (freshResponse.status === 200 && freshResponse.data) {
          if (ULTRA_VERBOSE) {
            console.log(`   ✅ Fresh API returned 200 - checking structure...`);
            console.log(`   📋 Fresh response keys:`, Object.keys(freshResponse.data));
          }

          // Check for the correct fresh API structure: data.data.product.default_variant (object)
          if (freshResponse.data.data && freshResponse.data.data.product && freshResponse.data.data.product.default_variant) {
            const defaultVariant = freshResponse.data.data.product.default_variant;

            if (ULTRA_VERBOSE) {
              console.log(`   🎯 Found default_variant in fresh API data.data.product`);
              console.log(`   📊 default_variant type:`, typeof defaultVariant);
              console.log(`   💰 Has price property:`, !!defaultVariant.price);
            }

            // Fresh API returns default_variant as an object, not an array
            if (defaultVariant && typeof defaultVariant === 'object' && defaultVariant.price) {
              if (ULTRA_VERBOSE) {
                console.log(`   ✅ Fresh API structure correct - returning variant object`);
              }
              return defaultVariant; // Return the variant object directly
            } else {
              if (ULTRA_VERBOSE) {
                console.log(`   ❌ Fresh API default_variant missing price property`);
                console.log(`   📋 default_variant:`, defaultVariant);
              }
            }
          } else {
            if (ULTRA_VERBOSE) {
              console.log(`   ❌ Fresh API missing data.data.product.default_variant`);
              console.log(`   📋 Available paths:`, {
                'response.data exists': !!freshResponse.data,
                'response.data.data exists': !!(freshResponse.data && freshResponse.data.data),
                'product exists': !!(freshResponse.data && freshResponse.data.data && freshResponse.data.data.product),
                'default_variant exists': !!(freshResponse.data && freshResponse.data.data && freshResponse.data.data.product && freshResponse.data.data.product.default_variant)
              });
            }
          }

          // Fallback: check if data itself has the price info
          if (freshResponse.data.data && freshResponse.data.data.price) {
            if (ULTRA_VERBOSE) {
              console.log(`   🔄 Using fallback price extraction`);
            }
            return freshResponse.data.data;
          }

          if (ULTRA_VERBOSE) {
            console.log(`   ❌ No price data found in fresh API response`);
          }
        } else if (freshResponse.status === 404) {
          if (VERBOSE) {
            console.log('🚫 Fresh API returned 404 - product may not exist in fresh API');
          }
          return null;
        }

        if (ULTRA_VERBOSE) {
          console.log(`   🚨 Fresh API response issue - status: ${freshResponse.status}`);
        }
        throw new Error('Unable to extract product data from fresh API response');
      } else {
        if (VERBOSE) {
          console.log(`❌ Could not extract product ID from redirect URI: ${redirectUri}`);
        }
        return null;
      }
    }

    // Handle normal v2 API response - check response structure
    if (response.status === 200 && response.data) {
      if (ULTRA_VERBOSE) {
        console.log(`   📋 REGULAR API - Checking response structure...`);
        console.log(`   📊 Response has data:`, !!response.data);
        console.log(`   📋 Response data keys:`, Object.keys(response.data));
      }

      // Check if this response has actual product data (not a redirect response)
      if (response.data.data && response.data.data.product && response.data.data.product.default_variant) {
        const defaultVariant = response.data.data.product.default_variant;

        if (ULTRA_VERBOSE) {
          console.log(`   🎯 Found default_variant in regular API data.data.product`);
          console.log(`   📊 default_variant type:`, typeof defaultVariant);
          console.log(`   💰 Has price property:`, !!defaultVariant.price);
        }

        // Both fresh and regular APIs return default_variant as an object with price property
        if (defaultVariant && typeof defaultVariant === 'object' && defaultVariant.price) {
          if (ULTRA_VERBOSE) {
            console.log(`   ✅ Regular API structure correct - returning variant object`);
          }
          return defaultVariant;
        } else {
          if (ULTRA_VERBOSE) {
            console.log(`   ❌ Regular API default_variant missing price property`);
            console.log(`   📋 default_variant:`, defaultVariant);
          }
        }
      } else {
        if (ULTRA_VERBOSE) {
          console.log(`   ❌ Regular API missing data.data.product.default_variant`);
          console.log(`   📋 Available paths:`, {
            'response.data exists': !!response.data,
            'response.data.data exists': !!(response.data && response.data.data),
            'product exists': !!(response.data && response.data.data && response.data.data.product),
            'default_variant exists': !!(response.data && response.data.data && response.data.data.product && response.data.data.product.default_variant)
          });
        }
      }

      // If no product data found, it might be out of stock or a different structure
      if (VERBOSE) {
        console.log('📦 No product data found in v2 API response');
      }
      return null;
    } else {
      if (ULTRA_VERBOSE) {
        console.log(`   ❌ Regular API - No response data or wrong status`);
        console.log(`   📊 Response status: ${response.status}`);
        console.log(`   📋 Response data exists:`, !!response.data);
      }
    }

    throw new Error(`Invalid API response structure. Status: ${response.status}`);
  } catch (error) {
    console.error(`🚨 Error fetching data for product ${productId}: ${error.message}`);
    return null;
  }
}

function extractPriceInfo(variantData) {
  if (ULTRA_VERBOSE) {
    console.log(`   💰 EXTRACTING PRICE INFO:`);
    console.log(`   📋 Input variantData type:`, typeof variantData);
    console.log(`   📋 Input variantData:`, variantData ? JSON.stringify(variantData, null, 2).substring(0, 500) : 'null');
  }

  if (!variantData) {
    if (ULTRA_VERBOSE) {
      console.log(`   ❌ variantData is null/undefined`);
    }
    return {
      sellingPrice: 'Price not found',
      discountPercent: '0',
      isIncredible: '0'
    };
  }

  // Handle different possible structures for price information
  let price = null;

  // Check if variantData is an object with price property (both fresh and regular APIs)
  if (variantData && typeof variantData === 'object' && variantData.price && typeof variantData.price === 'object') {
    price = variantData.price;
    if (ULTRA_VERBOSE) {
      console.log(`   ✅ Found price object in variantData.price`);
      console.log(`   💰 Price object:`, price);
    }
  }
  // Check if variantData is an array (legacy structure - shouldn't happen with current API)
  else if (Array.isArray(variantData)) {
    if (ULTRA_VERBOSE) {
      console.log(`   ⚠️ variantData is an array (legacy structure)`);
    }
    if (variantData.length === 0) {
      if (ULTRA_VERBOSE) {
        console.log(`   ❌ Empty array`);
      }
      return {
        sellingPrice: 'Price not found',
        discountPercent: '0',
        isIncredible: '0'
      };
    }
    // Use the first variant from the array
    const firstVariant = variantData[0];
    if (firstVariant && firstVariant.price && typeof firstVariant.price === 'object') {
      price = firstVariant.price;
      if (ULTRA_VERBOSE) {
        console.log(`   ✅ Found price in array[0].price`);
      }
    }
  }
  // Check if variantData has direct price properties (fallback)
  else if (variantData && (variantData.selling_price || variantData.discount_percent || variantData.is_incredible)) {
    price = variantData;
    if (ULTRA_VERBOSE) {
      console.log(`   🔄 Using direct price properties`);
    }
  }

  if (!price) {
    if (ULTRA_VERBOSE) {
      console.log(`   ❌ No price object found`);
      console.log(`   📋 variantData keys:`, Object.keys(variantData));
    }
    return {
      sellingPrice: 'Price not found',
      discountPercent: '0',
      isIncredible: '0'
    };
  }

  const result = {
    sellingPrice: String(price.selling_price || 'Price not found'),
    discountPercent: String(price.discount_percent || '0'),
    isIncredible: price.is_incredible ? '1' : '0'
  };

  if (ULTRA_VERBOSE) {
    console.log(`   🎉 Extracted price info:`, result);
  }

  return result;
}

// Check if data already exists for today for a specific item
async function hasDataForToday(itemName) {
  const itemFileName = `${itemName}.xlsx`;
  const itemFilePath = path.join(ITEMS_DIRECTORY, itemFileName);

  // If file doesn't exist, no data exists
  if (!fs.existsSync(itemFilePath)) {
    return false;
  }

  try {
    const itemWorkbook = new ExcelJS.Workbook();
    await itemWorkbook.xlsx.readFile(itemFilePath);
    const itemWorksheet = itemWorkbook.getWorksheet('Sheet 1');

    if (!itemWorksheet) {
      return false;
    }

    // Check if today's data already exists
    let dataExistsForToday = false;
    itemWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const dateCell = row.getCell(1).value;
        if (dateCell && dateCell.toString() === currentDate) {
          dataExistsForToday = true;
        }
      }
    });

    return dataExistsForToday;
  } catch (error) {
    if (VERBOSE) {
      console.log(`⚠️ Error checking existing data for ${itemName}: ${error.message}`);
    }
    return false; // Default to false on error
  }
}

async function writeToExcel(itemName, price, discount, incredible) {
  const itemFileName = `${itemName}.xlsx`;
  const itemFilePath = path.join(ITEMS_DIRECTORY, itemFileName);

  const itemWorkbook = new ExcelJS.Workbook();

  // Check if file exists
  if (fs.existsSync(itemFilePath)) {
    // Read existing file to check for today's data
    await itemWorkbook.xlsx.readFile(itemFilePath);
    const itemWorksheet = itemWorkbook.getWorksheet('Sheet 1');

    if (itemWorksheet) {
      // Check if today's data already exists
      let dataExistsForToday = false;
      itemWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const dateCell = row.getCell(1).value;
          if (dateCell && dateCell.toString() === currentDate) {
            dataExistsForToday = true;
          }
        }
      });

      if (dataExistsForToday) {
        console.log(`⏭️ Data for ${currentDate} already exists in ${itemFileName} - skipping`);
        return;
      }

      // Add new row to existing worksheet
      itemWorksheet.addRow([currentDate, price, discount, incredible]);
      console.log(`💾 Added new data to existing ${itemFileName} for ${currentDate}`);
    } else {
      // Worksheet doesn't exist, create new one
      const newWorksheet = itemWorkbook.addWorksheet('Sheet 1');
      newWorksheet.addRow(['Date', 'Price', 'Discount', 'Incredible']); // Header row
      newWorksheet.addRow([currentDate, price, discount, incredible]);
      console.log(`💾 Fresh data created in ${itemFileName} for ${currentDate}`);
    }
  } else {
    // Create a fresh Excel file for each item (start new data collection)
    const itemWorksheet = itemWorkbook.addWorksheet('Sheet 1');
    itemWorksheet.addRow(['Date', 'Price', 'Discount', 'Incredible']); // Header row
    itemWorksheet.addRow([currentDate, price, discount, incredible]);
    console.log(`💾 Fresh data created in ${itemFileName} for ${currentDate}`);
  }

  await itemWorkbook.xlsx.writeFile(itemFilePath);
}

async function scrapeWebpages() {
  console.log(`🚀 Starting pMonitor scraping session...`);
  console.log(`📅 Date: ${currentDate}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(INPUT_FILE_PATH);
  const worksheet = workbook.getWorksheet(1);
  const totalItems = worksheet.rowCount - 1; // Subtract header row

  console.log(`📊 Total items to process: ${totalItems}`);

  const outputWorkbook = new ExcelJS.Workbook();

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const currentItem = i - 1; // Current item number (starting from 1)
    const url = worksheet.getCell(`A${i}`).value;
    const itemName = worksheet.getCell(`B${i}`).value;

    if (VERBOSE) {
      console.log(`\n🔍 [${currentItem}/${totalItems}] Processing: ${itemName}`);
    }

    // Extract product ID from URL
    const productId = extractProductId(url);

    if (!productId) {
      console.log(`❌ Could not extract product ID from URL: ${url}`);
      continue;
    }

    if (VERBOSE) {
      console.log(`📦 Product ID: ${productId} for "${itemName}"`);
    }

    // Check if data already exists for today before making API call
    const dataAlreadyExists = await hasDataForToday(itemName);

    if (dataAlreadyExists) {
      if (VERBOSE) {
        console.log(`⏭️ Data for ${currentDate} already exists for "${itemName}" - skipping API call`);
      }
      continue; // Skip to next item
    }

    if (VERBOSE) {
      console.log(`🔍 No existing data found for ${currentDate} - fetching from API`);
    }

    // Get product data from API
    const variantData = await getProductData(productId);

    if (variantData) {
      if (VERBOSE) {
        console.log(`✅ API data retrieved successfully for "${itemName}"`);
      }

      const priceInfo = extractPriceInfo(variantData);

      if (VERBOSE) {
        const discountEmoji = priceInfo.discountPercent > 0 ? '💰' : '🆓';
        const incredibleEmoji = priceInfo.isIncredible === '1' ? '🔥' : '📦';
        console.log(`${discountEmoji} Price: ${priceInfo.sellingPrice} | Discount: ${priceInfo.discountPercent}% | ${incredibleEmoji} Incredible: ${priceInfo.isIncredible}`);
      }

      if (OUTPUT) {
        await writeToExcel(itemName, priceInfo.sellingPrice, priceInfo.discountPercent, priceInfo.isIncredible);
      }

      // Add the program's output to the outputWorkbook
      let outputSheet = outputWorkbook.getWorksheet(currentDate);
      if (!outputSheet) {
        outputSheet = outputWorkbook.addWorksheet(currentDate);
        outputSheet.addRow(['Name', 'Price', 'Discount', 'Link', 'Incredible']); // Header row
      }

      outputSheet.addRow([itemName, priceInfo.sellingPrice, priceInfo.discountPercent, url, priceInfo.isIncredible]);
      console.log(`🎉 Data processed for "${itemName}"`);
    } else {
      console.log(`❌ Failed to retrieve data for "${itemName}" (Product ID: ${productId})`);
    }

    // Add a delay between requests to be respectful to the API (2-3 seconds)
    if (i < worksheet.rowCount) { // Don't delay after the last item
      const delay = 2000 + Math.random() * 1000; // 2-3 second random delay
      if (VERBOSE) {
        console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next request...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (OUTPUT) {
    // Save the outputWorkbook to output.xlsx in the main directory
    await outputWorkbook.xlsx.writeFile(OUTPUT_FILE_PATH);
    console.log(`📋 Summary saved to ${OUTPUT_FILE_PATH}`);
  }

  console.log(`🎊 Scraping session completed! Processed ${totalItems} items on ${currentDate}`);
}

// Create the "items" directory if it doesn't exist
if (!fs.existsSync(ITEMS_DIRECTORY)) {
  fs.mkdirSync(ITEMS_DIRECTORY);
}

scrapeWebpages();
