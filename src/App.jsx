import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, PieChart as ChartIcon, PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pockets, setPockets] = useState(() => {
    const saved = localStorage.getItem('myTrackerPockets');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Dompet Utama', balance: 0, color: '#3B82F6' }];
  });
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('myTrackerTransactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedPocket, setSelectedPocket] = useState(pockets[0]?.id || '');
  const [pocketName, setPocketName] = useState('');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    localStorage.setItem('myTrackerPockets', JSON.stringify(pockets));
    localStorage.setItem('myTrackerTransactions', JSON.stringify(transactions));
  }, [pockets, transactions]);

  const handleTransaction = (type) => {
    if (!amount || isNaN(amount) || amount <= 0) return alert('Masukkan nominal yang valid');
    const numAmount = parseFloat(amount);
    
    const newTransaction = {
      id: Date.now().toString(),
      pocketId: selectedPocket,
      type,
      amount: numAmount,
      note: note || (type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
      date: new Date().toLocaleDateString('id-ID')
    };

    setPockets(pockets.map(p => {
      if (p.id === selectedPocket) {
        return { ...p, balance: type === 'income' ? p.balance + numAmount : p.balance - numAmount };
      }
      return p;
    }));

    setTransactions([newTransaction, ...transactions]);
    setAmount('');
    setNote('');
  };

  const addPocket = () => {
    if (!pocketName) return;
    const newPocket = {
      id: Date.now().toString(),
      name: pocketName,
      balance: 0,
      color: COLORS[pockets.length % COLORS.length]
    };
    setPockets([...pockets, newPocket]);
    setPocketName('');
    if (!selectedPocket) setSelectedPocket(newPocket.id);
  };

  const deletePocket = (id) => {
    if (pockets.length === 1) return alert('Harus ada minimal 1 dompet');
    setPockets(pockets.filter(p => p.id !== id));
    setTransactions(transactions.filter(t => t.pocketId !== id));
    if (selectedPocket === id) setSelectedPocket(pockets[0].id);
  };

  const totalBalance = pockets.reduce((sum, p) => sum + p.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const chartData = [
    { name: 'Pemasukan', total: totalIncome, fill: '#10B981' },
    { name: 'Pengeluaran', total: totalExpense, fill: '#EF4444' }
  ];

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 text-gray-800 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        
        {/* Header */}
        <header className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-md">
          <h1 className="text-2xl font-bold tracking-wide">My Tracker</h1>
          <p className="text-slate-300 text-sm mt-1">Total Saldo Anda</p>
          <h2 className="text-3xl font-bold mt-2">{formatRupiah(totalBalance)}</h2>
        </header>

        {/* Content Area */}
        <div className="p-6">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4">Catat Transaksi</h3>
                <select 
                  className="w-full mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={selectedPocket} 
                  onChange={(e) => setSelectedPocket(e.target.value)}
                >
                  {pockets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatRupiah(p.balance)})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Nominal (Rp)" 
                  className="w-full mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Catatan (Opsional)" 
                  className="w-full mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-3">
                  <button onClick={() => handleTransaction('income')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                    <ArrowUpCircle size={20} /> Masuk
                  </button>
                  <button onClick={() => handleTransaction('expense')} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                    <ArrowDownCircle size={20} /> Keluar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Riwayat Terakhir</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800">{t.note}</p>
                        <p className="text-xs text-gray-500">{t.date} • {pockets.find(p => p.id === t.pocketId)?.name}</p>
                      </div>
                      <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-center text-gray-400 text-sm mt-4">Belum ada transaksi</p>}
                </div>
              </div>
            </div>
          )}

          {/* POCKETS TAB */}
          {activeTab === 'pockets' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nama dompet baru..." 
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={pocketName} 
                  onChange={(e) => setPocketName(e.target.value)}
                />
                <button onClick={addPocket} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition">
                  <PlusCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {pockets.map((p) => (
                  <div key={p.id} className="p-5 border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-12 rounded-full" style={{ backgroundColor: p.color }}></div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{p.name}</h4>
                        <p className="text-gray-500">{formatRupiah(p.balance)}</p>
                      </div>
                    </div>
                    <button onClick={() => deletePocket(p.id)} className="text-gray-400 hover:text-rose-500 transition p-2">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHARTS TAB */}
          {activeTab === 'charts' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 text-center mb-4">Distribusi Dompet</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pockets} dataKey="balance" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {pockets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatRupiah(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 text-center mb-4">Arus Kas</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <Tooltip formatter={(value) => formatRupiah(value)} cursor={{fill: 'transparent'}}/>
                      <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around p-3 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 transition ${activeTab === 'dashboard' ? 'text-slate-900 font-medium' : 'text-gray-400'}`}>
            <PlusCircle size={24} className="mb-1" />
            <span className="text-xs">Transaksi</span>
          </button>
          <button onClick={() => setActiveTab('pockets')} className={`flex flex-col items-center p-2 transition ${activeTab === 'pockets' ? 'text-slate-900 font-medium' : 'text-gray-400'}`}>
            <Wallet size={24} className="mb-1" />
            <span className="text-xs">Dompet</span>
          </button>
          <button onClick={() => setActiveTab('charts')} className={`flex flex-col items-center p-2 transition ${activeTab === 'charts' ? 'text-slate-900 font-medium' : 'text-gray-400'}`}>
            <ChartIcon size={24} className="mb-1" />
            <span className="text-xs">Grafik</span>
          </button>
        </nav>

      </div>
    </div>
  );
}