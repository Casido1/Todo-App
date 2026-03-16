/**
 * Generates time-aware context for the AI prompt based on the goal type.
 */
function getTimeContext(currentType) {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (currentType === 'yearly') {
    // Yearly → Monthly: list remaining months from current month to December
    const currentMonth = now.getMonth(); // 0-indexed
    const remainingMonths = monthNames.slice(currentMonth);
    return {
      count: remainingMonths.length,
      labels: remainingMonths,
      instruction: `Break this goal into exactly ${remainingMonths.length} monthly sub-goals, one for each remaining month of the year.
Each sub-goal MUST start with the month name as a prefix (e.g., "${remainingMonths[0]}: ...").
The months are: ${remainingMonths.join(', ')}.`
    };
  }

  if (currentType === 'monthly') {
    // Monthly → Weekly: calculate weeks remaining in this month
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const daysRemaining = lastDay - today + 1;
    const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));

    const weekLabels = [];
    for (let i = 1; i <= weeksRemaining; i++) {
      weekLabels.push(`Week ${i}`);
    }

    return {
      count: weeksRemaining,
      labels: weekLabels,
      instruction: `Break this goal into exactly ${weeksRemaining} weekly sub-goals for the remaining weeks of ${monthNames[month]} ${year}.
Each sub-goal MUST start with "Week N:" as a prefix (e.g., "Week 1: ...").
There are ${daysRemaining} days remaining this month, spread across ${weeksRemaining} weeks.`
    };
  }

  if (currentType === 'weekly') {
    // Weekly → Daily: use the 7 days of the week
    return {
      count: 7,
      labels: dayNames,
      instruction: `Break this goal into exactly 7 daily sub-goals, one for each day of the week.
Each sub-goal MUST start with the day name as a prefix (e.g., "Monday: ...").
The days are: ${dayNames.join(', ')}.`
    };
  }

  return {
    count: 3,
    labels: [],
    instruction: 'Break this goal into 3 specific, actionable sub-goals.'
  };
}

export const breakdownGoal = async (goalTitle, currentType, nextType) => {
  // Use OpenRouter key from localStorage or env
  const localKey = localStorage.getItem('OPENROUTER_API_KEY');
  const apiKey = localKey || import.meta.env.VITE_OPENROUTER_API_KEY;

  const timeCtx = getTimeContext(currentType);

  if (!apiKey) {
    console.warn("OpenRouter API Key missing. Falling back to simulation mode.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return timeCtx.labels.length > 0
      ? timeCtx.labels.map(label => `${label}: Action item for ${goalTitle}`)
      : [
          `Strategic ${nextType} tasks for ${goalTitle}`,
          `Execution phase for ${goalTitle}`,
          `Review and optimize ${goalTitle} progress`
        ];
  }

  const prompt = `
You are a master productivity coach.
The user has a ${currentType} goal: "${goalTitle}".
Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

${timeCtx.instruction}

Each sub-goal should be specific, actionable, and realistic for the given time period.
Return only a valid JSON array of strings.
Do not include any other text, markdown formatting, or code blocks.
  `.trim();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Goals App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-001",
        "messages": [
          { "role": "user", "content": prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('Raw AI content:', content);
    
    // Clean up potential markdown formatting
    const cleanedText = content.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log('Cleaned text:', cleanedText);
    const parsed = JSON.parse(cleanedText);
    console.log('Parsed sub-goals:', parsed);
    return parsed;
  } catch (error) {
    console.error("OpenRouter breakdown failed:", error);
    // Fallback to time-aware simulation
    return timeCtx.labels.length > 0
      ? timeCtx.labels.map(label => `${label}: Action item for ${goalTitle}`)
      : [
          `Strategic ${nextType} tasks for ${goalTitle}`,
          `Execution phase for ${goalTitle}`,
          `Review and optimize ${goalTitle} progress`
        ];
  }
};
