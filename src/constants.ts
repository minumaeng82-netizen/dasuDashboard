import { Schedule, TrainingPost } from './types';

export const DUMMY_SCHEDULES: Schedule[] = [
  {
    id: '1',
    title: '주간학습안내 제출',
    date: '2026-02-22',
    category: '공문',
    important: true,
    description: '각 학년별 주간학습안내 취합 및 제출'
  },
  {
    id: '2',
    title: '교직원 월례회의',
    date: '2026-02-23',
    category: '행사',
    important: true,
    description: '시청각실, 오후 3시'
  },
  {
    id: '3',
    title: '나이스 복무 신청(연가)',
    date: '2026-02-24',
    category: '복무',
    important: false,
  },
  {
    id: '4',
    title: '학교폭력 예방 연수',
    date: '2026-02-22',
    category: '연수',
    important: true,
  }
];

export const DUMMY_TRAININGS: TrainingPost[] = [
  {
    id: '1',
    title: '2026학년도 교육과정 편성 지침',
    author: '교육연구부',
    date: '2026-02-20',
    summary: '신학년도 교육과정 수립을 위한 필수 지침 안내입니다.',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: '2',
    title: '디지털 선도학교 운영 계획',
    author: '정보부',
    date: '2026-02-18',
    summary: 'AI 코스웨어 활용 및 태블릿 PC 관리 규정 안내.',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];
