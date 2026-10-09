import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0mszBLJTUUjmES4628snmfeFdeqJglP0",
  authDomain: "futsal-training-hub.firebaseapp.com",
  projectId: "futsal-training-hub",
  storageBucket: "futsal-training-hub.firebasestorage.app",
  messagingSenderId: "186666539574",
  appId: "1:186666539574:web:e0b7e74938aa391a191697",
  measurementId: "G-3CW5EXW5DF"
};

let auth = null;
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, '(default)');
} catch (e) {
  console.warn("Erro ao iniciar Firebase:", e);
}

const EQUIPAS_INICIAIS = [
  { id: 't1', name: 'Equipa Principal' },
  { id: 't2', name: 'Sub-21' },
  { id: 't3', name: 'Equipa Feminina' }
];

const EXERCICIOS_INICIAIS = [
  { id: '1', name: 'Agachamento com Barra', mediaUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800', mediaType: 'image' },
  { id: '2', name: 'Peso Morto Hex Bar', mediaUrl: 'https://images.unsplash.com/photo-1603892853112-a957241dc4ff?q=80&w=800', mediaType: 'image' },
  { id: '3', name: 'Supino Reto', mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800', mediaType: 'image' },
  { id: '4', name: 'Salto para Caixa (Plyo)', mediaUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800', mediaType: 'image' }
];

const SESSOES_INICIAIS = [
  {
    id: 's1',
    teamId: 't1',
    name: 'Ativação & Força Máxima (-2)',
    variations: [
      {
        id: 'v1',
        name: 'Versão V1 (Titulares)',
        routine: [
          { exerciseId: '1', sets: 4, reps: '5', rest: 90, notes: 'Focar na explosão na subida', isSuperset: false },
          { exerciseId: '4', sets: 4, reps: '5', rest: 60, notes: 'Aterragem suave e controlada', isSuperset: false }
        ]
      }
    ]
  }
];

const IMAGEM_PADRAO = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800';

// Função auxiliar robusta para extrair o ID do YouTube de qualquer formato de link
function getYouTubeId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Componente inteligente e infalível para renderizar Imagem, Vídeo MP4 ou YouTube
function MediaViewer({ src, mediaType, alt, className }) {
  const url = src || IMAGEM_PADRAO;
  const type = mediaType || (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('.mp4') ? 'video' : 'image');

  if (type === 'video') {
    const ytId = getYouTubeId(url);
    if (ytId) {
      const thumbUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      return (
        <div className={`relative overflow-hidden bg-black flex items-center justify-center ${className}`}>
          <img 
            src={thumbUrl} 
            alt={alt || 'Vídeo YouTube'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-xs font-black pl-0.5">
              ▶
            </div>
          </div>
        </div>
      );
    }

    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt || 'Exercício'}
      className={`${className} object-cover`}
      onError={(e) => {
        e.target.src = IMAGEM_PADRAO;
      }}
    />
  );
}

function criarItemRotina(exerciseId = '') {
  return { exerciseId, sets: 3, reps: '10', rest: 60, notes: '', isSuperset: false };
}

function getSupersetGroupIds(routine) {
  const groupIds = Array(routine.length).fill(null);
  let nextGroupId = 0;
  for (let index = 0; index < routine.length - 1; index += 1) {
    if (!routine[index].isSuperset) continue;
    let groupId = groupIds[index];
    if (groupId === null) {
      groupId = groupIds[index - 1] ?? nextGroupId + 1;
      nextGroupId = Math.max(nextGroupId, groupId);
    }
    groupIds[index] = groupId;
    groupIds[index + 1] = groupId;
  }
  return groupIds;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [activeTab, setActiveTab] = useState('live');
  const [teams, setTeams] = useState(EQUIPAS_INICIAIS);
  const [exercises, setExercises] = useState(EXERCICIOS_INICIAIS);
  const [sessions, setSessions] = useState(SESSOES_INICIAIS);
  const [liveSession, setLiveSession] = useState(null);

  const [activeTeamId, setActiveTeamId] = useState(EQUIPAS_INICIAIS[0].id);
  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  const [newSessionName, setNewSessionName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [variations, setVariations] = useState([
    { id: 'v1', name: 'Versão V1', routine: [criarItemRotina(EXERCICIOS_INICIAIS[0].id)] }
  ]);

  const [newExName, setNewExName] = useState('');
  const [newExUrl, setNewExUrl] = useState('');
  const [newExType, setNewExType] = useState('image');
  const [editingExerciseId, setEditingExerciseId] = useState(null);

  const FPF_LOGO = 'https://logodownload.org/wp-content/uploads/2021/10/fpf-selecao-de-portugal-logo-4.png';
  const DARK_RED = '#5A1624';

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) {
      setStatusMessage('⚠️ Base de dados não inicializada.');
      return;
    }

    const unsubExercises = onSnapshot(doc(db, 'futsal_hub', 'exercises'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) {
        setExercises(docSnap.data().list);
      }
    }, (err) => {
      console.warn("Erro ao ler exercícios do Firestore:", err);
      setStatusMessage('❌ Erro de permissão/leitura no Firestore.');
    });

    const unsubSessions = onSnapshot(doc(db, 'futsal_hub', 'sessions'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) {
        setSessions(docSnap.data().list);
      }
    }, (err) => {
      console.warn("Erro ao ler sessões do Firestore:", err);
      setStatusMessage('❌ Erro de permissão/leitura no Firestore.');
    });

    return () => {
      unsubExercises();
      unsubSessions();
    };
  }, []);

  const saveExercisesToCloud = async (newExercises) => {
    setExercises(newExercises);
    if (db) {
      try {
        await setDoc(doc(db, 'futsal_hub', 'exercises'), { list: newExercises });
        setStatusMessage('✅ Exercícios guardados na cloud!');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (e) {
        console.error("Erro ao guardar exercícios:", e);
        setStatusMessage('❌ Erro ao gravar exercícios (ver consola).');
      }
    }
  };

  const saveSessionsToCloud = async (newSessions) => {
    setSessions(newSessions);
    if (db) {
      try {
        await setDoc(doc(db, 'futsal_hub', 'sessions'), { list: newSessions });
        setStatusMessage('✅ Sessão guardada na cloud!');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (e) {
        console.error("Erro ao guardar sessões:", e);
        setStatusMessage('❌ Erro ao gravar sessão (verifique as Regras).');
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!auth) {
      if (email && password) setUser({ email });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError('Credenciais inválidas. Verifique o e-mail e a palavra-passe.');
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111] text-white">
        <p>A carregar Futsal Training Hub...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#121212] font-sans text-white relative overflow-hidden" style={{ backgroundColor: DARK_RED }}>
        <img src={FPF_LOGO} alt="Watermark" className="absolute opacity-10 blur-sm pointer-events-none" style={{ width: '80vh' }} />
        <div className="relative z-10 w-full max-w-md rounded-xl bg-[#1a1a1a]/90 p-8 shadow-2xl border border-[#d1a153]/30 backdrop-blur">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-wider text-[#d1a153]">Futsal Training Hub</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Acesso Restrito - Equipa Técnica</p>
          </div>

          {loginError && (
            <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded text-xs font-bold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">E-mail Institucional</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rafa.97r@gmail.com"
                className="w-full bg-[#111] border border-gray-700 rounded p-3 text-white focus:border-[#d1a153] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Palavra-passe</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111] border border-gray-700 rounded p-3 text-white focus:border-[#d1a153] focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3.5 bg-[#8a152e] hover:bg-red-700 text-white font-black uppercase tracking-widest rounded transition shadow-lg border border-[#d1a153]/40 mt-2"
            >
              Entrar no Sistema
