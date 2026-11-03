import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/tema.css';
import './styles/conta.css';
import './styles/pedidos.css';
import PaginaPedidos from './pages/PaginaPedidos.jsx';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <PaginaPedidos />
  </StrictMode>
);
