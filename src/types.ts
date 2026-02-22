export type Category = '공문' | '복무' | '행사' | '연수' | '기타';

export interface Schedule {
  id: string;
  title: string;
  date: string;
  category: Category;
  description?: string;
  important: boolean;
}

export interface TrainingPost {
  id: string;
  title: string;
  author: string;
  date: string;
  pdfUrl?: string;
  summary: string;
}
