import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/tema.css';
import './styles/conta.css';
import { ContaProvider } from './context/ContaContext.jsx';
import PaginaMinhaConta from './pages/PaginaMinhaConta.jsx';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <ContaProvider>
      <PaginaMinhaConta />
    </ContaProvider>
  </StrictMode>
);
