import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { mapRole, api } from '../api';

export const MainLayout = () => {
  const currentUser = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accessEnd, setAccessEnd] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      api.get('/users/me')
        .then(res => {
          setAccessEnd(res.data?.access_end || null);
        })
        .catch(() => setAccessEnd(null));
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  const menuItems = [
    { path: '/', label: t('menu.input'), roles: ['П', 'АД', 'АП', 'СА'] },
    { path: '/search', label: t('menu.search'), roles: ['П', 'АД', 'АП', 'СА'] },
    { path: '/queries', label: t('menu.queries'), roles: ['П', 'АД', 'АП', 'СА'] },
    { path: '/control/main-ad-panel', label: t('menu.admin_export'), roles: ['АД', 'СА'] },
    { path: '/control/system-ad-data', label: t('menu.admin_data'), roles: ['АД', 'СА'] },
    { path: '/control/system-ap-users', label: t('menu.admin_users'), roles: ['АП', 'СА'] },
  ];

  const visibleMenu = menuItems.filter(item => {
    if (!currentUser) return false;
    if (item.path === '/control/system-ap-users') return currentUser.is_user_admin || currentUser.is_super_admin;
    if (item.path === '/control/system-ad-data') return currentUser.is_data_admin || currentUser.is_super_admin;
    if (item.path === '/control/main-ad-panel') return currentUser.is_super_admin;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-700 tracking-tight">{t('common.app_name', 'СУЗ')}</span>
        </div>
        <nav className="p-4 space-y-1">
          {visibleMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 z-10 shadow-sm">
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:block"></div>

          <div className="flex items-center space-x-5 ml-auto">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 text-xs font-semibold tracking-wider text-gray-600 uppercase bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {(i18n.language || 'ru').toUpperCase()}
            </button>

            {accessEnd && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md border border-slate-200/60">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {t('layout.access_until', 'Доступ до:')} {new Date(accessEnd).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-4 border-l border-gray-200 pl-5">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">{currentUser?.name}</span>
                <span className="text-xs text-gray-500">{t('layout.role', 'Роль')}: {currentUser ? mapRole(currentUser) : ''}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                {t('auth.logout', 'Выйти')}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};