import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Cloud,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  AlertCircle,
  HelpCircle,
  Printer,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Tag,
  PenTool,
  Undo2
} from 'lucide-react';
import { DailyEntry, HandbookWeek, SubjectKey } from '../types/handbook';
import { getWeekDates, getUpcomingExamsForWeek, SCHOOL_NAME, ACADEMIC_YEAR } from '../data/calendar2026_2027';
import { saveDailyEntry, saveHandbookWeek } from '../services/handbookService';

interface Props {
  weekNumber: number;
  term: 1 | 2;
  classId: string;
  className: string;
  handbookWeek: HandbookWeek | null;
  entries: Record<string, DailyEntry>;
  isSyncing: boolean;
  onWeekChange: (week: number) => void;
  onOpenPrint: () => void;
  onSelectDayForFocus: (dateStr: string) => void;
}

const SUBJECTS: { key: SubjectKey; label: string; placeholder: string; color: string }[] = [
  { key: 'chinese', label: '中 文', placeholder: '', color: 'border-amber-200 focus:border-amber-500' },
  { key: 'math', label: '數 學', placeholder: '', color: 'border-blue-200 focus:border-blue-500' },
  { key: 'english', label: '英 文', placeholder: '', color: 'border-emerald-200 focus:border-emerald-500' },
  { key: 'generalStudies', label: '常 識', placeholder: '', color: 'border-purple-200 focus:border-purple-500' },
  { key: 'other', label: '其 他', placeholder: '', color: 'border-rose-200 focus:border-rose-500' },
];

const COMMON_SNIPPETS = [
  '抄寫生字第_課',
  '數作P.__',
  '溫習Dictation List',
  '常作P.__',
  '抄寫詞語兩次',
  '工作紙一張',
  '明穿體育服',
  '簽通告並交回',
  '帶備視藝用品',
  '溫習測驗範圍',
];

interface WeekSnapshot {
  entries: Record<string, DailyEntry>;
  examRemarks: string;
}

export const HandbookTwoPage: React.FC<Props> = ({
  weekNumber,
  term,
  classId,
  className,
  handbookWeek,
  entries,
  isSyncing,
  onWeekChange,
  onOpenPrint,
  onSelectDayForFocus,
}) => {
  const weekDays = getWeekDates(weekNumber, term);
  const weekId = `${ACADEMIC_YEAR}_${classId}_t${term}_w${weekNumber}`;

  // Local state for instant typing responsiveness without flicker
  const [localExamRemarks, setLocalExamRemarks] = useState('');
  const [localEntries, setLocalEntries] = useState<Record<string, DailyEntry>>({});
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');

  // Undo history stack
  const [undoStack, setUndoStack] = useState<WeekSnapshot[]>([]);

  // Ref for auto-resizing the weekly exam remarks
  const remarksRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResizeRemarks = () => {
    if (remarksRef.current) {
      remarksRef.current.style.height = 'auto';
      remarksRef.current.style.height = `${Math.max(90, remarksRef.current.scrollHeight)}px`;
    }
  };

  // Sync incoming props to local state
  useEffect(() => {
    if (handbookWeek) {
      setLocalExamRemarks(handbookWeek.examRemarks || '');
    } else {
      setLocalExamRemarks('');
    }
  }, [handbookWeek, weekId]);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  useEffect(() => {
    autoResizeRemarks();
  }, [localExamRemarks]);

  // Upcoming exams detected from school calendar for this week
  const upcomingExams = getUpcomingExamsForWeek(weekNumber, term);

  // Auto-save debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pushUndoSnapshot = () => {
    setUndoStack((prev) => [
      ...prev.slice(-20),
      {
        entries: JSON.parse(JSON.stringify(localEntries)),
        examRemarks: localExamRemarks,
      },
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setLocalEntries(previous.entries);
    setLocalExamRemarks(previous.examRemarks);

    triggerSave(previous.entries, previous.examRemarks);
  };

  // Keyboard shortcut Ctrl+Z / Cmd+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, localEntries, localExamRemarks]);

  const triggerSave = (newEntries: Record<string, DailyEntry>, remarks: string) => {
    setSavedStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Save week remarks
        await saveHandbookWeek({
          id: weekId,
          weekNumber,
          academicYear: ACADEMIC_YEAR,
          classId,
          examRemarks: remarks,
          teacherSignature: '',
        });

        // Save changed entries
        const promises = Object.values(newEntries).map((entry) => saveDailyEntry(entry));
        await Promise.all(promises);
        setSavedStatus('saved');
      } catch (err) {
        console.error('Error auto-saving handbook data', err);
        setSavedStatus('dirty');
      }
    }, 600);
  };

  const handleEntryFieldChange = (dateStr: string, field: SubjectKey | 'duty' | 'notes', value: string) => {
    pushUndoSnapshot();
    setSavedStatus('dirty');
    const existing = localEntries[dateStr] || {
      id: `${ACADEMIC_YEAR}_${classId}_${dateStr}`,
      date: dateStr,
      weekNumber,
      dayOfWeek: new Date(dateStr).getDay(),
      classId,
      chinese: '',
      math: '',
      english: '',
      generalStudies: '',
      other: '',
      duty: '',
      notes: '',
    };

    const updatedEntry: DailyEntry = {
      ...existing,
      [field]: value,
    };

    const updatedMap = {
      ...localEntries,
      [dateStr]: updatedEntry,
    };

    setLocalEntries(updatedMap);
    triggerSave(updatedMap, localExamRemarks);
  };

  const handleExamRemarksChange = (value: string) => {
    pushUndoSnapshot();
    setSavedStatus('dirty');
    setLocalExamRemarks(value);
    triggerSave(localEntries, value);
  };

  const handleApplyCalendarExamTemplate = () => {
    if (upcomingExams.length === 0) return;
    pushUndoSnapshot();
    const templateLines = upcomingExams.map((ev) => {
      const startParts = ev.startDate.split('-');
      const m = parseInt(startParts[1], 10);
      const d = parseInt(startParts[2], 10);
      return `${m}/${d} ${ev.title}：請預早溫習相關單元與詞彙`;
    });

    const prefix = localExamRemarks.trim() ? `${localExamRemarks.trim()}\n` : '';
    const newRemarks = `${prefix}★ 校曆測考備忘：\n${templateLines.join('\n')}`;
    handleExamRemarksChange(newRemarks);
  };

  const insertSnippet = (dateStr: string, subject: SubjectKey, snippet: string) => {
    const current = localEntries[dateStr]?.[subject] || '';
    const updated = current ? `${current}、${snippet}` : snippet;
    handleEntryFieldChange(dateStr, subject, updated);
  };

  // Divide days: Left Page (Mon, Tue, Wed), Right Page (Thu, Fri)
  const leftPageDays = weekDays.slice(0, 3);
  const rightPageDays = weekDays.slice(3, 5);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
            <button
              onClick={() => onWeekChange(Math.max(1, weekNumber - 1))}
              disabled={weekNumber <= 1}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="上一週"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 font-bold text-stone-800 text-sm md:text-base">
              第 {weekNumber} 週
            </span>
            <button
              onClick={() => onWeekChange(weekNumber + 1)}
              disabled={weekNumber >= 24}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="下一週"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-medium">
              {term === 1 ? '第 1 學期' : '第 2 學期'}
            </span>
            <span className="text-xs px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-medium">
              {className}
            </span>
          </div>

          {/* UNDO BUTTON */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 disabled:opacity-40 disabled:hover:bg-amber-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="撤回上一步更動 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 text-amber-700" />
            <span>撤 回 (Undo)</span>
            {undoStack.length > 0 && (
              <span className="bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {undoStack.length}
              </span>
            )}
          </button>
        </div>

        {/* Sync & Helper Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {savedStatus === 'saving' || isSyncing ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 animate-spin" /> 雲端儲存中...
              </span>
            ) : savedStatus === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Cloud className="w-3.5 h-3.5" /> 雲端已即時同步
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-stone-500 font-medium bg-stone-100 px-2.5 py-1 rounded-full">
                有未儲存更動
              </span>
            )}
          </div>

          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            title="列印或匯出為雙頁手冊排版"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            列印/預覽
          </button>
        </div>
      </div>

      {/* Notice Banner if upcoming exams in calendar */}
      {upcomingExams.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-200/60 text-amber-900 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-amber-950">
                校曆測考提示：本週或近期有 {upcomingExams.length} 項測考活動
              </p>
              <p className="text-xs text-amber-800">
                {upcomingExams.map((e) => `${e.title} (${e.startDate})`).join('、')}
              </p>
            </div>
          </div>
          <button
            onClick={handleApplyCalendarExamTemplate}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            自動填入本週測考備註
          </button>
        </div>
      )}

      {/* Authentic Physical Handbook Spread (雙頁手冊) */}
      <div className="relative bg-stone-100/90 rounded-3xl p-3 md:p-6 shadow-xl border border-stone-300">
        {/* Book Header */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between border-b-2 border-red-700 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-6 bg-red-700 rounded-xs"></div>
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wider text-red-900 font-serif">
                {SCHOOL_NAME} • 家課登記欄
              </h2>
              <p className="text-xs text-stone-500 font-serif">
                {ACADEMIC_YEAR} 學年度 • {className} • 雙頁手冊標準格式
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-serif text-stone-700">
            <span className="border-b border-red-700 px-3 py-0.5 font-bold text-red-800 text-sm">
              第 {weekNumber} 週
            </span>
            <span className="text-stone-400">|</span>
            <span className="text-stone-600">一週兩頁 • 備註全週共用一次</span>
          </div>
        </div>

        {/* Two Pages Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Virtual Spine Divider on large screens */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -ml-[0.5px] bg-gradient-to-b from-stone-300 via-stone-400 to-stone-300 shadow-xs z-10 pointer-events-none"></div>

          {/* LEFT PAGE (左頁: 週一、週二、週三) */}
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-red-200/90 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between border-b border-red-100 pb-2">
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                <BookOpen className="w-3.5 h-3.5" /> 左頁 (星期一 至 星期三)
              </span>
              <span className="text-xs text-stone-400 font-serif">{SCHOOL_NAME}</span>
            </div>

            <div className="space-y-6">
              {leftPageDays.map((dayItem) => (
                <DayCard
                  key={dayItem.date}
                  dayItem={dayItem}
                  entry={localEntries[dayItem.date]}
                  onFieldChange={(field, val) => handleEntryFieldChange(dayItem.date, field, val)}
                  onFocusClick={() => onSelectDayForFocus(dayItem.date)}
                  onInsertSnippet={(sub, text) => insertSnippet(dayItem.date, sub, text)}
                />
              ))}
            </div>

            <div className="pt-2 text-center text-[11px] text-stone-400 border-t border-stone-100 font-serif">
              - 左頁完 -
            </div>
          </div>

          {/* RIGHT PAGE (右頁: 週四、週五 + 測考備註) */}
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-red-200/90 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between border-b border-red-100 pb-2">
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                <BookOpen className="w-3.5 h-3.5" /> 右頁 (星期四 至 星期五 及 本週測考備忘)
              </span>
              <span className="text-xs text-red-800 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                本週測考備註寫一次即可
              </span>
            </div>

            <div className="space-y-6">
              {rightPageDays.map((dayItem) => (
                <DayCard
                  key={dayItem.date}
                  dayItem={dayItem}
                  entry={localEntries[dayItem.date]}
                  onFieldChange={(field, val) => handleEntryFieldChange(dayItem.date, field, val)}
                  onFocusClick={() => onSelectDayForFocus(dayItem.date)}
                  onInsertSnippet={(sub, text) => insertSnippet(dayItem.date, sub, text)}
                />
              ))}

              {/* CRITICAL USER REQUIREMENT:
                  "要有一個備注，備註是for測考日期，它們一週用兩頁手冊，備註把測考日期寫一次就可以"
                  "雙頁手冊排版 (一週兩頁 • 測考備註)也要根據內容調整大小" */}
              <div className="border-2 border-red-600 rounded-xl bg-red-50/20 overflow-hidden shadow-xs">
                {/* Remarks Header */}
                <div className="bg-red-700 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-red-200" />
                    <span>備 註 ( 本週測考日期及重要事項 )</span>
                  </div>
                  <span className="text-[11px] font-normal text-red-100">
                    全週兩頁共用 • 寫一次即可
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-stone-500">
                    <span>登記近期測驗、考試、默書或重要通知範圍：</span>
                    <button
                      onClick={() => {
                        const sample = `7/10 (Wed) English Test: Textbook, Vocab, Phonics, Comprehension\n22/10 (四) 普通話筆試：溫習課文及音節\n29/10 (四) 普通話口試`;
                        handleExamRemarksChange(sample);
                      }}
                      className="text-red-700 hover:text-red-900 underline text-[11px] cursor-pointer"
                    >
                      填入範例格式
                    </button>
                  </div>

                  <textarea
                    ref={remarksRef}
                    value={localExamRemarks}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = `${Math.max(90, el.scrollHeight)}px`;
                    }}
                    onChange={(e) => handleExamRemarksChange(e.target.value)}
                    rows={4}
                    placeholder=""
                    className="w-full text-xs md:text-sm font-sans p-2.5 bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-800 placeholder:text-stone-300 leading-relaxed resize-none overflow-hidden"
                  />

                  {/* Clean info footer with no signatures */}
                  <div className="flex items-center justify-between pt-1 border-t border-red-100 text-xs text-stone-500 font-serif">
                    <span>{SCHOOL_NAME} • 家課手冊</span>
                    <span className="text-[11px] text-stone-400 font-serif">每週測考備忘寫一次即可</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-stone-400 border-t border-stone-100 font-serif">
              - 右頁完 -
            </div>
          </div>
        </div>
      </div>

      {/* Quick Snippets Helper Palette */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-700 font-medium">
          <Tag className="w-4 h-4 text-red-600" />
          <span>常用家課快捷詞：</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {COMMON_SNIPPETS.map((snip, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-lg select-all cursor-pointer hover:bg-stone-200 transition-colors"
              title="點擊可直接複製"
              onClick={() => {
                navigator.clipboard.writeText(snip);
              }}
            >
              {snip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual day block matching physical handbook row lines
// with auto-expanding rows for subjects and duty
interface DayCardProps {
  dayItem: {
    date: string;
    dayOfWeek: number;
    label: string;
    info: {
      isTeachingDay: boolean;
      dayType: string;
      title?: string;
      description?: string;
    };
  };
  entry: DailyEntry | undefined;
  onFieldChange: (field: SubjectKey | 'duty' | 'notes', val: string) => void;
  onFocusClick: () => void;
  onInsertSnippet: (subject: SubjectKey, text: string) => void;
}

const DayCard: React.FC<DayCardProps> = ({
  dayItem,
  entry,
  onFieldChange,
  onFocusClick,
  onInsertSnippet,
}) => {
  const [mStr, dStr] = dayItem.date.split('-').slice(1);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  const isTeaching = dayItem.info.isTeachingDay;
  const isHoliday = dayItem.info.dayType === 'holiday';
  const isExam = dayItem.info.dayType === 'exam';

  const autoResizeField = (el: HTMLTextAreaElement | null, minH: number = 36) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(minH, el.scrollHeight)}px`;
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        isHoliday
          ? 'bg-rose-50/40 border-rose-200'
          : isExam
          ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300'
          : 'bg-stone-50/50 border-red-200'
      }`}
    >
      {/* Day Header */}
      <div
        className={`px-3 py-1.5 flex items-center justify-between text-xs font-bold border-b ${
          isHoliday
            ? 'bg-rose-100 text-rose-900 border-rose-200'
            : isExam
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
            : 'bg-red-100/70 text-red-900 border-red-200'
        }`}
      >
        <div className="flex items-center gap-2 font-serif">
          <span className="text-sm font-bold text-red-950">
            {m} 月 {d} 日
          </span>
          <span className="px-2 py-0.5 bg-white/70 rounded text-red-900 border border-red-200 text-xs">
            {dayItem.label}
          </span>
          {isHoliday && (
            <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-sans">
              假期：{dayItem.info.title}
            </span>
          )}
          {isExam && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-sans">
              測考日：{dayItem.info.title}
            </span>
          )}
          {!isHoliday && !isExam && (
            <span className="text-[11px] font-normal text-stone-500 font-sans">
              教學日
            </span>
          )}
        </div>

        <button
          onClick={onFocusClick}
          className="text-[11px] text-red-800 hover:text-red-950 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-red-200 transition-colors font-sans flex items-center gap-1 cursor-pointer"
          title="切換至單日手冊登記模式"
        >
          投影模式
        </button>
      </div>

      {/* Subject rows with auto-adjusting cell height based on content */}
      <div className="divide-y divide-red-100/90 text-xs">
        {SUBJECTS.map((sub) => {
          const val = entry?.[sub.key] || '';
          return (
            <div key={sub.key} className="flex items-stretch group hover:bg-red-50/20 transition-colors min-h-[36px]">
              {/* Subject label in left column with red borders */}
              <div className="w-16 md:w-20 shrink-0 bg-red-50/40 border-r border-red-200 flex items-center justify-center font-bold text-red-900 font-serif py-1 px-1 text-center select-none text-xs">
                {sub.label}
              </div>

              {/* Auto-expanding textarea according to content */}
              <div className="flex-1 relative flex items-center">
                <textarea
                  ref={(el) => autoResizeField(el, 36)}
                  value={val}
                  disabled={isHoliday}
                  rows={1}
                  onInput={(e) => autoResizeField(e.currentTarget, 36)}
                  onChange={(e) => onFieldChange(sub.key, e.target.value)}
                  placeholder={isHoliday ? '【學校假期，本日無課】' : sub.placeholder}
                  className={`w-full py-1.5 px-3 bg-transparent text-stone-800 placeholder:text-stone-300 focus:outline-none focus:bg-amber-50/30 text-xs md:text-sm font-sans resize-none overflow-hidden leading-relaxed transition-colors ${
                    isHoliday ? 'cursor-not-allowed opacity-60 italic' : ''
                  }`}
                />
              </div>
            </div>
          );
        })}

        {/* 新增一欄值日 (Duty row) with auto-expanding height */}
        <div className="flex items-stretch bg-amber-50/25 group hover:bg-amber-50/45 transition-colors min-h-[34px]">
          <div className="w-16 md:w-20 shrink-0 bg-red-50/70 border-r border-red-200 flex items-center justify-center font-bold text-emerald-950 font-serif py-1 px-1 text-center select-none text-xs">
            值 日
          </div>
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={(el) => autoResizeField(el, 34)}
              value={entry?.duty || ''}
              disabled={isHoliday}
              rows={1}
              onInput={(e) => autoResizeField(e.currentTarget, 34)}
              onChange={(e) => onFieldChange('duty', e.target.value)}
              placeholder={isHoliday ? '' : ''}
              className={`w-full py-1.5 px-3 bg-transparent text-stone-800 placeholder:text-stone-300 focus:outline-none focus:bg-amber-50/40 text-xs font-sans resize-none overflow-hidden leading-relaxed transition-colors ${
                isHoliday ? 'cursor-not-allowed opacity-60 italic' : ''
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
