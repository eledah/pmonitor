const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const INPUT_FOLDERS = ['../items', '../']; // Add the paths of the folders you want to scan and change

function convertExcelToJson(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming you want to read the first sheet

  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);

  return jsonData;
}

// Iterate through each input folder
for (const inputFolder of INPUT_FOLDERS) {
  // Read and convert all Excel files in the current input folder
  fs.readdirSync(inputFolder).forEach((file) => {
    if (file.endsWith('.xlsx')) {
      const excelFilePath = path.join(inputFolder, file);
      const jsonData = convertExcelToJson(excelFilePath);

      // Construct the output JSON file path with the same name as the input file
      const jsonFileName = path.join(inputFolder, path.basename(file, '.xlsx') + '.json');
      
      fs.writeFileSync(jsonFileName, JSON.stringify(jsonData, null, 2));
      console.log(`Converted ${excelFilePath} to ${jsonFileName}`);
    }
  });
}

console.log('Conversion completed!');
