import { CalendarDay, CalendarEvent, SchoolClass } from '../types/handbook';

export const SCHOOL_NAME = "同善堂中學小學部";
export const ACADEMIC_YEAR = "2026-2027";
export const TOTAL_TEACHING_DAYS = 197.5;

export const DEFAULT_CLASSES: SchoolClass[] = [
  { id: 'p4b', name: '四乙班', grade: 4 },
];



export const MAJOR_EVENTS: CalendarEvent[] = [
  {
    id: 'term1_start',
    startDate: '2026-09-01',
    endDate: '2026-09-01',
    title: '上學期開學禮',
    type: 'activity',
    description: '上午開學禮，下午升開課禮準備，敬教開學班會'
  },
  {
    id: 'teachers_day',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    title: '教師節放假',
    type: 'holiday',
    description: '教師節全校放假一天'
  },
  {
    id: 'mid_autumn',
    startDate: '2026-09-28',
    endDate: '2026-09-28',
    title: '中秋節翌日補假',
    type: 'holiday',
    description: '中秋節補假放假一天'
  },
  {
    id: 'national_day',
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    title: '國慶節假期',
    type: 'holiday',
    description: '國慶節放假'
  },
  {
    id: 'chung_yeung',
    startDate: '2026-10-19',
    endDate: '2026-10-19',
    title: '重陽節補假',
    type: 'holiday',
    description: '重陽節補假放假一天'
  },
  {
    id: 'term1_mid_exam',
    startDate: '2026-11-04',
    endDate: '2026-11-07',
    title: '上學期期中考試',
    type: 'exam',
    description: '11月4日(三)至7日(六) 上學期期中考試 (全校小一至小六)'
  },
  {
    id: 'sports_day',
    startDate: '2026-11-09',
    endDate: '2026-11-10',
    title: '校運會',
    type: 'activity',
    description: '9日皇朝校部、10日新馬路校部'
  },
  {
    id: 'school_anniversary',
    startDate: '2026-11-28',
    endDate: '2026-11-30',
    title: '校慶日及補假',
    type: 'holiday',
    description: '28日校慶日，30日校慶補假放假'
  },
  {
    id: 'return_xmas_holidays',
    startDate: '2026-12-20',
    endDate: '2026-12-26',
    title: '澳門特區成立紀念日、冬至、聖誕節假期',
    type: 'holiday',
    description: '回歸紀念日、冬至、聖誕假期放假'
  },
  {
    id: 'new_year_holiday',
    startDate: '2027-01-01',
    endDate: '2027-01-01',
    title: '元旦假期',
    type: 'holiday',
    description: '元旦全校放假一天'
  },
  {
    id: 'term1_final_exam',
    startDate: '2027-01-20',
    endDate: '2027-01-23',
    title: '上學期期末考試',
    type: 'exam',
    description: '1月20日(三)至23日(六) 上學期期末考試 (全校小一至小六)'
  },
  {
    id: 'term2_start',
    startDate: '2027-01-25',
    endDate: '2027-01-25',
    title: '下學期開課日',
    type: 'activity',
    description: '下學期正式開課'
  },
  {
    id: 'spring_festival',
    startDate: '2027-02-01',
    endDate: '2027-02-14',
    title: '春節假期',
    type: 'holiday',
    description: '農曆春節年假 (5日年初一)'
  },
  {
    id: 'womens_day',
    startDate: '2027-03-08',
    endDate: '2027-03-08',
    title: '三八婦女節放假',
    type: 'holiday',
    description: '婦女節放假一天'
  },
  {
    id: 'easter_holiday',
    startDate: '2027-03-26',
    endDate: '2027-03-29',
    title: '復活節假期',
    type: 'holiday',
    description: '復活節耶穌受難節及復活節假期'
  },
  {
    id: 'ching_ming',
    startDate: '2027-04-05',
    endDate: '2027-04-06',
    title: '清明節放假',
    type: 'holiday',
    description: '清明節放假'
  },
  {
    id: 'term2_mid_exam',
    startDate: '2027-04-14',
    endDate: '2027-04-17',
    title: '下學期期中考試',
    type: 'exam',
    description: '4月14日(三)至17日(六) 下學期期中考試 (全校小一至小六)'
  },
  {
    id: 'labour_day',
    startDate: '2027-05-01',
    endDate: '2027-05-03',
    title: '勞動節及補假',
    type: 'holiday',
    description: '1日勞動節，3日勞動節補假'
  },
  {
    id: 'childrens_day',
    startDate: '2027-06-01',
    endDate: '2027-06-01',
    title: '六一兒童節放假',
    type: 'holiday',
    description: '兒童節全校放假一天'
  },
  {
    id: 'p6_grad_exam',
    startDate: '2027-06-02',
    endDate: '2027-06-07',
    title: '小六畢業考試',
    type: 'exam',
    description: '6月2日(三)至7日(一) 小學六年級畢業考試',
    targetGrades: '小六'
  },
  {
    id: 'dragon_boat',
    startDate: '2027-06-09',
    endDate: '2027-06-09',
    title: '端午節放假',
    type: 'holiday',
    description: '端午節全校放假一天'
  },
  {
    id: 'term2_final_exam',
    startDate: '2027-06-25',
    endDate: '2027-06-30',
    title: '一至五年級下學期期末考試',
    type: 'exam',
    description: '6月25日(五) 及 28日(一)至30日(三) 一至五年級下學期期末考試',
    targetGrades: '小一至小五'
  },
  {
    id: 'closing_ceremony',
    startDate: '2027-07-15',
    endDate: '2027-07-15',
    title: '結業禮 (學年最後一天)',
    type: 'activity',
    description: '上午結業禮，7月16日起學生放暑假'
  }
];

// Helper to determine day status for 2026-2027 academic year
export function getCalendarDayInfo(dateStr: string): {
  isTeachingDay: boolean;
  dayType: 'school_day' | 'holiday' | 'exam' | 'activity' | 'weekend';
  title?: string;
  description?: string;
  weekNumber: number;
  term: 1 | 2;
} {
  const [yearStr, monthStr, dayNumStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayNumStr, 10);
  const date = new Date(year, month - 1, day);
  const dow = date.getDay(); // 0 = Sun, 6 = Sat

  // Determine Term: Term 1: 2026-09-01 to 2027-01-23; Term 2: 2027-01-25 to 2027-07-15
  const term: 1 | 2 = dateStr < '2027-01-25' ? 1 : 2;

  // Specific Holidays & Days off from the calendar
  const holidays: Record<string, string> = {
    '2026-09-10': '教師節放假',
    '2026-09-28': '中秋節補假',
    '2026-10-01': '國慶節假期',
    '2026-10-02': '國慶節假期',
    '2026-10-19': '重陽節補假',
    '2026-11-30': '校慶補假',
    '2026-12-21': '澳門特區成立紀念日補假',
    '2026-12-22': '冬至放假',
    '2026-12-23': '聖誕節前夕假期',
    '2026-12-24': '平安夜假期',
    '2026-12-25': '聖誕節假期',
    '2026-12-26': '聖誕節假期',
    '2027-01-01': '元旦假期',
    // 春節假期 2月1日 - 14日
    '2027-02-01': '春節假期',
    '2027-02-02': '春節假期',
    '2027-02-03': '春節假期',
    '2027-02-04': '春節假期',
    '2027-02-05': '農曆年初一放假',
    '2027-02-06': '農曆年初二放假',
    '2027-02-07': '農曆年初三放假',
    '2027-02-08': '春節補假',
    '2027-02-09': '春節補假',
    '2027-02-10': '春節假期',
    '2027-02-11': '春節假期',
    '2027-02-12': '春節假期',
    '2027-02-13': '春節假期',
    '2027-02-14': '春節假期',
    '2027-03-08': '三八婦女節放假',
    '2027-03-26': '復活節耶穌受難日',
    '2027-03-27': '復活節假期',
    '2027-03-29': '復活節星期一補假',
    '2027-04-05': '清明節放假',
    '2027-04-06': '清明節補假',
    '2027-05-01': '勞動節假期',
    '2027-05-03': '勞動節補假',
    '2027-06-01': '六一兒童節放假',
    '2027-06-09': '端午節放假',
  };

  // Specific Exam Days (綠色標記)
  const exams: Record<string, string> = {
    '2026-11-04': '上學期期中考試 (第1天)',
    '2026-11-05': '上學期期中考試 (第2天)',
    '2026-11-06': '上學期期中考試 (第3天)',
    '2026-11-07': '上學期期中考試 (第4天/週六)',
    '2027-01-20': '上學期期末考試 (第1天)',
    '2027-01-21': '上學期期末考試 (第2天)',
    '2027-01-22': '上學期期末考試 (第3天)',
    '2027-01-23': '上學期期末考試 (第4天/週六)',
    '2027-04-14': '下學期期中考試 (第1天)',
    '2027-04-15': '下學期期中考試 (第2天)',
    '2027-04-16': '下學期期中考試 (第3天)',
    '2027-04-17': '下學期期中考試 (第4天/週六)',
    '2027-06-02': '小六畢業考試 (第1天)',
    '2027-06-03': '小六畢業考試 (第2天)',
    '2027-06-04': '小六畢業考試 (第3天)',
    '2027-06-05': '小六畢業考試 (第4天/週六)',
    '2027-06-07': '小六畢業考試 (第5天)',
    '2027-06-25': '一至五年級期末考試 (第1天)',
    '2027-06-28': '一至五年級期末考試 (第2天)',
    '2027-06-29': '一至五年級期末考試 (第3天)',
    '2027-06-30': '一至五年級期末考試 (第4天)',
  };

  // Calculate Week Number
  // School starts on 2026-09-01 (Tuesday), which is Week 1.
  // Term 2 starts on 2027-01-25 (Monday), which is Term 2 Week 1.
  let weekNumber = 1;
  if (term === 1) {
    const startT1 = new Date(2026, 8, 1); // 2026-09-01
    const diffDays = Math.floor((date.getTime() - startT1.getTime()) / (1000 * 60 * 60 * 24));
    // Day of week offset: 2026-09-01 is Tuesday (dow 2)
    weekNumber = Math.max(1, Math.floor((diffDays + 1) / 7) + 1);
  } else {
    const startT2 = new Date(2027, 0, 25); // 2027-01-25
    const diffDays = Math.floor((date.getTime() - startT2.getTime()) / (1000 * 60 * 60 * 24));
    weekNumber = Math.max(1, Math.floor(diffDays / 7) + 1);
  }

  // Check holidays first
  if (holidays[dateStr]) {
    return {
      isTeachingDay: false,
      dayType: 'holiday',
      title: holidays[dateStr],
      description: holidays[dateStr],
      weekNumber,
      term
    };
  }

  // Check exam days
  if (exams[dateStr]) {
    return {
      isTeachingDay: true,
      dayType: 'exam',
      title: exams[dateStr],
      description: exams[dateStr],
      weekNumber,
      term
    };
  }

  // Weekends
  if (dow === 0) {
    return {
      isTeachingDay: false,
      dayType: 'weekend',
      title: '星期日',
      description: '星期日無課',
      weekNumber,
      term
    };
  }

  if (dow === 6) {
    // Normal Saturday is weekend unless designated exam day
    return {
      isTeachingDay: false,
      dayType: 'weekend',
      title: '星期六',
      description: '週末無課',
      weekNumber,
      term
    };
  }

  // Summer holiday
  if (dateStr >= '2027-07-16') {
    return {
      isTeachingDay: false,
      dayType: 'holiday',
      title: '學生暑假',
      description: '暑假期間',
      weekNumber,
      term
    };
  }

  // Normal school day (Mon - Fri)
  let title = '常規教學日';
  let desc = '正常上課，需登記每日手冊';
  if (dateStr === '2026-09-01') {
    title = '開學禮上學日';
    desc = '上午開學禮，下午班會及上學準備';
  } else if (dateStr === '2027-01-29') {
    title = '學校旅行日';
    desc = '全校旅行活動日';
  } else if (dateStr === '2027-07-15') {
    title = '學年結業禮';
    desc = '上午結業禮，本學年最後一天上學日';
  }

  return {
    isTeachingDay: true,
    dayType: 'school_day',
    title,
    description: desc,
    weekNumber,
    term
  };
}

// Generate the full calendar of school days for 2026-2027
export function generateAcademicCalendar(): CalendarDay[] {
  const days: CalendarDay[] = [];
  const start = new Date(2026, 8, 1); // 2026-09-01
  const end = new Date(2027, 6, 16);  // 2027-07-16

  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const info = getCalendarDayInfo(dateStr);
    days.push({
      date: dateStr,
      month: cur.getMonth() + 1,
      day: cur.getDate(),
      dayOfWeek: cur.getDay(),
      weekNumber: info.weekNumber,
      term: info.term,
      dayType: info.dayType,
      title: info.title,
      description: info.description,
      isTeachingDay: info.isTeachingDay,
      isExamDay: info.dayType === 'exam',
      flagRaising: cur.getDay() === 0 ? (cur.getDate() % 2 === 0 ? '061' : '119') : undefined
    });

    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

// Get the Monday through Friday dates for a specific week number and term
export function getWeekDates(weekNumber: number, term: 1 | 2 = 1): {
  date: string;
  dayOfWeek: number;
  label: string;
  info: ReturnType<typeof getCalendarDayInfo>;
}[] {
  // Find calendar days matching weekNumber and term
  const allDays = generateAcademicCalendar();
  const weekDays = allDays.filter(d => d.weekNumber === weekNumber && d.term === term);

  // If week contains Mon(1) to Fri(5), assemble them
  // Base Monday date for this week
  let mondayDate: Date | null = null;
  const foundMon = weekDays.find(d => d.dayOfWeek === 1);
  if (foundMon) {
    const [y, m, d] = foundMon.date.split('-').map(Number);
    mondayDate = new Date(y, m - 1, d);
  } else if (weekDays.length > 0) {
    // If Week 1 starts on Tuesday (like Sep 1, 2026)
    const firstDay = weekDays[0];
    const [y, m, d] = firstDay.date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - (firstDay.dayOfWeek - 1));
    mondayDate = dt;
  } else {
    // fallback
    mondayDate = new Date(2026, 8, 1);
  }

  const result: {
    date: string;
    dayOfWeek: number;
    label: string;
    info: ReturnType<typeof getCalendarDayInfo>;
  }[] = [];

  const dayLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  for (let dow = 1; dow <= 5; dow++) {
    const target = new Date(mondayDate);
    target.setDate(mondayDate.getDate() + (dow - 1));
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const info = getCalendarDayInfo(dateStr);

    result.push({
      date: dateStr,
      dayOfWeek: dow,
      label: dayLabels[dow],
      info
    });
  }

  return result;
}

// Get upcoming exams for the selected date or week to assist auto-populating remarks
export function getUpcomingExamsForWeek(weekNumber: number, term: 1 | 2 = 1): CalendarEvent[] {
  const weekDays = getWeekDates(weekNumber, term);
  if (weekDays.length === 0) return [];
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[weekDays.length - 1].date;

  // Find events occurring in or shortly after this week (within 3 weeks)
  const windowEnd = new Date(weekDays[0].date);
  windowEnd.setDate(windowEnd.getDate() + 21);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);

  return MAJOR_EVENTS.filter(ev => {
    return (
      ev.type === 'exam' &&
      ((ev.startDate >= weekStart && ev.startDate <= windowEndStr) ||
       (ev.endDate >= weekStart && ev.startDate <= weekEnd))
    );
  });
}
