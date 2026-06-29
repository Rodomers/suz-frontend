// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { useAuthStore } from '../store/useAuthStore';
// import { api } from '../api';

// export const RulesPage = () => {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { user, logout, setAuth } = useAuthStore();
  
//   const [rulesAccepted, setRulesAccepted] = useState(false);
//   const [dataAccepted, setDataAccepted] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleAccept = async () => {
//     setIsLoading(true);
//     try {
//       await api.post('/agreements/me');
//       if (user) {
//         setAuth({ ...user, rules_accepted: true });
//       }
//       navigate('/');
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDecline = async () => {
//     try {
//       await api.get('/logout');
//     } catch (err) {
//       console.error(err);
//     }
//     logout();
//     navigate('/login');
//   };

//   if (!user) return null;

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12">
//       <div className="flex flex-col w-full max-w-md gap-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
//         <h1 className="text-2xl font-bold text-gray-800 text-center">{t('auth.rules_title') || 'Соглашение'}</h1>
        
//         <p className="text-gray-600 text-center text-sm">
//           {t('auth.organization', { name: user.name }) || `Здравствуйте, ${user.name}. Для продолжения работы необходимо принять правила.`}
//         </p>
        
//         <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
//           <label className="flex items-start cursor-pointer">
//             <input 
//               type="checkbox" 
//               checked={rulesAccepted} 
//               onChange={(e) => setRulesAccepted(e.target.checked)} 
//               className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//             />
//             <span className="ml-3 text-sm text-gray-700">{t('auth.rules_accept_text') || 'Я согласен с правилами использования системы'}</span>
//           </label>
          
//           <label className="flex items-start cursor-pointer">
//             <input 
//               type="checkbox" 
//               checked={dataAccepted} 
//               onChange={(e) => setDataAccepted(e.target.checked)} 
//               className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//             />
//             <span className="ml-3 text-sm text-gray-700">{t('auth.data_accept_text') || 'Я даю согласие на обработку персональных данных'}</span>
//           </label>
//         </div>

//         <div className="flex flex-col gap-3 mt-2">
//           <button 
//             onClick={handleAccept} 
//             disabled={!rulesAccepted || !dataAccepted || isLoading}
//             className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
//           >
//             {t('auth.rules_button_accept') || 'Принять и продолжить'}
//           </button>
//           <button 
//             onClick={handleDecline} 
//             disabled={isLoading}
//             className="w-full py-2 bg-white text-gray-600 border border-gray-300 font-medium rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
//           >
//             {t('auth.rules_button_decline') || 'Отказаться и выйти'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';

export const RulesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [organization, setOrganization] = useState('');
  
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedPersonalData, setAcceptedPersonalData] = useState(false);
  const [rulesUrl, setRulesUrl] = useState('https://example.com/rules');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/rules-link')
      .then(res => setRulesUrl(res.data?.rules_url || 'https://example.com/rules'))
      .catch(() => {});

    if (currentUser) {
      setFullName((currentUser as any).full_name || currentUser.name || '');
      setJobTitle((currentUser as any).position || '');
      setOrganization((currentUser as any).organization || '');
    } else {
      api.get('/users/me')
        .then(res => {
          setFullName(res.data.full_name || '');
          setJobTitle(res.data.position || '');
          setOrganization(res.data.organization || '');
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedRules || !acceptedPersonalData) return;
    setIsLoading(true);
    setError('');

    try {
      await api.post('/agreements/me', {
        full_name: fullName.trim() || '—',
        job_title: jobTitle.trim() || '—',
        organization: organization.trim() || '—',
        accepted_rules: true,
        accepted_personal_data: true
      });

      if (currentUser) {
        setAuth({ ...currentUser, rules_accepted: true });
      }
      navigate('/');
    } catch (_) {
      setError('Не удалось сохранить согласие. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Правила системы</h2>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 text-center">{error}</div>}

        <form onSubmit={handleProceed} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder={t('auth.full_name_placeholder', 'ФИО')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder={t('auth.position_placeholder', 'Должность')}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder={t('auth.organization_placeholder', 'Организация')}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <span className="text-xs text-gray-600 leading-tight">
                Я ознакомлен и принял{' '}
                <a href={rulesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                  правила работы системы
                </a>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedPersonalData}
                onChange={(e) => setAcceptedPersonalData(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <span className="text-xs text-gray-600 leading-tight">
                Ознакомлен и согласен с использованием персональных данных.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !acceptedRules || !acceptedPersonalData}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            {isLoading ? 'Сохранение...' : 'Перейти к работе'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            Прекратить работу
          </button>
        </form>
      </div>
    </div>
  );
};