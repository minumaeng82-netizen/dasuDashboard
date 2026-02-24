export interface Holiday {
    date: string;
    name: string;
    isPublic: boolean;
}

export const HOLIDAYS_2026: Holiday[] = [
    { date: '2026-01-01', name: '신정', isPublic: true },
    { date: '2026-02-16', name: '설날 연휴', isPublic: true },
    { date: '2026-02-17', name: '설날', isPublic: true },
    { date: '2026-02-18', name: '설날 연휴', isPublic: true },
    { date: '2026-03-01', name: '삼일절', isPublic: true },
    { date: '2026-03-02', name: '삼일절 대체공휴일', isPublic: true },
    { date: '2026-05-05', name: '어린이날', isPublic: true },
    { date: '2026-05-24', name: '부처님 오신 날', isPublic: true },
    { date: '2026-05-25', name: '부처님 오신 날 대체공휴일', isPublic: true },
    { date: '2026-06-06', name: '현충일', isPublic: true },
    { date: '2026-07-17', name: '제헌절', isPublic: true },
    { date: '2026-08-15', name: '광복절', isPublic: true },
    { date: '2026-08-17', name: '광복절 대체공휴일', isPublic: true },
    { date: '2026-09-24', name: '추석 연휴', isPublic: true },
    { date: '2026-09-25', name: '추석', isPublic: true },
    { date: '2026-09-26', name: '추석 연휴', isPublic: true },
    { date: '2026-10-03', name: '개천절', isPublic: true },
    { date: '2026-10-05', name: '개천절 대체공휴일', isPublic: true },
    { date: '2026-10-09', name: '한글날', isPublic: true },
    { date: '2026-12-25', name: '크리스마스', isPublic: true },
    // 기타 기념일
    { date: '2026-02-14', name: '발렌타인데이', isPublic: false },
    { date: '2026-03-20', name: '춘분', isPublic: false },
    { date: '2026-04-05', name: '식목일', isPublic: false },
    { date: '2026-05-01', name: '근로자의 날', isPublic: false },
    { date: '2026-05-08', name: '어버이날', isPublic: false },
    { date: '2026-05-15', name: '스승의 날', isPublic: false },
    { date: '2026-06-21', name: '하지', isPublic: false },
    { date: '2026-09-23', name: '추분', isPublic: false },
    { date: '2026-10-01', name: '국군의 날', isPublic: false },
    { date: '2026-12-22', name: '동지', isPublic: false },
];
