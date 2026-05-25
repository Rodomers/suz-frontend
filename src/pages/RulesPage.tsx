import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';

export const RulesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, setAuth } = useAuthStore();
  
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [dataAccepted, setDataAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await api.post('/agreements/me');
      if (user) {
        setAuth({ ...user, rules_accepted: true });
      }
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await api.get('/logout');
    } catch (err) {
      console.error(err);
    }
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12">
      <div className="flex flex-col w-full max-w-md gap-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 text-center">{t('auth.rules_title') || 'Соглашение'}</h1>
        
        <p className="text-gray-600 text-center text-sm">
          {t('auth.organization', { name: user.name }) || `Здравствуйте, ${user.name}. Для продолжения работы необходимо принять правила.`}
        </p>
        
        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <label className="flex items-start cursor-pointer">
            <input 
              type="checkbox" 
              checked={rulesAccepted} 
              onChange={(e) => setRulesAccepted(e.target.checked)} 
              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">{t('auth.rules_accept_text') || 'Я согласен с правилами использования системы'}</span>
          </label>
          
          <label className="flex items-start cursor-pointer">
            <input 
              type="checkbox" 
              checked={dataAccepted} 
              onChange={(e) => setDataAccepted(e.target.checked)} 
              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">{t('auth.data_accept_text') || 'Я даю согласие на обработку персональных данных'}</span>
          </label>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button 
            onClick={handleAccept} 
            disabled={!rulesAccepted || !dataAccepted || isLoading}
            className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {t('auth.rules_button_accept') || 'Принять и продолжить'}
          </button>
          <button 
            onClick={handleDecline} 
            disabled={isLoading}
            className="w-full py-2 bg-white text-gray-600 border border-gray-300 font-medium rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('auth.rules_button_decline') || 'Отказаться и выйти'}
          </button>
        </div>
      </div>
    </div>
  );
};