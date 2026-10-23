import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  SkipBack,
  SkipForward,
  Copy,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Code2,
  RefreshCw,
  Info,
  Undo2,
  Sparkles
} from 'lucide-react';
import { DailyEntry, SubjectKey } from '../types/handbook';
import { getCalendarDayInfo, SCHOOL_NAME, ACADEMIC_YEAR } from '../data/calendar2026_2027';
import {
  getSavedGasUrl,
  saveGasUrl,
  syncEntryToGasWebApp
} from '../services/googleAppsScriptService';
import { GoogleAppsScriptModal } from './GoogleAppsScriptModal';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  entry: DailyEntry | undefined;
  classId: string;
  className: string;
  onDateChange: (dateStr: string) => void;
  onEntryChange: (updatedEntry: DailyEntry) => void;
  onOpenCalendarModal: () => void;
  onReloadFromGas?: () => void;
  isGasLoading?: boolean;
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'chinese', label: '中文' },
  { id: 'math', label: '數學' },
  { id: 'english', label: '英文' },
  { id: 'gs', label: '常識' },
  { id: 'other', label: '帶備/通告' },
  { id: 'memo', label: '測考備忘' },
  { id: 'duty', label: '值日生' },
] as const;

const TEMPLATE_TAGS: { category: string; label: string; text: string; defaultField?: SubjectKey | 'duty' | 'memos' }[] = [
  // 中文
  { category: 'chinese', label: '生字兩次', text: '抄寫生字兩次', defaultField: 'chinese' },
  { category: 'chinese', label: '詞語手冊', text: '抄寫詞語手冊第_課', defaultField: 'chinese' },
  { category: 'chinese', label: '預習課文', text: '預習第_課並查生字字典', defaultField: 'chinese' },
  { category: 'chinese', label: '改正生字', text: '改正生字作業並交回', defaultField: 'chinese' },
  { category: 'chinese', label: '課文朗讀', text: '大聲朗讀課文兩次', defaultField: 'chinese' },
  { category: 'chinese', label: '背誦課文', text: '背誦課文第_段', defaultField: 'chinese' },
  { category: 'chinese', label: '造句練習', text: '完成造句練習 5 題', defaultField: 'chinese' },
  { category: 'chinese', label: '作文謄清', text: '完成作文謄清並簽署', defaultField: 'chinese' },
  { category: 'chinese', label: '閱讀理解', text: '閱讀工作紙一張', defaultField: 'chinese' },
  { category: 'chinese', label: '中文默書', text: '溫習中文第_課默書', defaultField: 'chinese' },

  // 數學
  { category: 'math', label: '數作P.__', text: '完成數作 P.__', defaultField: 'math' },
  { category: 'math', label: '補充練習', text: '數學補充練習 P.__', defaultField: 'math' },
  { category: 'math', label: '課堂工作紙', text: '課堂工作紙一張', defaultField: 'math' },
  { category: 'math', label: '口算速算', text: '完成口算練習 20 題', defaultField: 'math' },
  { category: 'math', label: '改正數作', text: '改正數學作業簿交回', defaultField: 'math' },
  { category: 'math', label: '預習新單元', text: '預習數學新單元重點', defaultField: 'math' },
  { category: 'math', label: '溫習公式', text: '溫習單元公式與圖形定義', defaultField: 'math' },
  { category: 'math', label: '應用題', text: '完成應用題練習三題', defaultField: 'math' },

  // 英文
  { category: 'english', label: 'Dictation', text: 'Revise Dictation List _', defaultField: 'english' },
  { category: 'english', label: 'Workbook', text: 'Workbook P.__', defaultField: 'english' },
  { category: 'english', label: 'Grammar WS', text: 'Grammar Worksheet (1)', defaultField: 'english' },
  { category: 'english', label: 'Copying x4', text: 'Copying List _ x 4(A)', defaultField: 'english' },
  { category: 'english', label: 'Read Reader', text: 'Read Reader Chapter _', defaultField: 'english' },
  { category: 'english', label: 'Correction', text: 'Corrections & Parent Sign', defaultField: 'english' },
  { category: 'english', label: 'Vocabulary', text: 'Learn Vocabulary words 1-10', defaultField: 'english' },
  { category: 'english', label: 'Writing Task', text: 'Complete Writing Task', defaultField: 'english' },

  // 常識
  { category: 'gs', label: '常作P.__', text: '完成常作 P.__', defaultField: 'generalStudies' },
  { category: 'gs', label: '溫習重點', text: '溫習常識第_課重點', defaultField: 'generalStudies' },
  { category: 'gs', label: '搜集資料', text: '搜集專題研習圖片與資料', defaultField: 'generalStudies' },
  { category: 'gs', label: '常識筆記', text: '整理常識單元筆記', defaultField: 'generalStudies' },
  { category: 'gs', label: '科學觀察', text: '完成科學小觀察紀錄表', defaultField: 'generalStudies' },

  // 其他 / 帶備物品 / 通告
  { category: 'other', label: '明穿體育服', text: '明穿體育服及運動鞋', defaultField: 'other' },
  { category: 'other', label: '簽通告並交回', text: '簽通告(一)並交回', defaultField: 'other' },
  { category: 'other', label: '交回回條', text: '交回學生調查回條', defaultField: 'other' },
  { category: 'other', label: '美勞剪刀膠水', text: '帶備美勞剪刀、膠水及粉彩', defaultField: 'other' },
  { category: 'other', label: '水彩調色盤', text: '帶備水彩、毛筆及調色盤', defaultField: 'other' },
  { category: 'other', label: '直尺圓規', text: '帶備直尺、三角尺及圓規', defaultField: 'other' },
  { category: 'other', label: '課外書一本', text: '帶備課外書一本供晨讀', defaultField: 'other' },
  { category: 'other', label: '音樂直笛', text: '帶備音樂直笛及歌書', defaultField: 'other' },

  // 測考備忘
  { category: 'memo', label: '下週一默書', text: '下週一默書（範圍：第_課）', defaultField: 'memos' },
  { category: 'memo', label: '單元測驗', text: '單元測驗：請溫習課本及工作紙', defaultField: 'memos' },
  { category: 'memo', label: '普通話筆試', text: '普通話筆試：溫習聲母韻母及詞語', defaultField: 'memos' },
  { category: 'memo', label: '普通話口試', text: '普通話口試：朗讀課文短篇', defaultField: 'memos' },
  { category: 'memo', label: '段考溫習', text: '段考將至，請預早制定溫習時間表', defaultField: 'memos' },

  // 值日
  { category: 'duty', label: '1號 2號', text: '1號、2號', defaultField: 'duty' },
  { category: 'duty', label: '3號 4號', text: '3號、4號', defaultField: 'duty' },
  { category: 'duty', label: '5號 6號', text: '5號、6號', defaultField: 'duty' },
  { category: 'duty', label: '第1組', text: '第1組全體同學', defaultField: 'duty' },
  { category: 'duty', label: '第2組', text: '第2組全體同學', defaultField: 'duty' },
  { category: 'duty', label: '第3組', text: '第3組全體同學', defaultField: 'duty' },
  { category: 'duty', label: '第4組', text: '第4組全體同學', defaultField: 'duty' },
  { category: 'duty', label: '班長協助', text: '值日生及班長協助檢查', defaultField: 'duty' },
];

interface FormSnapshot {
  chinese: string;
  math: string;
  english: string;
  gs: string;
  other: string;
  duty: string;
  memos: string;
}

export const DailyDiaryView: React.FC<Props> = ({
  selectedDate,
  entry,
  classId,
  className,
  onDateChange,
  onEntryChange,
  onOpenCalendarModal,
  onReloadFromGas,
  isGasLoading,
}) => {
  // Local form state
  const [chinese, setChinese] = useState(entry?.chinese || '');
  const [math, setMath] = useState(entry?.math || '');
  const [english, setEnglish] = useState(entry?.english || '');
  const [gs, setGs] = useState(entry?.generalStudies || '');
  const [other, setOther] = useState(entry?.other || '');
  const [duty, setDuty] = useState(entry?.duty || '');
  const [memos, setMemos] = useState(entry?.notes || '');

  // Active category filter for snippets
  const [selectedSnippetCategory, setSelectedSnippetCategory] = useState<string>('all');

  // Undo history stack
  const [undoStack, setUndoStack] = useState<FormSnapshot[]>([]);

  // Active input tracking for quick append
  const [activeFieldName, setActiveFieldName] = useState<SubjectKey | 'duty' | 'memos'>('chinese');

  // Google Apps Script state
  const [gasUrl, setGasUrl] = useState<string>(getSavedGasUrl());
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isGasPanelExpanded, setIsGasPanelExpanded] = useState(false); // Collapsed by default as requested
  const [gasSyncStatus, setGasSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [gasSyncMsg, setGasSyncMsg] = useState<string>('');

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // External / other device update state
  const [hasExternalUpdate, setHasExternalUpdate] = useState<boolean>(false);
  const lastLocalEditTimestampRef = useRef<number>(0);
  const lastLoadedDateRef = useRef<string>(selectedDate);

  // Unique client session ID to distinguish this device/tab from other devices
  const clientIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? (() => {
          let id = sessionStorage.getItem('handbook_client_id');
          if (!id) {
            id = 'client_' + Math.random().toString(36).slice(2, 9);
            sessionStorage.setItem('handbook_client_id', id);
          }
          return id;
        })()
      : 'client_default'
  );

  // Track which input this local user currently has focused
  const activeFocusFieldRef = useRef<string | null>(null);

  // Active remote typing state
  const [remoteTyping, setRemoteTyping] = useState<{ field: string; time: number } | null>(null);

  // Force re-render periodically so that remote typing badges naturally fade out after 4.5 seconds
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // References to textareas for automatic height adjustment
  const chineseRef = useRef<HTMLTextAreaElement | null>(null);
  const mathRef = useRef<HTMLTextAreaElement | null>(null);
  const englishRef = useRef<HTMLTextAreaElement | null>(null);
  const gsRef = useRef<HTMLTextAreaElement | null>(null);
  const otherRef = useRef<HTMLTextAreaElement | null>(null);
  const memosRef = useRef<HTMLTextAreaElement | null>(null);
  const dutyRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper to auto-resize textarea based on its contents
  const autoResizeTextarea = (el: HTMLTextAreaElement | null, minH: number = 58) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(minH, el.scrollHeight)}px`;
  };

  const autoResizeAll = () => {
    autoResizeTextarea(chineseRef.current, 58);
    autoResizeTextarea(mathRef.current, 58);
    autoResizeTextarea(englishRef.current, 58);
    autoResizeTextarea(gsRef.current, 58);
    autoResizeTextarea(otherRef.current, 58);
    autoResizeTextarea(memosRef.current, 100);
    autoResizeTextarea(dutyRef.current, 48);
  };

  // Parse date details
  const [y, m, d] = selectedDate.split('-');
  const monthNum = parseInt(m, 10);
  const dayNum = parseInt(d, 10);
  const dateObj = new Date(parseInt(y, 10), monthNum - 1, dayNum);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekdayStr = weekdays[dateObj.getDay()];
  const dayInfo = getCalendarDayInfo(selectedDate);

  // Sync incoming props to local state when date changes, or when live cloud data arrives
  useEffect(() => {
    // 1. DATE NAVIGATION: User changed date
    if (selectedDate !== lastLoadedDateRef.current) {
      lastLoadedDateRef.current = selectedDate;
      lastLocalEditTimestampRef.current = 0;
      setRemoteTyping(null);
      setHasExternalUpdate(false);
      setUndoStack([]);

      setChinese(entry?.chinese || '');
      setMath(entry?.math || '');
      setEnglish(entry?.english || '');
      setGs(entry?.generalStudies || '');
      setOther(entry?.other || '');
      setDuty(entry?.duty || '');
      setMemos(entry?.notes || '');
      return;
    }

    // 2. SAME DATE: Incoming cloud data (Firestore onSnapshot or external update)
    if (entry) {
      // Check if remote client is actively typing
      if (
        entry.activeEditor &&
        entry.activeEditor.editorId !== clientIdRef.current &&
        Date.now() - entry.activeEditor.timestamp < 5000
      ) {
        setRemoteTyping({
          field: entry.activeEditor.field,
          time: entry.activeEditor.timestamp,
        });
      }

      // Synchronize all fields that this local user is NOT actively typing into right now!
      const curFocus = activeFocusFieldRef.current;
      if (curFocus !== 'chinese') setChinese(entry.chinese || '');
      if (curFocus !== 'math') setMath(entry.math || '');
      if (curFocus !== 'english') setEnglish(entry.english || '');
      if (curFocus !== 'generalStudies') setGs(entry.generalStudies || '');
      if (curFocus !== 'other') setOther(entry.other || '');
      if (curFocus !== 'duty') setDuty(entry.duty || '');
      if (curFocus !== 'memos' && curFocus !== 'notes') setMemos(entry.notes || '');
    }
  }, [entry, selectedDate]);

  // Instant cross-tab live typing sync via BroadcastChannel (0ms delay)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('handbook_live_typing_sync');
      bc.onmessage = (event) => {
        const data = event.data;
        if (!data || data.date !== selectedDate || data.editorId === clientIdRef.current) return;
        setRemoteTyping({
          field: data.field,
          time: Date.now(),
        });

        const curFocus = activeFocusFieldRef.current;
        if (data.field === 'chinese' && curFocus !== 'chinese') setChinese(data.value || '');
        if (data.field === 'math' && curFocus !== 'math') setMath(data.value || '');
        if (data.field === 'english' && curFocus !== 'english') setEnglish(data.value || '');
        if (data.field === 'generalStudies' && curFocus !== 'generalStudies') setGs(data.value || '');
        if (data.field === 'other' && curFocus !== 'other') setOther(data.value || '');
        if (data.field === 'duty' && curFocus !== 'duty') setDuty(data.value || '');
        if (data.field === 'notes' && curFocus !== 'memos' && curFocus !== 'notes') setMemos(data.value || '');
      };
    } catch {}

    return () => {
      try {
        bc?.close();
      } catch {}
    };
  }, [selectedDate]);

  const handleRefreshContent = () => {
    setHasExternalUpdate(false);
    lastLocalEditTimestampRef.current = 0;
    if (entry) {
      setChinese(entry.chinese || '');
      setMath(entry.math || '');
      setEnglish(entry.english || '');
      setGs(entry.generalStudies || '');
      setOther(entry.other || '');
      setDuty(entry.duty || '');
      setMemos(entry.notes || '');
    }
    showToast('已更新為最新手冊內容！');
  };

  // Adjust height on state update
  useEffect(() => {
    autoResizeAll();
  }, [chinese, math, english, gs, other, duty, memos, selectedDate]);

  // Initial auto-sync to user's Google Sheet if entry has data
  const hasInitialSyncedRef = useRef(false);
  useEffect(() => {
    if (!hasInitialSyncedRef.current && entry && (entry.math || entry.chinese || entry.english || entry.notes)) {
      hasInitialSyncedRef.current = true;
      triggerGasSync(entry);
    }
  }, [entry, gasUrl]);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Push current state to undo history before making mutations
  const pushUndoSnapshot = () => {
    const snapshot: FormSnapshot = {
      chinese,
      math,
      english,
      gs,
      other,
      duty,
      memos
    };
    setUndoStack((prev) => [...prev.slice(-24), snapshot]);
  };

  // Perform Undo operation
  const handleUndo = () => {
    if (undoStack.length === 0) {
      showToast('目前沒有可撤回的步驟');
      return;
    }

    const previousSnapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setChinese(previousSnapshot.chinese);
    setMath(previousSnapshot.math);
    setEnglish(previousSnapshot.english);
    setGs(previousSnapshot.gs);
    setOther(previousSnapshot.other);
    setDuty(previousSnapshot.duty);
    setMemos(previousSnapshot.memos);

    const revertedEntry: DailyEntry = {
      id: `${ACADEMIC_YEAR}_${classId}_${selectedDate}`,
      date: selectedDate,
      weekNumber: dayInfo.weekNumber,
      dayOfWeek: dateObj.getDay(),
      classId,
      chinese: previousSnapshot.chinese,
      math: previousSnapshot.math,
      english: previousSnapshot.english,
      generalStudies: previousSnapshot.gs,
      other: previousSnapshot.other,
      duty: previousSnapshot.duty,
      notes: previousSnapshot.memos,
    };

    onEntryChange(revertedEntry);
    showToast('已撤回上一步更改！');

    // Trigger GAS sync with reverted state
    if (gasUrl && gasUrl.trim().startsWith('http')) {
      triggerGasSync(revertedEntry);
    }
  };

  // Keyboard shortcut for Undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undoStack]);

  const broadcastTyping = (field: string, val: string) => {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      const bc = new BroadcastChannel('handbook_live_typing_sync');
      bc.postMessage({
        date: selectedDate,
        field,
        value: val,
        editorId: clientIdRef.current,
        timestamp: Date.now(),
      });
      bc.close();
    } catch {}
  };

  const isFieldBeingEditedRemotely = (fieldName: string) => {
    if (remoteTyping && remoteTyping.field === fieldName && Date.now() - remoteTyping.time < 4500) {
      return true;
    }
    const editor = entry?.activeEditor;
    if (
      editor &&
      editor.editorId !== clientIdRef.current &&
      editor.field === fieldName &&
      Date.now() - editor.timestamp < 4500
    ) {
      return true;
    }
    return false;
  };

  const getSubjectTitle = (f: string) => {
    switch (f) {
      case 'chinese': return '中文科';
      case 'math': return '數學科';
      case 'english': return '英文科';
      case 'generalStudies': return '常識科';
      case 'other': return '其他/通告';
      case 'duty': return '值日生';
      case 'notes':
      case 'memos': return '測考備忘通知';
      default: return '家課項目';
    }
  };

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notifyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const notifyChange = (updated: Partial<DailyEntry> & { notes?: string }, fieldName?: string) => {
    lastLocalEditTimestampRef.current = Date.now();

    // 1. Broadcast immediately across open browser tabs for 0ms lag
    if (fieldName) {
      const val = (updated as any)[fieldName] ?? (fieldName === 'notes' ? updated.notes : '');
      broadcastTyping(fieldName, String(val ?? ''));
    }

    if (notifyDebounceRef.current) {
      clearTimeout(notifyDebounceRef.current);
    }

    notifyDebounceRef.current = setTimeout(() => {
      const newEntry: DailyEntry = {
        id: `${ACADEMIC_YEAR}_${classId}_${selectedDate}`,
        date: selectedDate,
        weekNumber: dayInfo.weekNumber,
        dayOfWeek: dateObj.getDay(),
        classId,
        chinese: updated.chinese !== undefined ? updated.chinese : chinese,
        math: updated.math !== undefined ? updated.math : math,
        english: updated.english !== undefined ? updated.english : english,
        generalStudies: updated.generalStudies !== undefined ? updated.generalStudies : gs,
        other: updated.other !== undefined ? updated.other : other,
        duty: updated.duty !== undefined ? updated.duty : duty,
        notes: updated.notes !== undefined ? updated.notes : memos,
        activeEditor: fieldName
          ? {
              field: fieldName,
              editorId: clientIdRef.current,
              editorName: '老師',
              timestamp: Date.now(),
            }
          : undefined,
      };

      onEntryChange(newEntry);

      // Auto-sync to Google Apps Script Web App if URL configured
      if (gasUrl && gasUrl.trim().startsWith('http')) {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          triggerGasSync(newEntry);
        }, 1200);
      }
    }, 180);
  };

  // Push to Google Apps Script Web App
  const triggerGasSync = async (currentEntry: DailyEntry) => {
    const currentGasUrl = gasUrl || getSavedGasUrl();
    if (!currentGasUrl || !currentGasUrl.trim().startsWith('http')) return;

    try {
      setGasSyncStatus('syncing');
      setGasSyncMsg('正在同步至 Google Sheet...');
      await syncEntryToGasWebApp(currentGasUrl, {
        date: currentEntry.date,
        weekNumber: dayInfo.weekNumber,
        dayOfWeek: `星期${weekdayStr}`,
        statusDesc: dayInfo.title || '正常教學日',
        chinese: currentEntry.chinese || '',
        math: currentEntry.math || '',
        english: currentEntry.english || '',
        generalStudies: currentEntry.generalStudies || '',
        other: currentEntry.other || '',
        duty: currentEntry.duty || duty,
        notes: currentEntry.notes || memos
      });
      setGasSyncStatus('synced');
      setGasSyncMsg('已同步至 Google Sheet');
    } catch (err: any) {
      console.error('GAS sync error', err);
      setGasSyncStatus('error');
      setGasSyncMsg('同步失敗：請檢查 Web App 網址');
    }
  };

  // Quick append text to targeted field
  const handleQuickAppend = (tag: { label: string; text: string; defaultField?: SubjectKey | 'duty' | 'memos' }) => {
    // If the tag belongs specifically to duty and user hasn't explicitly chosen another, target duty
    const targetField = tag.defaultField && (activeFieldName === 'chinese' && tag.defaultField === 'duty')
      ? 'duty'
      : activeFieldName;

    const bulletText = targetField === 'duty' ? tag.text : `• ${tag.text}`;

    if (targetField === 'chinese') {
      const updated = chinese ? `${chinese}\n${bulletText}` : bulletText;
      setChinese(updated);
      notifyChange({ chinese: updated }, 'chinese');
    } else if (targetField === 'math') {
      const updated = math ? `${math}\n${bulletText}` : bulletText;
      setMath(updated);
      notifyChange({ math: updated }, 'math');
    } else if (targetField === 'english') {
      const updated = english ? `${english}\n${bulletText}` : bulletText;
      setEnglish(updated);
      notifyChange({ english: updated }, 'english');
    } else if (targetField === 'generalStudies') {
      const updated = gs ? `${gs}\n${bulletText}` : bulletText;
      setGs(updated);
      notifyChange({ generalStudies: updated }, 'generalStudies');
    } else if (targetField === 'other') {
      const updated = other ? `${other}\n${bulletText}` : bulletText;
      setOther(updated);
      notifyChange({ other: updated }, 'other');
    } else if (targetField === 'duty') {
      const updated = duty ? `${duty}、${tag.text}` : tag.text;
      setDuty(updated);
      notifyChange({ duty: updated }, 'duty');
    } else if (targetField === 'memos') {
      const updated = memos ? `${memos}\n${bulletText}` : bulletText;
      setMemos(updated);
      notifyChange({ notes: updated }, 'notes');
    }
    showToast(`已插入「${tag.text}」`);
  };

  // Shift day (+1, -1)
  const shiftDay = (days: number) => {
    const cur = new Date(parseInt(y, 10), monthNum - 1, dayNum);
    cur.setDate(cur.getDate() + days);
    const nY = cur.getFullYear();
    const nM = String(cur.getMonth() + 1).padStart(2, '0');
    const nD = String(cur.getDate()).padStart(2, '0');
    onDateChange(`${nY}-${nM}-${nD}`);
  };

  // Jump to today (or 2026-09-01 default)
  const jumpToToday = () => {
    const now = new Date();
    const curY = now.getFullYear();
    if (curY === 2026 || curY === 2027) {
      const nY = now.getFullYear();
      const nM = String(now.getMonth() + 1).padStart(2, '0');
      const nD = String(now.getDate()).padStart(2, '0');
      onDateChange(`${nY}-${nM}-${nD}`);
    } else {
      onDateChange('2026-09-01');
    }
  };

  // Navigate only between school teaching days
  const navigateSchoolDay = (direction: number) => {
    const cur = new Date(parseInt(y, 10), monthNum - 1, dayNum);
    for (let i = 0; i < 60; i++) {
      cur.setDate(cur.getDate() + direction);
      const nY = cur.getFullYear();
      const nM = String(cur.getMonth() + 1).padStart(2, '0');
      const nD = String(cur.getDate()).padStart(2, '0');
      const iso = `${nY}-${nM}-${nD}`;
      const info = getCalendarDayInfo(iso);
      if (info.isTeachingDay && info.dayType !== 'holiday' && info.dayType !== 'weekend') {
        onDateChange(iso);
        return;
      }
    }
  };

  // Copy yesterday's memos
  const copyPreviousDayMemo = () => {
    const cur = new Date(parseInt(y, 10), monthNum - 1, dayNum);
    cur.setDate(cur.getDate() - 1);
    const nY = cur.getFullYear();
    const nM = String(cur.getMonth() + 1).padStart(2, '0');
    const nD = String(cur.getDate()).padStart(2, '0');
    const prevDate = `${nY}-${nM}-${nD}`;
    const prevCached = localStorage.getItem(`handbook_entry_${ACADEMIC_YEAR}_${classId}_${prevDate}`);
    if (prevCached) {
      try {
        const parsed = JSON.parse(prevCached);
        if (parsed.notes) {
          pushUndoSnapshot();
          setMemos(parsed.notes);
          notifyChange({ notes: parsed.notes });
          showToast('已複製昨日測驗備忘！');
          return;
        }
      } catch {}
    }
    showToast('昨日暫無測考備忘紀錄');
  };

  // Clear current day
  const clearCurrentDiary = () => {
    const confirmed = window.confirm('確定要清空今日登記的家課內容嗎？');
    if (!confirmed) return;
    pushUndoSnapshot();
    setChinese('');
    setMath('');
    setEnglish('');
    setGs('');
    setOther('');
    setDuty('');
    setMemos('');
    notifyChange({
      chinese: '',
      math: '',
      english: '',
      generalStudies: '',
      other: '',
      duty: '',
      notes: ''
    });
    showToast('已清空今日內容（可按撤回鍵復原）');
  };

  // Filter tags by selected category
  const filteredTags = selectedSnippetCategory === 'all'
    ? TEMPLATE_TAGS
    : TEMPLATE_TAGS.filter((t) => t.category === selectedSnippetCategory);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-5">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* LEFT CONTROL PANEL */}
      <aside className="w-full md:w-80 flex flex-col gap-4 no-print shrink-0">
        {/* Date Navigation Box */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">日期導覽</span>
            <button
              onClick={jumpToToday}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 今日
            </button>
          </div>

          {/* Date Input */}
          <div className="mb-3">
            <input
              type="date"
              value={selectedDate}
              min="2026-09-01"
              max="2027-07-31"
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Prev / Next */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => shiftDay(-1)}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> 前一日
            </button>
            <button
              onClick={() => shiftDay(1)}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
            >
              下一日 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Prev / Next School Day Only */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigateSchoolDay(-1)}
              className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
              title="自動跳過週末與公眾假期"
            >
              <SkipBack className="w-3.5 h-3.5" /> 上一個上學日
            </button>
            <button
              onClick={() => navigateSchoolDay(1)}
              className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
              title="自動跳過週末與公眾假期"
            >
              下一個上學日 <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* School Day Card Status */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                dayInfo.dayType === 'holiday'
                  ? 'bg-red-100 text-red-700'
                  : dayInfo.dayType === 'exam'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {dayInfo.dayType === 'holiday'
                ? '放假日 / 非上學日'
                : dayInfo.dayType === 'exam'
                ? '測驗 / 考試期間'
                : '正式上學日'}
            </span>
            <span className="text-xs text-slate-500 font-medium">第 {dayInfo.weekNumber} 週</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {y}年{monthNum}月{dayNum}日 (星期{weekdayStr})
          </h3>
          <p className="text-xs text-slate-600 mt-1 min-h-[1.5rem]">
            {dayInfo.title || (dayInfo.dayType === 'weekend' ? '週六日假期' : '正常上學日')}
          </p>
        </div>

        {/* Quick Text Templates - Rich Content with Categories */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-700">
              常用登記詞條快捷點擊
            </span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              目標：
              {activeFieldName === 'chinese'
                ? '中文'
                : activeFieldName === 'math'
                ? '數學'
                : activeFieldName === 'english'
                ? '英文'
                : activeFieldName === 'generalStudies'
                ? '常識'
                : activeFieldName === 'other'
                ? '其他'
                : activeFieldName === 'duty'
                ? '值日'
                : '備忘'}
            </span>
          </div>

          {/* Quick Target Field Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] text-slate-400 shrink-0">插入至:</span>
            {[
              { key: 'chinese', label: '中文' },
              { key: 'math', label: '數學' },
              { key: 'english', label: '英文' },
              { key: 'generalStudies', label: '常識' },
              { key: 'other', label: '其他' },
              { key: 'memos', label: '備忘' },
              { key: 'duty', label: '值日' },
            ].map((target) => (
              <button
                key={target.key}
                type="button"
                onClick={() => setActiveFieldName(target.key as any)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeFieldName === target.key
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {target.label}
              </button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] border-b border-slate-100">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSnippetCategory(cat.id)}
                className={`px-2 py-0.5 rounded-full transition cursor-pointer shrink-0 font-medium ${
                  selectedSnippetCategory === cat.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Abundant Quick Snippet Pills */}
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredTags.map((tag, idx) => (
              <button
                key={`${tag.category}_${tag.label}_${idx}`}
                type="button"
                onClick={() => handleQuickAppend(tag)}
                className="text-xs bg-slate-50 hover:bg-emerald-100 hover:text-emerald-900 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 transition cursor-pointer text-left flex items-center gap-1 active:scale-95"
                title={`點擊插入：「${tag.text}」`}
              >
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions (with Undo button) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-2">
          {/* UNDO BUTTON */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="撤回上一步更改 (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-700" />
            <span>撤 回 (Undo)</span>
            {undoStack.length > 0 && (
              <span className="bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {undoStack.length}
              </span>
            )}
          </button>

          <button
            onClick={copyPreviousDayMemo}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> 複製昨日測驗備忘
          </button>

          <button
            onClick={clearCurrentDiary}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> 清空今日內容
          </button>
        </div>

        {/* GOOGLE SHEET APPS SCRIPT SYNC PANEL - COLLAPSIBLE COMPACT BUTTON */}
        <div className="bg-white rounded-2xl shadow-xs border border-emerald-200 overflow-hidden">
          {/* Compact Button Header: Click to toggle details */}
          <button
            type="button"
            onClick={() => setIsGasPanelExpanded(!isGasPanelExpanded)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/60 transition cursor-pointer text-left"
            title="點擊展開或收起 Google Sheet 同步設定"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">Google Sheet 雲端同步</span>
                  {gasSyncStatus === 'syncing' ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> 同步中
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 已同步
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">點擊展開詳細設定與手動更新</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isGasPanelExpanded ? 'rotate-180 text-emerald-700' : ''
              }`}
            />
          </button>

          {/* Expanded content: only shown when user clicks the button */}
          {isGasPanelExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-emerald-100 space-y-3 bg-emerald-50/20">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                已連線您的 Google 試算表，輸入或修改家課時會<strong>自動即時同步</strong>寫入試算表。
              </p>

              <button
                onClick={() => setIsGasModalOpen(true)}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-700" />
                查看 Web App 網址與部署設定
              </button>

              {onReloadFromGas && gasUrl && (
                <button
                  onClick={onReloadFromGas}
                  disabled={isGasLoading}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="從 Google Sheet 載入全部手冊內容"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGasLoading ? '正在讀取 Google Sheet...' : '📥 從 Google Sheet 載入全部手冊'}</span>
                </button>
              )}

              {gasUrl && (
                <button
                  onClick={() => {
                    triggerGasSync({
                      id: `${ACADEMIC_YEAR}_${classId}_${selectedDate}`,
                      date: selectedDate,
                      weekNumber: dayInfo.weekNumber,
                      dayOfWeek: dateObj.getDay(),
                      classId,
                      chinese,
                      math,
                      english,
                      generalStudies: gs,
                      other,
                      duty,
                      notes: memos,
                    });
                    showToast('已手動同步當前手冊至 Google Sheet！');
                  }}
                  className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> 立即更新至 Google Sheet
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT MAIN SECTION: THE PHYSICAL DIARY REPLICA */}
      <section className="flex-1">
        <div className="bg-[#faf7f2] rounded-2xl shadow-lg border-2 border-amber-900/20 paper-texture p-4 sm:p-7 relative print-full">
          {/* Red notebook margin line on left */}
          <div className="absolute top-0 bottom-0 left-12 md:left-24 border-r border-red-300 opacity-60 pointer-events-none hidden sm:block"></div>

          {/* Real-time remote typing notification banner */}
          {remoteTyping && Date.now() - remoteTyping.time < 5000 && (
            <div className="mb-4 px-4 py-2.5 bg-emerald-100 border-2 border-emerald-400 text-emerald-950 rounded-2xl shadow-sm flex items-center justify-between gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                </span>
                <span className="text-xs sm:text-sm font-bold">
                  ✍️ 其他設備正在即時輸入【{getSubjectTitle(remoteTyping.field)}】... 畫面已為您即時同步顯示！
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                即時同步中
              </span>
            </div>
          )}

          {/* Remote / other device update notification inside Daily view */}
          {hasExternalUpdate && (
            <div className="mb-4 p-3.5 bg-amber-500 text-amber-950 rounded-2xl shadow-md border-2 border-amber-400 flex flex-wrap items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-950 shrink-0" />
                <div>
                  <p className="font-bold text-sm sm:text-base text-amber-950">
                    內容有更新，或其他設備更改了內容
                  </p>
                  <p className="text-xs text-amber-900 font-medium">
                    請刷新版面以載入最新修改內容
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefreshContent}
                className="px-4 py-1.5 bg-white text-amber-950 font-extrabold text-xs sm:text-sm rounded-xl hover:bg-amber-50 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                請刷新版面
              </button>
            </div>
          )}

          {/* School Diary Title & Date Banner */}
          <div className="text-center mb-5 pb-3 border-b-2 border-amber-900/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-bold tracking-widest text-slate-800 font-serif">
                家 課 登 記 欄
              </h2>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 font-semibold mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>雲端多設備即時連線中 • 當其他設備輸入時畫面會即時同步顯示</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between text-sm sm:text-base px-2 font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-0.5 rounded text-xs sm:text-sm font-bold">
                  {monthNum} 月
                </span>
                <span className="bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-0.5 rounded text-xs sm:text-sm font-bold">
                  {dayNum} 日
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs sm:text-sm mr-1">星期</span>
                <span className="font-bold text-amber-950 text-base sm:text-lg">{weekdayStr}</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-500">
                第 <span className="font-bold text-slate-800">{dayInfo.weekNumber}</span> 週
              </div>
            </div>
          </div>

          {/* Holiday Warning Banner (If applicable) */}
          {dayInfo.dayType === 'holiday' && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  校曆提示：本日為 <strong>{dayInfo.title}</strong>，無須上課。
                </span>
              </div>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                非上學日
              </span>
            </div>
          )}

          {/* Homework Table with Automatic Expanding Row Height & Live Synchronization */}
          <div className="border-2 border-slate-700 rounded-lg overflow-hidden bg-white shadow-xs">
            {/* 中文 Chinese */}
            <div className={`flex border-b border-slate-400 min-h-[58px] items-stretch transition-colors ${
              isFieldBeingEditedRemotely('chinese') ? 'bg-emerald-50/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-slate-50 border-r border-slate-400 flex flex-col items-center justify-center font-bold text-slate-700 text-sm sm:text-base shrink-0 select-none font-serif py-2 relative">
                <span>中 文</span>
                {isFieldBeingEditedRemotely('chinese') && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {isFieldBeingEditedRemotely('chinese') && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={chineseRef}
                  value={chinese}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'chinese';
                    setActiveFieldName('chinese');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'chinese') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 58)}
                  onChange={(e) => {
                    setChinese(e.target.value);
                    notifyChange({ chinese: e.target.value }, 'chinese');
                  }}
                  placeholder=""
                  rows={2}
                  className={`w-full p-2.5 text-sm sm:text-base focus:bg-amber-50/40 focus:outline-none resize-none font-sans text-slate-800 leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('chinese')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>

            {/* 數學 Math */}
            <div className={`flex border-b border-slate-400 min-h-[58px] items-stretch transition-colors ${
              isFieldBeingEditedRemotely('math') ? 'bg-emerald-50/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-slate-50 border-r border-slate-400 flex flex-col items-center justify-center font-bold text-slate-700 text-sm sm:text-base shrink-0 select-none font-serif py-2 relative">
                <span>數 學</span>
                {isFieldBeingEditedRemotely('math') && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {isFieldBeingEditedRemotely('math') && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={mathRef}
                  value={math}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'math';
                    setActiveFieldName('math');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'math') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 58)}
                  onChange={(e) => {
                    setMath(e.target.value);
                    notifyChange({ math: e.target.value }, 'math');
                  }}
                  placeholder=""
                  rows={2}
                  className={`w-full p-2.5 text-sm sm:text-base focus:bg-amber-50/40 focus:outline-none resize-none font-sans text-slate-800 leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('math')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>

            {/* 英文 English */}
            <div className={`flex border-b border-slate-400 min-h-[58px] items-stretch transition-colors ${
              isFieldBeingEditedRemotely('english') ? 'bg-emerald-50/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-slate-50 border-r border-slate-400 flex flex-col items-center justify-center font-bold text-slate-700 text-sm sm:text-base shrink-0 select-none font-serif py-2 relative">
                <span>英 文</span>
                {isFieldBeingEditedRemotely('english') && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {isFieldBeingEditedRemotely('english') && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={englishRef}
                  value={english}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'english';
                    setActiveFieldName('english');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'english') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 58)}
                  onChange={(e) => {
                    setEnglish(e.target.value);
                    notifyChange({ english: e.target.value }, 'english');
                  }}
                  placeholder=""
                  rows={2}
                  className={`w-full p-2.5 text-sm sm:text-base focus:bg-amber-50/40 focus:outline-none resize-none font-sans text-slate-800 leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('english')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>

            {/* 常識 General Studies */}
            <div className={`flex border-b border-slate-400 min-h-[58px] items-stretch transition-colors ${
              isFieldBeingEditedRemotely('generalStudies') ? 'bg-emerald-50/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-slate-50 border-r border-slate-400 flex flex-col items-center justify-center font-bold text-slate-700 text-sm sm:text-base shrink-0 select-none font-serif py-2 relative">
                <span>常 識</span>
                {isFieldBeingEditedRemotely('generalStudies') && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {isFieldBeingEditedRemotely('generalStudies') && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={gsRef}
                  value={gs}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'generalStudies';
                    setActiveFieldName('generalStudies');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'generalStudies') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 58)}
                  onChange={(e) => {
                    setGs(e.target.value);
                    notifyChange({ generalStudies: e.target.value }, 'generalStudies');
                  }}
                  placeholder=""
                  rows={2}
                  className={`w-full p-2.5 text-sm sm:text-base focus:bg-amber-50/40 focus:outline-none resize-none font-sans text-slate-800 leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('generalStudies')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>

            {/* 其他 Others */}
            <div className={`flex border-b border-slate-400 min-h-[58px] items-stretch transition-colors ${
              isFieldBeingEditedRemotely('other') ? 'bg-emerald-50/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-slate-50 border-r border-slate-400 flex flex-col items-center justify-center font-bold text-slate-700 text-sm sm:text-base shrink-0 select-none font-serif py-2 relative">
                <span>其 他</span>
                {isFieldBeingEditedRemotely('other') && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {isFieldBeingEditedRemotely('other') && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={otherRef}
                  value={other}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'other';
                    setActiveFieldName('other');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'other') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 58)}
                  onChange={(e) => {
                    setOther(e.target.value);
                    notifyChange({ other: e.target.value }, 'other');
                  }}
                  placeholder=""
                  rows={2}
                  className={`w-full p-2.5 text-sm sm:text-base focus:bg-amber-50/40 focus:outline-none resize-none font-sans text-slate-800 leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('other')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>

            {/* 測驗 / 默書 備忘通知 (Test/Exam Memo) */}
            <div className={`flex border-b border-slate-400 min-h-[100px] bg-amber-50/20 items-stretch transition-colors ${
              isFieldBeingEditedRemotely('notes') || isFieldBeingEditedRemotely('memos') ? 'bg-emerald-50/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-amber-50/70 border-r border-slate-400 flex flex-col items-center justify-center text-center p-1 text-xs sm:text-sm font-bold text-amber-900 shrink-0 select-none font-serif py-3 relative">
                <span>測驗 / 默書</span>
                <span>備忘通知</span>
                <span className="text-[10px] font-normal text-amber-700 mt-1">(下週/近日)</span>
                {(isFieldBeingEditedRemotely('notes') || isFieldBeingEditedRemotely('memos')) && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {(isFieldBeingEditedRemotely('notes') || isFieldBeingEditedRemotely('memos')) && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={memosRef}
                  value={memos}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'memos';
                    setActiveFieldName('memos');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'memos') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 100)}
                  onChange={(e) => {
                    setMemos(e.target.value);
                    notifyChange({ notes: e.target.value }, 'notes');
                  }}
                  placeholder=""
                  rows={4}
                  className={`w-full p-2.5 text-sm sm:text-base text-blue-900 focus:bg-amber-50/50 focus:outline-none resize-none leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('notes') || isFieldBeingEditedRemotely('memos')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>

            {/* 值日 Duty - Placed UNDERNEATH 測驗/默書備忘通知 as explicitly requested */}
            <div className={`flex min-h-[48px] items-stretch bg-emerald-50/20 transition-colors ${
              isFieldBeingEditedRemotely('duty') ? 'bg-emerald-100/40' : ''
            }`}>
              <div className="w-16 sm:w-24 bg-slate-50/90 border-r border-slate-400 flex flex-col items-center justify-center font-bold text-emerald-950 text-sm sm:text-base shrink-0 select-none font-serif py-2 relative">
                <span>值 日</span>
                {isFieldBeingEditedRemotely('duty') && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-bold bg-emerald-600 text-white animate-pulse shadow-xs flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    輸入中
                  </span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {isFieldBeingEditedRemotely('duty') && (
                  <div className="absolute top-1 right-2 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 animate-pulse shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>正在即時同步顯示其他設備的輸入...</span>
                  </div>
                )}
                <textarea
                  ref={dutyRef}
                  value={duty}
                  onFocus={() => {
                    activeFocusFieldRef.current = 'duty';
                    setActiveFieldName('duty');
                    pushUndoSnapshot();
                  }}
                  onBlur={() => {
                    if (activeFocusFieldRef.current === 'duty') {
                      activeFocusFieldRef.current = null;
                    }
                  }}
                  onInput={(e) => autoResizeTextarea(e.currentTarget, 48)}
                  onChange={(e) => {
                    setDuty(e.target.value);
                    notifyChange({ duty: e.target.value }, 'duty');
                  }}
                  placeholder=""
                  rows={1}
                  className={`w-full p-2.5 text-xs sm:text-sm focus:bg-amber-50/40 focus:outline-none resize-none font-sans text-slate-800 leading-relaxed overflow-hidden transition-all ${
                    isFieldBeingEditedRemotely('duty')
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20'
                      : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Apps Script Modal */}
      <GoogleAppsScriptModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onUrlUpdated={(url) => {
          setGasUrl(url);
          showToast('Google Sheet Web App 網址已設定！');
        }}
      />
    </div>
  );
};
