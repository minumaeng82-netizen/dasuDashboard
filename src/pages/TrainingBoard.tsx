import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  MoreVertical,
  Filter,
  X
} from 'lucide-react';
import { DUMMY_TRAININGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

export const TrainingBoard: React.FC = () => {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">연수 게시판</h1>
          <p className="text-slate-500 mt-1">학교 내 각종 연수 자료 및 지침을 확인하세요.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          자료 업로드
        </button>
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="자료 제목, 부서명으로 검색..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            필터
          </button>
          <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 outline-none shadow-sm">
            <option>최신순</option>
            <option>조회순</option>
            <option>부서별</option>
          </select>
        </div>
      </div>

      {/* Grid of Training Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {DUMMY_TRAININGS.map((post, index) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            key={post.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-40 bg-slate-100 flex items-center justify-center relative group">
              <FileText className="w-16 h-16 text-slate-300 group-hover:text-blue-200 transition-colors" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={() => post.pdfUrl && setSelectedPdf(post.pdfUrl)}
                  className="p-2 bg-white rounded-full text-slate-900 hover:bg-blue-50 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white rounded-full text-slate-900 hover:bg-blue-50 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {post.author}
                </span>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{post.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                {post.summary}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">{post.date}</span>
                <button 
                  onClick={() => post.pdfUrl && setSelectedPdf(post.pdfUrl)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  자세히 보기
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {selectedPdf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="bg-white w-full h-full rounded-2xl overflow-hidden flex flex-col relative">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-900">문서 미리보기</h3>
                <button 
                  onClick={() => setSelectedPdf(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>
              <div className="flex-1 bg-slate-800">
                <iframe 
                  src={`${selectedPdf}#toolbar=0`} 
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
