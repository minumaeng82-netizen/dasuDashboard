export type Category = '공문' | '복무' | '행사' | '연수' | '기타';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}


export interface Schedule {
  id: string;
  title: string;
  date: string;
  category: Category;
  description?: string;
  important: boolean;
  authorEmail?: string;
}


export interface Shortcut {
  id: string;
  label: string;
  url: string;
}

export interface TrainingPost {
  id: string;
  title: string;
  author: string;
  date: string;
  pdfUrl?: string;
  summary: string;
  authorEmail?: string;
}



