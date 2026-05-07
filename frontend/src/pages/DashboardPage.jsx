import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, File,
  Loader2, Sparkles, Clock, Trash2
} from 'lucide-react';
import useStore, { API_BASE } from '../store';

function getFileIcon(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { icon: <FileText size={22} />, cls: 'pdf' };
  if (ext === 'docx' || ext === 'doc') return { icon: <File size={22} />, cls: 'docx' };
  if (ext === 'txt') return { icon: <File size={22} />, cls: 'txt' };
  return { icon: <FileText size={22} />, cls: 'default' };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export default function DashboardPage() {
  const { documents, documentsLoading, fetchDocuments, token } = useStore();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Chỉ fetch nếu chưa có dữ liệu
    if (documents.length === 0) {
      fetchDocuments();
    }
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload thất bại');
      setUploadSuccess(`✅ Đã upload "${file.name}" thành công!`);
      await fetchDocuments(true);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!confirm('Xoá tài liệu này? Hành động không thể hoàn tác.')) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error('Xoá thất bại');
      await fetchDocuments(true);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  return (
    <>
      <div className="page-header animate-fadeIn">
        <h1>
          Tài liệu học tập{' '}
          <span className="gradient-text">của bạn</span>
        </h1>
        <p style={{ marginTop: '0.5rem' }}>
          Upload tài liệu và để AI tạo Quiz &amp; Flashcard cho bạn.
        </p>
      </div>

      {/* Alerts */}
      {uploadError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          ⚠️ {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {uploadSuccess}
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-zone-icon">
          {uploading
            ? <Loader2 size={28} className="animate-spin" />
            : <Upload size={28} />
          }
        </div>
        <h3>{uploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để upload'}</h3>
        <p>Hỗ trợ PDF, DOCX, TXT &middot; Tối đa 10MB</p>
        <button
          className="btn btn-primary"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          disabled={uploading}
        >
          <Upload size={16} />
          Chọn file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Documents Grid */}
      <div id="docs-section">
        {documentsLoading && documents.length === 0 ? (
          <div className="empty-state">
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p>Đang tải tài liệu...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state animate-fadeIn">
            <div className="empty-state-icon">
              <FileText size={36} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Chưa có tài liệu nào</h3>
            <p>Upload tài liệu đầu tiên của bạn để bắt đầu học!</p>
          </div>
        ) : (
          <div className="doc-grid animate-fadeIn">
            {documents.map((doc) => {
              const name = doc.file_name || doc.filename || 'Tài liệu';
              const { icon, cls } = getFileIcon(name);
              return (
                <div
                  key={doc.id}
                  className="doc-card"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className={`doc-card-icon ${cls}`}>{icon}</div>
                  <div className="doc-card-title">{name}</div>
                  <div className="doc-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatDate(doc.created_at)}
                    </span>
                    {doc.status && doc.status !== 'ready' && (
                      <span style={{
                        fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4,
                        background: 'rgba(239,68,68,0.15)', color: 'var(--color-error)',
                      }}>
                        ⚠ {doc.status}
                      </span>
                    )}
                  </div>
                  <div className="doc-card-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/documents/${doc.id}`);
                      }}
                    >
                      <Sparkles size={13} />
                      Mở
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => handleDelete(e, doc.id)}
                      disabled={deletingId === doc.id}
                      style={{ color: 'var(--color-error)', padding: '0 6px' }}
                      title="Xoá tài liệu"
                    >
                      {deletingId === doc.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
