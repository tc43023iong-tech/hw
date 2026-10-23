import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Cloud,
  CheckCircle2,
  Clock,
  Printer,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Presentation,
  BookMarked,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DailyDiaryView } from './components/DailyDiaryView';
import { HandbookTwoPage } from './components/HandbookTwoPage';
import { SchoolCalendarView } from './components/SchoolCalendarView';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import { DailyEntry, HandbookWeek, SchoolClass } from './types/handbook';
import {
  DEFAULT_CLASSES,
  SCHOOL_NAME,
  ACADEMIC_YEAR,
  TOTAL_TEACHING_DAYS,
  getCalendarDayInfo
} from './data/calendar2026_2027';
import {
  subscribeWeek,
  subscribeWeekEntries,
  subscribeDailyEntry,
  getLocalEntry,
  setLocalEntry,
  saveDailyEntry,
  saveHandbookWeek
} from './services/handbookService';
import {
  fetchEntriesFromGasWebApp,
  getSavedGasUrl
} from './services/googleAppsScriptService';
import { getSavedSpreadsheetId } from './services/googleSheetsService';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'daily' | 'two_page' | 'calendar'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-26'); // Matching image_31163172.png (26/10/2026)
  const [currentWeek, setCurrentWeek] = useState<number>(8); // Week 8 from image_31163172.png
  const [currentTerm, setCurrentTerm] = useState<1 | 2>(1);
  const [selectedClassId, setSelectedClassId] = useState<string>('p4b');
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Firestore real-time state
  const [handbookWeek, setHandbookWeek] = useState<HandbookWeek | null>(null);
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasSeededInitial, setHasSeededInitial] = useState<boolean>(false);
  const [hasExternalUpdate, setHasExternalUpdate] = useState<boolean>(false);

  // Google Apps Script integration state
  const [isGasModalOpen, setIsGasModalOpen] = useState<boolean>(false);
  const [isGasLoading, setIsGasLoading] = useState<boolean>(false);
  const [isGasOldVersion, setIsGasOldVersion] = useState<boolean>(false);
  const [gasLoadMsg, setGasLoadMsg] = useState<string | null>(null);

  // Sync / Load all entries from Google Sheet
  const loadEntriesFromGoogleSheet = async (showToastNotice = false) => {
    const currentGasUrl = getSavedGasUrl();
    if (!currentGasUrl || !currentGasUrl.trim().startsWith('http')) return;

    try {
      setIsGasLoading(true);
      const res = await fetchEntriesFromGasWebApp(currentGasUrl);
      if (res.isOldVersion) {
        setIsGasOldVersion(true);
        return;
      }

      setIsGasOldVersion(false);
      if (res.success && res.entries && res.entries.length > 0) {
        const gasMap: Record<string, DailyEntry> = {};
        res.entries.forEach((row: any) => {
          if (!row.date) return;
          const entryId = `${ACADEMIC_YEAR}_${selectedClassId}_${row.date}`;
          const dEntry: DailyEntry = {
            id: entryId,
            date: row.date,
            weekNumber: row.weekNumber || 8,
            dayOfWeek: 1,
            classId: selectedClassId,
            chinese: row.chinese || '',
            math: row.math || '',
            english: row.english || '',
            generalStudies: row.generalStudies || '',
            other: row.other || '',
            duty: row.duty || '',
            notes: row.notes || '',
          };
          gasMap[row.date] = dEntry;
          setLocalEntry(dEntry);
          saveDailyEntry(dEntry).catch(() => {});
        });

        setEntries((prev) => ({
          ...prev,
          ...gasMap,
        }));

        if (showToastNotice) {
          setGasLoadMsg(`已成功從 Google Sheet 載入 ${res.entries.length} 筆手冊內容！`);
          setTimeout(() => setGasLoadMsg(null), 4000);
        }
      } else if (showToastNotice) {
        setGasLoadMsg(res.message || 'Google Sheet 暫無手冊紀錄');
        setTimeout(() => setGasLoadMsg(null), 4000);
      }
    } catch (e: any) {
      console.warn('Failed to load from Google Sheet:', e);
      if (showToastNotice) {
        setGasLoadMsg('連線 Google Sheet 失敗');
        setTimeout(() => setGasLoadMsg(null), 4000);
      }
    } finally {
      setIsGasLoading(false);
    }
  };

  // Automatically fetch from Google Sheet on initial mount and when class changes
  useEffect(() => {
    loadEntriesFromGoogleSheet(false);
  }, [selectedClassId]);

  const selectedClass = DEFAULT_CLASSES.find((c) => c.id === selectedClassId) || DEFAULT_CLASSES[0];
  const weekId = `${ACADEMIC_YEAR}_${selectedClassId}_t${currentTerm}_w${currentWeek}`;

  // When selectedDate changes, calculate week and term
  useEffect(() => {
    const info = getCalendarDayInfo(selectedDate);
    setCurrentWeek(info.weekNumber);
    setCurrentTerm(info.term);
  }, [selectedDate]);

  // Real-time listener for current week's handbook
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeWeek(
      weekId,
      (weekData, isFromRemoteChange) => {
        setHandbookWeek(weekData);
        setIsSyncing(false);
        if (isFromRemoteChange) {
          setHasExternalUpdate(true);
        }
      },
      (err) => {
        console.error('Subscription error for week', err);
        setIsSyncing(false);
      }
    );
    return () => unsubscribe();
  }, [weekId]);

  // Real-time listener for daily entries in current week
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeWeekEntries(
      currentWeek,
      selectedClassId,
      (entriesMap) => {
        setEntries((prev) => ({
          ...prev,
          ...entriesMap,
        }));
        setIsSyncing(false);
      },
      (err) => {
        console.warn('Subscription info for week entries', err);
        setIsSyncing(false);
      }
    );
    return () => unsubscribe();
  }, [currentWeek, selectedClassId]);

  // Real-time listener specifically for the selected date entry
  useEffect(() => {
    const entryId = `${ACADEMIC_YEAR}_${selectedClassId}_${selectedDate}`;
    // Read local cache immediately to prevent blank flash
    const cached = getLocalEntry(entryId);
    if (cached) {
      setEntries((prev) => ({
        ...prev,
        [selectedDate]: cached,
      }));
    }

    const unsubscribe = subscribeDailyEntry(
      entryId,
      (entry) => {
        if (entry) {
          setEntries((prev) => ({
            ...prev,
            [entry.date || selectedDate]: entry,
          }));
        }
      },
      (err) => {
        console.warn('Subscription info for daily entry', err);
      }
    );
    return () => unsubscribe();
  }, [selectedDate, selectedClassId]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('handbook_entry_') || e.key.startsWith('handbook_week_'))) {
        setHasExternalUpdate(true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Seed sample data for 2026-10-26 matching image_31163172.png
  useEffect(() => {
    if (hasSeededInitial) return;
    const checkAndSeed = async () => {
      const sampleDate = '2026-10-26';
      const localSample = localStorage.getItem(`handbook_entry_${ACADEMIC_YEAR}_${selectedClassId}_${sampleDate}`);
      if (!localSample) {
        const sampleEntry: DailyEntry = {
          id: `${ACADEMIC_YEAR}_${selectedClassId}_${sampleDate}`,
          date: sampleDate,
          weekNumber: 8,
          dayOfWeek: 1,
          classId: selectedClassId,
          chinese: '',
          math: '• 課堂工作紙一張\n• 課堂工作紙一張\n• 課堂工作紙一張',
          english: '',
          generalStudies: '',
          other: '',
          duty: '',
          notes: '10/21 (Wed) English Test (Textbook, Vocab, Phonics...)\n22/10 (四) 普通話筆試 (第1-3課音節拼寫)',
        };

        const sampleWeek: HandbookWeek = {
          id: `${ACADEMIC_YEAR}_${selectedClassId}_t1_w8`,
          weekNumber: 8,
          academicYear: ACADEMIC_YEAR,
          classId: selectedClassId,
          examRemarks: '10/21 (Wed) English Test (Textbook, Vocab, Phonics...)\n22/10 (四) 普通話筆試 (第1-3課音節拼寫)',
          teacherSignature: '郭老師',
        };

        try {
          await saveDailyEntry(sampleEntry);
          await saveHandbookWeek(sampleWeek);
        } catch (e) {}
      }
      setHasSeededInitial(true);
    };

    checkAndSeed();
  }, [hasSeededInitial, selectedClassId]);

  // Save entry from Daily view with immediate optimistic state update
  const handleDailyEntryChange = (updatedEntry: DailyEntry) => {
    setEntries((prev) => ({
      ...prev,
      [updatedEntry.date]: updatedEntry,
    }));
    saveDailyEntry(updatedEntry);
  };

  // Jump from calendar
  const handleSelectFromCalendar = (dateStr: string, weekNum: number, term: 1 | 2) => {
    setSelectedDate(dateStr);
    setCurrentWeek(weekNum);
    setCurrentTerm(term);
    setIsCalendarModalOpen(false);
    setActiveTab('daily');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased flex flex-col font-sans">
      {/* Top Navigation Bar (Matching image_31163172.png) */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & School Header */}
          <div className="flex items-center space-x-3">
            <div className="bg-white text-emerald-800 p-2 rounded-xl shadow-inner flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-lg md:text-xl font-bold tracking-tight">{SCHOOL_NAME}</h1>
                
                {/* 只保留班級：四乙班 */}
                <div className="flex items-center gap-1.5 bg-emerald-950/80 px-3.5 py-1 rounded-xl border border-emerald-600/70 shadow-inner">
                  <span className="text-xs md:text-sm font-extrabold text-amber-400 tracking-wider">
                    四乙班
                  </span>
                </div>
              </div>
              <p className="text-xs text-emerald-200">
                {ACADEMIC_YEAR} 年度 每日家課手冊登記系統
              </p>
            </div>
          </div>

          {/* Cloud Sync & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Sync status pill */}
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-600/50">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400'
                }`}
              ></span>
              <span className="text-emerald-100 font-medium">
                {isSyncing ? '同步中...' : '已全部同步'}
              </span>
            </div>

            {/* Load from Google Sheet Button */}
            <button
              onClick={() => loadEntriesFromGoogleSheet(true)}
              disabled={isGasLoading}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer text-white"
              title="從 Google Sheet 載入全部手冊內容"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>{isGasLoading ? '讀取中...' : '載入 Google Sheet'}</span>
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={() => setIsPrintOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-medium rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="列印或匯出當前頁"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">列印 / 存為PDF</span>
            </button>

            {/* Academic Calendar Modal Button */}
            <button
              onClick={() => setActiveTab('calendar')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>全學年校曆</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between border-t border-emerald-700/60 bg-emerald-800/80">
          <nav className="flex space-x-1 sm:space-x-3 py-1 text-xs">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'daily'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              每日手冊登記
            </button>
            <button
              onClick={() => setActiveTab('two_page')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'two_page'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              雙頁手冊排版 (一週兩頁 • 測考備註)
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              全學年 197.5 上學日與測考表
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-3 sm:p-5 flex-1 flex flex-col">
        {/* Toast for Google Sheet Sync */}
        {gasLoadMsg && (
          <div className="fixed top-16 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{gasLoadMsg}</span>
          </div>
        )}


        {/* Remote / other device update notification */}
        {hasExternalUpdate && (
          <div className="bg-amber-500 text-amber-950 px-4 py-3 rounded-2xl shadow-lg border-2 border-amber-400 flex flex-wrap items-center justify-between gap-3 mb-4 animate-pulse">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-950 shrink-0" />
              <div>
                <p className="font-bold text-sm sm:text-base text-amber-950">
                  內容有更新，或其他設備更改了內容
                </p>
                <p className="text-xs text-amber-900 font-medium">
                  偵測到最新修訂，請點擊按鈕刷新版面以載入最新手冊內容
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHasExternalUpdate(false);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 text-amber-700" />
                請刷新版面
              </button>
              <button
                onClick={() => setHasExternalUpdate(false)}
                className="px-2.5 py-2 text-amber-900 hover:text-amber-950 text-xs font-semibold cursor-pointer"
                title="關閉提示"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {activeTab === 'daily' && (
          <DailyDiaryView
            selectedDate={selectedDate}
            entry={entries[selectedDate] || getLocalEntry(`${ACADEMIC_YEAR}_${selectedClassId}_${selectedDate}`) || undefined}
            classId={selectedClassId}
            className={selectedClass.name}
            onDateChange={(d) => setSelectedDate(d)}
            onEntryChange={handleDailyEntryChange}
            onOpenCalendarModal={() => setActiveTab('calendar')}
            onReloadFromGas={() => loadEntriesFromGoogleSheet(true)}
            isGasLoading={isGasLoading}
          />
        )}

        {activeTab === 'two_page' && (
          <HandbookTwoPage
            weekNumber={currentWeek}
            term={currentTerm}
            classId={selectedClassId}
            className={selectedClass.name}
            handbookWeek={handbookWeek}
            entries={entries}
            isSyncing={isSyncing}
            onWeekChange={(w) => setCurrentWeek(w)}
            onOpenPrint={() => setIsPrintOpen(true)}
            onSelectDayForFocus={(d) => {
              setSelectedDate(d);
              setActiveTab('daily');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <SchoolCalendarView onSelectDateAndWeek={handleSelectFromCalendar} />
        )}
      </main>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        weekNumber={currentWeek}
        term={currentTerm}
        className={selectedClass.name}
        handbookWeek={handbookWeek}
        entries={entries}
      />

      {/* Google Apps Script Setup & Sync Modal */}
      <GoogleAppsScriptModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onUrlUpdated={() => loadEntriesFromGoogleSheet(true)}
      />
    </div>
  );
}
