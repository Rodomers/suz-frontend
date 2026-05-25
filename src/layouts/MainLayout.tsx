import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { mapRole } from '../api';

export const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      { path: '/admin', label: t('menu.admin_export'), roles: ['АД', 'СА'] },
      { path: '/admin-data', label: t('menu.admin_data'), roles: ['АД', 'СА'] },
      { path: '/admin-users', label: t('menu.admin_users'), roles: ['АП', 'СА'] },
  ];

  const visibleMenu = menuItems.filter(item => {
    if (!user) return false;
    if (item.path === '/admin-users') return user.is_user_admin || user.is_super_admin;
    if (item.path === '/admin-data') return user.is_data_admin || user.is_super_admin;
    if (item.path === '/admin') return user.is_super_admin;
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
              {i18n.language.toUpperCase()}
            </button>
            <div className="flex items-center space-x-4 border-l border-gray-200 pl-5">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500">{t('layout.role', 'Роль')}: {mapRole(user!)}</span>
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