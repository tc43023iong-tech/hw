export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * 同善堂中學小學部 每日家課手冊登記表 - Google Apps Script 雲端同步後端
 * 
 * 部署指引：
 * 1. 在 Google 開啟您的 Google 試算表（Google Sheet）
 * 2. 點擊頂部選單「擴充功能 (Extensions)」 -> 「Apps Script」
 * 3. 清空原有代碼，將本段完整代碼貼上並點擊「儲存 (Ctrl+S / Cmd+S)」
 * 4. 點擊右上角「部署 (Deploy)」 -> 「新增部署作業 (New deployment)」
 * 5. 齒輪選擇「網頁應用程式 (Web app)」
 *    - 說明：家課手冊同步服務
 *    - 執行身分：我 (Me)
 *    - 誰可以存取：任何人 (Anyone) （重要：選 Anyone 免登入即可由網頁直接同步）
 * 6. 點擊「部署」，授權存取後複製「網頁應用程式網址 (Web app URL)」
 * 7. 將網址貼回系統左側的「Google 試算表 Web App 網址」輸入框即可！
 */

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("每日手冊登記") || ss.getSheets()[0];
    
    // 如果工作表不存在，自動建立並格式化表頭
    if (!sheet) {
      sheet = ss.insertSheet("每日手冊登記");
    }
    
    if (sheet.getLastRow() === 0) {
      var headers = [
        "日期", "週次", "星期", "教學日狀態",
        "中文", "數學", "英文", "常識", "其他", "值日",
        "測驗/默書備忘", "最後更新時間"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#166534");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var dateStr = data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
    var weekStr = data.weekNumber ? "第 " + data.weekNumber + " 週" : "";
    var dayOfWeek = data.dayOfWeek || "";
    var statusDesc = data.statusDesc || "正常教學日";
    var chinese = data.chinese || "";
    var math = data.math || "";
    var english = data.english || "";
    var gs = data.generalStudies || "";
    var other = data.other || "";
    var duty = data.duty || "";
    var memos = data.notes || data.memos || "";
    var updateTime = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss");
    
    var rowData = [
      dateStr, weekStr, dayOfWeek, statusDesc,
      chinese, math, english, gs, other, duty,
      memos, updateTime
    ];
    
    // 檢查該日期是否已經存在於第 A 欄
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    for (var i = 1; i < values.length; i++) {
      var cellDate = values[i][0];
      var strCell = "";
      if (cellDate instanceof Date) {
        strCell = Utilities.formatDate(cellDate, "GMT+8", "yyyy-MM-dd");
      } else {
        strCell = String(cellDate).trim();
      }
      if (strCell === dateStr) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
      rowIndex = sheet.getLastRow();
    }
    
    var updatedRange = sheet.getRange(rowIndex, 1, 1, rowData.length);
    updatedRange.setWrap(true);
    sheet.autoResizeRows(rowIndex, 1);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "已成功同步至 Google 試算表",
      row: rowIndex,
      date: dateStr
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("每日手冊登記") || ss.getSheets()[0];
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        entries: [],
        message: "目前無工作表"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        entries: [],
        message: "工作表無手冊資料"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 自動辨識表頭欄位位置
    var headerRow = data[0];
    var colMap = {
      date: 0,
      week: 1,
      day: 2,
      status: 3,
      chinese: 4,
      math: 5,
      english: 6,
      gs: 7,
      other: 8,
      duty: 9,
      notes: 10,
      time: 11
    };
    
    for (var c = 0; c < headerRow.length; c++) {
      var h = String(headerRow[c]).trim().toLowerCase();
      if (h.indexOf("日期") !== -1 || h === "date") colMap.date = c;
      else if (h.indexOf("週") !== -1 || h.indexOf("周") !== -1 || h === "week") colMap.week = c;
      else if (h.indexOf("星期") !== -1 || h === "day") colMap.day = c;
      else if (h.indexOf("教學") !== -1 || h.indexOf("狀態") !== -1) colMap.status = c;
      else if (h.indexOf("中文") !== -1 || h === "chinese") colMap.chinese = c;
      else if (h.indexOf("數學") !== -1 || h === "math") colMap.math = c;
      else if (h.indexOf("英文") !== -1 || h === "english") colMap.english = c;
      else if (h.indexOf("常識") !== -1 || h === "gs") colMap.gs = c;
      else if (h.indexOf("其他") !== -1 || h === "other") colMap.other = c;
      else if (h.indexOf("值日") !== -1 || h === "duty") colMap.duty = c;
      else if (h.indexOf("備忘") !== -1 || h.indexOf("測驗") !== -1 || h.indexOf("默書") !== -1 || h === "notes") colMap.notes = c;
      else if (h.indexOf("更新") !== -1 || h.indexOf("時間") !== -1) colMap.time = c;
    }
    
    var entries = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rawDate = row[colMap.date];
      var dateStr = "";
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd");
      } else if (rawDate) {
        var str = String(rawDate).trim();
        if (/^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}$/.test(str)) {
          var parts = str.split(/[-/]/);
          dateStr = parts[0] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[2]).slice(-2);
        } else if (/^\\d{1,2}[-/]\\d{1,2}[-/]\\d{4}$/.test(str)) {
          var parts = str.split(/[-/]/);
          dateStr = parts[2] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[0]).slice(-2);
        } else {
          dateStr = str;
        }
      }
      if (!dateStr) continue;
      
      var weekVal = row[colMap.week];
      var weekNum = 0;
      if (typeof weekVal === "number") weekNum = weekVal;
      else if (weekVal) weekNum = parseInt(String(weekVal).replace(/[^0-9]/g, '')) || 0;
      
      entries.push({
        date: dateStr,
        weekNumber: weekNum,
        dayOfWeek: row[colMap.day] ? String(row[colMap.day]) : "",
        statusDesc: row[colMap.status] ? String(row[colMap.status]) : "",
        chinese: row[colMap.chinese] ? String(row[colMap.chinese]) : "",
        math: row[colMap.math] ? String(row[colMap.math]) : "",
        english: row[colMap.english] ? String(row[colMap.english]) : "",
        generalStudies: row[colMap.gs] ? String(row[colMap.gs]) : "",
        other: row[colMap.other] ? String(row[colMap.other]) : "",
        duty: row[colMap.duty] ? String(row[colMap.duty]) : "",
        notes: row[colMap.notes] ? String(row[colMap.notes]) : "",
        updatedAt: row[colMap.time] ? String(row[colMap.time]) : ""
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: entries.length,
      entries: entries
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString(),
      entries: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxH6eEkLFuti98OMxaPfEeGdQ8GAdE37xJ6_sAcynZ8ywUMhJQP7CIjKDFKHXUjAuuvvw/exec';
const GAS_URL_KEY = 'gas_sheet_webapp_url';

export function getSavedGasUrl(): string {
  try {
    return localStorage.getItem(GAS_URL_KEY) || DEFAULT_GAS_URL;
  } catch {
    return DEFAULT_GAS_URL;
  }
}

export function saveGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save GAS url', e);
  }
}

export async function fetchEntriesFromGasWebApp(
  gasUrl: string
): Promise<{ success: boolean; entries?: any[]; isOldVersion?: boolean; message?: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '未設定 Web App 網址' };
  }

  try {
    const res = await fetch(gasUrl.trim(), {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.entries && Array.isArray(data.entries)) {
      return {
        success: true,
        entries: data.entries,
        message: `已從 Google Sheet 成功載入 ${data.entries.length} 筆手冊資料`,
      };
    } else if (data.status === 'ok' && !data.entries) {
      // Old version of Apps Script that lacked doGet entries response
      return {
        success: false,
        entries: [],
        isOldVersion: true,
        message: '您的 Google Sheet Apps Script 為舊版本（僅支援寫入）。請在設定中複製最新代碼並重新部署為「新版本」，即可在網頁顯示 Google Sheet 的所有手冊！',
      };
    }
    return { success: false, message: data.message || '未取得資料' };
  } catch (err: any) {
    console.warn('Fetch from GAS error:', err);
    return { success: false, message: err.message || '連線至 Google 試算表失敗' };
  }
}

export async function syncEntryToGasWebApp(
  gasUrl: string,
  entry: {
    date: string;
    weekNumber: number;
    dayOfWeek: string;
    statusDesc: string;
    chinese: string;
    math: string;
    english: string;
    generalStudies: string;
    other: string;
    duty?: string;
    notes?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: '請先設定 Google Apps Script Web App 網址' };
  }

  try {
    await fetch(gasUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(entry),
    });

    return { success: true, message: '已發送至 Google 試算表' };
  } catch (error: any) {
    console.error('Failed to post to GAS Web App', error);
    return { success: false, message: error.message || '連線至 Google 試算表失敗' };
  }
}

