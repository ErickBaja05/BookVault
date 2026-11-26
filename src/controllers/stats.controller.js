const bookRepository = require('../repositories/book.repository');
const clientRepository = require('../repositories/client.repository');
const loanRepository = require('../repositories/loan.repository');

module.exports = {
  getStats(_req, res) {
    const inventory = bookRepository.getInventorySummary();
    const loans = loanRepository.countByStatus();
    const clientsCount = clientRepository.countAll();

    res.json({
      booksCount: inventory.total_titulos,
      totalCopies: inventory.total_ejemplares,
      availableCopies: inventory.copias_disponibles,
      activeLoans: loans.active_count,
      returnedLoans: loans.returned_count,
      clientsCount,
    });
  },
};
