import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, User, Briefcase, Phone, Mail, MapPin, Save, X, Image as ImageIcon, ArrowLeft, Loader2, Check, RefreshCw, Users, Calendar, StickyNote, UploadCloud, Trash2, ImagePlus, RotateCw, RotateCcw, AlertTriangle, Download, LogOut, LogIn, Settings, Edit3, Star, Copy, CheckCheck, Edit } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, signInWithCustomToken, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// --- Firebase Initialization (請確保這是您專屬的金鑰) ---
const firebaseConfig = {
  apiKey: "AIzaSyAc3NipKST1biFOflKns89BxbSufSphTz8",
  authDomain: "business-card-1de81.firebaseapp.com",
  projectId: "business-card-1de81",
  storageBucket: "business-card-1de81.firebasestorage.app",
  messagingSenderId: "426930624459",
  appId: "1:426930624459:web:51cef755672dc1992a084e"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'business-card-1de81';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [cards, setCards] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCards([]);
      return;
    }
    setIsLoadingCards(true);
    const cardsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'business_cards');
    const q = query(cardsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedCards.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setCards(fetchedCards);
      setIsLoadingCards(false);
    }, () => setIsLoadingCards(false));
    return () => unsubscribe();
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
        return;
      }
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch {
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      alert("登入發生錯誤：" + error.message);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("確定要登出嗎？")) await signOut(auth);
  };

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoginScreen onLogin={handleGoogleLogin} />;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 font-sans text-gray-800">
      <header className="bg-blue-600 text-white shadow-md p-4 flex justify-between items-center z-10 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2"><Briefcase size={24} /> AI 名片管家</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-blue-700 px-3 py-1.5 rounded-full opacity-90 max-w-[120px] truncate hidden sm:block border border-blue-500">
            {user.displayName || user.email}
          </span>
          <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"><Settings size={18} /></button>
          <button onClick={handleLogout} className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'list' && <CardList cards={cards} isLoading={isLoadingCards} user={user} />}
        {activeTab === 'capture' && <CaptureFlow user={user} userApiKey={userApiKey} cards={cards} onComplete={() => setActiveTab('list')} onCancel={() => setActiveTab('list')} />}
      </main>

      <nav className="bg-white border-t border-gray-200 flex justify-around p-2 pb-safe shrink-0">
        <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center p-2 w-1/2 rounded-lg ${activeTab === 'list' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
          <User size={24} /><span className="text-xs mt-1 font-medium">我的名片庫</span>
        </button>
        <button onClick={() => setActiveTab('capture')} className={`flex flex-col items-center p-2 w-1/2 rounded-lg ${activeTab === 'capture' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
          <ImagePlus size={24} /><span className="text-xs mt-1 font-medium">新增名片</span>
        </button>
      </nav>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-2">設定 Gemini API Key</h3>
            <p className="text-xs text-gray-500 mb-4">請輸入您專屬的 Google AI Studio 金鑰。此金鑰僅會儲存在您的瀏覽器中，不會上傳至伺服器。</p>
            <input 
              type="password" 
              placeholder="AIzaSy..." 
              value={userApiKey} 
              onChange={(e) => setUserApiKey(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
              <button onClick={() => {
                localStorage.setItem('gemini_api_key', userApiKey);
                setShowSettings(false);
                alert('金鑰已儲存！');
              }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 子組件 ---

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500 gap-3">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <p className="font-medium">載入系統中...</p>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm flex flex-col items-center text-center space-y-6">
        <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Briefcase size={48} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI 雲端名片管家</h1>
          <p className="text-gray-500 text-sm px-2">支援中英日多語辨識與自動翻譯，專屬您的業務人脈庫。</p>
        </div>
        <button onClick={onLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 shadow-md transition-all active:scale-95">
          使用 Google 帳號繼續
        </button>
      </div>
    </div>
  );
}

const StarLevelIcon = ({ level }) => {
  if (level === 3) return (
    <div className="relative flex items-center justify-center w-8 h-8 group">
      <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[8px] opacity-60 animate-pulse"></div>
      <Star size={26} className="fill-yellow-300 text-yellow-500 drop-shadow-[0_2px_4px_rgba(250,204,21,0.6)] z-10 scale-110 transition-transform" />
    </div>
  ); 
  if (level === 2) return <Star size={22} className="fill-amber-500 text-amber-600 drop-shadow-sm transition-transform" />; 
  if (level === 1) return <Star size={18} className="fill-amber-200 text-amber-400 transition-transform" />; 
  return <Star size={18} className="text-gray-300 opacity-40 group-hover:opacity-100 transition-opacity" />; 
};

function CardList({ cards, isLoading, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); 
  const [selectedCardId, setSelectedCardId] = useState(null);

  const toggleImportance = async (e, card) => {
    e.stopPropagation(); 
    try {
      const currentLevel = card.importance !== undefined ? card.importance : (card.isImportant ? 1 : 0);
      const nextLevel = (currentLevel + 1) % 4;
      const cardRef = doc(db, 'artifacts', appId, 'users', user.uid, 'business_cards', card.id);
      await updateDoc(cardRef, { importance: nextLevel, isImportant: nextLevel > 0 });
    } catch (err) {
      console.error("更新重要性失敗", err);
    }
  };

  const filteredCards = cards.filter(card => {
    if (!searchTerm) return true;
    
    const searchParts = searchTerm.toLowerCase().match(/[a-z0-9]+|[^a-z0-9\s]/g) || [];
    
    const combinedText = [
      card.name_zh, card.name_en, card.company_zh, card.company_en,
      card.title_zh, card.title_en, card.phone, card.email,
      card.address_zh, card.address_en, card.work_projects,
      card.relationship, card.occasion, card.notes
    ].map(v => v || '').join(' ').toLowerCase();

    return searchParts.every(part => combinedText.includes(part));
  }).sort((a, b) => {
    const aLevel = a.importance !== undefined ? a.importance : (a.isImportant ? 1 : 0);
    const bLevel = b.importance !== undefined ? b.importance : (b.isImportant ? 1 : 0);
    
    if (sortBy === 'important') {
      if (aLevel !== bLevel) return bLevel - aLevel;
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    }
    if (sortBy === 'oldest') return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0); 
  });

  const exportToCSV = () => {
    if (cards.length === 0) return alert("目前沒有資料");
    const headers = ["中文姓名", "英文姓名", "中文職稱", "英文職稱", "中文公司", "英文公司", "電話", "Email", "中文地址", "英文地址", "工作項目", "關係", "認識場合", "備註", "重要等級", "建立時間"];
    const levelText = { 3: 'S級', 2: 'A級', 1: 'B級', 0: 'C級(無)' };
    
    const rows = cards.map(c => {
      const imp = c.importance !== undefined ? c.importance : (c.isImportant ? 1 : 0);
      return [
        c.name_zh || '', c.name_en || '', c.title_zh || '', c.title_en || '', c.company_zh || '', c.company_en || '', 
        c.phone || '', c.email || '', c.address_zh || '', c.address_en || '', c.work_projects || '', c.relationship || '', 
        c.occasion || '', (c.notes || '').replace(/\n/g, ' '), levelText[imp], c.createdAt ? new Date(c.createdAt.toMillis()).toLocaleString() : ''
      ];
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `名片匯出_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) : null;
  if (selectedCard) return <CardDetail card={selectedCard} user={user} onBack={() => setSelectedCardId(null)} cards={cards} />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-white border-b shrink-0 flex flex-col gap-3 shadow-sm z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-gray-700 font-bold">名片庫 ({filteredCards.length})</h2>
          <div className="flex gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border-gray-300 rounded-lg bg-gray-50 px-2 py-1.5 focus:ring-blue-500 border">
              <option value="newest">最新加入</option>
              <option value="oldest">最舊加入</option>
              <option value="important">標記重要優先</option>
            </select>
            <button onClick={exportToCSV} className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"><Download size={16} />匯出</button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="全局模糊搜尋 (姓名、地點、備註...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={16} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {isLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div> : filteredCards.length === 0 ? <div className="text-center p-20 text-gray-400"><Briefcase size={48} className="mx-auto mb-4 opacity-20" /><p>找不到相關資料</p></div> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((c) => {
              const currentLevel = c.importance !== undefined ? c.importance : (c.isImportant ? 1 : 0);
              const mainInfoText = `姓名：${c.name_zh || c.name_en || ''}\n公司：${c.company_zh || c.company_en || ''}\n職稱：${c.title_zh || c.title_en || ''}\n電話：${c.phone || ''}\nEmail：${c.email || ''}`;

              return (
                <div key={c.id} onClick={() => setSelectedCardId(c.id)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] relative group">
                  <button onClick={(e) => toggleImportance(e, c)} className="absolute top-2 right-2 z-10 hover:bg-gray-50 rounded-full flex items-center justify-center w-10 h-10 transition-colors">
                    <StarLevelIcon level={currentLevel} />
                  </button>
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border shrink-0 flex items-center justify-center">{c.frontImageBase64 ? <img src={c.frontImageBase64} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="text-gray-300" />}</div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-semibold text-gray-900 truncate flex items-baseline gap-1.5">
                      <span>{c.name_zh || c.name_en || '未命名'}</span>
                      {c.name_zh && c.name_en && <span className="text-xs text-gray-500 font-normal truncate">({c.name_en})</span>}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{c.title_zh || c.title_en || '無職稱'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400 truncate pr-2">{c.company_zh || c.company_en}</p>
                      <div className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <CopyButton text={mainInfoText} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CardDetail({ card, user, onBack, cards }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const currentLevel = card.importance !== undefined ? card.importance : (card.isImportant ? 1 : 0);

  const toggleImportance = async () => {
    try {
      const nextLevel = (currentLevel + 1) % 4;
      const cardRef = doc(db, 'artifacts', appId, 'users', user.uid, 'business_cards', card.id);
      await updateDoc(cardRef, { importance: nextLevel, isImportant: nextLevel > 0 });
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async (updatedData) => {
    try {
      const cardRef = doc(db, 'artifacts', appId, 'users', user.uid, 'business_cards', card.id);
      await updateDoc(cardRef, updatedData);
      setIsEditing(false);
    } catch (err) { alert("更新失敗"); }
  };

  if (isEditing) {
    return <EditForm initialData={card} frontImage={card.frontImageBase64} backImage={card.backImageBase64} onSave={handleUpdate} onCancel={() => setIsEditing(false)} cards={cards} isUpdateMode />;
  }

  const name = card.name_zh || card.name_en || '未命名';
  const mainInfoText = `姓名：${card.name_zh || card.name_en || ''}\n公司：${card.company_zh || card.company_en || ''}\n職稱：${card.title_zh || card.title_en || ''}\n電話：${card.phone || ''}\nEmail：${card.email || ''}`;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto relative">
      <div className="bg-white px-4 py-3 border-b sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} /></button>
        <h2 className="text-lg font-semibold flex-1">詳細資訊</h2>
        <button onClick={toggleImportance} className="hover:bg-amber-50 rounded-full flex items-center justify-center w-11 h-11 transition-colors">
          <StarLevelIcon level={currentLevel} />
        </button>
        <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit size={20} /></button>
        <button onClick={() => setShowConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={20} /></button>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto w-full space-y-6 pb-10">
        <div className="flex justify-end mb-4">
          <CopyButton text={mainInfoText} label="複製主要資訊" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ImageCard title="正面" img={card.frontImageBase64} onDownload={() => { const a = document.createElement("a"); a.href = card.frontImageBase64; a.download = `${name}_正面.jpg`; a.click(); }} />
          {card.backImageBase64 && <ImageCard title="反面" img={card.backImageBase64} onDownload={() => { const a = document.createElement("a"); a.href = card.backImageBase64; a.download = `${name}_反面.jpg`; a.click(); }} />}
        </div>
        <Section title="名片資訊">
          <BilingualRow icon={<User size={18} />} label="姓名" zh={card.name_zh} en={card.name_en} />
          <BilingualRow icon={<Briefcase size={18} />} label="職稱" zh={card.title_zh} en={card.title_en} />
          <BilingualRow icon={<Briefcase size={18} />} label="公司" zh={card.company_zh} en={card.company_en} />
          <Row icon={<Phone size={18} />} label="電話" val={card.phone} link={`tel:${card.phone}`} />
          <Row icon={<Mail size={18} />} label="Email" val={card.email} link={`mailto:${card.email}`} />
          <BilingualRow icon={<MapPin size={18} />} label="地址" zh={card.address_zh} en={card.address_en} isMap />
        </Section>
        <Section title="個人註記" color="amber">
          <Row icon={<Users size={18} className="text-amber-600" />} label="工作項目 / 負責領域" val={card.work_projects} isLong />
          <Row icon={<Users size={18} className="text-amber-600" />} label="關係" val={card.relationship} />
          <Row icon={<Calendar size={18} className="text-amber-600" />} label="認識場合" val={card.occasion} />
          <Row icon={<StickyNote size={18} className="text-amber-600" />} label="備註" val={card.notes} isLong />
        </Section>
      </div>
      {showConfirm && <DeleteModal name={name} onCancel={() => setShowConfirm(false)} onConfirm={async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'business_cards', card.id));
        onBack();
      }} />}
    </div>
  );
}

// --- 小元件庫 ---

const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation(); // 阻止事件冒泡，確保點擊複製不會同時點開名片
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors shadow-sm border ${copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100'}`}>
      {copied ? <CheckCheck size={14} /> : <Copy size={14} />} {label && <span className="font-medium">{label}</span>}
    </button>
  );
};

const ImageCard = ({ title, img, onDownload }) => (
  <div className="bg-white p-3 rounded-xl shadow-sm border">
    <div className="flex justify-between items-center mb-2">
      <h4 className="text-sm font-bold text-gray-700">{title}</h4>
      {img && <button onClick={onDownload} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"><Download size={14} />儲存</button>}
    </div>
    <div className="bg-gray-100 rounded-lg overflow-hidden h-40 flex">{img ? <img src={img} className="m-auto max-h-full object-contain" /> : <p className="m-auto text-gray-400">無圖片</p>}</div>
  </div>
);

const Section = ({ title, children, color = "blue" }) => (
  <div className="space-y-2">
    <h3 className={`text-sm font-bold ml-1 ${color === 'amber' ? 'text-amber-700' : 'text-gray-700'}`}>{title}</h3>
    <div className={`bg-${color === 'amber' ? 'amber-50' : 'white'} rounded-xl shadow-sm border border-${color === 'amber' ? 'amber-100' : 'gray-100'} overflow-hidden`}>{children}</div>
  </div>
);

const Row = ({ icon, label, val, link, isLong }) => !val ? null : (
  <div className="flex items-start gap-4 p-4 border-b border-black/5 last:border-0 group">
    <div className="text-blue-500 mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-start justify-between gap-3">
        {link ? <a href={link} target="_blank" className="text-blue-600 font-medium break-all hover:underline leading-relaxed">{val}</a> : <p className={`text-gray-900 font-medium break-words leading-relaxed ${isLong ? 'whitespace-pre-wrap' : ''}`}>{val}</p>}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-1">
          <CopyButton text={val} />
        </div>
      </div>
    </div>
  </div>
);

const BilingualRow = ({ icon, label, zh, en, isMap }) => (!zh && !en) ? null : (
  <div className="flex items-start gap-4 p-4 border-b border-black/5 last:border-0">
    <div className="text-blue-500 mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0 space-y-3">
      <p className="text-xs text-gray-500">{label}</p>
      
      {zh && (
        <div className="flex items-center justify-between group/zh">
          <div className="flex-1 min-w-0">
            {isMap ? <a href={`https://maps.google.com/?q=${zh}`} target="_blank" className="block text-blue-600 font-medium hover:underline break-words">{zh} <span className="text-[10px] opacity-40 text-gray-600 ml-1">(中)</span></a> : <p className="text-gray-900 font-medium break-words">{zh} <span className="text-[10px] opacity-40 ml-1">(中)</span></p>}
          </div>
          <div className="opacity-0 group-hover/zh:opacity-100 transition-opacity shrink-0 pl-2">
            <CopyButton text={zh} />
          </div>
        </div>
      )}
      
      {en && (
        <div className="flex items-center justify-between group/en">
          <div className="flex-1 min-w-0">
            {isMap ? <a href={`https://maps.google.com/?q=${en}`} target="_blank" className="block text-blue-600 font-medium hover:underline break-words">{en} <span className="text-[10px] opacity-40 text-gray-600 ml-1">(外)</span></a> : <p className="text-gray-700 font-medium break-words">{en} <span className="text-[10px] opacity-40 ml-1">(外)</span></p>}
          </div>
          <div className="opacity-0 group-hover/en:opacity-100 transition-opacity shrink-0 pl-2">
            <CopyButton text={en} />
          </div>
        </div>
      )}
    </div>
  </div>
);

function DeleteModal({ name, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
        <div className="flex items-center gap-3 text-red-600 mb-4"><AlertTriangle size={28} /><h3 className="text-lg font-bold">確認刪除？</h3></div>
        <p className="text-gray-600 mb-6">您即將刪除「{name}」，此動作無法復原。</p>
        <div className="flex gap-3 justify-end"><button onClick={onCancel} className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">取消</button><button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg">確認刪除</button></div>
      </div>
    </div>
  );
}

// --- Capture Flow ---
// --- Capture Flow ---
function CaptureFlow({ user, userApiKey, cards, onComplete, onCancel }) {
  const [step, setStep] = useState('upload');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [extractedData, setExtractedData] = useState({});

  const fileInputRef = useRef();
  const frontCameraRef = useRef();
  const backCameraRef = useRef();

  const processImages = async () => {
    if (!frontImage) return;
    setStep('processing');
    try {
      const data = await extractCardInfoWithGemini(frontImage, backImage, userApiKey);
      setExtractedData(data);
      setStep('edit');
    } catch (error) {
      alert("AI 辨識失敗或金鑰無效，將進入手動模式。");
      skipToManual();
    }
  };

  const skipToManual = () => {
    setExtractedData({ name_zh: '', name_en: '', title_zh: '', title_en: '', company_zh: '', company_en: '', phone: '', email: '', address_zh: '', address_en: '', work_projects: '', occasion: '', relationship: '', importance: 0 });
    setStep('edit');
  };

  const saveCard = async (finalData) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'business_cards'), {
        ...finalData, frontImageBase64: frontImage, backImageBase64: backImage, createdAt: serverTimestamp(), importance: finalData.importance || 0
      });
      onComplete();
    } catch { alert("儲存失敗"); }
  };

  // 共用讀取圖片與壓縮邏輯
  const handleFileRead = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgObj = new Image(); imgObj.src = ev.target.result;
      imgObj.onload = () => {
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        const MAX = 1200; let w = imgObj.width, h = imgObj.height;
        if (w > MAX) { h *= (MAX/w); w = MAX; }
        canvas.width = w; canvas.height = h; ctx.drawImage(imgObj, 0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    }; reader.readAsDataURL(file);
  });

  // 處理多張圖片上傳 (批次匯入)
  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 2);
    if (files.length === 0) return;
    if (files[0]) setFrontImage(await handleFileRead(files[0]));
    if (files[1]) setBackImage(await handleFileRead(files[1]));
    e.target.value = null; // 重置 input
  };

  // 處理單張拍照
  const handleSingleUpload = async (e, setImg) => {
    const file = e.target.files[0];
    if (!file) return;
    setImg(await handleFileRead(file));
    e.target.value = null; // 重置 input
  };

  if (step === 'upload') return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto p-4 space-y-5 pb-20">
      <div className="bg-white -m-4 mb-0 p-4 border-b flex items-center gap-3 shadow-sm">
        <button onClick={onCancel} className="p-1"><X size={24}/></button>
        <h2 className="text-lg font-bold">新增名片</h2>
      </div>

      {/* 圖片預覽區 */}
      {(frontImage || backImage) && (
        <div className="flex gap-3">
          {frontImage && <ImagePreview label="名片正面" img={frontImage} setImg={setFrontImage} />}
          {backImage && <ImagePreview label="名片反面" img={backImage} setImg={setBackImage} />}
        </div>
      )}

      {/* 動態相機按鈕區：依據拍照進度切換 */}
      {!frontImage ? (
        <div className="space-y-3">
          <button onClick={() => frontCameraRef.current.click()} className="w-full h-32 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all">
            <Camera size={40} className="mb-2" />
            <span className="font-bold text-lg">開啟相機拍「正面」</span>
          </button>
          <input type="file" accept="image/*" capture="environment" ref={frontCameraRef} className="hidden" onChange={(e) => handleSingleUpload(e, setFrontImage)} />
        </div>
      ) : !backImage ? (
        <div className="space-y-3">
          <button onClick={() => backCameraRef.current.click()} className="w-full h-24 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center shadow-md active:scale-95 transition-all">
            <Camera size={32} className="mb-1" />
            <span className="font-bold">繼續拍「反面」(可略過)</span>
          </button>
          <input type="file" accept="image/*" capture="environment" ref={backCameraRef} className="hidden" onChange={(e) => handleSingleUpload(e, setBackImage)} />
        </div>
      ) : null}

      {/* 批次匯入按鈕 (若正反面都滿了則自動隱藏) */}
      {(!frontImage || !backImage) && (
        <div>
          <button onClick={() => fileInputRef.current.click()} className="w-full py-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-2xl flex justify-center items-center gap-2 hover:border-blue-400 active:bg-gray-50 transition-colors">
            <ImageIcon size={22} />
            從相簿一次匯入 (至多2張)
          </button>
          <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleBatchUpload} />
        </div>
      )}

      {/* 執行辨識區 */}
      {userApiKey ? (
        <button onClick={processImages} disabled={!frontImage} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all ${frontImage ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 mt-4' : 'bg-gray-300 text-gray-500'}`}><RefreshCw size={22} />開始 AI 智能翻譯</button>
      ) : (
        <div className="space-y-3 mt-4">
          <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200">您尚未設定專屬 API Key，目前僅能使用手動輸入。</div>
          <button onClick={skipToManual} disabled={!frontImage} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all ${frontImage ? 'bg-gray-800 hover:bg-gray-900 text-white active:scale-95' : 'bg-gray-300 text-gray-500'}`}><Edit3 size={22} />手動輸入名片資訊</button>
        </div>
      )}
    </div>
  );

  if (step === 'processing') return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 space-y-4">
      <div className="relative"><Loader2 size={64} className="text-blue-500 animate-spin" /><RefreshCw size={24} className="absolute inset-0 m-auto text-blue-500" /></div>
      <h2 className="text-xl font-bold">AI 翻譯辨識中...</h2>
      <p className="text-gray-500">正在分析職稱、地址並歸納工作項目</p>
    </div>
  );

  return <EditForm initialData={extractedData} frontImage={frontImage} backImage={backImage} onSave={saveCard} onCancel={onCancel} cards={cards} />;
}

// 新的圖片預覽與旋轉小元件 (取代原本的 Uploader 元件)
function ImagePreview({ label, img, setImg }) {
  const rotate = (dir) => {
    const i = new Image(); i.src = img; i.onload = () => {
      const c = document.createElement('canvas'); const x = c.getContext('2d');
      c.width = i.height; c.height = i.width;
      x.translate(c.width/2, c.height/2); x.rotate(dir * 90 * Math.PI / 180); x.drawImage(i, -i.width/2, -i.height/2);
      setImg(c.toDataURL('image/jpeg', 0.8));
    };
  };
  return (
    <div className="space-y-2 flex-1 w-1/2">
      <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>
      <div className="relative border rounded-2xl h-32 bg-gray-100 overflow-hidden shadow-sm flex">
        <img src={img} className="m-auto max-h-full object-contain" />
      </div>
      <div className="flex gap-1">
        <button onClick={() => rotate(-1)} className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-100 flex justify-center items-center transition-colors"><RotateCcw size={14}/></button>
        <button onClick={() => rotate(1)} className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-100 flex justify-center items-center transition-colors"><RotateCw size={14}/></button>
        <button onClick={() => setImg(null)} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function EditForm({ initialData, frontImage, backImage, onSave, onCancel, cards = [], isUpdateMode = false }) {
  const [data, setData] = useState({ ...initialData });
  const [saving, setSaving] = useState(false);
  const change = (e) => setData({ ...data, [e.target.name]: e.target.value });
  const save = async () => { setSaving(true); await onSave(data); };

  const getSuggestions = (field) => [...new Set(cards.map(c => c[field]).filter(Boolean))];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onCancel} className="text-gray-500 font-medium">取消</button>
        <h2 className="font-bold">{isUpdateMode ? '編輯名片' : '確認辨識結果'}</h2>
        <button onClick={save} disabled={saving} className={`font-bold flex items-center gap-1 ${saving ? 'text-gray-300' : 'text-blue-600'}`}>{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>}儲存</button>
      </div>
      <div className="p-4 space-y-6 max-w-2xl mx-auto w-full pb-20">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {frontImage && <img src={frontImage} className="h-40 rounded-lg border snap-start" />}
          {backImage && <img src={backImage} className="h-40 rounded-lg border snap-start" />}
        </div>
        {!isUpdateMode && <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2"><Check className="text-blue-500 shrink-0" size={18} /><p className="text-xs text-blue-700">可點擊欄位修改，系統提供歷史紀錄快速帶入功能。</p></div>}
        
        <div className="space-y-4">
          <Section title="姓名與職稱">
            <EditRow label="姓名 (中)" name="name_zh" val={data.name_zh} onChange={change} icon={<User size={16}/>} />
            <EditRow label="Name (外)" name="name_en" val={data.name_en} onChange={change} icon={<User size={16}/>} />
            <EditRow label="職稱 (中譯)" name="title_zh" val={data.title_zh} onChange={change} icon={<Briefcase size={16}/>} suggestions={getSuggestions('title_zh')} />
            <EditRow label="Title (外文)" name="title_en" val={data.title_en} onChange={change} icon={<Briefcase size={16}/>} />
          </Section>
          <Section title="公司與聯繫">
            <EditRow label="公司名稱 (中譯)" name="company_zh" val={data.company_zh} onChange={change} suggestions={getSuggestions('company_zh')} />
            <EditRow label="Company (外文)" name="company_en" val={data.company_en} onChange={change} />
            <EditRow label="電話" name="phone" val={data.phone} onChange={change} icon={<Phone size={16}/>} />
            <EditRow label="Email" name="email" val={data.email} onChange={change} icon={<Mail size={16}/>} />
          </Section>
          <Section title="地址 (中/外)">
            <EditRow label="地址 (中譯)" name="address_zh" val={data.address_zh} onChange={change} />
            <EditRow label="Address (外文)" name="address_en" val={data.address_en} onChange={change} />
          </Section>
          <Section title="工作項目與備註" color="amber">
            <div className="p-3"><label className="block text-[10px] font-bold text-amber-600 mb-1 ml-1 uppercase tracking-wider">工作項目 / 負責領域</label><textarea name="work_projects" value={data.work_projects} onChange={change} rows={3} className="w-full p-2 border border-amber-200 rounded-lg text-sm focus:ring-1 focus:ring-amber-400 focus:outline-none bg-white" /></div>
            <EditRow label="關係" name="relationship" val={data.relationship} onChange={change} suggestions={getSuggestions('relationship')} />
            <EditRow label="認識場合" name="occasion" val={data.occasion} onChange={change} suggestions={getSuggestions('occasion')} />
            <div className="p-3 border-t border-black/5"><label className="block text-[10px] font-bold text-amber-600 mb-1 ml-1 uppercase tracking-wider">額外備註</label><textarea name="notes" value={data.notes} onChange={change} rows={3} className="w-full p-2 border border-amber-200 rounded-lg text-sm focus:ring-1 focus:ring-amber-400 focus:outline-none bg-white" /></div>
          </Section>
        </div>
        <button onClick={save} disabled={saving} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex justify-center items-center gap-2 ${saving ? 'bg-gray-400' : 'bg-blue-600 text-white active:scale-95'}`}>{saving ? '處理中...' : (isUpdateMode ? '確認修改' : '確認無誤，存入名片庫')}</button>
      </div>
    </div>
  );
}

const EditRow = ({ label, name, val, onChange, icon, suggestions = [] }) => {
  const listId = `${name}-suggestions`;
  return (
    <div className="p-3 border-b border-black/5 last:border-0 flex items-center gap-3">
      {icon && <div className="text-gray-300">{icon}</div>}
      <div className="flex-1 min-w-0">
        <label className="block text-[10px] font-bold text-gray-400 mb-0.5 ml-1 uppercase tracking-wider">{label}</label>
        <input type="text" name={name} value={val || ''} onChange={onChange} list={suggestions.length > 0 ? listId : undefined} className="w-full text-sm font-medium focus:outline-none border-b border-transparent focus:border-blue-400 pb-0.5 bg-transparent" />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>
    </div>
  );
};

async function extractCardInfoWithGemini(frontBase64, backBase64, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `你是一個專業助理。請分析名片影像並嚴格回傳 JSON 格式：
  {
    "name_zh": "", "name_en": "", "title_zh": "", "title_en": "",
    "company_zh": "", "company_en": "", "phone": "", "email": "",
    "address_zh": "", "address_en": "", "work_projects": "",
    "relationship": "", "occasion": "", "notes": ""
  }`;

  const parts = [{ text: prompt }];

  const addImagePart = (base64Str) => {
    if (base64Str && typeof base64Str === 'string' && base64Str.includes(',')) {
      const cleanBase64 = base64Str.split(',')[1];
      if (cleanBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
    }
  };

  addImagePart(frontBase64);
  addImagePart(backBase64);

  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: parts }] }) });
    if (!res.ok) throw new Error(`API 報錯: ${res.status}`);
    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
  } catch (error) {
    console.error("辨識發生錯誤:", error);
    throw error;
  }
}