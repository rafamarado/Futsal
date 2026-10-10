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
  { id: 'amasculina', name: 'A Masculina' },
  { id: 'afeminina', name: 'A Feminina' },
  { id: 'outro', name: 'Outro' },
  { id: 'sub23m', name: 'Sub-23 M' },
  { id: 'sub20m', name: 'Sub-20 M' },
  { id: 'sub19m', name: 'Sub-19 M' },
  { id: 'sub18m', name: 'Sub-18 M' },
  { id: 'sub17m', name: 'Sub-17 M' },
  { id: 'sub16m', name: 'Sub-16 M' },
  { id: 'sub15m', name: 'Sub-15 M' },
  { id: 'sub14m', name: 'Sub-14 M' },
  { id: 'sub13m', name: 'Sub-13 M' },
  { id: 'sub12m', name: 'Sub-12 M' },
  { id: 'sub11m', name: 'Sub-11 M' },
  { id: 'sub10m', name: 'Sub-10 M' },
  { id: 'sub23f', name: 'Sub-23 F' },
  { id: 'sub20f', name: 'Sub-20 F' },
  { id: 'sub19f', name: 'Sub-19 F' },
  { id: 'sub18f', name: 'Sub-18 F' },
  { id: 'sub17f', name: 'Sub-17 F' },
  { id: 'sub16f', name: 'Sub-16 F' },
  { id: 'sub15f', name: 'Sub-15 F' },
  { id: 'sub14f', name: 'Sub-14 F' },
  { id: 'sub13f', name: 'Sub-13 F' },
  { id: 'sub12f', name: 'Sub-12 F' },
  { id: 'sub11f', name: 'Sub-11 F' },
  { id: 'sub10f', name: 'Sub-10 F' }
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
    teamId: 'amasculina',
    name: 'Ativação & Força Máxima (-2)',
    variations: [
      {
        id: 'v1',
        name: 'Versão V1 (Titulares)',
        routine: [
          { exerciseId: '1', sets: '4', reps: '5', rest: '90', notes: 'Focar na explosão na subida', isSuperset: false },
          { exerciseId: '4', sets: '4', reps: '5', rest: '60', notes: 'Aterragem suave e controlada', isSuperset: false }
        ]
      }
    ]
  }
];

const IMAGEM_PADRAO = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800';

function getYouTubeId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length >= 10) ? match[2] : null;
}

function renderDetailString(val, suffix) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '' || str === '0' || str === '-' || str.toLowerCase() === 'n/a') return null;
  return isNaN(str) ? str : `${str}${suffix}`;
}

function MediaViewer({ src, mediaType, alt, className }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const url = src || IMAGEM_PADRAO;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const type = mediaType || (isYouTube || url.includes('.mp4') ? 'video' : 'image');

  if (hasError || !url.trim()) {
    return (
      <div className={`bg-gray-800 flex flex-col items-center justify-center text-gray-400 text-xs uppercase font-bold w-full h-full ${className}`}>
        <span>Sem Média</span>
      </div>
    );
  }

  if (type === 'video' || isYouTube) {
    const ytId = getYouTubeId(url);
    if (ytId) {
      if (isPlaying) {
        return (
          <div className={`relative flex items-center justify-center bg-black w-full h-full ${className}`}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
              title={alt || 'Vídeo YouTube'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }}
              className="absolute top-2 right-2 bg-black/90 hover:bg-red-900 text-white rounded px-2 py-0.5 text-xs font-bold z-10 shadow"
            >
              ✕ Fechar
            </button>
          </div>
        );
      }

      const thumbUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      return (
        <div 
          onClick={() => setIsPlaying(true)}
          className={`relative flex items-center justify-center bg-black cursor-pointer group w-full h-full ${className}`}
          title="Clique para reproduzir o vídeo"
        >
          <img 
            src={thumbUrl} 
            alt={alt || 'Vídeo YouTube'} 
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
            <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl text-lg font-black pl-1 transition">
              ▶
            </div>
          </div>
        </div>
      );
    }

    return (
      <video
        src={url}
        controls
        autoPlay
        loop
        muted
        playsInline
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain ${className}`}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt || 'Exercício'}
      className={`w-full h-full object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

function criarItemRotina(exerciseId = '') {
  return { exerciseId, sets: '3', reps: '10', rest: '60', notes: '', isSuperset: false };
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
  const [teams] = useState(EQUIPAS_INICIAIS);
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
      console.warn("Erro ao ler exercícios:", err);
    });

    const unsubSessions = onSnapshot(doc(db, 'futsal_hub', 'sessions'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().list) {
        setSessions(docSnap.data().list);
      }
    }, (err) => {
      console.warn("Erro ao ler sessões:", err);
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
        setStatusMessage('✅ Exercícios guardados!');
        setTimeout(() => setStatusMessage(''), 2000);
      } catch (e) {
        console.error("Erro ao guardar exercícios:", e);
      }
    }
  };

  const saveSessionsToCloud = async (newSessions) => {
    setSessions(newSessions);
    if (db) {
      try {
        await setDoc(doc(db, 'futsal_hub', 'sessions'), { list: newSessions });
        setStatusMessage('✅ Sessão guardada com sucesso!');
        setTimeout(() => setStatusMessage(''), 2000);
      } catch (e) {
        console.error("Erro ao guardar sessões:", e);
        setStatusMessage('❌ Erro ao gravar sessão.');
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
      setLoginError('Credenciais inválidas.');
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
            </button>
          </form>
        </div>
      </div>
    );
  }

  const resetSessionForm = () => {
    setNewSessionName('');
    setEditingSessionId(null);
    setVariations([{ id: `v-${Date.now()}`, name: 'Versão V1', routine: [criarItemRotina(exercises[0]?.id || '')] }]);
  };

  const handleAddExercise = (event) => {
    event.preventDefault();
    if (!newExName.trim()) return;
    
    const urlClean = newExUrl.trim();
    const isYt = urlClean.includes('youtube.com') || urlClean.includes('youtu.be');
    const computedType = isYt || urlClean.includes('.mp4') ? 'video' : (newExType || 'image');

    const exercise = {
      id: editingExerciseId || Date.now().toString(),
      name: newExName.trim(),
      mediaUrl: urlClean || IMAGEM_PADRAO,
      mediaType: computedType
    };

    const updated = editingExerciseId 
      ? exercises.map(item => item.id === editingExerciseId ? exercise : item) 
      : [...exercises, exercise];
    
    saveExercisesToCloud(updated);
    setNewExName('');
    setNewExUrl('');
    setNewExType('image');
    setEditingExerciseId(null);
  };

  const handleDeleteExercise = (exerciseId) => {
    const updated = exercises.filter(exercise => exercise.id !== exerciseId);
    saveExercisesToCloud(updated);
  };

  const handleAddVariation = () => {
    setVariations([...variations, { id: `v-${Date.now()}`, name: `Versão V${variations.length + 1}`, routine: [criarItemRotina(exercises[0]?.id || '')] }]);
  };

  const handleRemoveVariation = (variationIndex) => {
    if (variations.length <= 1) return;
    setVariations(variations.filter((_, i) => i !== variationIndex));
  };

  const handleAddExerciseToVariation = (variationIndex) => {
    setVariations(variations.map((v, i) => i === variationIndex ? { ...v, routine: [...v.routine, criarItemRotina(exercises[0]?.id || '')] } : v));
  };

  const handleUpdateRoutineItem = (variationIndex, itemIndex, field, value) => {
    setVariations(variations.map((v, vIdx) => {
      if (vIdx !== variationIndex) return v;
      const updatedRoutine = v.routine.map((item, i) => i === itemIndex ? { ...item, [field]: value } : item);
      return { ...v, routine: updatedRoutine };
    }));
  };

  const handleRemoveRoutineItem = (variationIndex, itemIndex) => {
    setVariations(variations.map((v, vIdx) => vIdx === variationIndex ? { ...v, routine: v.routine.filter((_, i) => i !== itemIndex) } : v));
  };

  const handleEditSession = (session) => {
    setEditingSessionId(session.id);
    setActiveTeamId(session.teamId);
    setNewSessionName(session.name);
    setVariations(session.variations.map(v => ({ 
      id: v.id || `v-${Date.now()}`, 
      name: v.name, 
      routine: v.routine.map(i => ({ ...i })) 
    })));
    setActiveTab('builder');
  };

  const handleSaveSession = (event) => {
    event.preventDefault();
    if (!newSessionName.trim()) return;

    setSessions(prevSessions => {
      let updated;
      if (editingSessionId) {
        updated = prevSessions.map(s => s.id === editingSessionId ? {
          ...s,
          teamId: activeTeam.id,
          name: newSessionName.trim(),
          variations: variations
        } : s);
      } else {
        const newSession = {
          id: `s-${Date.now()}`,
          teamId: activeTeam.id,
          name: newSessionName.trim(),
          variations: variations
        };
        updated = [...prevSessions, newSession];
      }
      
      saveSessionsToCloud(updated);
      return updated;
    });

    resetSessionForm();
    setActiveTab('live');
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prevSessions => {
      const updated = prevSessions.filter(s => s.id !== sessionId);
      saveSessionsToCloud(updated);
      return updated;
    });

    if (liveSession && liveSession.id === sessionId) {
      setLiveSession(null);
    }
  };

  const loadSessionIntoBuilderAsCopy = (sessionId) => {
    if (!sessionId) return;
    const sessionToImport = sessions.find(s => s.id === sessionId);
    if (!sessionToImport) return;
    
    setEditingSessionId(null);
    setNewSessionName(sessionToImport.name + ' (Cópia)');
    setVariations(sessionToImport.variations.map(v => ({
      id: `v-${Date.now()}-${Math.random()}`,
      name: v.name,
      routine: v.routine.map(i => ({ ...i }))
    })));
    setActiveTab('builder');
    setStatusMessage('📋 Treino carregado! Clique em "Guardar" para finalizar.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const castToTV = (session) => {
    const populatedSession = {
      ...session,
      teamName: activeTeam.name,
      variations: session.variations.map(variation => ({
        ...variation,
        routine: variation.routine.map(item => {
          const exercise = exercises.find(e => e.id === item.exerciseId);
          return { 
            ...item, 
            name: exercise?.name || 'Exercício', 
            mediaUrl: exercise?.mediaUrl || IMAGEM_PADRAO,
            mediaType: exercise?.mediaType || 'image'
          };
        })
      }))
    };
    setLiveSession(populatedSession);
    setActiveTab('tv_display');
  };

  const teamSessions = sessions.filter(s => s.teamId === activeTeam.id);

  // ==========================================
  // ECRÃ DE TRANSMISSÃO (TV) - TAMANHOS INTERMÉDIOS
  // ==========================================
  if (activeTab === 'tv_display') {
    return (
      <div className="flex h-screen w-screen flex-col bg-[#111] text-white overflow-hidden select-none">
        
        <header className="flex items-center justify-between border-b-[3px] border-gray-800 bg-[#161616] px-6 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <img src={FPF_LOGO} alt="FPF" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase text-[#d1a153] leading-tight">{liveSession?.name || 'GYM FLOOR STANDBY'}</h1>
              <p className="text-base md:text-lg lg:text-xl font-bold uppercase text-gray-400 mt-1">{liveSession && liveSession.teamName}</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('live')} className="rounded border-2 border-gray-600 bg-gray-800 px-5 py-2 font-black uppercase hover:bg-gray-700 text-sm md:text-base">
            Voltar ao Painel
          </button>
        </header>
        
        <div className="flex-1 p-4 md:p-6 h-full min-h-0 overflow-hidden">
          {!liveSession ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <p className="text-2xl md:text-3xl font-bold text-gray-400">A aguardar seleção de treino</p>
              <button onClick={() => setActiveTab('live')} className="rounded-xl bg-[#8a152e] px-8 py-4 text-xl md:text-2xl font-black uppercase">Escolher sessão</button>
            </div>
          ) : (
            <div className="grid h-full w-full gap-4 items-stretch" style={{ gridTemplateColumns: `repeat(${liveSession.variations.length}, minmax(0, 1fr))` }}>
              {liveSession.variations.map((variation) => {
                const groups = getSupersetGroupIds(variation.routine);
                return (
                  <div key={variation.id} className="flex flex-col h-full bg-[#181818] p-4 border-[3px] border-gray-800 rounded-2xl overflow-hidden">
                    
                    <h3 className="text-center text-xl md:text-2xl lg:text-3xl font-black uppercase text-[#d1a153] tracking-widest py-3 mb-4 shrink-0 border-b-[3px] border-gray-800">{variation.name}</h3>
                    
                    <div className="flex flex-col flex-1 gap-4 min-h-0 h-full overflow-hidden">
                      {variation.routine.map((item, index) => {
                        const groupId = groups[index];
                        
                        const details = [];
                        const setsFmt = renderDetailString(item.sets, ' Séries');
                        if (setsFmt) details.push(<span key="sets" className="text-[#d1a153]">{setsFmt}</span>);

                        const repsFmt = renderDetailString(item.reps, ' Reps');
                        if (repsFmt) details.push(<span key="reps">{repsFmt}</span>);

                        const restFmt = renderDetailString(item.rest, 's Rest');
                        if (restFmt) details.push(<span key="rest">{restFmt}</span>);

                        return (
                          <article key={index} className={`flex flex-row flex-1 min-h-0 overflow-hidden bg-[#222] rounded-xl shadow-lg ${groupId ? 'border-l-[8px] border-[#d1a153] bg-gradient-to-b from-[#d1a153]/10 to-[#222]' : 'border-l-[8px] border-[#8a152e]'}`}>
                            
                            <div className="w-1/3 lg:w-1/4 bg-black shrink-0 relative overflow-hidden">
                               <MediaViewer src={item.mediaUrl} mediaType={item.mediaType} alt={item.name} className="absolute inset-0 p-2" />
                            </div>
                            
                            <div className="flex-1 p-4 md:p-5 flex flex-col justify-center min-w-0 overflow-hidden">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                
                                <h4 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-wide leading-tight break-words whitespace-normal">{item.name}</h4>
                                
                                {groupId && (
                                  <span className="bg-[#d1a153]/20 text-[#d1a153] border-2 border-[#d1a153]/40 px-3 py-1.5 rounded-lg text-sm lg:text-base font-black uppercase shrink-0">
                                    🔗 Supersérie
                                  </span>
                                )}
                              </div>

                              {details.length > 0 && (
                                <div className="flex flex-wrap items-center gap-4 text-base sm:text-lg md:text-xl font-bold text-gray-300 mt-1 mb-2">
                                  {details.reduce((prev, curr, i) => [prev, <span key={`dot-${i}`}>•</span>, curr])}
                                </div>
                              )}

                              {item.notes && (
                                <p className="text-sm sm:text-base md:text-lg text-yellow-300 font-bold bg-yellow-950/40 p-3 md:p-4 mt-2 rounded-xl border-2 border-yellow-600/30 break-words whitespace-normal">
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          </article>
                        );
                      })}
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

  // ==========================================
  // DASHBOARD / EDITOR (Não foi alterado)
  // ==========================================
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212] text-white">
      <aside className="flex w-72 flex-col border-r border-gray-800 bg-[#181818]">
        <div className="flex items-center gap-3 border-b border-gray-800 p-6">
          <img src={FPF_LOGO} alt="FPF" className="h-8 w-8 object-contain" />
          <h1 className="font-black tracking-wider text-[#d1a153]">Performance Hub</h1>
        </div>

        {statusMessage && (
          <div className="bg-[#222] p-2 text-center text-xs font-bold text-[#d1a153] border-b border-gray-800">
            {statusMessage}
          </div>
        )}

        <div className="border-b border-gray-800 p-4 bg-[#161616]">
          <label className="mb-2 block text-xs font-bold uppercase text-gray-400">Seleção / Escalão</label>
          <select value={activeTeam.id} onChange={(e) => setActiveTeamId(e.target.value)} className="w-full rounded border border-gray-700 bg-[#222] p-2.5 font-bold text-white text-sm max-h-56 overflow-y-auto">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {[
            ['live', '📺', 'Gestão de Sessões'],
            ['tv_display', '🖥️', 'Transmissão (Modo TV)'],
            ['builder', '📋', 'Criar Novo Treino'],
            ['database', '🏋️', 'Base de Exercícios']
          ].map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full rounded px-4 py-3 text-left font-semibold ${activeTab === tab ? 'bg-[#8a152e] text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
              <span className="mr-3">{icon}</span>{label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#080808]">
          <p className="text-[11px] text-gray-400 truncate mb-2">Sessão: {user.email}</p>
          <button onClick={handleLogout} className="w-full rounded bg-red-900/60 hover:bg-red-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-200">
            Terminar Sessão
          </button>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-y-auto" style={{ backgroundImage: 'radial-gradient(circle at top right, #5A162433, #121212 60%)' }}>
        <header className="border-b border-gray-800 bg-[#121212]/80 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase">{activeTeam.name}</h2>
            <p className="text-xs font-bold uppercase tracking-wide text-[#d1a153]">Consola de Controlo de Treino</p>
          </div>
        </header>

        {activeTab === 'live' && (
          <main className="flex-1 p-8">
            <section className="mb-8 border border-gray-700 bg-[#181818] p-6 text-center">
              {liveSession ? (
                <>
                  <p className="mb-2 font-bold uppercase text-green-400">Sessão ativa no ecrã</p>
                  <h3 className="mb-5 text-3xl font-black uppercase">{liveSession.name}</h3>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setActiveTab('tv_display')} className="bg-[#d1a153] px-5 py-3 font-bold uppercase text-black">Abrir ecrã de transmissão</button>
                    <button onClick={() => setLiveSession(null)} className="bg-[#8a152e] px-5 py-3 font-bold uppercase">Parar transmissão</button>
                  </div>
                </>
              ) : (
                <p className="font-bold text-gray-400">Nenhuma sessão em transmissão</p>
              )}
            </section>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-3">
              <h3 className="font-bold uppercase">Sessões disponíveis para {activeTeam.name}</h3>
              <div className="flex items-center gap-3">
                <select 
                  onChange={(e) => {
                    loadSessionIntoBuilderAsCopy(e.target.value);
                    e.target.value = "";
                  }} 
                  defaultValue="" 
                  className="bg-[#222] border border-gray-600 text-xs p-2 text-white rounded font-bold cursor-pointer"
                >
                  <option value="" disabled>Importar treino...</option>
                  {teams.map(t => {
                    const tSessions = sessions.filter(s => s.teamId === t.id);
                    if (tSessions.length === 0) return null;
                    return (
                      <optgroup key={t.id} label={t.name}>
                        {tSessions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <button onClick={() => { resetSessionForm(); setActiveTab('builder'); }} className="bg-[#d1a153] px-4 py-2 text-sm font-black uppercase text-black">+ Criar treino</button>
              </div>
            </div>

            {teamSessions.length === 0 ? (
              <p className="bg-[#1a1a1a] p-8 text-center text-gray-400">Ainda não existem sessões para este escalão.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {teamSessions.map((session) => (
                  <article key={session.id} className="flex flex-wrap items-center justify-between gap-4 border border-gray-800 bg-[#1a1a1a] p-5">
                    <div>
                      <h4 className="text-lg font-black uppercase">{session.name}</h4>
                      <p className="mt-1 text-sm text-gray-400">{session.variations.length} variações</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleEditSession(session)} className="bg-gray-700 px-3 py-2 text-sm font-bold hover:bg-gray-600">Editar</button>
                      <button onClick={() => castToTV(session)} className="bg-[#d1a153] px-3 py-2 text-sm font-black uppercase text-black">Transmitir</button>
                      <button onClick={() => handleDeleteSession(session.id)} className="bg-red-900 px-3 py-2 text-sm font-bold">Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        )}

        {activeTab === 'builder' && (
          <main className="max-w-6xl flex-1 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <h3 className="text-2xl font-black uppercase text-[#d1a153]">{editingSessionId ? 'Editar treino' : 'Criar treino'}</h3>
              
              <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 border border-gray-700 rounded">
                <span className="text-xs font-bold uppercase text-gray-400">Importar treino:</span>
                <select 
                  onChange={(e) => {
                    loadSessionIntoBuilderAsCopy(e.target.value);
                    e.target.value = "";
                  }} 
                  defaultValue="" 
                  className="bg-[#222] border border-gray-600 text-xs p-1.5 text-white rounded font-bold cursor-pointer max-w-[200px]"
                >
                  <option value="" disabled>Selecione um treino...</option>
                  {teams.map(t => {
                    const tSessions = sessions.filter(s => s.teamId === t.id);
                    if (tSessions.length === 0) return null;
                    return (
                      <optgroup key={t.id} label={t.name}>
                        {tSessions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-6 border border-gray-800 bg-[#181818] p-6">
              <label className="block text-sm font-bold uppercase text-gray-400">
                Nome da sessão
                <input required value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} className="mt-2 w-full border border-gray-700 bg-[#111] p-3 text-white" placeholder="Ex: Força máxima" />
              </label>

              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h4 className="font-bold uppercase">Variações / grupos</h4>
                <button type="button" onClick={handleAddVariation} className="bg-[#d1a153] px-4 py-2 text-xs font-black uppercase text-black">+ Adicionar variação</button>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {variations.map((variation, vIdx) => (
                  <section key={variation.id} className="space-y-4 border border-gray-700 bg-[#222] p-4 relative">
                    
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase text-gray-400">Nome da variação</label>
                      {variations.length > 1 && (
                        <button type="button" onClick={() => handleRemoveVariation(vIdx)} className="bg-red-900/80 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold shadow transition">
                          ✕ Eliminar Variação
                        </button>
                      )}
                    </div>
                    
                    <input required value={variation.name} onChange={(e) => setVariations(variations.map((v, i) => i === vIdx ? { ...v, name: e.target.value } : v))} className="w-full border border-gray-600 bg-[#111] p-2 text-base text-white" />

                    {variation.routine.map((item, itemIdx) => (
                      <div key={itemIdx} className={`space-y-3 border-l-4 ${item.isSuperset ? 'border-[#d1a153]' : 'border-gray-600'} bg-[#181818] p-3`}>
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs uppercase text-gray-300">Exercício {itemIdx + 1}</strong>
                          {variation.routine.length > 1 && (
                            <button type="button" onClick={() => handleRemoveRoutineItem(vIdx, itemIdx)} className="px-2 font-bold text-red-400">✕</button>
                          )}
                        </div>
                        <select value={item.exerciseId} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'exerciseId', e.target.value)} className="w-full border border-gray-600 bg-[#222] p-2 text-sm text-white">
                          {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-xs text-gray-400">Séries <input type="text" value={item.sets || ''} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'sets', e.target.value)} className="mt-1 w-full border border-gray-600 bg-[#222] p-2 text-center text-white" placeholder="Ex: 3" /></label>
                          <label className="text-xs text-gray-400">Reps / Tempo <input type="text" value={item.reps || ''} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'reps', e.target.value)} className="mt-1 w-full border border-gray-600 bg-[#222] p-2 text-center text-white" placeholder="Ex: 10 ou 5 min" /></label>
                          <label className="text-xs text-gray-400">Descanso <input type="text" value={item.rest || ''} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'rest', e.target.value)} className="mt-1 w-full border border-gray-600 bg-[#222] p-2 text-center text-white" placeholder="Ex: 60s ou -" /></label>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Notas / Observações</label>
                          <input 
                            type="text" 
                            value={item.notes || ''} 
                            onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'notes', e.target.value)} 
                            placeholder="Ex: Focar na explosão na subida" 
                            className="w-full border border-gray-600 bg-[#222] p-2 text-sm text-white focus:border-[#d1a153] focus:outline-none"
                          />
                        </div>

                        <div className="mt-2 flex items-center gap-2 border-t border-gray-700 pt-2">
                          <input 
                            type="checkbox" 
                            checked={item.isSuperset || false} 
                            onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'isSuperset', e.target.checked)} 
                            className="h-4 w-4 accent-[#d1a153]" 
                          />
                          <label className="text-xs font-bold uppercase text-[#d1a153] cursor-pointer" onClick={() => handleUpdateRoutineItem(vIdx, itemIdx, 'isSuperset', !item.isSuperset)}>
                            Ligar ao próximo exercício (Supersérie)
                          </label>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleAddExerciseToVariation(vIdx)} className="w-full bg-gray-700 py-2 text-sm font-bold uppercase hover:bg-gray-600">+ Adicionar exercício</button>
                  </section>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-4">
                <button type="button" onClick={() => { resetSessionForm(); setActiveTab('live'); }} className="bg-gray-700 px-5 py-3 font-bold">Cancelar</button>
                <button type="submit" className="bg-[#8a152e] px-5 py-3 font-black uppercase">{editingSessionId ? 'Guardar alterações' : 'Guardar sessão'}</button>
              </div>
            </form>
          </main>
        )}

        {activeTab === 'database' && (
          <main className="grid max-w-6xl flex-1 gap-8 p-8 lg:grid-cols-3">
            <section className="h-fit border border-gray-800 bg-[#181818] p-5">
              <h3 className="mb-4 font-bold uppercase">{editingExerciseId ? 'Editar exercício' : 'Novo exercício'}</h3>
              <form onSubmit={handleAddExercise} className="space-y-4">
                <label className="block text-xs font-bold uppercase text-gray-400">
                  Nome do exercício
                  <input required value={newExName} onChange={(e) => setNewExName(e.target.value)} className="mt-1 w-full border border-gray-700 bg-[#111] p-3 text-white" placeholder="Ex: Prancha" />
                </label>
                <label className="block text-xs font-bold uppercase text-gray-400">
                  URL da Média (Imagem, GIF ou YouTube)
                  <input type="text" required value={newExUrl} onChange={(e) => setNewExUrl(e.target.value)} className="mt-1 w-full border border-gray-700 bg-[#111] p-3 text-white" placeholder="https://... ou link do YouTube" />
                </label>
                <button type="submit" className="w-full bg-[#d1a153] py-3 font-black uppercase text-black">{editingExerciseId ? 'Guardar alterações' : 'Adicionar exercício'}</button>
              </form>
            </section>
            <section className="space-y-4 lg:col-span-2">
              <h3 className="font-bold uppercase">Exercícios registados ({exercises.length})</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {exercises.map((exercise) => (
                  <article key={exercise.id} className="flex items-center gap-3 border border-gray-800 bg-[#1a1a1a] p-3">
                    <MediaViewer src={exercise.mediaUrl} mediaType={exercise.mediaType} alt={exercise.name} className="h-16 w-16 shrink-0 rounded" />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-bold uppercase">{exercise.name}</h4>
                      <span className="text-[10px] text-gray-400 uppercase bg-gray-800 px-1.5 py-0.5 rounded">
                        {exercise.mediaUrl && (exercise.mediaUrl.includes('youtube.com') || exercise.mediaUrl.includes('youtu.be') || exercise.mediaUrl.includes('.mp4')) ? '🎥 Vídeo' : '🖼️ Imagem'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingExerciseId(exercise.id); setNewExName(exercise.name); setNewExUrl(exercise.mediaUrl); setNewExType(exercise.mediaType || 'image'); }} className="px-2 py-1 text-sm text-[#d1a153] hover:bg-gray-800">Editar</button>
                      <button onClick={() => handleDeleteExercise(exercise.id)} className="px-2 py-1 text-sm text-red-400 hover:bg-gray-800">Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
