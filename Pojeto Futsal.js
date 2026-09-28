import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "futsal-training-hub.firebaseapp.com",
  projectId: "futsal-training-hub",
  storageBucket: "futsal-training-hub.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Estados da Aplicação de Futsal
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveSession, setLiveSession] = useState({
    title: "Sessão Tática - Transições",
    variations: [
      { name: "Bloco Defensivo 2-2", routine: [{ name: "Deslocamento lateral", sets: 3, reps: 10, rest: 30, notes: "Intensidade máxima" }] }
    ]
  });
  const [groups, setGroups] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError('Erro ao entrar. Verifique o seu e-mail e palavra-passe.');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111] text-white">
        <p>A carregar o Futsal Training Hub...</p>
      </div>
    );
  }

  // --- ECRÃ DE LOGIN SEGURO ---
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4 text-white">
        <div className="w-full max-w-md rounded-xl bg-[#1e1e1e] p-8 shadow-2xl border border-[#333]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-wider text-[#d1a153]">FUTSAL TRAINING HUB</h1>
            <p className="text-sm text-gray-400 mt-2">Área Restrita - Equipa Técnica</p>
          </div>

          {authError && (
            <div className="mb-4 rounded bg-red-900/50 p-3 text-sm text-red-200 border border-red-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded bg-[#2a2a2a] px-4 py-3 text-white border border-[#4411] focus:border-[#d1a153] focus:outline-none"
                placeholder="exemplo@futsal.pt"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Palavra-passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded bg-[#2a2a2a] px-4 py-3 text-white border border-[#444] focus:border-[#d1a153] focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              className="w-full rounded bg-[#d1a153] py-3 font-semibold text-black hover:bg-[#b88c3f] transition-colors"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- APLICAÇÃO PRINCIPAL (APÓS LOGIN) ---
  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">
      {/* Barra de Navegação Superior */}
      <header className="flex justify-between items-center bg-[#1a1a1a] px-6 py-4 border-b border-[#333]">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-[#d1a153] tracking-widest">FUTSAL HUB</span>
          <span className="text-xs bg-[#2a2a2a] px-2.5 py-1 rounded text-gray-300">Autenticado: {user.email}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs bg-red-600/80 hover:bg-red-600 px-3 py-1.5 rounded transition-colors"
        >
          Terminar Sessão
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-bold mb-6 text-gray-200">Painel de Gestão e Treinos</h2>

        {/* Secção de Exemplo com o .map corrigido */}
        <div className="space-y-4">
          {liveSession.variations.map((variation, vIndex) => (
            <div key={vIndex} className="bg-[#181818] p-4 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold text-[#d1a153] mb-3">{variation.name}</h3>
              <div className="space-y-3">
                {variation.routine.map((item, index) => {
                  const groupId = groups[index];
                  return (
                    <article 
                      key={index} 
                      className={`flex overflow-hidden border-l-4 bg-[#222] p-4 rounded ${groupId ? 'border-[#d1a153]' : 'border-[#333]'}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {item.sets} séries • {item.reps} reps • {item.rest}s descanso
                        </p>
                        {item.notes && <p className="text-xs text-yellow-500/80 mt-1">{item.notes}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-500 border-t border-[#222]">
        Performance Hub • Futsal Training System
      </footer>
    </div>
  );
}
