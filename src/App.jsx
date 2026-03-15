import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Zap, Target, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GOAL_TYPES = {
  YEARLY: 'yearly',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  DAILY: 'daily'
};

const NEXT_TYPE = {
  [GOAL_TYPES.YEARLY]: GOAL_TYPES.MONTHLY,
  [GOAL_TYPES.MONTHLY]: GOAL_TYPES.WEEKLY,
  [GOAL_TYPES.WEEKLY]: GOAL_TYPES.DAILY
};

const TYPE_COLORS = {
  [GOAL_TYPES.YEARLY]: 'goal-yearly',
  [GOAL_TYPES.MONTHLY]: 'goal-monthly',
  [GOAL_TYPES.WEEKLY]: 'goal-weekly',
  [GOAL_TYPES.DAILY]: 'goal-daily'
};

const TYPE_ICONS = {
  [GOAL_TYPES.YEARLY]: Target,
  [GOAL_TYPES.MONTHLY]: Calendar,
  [GOAL_TYPES.WEEKLY]: Clock,
  [GOAL_TYPES.DAILY]: Zap
};

const GoalItem = ({ goal, onBreakdown, toggleComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = TYPE_ICONS[goal.type];
  const colorClass = TYPE_COLORS[goal.type];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card mb-4 overflow-hidden"
    >
      <div className="flex items-start gap-4">
        <button 
          onClick={() => toggleComplete(goal.id)}
          className="mt-1 text-text-secondary hover:text-white transition-colors"
        >
          {goal.completed ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <Circle className="w-6 h-6" />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colorClass} text-black`}>
               {goal.type}
             </span>
          </div>
          <h3 className={`text-lg ${goal.completed ? 'line-through opacity-50' : ''}`}>
            {goal.title}
          </h3>
        </div>

        {goal.children && goal.children.length > 0 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </button>
        )}
      </div>

      {!goal.completed && !goal.children?.length && goal.type !== GOAL_TYPES.DAILY && (
        <button 
          onClick={() => onBreakdown(goal)}
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all"
        >
          <Zap className="w-4 h-4 text-orange-400" />
          AI Breakdown to {NEXT_TYPE[goal.type]}
        </button>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 ml-4 pl-4 border-l border-white/10"
          >
            {goal.children.map(child => (
              <GoalItem 
                key={child.id} 
                goal={child} 
                onBreakdown={onBreakdown} 
                toggleComplete={toggleComplete} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function App() {
  const [goals, setGoals] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState(GOAL_TYPES.YEARLY);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const addGoal = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newGoal = {
      id: Date.now(),
      title: inputValue,
      type: selectedType,
      completed: false,
      children: []
    };
    
    setGoals([newGoal, ...goals]);
    setInputValue('');
  };

  const toggleComplete = (id, goalList = goals) => {
    const updated = goalList.map(g => {
      if (g.id === id) return { ...g, completed: !g.completed };
      if (g.children) return { ...g, children: toggleComplete(id, g.children) };
      return g;
    });
    if (goalList === goals) setGoals(updated);
    return updated;
  };

  const handleBreakdown = async (parentGoal) => {
    setIsBreakingDown(true);
    // This is where the AI would typically search and generate.
    // For this implementation, I am simulating the breakdown logic.
    // In a real scenario, this would call a backend or an LLM API.
    
    const nextType = NEXT_TYPE[parentGoal.type];
    
    // Simulate AI thinking
    setTimeout(() => {
      // Logic would be more complex, but here's a template
      const subGoals = [
        { id: Date.now() + 1, title: `Phase 1 of ${parentGoal.title}`, type: nextType, completed: false, children: [] },
        { id: Date.now() + 2, title: `Phase 2 of ${parentGoal.title}`, type: nextType, completed: false, children: [] },
        { id: Date.now() + 3, title: `Final push for ${parentGoal.title}`, type: nextType, completed: false, children: [] }
      ];

      const updateChildren = (list) => {
        return list.map(g => {
          if (g.id === parentGoal.id) return { ...g, children: subGoals };
          if (g.children) return { ...g, children: updateChildren(g.children) };
          return g;
        });
      };

      setGoals(updateChildren(goals));
      setIsBreakingDown(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto p-6 pb-24 min-h-screen">
      <header className="mb-8 mt-4">
        <h1 className="text-4xl font-bold mb-2">
          <span className="gradient-text bg-gradient-to-r from-blue-400 to-emerald-400">Goaly</span>
        </h1>
        <p className="text-text-secondary">AI-Powered Goal Breakdown</p>
      </header>

      <form onSubmit={addGoal} className="mb-8">
        <div className="glass-card p-4 space-y-4">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What's your big goal?"
            className="w-full bg-transparent border-none outline-none text-xl placeholder:text-white/20"
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.values(GOAL_TYPES).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all border ${selectedType === type ? 'bg-white text-black border-white' : 'border-white/10 text-white/40'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add Goal
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <AnimatePresence>
          {goals.map(goal => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              onBreakdown={handleBreakdown}
              toggleComplete={toggleComplete}
            />
          ))}
        </AnimatePresence>

        {goals.length === 0 && (
          <div className="text-center py-20 text-text-secondary opacity-20">
            <Target className="w-16 h-16 mx-auto mb-4" />
            <p>No goals yet. Dream big!</p>
          </div>
        )}
      </div>

      {isBreakingDown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card text-center animate-pulse">
            <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="font-bold">AI is breaking it down...</p>
          </div>
        </div>
      )}
      
      <div className="safe-area-bottom" />
    </div>
  );
}
