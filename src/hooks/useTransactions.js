import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, saveTransaction, deleteTransaction } from '../firebase';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    const txs = await getTransactions(user.uid);
    setTransactions(txs);
  };

  const addTransaction = async (transactionData) => {
    const id = Date.now().toString();
    const transaction = {
      id,
      ...transactionData,
      userId: user.uid
    };

    if (transactionData.type === 'trasferimento') {
      const transferId = id;
      const transferOut = {
        ...transaction,
        id: `${transferId}_out`,
        transferId,
        amount: -Math.abs(transactionData.amount)
      };
      const transferIn = {
        ...transaction,
        id: `${transferId}_in`,
        transferId,
        amount: Math.abs(transactionData.amount)
      };

      await saveTransaction(user.uid, transferOut);
      await saveTransaction(user.uid, transferIn);
    } else {
      await saveTransaction(user.uid, transaction);
    }

    await loadTransactions();
  };

  const updateTransaction = async (id, transactionData) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    if (transaction.transferId || id.toString().endsWith('_in') || id.toString().endsWith('_out')) {
      const transferId = transaction.transferId || id.toString().replace('_in', '').replace('_out', '');
      const transferOut = {
        ...transactionData,
        id: `${transferId}_out`,
        transferId,
        amount: -Math.abs(transactionData.amount)
      };
      const transferIn = {
        ...transactionData,
        id: `${transferId}_in`,
        transferId,
        amount: Math.abs(transactionData.amount)
      };

      await saveTransaction(user.uid, transferOut);
      await saveTransaction(user.uid, transferIn);
    } else {
      await saveTransaction(user.uid, {
        ...transactionData,
        id,
        userId: user.uid
      });
    }

    await loadTransactions();
  };

  const deleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    if (transaction.transferId || id.toString().endsWith('_in') || id.toString().endsWith('_out')) {
      const transferId = transaction.transferId || id.toString().replace('_in', '').replace('_out', '');
      await deleteTransaction(user.uid, `${transferId}_out`);
      await deleteTransaction(user.uid, `${transferId}_in`);
    } else {
      await deleteTransaction(user.uid, id);
    }

    await loadTransactions();
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
}; 