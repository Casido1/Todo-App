import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, ChevronRight, Zap, Target, Calendar, Clock, CheckCircle2, Circle, Sparkles, AlertCircle, Settings, X, Save, Key, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { breakdownGoal } from './services/aiService';
import { requestNotificationPermission, scheduleGoalReminder, cancelGoalReminder, showNotification } from './services/notificationService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import GoalPDFTemplate from './components/GoalPDFTemplate';

// Helper: filter goal tree to a specific depth
const DEPTH_ORDER = ['yearly', 'monthly', 'weekly', 'daily'];

const filterGoalToDepth = (goal, maxDepth) => {
  const goalDepthIndex = DEPTH_ORDER.indexOf(goal.type);
  const maxDepthIndex = DEPTH_ORDER.indexOf(maxDepth);
  const filtered = { ...goal };
  if (goalDepthIndex >= maxDepthIndex || !goal.children?.length) {
    filtered.children = [];
  } else {
    filtered.children = goal.children.map(c => filterGoalToDepth(c, maxDepth));
  }
  return filtered;
};

// Recursive print-friendly goal tree
const PrintGoalNode = ({ goal, depth = 0 }) => {
  const typeColors = { yearly: '#FFD700', monthly: '#A855F7', weekly: '#06B6D4', daily: '#F43F5E' };
  return (
    <div style={{ marginLeft: depth * 24, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          background: typeColors[goal.type] || '#888',
          color: '#000',
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: 20,
          letterSpacing: '0.05em'
        }}>
          {goal.type}
        </span>
        <span style={{
          fontSize: depth === 0 ? 18 : 14,
          fontWeight: depth === 0 ? 700 : 500,
          color: '#111',
          textDecoration: goal.completed ? 'line-through' : 'none',
          opacity: goal.completed ? 0.4 : 1
        }}>
          {goal.completed ? '✓ ' : '○ '}{goal.title}
        </span>
      </div>
      {goal.children?.map(child => (
        <PrintGoalNode key={child.id} goal={child} depth={depth + 1} />
      ))}
    </div>
  );
};

// Print Preview Modal
const PrintPreview = ({ goal, onClose }) => {
  const printRef = useRef(null);
  const [printDepth, setPrintDepth] = useState('daily');

  const depthOptions = [];
  const goalIndex = DEPTH_ORDER.indexOf(goal.type);
  for (let i = goalIndex; i < DEPTH_ORDER.length; i++) {
    depthOptions.push(DEPTH_ORDER[i]);
  }

  const filteredGoal = filterGoalToDepth(goal, printDepth);

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Goals - ${goal.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #111; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>🎯 ${goal.title}</h1>
          <p class="meta">Printed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Depth: ${printDepth}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0 24px;">
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const depthLabels = {
    yearly: 'This goal only',
    monthly: 'Down to months',
    weekly: 'Down to weeks',
    daily: 'Full breakdown (days)'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-lg relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full z-10"
        >
          <X className="w-6 h-6 text-white/40" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-cyan-400/10 rounded-2xl">
            <Printer className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Print Goal</h2>
            <p className="text-white/40 text-sm">Select detail level for PDF</p>
          </div>
        </div>

        {/* Depth Selector */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-3 ml-2">
            Print Depth
          </label>
          {depthOptions.map(d => (
            <button
              key={d}
              onClick={() => setPrintDepth(d)}
              className="w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between"
              style={{
                background: printDepth === d ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                border: printDepth === d ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <span className="font-semibold text-sm">{depthLabels[d]}</span>
              {printDepth === d && <span className="text-cyan-400 text-xs font-bold">✓ Selected</span>}
            </button>
          ))}
        </div>

        {/* Print Preview Area */}
        <div
          style={{
            background: '#fafafa',
            borderRadius: 16,
            padding: 20,
            maxHeight: '30vh',
            overflowY: 'auto',
            marginBottom: 16,
            color: '#111'
          }}
        >
          <div ref={printRef}>
            <PrintGoalNode goal={filteredGoal} />
          </div>
        </div>

        <button onClick={handlePrint} className="btn-commit w-full">
          <Printer className="w-5 h-5" />
          Print as PDF
        </button>
      </motion.div>
    </motion.div>
  );
};

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

const GoalItem = ({ goal, toggleComplete, onPrint }) => {
  useEffect(() => {
    // If completed, cancel reminders (though Daily goals are mainly hidden now, 
    // we keep this in case the user completes the top level goal and we want to cancel all its children)
    if (goal.completed) {
      const cancelAllReminders = (node) => {
         if (node.type === GOAL_TYPES.DAILY) cancelGoalReminder(node.id);
         if (node.children) node.children.forEach(cancelAllReminders);
      };
      cancelAllReminders(goal);
    }
  }, [goal.completed, goal]);

  const accent = TYPE_GRADIENTS[goal.type];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card goal-card-premium"
    >
      <div className="goal-header">
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

        <div className="flex items-center gap-1">
          {goal.children?.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrint(goal); }}
              className="p-2 hover:bg-white/5 rounded-full transition-all"
              title="Print Goal Tree"
            >
              <Printer className="w-5 h-5 opacity-20 hover:opacity-50" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [goals, setGoals] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState(GOAL_TYPES.YEARLY);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('OPENROUTER_API_KEY') || localStorage.getItem('GEMINI_API_KEY') || '');
  const [printGoal, setPrintGoal] = useState(null);
  
  // State for Auto-PDF Generation
  const [pdfGoalTarget, setPdfGoalTarget] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    // Request notification permission when the app loads
    requestNotificationPermission();
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('OPENROUTER_API_KEY', apiKeyInput);
    setIsSettingsOpen(false);
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const newGoal = {
      id: Date.now(),
      title: inputValue,
      type: selectedType,
      completed: false,
      children: []
    };
    
    setGoals(prev => [newGoal, ...prev]);
    setInputValue('');

    requestNotificationPermission();

    if (newGoal.type !== GOAL_TYPES.DAILY) {
      autoBreakdownToDaily(newGoal);
    }
  };

  const autoBreakdownToDaily = async (goal) => {
    if (goal.type === GOAL_TYPES.DAILY) return;
    
    try {
      // 1. Build the full plan silently in the background
      const fullyExpandedGoal = await buildGoalTree(goal);
      
      // 2. Schedule all daily reminders automatically 
      const scheduleTree = (node) => {
        if (node.type === GOAL_TYPES.DAILY && !node.completed) scheduleGoalReminder(node);
        if (node.children) node.children.forEach(scheduleTree);
      };
      scheduleTree(fullyExpandedGoal);
      
      // 3. Attach the completed background tree to the main goal so the PDF can access it
      setGoals(currentGoals => currentGoals.map(g => 
        g.id === goal.id ? fullyExpandedGoal : g
      ));
      
      // 4. Count daily goals and notify user
      const countDailyGoals = (node) => {
        if (node.type === GOAL_TYPES.DAILY) return 1;
        return (node.children || []).reduce((sum, child) => sum + countDailyGoals(child), 0);
      };
      const dailyCount = countDailyGoals(fullyExpandedGoal);
      showNotification('Goal Breakdown Complete', {
        body: `"${goal.title}" has been broken down into ${dailyCount} daily goals. Your schedule is ready!`,
        tag: 'breakdown-complete'
      });
      
      // 5. Filter to show only one level down for PDF
      const oneLevelDown = NEXT_TYPE[goal.type];
      const pdfGoal = filterGoalToDepth(fullyExpandedGoal, oneLevelDown);
      
      // 6. Trigger PDF Generation silently
      setPdfGoalTarget(pdfGoal);
      setTimeout(() => generatePDF(pdfGoal.title), 1500);
      
    } catch (error) {
       console.error("Auto-breakdown interrupted or failed.", error);
       alert(`AI Breakdown Failed: ${error.message}`);
    }
  };

  const generatePDF = async (goalTitle) => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (A4 size is 210x297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Goal_Plan_${goalTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      
      // Clear the target so it doesn't linger
      setPdfGoalTarget(null);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  const buildGoalTree = async (currentGoal) => {
    if (currentGoal.type === GOAL_TYPES.DAILY) return currentGoal;
    
    const nextType = NEXT_TYPE[currentGoal.type];
    const subGoalTitles = await breakdownGoal(currentGoal.title, currentGoal.type, nextType);
    
    const subGoals = subGoalTitles.map(title => ({
      id: crypto.randomUUID(),
      title: title,
      type: nextType,
      completed: false,
      children: []
    }));

    const expandedChildren = [];
    for (const sg of subGoals) {
       expandedChildren.push(await buildGoalTree(sg));
    }

    return { ...currentGoal, children: expandedChildren };
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

  // handleBreakdown manual button logic completely removed as requested.

  return (
    <div className="app-container">
      <AmbientBackground />
      
      <header className="flex justify-between items-center mb-16">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
        >
          <Settings className="w-6 h-6 text-white/40" />
        </button>
        <div className="text-center">
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            Goals
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Master your time with AI
          </motion.p>
        </div>
        <div className="w-10"></div> {/* Spacer for symmetry */}
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
              toggleComplete={toggleComplete}
              onPrint={setPrintGoal}
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

      {/* Loading Modal Removed to make breakdown silent */}
      
      <div className="safe-area-bottom" />

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md relative"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full"
              >
                <X className="w-6 h-6 text-white/40" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-400/10 rounded-2xl">
                  <Key className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">API Settings</h2>
                  <p className="text-white/40 text-sm">Configure your OpenRouter key</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-3 ml-2">
                    OpenRouter API Key
                  </label>
                  <div className="input-container mb-0">
                    <input 
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste your key here..."
                      className="input-field text-sm"
                    />
                  </div>
                  <p className="mt-4 text-xs text-white/20 leading-relaxed px-2">
                    Your key is stored locally in your browser. It is never sent to our servers.
                  </p>
                </div>

                <button 
                  onClick={saveApiKey}
                  className="btn-commit w-full"
                >
                  <Save className="w-5 h-5" />
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {printGoal && (
          <PrintPreview goal={printGoal} onClose={() => setPrintGoal(null)} />
        )}
      </AnimatePresence>

      {/* Hidden Unseen Template for Auto PDF Generation */}
      {pdfGoalTarget && (
         <GoalPDFTemplate ref={pdfRef} goal={pdfGoalTarget} />
      )}
    </div>
  );
}
