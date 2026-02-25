export type Category = '공문' | '복무' | '행사' | '연수' | '회의' | '기타';

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
  timeRange?: string;
  location?: string;
  target?: string;
  category: Category;
  description?: string;
  authorEmail?: string;
  isPrivate?: boolean;
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
  fileType?: string;
}




