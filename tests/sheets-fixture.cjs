const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
  const sheets = new Map();
  class Sheet {
    constructor() { this.rows = []; }
    getLastRow() { return this.rows.length; }
    setFrozenRows() { return this; }
    getRange(row, col, height = 1, width = 1) {
      const self = this;
      const range = {
        setValues(values) {
          values.forEach((line, y) => line.forEach((value, x) => {
            self.rows[row - 1 + y] ||= [];
            self.rows[row - 1 + y][col - 1 + x] = value;
          }));
          return range;
        },
        getValues() { return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => self.rows[row - 1 + y]?.[col - 1 + x] ?? '')); },
        setValue(value) { return range.setValues([[value]]); },
        getValue() { return range.getValues()[0][0]; },
        getDisplayValue() { return String(range.getValue()); },
        setBackground() { return range; }, setFontColor() { return range; }, setFontWeight() { return range; }
      };
      return range;
    }
  }
  const book = { getSheetByName: name => sheets.get(name), getSheets: () => [...sheets.values()],
    insertSheet(name) { const sheet = new Sheet(); sheets.set(name, sheet); return sheet; } };
  const context = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => book, flush() {} },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    Utilities: { getUuid: () => require('node:crypto').randomUUID(), formatDate: () => '19/11/2026 12:00:00' }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../google-apps-script.js'), 'utf8'), context);
  return { sheets, context, post: data => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(data) } }).text) };
}
module.exports = fixture;
