import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { api, mapUser } from '../api';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const translate = useCallback((key: string, fallback: string) => {
    const val = t(key);
    return val === key || !val ? fallback : val;
  }, [t]);

  const loadCaptcha = useCallback(async () => {
    try {
      const response = await api.get('/captcha/image', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setCaptchaUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setError(translate('auth.error_captcha_load', 'Ошибка загрузки капчи'));
    }
  }, [translate]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  useEffect(() => {
    return () => {
      if (captchaUrl) URL.revokeObjectURL(captchaUrl);
    };
  }, [captchaUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const params = new URLSearchParams();
    params.append('username', email);
    params.append('login', email);
    params.append('email', email);
    params.append('password', password);
    params.append('captcha_code', captchaCode);
    params.append('captcha', captchaCode);

    try {
      await api.post('/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (_) {
      setError(translate('auth.error_invalid_credentials', 'Неверный логин, пароль или код с картинки'));
      setCaptchaCode('');
      loadCaptcha();
      setIsLoading(false);
      return;
    }

    try {
      const userRes = await api.get('/users/me');
      
      let rulesAccepted = false;
      try {
        const agreementRes = await api.get('/agreements/me');
        if (agreementRes.data) {
          rulesAccepted = true;
        }
      } catch (err) {
        if (isAxiosError(err) && err.response?.status !== 404) {
          throw err;
        } else if (!isAxiosError(err)) {
          throw err;
        }
      }

      const mappedUser = mapUser(userRes.data, rulesAccepted);
      setAuth(mappedUser);
      
      if (!rulesAccepted) {
        navigate('/rules');
      } else {
        navigate('/');
      }
    } catch (_) {
      setError('Вход выполнен, но не удалось получить профиль (ошибка авторизации сессии/CORS)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container flex justify-center items-center h-screen bg-gray-50">
      <style>{`
        .login-page-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100vw;
          background-color: #f9fafb;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .login-card {
          display: flex;
          flex-direction: column;
          width: 340px;
          gap: 16px;
          background-color: #ffffff;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }
        .login-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          margin-bottom: 8px;
          margin-top: 0;
        }
        .login-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          outline: none;
          font-size: 14px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          background-color: #ffffff;
          color: #1f2937;
          width: 100%;
          box-sizing: border-box;
        }
        .login-input::-ms-reveal,
        .login-input::-ms-clear {
          display: none;
        }
        .login-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .password-input {
          padding-right: 40px !important;
        }
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: color 0.15s ease-in-out;
        }
        .password-toggle-btn:hover {
          color: #4b5563;
        }
        .password-toggle-btn svg {
          width: 20px;
          height: 20px;
        }
        .error-message {
          font-size: 13px;
          color: #dc2626;
          background-color: #fef2f2;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #fecaca;
          text-align: center;
        }
        .captcha-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .captcha-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f3f4f6;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          cursor: pointer;
          height: 64px;
          transition: border-color 0.15s ease-in-out;
        }
        .captcha-image-container:hover {
          border-color: #9ca3af;
        }
        .captcha-image-container img {
          height: 100%;
          width: 100%;
          object-fit: fill;
        }
        .login-button {
          padding: 10px;
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out;
          margin-top: 8px;
        }
        .login-button:hover:not(:disabled) {
          background-color: #1d4ed8;
        }
        .login-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="login-card flex flex-col w-80 gap-4 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="login-title text-2xl font-bold text-gray-800 text-center mb-2">
          {translate('auth.login_title', 'Вход в систему')}
        </h2>
        
        {error && <div className="error-message text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>}

        <input
          type="text"
          placeholder={translate('auth.email_placeholder', 'Логин (Email)')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={translate('auth.password_placeholder', 'Пароль')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input password-input"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        <div className="captcha-wrapper flex flex-col gap-2">
          <div className="captcha-image-container flex justify-between items-center bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-pointer" onClick={loadCaptcha} title="Нажмите, чтобы обновить">
            {captchaUrl ? (
              <img src={captchaUrl} alt="Captcha" />
            ) : (
              <div style={{color: '#9ca3af', fontSize: '13px'}}>{translate('auth.loading', 'Загрузка...')}</div>
            )}
          </div>
          <input
            type="text"
            placeholder={translate('auth.captcha_placeholder', 'Код с картинки')}
            value={captchaCode}
            onChange={(e) => setCaptchaCode(e.target.value)}
            required
            className="login-input uppercase"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !captchaUrl}
          className="login-button py-2 text-white rounded font-medium transition-colors mt-2"
        >
          {isLoading ? translate('auth.loading', 'Вход...') : translate('auth.login_button', 'Войти')}
        </button>
      </form>
    </div>
  );
};