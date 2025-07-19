import React, { useState, useEffect } from 'react';
import { Plus, X, Gift, Target, Calendar, Coins, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [bonusCoins, setBonusCoins] = useState(100);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const savedHabits = localStorage.getItem('habitTracker_habits');
    const savedRewards = localStorage.getItem('habitTracker_rewards');
    const savedBonusCoins = localStorage.getItem('habitTracker_bonusCoins');
    
    if (savedHabits) {
      try {
        setHabits(JSON.parse(savedHabits));
      } catch (error) {
        console.error('Erro ao carregar hábitos:', error);
      }
    }
    
    if (savedRewards) {
      try {
        setRewards(JSON.parse(savedRewards));
      } catch (error) {
        console.error('Erro ao carregar recompensas:', error);
      }
    }

    if (savedBonusCoins) {
      try {
        setBonusCoins(JSON.parse(savedBonusCoins));
      } catch (error) {
        console.error('Erro ao carregar moedas bônus:', error);
      }
    }
  }, []);

  // Salvar dados sempre que mudarem
  useEffect(() => {
    localStorage.setItem('habitTracker_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('habitTracker_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('habitTracker_bonusCoins', JSON.stringify(bonusCoins));
  }, [bonusCoins]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    days: [],
    type: 'recorrente',
    goalDays: 30,
    dailyCoins: 1
  });
  const [newReward, setNewReward] = useState({
    name: '',
    cost: 10
  });

  const daysOfWeek = [
    { key: 'segunda', label: 'Seg' },
    { key: 'terca', label: 'Ter' },
    { key: 'quarta', label: 'Qua' },
    { key: 'quinta', label: 'Qui' },
    { key: 'sexta', label: 'Sex' },
    { key: 'sabado', label: 'Sáb' },
    { key: 'domingo', label: 'Dom' }
  ];

  const addHabit = () => {
    if (newHabit.name.trim() === '' || newHabit.days.length === 0) return;
    
    const habit = {
      id: Date.now(),
      name: newHabit.name,
      days: newHabit.days,
      type: newHabit.type,
      goalDays: newHabit.type === 'meta' ? newHabit.goalDays : null,
      dailyCoins: newHabit.dailyCoins,
      currentStreak: 0,
      totalCoins: 0,
      failures: 0,
      completed: false,
      lastChecked: null
    };
    
    setHabits([...habits, habit]);
    setNewHabit({
      name: '',
      days: [],
      type: 'recorrente',
      goalDays: 30,
      dailyCoins: 1
    });
    setShowAddHabit(false);
  };

  const addReward = () => {
    if (newReward.name.trim() === '') return;
    
    const reward = {
      id: Date.now(),
      name: newReward.name,
      cost: newReward.cost,
      originalCost: newReward.cost
    };
    
    setRewards([...rewards, reward]);
    setNewReward({
      name: '',
      cost: 10
    });
    setShowAddReward(false);
  };

  const toggleDay = (day) => {
    setNewHabit(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const markSuccess = (habitId) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId && !habit.completed) {
        const newStreak = habit.currentStreak + 1;
        const newTotalCoins = habit.totalCoins + habit.dailyCoins;
        const isCompleted = habit.type === 'meta' && newStreak >= habit.goalDays;
        
        return {
          ...habit,
          currentStreak: newStreak,
          totalCoins: newTotalCoins,
          completed: isCompleted,
          lastChecked: new Date().toISOString()
        };
      }
      return habit;
    }));
  };

  const markFailure = (habitId) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newFailures = habit.failures + 1;
        const newGoalDays = habit.type === 'meta' ? habit.goalDays + 10 : habit.goalDays;
        
        return {
          ...habit,
          currentStreak: 0,
          totalCoins: 0,
          failures: newFailures,
          goalDays: newGoalDays,
          completed: false,
          lastChecked: new Date().toISOString()
        };
      }
      return habit;
    }));

    // Zerar moedas bônus e aumentar custo de todas as recompensas
    setBonusCoins(0);
    setRewards(rewards.map(reward => ({
      ...reward,
      cost: reward.cost + 3
    })));
  };

  const purchaseReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    const habitCoins = habits.reduce((sum, habit) => sum + habit.totalCoins, 0);
    const totalCoins = habitCoins + bonusCoins;
    
    if (totalCoins >= reward.cost) {
      let coinsToDeduct = reward.cost;
      
      // Primeiro, deduzir das moedas bônus
      if (bonusCoins > 0) {
        const bonusDeduction = Math.min(bonusCoins, coinsToDeduct);
        setBonusCoins(bonusCoins - bonusDeduction);
        coinsToDeduct -= bonusDeduction;
      }
      
      // Se ainda sobrar, deduzir das moedas dos hábitos
      if (coinsToDeduct > 0) {
        let remaining = coinsToDeduct;
        setHabits(habits.map(habit => {
          if (remaining > 0 && habit.totalCoins > 0) {
            const deduction = Math.min(habit.totalCoins, remaining);
            remaining -= deduction;
            return {
              ...habit,
              totalCoins: habit.totalCoins - deduction
            };
          }
          return habit;
        }));
      }
      
      alert(`Recompensa "${reward.name}" adquirida com sucesso!`);
    } else {
      alert(`Moedas insuficientes! Você precisa de ${reward.cost} moedas, mas tem apenas ${totalCoins}.`);
    }
  };

  const deleteHabit = (habitId) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
  };

  const deleteReward = (rewardId) => {
    setRewards(rewards.filter(reward => reward.id !== rewardId));
  };

  const clearAllData = () => {
    if (window.confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
      setHabits([]);
      setRewards([]);
      setBonusCoins(100);
      localStorage.removeItem('habitTracker_habits');
      localStorage.removeItem('habitTracker_rewards');
      localStorage.removeItem('habitTracker_bonusCoins');
      alert('Todos os dados foram apagados com sucesso!');
    }
  };

  const exportData = () => {
    const data = {
      habits,
      rewards,
      bonusCoins,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.habits && data.rewards) {
          setHabits(data.habits);
          setRewards(data.rewards);
          setBonusCoins(data.bonusCoins || 100);
          alert('Dados importados com sucesso!');
        } else {
          alert('Arquivo inválido. Verifique se é um backup válido do app.');
        }
      } catch (error) {
        alert('Erro ao importar dados. Verifique se o arquivo está correto.');
      }
    };
    reader.readAsText(file);
    
    // Limpar o input
    event.target.value = '';
  };

  const getTotalCoins = () => {
    const habitCoins = habits.reduce((sum, habit) => sum + habit.totalCoins, 0);
    // Sempre adicionar 100 moedas de bônus
    return habitCoins + 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            Rastreador de Hábitos
          </h1>
          <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-yellow-600 mb-6">
            <Coins className="w-8 h-8" />
            <span>{getTotalCoins()} moedas</span>
          </div>
          
          {/* Botões de Gerenciamento */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={exportData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Exportar Dados
            </button>
            <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm">
              Importar Dados
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Limpar Tudo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção de Hábitos */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Meus Hábitos
                </h2>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Hábito
                </button>
              </div>

              {habits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum hábito criado ainda. Adicione seu primeiro hábito!
                </p>
              ) : (
                <div className="space-y-4">
                  {habits.map(habit => (
                    <div key={habit.id} className={`border-2 rounded-lg p-4 ${habit.completed ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800">{habit.name}</h3>
                          <p className="text-sm text-gray-600">
                            Dias: {habit.days.map(day => daysOfWeek.find(d => d.key === day)?.label).join(', ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Tipo: {habit.type === 'meta' ? `Meta (${habit.goalDays} dias)` : 'Recorrente'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-700">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Sequência Atual</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-800">{habit.currentStreak}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <Coins className="w-4 h-4" />
                            <span className="text-sm font-medium">Moedas Totais</span>
                          </div>
                          <p className="text-2xl font-bold text-yellow-800">{habit.totalCoins}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-600">Falhas: {habit.failures}</span>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm text-gray-600">+{habit.dailyCoins} moedas/dia</span>
                      </div>

                      {habit.completed ? (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <CheckCircle className="w-5 h-5" />
                          <span>Meta Alcançada! Parabéns!</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markSuccess(habit.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors flex-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Sucesso
                          </button>
                          <button
                            onClick={() => markFailure(habit.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors flex-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Falha
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção de Recompensas */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Gift className="w-6 h-6" />
                  Recompensas
                </h2>
                <button
                  onClick={() => setShowAddReward(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Recompensa
                </button>
              </div>

              {rewards.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma recompensa criada ainda. Adicione uma recompensa!
                </p>
              ) : (
                <div className="space-y-4">
                  {rewards.map(reward => (
                    <div key={reward.id} className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{reward.name}</h3>
                        <button
                          onClick={() => deleteReward(reward.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-600" />
                          <span className="text-lg font-semibold text-yellow-600">{reward.cost} moedas</span>
                          {reward.cost > reward.originalCost && (
                            <span className="text-sm text-red-500">
                              (+{reward.cost - reward.originalCost} por falhas)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => purchaseReward(reward.id)}
                          disabled={getTotalCoins() < reward.cost}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            getTotalCoins() >= reward.cost
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Resgatar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Adicionar Hábito */}
        {showAddHabit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Adicionar Novo Hábito</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Hábito
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Exercitar-se"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias da Semana
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day.key}
                        onClick={() => toggleDay(day.key)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          newHabit.days.includes(day.key)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Hábito
                  </label>
                  <select
                    value={newHabit.type}
                    onChange={(e) => setNewHabit({...newHabit, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="recorrente">Recorrente</option>
                    <option value="meta">Com Meta</option>
                  </select>
                </div>

                {newHabit.type === 'meta' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta (dias)
                    </label>
                    <input
                      type="number"
                      value={newHabit.goalDays}
                      onChange={(e) => setNewHabit({...newHabit, goalDays: parseInt(e.target.value) || 30})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moedas por Dia
                  </label>
                  <input
                    type="number"
                    value={newHabit.dailyCoins}
                    onChange={(e) => setNewHabit({...newHabit, dailyCoins: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addHabit}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Recompensa */}
        {showAddReward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Adicionar Nova Recompensa</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Recompensa
                  </label>
                  <input
                    type="text"
                    value={newReward.name}
                    onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Ex: Assistir filme favorito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo (moedas)
                  </label>
                  <input
                    type="number"
                    value={newReward.cost}
                    onChange={(e) => setNewReward({...newReward, cost: parseInt(e.target.value) || 10})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAddReward(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addReward}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;