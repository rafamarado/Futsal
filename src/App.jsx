import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

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
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase não inicializado.");
}

const EQUIPAS_INICIAIS = [
  { id: 't1', name: 'Equipa Principal' },
  { id: 't2', name: 'Sub-21' },
  { id: 't3', name: 'Equipa Feminina' }
];

const EXERCICIOS_INICIAIS = [
  { id: '1', name: 'Agachamento com Barra', mediaUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800' },
  { id: '2', name: 'Peso Morto Hex Bar', mediaUrl: 'https://images.unsplash.com/photo-1603892853112-a957241dc4ff?q=80&w=800' },
  { id: '3', name: 'Supino Reto', mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800' },
  { id: '4', name: 'Salto para Caixa (Plyo)', mediaUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800' }
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
  const [statusMsg, setStatusMsg] = useState('⚡ Sistema Pronto');

  const [activeTab, setActiveTab] = useState('live');
  const [teams, setTeams] = useState(EQUIPAS_INICIAIS);
  
  // Persistência local inteligente para exercícios e sessões
  const [exercises, setExercises] = useState(() => {
    try {
      const saved = localStorage.getItem('futsal_exercises_v1');
      return saved ? JSON.parse(saved) : EXERCICIOS_INICIAIS;
    } catch {
      return EXERCICIOS_INICIAIS;
    }
  });

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('futsal_sessions_v1');
      return saved ? JSON.parse(saved) : SESSOES_INICIAIS;
    } catch {
      return SESSOES_INICIAIS;
    }
  });

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

  // Guardar automaticamente no armazenamento local sempre que houver alterações
  useEffect(() => {
    try {
      localStorage.setItem('futsal_exercises_v1', JSON.stringify(exercises));
    } catch (e) {
      console.error(e);
    }
  }, [exercises]);

  useEffect(() => {
    try {
      localStorage.setItem('futsal_sessions_v1', JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  }, [sessions]);

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
    const exercise = {
      id: editingExerciseId || Date.now().toString(),
      name: newExName.trim(),
      mediaUrl: newExUrl.trim() || IMAGEM_PADRAO
    };
    const updated = editingExerciseId 
      ? exercises.map(item => item.id === editingExerciseId ? exercise : item) 
      : [...exercises, exercise];
    
    setExercises(updated);
    setNewExName('');
    setNewExUrl('');
    setEditingExerciseId(null);
    setStatusMsg('💾 Exercício guardado!');
    setTimeout(() => setStatusMsg('⚡ Sistema Pronto'), 2500);
  };

  const handleDeleteExercise = (exerciseId) => {
    setExercises(exercises.filter(exercise => exercise.id !== exerciseId));
  };

  const handleAddVariation = () => {
    setVariations([...variations, { id: Date.now().toString(), name: `Versão V${variations.length + 1}`, routine: [criarItemRotina(exercises[0]?.id || '')] }]);
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
    setVariations(session.variations.map(v => ({ ...v, routine: v.routine.map(i => ({ ...i })) })));
    setActiveTab('builder');
  };

  const handleSaveSession = (event) => {
    event.preventDefault();
    if (!newSessionName.trim()) return;
    const session = { id: editingSessionId || Date.now().toString(), teamId: activeTeam.id, name: newSessionName.trim(), variations };
    const updated = editingSessionId 
      ? sessions.map(s => s.id === editingSessionId ? session : s) 
      : [...sessions, session];

    setSessions(updated);
    resetSessionForm();
    setActiveTab('live');
    setStatusMsg('💾 Sessão guardada!');
    setTimeout(() => setStatusMsg('⚡ Sistema Pronto'), 2500);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const castToTV = (session) => {
    const populatedSession = {
      ...session,
      teamName: activeTeam.name,
      variations: session.variations.map(variation => ({
        ...variation,
        routine: variation.routine.map(item => {
          const exercise = exercises.find(e => e.id === item.exerciseId);
          return { ...item, name: exercise?.name || 'Exercício', mediaUrl: exercise?.mediaUrl || IMAGEM_PADRAO };
        })
      }))
    };
    setLiveSession(populatedSession);
    setActiveTab('tv_display');
  };

  const teamSessions = sessions.filter(s => s.teamId === activeTeam.id);

  if (activeTab === 'tv_display') {
    return (
      <div className="flex h-screen w-screen flex-col bg-[#111] text-white">
        <header className="flex items-center justify-between border-b border-gray-800 bg-[#161616] px-8 py-4">
          <div>
            <h1 className="text-xl font-black uppercase text-[#d1a153]">{liveSession?.name || 'GYM FLOOR STANDBY'}</h1>
            <p className="text-xs uppercase text-gray-400">{liveSession && liveSession.teamName}</p>
          </div>
          <button onClick={() => setActiveTab('live')} className="rounded border border-gray-600 bg-gray-800 px-5 py-2 font-bold uppercase hover:bg-gray-700">
            Voltar ao Painel
          </button>
        </header>
        <div className="flex-1 overflow-hidden p-6">
          {!liveSession ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-lg font-bold text-gray-400">A aguardar seleção de treino</p>
              <button onClick={() => setActiveTab('live')} className="rounded bg-[#8a152e] px-6 py-3 font-bold uppercase">Escolher sessão</button>
            </div>
          ) : (
            <div className="grid h-full w-full gap-5" style={{ gridTemplateColumns: `repeat(${liveSession.variations.length}, minmax(0, 1fr))` }}>
              {liveSession.variations.map((variation) => {
                const groups = getSupersetGroupIds(variation.routine);
                return (
                  <div key={variation.id} className="flex flex-col gap-4 overflow-y-auto bg-[#181818] p-4 border border-gray-800">
                    <h3 className="text-center text-lg font-black uppercase text-[#d1a153]">{variation.name}</h3>
                    {variation.routine.map((item, index) => {
                      const groupId = groups[index];
                      return (
                        <article key={index} className={`flex items-center gap-4 overflow-hidden border-l-4 bg-[#222] p-4 rounded shadow-md ${groupId ? 'border-[#d1a153] bg-gradient-to-r from-[#d1a153]/10 to-transparent' : 'border-[#8a152e]'}`}>
                          <img src={item.mediaUrl} alt={item.name} className="h-20 w-20 rounded-md object-cover border border-gray-700" />
                          <div className="flex-1">
                            <h4 className="font-bold text-white uppercase">{item.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">
                              {item.sets} séries · {item.reps} reps · {item.rest}s descanso
                            </p>
                            {item.notes && <p className="text-xs text-yellow-500/80 mt-1">{item.notes}</p>}
                          </div>
                          {groupId && (
                            <div className="flex flex-col items-center justify-center px-2">
                              <span className="text-[10px] font-black uppercase text-[#d1a153]">Supersérie</span>
                              <span className="text-xl">🔗</span>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212] text-white">
      <aside className="flex w-72 flex-col border-r border-gray-800 bg-[#181818]">
        <div className="flex items-center gap-3 border-b border-gray-800 p-6">
          <img src={FPF_LOGO} alt="FPF" className="h-8 w-8 object-contain" />
          <h1 className="font-black tracking-wider text-[#d1a153]">Performance Hub</h1>
        </div>

        <div className="bg-[#222] p-2 text-center text-xs font-bold text-[#d1a153] border-b border-gray-800">
          {statusMsg}
        </div>

        <div className="border-b border-gray-800 p-4 bg-[#161616]">
          <label className="mb-2 block text-xs font-bold uppercase text-gray-400">Seleção / Equipa</label>
          <select value={activeTeam.id} onChange={(e) => setActiveTeamId(e.target.value)} className="w-full rounded border border-gray-700 bg-[#222] p-2 font-bold text-white">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <nav className="flex-1 space-y-2 p-4">
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

            <div className="mb-4 flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold uppercase">Sessões disponíveis para {activeTeam.name}</h3>
              <button onClick={() => { resetSessionForm(); setActiveTab('builder'); }} className="bg-[#d1a153] px-4 py-2 text-sm font-black uppercase text-black">+ Criar treino</button>
            </div>

            {teamSessions.length === 0 ? (
              <p className="bg-[#1a1a1a] p-8 text-center text-gray-400">Ainda não existem sessões para esta equipa.</p>
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
            <h3 className="mb-5 text-2xl font-black uppercase text-[#d1a153]">{editingSessionId ? 'Editar treino' : 'Criar treino'}</h3>
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
                  <section key={variation.id} className="space-y-4 border border-gray-700 bg-[#222] p-4">
                    <label className="block text-xs font-bold uppercase text-gray-400">
                      Nome da variação
                      <input required value={variation.name} onChange={(e) => setVariations(variations.map((v, i) => i === vIdx ? { ...v, name: e.target.value } : v))} className="mt-2 w-full border border-gray-600 bg-[#111] p-2 text-base text-white" />
                    </label>

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
                          <label className="text-xs text-gray-400">Séries <input type="number" min="1" value={item.sets} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'sets', Number(e.target.value))} className="mt-1 w-full border border-gray-600 bg-[#222] p-2 text-center text-white" /></label>
                          <label className="text-xs text-gray-400">Reps <input value={item.reps} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'reps', e.target.value)} className="mt-1 w-full border border-gray-600 bg-[#222] p-2 text-center text-white" /></label>
                          <label className="text-xs text-gray-400">Descanso (s) <input type="number" min="0" value={item.rest} onChange={(e) => handleUpdateRoutineItem(vIdx, itemIdx, 'rest', Number(e.target.value))} className="mt-1 w-full border border-gray-600 bg-[#222] p-2 text-center text-white" /></label>
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
                  URL da imagem / GIF
                  <input type="url" value={newExUrl} onChange={(e) => setNewExUrl(e.target.value)} className="mt-1 w-full border border-gray-700 bg-[#111] p-3 text-white" placeholder="https://..." />
                </label>
                <button type="submit" className="w-full bg-[#d1a153] py-3 font-black uppercase text-black">{editingExerciseId ? 'Guardar alterações' : 'Adicionar exercício'}</button>
              </form>
            </section>
            <section className="space-y-4 lg:col-span-2">
              <h3 className="font-bold uppercase">Exercícios registados ({exercises.length})</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {exercises.map((exercise) => (
                  <article key={exercise.id} className="flex items-center gap-3 border border-gray-800 bg-[#1a1a1a] p-3">
                    <img src={exercise.mediaUrl || IMAGEM_PADRAO} alt={exercise.name} className="h-16 w-16 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-bold uppercase">{exercise.name}</h4>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingExerciseId(exercise.id); setNewExName(exercise.name); setNewExUrl(exercise.mediaUrl); }} className="px-2 py-1 text-sm text-[#d1a153] hover:bg-gray-800">Editar</button>
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
