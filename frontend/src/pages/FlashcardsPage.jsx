import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Loader2, BookOpen } from 'lucide-react';
import useStore, { API_BASE } from '../store';

export default function FlashcardsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isGuest, getGuestFlashcardsByDocId } = useStore();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isGuest) {
      // Guest mode: dùng mock flashcard data
      const mockCards = getGuestFlashcardsByDocId(id);
      setCards(mockCards);
      setLoading(false);
      return;
    }
    const fetchCards = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/flashcards/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Không tìm thấy Flashcard');
        const list = Array.isArray(data) ? data : data.flashcards || [];
        setCards(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [id, token, isGuest]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setFlipped((f) => !f);
    }
    if (e.key === 'ArrowRight') {
      setIndex((i) => Math.min(i + 1, cards.length - 1));
      setFlipped(false);
    }
    if (e.key === 'ArrowLeft') {
      setIndex((i) => Math.max(i - 1, 0));
      setFlipped(false);
    }
  }, [cards.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goNext = () => {
    setIndex((i) => Math.min(i + 1, cards.length - 1));
    setFlipped(false);
  };

  const goPrev = () => {
    setIndex((i) => Math.max(i - 1, 0));
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <p>Đang tải Flashcard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Về Dashboard
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="empty-state animate-fadeIn">
        <div className="empty-state-icon"><BookOpen size={36} /></div>
        <h3 style={{ marginBottom: '0.5rem' }}>Chưa có Flashcard</h3>
        <p style={{ marginBottom: '1.5rem' }}>Vui lòng tạo Flashcard từ tài liệu trước.</p>
        <button className="btn btn-primary" onClick={() => navigate(`/documents/${id}`)}>
          Tạo Flashcard
        </button>
      </div>
    );
  }

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="flashcard-page animate-fadeIn">
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ flex: 1 }}>Flashcard</h2>
        <span className="badge badge-success">{index + 1} / {cards.length}</span>
      </div>

      {/* Progress */}
      <div className="flashcard-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="flashcard-scene"
        onClick={() => setFlipped((f) => !f)}
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <div className="flashcard-label">Khái niệm</div>
            <div className="flashcard-content">
              {card?.front_text || card?.front || 'N/A'}
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Nhấn để xem đáp án
            </p>
          </div>

          {/* Back */}
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-label">Giải thích</div>
            <div className="flashcard-content">
              {card?.back_text || card?.back || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flashcard-controls">
        <button
          className="flashcard-nav-btn"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Thẻ trước"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => setFlipped((f) => !f)}
          style={{ gap: '0.5rem' }}
        >
          <RotateCcw size={16} />
          Lật thẻ
        </button>

        <button
          className="flashcard-nav-btn"
          onClick={goNext}
          disabled={index === cards.length - 1}
          aria-label="Thẻ tiếp"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <p className="flashcard-hint">
        Dùng phím <kbd style={{
          background: 'rgba(255,255,255,0.08)',
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>Space</kbd> để lật,{' '}
        <kbd style={{
          background: 'rgba(255,255,255,0.08)',
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>←→</kbd> để chuyển thẻ
      </p>
    </div>
  );
}
