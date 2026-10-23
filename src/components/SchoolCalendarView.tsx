import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  BookOpen,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  generateAcademicCalendar,
  MAJOR_EVENTS,
  TOTAL_TEACHING_DAYS,
  SCHOOL_NAME,
  ACADEMIC_YEAR
} from '../data/calendar2026_2027';

interface Props {
  onSelectDateAndWeek: (dateStr: string, weekNum: number, term: 1 | 2) => void;
}

const MONTH_NAMES = [
  { num: 9, name: '2026年 9月', term: 1 },
  { num: 10, name: '2026年 10月', term: 1 },
  { num: 11, name: '2026年 11月 (期中考)', term: 1, highlight: true },
  { num: 12, name: '2026年 12月', term: 1 },
  { num: 1, name: '2027年 1月 (期末考)', term: 1, highlight: true },
  { num: 2, name: '2027年 2月 (春節)', term: 2 },
  { num: 3, name: '2027年 3月', term: 2 },
  { num: 4, name: '2027年 4月 (期中考)', term: 2, highlight: true },
  { num: 5, name: '2027年 5月', term: 2 },
  { num: 6, name: '2027年 6月 (畢業考/期末考)', term: 2, highlight: true },
  { num: 7, name: '2027年 7月 (結業禮)', term: 2 },
];

export const SchoolCalendarView: React.FC<Props> = ({ onSelectDateAndWeek }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // default to Oct 2026 or current
  const [filterType, setFilterType] = useState<'all' | 'teaching' | 'exam' | 'holiday'>('all');

  const allDays = generateAcademicCalendar();

  // Filter days for the selected month
  const monthDays = allDays.filter((d) => d.month === selectedMonth);

  // Group days by weekNumber
  const weeksMap: Record<number, typeof monthDays> = {};
  monthDays.forEach((d) => {
    if (!weeksMap[d.weekNumber]) weeksMap[d.weekNumber] = [];
    weeksMap[d.weekNumber].push(d);
  });

  const teachingDaysCount = allDays.filter((d) => d.isTeachingDay).length;
  const examDaysCount = allDays.filter((d) => d.isExamDay).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">官方核定總上學日數</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{TOTAL_TEACHING_DAYS} 天</p>
            <p className="text-[11px] text-stone-400">061校部 / 119校部</p>
          </div>
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">全學年測驗與考試日</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{examDaysCount} 天</p>
            <p className="text-[11px] text-stone-400">期中考、期末考、畢業考</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">重大測考週次</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">4 次大考</p>
            <p className="text-[11px] text-stone-400">11月、1月、4月、6月</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">手冊排版規則</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">1週2頁</p>
            <p className="text-[11px] text-stone-400">左(一至三) 右(四至五+測考備註)</p>
          </div>
          <div className="p-3 bg-stone-100 text-stone-700 rounded-xl">
            <Info className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Month Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-red-700" />
            <h2 className="text-base md:text-lg font-bold text-stone-900">
              {SCHOOL_NAME} {ACADEMIC_YEAR} 年度校曆查閱
            </h2>
          </div>
          <span className="text-xs text-stone-500">點選任何「上學日」即可直接編寫該日手冊</span>
        </div>

        {/* Month Buttons Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {MONTH_NAMES.map((m) => (
            <button
              key={m.num}
              onClick={() => setSelectedMonth(m.num)}
              className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                selectedMonth === m.num
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : m.highlight
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-stone-100">
          <span className="text-stone-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> 篩選顯示：
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            全部日子
          </button>
          <button
            onClick={() => setFilterType('teaching')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'teaching' ? 'bg-red-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            僅上學教學日 (需寫手冊)
          </button>
          <button
            onClick={() => setFilterType('exam')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'exam' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            測考日期 (高亮備註)
          </button>
          <button
            onClick={() => setFilterType('holiday')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'holiday' ? 'bg-rose-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            學校假期
          </button>
        </div>
      </div>

      {/* Calendar Days Table by Weeks */}
      <div className="space-y-4">
        {Object.entries(weeksMap).map(([weekNumStr, days]) => {
          const wNum = parseInt(weekNumStr, 10);
          const term = days[0]?.term || 1;

          // Filter days according to user selection
          const displayedDays = days.filter((d) => {
            if (filterType === 'teaching') return d.isTeachingDay;
            if (filterType === 'exam') return d.isExamDay;
            if (filterType === 'holiday') return d.dayType === 'holiday';
            return true;
          });

          if (displayedDays.length === 0) return null;

          return (
            <div key={wNum} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Week header */}
              <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-900 text-sm">第 {wNum} 週</span>
                  <span className="text-xs text-stone-500">
                    ({term === 1 ? '上學期' : '下學期'})
                  </span>
                </div>
                <button
                  onClick={() => onSelectDateAndWeek(days[0].date, wNum, term)}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  打開這週雙頁手冊 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                {displayedDays.map((d) => {
                  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
                  const isSun = d.dayOfWeek === 0;
                  const isSat = d.dayOfWeek === 6;

                  return (
                    <div
                      key={d.date}
                      className={`p-3.5 flex flex-col justify-between transition-colors ${
                        d.isExamDay
                          ? 'bg-emerald-50/70 border-b-2 border-emerald-500'
                          : d.dayType === 'holiday'
                          ? 'bg-rose-50/50'
                          : 'hover:bg-red-50/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-stone-900">
                            {d.month}月{d.day}日
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              isSun || isSat ? 'bg-stone-200 text-stone-600' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            週{dayNames[d.dayOfWeek]}
                          </span>
                        </div>

                        {/* Status badges */}
                        <div className="mt-2 space-y-1">
                          {d.isExamDay ? (
                            <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                              ★ {d.title}
                            </span>
                          ) : d.dayType === 'holiday' ? (
                            <span className="inline-block text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                              {d.title}
                            </span>
                          ) : d.isTeachingDay ? (
                            <span className="inline-block text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                              {d.title || '常規教學日'}
                            </span>
                          ) : (
                            <span className="inline-block text-[11px] text-stone-400">週末無課</span>
                          )}

                          {d.description && d.description !== d.title && (
                            <p className="text-[11px] text-stone-500 line-clamp-2">{d.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      {d.isTeachingDay && (
                        <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-end">
                          <button
                            onClick={() => onSelectDateAndWeek(d.date, d.weekNumber, d.term)}
                            className="text-xs text-red-700 hover:text-red-900 font-semibold hover:underline flex items-center gap-1"
                          >
                            寫這天手冊 →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Major Exam Events Reference Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
        <h3 className="font-bold text-stone-900 text-sm md:text-base flex items-center gap-2 font-serif text-red-950">
          <Sparkles className="w-4 h-4 text-amber-600" />
          全學年測驗與考試時程表 (備註重要依據)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {MAJOR_EVENTS.filter((e) => e.type === 'exam').map((exam) => (
            <div key={exam.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>{exam.title}</span>
                <span className="text-emerald-700 font-normal">{exam.startDate} 至 {exam.endDate}</span>
              </div>
              <p className="text-stone-600 mt-1">{exam.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
