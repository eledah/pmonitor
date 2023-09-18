const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const INPUT_FOLDER = '../items'; // Change this to the folder containing Excel files

function convertExcelToJson(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming you want to read the first sheet

  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);

  return jsonData;
}

// Read and convert all Excel files in the input folder
fs.readdirSync(INPUT_FOLDER).forEach((file) => {
  if (file.endsWith('.xlsx')) {
    const excelFilePath = path.join(INPUT_FOLDER, file);
    const jsonData = convertExcelToJson(excelFilePath);

    // Construct the output JSON file path with the same name as the input file
    const jsonFileName = path.join(INPUT_FOLDER, path.basename(file, '.xlsx') + '.json');
    
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonData, null, 2));
    console.log(`Converted ${excelFilePath} to ${jsonFileName}`);
  }
});

console.log('Conversion completed!');
