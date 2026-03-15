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
  [GOAL_TYPES.YEARLY]: 'from-amber-400 to-orange-500',
  [GOAL_TYPES.MONTHLY]: 'from-violet-500 to-fuchsia-600',
  [GOAL_TYPES.WEEKLY]: 'from-cyan-500 to-blue-600',
  [GOAL_TYPES.DAILY]: 'from-rose-500 to-pink-600'
};

const TYPE_ICONS = {
  [GOAL_TYPES.YEARLY]: Target,
  [GOAL_TYPES.MONTHLY]: Calendar,
  [GOAL_TYPES.WEEKLY]: Clock,
  [GOAL_TYPES.DAILY]: Zap
};

const GoalItem = ({ goal, onBreakdown, toggleComplete, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = TYPE_ICONS[goal.type];
  const gradientClass = TYPE_GRADIENTS[goal.type];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`glass-card goal-card ${goal.type} ${isExpanded ? 'ring-1 ring-white/10' : ''}`}
    >
      <div className="flex items-start gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); toggleComplete(goal.id); }}
          className="mt-1 flex-shrink-0"
        >
          <AnimatePresence mode="wait">
            {goal.completed ? (
              <motion.div
                key="checked"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <CheckCircle2 className="w-7 h-7 text-emerald-400 fill-emerald-400/10" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Circle className="w-7 h-7 text-white/20" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        
        <div className="flex-1 min-w-0" onClick={() => goal.children?.length > 0 && setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2 mb-1">
             <span className={`type-badge font-black text-[9px] bg-gradient-to-r ${gradientClass} text-white`}>
               {goal.type}
             </span>
          </div>
          <h3 className={`text-xl font-semibold transition-all ${goal.completed ? 'line-through opacity-30 blur-[0.5px]' : 'text-white'}`}>
            {goal.title}
          </h3>
        </div>

        {goal.children && goal.children.length > 0 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-2xl transition-all ${isExpanded ? 'bg-white/10 rotate-180' : 'hover:bg-white/5'}`}
          >
            <ChevronDown className="w-5 h-5 opacity-40" />
          </button>
        )}
      </div>

      {!goal.completed && !goal.children?.length && goal.type !== GOAL_TYPES.DAILY && (
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onBreakdown(goal)}
          className="mt-5 w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Breakdown to {NEXT_TYPE[goal.type]}
        </motion.button>
      )}

      <AnimatePresence>
        {isExpanded && goal.children?.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 ml-2 pl-4 border-l-2 border-white/5 space-y-2"
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
        { id: Date.now() + 1, title: `Phase 1: Foundation of ${parentGoal.title}`, type: nextType, completed: false, children: [] },
        { id: Date.now() + 2, title: `Phase 2: Execution of ${parentGoal.title}`, type: nextType, completed: false, children: [] },
        { id: Date.now() + 3, title: `Phase 3: Final Polish for ${parentGoal.title}`, type: nextType, completed: false, children: [] }
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
    <div className="app-container min-h-screen">
      <header className="py-12 px-2 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-text tracking-tighter"
        >
          Goals
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary font-medium tracking-tight"
        >
          Manifest your vision with AI
        </motion.p>
      </header>

      <section className="mb-12">
        <form onSubmit={addGoal} className="space-y-6">
          <div className="glass-card p-6 space-y-6 bg-white/[0.02]">
            <div className="input-container">
              <Sparkles className="w-5 h-5 text-white/30" />
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Declare your next big goal..."
                className="input-field"
              />
            </div>
            
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl overflow-hidden justify-between">
              {Object.values(GOAL_TYPES).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`flex-1 text-[10px] font-extrabold uppercase py-3 px-1 rounded-xl transition-all ${selectedType === type ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-premium flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              Commit to Goal
            </motion.button>
          </div>
        </form>
      </section>

      <div className="space-y-6 pb-24">
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
            animate={{ opacity: 0.15 }}
            className="text-center py-24"
          >
            <Target className="w-20 h-20 mx-auto mb-6" strokeWidth={1} />
            <p className="text-xl font-light tracking-widest uppercase">Beginning of a journey</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isBreakingDown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-8"
          >
            <div className="glass-card ai-glow active text-center p-12 max-w-sm">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <Sparkles className="w-16 h-16 text-amber-400 mx-auto" strokeWidth={1} />
              </motion.div>
              <h2 className="text-2xl font-bold mb-4">AI Magic in Progress</h2>
              <p className="text-text-secondary leading-relaxed font-medium">
                Searching the web and decomposing your goals into actionable steps...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="safe-area-bottom" />
    </div>
  );
}
