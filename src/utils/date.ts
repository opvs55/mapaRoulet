export const timeSince = (date: Date): string => {
  const now = new Date();
  
  const isToday = now.getFullYear() === date.getFullYear() &&
                now.getMonth() === date.getMonth() &&
                now.getDate() === date.getDate();

  if (isToday) {
    // Formato "HH:mm", ex: "14:30"
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  
  const isThisYear = now.getFullYear() === date.getFullYear();

  if (isThisYear) {
      // Formato "DD/MM", ex: "25/05"
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  // Formato "DD/MM/AA", ex: "25/05/23"
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
