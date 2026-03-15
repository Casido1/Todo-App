import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Zap, Target, Calendar, Clock, CheckCircle2, Circle, Sparkles } from 'lucide-react';
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

const TYPE_GRADIENTS = {
  [GOAL_TYPES.YEARLY]: 'var(--accent-yearly)',
  [GOAL_TYPES.MONTHLY]: 'var(--accent-monthly)',
  [GOAL_TYPES.WEEKLY]: 'var(--accent-weekly)',
  [GOAL_TYPES.DAILY]: 'var(--accent-daily)'
};

const AmbientBackground = () => (
  <div className="ambient-bg">
    <div className="blob" style={{ background: '#7C3AED', width: '400px', height: '400px', top: '-10%', left: '-5%' }} />
    <div className="blob" style={{ background: '#E11D48', width: '300px', height: '300px', bottom: '10%', right: '-5%', animationDelay: '-5s' }} />
    <div className="blob" style={{ background: '#0EA5E9', width: '350px', height: '350px', top: '40%', right: '15%', animationDelay: '-10s' }} />
  </div>
);

const GoalItem = ({ goal, onBreakdown, toggleComplete, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const accent = TYPE_GRADIENTS[goal.type];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`glass-card goal-card-premium ${isExpanded ? 'active' : ''}`}
    >
      <div className="goal-header" onClick={() => goal.children?.length > 0 && setIsExpanded(!isExpanded)}>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleComplete(goal.id); }}
          className="mt-1 flex-shrink-0"
        >
          <AnimatePresence mode="wait">
            {goal.completed ? (
              <motion.div key="checked" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </motion.div>
            ) : (
              <motion.div key="unchecked" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Circle className="w-8 h-8 text-white/10 hover:text-white/30 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        
        <div className="flex-1 min-w-0">
          <span className="goal-type-tag" style={{ background: accent, color: '#000' }}>
            {goal.type}
          </span>
          <h3 className={`goal-title ${goal.completed ? 'strikethrough' : ''}`}>
            {goal.title}
          </h3>
        </div>

        {goal.children && goal.children.length > 0 && (
          <button className={`p-2 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-6 h-6 opacity-30" />
          </button>
        )}
      </div>

      {!goal.completed && !goal.children?.length && goal.type !== GOAL_TYPES.DAILY && (
        <motion.button 
          whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onBreakdown(goal)}
          className="btn-breakdown-spacious"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          AI Breakdown to {NEXT_TYPE[goal.type]}
        </motion.button>
      )}

      <AnimatePresence>
        {isExpanded && goal.children?.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-8 ml-4 pl-8 border-l-2 border-white/5 space-y-6"
          >
            {goal.children.map(child => (
              <GoalItem 
                key={child.id} 
                goal={child} 
                onBreakdown={onBreakdown} 
                toggleComplete={toggleComplete} 
                depth={depth + 1}
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
    const nextType = NEXT_TYPE[parentGoal.type];
    
    setTimeout(() => {
      const subGoals = [
        { id: Date.now() + 1, title: `Foundation of ${parentGoal.title}`, type: nextType, completed: false, children: [] },
        { id: Date.now() + 2, title: `Execution of ${parentGoal.title}`, type: nextType, completed: false, children: [] },
        { id: Date.now() + 3, title: `Refinement of ${parentGoal.title}`, type: nextType, completed: false, children: [] }
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
    }, 2000);
  };

  return (
    <div className="app-container">
      <AmbientBackground />
      
      <header>
        <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          Goals
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Master your time with AI
        </motion.p>
      </header>

      <section className="mb-16">
        <form onSubmit={addGoal} className="glass-card">
          <div className="input-container">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What's your vision?"
              className="input-field"
            />
          </div>
          
          <div className="category-selector">
            {Object.values(GOAL_TYPES).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`cat-btn ${selectedType === type ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>

          <button type="submit" className="btn-commit">
            <Plus className="w-6 h-6" strokeWidth={3} />
            Commit to Goal
          </button>
        </form>
      </section>

      <div className="goal-list">
        <AnimatePresence initial={false}>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="text-center py-20"
          >
            <Target className="w-24 h-24 mx-auto mb-6" strokeWidth={1} />
            <p className="text-2xl font-light tracking-widest uppercase">The empty canvas</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isBreakingDown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-50 p-8"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="mb-8"
              >
                <Sparkles className="w-20 h-20 text-amber-400 mx-auto" strokeWidth={1} />
              </motion.div>
              <h2 className="text-3xl font-black mb-4 tracking-tight">AI Decomposing...</h2>
              <p className="text-white/40 text-lg font-medium">Brewing clarity from complexity</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="safe-area-bottom" />
    </div>
  );
}
