import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pockets, setPockets] = useState(() => {
    const saved = localStorage.getItem('myTrackerPockets');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Dompet Utama', balance: 0, color: '#3b82f6' }];
  });
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('myTrackerTransactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedPocket, setSelectedPocket] = useState(pockets[0]?.id || '');
  const [pocketName, setPocketName] = useState('');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
    { name: 'Pemasukan', total: totalIncome, fill: '#10b981' },
    { name: 'Pengeluaran', total: totalExpense, fill: '#ef4444' }
  ];

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Gaya CSS Sederhana yang Elegan
  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '80px', color: '#1e293b' },
    header: { backgroundColor: '#0f172a', color: 'white', padding: '24px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px', border: '1px solid #f1f5f9' },
    input: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    btnPrimary: { flex: 1, backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
    btnIncome: { flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
    btnExpense: { flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
    nav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '10px 0', zIndex: 1000 },
    navBtn: (isActive) => ({ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', color: isActive ? '#0f172a' : '#94a3b8', fontWeight: isActive ? 'bold' : 'normal', fontSize: '12px' })
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>My Tracker</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Total Saldo Anda</p>
        <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>{formatRupiah(totalBalance)}</h2>
      </div>

      <div style={{ padding: '20px' }}>
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={styles.card}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#334155' }}>Catat Transaksi</h3>
              <select style={styles.input} value={selectedPocket} onChange={(e) => setSelectedPocket(e.target.value)}>
                {pockets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({formatRupiah(p.balance)})</option>
                ))}
              </select>
              <input type="number" placeholder="Nominal (Rp)" style={styles.input} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input type="text" placeholder="Catatan (Opsional)" style={styles.input} value={note} onChange={(e) => setNote(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleTransaction('income')} style={styles.btnIncome}>+ Masuk</button>
                <button onClick={() => handleTransaction('expense')} style={styles.btnExpense}>- Keluar</button>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#334155', marginBottom: '10px' }}>Riwayat Terakhir</h3>
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{t.note}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{t.date} • {pockets.find(p => p.id === t.pocketId)?.name}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '30px' }}>Belum ada transaksi</p>}
            </div>
          </div>
        )}

        {/* POCKETS TAB */}
        {activeTab === 'pockets' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input type="text" placeholder="Nama dompet baru..." style={{ ...styles.input, margin: 0 }} value={pocketName} onChange={(e) => setPocketName(e.target.value)} />
              <button onClick={addPocket} style={{ ...styles.btnPrimary, flex: '0 0 80px' }}>Tambah</button>
            </div>
            {pockets.map(p => (
              <div key={p.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '12px', height: '36px', borderRadius: '6px', backgroundColor: p.color }}></div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{p.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{formatRupiah(p.balance)}</div>
                  </div>
                </div>
                <button onClick={() => deletePocket(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Hapus</button>
              </div>
            ))}
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <div>
            <div style={styles.card}>
              <h3 style={{ textAlign: 'center', fontSize: '15px', color: '#334155', marginBottom: '10px' }}>Distribusi Dompet</h3>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pockets} dataKey="balance" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
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

            <div style={styles.card}>
              <h3 style={{ textAlign: 'center', fontSize: '15px', color: '#334155', marginBottom: '10px' }}>Arus Kas</h3>
              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <Tooltip formatter={(value) => formatRupiah(value)} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
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

      {/* Bottom Nav */}
      <nav style={styles.nav}>
        <button onClick={() => setActiveTab('dashboard')} style={styles.navBtn(activeTab === 'dashboard')}>
          <div style={{ fontSize: '18px' }}>➕</div>
          <span>Transaksi</span>
        </button>
        <button onClick={() => setActiveTab('pockets')} style={styles.navBtn(activeTab === 'pockets')}>
          <div style={{ fontSize: '18px' }}>👛</div>
          <span>Dompet</span>
        </button>
        <button onClick={() => setActiveTab('charts')} style={styles.navBtn(activeTab === 'charts')}>
          <div style={{ fontSize: '18px' }}>📊</div>
          <span>Grafik</span>
        </button>
      </nav>
    </div>
  );
}