import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Copy,
  Check,
  X,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  getSavedGasUrl,
  saveGasUrl,
  syncEntryToGasWebApp,
  fetchEntriesFromGasWebApp
} from '../services/googleAppsScriptService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: (url: string) => void;
}

export const GoogleAppsScriptModal: React.FC<Props> = ({ isOpen, onClose, onUrlUpdated }) => {
  const [gasUrl, setGasUrl] = useState(getSavedGasUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; isWarning?: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveUrl = () => {
    saveGasUrl(gasUrl);
    onUrlUpdated(gasUrl.trim());
    setTestResult({ success: true, msg: '網址已保存！' });
    setTimeout(() => setTestResult(null), 3000);
  };

  // Test reading entries from Google Sheet
  const handleFetchFromGas = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ success: false, msg: '請先貼上 Web App 網址' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      saveGasUrl(gasUrl);
      const res = await fetchEntriesFromGasWebApp(gasUrl);
      if (res.isOldVersion) {
        setTestResult({
          success: false,
          isWarning: true,
          msg: '您的 Google Sheet Apps Script 目前為「舊版本」，僅具寫入功能。請複製下方最新代碼貼回 Apps Script，並點擊「管理部署作業」→「編輯」→ 版本選「新版本」→「部署」，即可在網頁顯示試算表內容！'
        });
      } else if (res.success) {
        setTestResult({
          success: true,
          msg: `連線讀取成功！已從 Google 試算表讀取到 ${res.entries?.length || 0} 筆手冊紀錄，網頁已同步更新。`
        });
        onUrlUpdated(gasUrl.trim());
      } else {
        setTestResult({
          success: false,
          msg: res.message || '讀取失敗，請確認已部署為「網頁應用程式」且存取權設為「任何人 (Anyone)」'
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || '連線失敗' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestSync = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ success: false, msg: '請先貼上 Web App 網址' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      saveGasUrl(gasUrl);
      onUrlUpdated(gasUrl.trim());

      await syncEntryToGasWebApp(gasUrl, {
        date: new Date().toISOString().slice(0, 10),
        weekNumber: 8,
        dayOfWeek: '星期一',
        statusDesc: '測試同步連線',
        chinese: '【測試】中文家課連線成功',
        math: '【測試】數學家課連線成功',
        english: '【測試】English Test OK',
        generalStudies: '【測試】常識連線成功',
        other: '【測試】其他事項連線成功',
        notes: '【測試】測考備忘已連線至 Google 試算表！'
      });

      setTestResult({
        success: true,
        msg: '測試資料已發送！請開啟您的 Google Sheet 查看是否已新增「每日手冊登記」工作表與資料列。'
      });
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || '測試失敗，請檢查網址與部署權限' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/80 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">Google 試算表 Apps Script 部署與同步</h3>
              <p className="text-xs text-emerald-200">
                在您的 Google 試算表貼上代碼並部署，實現零限制、跨設備自動儲存
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Step-by-step Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-700" />
              四步驟快速部署（只需做一次）：
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  第 1 步
                </span>
                <p className="font-bold text-slate-800 text-sm">在 Google 開啟您的 Sheet</p>
                <p className="text-slate-500">
                  登入 Google 雲端硬碟，打開或新建一個 Google 試算表。
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  第 2 步
                </span>
                <p className="font-bold text-slate-800 text-sm">打開 Apps Script 貼上代碼</p>
                <p className="text-slate-500">
                  點選頂部「擴充功能」→「Apps Script」，清空後貼上下方的代碼並儲存。
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  第 3 步
                </span>
                <p className="font-bold text-slate-800 text-sm">新增部署作業（網頁應用程式）</p>
                <p className="text-slate-500">
                  點右上角「部署」→「新增部署作業」，類型選「網頁應用程式」，存取權選「<strong>任何人 (Anyone)</strong>」。
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  第 4 步
                </span>
                <p className="font-bold text-slate-800 text-sm">複製網址貼回下方</p>
                <p className="text-slate-500">
                  將生成的「網頁應用程式網址 (結尾為 /exec)」貼回下方網址欄位即完成連線！
                </p>
              </div>
            </div>
          </div>

          {/* Web App URL input section */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 space-y-3">
            <label className="block text-xs font-bold text-emerald-950">
              貼上您的 Google Apps Script 網頁應用程式網址 (Web App URL)：
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 px-3 py-2 text-xs md:text-sm bg-white border border-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                儲存網址
              </button>
              <button
                onClick={handleFetchFromGas}
                disabled={testing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                title="從您的 Google 試算表讀取所有手冊內容"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {testing ? '連線中...' : '📥 讀取試算表手冊'}
              </button>
              <button
                onClick={handleTestSync}
                disabled={testing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                測試寫入
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed ${
                  testResult.isWarning
                    ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-medium'
                    : testResult.success
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium'
                    : 'bg-red-100 text-red-900 border border-red-300 font-medium'
                }`}
              >
                {testResult.isWarning ? (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                ) : testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>

          {/* Code Viewer & One-click Copy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Google Apps Script 完整程式碼（請整段複製）：
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? '已複製代碼！' : '一鍵複製完整代碼'}
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900">
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-800">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            設定完成後，每次在手冊鍵入內容均會自動即時更新至您的 Google Sheet。
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
