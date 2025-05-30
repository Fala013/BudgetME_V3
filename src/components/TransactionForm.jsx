import { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';

export const TransactionForm = ({ transaction, onClose }) => {
  const { addTransaction, updateTransaction } = useTransactions();
  const [formData, setFormData] = useState({
    type: 'entrata',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    account: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: Math.abs(transaction.amount).toString(),
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        account: transaction.account
      });
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const transactionData = {
      ...formData,
      amount: formData.type === 'entrata' ? amount : -amount,
      date: formData.date
    };

    if (transaction) {
      await updateTransaction(transaction.id, transactionData);
    } else {
      await addTransaction(transactionData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
          <option value="trasferimento">Trasferimento</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Importo</label>
        <input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descrizione</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Categoria</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Data</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Conto</label>
        <input
          type="text"
          value={formData.account}
          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annulla
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          {transaction ? 'Modifica' : 'Aggiungi'}
        </button>
      </div>
    </form>
  );
}; 