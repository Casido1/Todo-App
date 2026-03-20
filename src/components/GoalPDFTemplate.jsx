import React, { forwardRef } from 'react';

const GOAL_TYPES = {
  YEARLY: 'yearly',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  DAILY: 'daily'
};

const TYPE_COLORS = {
  [GOAL_TYPES.YEARLY]: { bg: '#FFFDE7', text: '#F57F17', border: '#FFF59D' },
  [GOAL_TYPES.MONTHLY]: { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
  [GOAL_TYPES.WEEKLY]: { bg: '#E0F7FA', text: '#006064', border: '#80DEEA' },
  [GOAL_TYPES.DAILY]: { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A' }
};

const PDFGoalNode = ({ goal, depth = 0 }) => {
  const colors = TYPE_COLORS[goal.type] || TYPE_COLORS[GOAL_TYPES.DAILY];
  const isLeaf = !goal.children || goal.children.length === 0;

  return (
    <div style={{
      marginLeft: depth === 0 ? 0 : 20,
      marginBottom: 12,
      pageBreakInside: 'avoid'
    }}>
      <div style={{
        backgroundColor: depth === 0 ? colors.bg : '#ffffff',
        borderLeft: `4px solid ${colors.text}`,
        padding: '12px 16px',
        borderRadius: '0 8px 8px 0',
        boxShadow: depth === 0 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        border: depth !== 0 ? '1px solid #f0f0f0' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            backgroundColor: colors.bg,
            color: colors.text,
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            padding: '4px 8px',
            borderRadius: '4px',
            letterSpacing: '0.05em',
            border: `1px solid ${colors.border}`
          }}>
            {goal.type}
          </span>
          <span style={{
            fontSize: depth === 0 ? '18px' : '15px',
            fontWeight: depth === 0 ? '700' : '500',
            color: '#111827',
            fontFamily: "'Outfit', sans-serif",
            lineHeight: '1.4',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {goal.title}
          </span>
        </div>
      </div>
      
      {goal.children && goal.children.length > 0 && (
        <div style={{ 
          marginTop: '12px',
          paddingLeft: '12px',
          borderLeft: '2px dashed #e5e7eb',
          marginLeft: '12px'
        }}>
          {goal.children.map(child => (
            <PDFGoalNode key={child.id} goal={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const GoalPDFTemplate = forwardRef(({ goal }, ref) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    // The wrapper must have a fixed width to ensure html2canvas captures it correctly
    <div 
      style={{ 
        position: 'absolute', 
        left: '-9999px', // Hide it off-screen
        top: 0 
      }}
    >
      <div 
        ref={ref}
        style={{
          width: '800px', // A4 width at roughly 96 DPI
          minHeight: '1000px',
          backgroundColor: '#ffffff',
          padding: '60px 80px',
          fontFamily: "'Outfit', sans-serif",
          color: '#111827',
          boxSizing: 'border-box'
        }}
      >
        {/* Document Header */}
        <div style={{ 
          borderBottom: '2px solid #f3f4f6', 
          paddingBottom: '24px', 
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '900', 
              margin: '0 0 8px 0', 
              color: '#111827',
              letterSpacing: '-0.02em'
            }}>
              Goal Execution Plan
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              margin: 0,
              fontWeight: '500'
            }}>
              Auto-generated strategic breakdown
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#374151', 
              margin: 0,
              fontWeight: '600'
            }}>
              {currentDate}
            </p>
          </div>
        </div>

        {/* Goal Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {goal && <PDFGoalNode goal={goal} />}
        </div>
        
        {/* Footer */}
        <div style={{
          marginTop: '60px',
          paddingTop: '20px',
          borderTop: '1px solid #f3f4f6',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          Powered by AntiGravity Goals AI
        </div>
      </div>
    </div>
  );
});

GoalPDFTemplate.displayName = 'GoalPDFTemplate';

export default GoalPDFTemplate;
