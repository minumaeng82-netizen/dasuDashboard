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
import { cn } from '../lib/utils';
import { TrainingPost, User } from '../types';
import { useEffect } from 'react';
import { CheckCircle2, Edit2, Trash2, Loader2, FileUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrainingBoardProps {
  user: User | null;
}

export const TrainingBoard: React.FC<TrainingBoardProps> = ({ user }) => {
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const [posts, setPosts] = useState<TrainingPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<TrainingPost | null>(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('training_posts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.warn('Using Local Storage Fallback:', err);
      // Fallback to local storage if supabase fails or not configured
      try {
        const saved = localStorage.getItem('training_posts');
        if (saved && saved !== 'undefined') {
          setPosts(JSON.parse(saved));
        } else {
          setPosts(DUMMY_TRAININGS);
          localStorage.setItem('training_posts', JSON.stringify(DUMMY_TRAININGS));
        }
      } catch (parseErr) {
        console.error('Failed to parse training_posts from localStorage:', parseErr);
        setPosts(DUMMY_TRAININGS);
      }
    } finally {

      setIsLoading(false);
    }
  };

  const savePosts = (updated: TrainingPost[]) => {
    // This now just updates local state after DB operations
    setPosts(updated);
    localStorage.setItem('training_posts', JSON.stringify(updated));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;
    setIsUploading(true);

    try {
      if (editingId) {
        const updateData = { title: newTitle, author: newAuthor, summary: newSummary, pdfUrl: newUrl };
        if (supabase) {
          const { error } = await supabase
            .from('training_posts')
            .update(updateData)
            .eq('id', editingId);

          if (error) throw error;
          fetchPosts();
        } else {
          const updated = posts.map(p =>
            p.id === editingId
              ? { ...p, ...updateData }
              : p
          );
          savePosts(updated);
        }
      } else {
        const newPostData = {
          title: newTitle,
          author: newAuthor,
          date: new Date().toISOString().split('T')[0],
          summary: newSummary,
          authorEmail: user?.email,
          pdfUrl: newUrl,
          fileType: 'link'
        };

        if (supabase) {
          const { error } = await supabase
            .from('training_posts')
            .insert([newPostData]);

          if (error) throw error;
          fetchPosts();
        } else {
          const newPost = { ...newPostData, id: Math.random().toString(36).substr(2, 9) } as TrainingPost;
          savePosts([newPost, ...posts]);
        }
      }



      // Reset form
      setNewTitle('');
      setNewAuthor('');
      setNewSummary('');
      setNewUrl('');
      setEditingId(null);
      setIsUploadOpen(false);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('파일 업로드 및 저장이 실패했습니다. Supabase 설정을 확인해 주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (e: React.MouseEvent, post: TrainingPost) => {
    e.stopPropagation();
    setEditingId(post.id);
    setNewTitle(post.title);
    setNewAuthor(post.author);
    setNewSummary(post.summary);
    setNewUrl(post.pdfUrl || '');
    setIsUploadOpen(true);
  };

  const deletePost = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = posts.find(p => p.id === id);
    if (!target) return;

    if (window.confirm(`'${target.title}' 자료를 삭제하시겠습니까?`)) {
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const { error } = await supabase
          .from('training_posts')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Also delete file from storage if it exists
        if (target.pdfUrl) {
          const urlParts = target.pdfUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage
            .from('school-resources')
            .remove([`training/${fileName}`]);
        }

        fetchPosts();
        if (selectedPost?.id === id) setSelectedPost(null);
      } catch (err) {
        console.warn('Delete fallback:', err);
        // Fallback for local storage
        const updated = posts.filter(p => p.id !== id);
        savePosts(updated);
        if (selectedPost?.id === id) setSelectedPost(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">두고두고 볼 것들</h1>
          <p className="text-slate-500 mt-1">학교 내 중요한 자료 및 연수 내용을 언제든 확인하세요.</p>
        </div>

        {(isAuthenticated || isAdmin) && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            자료 등록
          </button>
        )}
      </header>

      {!isAuthenticated && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-center">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 flex-shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900">조회 제한 안내</h4>
            <p className="text-sm text-amber-700">로그인 후에만 상세 자료 열람 및 다운로드가 가능합니다. 목록만 열람 중입니다.</p>
          </div>
        </div>
      )}

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

      {/* List of Training Posts */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-16 text-center">번호</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">부서</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">자료 제목</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-32">등록일</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider w-32 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.map((post, index) => (
              <tr
                key={post.id}
                className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                onClick={() => isAuthenticated && setSelectedPost(post)}
              >
                <td className="px-6 py-4 text-center text-sm text-slate-400 font-medium">
                  {posts.length - index}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {post.author}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </span>
                    {post.summary && (
                      <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {post.summary}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                  {post.date}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      disabled={!isAuthenticated}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isAuthenticated
                          ? "text-blue-600 hover:bg-blue-100"
                          : "text-slate-300 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAuthenticated) setSelectedPost(post);
                      }}
                      title="자료 보기"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {(isAdmin || (isAuthenticated && post.authorEmail === user?.email)) && (
                      <>
                        <button
                          onClick={(e) => openEditModal(e, post)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => deletePost(e, post.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="font-bold">등록된 연수 자료가 없습니다.</p>
          </div>
        )}
      </div>


      {/* Preview Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-5xl h-full rounded-3xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 line-clamp-1">{selectedPost.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{selectedPost.author} • {selectedPost.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedPost.pdfUrl) {
                        window.open(selectedPost.pdfUrl, '_blank');
                      } else {
                        alert('연결된 파일이 없습니다.');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all mr-2"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    <X className="w-7 h-7 text-slate-400" />
                  </button>
                </div>
              </div>

              {(isAdmin || (isAuthenticated && selectedPost.authorEmail === user?.email)) && (
                <div className="bg-slate-50 px-6 py-2 border-b border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={(e) => openEditModal(e, selectedPost)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    수정하기
                  </button>
                  <button
                    onClick={(e) => deletePost(e, selectedPost.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제하기
                  </button>
                </div>
              )}

              <div className="flex-1 bg-slate-50 relative overflow-hidden flex">
                {/* Simulated Viewer Area */}
                <div className="flex-1 flex flex-col items-center overflow-auto p-4 md:p-12 scrollbar-hide">
                  {(() => {
                    let embedUrl = selectedPost.pdfUrl || '';

                    // Google Drive Link Conversion
                    if (embedUrl.includes('drive.google.com')) {
                      if (embedUrl.includes('/view')) {
                        embedUrl = embedUrl.replace('/view', '/preview');
                      } else if (!embedUrl.includes('/preview')) {
                        // Handle other potential drive formats
                        const fileIdMatch = embedUrl.match(/\/d\/([^/]+)/);
                        if (fileIdMatch) {
                          embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
                        }
                      }
                    }

                    if (embedUrl && !embedUrl.includes('sample.pdf') && !embedUrl.includes('w3.org')) {
                      return (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full border-none bg-white rounded-lg shadow-2xl min-h-[800px]"
                          title="Document Viewer"
                          allow="autoplay"
                        />
                      );
                    }

                    return (

                      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-sm p-16 min-h-[1000px] relative">
                        {/* HWP Specific Badge */}
                        <div className="absolute top-8 right-8 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-black uppercase tracking-widest border border-orange-200">
                          {selectedPost.fileType === 'hwp' ? 'HWP Online Viewer' : 'Document Preview'}
                        </div>

                        <div className="border-b-4 border-slate-900 pb-8 mb-12">
                          <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">{selectedPost.title}</h1>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-slate-500 font-serif">부서: {selectedPost.author}</p>
                              <p className="text-slate-500 font-serif">일자: {selectedPost.date}</p>
                            </div>
                            <div className="w-32 h-32 border-2 border-slate-200 flex items-center justify-center text-slate-300 italic text-sm">
                              (직인 생략)
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8 font-serif text-lg text-slate-800 leading-loose">
                          <p className="font-bold underline text-2xl mb-8">1. 개요</p>
                          <p>{selectedPost.summary}</p>
                          <p>본 문서는 학교 운영 지침에 따라 작성되었으며, 관련 부서의 확인을 거쳤습니다. 세부 사항은 첨부된 원본 파일을 다운로드하여 확인하시기 바랍니다.</p>

                          <p className="font-bold underline text-2xl mt-12 mb-8">2. 세부 지침</p>
                          <ul className="list-disc pl-8 space-y-4">
                            <li>관련 근거: 2026학년도 학교 운영 계획 제12조</li>
                            <li>대상: 전 교직원 및 해당 학생</li>
                            <li>이행 기한: 게시일로부터 7일 이내</li>
                          </ul>

                          <div className="mt-20 py-10 border-t border-slate-100 text-center">
                            <p className="text-3xl font-black tracking-[0.5em] text-slate-900">다 수 초 등 학 교 장</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    {editingId ? <Edit2 className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{editingId ? '자료 수정' : '새 자료 등록'}</h3>
                    <p className="text-sm text-slate-500 font-medium">연수 자료 링크를 관리하세요.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  <X className="w-7 h-7 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">자료 제목</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="정확한 문서 제목을 입력하세요"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">담당 부서</label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="예: 교육연구부"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">자료 링크 (URL)</label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com/file.pdf"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">자료 요약 (미리보기 내용)</label>
                  <textarea
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="문서의 핵심 내용을 간략히 적어주세요."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-32 resize-none font-medium text-sm leading-relaxed"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="flex-1 px-8 py-4.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-[2] px-8 py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        업로드 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        {editingId ? '수정 완료' : '자료 등록 완료'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
