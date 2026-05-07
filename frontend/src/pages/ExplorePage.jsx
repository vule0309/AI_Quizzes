import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import useStore, { API_BASE } from '../store';

export default function ExplorePage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  
  const { token, isGuest, getGuestQuizMap } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunityQuizzes = async () => {
      if (isGuest) {
        // Trong chế độ demo, hiển thị các quiz mock
        const mockMap = getGuestQuizMap();
        const mockIds = Object.values(mockMap);
        const mockQuizzes = mockIds.map(id => useStore.getState().getGuestQuizById(id)).filter(Boolean);
        setQuizzes(mockQuizzes);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/quiz/community`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không tải được danh sách');
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunityQuizzes();
  }, [token, isGuest]);

  const filteredQuizzes = quizzes.filter(q => 
    (q.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header animate-fadeIn">
        <h1>
          Khám phá <span className="gradient-text">Cộng đồng</span>
        </h1>
        <p style={{ marginTop: '0.5rem' }}>
          Làm bài các Quiz công khai do hệ thống và những người khác tạo.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input 
          className="input" 
          placeholder="Tìm kiếm chủ đề, lĩnh vực..." 
          style={{ flex: 1, border: 'none', background: 'transparent' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Quiz Grid */}
      {loading ? (
        <div className="empty-state">
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <p>Đang tải dữ liệu cộng đồng...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="empty-state animate-fadeIn">
          <BrainCircuit size={36} color="var(--color-primary)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Không tìm thấy Quiz</h3>
          <p>Chưa có quiz nào phù hợp hoặc chưa có ai chia sẻ.</p>
        </div>
      ) : (
        <div className="doc-grid animate-fadeIn">
          {filteredQuizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              className="doc-card"
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              style={{ padding: '1.25rem' }}
            >
              <div className="doc-card-icon default" style={{ marginBottom: '1rem' }}>
                <BookOpen size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {quiz.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-purple">{quiz.num_questions || 0} câu hỏi</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  Độ khó: {quiz.difficulty || 'TB'}
                </span>
              </div>
              <div className="doc-card-actions" style={{ marginTop: 'auto' }}>
                <button 
                  className="btn btn-primary w-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/quiz/${quiz.id}`);
                  }}
                >
                  <Sparkles size={14} /> Làm Bài Ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
