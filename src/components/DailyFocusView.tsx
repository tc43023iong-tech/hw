import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  PenTool,
  AlertCircle
} from 'lucide-react';
import { DailyEntry, HandbookWeek, SubjectKey } from '../types/handbook';
import { getCalendarDayInfo, SCHOOL_NAME } from '../data/calendar2026_2027';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  entry: DailyEntry | undefined;
  handbookWeek: HandbookWeek | null;
  className: string;
  onDateChange: (dateStr: string) => void;
  onFieldChange: (field: SubjectKey, val: string) => void;
  onBackToWeekView: () => void;
}

const SUBJECTS: { key: SubjectKey; label: string; en: string; iconBg: string; badgeColor: string }[] = [
  { key: 'chinese', label: '中文', en: 'Chinese', iconBg: 'bg-amber-100 text-amber-800', badgeColor: 'border-amber-300 bg-amber-50' },
  { key: 'math', label: '數學', en: 'Mathematics', iconBg: 'bg-blue-100 text-blue-800', badgeColor: 'border-blue-300 bg-blue-50' },
  { key: 'english', label: '英文', en: 'English', iconBg: 'bg-emerald-100 text-emerald-800', badgeColor: 'border-emerald-300 bg-emerald-50' },
  { key: 'generalStudies', label: '常識', en: 'General Studies', iconBg: 'bg-purple-100 text-purple-800', badgeColor: 'border-purple-300 bg-purple-50' },
  { key: 'other', label: '其他', en: 'Others', iconBg: 'bg-rose-100 text-rose-800', badgeColor: 'border-rose-300 bg-rose-50' },
];

export const DailyFocusView: React.FC<Props> = ({
  selectedDate,
  entry,
  handbookWeek,
  className,
  onDateChange,
  onFieldChange,
  onBackToWeekView,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dayInfo = getCalendarDayInfo(selectedDate);
  const [y, m, d] = selectedDate.split('-');
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dayOfWeekStr = `星期${weekDays[dateObj.getDay()]}`;

  // Next / Previous day navigator
  const navigateDay = (offset: number) => {
    const next = new Date(dateObj);
    next.setDate(next.getDate() + offset);
    const nY = next.getFullYear();
    const nM = String(next.getMonth() + 1).padStart(2, '0');
    const nD = String(next.getDate()).padStart(2, '0');
    onDateChange(`${nY}-${nM}-${nD}`);
  };

  // Copy full homework formatted for WeChat / WhatsApp parents group
  const handleCopySummary = () => {
    const lines = [
      `【${SCHOOL_NAME}】${className} 每日家課手冊`,
      `📅 日期：${parseInt(m, 10)}月${parseInt(d, 10)}日 (${dayOfWeekStr}) 第${dayInfo.weekNumber}週`,
      '--------------------------------',
      `【中文】${entry?.chinese?.trim() || '無'}`,
      `【數學】${entry?.math?.trim() || '無'}`,
      `【英文】${entry?.english?.trim() || '無'}`,
      `【常識】${entry?.generalStudies?.trim() || '無'}`,
      `【其他】${entry?.other?.trim() || '無'}`,
    ];

    if (handbookWeek?.examRemarks?.trim()) {
      lines.push('--------------------------------');
      lines.push(`★ 本週測考備忘：\n${handbookWeek.examRemarks.trim()}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textClasses = {
    normal: 'text-sm md:text-base',
    large: 'text-base md:text-xl',
    huge: 'text-lg md:text-2xl font-semibold',
  }[fontSizeLevel];

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-stone-100 p-6 overflow-y-auto' : ''}`}>
      {/* Top action toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToWeekView}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> 返回雙頁手冊
          </button>

          <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
            <button
              onClick={() => navigateDay(-1)}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 transition-colors"
              title="前一天"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-0.5 text-center">
              <span className="font-bold text-stone-900 text-sm md:text-base">
                {parseInt(m, 10)}月{parseInt(d, 10)}日 {dayOfWeekStr}
              </span>
              <span className="text-xs text-stone-500 block">第 {dayInfo.weekNumber} 週</span>
            </div>
            <button
              onClick={() => navigateDay(1)}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 transition-colors"
              title="後一天"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Font size & Display actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200 text-xs font-medium">
            <button
              onClick={() => setFontSizeLevel('normal')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                fontSizeLevel === 'normal' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
              }`}
            >
              標準
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                fontSizeLevel === 'large' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
              }`}
            >
              放大
            </button>
            <button
              onClick={() => setFontSizeLevel('huge')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                fontSizeLevel === 'huge' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
              }`}
            >
              特大
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? '已複製手冊內容' : '複製到家長群組'}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            title={isFullscreen ? '退出全螢幕' : '全螢幕課堂投影'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Single Day Presentation Blackboard Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border-2 border-red-700 relative overflow-hidden">
        {/* Top header strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-red-600 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-red-950 font-serif flex items-center gap-2">
              <span className="w-2.5 h-6 bg-red-700 rounded-xs inline-block"></span>
              {SCHOOL_NAME} • 今日家課登記
            </h1>
            <p className="text-xs md:text-sm text-stone-500 mt-0.5">
              {className} • {parseInt(m, 10)}月{parseInt(d, 10)}日 ({dayOfWeekStr}) • 第 {dayInfo.weekNumber} 週
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dayInfo.dayType === 'holiday' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                學校假期：{dayInfo.title}
              </span>
            ) : dayInfo.dayType === 'exam' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                測考日：{dayInfo.title}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                正常教學日
              </span>
            )}
          </div>
        </div>

        {/* Subject entries list */}
        <div className="mt-6 space-y-4">
          {SUBJECTS.map((sub, index) => {
            const val = entry?.[sub.key] || '';
            return (
              <div
                key={sub.key}
                className="flex flex-col md:flex-row md:items-start bg-stone-50/70 border border-red-200/80 rounded-2xl p-3 md:p-4 hover:border-red-400 transition-colors gap-3"
              >
                {/* Subject Header Badge */}
                <div className="w-full md:w-32 shrink-0 flex items-center justify-between md:justify-start gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${sub.badgeColor} border`}>
                    {sub.label}
                  </span>
                  <span className="text-[11px] text-stone-400 font-sans md:hidden">{sub.en}</span>
                </div>

                {/* Input / display area */}
                <div className="flex-1 w-full">
                  <textarea
                    rows={2}
                    value={val}
                    onChange={(e) => onFieldChange(sub.key, e.target.value)}
                    placeholder={`請登記今日${sub.label}家課...`}
                    className={`w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${textClasses} leading-relaxed`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Exam Remarks Card directly visible in daily focus! */}
        <div className="mt-8 border-2 border-red-500 rounded-2xl bg-red-50/40 p-4 md:p-5">
          <div className="flex items-center justify-between pb-2 border-b border-red-200">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm md:text-base font-serif">
              <PenTool className="w-4 h-4 text-red-700" />
              <span>本週測考備註 (全週兩頁共用)</span>
            </div>
            <span className="text-xs text-red-700 bg-red-100/70 px-2.5 py-0.5 rounded-full border border-red-200">
              第 {dayInfo.weekNumber} 週備註
            </span>
          </div>

          <div className="mt-3">
            {handbookWeek?.examRemarks?.trim() ? (
              <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-stone-800 bg-white p-3.5 rounded-xl border border-red-200 leading-relaxed">
                {handbookWeek.examRemarks}
              </pre>
            ) : (
              <p className="text-xs md:text-sm text-stone-400 italic bg-white/60 p-3 rounded-xl border border-dashed border-red-200">
                本週暫無特別測考備註，可於「雙頁手冊」右頁下方填寫測考日期與溫習範圍。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
