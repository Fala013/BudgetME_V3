import { useState, useEffect } from 'react';
import { auth, logoutUser, getTransactions, saveTransaction, deleteTransaction, getAccounts, saveAccount, deleteAccount, getCategories, saveCategories } from './firebase';
import Login from './components/Login';

const repeatOptions = [
    { value: 'nessuna', label: 'Non ripetere' },
    { value: 'giornaliera', label: 'Ogni giorno' },
    { value: 'settimanale', label: 'Ogni settimana' },
    { value: 'mensile', label: 'Ogni mese' },
    { value: 'trimestrale', label: 'Ogni 3 mesi' },
    { value: 'semestrale', label: 'Ogni 6 mesi' },
    { value: 'annuale', label: 'Ogni anno' }
];

const FILTERS = [
    { key: 'tutti', label: 'Tutti' },
    { key: 'ricorrenti', label: 'Ricorrenti' },
    { key: 'entrate', label: 'Entrate' },
    { key: 'uscite', label: 'Uscite' },
];

const ICONS = {
    add: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    search: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
            <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    close: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    edit: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2L18 6L6 18H2V14L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    delete: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H17M8 6V4C8 3.44772 8.44772 3 9 3H11C11.5523 3 12 3.44772 12 4V6M14 6V16C14 16.5523 13.5523 17 13 17H7C6.44772 17 6 16.5523 6 16V6H14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    logout: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 7L17 11M17 11L13 15M17 11H8M8 3H7C5.89543 3 5 3.89543 5 5V15C5 16.1046 5.89543 17 7 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
};

// Utility per convertire Firestore Timestamp o stringa in Date
function toDate(dateOrTimestamp) {
    if (!dateOrTimestamp) return null;
    if (typeof dateOrTimestamp === 'object' && 'seconds' in dateOrTimestamp) {
        // Firestore Timestamp
        return new Date(dateOrTimestamp.seconds * 1000);
    }
    // Stringa ISO o Date
    return new Date(dateOrTimestamp);
}

// Utility per ottenere una stringa data YYYY-MM-DD da vari tipi di oggetto
function getDateString(d) {
    if (!d) return '';
    if (d instanceof Date) return d.toLocaleDateString('sv-SE');
    if (typeof d === 'string') return new Date(d).toLocaleDateString('sv-SE');
    if (typeof d === 'object' && 'seconds' in d) return new Date(d.seconds * 1000).toLocaleDateString('sv-SE');
    return '';
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [accountForm, setAccountForm] = useState({ name: '', balance: '' });
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: categories[0],
        type: 'entrata',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        repeat: 'nessuna',
        account: '',
        endDate: '',
        destinationAccount: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [filter, setFilter] = useState('tutti');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [showTime, setShowTime] = useState(!!form.time);
    const [editingAccountId, setEditingAccountId] = useState(null);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [deleteAccountId, setDeleteAccountId] = useState(null);
    const [accountFilter, setAccountFilter] = useState('');
    const [selectedTx, setSelectedTx] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryTx, setCategoryTx] = useState([]);
    const [searchDescription, setSearchDescription] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
    const [deleteCategory, setDeleteCategory] = useState(null);

    // Descrizioni uniche per suggerimenti autocomplete
    const uniqueDescriptions = [...new Set(transactions.map(tx => tx.description).filter(Boolean))];

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                // Carica dati da Firestore
                const txs = await getTransactions(user.uid);
                setTransactions(txs);
                const accs = await getAccounts(user.uid);
                setAccounts(accs);
                const cats = await getCategories(user.uid);
                setCategories(cats);
            } else {
                setTransactions([]);
                setAccounts([]);
                setCategories([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Salva su Firestore ogni volta che cambia transactions/accounts/categories
    useEffect(() => {
        if (user) {
            transactions.forEach(tx => saveTransaction(user.uid, tx));
        }
    }, [transactions, user]);

    useEffect(() => {
        if (user) {
            accounts.forEach(acc => saveAccount(user.uid, acc));
        }
    }, [accounts, user]);

    useEffect(() => {
        if (user && categories.length > 0) {
            saveCategories(user.uid, categories);
        }
    }, [categories, user]);

    const resetForm = () => setForm({
        description: '',
        amount: '',
        category: categories[0],
        type: 'entrata',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        repeat: 'nessuna',
        account: '',
        endDate: '',
        destinationAccount: ''
    });

    const handleKeyPress = (e, action) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    const handleAddAccount = async () => {
        try {
            if (!accountForm.name.trim()) {
                throw new Error('Il nome del conto è obbligatorio');
            }
            const normalizedBalance = accountForm.balance.replace(',', '.');
            if (isNaN(parseFloat(normalizedBalance))) {
                throw new Error('Il saldo iniziale deve essere un numero valido');
            }
            let newAccount;
            if (editingAccountId) {
                newAccount = { ...accounts.find(a => a.id === editingAccountId), name: accountForm.name.trim(), balance: parseFloat(normalizedBalance) };
                setAccounts(accounts.map(a => a.id === editingAccountId ? newAccount : a));
                setEditingAccountId(null);
            } else {
                newAccount = { id: Date.now(), name: accountForm.name.trim(), balance: parseFloat(normalizedBalance) };
                setAccounts([
                    ...accounts,
                    newAccount
                ]);
            }
            await saveAccount(user.uid, newAccount);
            setAccountForm({ name: '', balance: '' });
            setShowAccountModal(false);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAddOrEdit = async () => {
        console.log('DEBUG - handleAddOrEdit chiamata', form);
        setIsLoading(true);
        try {
            const normalizedAmount = form.amount.replace(',', '.');
            // Ricavo il transferId anche se la transazione è vecchia e non ha il campo transferId
            let transferId = editingId && transactions.find(t => t.id === editingId)?.transferId;
            if (!transferId && editingId && editingId.toString().endsWith('_in')) {
                transferId = editingId.toString().replace('_in', '');
            } else if (!transferId && editingId && editingId.toString().endsWith('_out')) {
                transferId = editingId.toString().replace('_out', '');
            }
            console.log('DEBUG - transferId calcolato:', transferId);
            if (form.type === 'trasferimento') {
                if (!transferId) transferId = Date.now();
                // Se stai modificando un trasferimento esistente, mantieni gli id originali
                let oldTxs = transactions.filter(t => t.transferId === transferId);
                // Se non trova nulla, cerca tramite id base (per vecchi trasferimenti)
                if (oldTxs.length === 0) {
                    const baseId = transferId.toString();
                    oldTxs = transactions.filter(t => t.id === baseId + '_in' || t.id === baseId + '_out');
                }
                let outId = transferId + '_out';
                let inId = transferId + '_in';
                // Se trova 2 transazioni, aggiorna entrambe indipendentemente dal type
                if (oldTxs.length === 2) {
                    outId = oldTxs[0].id.endsWith('_out') ? oldTxs[0].id : oldTxs[1].id;
                    inId = oldTxs[0].id.endsWith('_in') ? oldTxs[0].id : oldTxs[1].id;
                } else {
                    if (editingId && editingId.toString().endsWith('_out')) outId = editingId;
                    if (editingId && editingId.toString().endsWith('_in')) inId = editingId;
                }
                const oldOut = oldTxs.find(t => t.id === outId);
                const oldIn = oldTxs.find(t => t.id === inId);
                console.log('DEBUG - Modifica trasferimento:', {
                    editingId,
                    transferId,
                    outId,
                    inId,
                    oldTxs,
                    oldOut,
                    oldIn
                });
                // Sincronizza categoria, data e orario tra entrata e uscita
                const sharedFields = {
                    category: form.category,
                    date: form.date,
                    time: form.time,
                    repeat: form.repeat,
                    endDate: form.endDate,
                };
                const transferOut = {
                    ...form,
                    ...sharedFields,
                    id: outId,
                    amount: normalizedAmount,
                    type: 'uscita',
                    description: `Trasferimento a ${form.destinationAccount}`,
                    account: form.account,
                    transferId,
                };
                const transferIn = {
                    ...form,
                    ...sharedFields,
                    id: inId,
                    amount: normalizedAmount,
                    type: 'entrata',
                    description: `Trasferimento da ${form.account}`,
                    account: form.destinationAccount,
                    transferId,
                };
                console.log('DEBUG - Salvo transferOut:', transferOut);
                console.log('DEBUG - Salvo transferIn:', transferIn);
                setTransactions(prev => [
                    ...prev.filter(t =>
                        !(t.transferId === transferId ||
                          t.id === transferId + '_in' ||
                          t.id === transferId + '_out')
                    ),
                    transferOut,
                    transferIn
                ]);
                await saveTransaction(user.uid, transferOut);
                await saveTransaction(user.uid, transferIn);
                // Refresh forzato delle transazioni dopo il salvataggio
                const txs = await getTransactions(user.uid);
                console.log('DEBUG - Lista transazioni dopo salvataggio:', txs);
                setTransactions(txs);
            } else {
                const updated = {
                    ...form,
                    amount: normalizedAmount,
                    time: showTime ? form.time : '',
                    id: editingId ?? Date.now()
                };
                if (editingId) {
                    setTransactions(transactions.map(t => t.id === editingId ? updated : t));
                } else {
                    setTransactions([updated, ...transactions]);
                }
                await saveTransaction(user.uid, updated);
            }
            resetForm();
            setShowModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (id) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            // Forza sempre type: 'trasferimento' se id termina con _in/_out o descrizione inizia con 'Trasferimento'
            const isTransfer = tx.transferId || id.toString().endsWith('_in') || id.toString().endsWith('_out') || (tx.description && tx.description.toLowerCase().startsWith('trasferimento'));
            if (isTransfer) {
                // Cerca comunque le due transazioni collegate
                let transferId = tx.transferId;
                if (!transferId && id.toString().endsWith('_in')) transferId = id.toString().replace('_in', '');
                if (!transferId && id.toString().endsWith('_out')) transferId = id.toString().replace('_out', '');
                let allTx = transactions.filter(t => t.transferId === transferId);
                if (allTx.length === 0) {
                    allTx = transactions.filter(t => t.id === transferId + '_in' || t.id === transferId + '_out');
                }
                const outTx = allTx.find(t => t.id.endsWith('_out'));
                const inTx = allTx.find(t => t.id.endsWith('_in'));
                setForm({
                    description: outTx ? outTx.description : tx.description,
                    amount: outTx ? outTx.amount : tx.amount,
                    category: outTx ? outTx.category : tx.category,
                    type: 'trasferimento',
                    date: outTx ? outTx.date : tx.date,
                    time: outTx ? outTx.time : tx.time,
                    repeat: outTx ? outTx.repeat : 'nessuna',
                    account: outTx ? outTx.account : tx.account,
                    endDate: outTx ? outTx.endDate : '',
                    destinationAccount: inTx ? inTx.account : '',
                });
                setEditingId(outTx ? outTx.id : tx.id);
            } else {
                setForm(tx);
                setEditingId(id);
            }
            setShowModal(true);
        }
    };

    const handleDeleteRequest = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        const txToDelete = transactions.find(t => t.id === deleteId);
        if (txToDelete && txToDelete.transferId) {
            // Elimina tutte le transazioni con lo stesso transferId
            const toDelete = transactions.filter(t => t.transferId === txToDelete.transferId);
            setTransactions(transactions.filter(t => t.transferId !== txToDelete.transferId));
            for (const tx of toDelete) {
                await deleteTransaction(user.uid, tx.id);
            }
        } else {
        setTransactions(transactions.filter(t => t.id !== deleteId));
        await deleteTransaction(user.uid, deleteId);
        }
        setDeleteId(null);
        setShowDeleteModal(false);
    };

    const handleDeleteCancel = () => {
        setDeleteId(null);
        setShowDeleteModal(false);
    };

    const handleEditAccount = (id) => {
        const acc = accounts.find(a => a.id === id);
        if (acc) {
            setAccountForm({ name: acc.name, balance: acc.balance.toString() });
            setEditingAccountId(id);
            setShowAccountModal(true);
        }
    };

    const handleDeleteAccountRequest = (id) => {
        setDeleteAccountId(id);
        setShowDeleteAccountModal(true);
    };

    const handleDeleteAccountConfirm = async () => {
        setAccounts(accounts.filter(a => a.id !== deleteAccountId));
        await deleteAccount(user.uid, deleteAccountId);
        setShowDeleteAccountModal(false);
        setDeleteAccountId(null);
    };

    const handleDeleteAccountCancel = () => {
        setShowDeleteAccountModal(false);
        setDeleteAccountId(null);
    };

    const formatAmount = (amount, type = null) => {
        const value = parseFloat(amount);
        if (type === 'entrata') return `+${value.toFixed(2).replace('.', ',')}`;
        if (type === 'uscita') return `-${value.toFixed(2).replace('.', ',')}`;
        return value >= 0 ? `+${value.toFixed(2).replace('.', ',')}` : `${value.toFixed(2).replace('.', ',')}`;
    };

    const getDisplayDate = (tx, currentYear, currentMonth) => {
        if (!tx.date) return null;

        const originalDate = new Date(tx.date);
        const originalDay = originalDate.getDate();
        const originalWeekday = originalDate.getDay();

        // Se c'è endDate e la data generata è dopo endDate, non mostrare la ricorrenza
        if (tx.endDate) {
            const endDate = new Date(tx.endDate);
            // Per ogni tipo di ricorrenza, calcoliamo la data che verrebbe generata
            let candidateDate = null;
            if (tx.repeat === 'giornaliera') {
                candidateDate = new Date(currentYear, currentMonth, 1);
            } else if (tx.repeat === 'settimanale') {
                const firstOfMonth = new Date(currentYear, currentMonth, 1);
                candidateDate = new Date(firstOfMonth);
                const dayDiff = (originalWeekday - candidateDate.getDay() + 7) % 7;
                candidateDate.setDate(candidateDate.getDate() + dayDiff);
            } else if (tx.repeat === 'mensile' || tx.repeat === 'trimestrale' || tx.repeat === 'semestrale' || tx.repeat === 'annuale') {
                const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                const day = Math.min(originalDay, lastDay);
                candidateDate = new Date(currentYear, currentMonth, day);
            }
            if (candidateDate && candidateDate > endDate) {
                return null;
            }
        }

        if (tx.repeat === 'nessuna') return originalDate;

        if (tx.repeat === 'giornaliera') {
            return new Date(currentYear, currentMonth, 1);
        }

        if (tx.repeat === 'settimanale') {
            const firstOfMonth = new Date(currentYear, currentMonth, 1);
            let displayDate = new Date(firstOfMonth);
            const dayDiff = (originalWeekday - displayDate.getDay() + 7) % 7;
            displayDate.setDate(displayDate.getDate() + dayDiff);
            const lastOfMonth = new Date(currentYear, currentMonth + 1, 0);
            if (displayDate > lastOfMonth) return null;
            return displayDate;
        }

        if (tx.repeat === 'mensile') {
            const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
            const day = Math.min(originalDay, lastDay);
            return new Date(currentYear, currentMonth, day);
        }

        if (tx.repeat === 'trimestrale') {
            const originalMonth = originalDate.getMonth();
            const monthsDiff = (currentYear - originalDate.getFullYear()) * 12 + (currentMonth - originalMonth);
            if (monthsDiff % 3 === 0 && monthsDiff >= 0) {
                const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                const day = Math.min(originalDay, lastDay);
                return new Date(currentYear, currentMonth, day);
            }
            return null;
        }

        if (tx.repeat === 'semestrale') {
            const originalMonth = originalDate.getMonth();
            const monthsDiff = (currentYear - originalDate.getFullYear()) * 12 + (currentMonth - originalMonth);
            if (monthsDiff % 6 === 0 && monthsDiff >= 0) {
                const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                const day = Math.min(originalDay, lastDay);
                return new Date(currentYear, currentMonth, day);
            }
            return null;
        }

        if (tx.repeat === 'annuale') {
            if (currentMonth === originalDate.getMonth() && currentYear >= originalDate.getFullYear()) {
                const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                const day = Math.min(originalDay, lastDay);
                return new Date(currentYear, currentMonth, day);
            }
            return null;
        }

        return null;
    };

    // Trova override per una ricorrenza in una data specifica
    const findOverride = (recurringId, date) => {
        return transactions.find(tx => tx.parentRecurringId === recurringId && tx.date === date);
    };

    const filteredTransactions = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const startOfCurrentMonth = new Date(year, month, 1);
        const endOfCurrentMonth = new Date(year, month + 1, 0);

        // 1. Genera tutte le transazioni virtuali (ricorrenze)
        let txs = transactions
            .map(tx => {
                const displayDate = getDisplayDate(tx, year, month);
                return { ...tx, displayDate };
            })
            .filter(tx => {
                if (!tx.displayDate) return false;
                if (tx.repeat !== 'nessuna') {
                    const originalDate = new Date(tx.date);
                    if (
                        tx.displayDate.getFullYear() < originalDate.getFullYear() ||
                        (tx.displayDate.getFullYear() === originalDate.getFullYear() && tx.displayDate.getMonth() < originalDate.getMonth())
                    ) {
                        return false;
                    }
                }
                return tx.displayDate >= startOfCurrentMonth && tx.displayDate <= endOfCurrentMonth;
            });

        // 2. Gestione override: aggiungi gli override SOLO nel mese/anno corrente
        const overrides = transactions.filter(tx => {
            if (!tx.parentRecurringId) return false;
            const displayDate = getDisplayDate(tx, year, month);
            if (!displayDate) return false;
            // Mostra solo se la data è nel mese/anno corrente
            const dateStr = getDateString(displayDate);
            return dateStr.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`;
        }).map(ovr => ({ ...ovr, displayDate: getDisplayDate(ovr, year, month) }));

        // Nuova logica: se esiste un override per una ricorrenza in questo mese, non mostrare nessuna rata ricorrente di quella serie per questo mese
        const overrideRecurringIds = new Set(overrides.map(ovr => ovr.parentRecurringId));
        txs = txs.filter(tx => {
            if (tx.repeat === 'nessuna') return true;
            // Se c'è un override per questa ricorrenza in questo mese, non mostrare la rata (virtuale o originale)
            if (overrideRecurringIds.has(tx.id)) {
                return false;
            }
            return true;
        });

        // 3. Costruisci una mappa per evitare duplicati: key = recurringId + date
        const txMap = new Map();
        // Prima inserisci tutte le ricorrenze
        txs.forEach(tx => {
            let key = '';
            if (tx.repeat !== 'nessuna') {
                key = tx.id + '_' + getDateString(tx.displayDate);
            } else if (tx.transferId) {
                // Per i trasferimenti, includi anche il tipo per evitare sovrapposizioni
                key = tx.transferId + '_' + tx.type + '_' + getDateString(tx.displayDate);
            } else {
                key = (tx.parentRecurringId || tx.id) + '_' + getDateString(tx.displayDate);
            }
            txMap.set(key, tx);
        });
        // Poi sovrascrivi con gli override (se esistono per la stessa data)
        overrides.forEach(ovr => {
            const key = ovr.parentRecurringId + '_' + getDateString(ovr.displayDate);
            txMap.set(key, ovr);
        });
        txs = Array.from(txMap.values());

        if (accountFilter) {
            txs = txs.filter(tx => tx.account === accountFilter);
        }

        if (searchDescription.trim() !== '') {
            const searchLower = searchDescription.trim().toLowerCase();
            txs = txs.filter(tx => tx.description && tx.description.toLowerCase().includes(searchLower));
        }

        if (filter === 'ricorrenti') {
            txs = txs.filter(tx => tx.repeat !== 'nessuna');
        } else if (filter === 'entrate') {
            txs = txs.filter(tx => tx.type === 'entrata');
        } else if (filter === 'uscite') {
            txs = txs.filter(tx => tx.type === 'uscita');
        }
        return txs.sort((a, b) => {
            // Ordina prima per data
            const dateA = a.displayDate ? new Date(a.displayDate) : new Date(0);
            const dateB = b.displayDate ? new Date(b.displayDate) : new Date(0);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            // Se la data è uguale, ordina per ora (se presente)
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            } else if (a.time) {
                return 1;
            } else if (b.time) {
                return -1;
            } else {
                return 0;
            }
        });
    };

    const filteredTx = filteredTransactions();

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const monthYearStr = currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        resetForm();
    };

    const getAccountBalance = (account) => {
        const now = new Date();
        const txs = transactions
            .filter(t => t.account === account.name)
            .filter(t => {
                let txDate;
                if (t.displayDate) {
                    txDate = toDate(t.displayDate);
                } else if (t.date) {
                    txDate = toDate(t.date);
                } else {
                    return false;
                }
                // Considera anche l'orario
                if (t.time) {
                    const [hh, mm] = t.time.split(':');
                    txDate.setHours(Number(hh), Number(mm), 0, 0);
                } else {
                txDate.setHours(0,0,0,0);
                }
                return txDate <= now;
            });
        const txSum = txs.reduce((sum, t) => sum + (t.type === 'entrata' ? parseFloat(t.amount || '0') : -parseFloat(t.amount || '0')), 0);
        return account.balance + txSum;
    };

    const totalAccounts = accounts.reduce((sum, acc) => sum + getAccountBalance(acc), 0);

    // Nel modal delle categorie, aggiorna la funzione di aggiunta/modifica categoria
    const handleAddOrEditCategory = async () => {
        if (newCategory.trim()) {
            if (editingCategory) {
                // Aggiorna la categoria esistente
                const updatedCategories = categories.map(cat => 
                    cat === editingCategory ? newCategory.trim() : cat
                );
                setCategories(updatedCategories);
                // Aggiorna anche nelle transazioni
                const updatedTransactions = transactions.map(tx => 
                    tx.category === editingCategory ? { ...tx, category: newCategory.trim() } : tx
                );
                setTransactions(updatedTransactions);
                setEditingCategory(null);
            } else {
                // Aggiungi nuova categoria e ordina alfabeticamente
                const updatedCategories = [...categories, newCategory.trim()].sort((a, b) => 
                    a.localeCompare(b, 'it', { sensitivity: 'base' })
                );
                setCategories(updatedCategories);
            }
            setNewCategory('');
        }
    };

    // Nel modal delle categorie, aggiorna la funzione di eliminazione categoria
    const handleDeleteCategory = async (cat) => {
        setDeleteCategory(cat);
        setShowDeleteCategoryModal(true);
    };

    const handleDeleteCategoryConfirm = async () => {
        const updatedCategories = categories.filter(c => c !== deleteCategory);
        setCategories(updatedCategories);
        // Aggiorna le transazioni che usano questa categoria
        const updatedTransactions = transactions.map(tx => 
            tx.category === deleteCategory ? { ...tx, category: 'Altro' } : tx
        );
        setTransactions(updatedTransactions);
        setShowDeleteCategoryModal(false);
        setDeleteCategory(null);
    };

    const handleDeleteCategoryCancel = () => {
        setShowDeleteCategoryModal(false);
        setDeleteCategory(null);
    };

    if (loading) {
        return <div className="loading">Caricamento...</div>;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: -0.5 }}>BudgetME</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        aria-label="Logout"
                        onClick={async () => {
                            try {
                                await logoutUser();
                            } catch (error) {
                                console.error('Errore durante il logout:', error);
                            }
                        }}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#F2F2F7',
                            color: '#444',
                            border: 'none',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {ICONS.logout}
                    </button>
                    <button
                        aria-label="Cerca transazione"
                        onClick={() => setShowSearchModal(true)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#F2F2F7',
                            color: '#444',
                            border: 'none',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {ICONS.search}
                    </button>
                    <button
                        aria-label="Aggiungi transazione"
                        onClick={() => { resetForm(); setShowModal(true); }}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#007AFF',
                            color: '#fff',
                            border: 'none',
                            fontSize: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {ICONS.add}
                    </button>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 18 }}>I Miei Conti</span>
                    <button
                        aria-label="Aggiungi conto"
                        onClick={() => setShowAccountModal(true)}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#007AFF',
                            color: '#fff',
                            border: 'none',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            cursor: 'pointer'
                        }}
                    >
                        +
                    </button>
                </div>
                {accounts.length === 0 && (
                    <div className="noTransactions">Nessun conto creato.</div>
                )}
                {accounts.map(acc => (
                    <div
                        key={acc.id}
                        className="accountItem"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #E5E5EA',
                            padding: '12px 0',
                            cursor: 'pointer'
                        }}
                        onClick={() => setSelectedAccount(acc)}
                        onKeyPress={(e) => handleKeyPress(e, () => setSelectedAccount(acc))}
                        role="button"
                        tabIndex={0}
                        aria-label={`Conto: ${acc.name}, Saldo: ${getAccountBalance(acc)}€`}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{acc.name}</div>
                            <div className="accountInitialBalance">Saldo iniziale: {acc.balance >= 0 ? '+' : '-'}{Math.abs(acc.balance).toFixed(2).replace('.', ',')} €</div>
                        </div>
                        <div>
                            <span className="accountBalance" style={{ color: getAccountBalance(acc) >= 0 ? '#34C759' : '#FF3B30' }}>
                                {getAccountBalance(acc) >= 0 ? '+' : '-'}{Math.abs(getAccountBalance(acc)).toFixed(2).replace('.', ',')} €
                            </span>
                        </div>
                    </div>
                ))}
                {accounts.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, padding: '12px 0', fontSize: 16, borderTop: '1px solid #E5E5EA', marginTop: 8 }}>
                        <span>Totale Conti</span>
                        <span className="amount" style={{ color: totalAccounts >= 0 ? '#34C759' : '#FF3B30' }}>
                            {totalAccounts >= 0 ? '+' : '-'}{Math.abs(totalAccounts).toFixed(2).replace('.', ',')} €
                        </span>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="monthHeader">
                    <button onClick={prevMonth} className="monthButton">{'<'}</button>
                    <span className="monthText">{monthYearStr}</span>
                    <button onClick={nextMonth} className="monthButton">{'>'}</button>
                </div>
                <div className="summaryRow">
                    <span>Entrate:</span>
                    <span className="income amount">
                        +{filteredTx
                            .filter(t => t.type === 'entrata')
                            .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
                            .toFixed(2)
                            .replace('.', ',')} €
                    </span>
                </div>
                <div className="summaryRow">
                    <span>Uscite:</span>
                    <span className="expense amount">
                        -{filteredTx
                            .filter(t => t.type === 'uscita')
                            .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
                            .toFixed(2)
                            .replace('.', ',')} €
                    </span>
                </div>
                <div className="summaryRow balanceRow">
                    <span>Bilancio:</span>
                    <span className={
                        filteredTx.filter(t => t.type === 'entrata').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) -
                        filteredTx.filter(t => t.type === 'uscita').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) >= 0
                            ? 'income amount'
                            : 'expense amount'
                    }>
                        {
                            (filteredTx.filter(t => t.type === 'entrata').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) -
                            filteredTx.filter(t => t.type === 'uscita').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) >= 0 ? '+' : '-') +
                            Math.abs(
                                filteredTx.filter(t => t.type === 'entrata').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) -
                                filteredTx.filter(t => t.type === 'uscita').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
                            ).toFixed(2).replace('.', ',')
                        } €
                    </span>
                </div>
            </div>

            <div className="card">
                <h2>Lista Transazioni</h2>
                <div className="filterBarWrapper">
                    <div className="filterBar">
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                className={`filterBtn${filter === f.key ? ' selected' : ''}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <select
                        className="select"
                        value={accountFilter}
                        onChange={e => setAccountFilter(e.target.value)}
                        style={{ width: '100%', maxWidth: '420px', height: '36px', lineHeight: '36px', padding: '0 12px' }}
                    >
                        <option value="">Tutti i conti</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.name}>{acc.name}</option>
                        ))}
                    </select>
                    <input
                        className="input"
                        type="text"
                        placeholder="Cerca per descrizione..."
                        value={searchDescription}
                        onChange={e => setSearchDescription(e.target.value)}
                        style={{ width: '100%', maxWidth: '420px', height: '36px', lineHeight: '36px', padding: '0 12px' }}
                    />
                </div>
                {filteredTransactions().length === 0 ? (
                    <div className="noTransactions">Nessuna transazione in questo mese.</div>
                ) : (
                    filteredTransactions().map(tx => (
                        <div className="transactionItem" key={tx.id} onClick={() => setSelectedTx(tx)} onKeyPress={(e) => handleKeyPress(e, () => setSelectedTx(tx))} role="button" tabIndex={0} aria-label={`Transazione: ${tx.description}, ${tx.amount}€`}>
                            <div className="transactionInfo">
                                <div className="transactionDescription">{tx.description}</div>
                                <div className="transactionCategory">{tx.category}</div>
                                <div className="transactionDate">
                                    {tx.account && (
                                        <span style={{ color: '#8E8E93', fontSize: 13 }}>{tx.account} - </span>
                                    )}
                                    {tx.displayDate && !isNaN(new Date(tx.displayDate).getTime())
                                        ? new Date(tx.displayDate).toLocaleDateString('it-IT')
                                        : 'Data non valida'}
                                    {tx.time && ` - ${tx.time}`}
                                    {tx.repeat !== 'nessuna' && (
                                        <span style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                            {' '}({repeatOptions.find(r => r.value === tx.repeat)?.label})
                                        </span>
                                    )}
                                    {tx.repeat !== 'nessuna' && tx.endDate && (
                                        <div><b>Data di fine:</b> {new Date(tx.endDate).toLocaleDateString('it-IT')}</div>
                                    )}
                                </div>
                            </div>
                            <div className="transactionAmount">
                                <span className={tx.type === 'entrata' ? 'income amount' : 'expense amount'}>
                                    {formatAmount(tx.amount, tx.type)} €
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 18 }}>Categorie</span>
                    <button
                        aria-label="Gestisci categorie"
                        onClick={() => setShowCategoryModal(true)}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#007AFF',
                            color: '#fff',
                            border: 'none',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            cursor: 'pointer'
                        }}
                    >
                        +
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categories.map(cat => {
                        const totale = filteredTransactions()
                            .filter(t => t.category === cat)
                            .reduce((sum, t) => sum + (t.type === 'entrata' ? parseFloat(t.amount || '0') : -parseFloat(t.amount || '0')), 0);
                        if (totale === 0) return null;
                        return (
                            <div
                                key={cat}
                                className="categoryItem"
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E5EA', padding: '12px 0', cursor: 'pointer' }}
                                onClick={() => {
                                    const txs = filteredTransactions()
                                        .filter(t => t.category === cat)
                                        .sort((a, b) => {
                                            const dateA = a.displayDate ? new Date(a.displayDate) : new Date(0);
                                            const dateB = b.displayDate ? new Date(b.displayDate) : new Date(0);
                                            if (dateA.getTime() !== dateB.getTime()) {
                                                return dateA - dateB;
                                            }
                                            if (a.time && b.time) {
                                                return a.time.localeCompare(b.time);
                                            } else if (a.time) {
                                                return 1;
                                            } else if (b.time) {
                                                return -1;
                                            } else {
                                                return 0;
                                            }
                                        });
                                    setCategoryTx(txs);
                                    setSelectedCategory(cat);
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Categoria: ${cat}`}
                            >
                                <span style={{ fontWeight: 500, fontSize: 15 }}>{cat}</span>
                                <span className="amount" style={{ color: totale >= 0 ? '#34C759' : '#FF3B30' }}>
                                    {totale >= 0 ? '+' : '-'}{Math.abs(totale).toFixed(2).replace('.', ',')} €
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">
                                {editingId ? 'Modifica Transazione' : 'Nuova Transazione'}
                            </h2>
                            <button className="closeButton" onClick={handleCloseModal}>{ICONS.close}</button>
                        </div>
                        <input
                            className="input"
                            placeholder="Descrizione"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            list="description-suggestions"
                        />
                        <datalist id="description-suggestions">
                            {uniqueDescriptions.map(desc => (
                                <option key={desc} value={desc} />
                            ))}
                        </datalist>
                        <input
                            className="input"
                            type="text"
                            step="0.01"
                            placeholder="Importo"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                        />
                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                    className="select"
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    style={{ flex: 1 }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <button
                                    aria-label="Gestisci categorie"
                                    onClick={() => setShowCategoryModal(true)}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: '#007AFF',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: 18,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="typeContainer">
                            <button
                                className={`typeButton ${form.type === 'entrata' ? 'typeButtonActive' : ''}`}
                                onClick={() => setForm({ ...form, type: 'entrata' })}
                            >
                                Entrata
                            </button>
                            <button
                                className={`typeButton ${form.type === 'uscita' ? 'typeButtonActive' : ''}`}
                                onClick={() => setForm({ ...form, type: 'uscita' })}
                            >
                                Uscita
                            </button>
                            <button
                                className={`typeButton ${form.type === 'trasferimento' ? 'typeButtonActive' : ''}`}
                                onClick={() => setForm({ ...form, type: 'trasferimento' })}
                            >
                                Trasferimento
                            </button>
                        </div>

                        {form.type === 'trasferimento' && (
                            <select
                                className="select"
                                value={form.destinationAccount}
                                onChange={e => setForm({ ...form, destinationAccount: e.target.value })}
                            >
                                <option value="">Seleziona conto di destinazione</option>
                                {accounts.filter(acc => acc.name !== form.account).map(acc => (
                                    <option key={acc.id} value={acc.name}>{acc.name}</option>
                                ))}
                            </select>
                        )}

                        <input
                            className="input"
                            type="date"
                            value={form.date}
                            onChange={e => setForm({ ...form, date: e.target.value })}
                        />

                        <div className="toggleRow">
                            <span>Mostra Ora</span>
                            <label className="ios-switch">
                                <input type="checkbox" checked={showTime} onChange={e => {
                                    setShowTime(e.target.checked);
                                    if (!e.target.checked) setForm({ ...form, time: '' });
                                    else if (!form.time) setForm({ ...form, time: new Date().toTimeString().slice(0, 5) });
                                }} />
                                <span className="ios-slider"></span>
                            </label>
                        </div>
                        {showTime && (
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <input
                                    className="input"
                                    type="time"
                                    value={form.time}
                                    onChange={e => setForm({ ...form, time: e.target.value })}
                                    style={{ marginBottom: 0, flex: '0 1 120px' }}
                                />
                                <span className="oraOpzionale">(opzionale)</span>
                            </div>
                        )}

                        <select
                            className="select"
                            value={form.repeat}
                            onChange={e => setForm({ ...form, repeat: e.target.value })}
                        >
                            {repeatOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {form.repeat !== 'nessuna' && (
                            <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 15, fontWeight: 500, display: 'block', marginBottom: 4 }}>Data di fine</label>
                                <select
                                    className="select"
                                    value={form.endDate === '' ? 'never' : 'date'}
                                    onChange={e => {
                                        if (e.target.value === 'never') setForm({ ...form, endDate: '' });
                                        else setForm({ ...form, endDate: new Date().toISOString().split('T')[0] });
                                    }}
                                >
                                    <option value="never">Mai</option>
                                    <option value="date">Seleziona data...</option>
                                </select>
                                {form.endDate !== '' && (
                                    <input
                                        className="input"
                                        type="date"
                                        value={form.endDate}
                                        min={form.date}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    />
                                )}
                            </div>
                        )}

                        <select
                            className="select"
                            value={form.account}
                            onChange={e => setForm({ ...form, account: e.target.value })}
                        >
                            <option value="">Seleziona conto</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.name}>{acc.name}</option>
                            ))}
                        </select>

                        <div className="buttonContainer">
                            <button
                                className="button cancelButton"
                                onClick={handleCloseModal}
                            >
                                Annulla
                            </button>
                            <button
                                className="button saveButton"
                                onClick={handleAddOrEdit}
                                disabled={isLoading}
                                style={{ 
                                    outline: 'none',
                                    opacity: isLoading ? 0.7 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? 'Salvataggio...' : 'Salva'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Conferma eliminazione</h2>
                            <button className="closeButton" onClick={handleDeleteCancel}>{ICONS.close}</button>
                        </div>
                        <div style={{ marginBottom: 20, fontSize: 16 }}>
                            Sei sicuro di voler eliminare questa transazione?
                        </div>
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={handleDeleteCancel}>Annulla</button>
                            <button className="button deleteButton" onClick={handleDeleteConfirm}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}

            {showAccountModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">{editingAccountId ? 'Modifica Conto' : 'Nuovo Conto'}</h2>
                            <button className="closeButton" onClick={() => { setShowAccountModal(false); setEditingAccountId(null); }}>{ICONS.close}</button>
                        </div>
                        <input
                            className="input"
                            placeholder="Nome conto"
                            value={accountForm.name}
                            onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                        />
                        <input
                            className="input"
                            type="text"
                            step="0.01"
                            placeholder="Saldo iniziale"
                            value={accountForm.balance}
                            onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                        />
                        {error && (
                            <div style={{ 
                                color: '#FF3B30', 
                                fontSize: 14, 
                                marginBottom: 12,
                                padding: 8,
                                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                borderRadius: 8
                            }}>
                                {error}
                            </div>
                        )}
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={() => { setShowAccountModal(false); setEditingAccountId(null); }}>Annulla</button>
                            <button className="button saveButton" onClick={handleAddAccount}>Salva</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteAccountModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Conferma eliminazione conto</h2>
                            <button className="closeButton" onClick={handleDeleteAccountCancel}>{ICONS.close}</button>
                        </div>
                        <div style={{ marginBottom: 20, fontSize: 16 }}>
                            Sei sicuro di voler eliminare questo conto?
                        </div>
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={handleDeleteAccountCancel}>Annulla</button>
                            <button className="button deleteButton" onClick={handleDeleteAccountConfirm}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedTx && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Dettaglio Transazione</h2>
                            <button className="closeButton" onClick={() => setSelectedTx(null)}>{ICONS.close}</button>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <div><b>Descrizione:</b> {selectedTx.description}</div>
                            <div><b>Importo:</b> <span style={{ color: selectedTx.type === 'entrata' ? '#34C759' : '#FF3B30', fontWeight: 600 }}>{formatAmount(selectedTx.amount, selectedTx.type)} €</span></div>
                            <div><b>Categoria:</b> {selectedTx.category}</div>
                            <div><b>Conto:</b> {selectedTx.account || '-'}</div>
                            <div><b>Tipo:</b> {selectedTx.type === 'entrata' ? 'Entrata' : 'Uscita'}</div>
                            <div><b>Data:</b> {selectedTx.displayDate ? selectedTx.displayDate.toLocaleDateString('it-IT') : selectedTx.date}</div>
                            {selectedTx.time && <div><b>Ora:</b> {selectedTx.time}</div>}
                            {selectedTx.repeat !== 'nessuna' && <div><b>Ricorrenza:</b> {repeatOptions.find(r => r.value === selectedTx.repeat)?.label}</div>}
                            {selectedTx.repeat !== 'nessuna' && selectedTx.endDate && (
                                <div><b>Data di fine:</b> {new Date(selectedTx.endDate).toLocaleDateString('it-IT')}</div>
                            )}
                        </div>
                        <div className="buttonContainer">
                            <button className="button saveButton" onClick={() => { setForm(selectedTx); setEditingId(selectedTx.id); setShowModal(true); setSelectedTx(null); }}>
                                {ICONS.edit} Modifica
                            </button>
                            {selectedTx.repeat !== 'nessuna' && !selectedTx.parentRecurringId && (
                                <button className="button saveButton" onClick={() => {
                                    setForm({
                                        ...selectedTx,
                                        repeat: 'nessuna',
                                        parentRecurringId: selectedTx.id,
                                        date: selectedTx.displayDate ? selectedTx.displayDate.toISOString().split('T')[0] : selectedTx.date,
                                    });
                                    setEditingId(null);
                                    setShowModal(true);
                                    setSelectedTx(null);
                                }}>
                                    {ICONS.edit} Modifica solo questa occorrenza
                                </button>
                            )}
                            <button className="button deleteButton" onClick={() => { setDeleteId(selectedTx.id); setShowDeleteModal(true); setSelectedTx(null); }}>
                                {ICONS.delete} Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedAccount && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Dettaglio Conto</h2>
                            <button className="closeButton" onClick={() => setSelectedAccount(null)}>{ICONS.close}</button>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <div><b>Nome:</b> {selectedAccount.name}</div>
                            <div><b>Saldo iniziale:</b> {selectedAccount.balance >= 0 ? '+' : '-'}{Math.abs(selectedAccount.balance).toFixed(2).replace('.', ',')} €</div>
                            <div><b>Saldo attuale:</b> <span className="amount" style={{ color: '#34C759', fontWeight: 600 }}>{getAccountBalance(selectedAccount) >= 0 ? '+' : '-'}{Math.abs(getAccountBalance(selectedAccount)).toFixed(2).replace('.', ',')} €</span></div>
                            <div style={{ marginTop: 8, fontSize: 13, color: '#8E8E93' }}>
                                Il saldo attuale è calcolato sommando il saldo iniziale e tutte le transazioni associate a questo conto.
                            </div>
                        </div>
                        <div className="buttonContainer">
                            <button
                                className="button saveButton"
                                onClick={() => {
                                    handleEditAccount(selectedAccount.id);
                                    setSelectedAccount(null);
                                }}
                            >
                                {ICONS.edit} Modifica
                            </button>
                            <button
                                className="button deleteButton"
                                onClick={() => {
                                    handleDeleteAccountRequest(selectedAccount.id);
                                    setSelectedAccount(null);
                                }}
                            >
                                {ICONS.delete} Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSearchModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Cerca transazione</h2>
                            <button className="closeButton" onClick={() => setShowSearchModal(false)}>{ICONS.close}</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 15, fontWeight: 500, display: 'block', marginBottom: 4 }}>Data iniziale</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={searchFrom}
                                    onChange={e => setSearchFrom(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 15, fontWeight: 500, display: 'block', marginBottom: 4 }}>Data finale</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={searchTo}
                                    onChange={e => setSearchTo(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <button 
                                className="button saveButton" 
                                style={{ width: '100%' }}
                                onClick={() => {
                                    const from = searchFrom ? new Date(searchFrom) : null;
                                    const to = searchTo ? new Date(searchTo) : null;
                                    
                                    // Normalizza le date di inizio e fine
                                    if (from) {
                                        from.setHours(0, 0, 0, 0);
                                    }
                                    if (to) {
                                        to.setHours(23, 59, 59, 999);
                                    }
                                    
                                    const results = transactions
                                        .map(tx => {
                                            if (tx.repeat !== 'nessuna') {
                                                const occurrences = [];
                                                let currentDate = new Date(tx.date);
                                                // Normalizza la data corrente
                                                currentDate.setHours(0, 0, 0, 0);
                                                
                                                while (currentDate <= to) {
                                                    if (currentDate >= from) {
                                                        occurrences.push({
                                                            ...tx,
                                                            displayDate: new Date(currentDate)
                                                        });
                                                    }
                                                    
                                                    switch (tx.repeat) {
                                                        case 'giornaliera':
                                                            currentDate.setDate(currentDate.getDate() + 1);
                                                            break;
                                                        case 'settimanale':
                                                            currentDate.setDate(currentDate.getDate() + 7);
                                                            break;
                                                        case 'mensile':
                                                            currentDate.setMonth(currentDate.getMonth() + 1);
                                                            break;
                                                        case 'trimestrale':
                                                            currentDate.setMonth(currentDate.getMonth() + 3);
                                                            break;
                                                        case 'semestrale':
                                                            currentDate.setMonth(currentDate.getMonth() + 6);
                                                            break;
                                                        case 'annuale':
                                                            currentDate.setFullYear(currentDate.getFullYear() + 1);
                                                            break;
                                                    }
                                                    
                                                    if (tx.endDate && new Date(tx.endDate) < currentDate) {
                                                        break;
                                                    }
                                                }
                                                return occurrences;
                                            } else {
                                                // Per le transazioni non ricorrenti
                                                const txDate = tx.displayDate ? new Date(tx.displayDate) : (tx.date ? new Date(tx.date) : null);
                                                if (txDate) {
                                                    // Normalizza la data della transazione
                                                    txDate.setHours(0, 0, 0, 0);
                                                }
                                                return [{
                                                    ...tx,
                                                    displayDate: txDate
                                                }];
                                            }
                                        })
                                        .flat()
                                        .filter(tx => {
                                            if (!tx.displayDate) return false;
                                            const txDate = new Date(tx.displayDate);
                                            if (isNaN(txDate.getTime())) return false; // Escludi date non valide
                                            txDate.setHours(0, 0, 0, 0);
                                            if (from && txDate < from) return false;
                                            if (to && txDate > to) return false;
                                            return true;
                                        })
                                        .sort((a, b) => {
                                            // Ordina prima per data
                                            const dateA = a.displayDate ? new Date(a.displayDate) : new Date(0);
                                            const dateB = b.displayDate ? new Date(b.displayDate) : new Date(0);
                                            if (dateA.getTime() !== dateB.getTime()) {
                                                return dateA - dateB;
                                            }
                                            // Se la data è uguale, ordina per ora (se presente)
                                            if (a.time && b.time) {
                                                return a.time.localeCompare(b.time);
                                            } else if (a.time) {
                                                return 1;
                                            } else if (b.time) {
                                                return -1;
                                            } else {
                                                return 0;
                                            }
                                        });
                                    
                                    setSearchResults(results);
                                }}
                            >
                                Cerca
                            </button>
                        </div>
                        <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
                            {searchResults.length === 0 ? (
                                <div style={{ color: '#8E8E93', textAlign: 'center', margin: 12 }}>
                                    {searchResults.length === 0 && searchFrom && searchTo ? 'Nessuna transazione trovata nel periodo selezionato.' : 'Seleziona un intervallo di date e clicca su Cerca.'}
                                </div>
                            ) : (
                                <>
                                    <div
                                        style={{
                                            fontWeight: 500,
                                            fontSize: 15,
                                            marginBottom: 6,
                                            color: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? '#fff' : '#222'
                                        }}
                                    >
                                        Transazioni trovate:
                                    </div>
                                    <div>
                                        {searchResults.map(tx => {
                                            return (
                                                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E5EA', padding: '6px 0' }}>
                                                    <div style={{ flex: 2 }}>
                                                        <div style={{ fontWeight: 600 }}>{tx.description}</div>
                                                        <div style={{ fontSize: 13, color: '#8E8E93' }}>{tx.displayDate && !isNaN(new Date(tx.displayDate).getTime())
                                                            ? new Date(tx.displayDate).toLocaleDateString('it-IT')
                                                            : 'Data non valida'} {tx.account ? `- ${tx.account}` : ''}</div>
                                                    </div>
                                                    <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: tx.type === 'entrata' ? '#34C759' : '#FF3B30' }}>
                                                        {formatAmount(tx.amount, tx.type)} €
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div style={{ fontWeight: 600, fontSize: 16, textAlign: 'right', color: '#34C759' }}>
                                            Entrate: +{searchResults.filter(tx => tx.type === 'entrata').reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0).toFixed(2).replace('.', ',')} €
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: 16, textAlign: 'right', color: '#FF3B30' }}>
                                            Uscite: -{searchResults.filter(tx => tx.type === 'uscita').reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0).toFixed(2).replace('.', ',')} €
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={() => {
                                setShowSearchModal(false);
                                setSearchResults([]);
                                setSearchFrom('');
                                setSearchTo('');
                            }}>Chiudi</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedCategory && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Transazioni: {selectedCategory}</h2>
                            <button className="closeButton" onClick={() => setSelectedCategory(null)}>{ICONS.close}</button>
                        </div>
                        <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                            {categoryTx.length === 0 ? (
                                <div style={{ color: '#8E8E93', textAlign: 'center', margin: 12 }}>
                                    Nessuna transazione trovata per questa categoria.
                                </div>
                            ) : (
                                categoryTx.map(tx => (
                                    <div
                                        key={tx.id}
                                        className="categoryTxItem"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E5EA', padding: '10px 0', cursor: 'pointer' }}
                                    >
                                        <div style={{ flex: 2 }}>
                                            <div style={{ fontWeight: 600 }}>{tx.description}</div>
                                            <div style={{ fontSize: 13, color: '#8E8E93' }}>{tx.displayDate && !isNaN(new Date(tx.displayDate).getTime())
                                                ? new Date(tx.displayDate).toLocaleDateString('it-IT')
                                                : 'Data non valida'} {tx.time ? `- ${tx.time}` : ''} {tx.account ? `- ${tx.account}` : ''}</div>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: tx.type === 'entrata' ? '#34C759' : '#FF3B30' }}>
                                            {formatAmount(tx.amount, tx.type)} €
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={() => setSelectedCategory(null)}>Chiudi</button>
                        </div>
                    </div>
                </div>
            )}

            {showCategoryModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Gestisci Categorie</h2>
                            <button className="closeButton" onClick={() => { setShowCategoryModal(false); setNewCategory(''); setEditingCategory(null); }}>{ICONS.close}</button>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <input
                                className="input"
                                placeholder="Nome nuova categoria"
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                            />
                            <button
                                className="button saveButton"
                                style={{ width: '100%', marginTop: 8 }}
                                onClick={handleAddOrEditCategory}
                            >
                                {editingCategory ? 'Aggiorna Categoria' : 'Aggiungi Categoria'}
                            </button>
                        </div>
                        <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
                            {categories.map(cat => (
                                <div
                                    key={cat}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #E5E5EA'
                                    }}
                                >
                                    <span>{cat}</span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            className="button saveButton"
                                            style={{ padding: '4px 8px', fontSize: 13 }}
                                            onClick={() => {
                                                setNewCategory(cat);
                                                setEditingCategory(cat);
                                            }}
                                        >
                                            {ICONS.edit}
                                        </button>
                                        <button
                                            className="button deleteButton"
                                            style={{ padding: '4px 8px', fontSize: 13 }}
                                            onClick={() => handleDeleteCategory(cat)}
                                        >
                                            {ICONS.delete}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={() => { setShowCategoryModal(false); setNewCategory(''); setEditingCategory(null); }}>Chiudi</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteCategoryModal && (
                <div className="modalOverlay">
                    <div className="modal">
                        <div className="modalHeader">
                            <h2 className="modalTitle">Conferma eliminazione categoria</h2>
                            <button className="closeButton" onClick={handleDeleteCategoryCancel}>{ICONS.close}</button>
                        </div>
                        <div style={{ marginBottom: 20, fontSize: 16 }}>
                            Sei sicuro di voler eliminare la categoria "{deleteCategory}"?
                            <div style={{ marginTop: 8, fontSize: 14, color: '#8E8E93' }}>
                                Le transazioni che utilizzano questa categoria verranno spostate nella categoria "Altro".
                            </div>
                        </div>
                        <div className="buttonContainer">
                            <button className="button cancelButton" onClick={handleDeleteCategoryCancel}>Annulla</button>
                            <button className="button deleteButton" onClick={handleDeleteCategoryConfirm}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App; 