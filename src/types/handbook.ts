export type SubjectKey = 'chinese' | 'math' | 'english' | 'generalStudies' | 'other';

export interface DailyEntry {
  id: string; // format: `${academicYear}_${classId}_${date}`
  date: string; // YYYY-MM-DD
  weekNumber: number;
  dayOfWeek: number; // 1 = Mon, 2 = Tue, ..., 5 = Fri, 6 = Sat
  classId: string;
  chinese: string;
  math: string;
  english: string;
  generalStudies: string;
  other: string;
  duty?: string; // 值日生 / 值日
  notes?: string;
  updatedAt?: string;
  activeEditor?: {
    field: string;
    editorId: string;
    editorName?: string;
    timestamp: number;
  };
}

export interface HandbookWeek {
  id: string; // format: `${academicYear}_${classId}_w${weekNumber}`
  weekNumber: number;
  academicYear: string; // "2026-2027"
  classId: string;
  examRemarks: string; // The shared remarks specifically for test & exam dates (測考日期)
  teacherSignature?: string;
  updatedAt?: string;
}

export type DayType = 'school_day' | 'holiday' | 'exam' | 'activity' | 'weekend' | 'prep';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  month: number;
  day: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  weekNumber: number;
  term: 1 | 2;
  dayType: DayType;
  title?: string;
  description?: string;
  isTeachingDay: boolean; // 是否為教學日 (061/119)
  isExamDay: boolean; // 是否為測考日
  flagRaising?: '061' | '119'; // 升旗
}

export interface CalendarEvent {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  type: 'exam' | 'holiday' | 'activity' | 'meeting';
  description: string;
  targetGrades?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number; // 1 to 6
}
