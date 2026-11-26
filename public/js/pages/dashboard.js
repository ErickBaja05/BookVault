/* ==========================================================================
   Panel Principal (index.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.BookVaultStore;
  if (!store) return;

  const stats = store.getStats();

  const booksEl = document.getElementById('stat-books');
  const booksMetaEl = document.getElementById('stat-books-meta');
  const loansEl = document.getElementById('stat-loans');
  const loansMetaEl = document.getElementById('stat-loans-meta');
  const clientsEl = document.getElementById('stat-clients');
  const clientsMetaEl = document.getElementById('stat-clients-meta');

  if (booksEl) booksEl.textContent = String(stats.booksCount);
  if (booksMetaEl) {
    booksMetaEl.textContent = `${stats.availableCopies} de ${stats.totalCopies} ejemplares disponibles`;
  }

  if (loansEl) loansEl.textContent = String(stats.activeLoans);
  if (loansMetaEl) {
    loansMetaEl.textContent = `${stats.returnedLoans} préstamos devueltos en historial`;
  }

  if (clientsEl) clientsEl.textContent = String(stats.clientsCount);
  if (clientsMetaEl) {
    clientsMetaEl.textContent = 'Lectores habilitados en la biblioteca';
  }
});
