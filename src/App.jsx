import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { loginUser, registerUser, logoutUser } from './firebase';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                    >
                      {isLogin ? 'Accedi' : 'Registrati'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                    </button>
                  </div>
                </form>

                <div className="mt-4">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Nuova Transazione
                  </button>
                </div>

                {showForm && (
                  <div className="mt-4">
                    <TransactionForm
                      transaction={editingTransaction}
                      onClose={() => {
                        setShowForm(false);
                        setEditingTransaction(null);
                      }}
                    />
                  </div>
                )}

                <TransactionList onEdit={handleEdit} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 