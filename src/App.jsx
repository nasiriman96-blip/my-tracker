import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Initialize Firebase securely outside the component
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-tracker-app';

// Format angka ke Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// Map Tailwind colors to Hex for Recharts
const colorToHex = {
  'bg-indigo-500': '#6366f1',
  'bg-emerald-500': '#10b981',
  'bg-blue-500': '#3b82f6',
  'bg-rose-500': '#f43f5e',
  'bg-amber-500': '#f59e0b',
  'bg-purple-500': '#a855f7',
  'bg-slate-800': '#1e293b'
};

// Kumpulan Ikon SVG Minimalis
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconArrowUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const IconArrowDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
const IconTransfer = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 8 16 13"/><line x1="21" y1="8" x2="9" y2="8"/><polyline points="8 21 3 16 8 11"/><line x1="3" y1="16" x2="15" y2="16"/></svg>;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isPocketModalOpen, setIsPocketModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Data State synced with Firestore
  const [pockets, setPockets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initialize Authentication First
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Authentication Error:', error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data After Authenticated
  useEffect(() => {
    if (!user) return;

    const pocketsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'pockets');
    const transactionsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'transactions');

    const unsubPockets = onSnapshot(pocketsRef, (snapshot) => {
      const fetchedPockets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Auto-create default pockets if account is totally new
      if (fetchedPockets.length === 0 && snapshot.metadata.hasPendingWrites === false) {
        addDoc(pocketsRef, { name: 'Dompet Utama', balance: 0, color: 'bg-emerald-500', createdAt: Date.now() });
        addDoc(pocketsRef, { name: 'Tabungan', balance: 0, color: 'bg-blue-500', createdAt: Date.now() + 1 });
      } else {
        setPockets(fetchedPockets.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
      }
      setIsLoading(false);
    }, (error) => console.error("Error fetching pockets:", error));

    const unsubTx = onSnapshot(transactionsRef, (snapshot) => {
      const fetchedTx = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(fetchedTx.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, (error) => console.error("Error fetching transactions:", error));

    return () => {
      unsubPockets();
      unsubTx();
    };
  }, [user]);

  // Perhitungan Total
  const totalBalance = useMemo(() => pockets.reduce((sum, p) => sum + p.balance, 0), [pockets]);
  const totalIncomeThisMonth = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  const totalExpenseThisMonth = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const handleAddTransaction = async (data) => {
    if (!user) return;
    
    // Save new transaction
    const newTx = {
      date: new Date().toISOString(),
      ...data,
      createdAt: Date.now()
    };
    
    try {
      const txRef = collection(db, 'artifacts', appId, 'users', user.uid, 'transactions');
      await addDoc(txRef, newTx);

      // Helper to update pocket balance in Firestore
      const updateBalance = async (pocketId, amountChange) => {
        const pocket = pockets.find(p => p.id === pocketId);
        if (pocket) {
          const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'pockets', pocket.id);
          await updateDoc(pRef, { balance: pocket.balance + amountChange });
        }
      };

      // Update relevant pocket balances
      if (data.type === 'income') {
        await updateBalance(data.pocketId, data.amount);
      } else if (data.type === 'expense') {
        await updateBalance(data.pocketId, -data.amount);
      } else if (data.type === 'transfer') {
        await updateBalance(data.fromPocketId, -data.amount);
        await updateBalance(data.toPocketId, data.amount);
      }

      setIsTxModalOpen(false);
    } catch (error) {
      console.error("Failed to add transaction", error);
    }
  };

  const handleAddPocket = async (name, color) => {
    if (!user) return;
    try {
      const pocketsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'pockets');
      await addDoc(pocketsRef, { name, balance: 0, color, createdAt: Date.now() });
      setIsPocketModalOpen(false);
    } catch (error) {
      console.error("Failed to add pocket", error);
    }
  };

  const handleDeletePocket = async (id) => {
    if (!user) return;
    const pocket = pockets.find(p => p.id === id);
    if (pocket && pocket.balance > 0) return; // Prevent deleting pockets with balance
    
    try {
      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'pockets', id);
      await deleteDoc(pRef);
    } catch (error) {
      console.error("Failed to delete pocket", error);
    }
  };

  const TransactionModal = () => {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [pocketId, setPocketId] = useState(pockets[0]?.id || '');
    const [toPocketId, setToPocketId] = useState(pockets.length > 1 ? pockets[1].id : '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!amount || Number(amount) <= 0 || isSubmitting) return;
      setIsSubmitting(true);
      
      const txData = {
        type,
        amount: Number(amount),
        note,
      };

      if (type === 'transfer') {
        if (pocketId === toPocketId) {
          setIsSubmitting(false);
          return; // Cannot transfer to same pocket
        }
        txData.fromPocketId = pocketId;
        txData.toPocketId = toPocketId;
      } else {
        txData.pocketId = pocketId;
      }

      await handleAddTransaction(txData);
      setIsSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 pb-0 sm:pb-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Catat Transaksi</h2>
            <button onClick={() => setIsTxModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><IconX /></button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            {['expense', 'income', 'transfer'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                  type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-2xl font-bold text-slate-800 bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="0"
                autoFocus
                required
              />
            </div>

            {type !== 'transfer' ? (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Keperluan / Pocket</label>
                <select
                  value={pocketId}
                  onChange={(e) => setPocketId(e.target.value)}
                  className="w-full bg-slate-50 border-0 text-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  required
                >
                  {pockets.map(p => <option key={p.id} value={p.id}>{p.name} ({formatRupiah(p.balance)})</option>)}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Dari</label>
                  <select
                    value={pocketId}
                    onChange={(e) => setPocketId(e.target.value)}
                    className="w-full bg-slate-50 border-0 text-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                    required
                  >
                    {pockets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Ke</label>
                  <select
                    value={toPocketId}
                    onChange={(e) => setToPocketId(e.target.value)}
                    className="w-full bg-slate-50 border-0 text-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                    required
                  >
                    {pockets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Catatan</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border-0 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="Cth: Beli Kopi"
                required={type !== 'transfer'}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 mt-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-70 ${
                type === 'expense' ? 'bg-rose-500 shadow-rose-200 hover:bg-rose-600' :
                type === 'income' ? 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600' :
                'bg-blue-500 shadow-blue-200 hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const PocketModal = () => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('bg-indigo-500');
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-slate-800'];
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!name.trim() || isSubmitting) return;
      setIsSubmitting(true);
      await handleAddPocket(name, color);
      setIsSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Buat Keperluan Baru</h2>
            <button onClick={() => setIsPocketModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><IconX /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Nama Keperluan / Pocket</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-0 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="Cth: Liburan"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Pilih Warna</label>
              <div className="flex gap-3 flex-wrap">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full ${c} transition-transform ${color === c ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : 'hover:scale-110'}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 transition-transform active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? 'Memproses...' : 'Buat Pocket'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Total Balance Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl shadow-slate-200 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white opacity-5 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-1">
             <p className="text-slate-400 font-medium text-sm">Total Saldo Tersedia</p>
             <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold border border-emerald-500/20">Cloud Synced</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">{formatRupiah(totalBalance)}</h1>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-emerald-400 mb-1 text-sm font-medium">
                <IconArrowDown /> Pemasukan
              </div>
              <p className="font-semibold">{formatRupiah(totalIncomeThisMonth)}</p>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-rose-400 mb-1 text-sm font-medium">
                <IconArrowUp /> Pengeluaran
              </div>
              <p className="font-semibold">{formatRupiah(totalExpenseThisMonth)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Pockets Summary */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-slate-800">Alokasi Dana</h3>
          <button onClick={() => setActiveTab('pockets')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Lihat Semua</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {pockets.map(pocket => (
            <div key={pocket.id} className="min-w-[140px] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 snap-start">
              <div className={`w-3 h-3 rounded-full mb-3 ${pocket.color}`}></div>
              <p className="text-slate-500 text-xs font-medium mb-1 truncate">{pocket.name}</p>
              <p className="text-slate-800 font-bold truncate">{formatRupiah(pocket.balance)}</p>
            </div>
          ))}
          <button 
            onClick={() => setIsPocketModalOpen(true)}
            className="min-w-[140px] bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition snap-start"
          >
            <IconPlus />
            <span className="text-xs font-semibold mt-2">Tambah Baru</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Transaksi Terakhir</h3>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Belum ada transaksi</div>
          ) : (
            transactions.slice(0, 5).map((tx, idx) => {
              const pocket = pockets.find(p => p.id === (tx.type === 'transfer' ? tx.fromPocketId : tx.pocketId));
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              
              return (
                <div key={tx.id} className={`flex items-center justify-between p-4 ${idx !== 0 ? 'border-t border-slate-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0
                      ${isIncome ? 'bg-emerald-100 text-emerald-600' : isTransfer ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}
                    `}>
                      {isIncome ? <IconArrowDown /> : isTransfer ? <IconTransfer /> : <IconArrowUp />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[300px]">{tx.note || (isTransfer ? 'Transfer Dana' : 'Transaksi')}</p>
                      <p className="text-xs text-slate-500 font-medium">{pocket?.name} • {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${isIncome ? 'text-emerald-600' : isTransfer ? 'text-slate-600' : 'text-slate-800'}`}>
                    {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderPockets = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Alokasi Dana</h2>
        <button onClick={() => setIsPocketModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
          <IconPlus /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pockets.map(pocket => (
          <div key={pocket.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-full ${pocket.color}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${pocket.color}`}></div>
                <h3 className="font-bold text-lg text-slate-800 truncate max-w-[180px]">{pocket.name}</h3>
              </div>
              {pocket.balance === 0 && pockets.length > 1 && (
                <button 
                  onClick={() => handleDeletePocket(pocket.id)}
                  className="text-slate-400 hover:text-rose-500 transition sm:opacity-0 sm:group-hover:opacity-100"
                  title="Hapus Pocket (Hanya jika saldo 0)"
                >
                  <IconX />
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Saldo</p>
            <p className="text-3xl font-bold text-slate-800">{formatRupiah(pocket.balance)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Riwayat Transaksi</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <IconHistory />
            <p>Belum ada catatan transaksi</p>
          </div>
        ) : (
          transactions.map((tx, idx) => {
            let pocketName = 'Unknown';
            if (tx.type === 'transfer') {
              const pFrom = pockets.find(p => p.id === tx.fromPocketId);
              const pTo = pockets.find(p => p.id === tx.toPocketId);
              pocketName = `${pFrom?.name} ➔ ${pTo?.name}`;
            } else {
              pocketName = pockets.find(p => p.id === tx.pocketId)?.name || 'Unknown';
            }
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            
            return (
              <div key={tx.id} className={`flex items-center justify-between p-5 ${idx !== 0 ? 'border-t border-slate-50' : ''}`}>
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0
                    ${isIncome ? 'bg-emerald-100 text-emerald-600' : isTransfer ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}
                  `}>
                    {isIncome ? <IconArrowDown /> : isTransfer ? <IconTransfer /> : <IconArrowUp />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-base truncate">{tx.note || (isTransfer ? 'Transfer Dana' : 'Transaksi')}</p>
                    <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">
                      {pocketName} • {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit'})}
                    </p>
                  </div>
                  <div className={`font-bold text-base sm:text-lg text-right shrink-0 ${isIncome ? 'text-emerald-600' : isTransfer ? 'text-slate-600' : 'text-slate-800'}`}>
                    {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderChart = () => {
    // Data untuk grafik kue (distribusi dana)
    const pieData = pockets
      .filter(p => p.balance > 0)
      .map(p => ({ name: p.name, value: p.balance, fill: colorToHex[p.color] || '#cbd5e1' }));

    // Data untuk bar chart (Pemasukan vs Pengeluaran)
    const barData = [
      { name: 'Arus Kas', Pemasukan: totalIncomeThisMonth, Pengeluaran: totalExpenseThisMonth }
    ];

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
            <p className="font-bold text-slate-800 mb-1">{payload[0].name || payload[0].dataKey}</p>
            <p className="text-sm text-slate-600">{formatRupiah(payload[0].value)}</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Grafik Keuangan</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik Distribusi Pockets */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-6 text-center">Distribusi Alokasi Dana</h3>
            {pieData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Belum ada saldo di pocket
              </div>
            )}
          </div>

          {/* Grafik Pemasukan vs Pengeluaran */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-6 text-center">Pemasukan vs Pengeluaran</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 4, 4]} barSize={40} />
                  <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 4, 4]} barSize={40} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Menyinkronkan data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 md:pb-0 md:pl-64 flex flex-col selection:bg-emerald-200">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-white border-r border-slate-100 p-6 z-40">
        <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-12">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white"><IconWallet /></div>
          My Tracker
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <IconHome /> Ringkasan
          </button>
          <button onClick={() => setActiveTab('pockets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'pockets' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <IconWallet /> Alokasi Dana
          </button>
          <button onClick={() => setActiveTab('chart')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'chart' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <IconChart /> Grafik
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'history' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <IconHistory /> Riwayat
          </button>
        </nav>

        <button onClick={() => setIsTxModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-transform active:scale-95">
          <IconPlus /> Transaksi
        </button>
      </aside>

      {/* Top Header Mobile */}
      <header className="md:hidden bg-slate-50/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-xl text-slate-900">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white scale-75"><IconWallet /></div>
          My Tracker
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200" title="Cloud Synced">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'pockets' && renderPockets()}
        {activeTab === 'chart' && renderChart()}
        {activeTab === 'history' && renderHistory()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-between items-center px-4 py-2 pb-safe z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <IconHome />
          <span className="text-[9px] font-bold">Ringkasan</span>
        </button>
        <button onClick={() => setActiveTab('pockets')} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'pockets' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <IconWallet />
          <span className="text-[9px] font-bold">Pockets</span>
        </button>
        
        {/* FAB Style button inserted into bottom nav */}
        <div className="relative -top-5 mx-2">
          <button onClick={() => setIsTxModalOpen(true)} className="bg-slate-900 text-white p-4 rounded-full shadow-xl shadow-slate-300 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center h-14 w-14">
            <IconPlus />
          </button>
        </div>

        <button onClick={() => setActiveTab('chart')} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'chart' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <IconChart />
          <span className="text-[9px] font-bold">Grafik</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <IconHistory />
          <span className="text-[9px] font-bold">Riwayat</span>
        </button>
      </nav>

      {/* Modals */}
      {isTxModalOpen && <TransactionModal />}
      {isPocketModalOpen && <PocketModal />}
      
      {/* Global CSS fixes */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe { padding-bottom: calc(0.5rem + env(safe-area-inset-bottom)); }
        }
      `}} />
    </div>
  );
}