// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { RouterProvider } from 'react-router-dom';
// import { I18nextProvider } from 'react-i18next';
// import { router } from './routes';
// import i18n from './i18n';
// import './index.css';

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <I18nextProvider i18n={i18n}>
//       <RouterProvider router={router} />
//     </I18nextProvider>
//   </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18n from './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);