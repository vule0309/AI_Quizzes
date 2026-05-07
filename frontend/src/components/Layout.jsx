import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, BrainCircuit, BookOpen } from 'lucide-react';
import useStore from '../store';

export default function Layout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const initials = user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BrainCircuit size={20} color="#fff" />
          </div>
          <span className="sidebar-logo-text">AI Quizzes</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('docs-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <FileText size={18} />
            Tài liệu
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <BookOpen size={18} />
            Cộng đồng
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.email || 'Guest'}</div>
              <div className="sidebar-user-role">Học viên</div>
            </div>
          </div>
          <button
            className="btn btn-ghost w-full"
            style={{ marginTop: '0.5rem', justifyContent: 'flex-start', gap: '0.5rem' }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
