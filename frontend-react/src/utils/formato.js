export const brl = valor =>
  Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dataHora = ms =>
  new Date(ms).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

export const totalDeItens = itens => itens.reduce((n, [, qtd]) => n + qtd, 0);

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
