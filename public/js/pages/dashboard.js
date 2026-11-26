/* ==========================================================================
   Panel Principal (index.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.BookVaultStore;
  const ui = window.BookVaultUI;
  if (!store || !ui) return;

  const booksEl = document.getElementById('stat-books');
  const booksMetaEl = document.getElementById('stat-books-meta');
  const loansEl = document.getElementById('stat-loans');
  const loansMetaEl = document.getElementById('stat-loans-meta');
  const clientsEl = document.getElementById('stat-clients');
  const clientsMetaEl = document.getElementById('stat-clients-meta');
  const alertBox = document.getElementById('dashboard-alert');

  try {
    const stats = await store.getStats();

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
  } catch (error) {
    ui.showAlert(
      alertBox,
      'danger',
      ui.getErrorMessage(error, 'No se pudo cargar el resumen de la biblioteca.'),
    );
  }
});
