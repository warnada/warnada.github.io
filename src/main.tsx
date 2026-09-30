import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/fredoka/index.css';
import '@fontsource-variable/nunito/index.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/base.css';
import App from './App';
import { initPwa } from './pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>
);
initPwa();
