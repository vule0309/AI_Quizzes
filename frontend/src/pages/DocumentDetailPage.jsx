import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, BrainCircuit, FileText, Loader2, Sparkles, Trash2, ChevronDown } from 'lucide-react';
import useStore, { API_BASE } from '../store';

const DIFFICULTY_LABELS = { easy: '😊 Dễ', medium: '🎯 Trung bình', hard: '🔥 Khó' };

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, fetchDocuments, isGuest, getGuestQuizMap, getGuestFlashcardsByDocId, documents } = useStore();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingFlash, setGeneratingFlash] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // --- Quiz config ---
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');

  // --- Flashcard config ---
  const [numFlashcards, setNumFlashcards] = useState(15);

  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [hasFlashcards, setHasFlashcards] = useState(false);

  useEffect(() => {
    if (isGuest) {
      const found = documents.find((d) => d.id === id);
      setDoc(found || null);
      
      const quizMap = getGuestQuizMap();
      if (quizMap[id]) {
        const q = useStore.getState().getGuestQuizById(quizMap[id]);
        if (q) setExistingQuizzes([q]);
      }
      const fc = getGuestFlashcardsByDocId(id);
      if (fc && fc.length > 0) setHasFlashcards(true);

      setLoading(false);
      return;
    }
    const fetchDocData = async () => {
      try {
        const [docRes, quizRes, flashRes] = await Promise.all([
          fetch(`${API_BASE}/api/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/quiz`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/flashcards/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        
        if (!docRes.ok) throw new Error('Không tìm thấy tài liệu');
        const docData = await docRes.json();
        setDoc(docData);

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setExistingQuizzes(quizData.quizzes?.filter(q => q.document_id === id) || []);
        }

        if (flashRes.ok) {
          const flashData = await flashRes.json();
          setHasFlashcards(flashData.flashcards?.length > 0);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDocData();
  }, [id, token, isGuest, documents]);

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    setError('');

    if (isGuest) {
      const quizMap = getGuestQuizMap();
      const quizId = quizMap[id];
      if (quizId) {
        setTimeout(() => navigate(`/quiz/${quizId}`), 800);
      } else {
        setError('Không có quiz demo cho tài liệu này.');
        setGeneratingQuiz(false);
      }
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch(`${API_BASE}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_id: id, num_questions: numQuestions, difficulty }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tạo Quiz');
      navigate(`/quiz/${data.id}`);
    } catch (err) {
      clearTimeout(timeout);
      setError(err.name === 'AbortError'
        ? 'Quá thời gian chờ (2 phút). AI đang bận, vui lòng thử lại.'
        : err.message);
      setGeneratingQuiz(false);
    }
  };

  const handleGenerateFlash = async () => {
    setGeneratingFlash(true);
    setError('');

    if (isGuest) {
      const cards = getGuestFlashcardsByDocId(id);
      if (cards.length > 0) {
        setTimeout(() => navigate(`/flashcards/${id}`), 800);
      } else {
        setError('Không có flashcard demo cho tài liệu này.');
        setGeneratingFlash(false);
      }
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch(`${API_BASE}/api/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_id: id, num_flashcards: numFlashcards }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tạo Flashcard');
      navigate(`/flashcards/${id}`);
    } catch (err) {
      clearTimeout(timeout);
      setError(err.name === 'AbortError'
        ? 'Quá thời gian chờ (2 phút). AI đang bận, vui lòng thử lại.'
        : err.message);
      setGeneratingFlash(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xoá tài liệu này? Hành động không thể hoàn tác.')) return;
    setDeleting(true);
    if (isGuest) {
      setTimeout(() => { navigate('/'); setDeleting(false); }, 500);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error('Xoá thất bại');
      await fetchDocuments(true);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <p>Đang tải tài liệu...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Về Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      {isGuest && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          🎭 Chế độ Guest Demo — Dữ liệu mẫu, không được lưu thực sự
        </div>
      )}
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Document Info */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: 'rgba(139, 92, 246, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-primary)', flexShrink: 0,
        }}>
          <FileText size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '0.4rem' }}>{doc?.file_name || 'Tài liệu'}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tải lên: {doc?.created_at ? new Date(doc.created_at).toLocaleDateString('vi-VN') : '—'}
          </p>
          <span style={{
            display: 'inline-block', marginTop: '0.4rem',
            fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6,
            background: doc.status === 'ready' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: doc.status === 'ready' ? 'var(--color-success)' : 'var(--color-error)',
          }}>
            {doc.status === 'ready' ? '✓ Sẵn sàng' : `⚠ ${doc.status}`}
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleDelete}
          disabled={deleting}
          style={{ color: 'var(--color-error)', padding: '4px 8px' }}
          title="Xoá tài liệu"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {doc?.summary_text && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Tóm tắt nội dung
          </p>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>{doc.summary_text}</p>
        </div>
      )}

      {/* Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* === QUIZ CARD === */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem', color: 'var(--color-primary)',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <BrainCircuit size={26} />
            </div>
            <h3 style={{ marginBottom: '0.25rem' }}>Tạo bộ Quiz</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI tạo câu hỏi trắc nghiệm</p>
          </div>

          {existingQuizzes.length > 0 && (
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Các quiz đã tạo:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {existingQuizzes.map((q, i) => (
                  <button
                    key={q.id}
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}
                    onClick={() => navigate(`/quiz/${q.id}`)}
                  >
                    <BookOpen size={14} /> {q.title || `Quiz ${i + 1}`} ({q.num_questions} câu)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz config */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Số câu</label>
              <select
                className="input"
                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                disabled={generatingQuiz}
              >
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} câu</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Độ khó</label>
              <select
                className="input"
                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={generatingQuiz}
              >
                <option value="easy">😊 Dễ</option>
                <option value="medium">🎯 TB</option>
                <option value="hard">🔥 Khó</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            onClick={handleGenerateQuiz}
            disabled={generatingQuiz || generatingFlash}
          >
            {generatingQuiz
              ? <><Loader2 size={15} className="animate-spin" /> {isGuest ? 'Đang mở...' : 'AI đang tạo...'}</>
              : <><Sparkles size={15} /> Tạo Quiz Mới</>
            }
          </button>
        </div>

        {/* === FLASHCARD CARD === */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem', color: 'var(--color-success)',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)',
            }}>
              <BookOpen size={26} />
            </div>
            <h3 style={{ marginBottom: '0.25rem' }}>Tạo Flashcard</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI tạo thẻ ghi nhớ</p>
          </div>

          {hasFlashcards && (
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                className="btn btn-ghost btn-sm w-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}
                onClick={() => navigate(`/flashcards/${id}`)}
              >
                <BookOpen size={14} /> Mở Flashcards Đã Tạo
              </button>
            </div>
          )}

          {/* Flashcard config */}
          <div style={{ marginTop: 'auto' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Số thẻ</label>
            <select
              className="input"
              style={{ padding: '6px 8px', fontSize: '0.85rem', width: '100%' }}
              value={numFlashcards}
              onChange={(e) => setNumFlashcards(Number(e.target.value))}
              disabled={generatingFlash}
            >
              {[10, 15, 20, 30].map(n => <option key={n} value={n}>{n} thẻ</option>)}
            </select>
          </div>

          <button
            className="btn btn-success"
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            onClick={handleGenerateFlash}
            disabled={generatingFlash || generatingQuiz}
          >
            {generatingFlash
              ? <><Loader2 size={15} className="animate-spin" /> {isGuest ? 'Đang mở...' : 'AI đang tạo...'}</>
              : <><BookOpen size={15} /> Tạo Mới Lại</>
            }
          </button>
        </div>
      </div>

      {/* AI Loading Overlay */}
      {!isGuest && (generatingQuiz || generatingFlash) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(10, 10, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 48px rgba(139,92,246,0.5)',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <Loader2 size={40} className="animate-spin" color="#8b5cf6" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
              {generatingQuiz
                ? `AI đang tạo ${numQuestions} câu quiz ${DIFFICULTY_LABELS[difficulty]}...`
                : `AI đang tạo ${numFlashcards} flashcard...`}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 380, lineHeight: 1.6 }}>
              Gemini đang đọc và phân tích tài liệu của bạn.
              <br />Thường mất <strong>15–40 giây</strong>, vui lòng không tắt trang...
            </p>
          </div>
          <div style={{
            width: 200, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
              animation: 'progress-indeterminate 1.8s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
