import React from 'react';
import { Printer, X } from 'lucide-react';
import { DailyEntry, HandbookWeek, SubjectKey } from '../types/handbook';
import { getWeekDates, SCHOOL_NAME, ACADEMIC_YEAR } from '../data/calendar2026_2027';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  term: 1 | 2;
  className: string;
  handbookWeek: HandbookWeek | null;
  entries: Record<string, DailyEntry>;
}

const SUBJECTS: { key: SubjectKey; label: string }[] = [
  { key: 'chinese', label: '中 文' },
  { key: 'math', label: '數 學' },
  { key: 'english', label: '英 文' },
  { key: 'generalStudies', label: '常 識' },
  { key: 'other', label: '其 他' },
];

export const PrintPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  weekNumber,
  term,
  className,
  handbookWeek,
  entries,
}) => {
  if (!isOpen) return null;

  const weekDays = getWeekDates(weekNumber, term);
  const leftPageDays = weekDays.slice(0, 3);
  const rightPageDays = weekDays.slice(3, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h3 className="font-bold text-base">列印與匯出預覽 (雙頁手冊排版)</h3>
            <p className="text-xs text-stone-400">
              {SCHOOL_NAME} • 第 {weekNumber} 週 • {className}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              立即列印 / 另存為 PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Two-Page Spread */}
        <div className="p-6 overflow-y-auto font-serif bg-stone-50 print:p-0 print:bg-white">
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border-2 border-red-700 shadow-xs print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="text-center border-b-2 border-red-700 pb-3 mb-4">
              <h1 className="text-xl font-bold tracking-widest text-red-900">
                {SCHOOL_NAME} • 家課登記欄
              </h1>
              <div className="flex items-center justify-between text-xs text-stone-700 mt-2 px-2">
                <span>{ACADEMIC_YEAR} 學年度</span>
                <span>班別：{className}</span>
                <span className="font-bold text-red-800">第 {weekNumber} 週</span>
              </div>
            </div>

            {/* 2-page Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              {/* Left Page (Mon, Tue, Wed) */}
              <div className="border border-red-300 rounded-xl p-3 space-y-4 print:border-red-600">
                <div className="text-xs font-bold text-red-800 text-center border-b border-red-200 pb-1">
                  左 頁 ( 星期一 至 星期三 )
                </div>
                {leftPageDays.map((d) => {
                  const entry = entries[d.date];
                  const [_, m, day] = d.date.split('-');
                  return (
                    <div key={d.date} className="border border-red-200 rounded-lg overflow-hidden text-xs">
                      <div className="bg-red-50 text-red-900 px-2.5 py-1 font-bold flex justify-between">
                        <span>{parseInt(m, 10)}月{parseInt(day, 10)}日 ({d.label})</span>
                        <span className="text-[10px] font-normal">{d.info.title || ''}</span>
                      </div>
                      <div className="divide-y divide-red-100">
                        {SUBJECTS.map((sub) => (
                          <div key={sub.key} className="flex min-h-[24px]">
                            <div className="w-14 bg-red-50/50 border-r border-red-200 px-1 py-1 font-bold text-red-900 text-center shrink-0">
                              {sub.label}
                            </div>
                            <div className="flex-1 px-2 py-1 text-stone-800 font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                              {entry?.[sub.key] || ''}
                            </div>
                          </div>
                        ))}

                        {/* 值日 Duty */}
                        {entry?.duty && (
                          <div className="flex min-h-[22px] bg-amber-50/20">
                            <div className="w-14 bg-red-50/70 border-r border-red-200 px-1 py-0.5 font-bold text-emerald-950 text-center shrink-0">
                              值 日
                            </div>
                            <div className="flex-1 px-2 py-0.5 text-stone-800 font-sans text-[11px]">
                              {entry.duty}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Page (Thu, Fri + Weekly Exam Remarks) */}
              <div className="border border-red-300 rounded-xl p-3 space-y-4 print:border-red-600 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-red-800 text-center border-b border-red-200 pb-1 mb-4">
                    右 頁 ( 星期四 至 星期五 及 本週測考備忘 )
                  </div>

                  <div className="space-y-4">
                    {rightPageDays.map((d) => {
                      const entry = entries[d.date];
                      const [_, m, day] = d.date.split('-');
                      return (
                        <div key={d.date} className="border border-red-200 rounded-lg overflow-hidden text-xs">
                          <div className="bg-red-50 text-red-900 px-2.5 py-1 font-bold flex justify-between">
                            <span>{parseInt(m, 10)}月{parseInt(day, 10)}日 ({d.label})</span>
                            <span className="text-[10px] font-normal">{d.info.title || ''}</span>
                          </div>
                          <div className="divide-y divide-red-100">
                            {SUBJECTS.map((sub) => (
                              <div key={sub.key} className="flex min-h-[24px]">
                                <div className="w-14 bg-red-50/50 border-r border-red-200 px-1 py-1 font-bold text-red-900 text-center shrink-0">
                                  {sub.label}
                                </div>
                                <div className="flex-1 px-2 py-1 text-stone-800 font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                                  {entry?.[sub.key] || ''}
                                </div>
                              </div>
                            ))}

                            {/* 值日 Duty */}
                            {entry?.duty && (
                              <div className="flex min-h-[22px] bg-amber-50/20">
                                <div className="w-14 bg-red-50/70 border-r border-red-200 px-1 py-0.5 font-bold text-emerald-950 text-center shrink-0">
                                  值 日
                                </div>
                                <div className="flex-1 px-2 py-0.5 text-stone-800 font-sans text-[11px]">
                                  {entry.duty}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks Block for test/exam dates */}
                <div className="border-2 border-red-600 rounded-xl overflow-hidden mt-4">
                  <div className="bg-red-700 text-white px-2.5 py-1 text-xs font-bold flex justify-between">
                    <span>備 註 ( 本週測考日期及重要事項 )</span>
                    <span className="text-[10px] font-normal">全週共用一次</span>
                  </div>
                  <div className="p-2.5 min-h-[90px] font-sans text-[11px] whitespace-pre-wrap text-stone-800 leading-relaxed bg-red-50/20">
                    {handbookWeek?.examRemarks?.trim() || '（無特別測考備註）'}
                  </div>
                  <div className="px-2.5 py-1 bg-stone-50 border-t border-red-200 text-[11px] flex justify-between text-stone-500">
                    <span>{SCHOOL_NAME} • 家課手冊</span>
                    <span className="text-stone-400">同善堂家課手冊登記表</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
