/**
 * Generates time-aware context for the AI prompt based on the goal type.
 */
function getTimeContext(currentType) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (currentType === 'yearly') {
    // Yearly → Monthly: list remaining months from current month to December
    const remainingMonths = monthNames.slice(month);
    return {
      count: remainingMonths.length,
      labels: remainingMonths,
      instruction: `Break this goal into exactly ${remainingMonths.length} monthly sub-goals, one for each remaining month of the year ${year}.
Each sub-goal MUST start with the month name as a prefix (e.g., "${remainingMonths[0]}: ...").
The months are: ${remainingMonths.join(', ')}.`
    };
  }

  if (currentType === 'monthly') {
    // Monthly → Weekly: calculate weeks based on exact calendar days
    const today = now.getDate();
    const lastDay = new Date(year, month + 1, 0).getDate();
    // Calculate how many Mondays (or start of weeks) are left
    const weeksRemainingDates = [];
    let currentPtr = new Date(year, month, today);
    
    // Find next Monday
    const dayOfWeek = currentPtr.getDay();
    const daysUntilNextMonday = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 1 : 8 - dayOfWeek);
    let firstMonday = new Date(currentPtr);
    firstMonday.setDate(firstMonday.getDate() + daysUntilNextMonday);

    // If today is not Monday, the first "week" is from today until Sunday
    if (daysUntilNextMonday > 0) {
        let endOfWeek = new Date(firstMonday);
        endOfWeek.setDate(firstMonday.getDate() - 1);
        weeksRemainingDates.push(`Week 1 (${monthNames[month]} ${today} - ${monthNames[month]} ${Math.min(endOfWeek.getDate(), lastDay)})`);
    }

    let weekCounter = weeksRemainingDates.length + 1;
    let mondayPtr = new Date(firstMonday);
    
    while (mondayPtr.getMonth() === month && mondayPtr.getFullYear() === year) {
        let sundayPtr = new Date(mondayPtr);
        sundayPtr.setDate(mondayPtr.getDate() + 6);
        let endDay = Math.min(sundayPtr.getDate(), lastDay);
        // Ensure the end day is in the same month
        if (sundayPtr.getMonth() !== month) endDay = lastDay;

        weeksRemainingDates.push(`Week ${weekCounter} (${monthNames[month]} ${mondayPtr.getDate()} - ${monthNames[month]} ${endDay})`);
        mondayPtr.setDate(mondayPtr.getDate() + 7);
        weekCounter++;
    }

    return {
      count: weeksRemainingDates.length,
      labels: weeksRemainingDates,
      instruction: `Break this goal into exactly ${weeksRemainingDates.length} weekly sub-goals for the remaining calendar weeks of ${monthNames[month]} ${year}.
Each sub-goal MUST start with "Week N:" as a prefix (e.g., "Week 1: ...").
The specific weeks are: ${weeksRemainingDates.join(', ')}.`
    };
  }

  if (currentType === 'weekly') {
    // Weekly → Daily: use exact dates for the remaining days of the current week (up to 7 days)
    // Assuming the user is breaking down a week they are currently in
    const exactDays = [];
    let currentPtr = new Date(now);
    
    // For a weekly goal breakdown, we'll just give the next 7 days starting from today
    // to ensure consistency if they break down a "Week N" goal mid-week.
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentPtr);
        d.setDate(currentPtr.getDate() + i);
        const dayStr = `${dayNames[d.getDay()]} (${monthNames[d.getMonth()].substring(0,3)} ${d.getDate()})`;
        exactDays.push(dayStr);
    }

    return {
      count: 7,
      labels: exactDays,
      instruction: `Break this goal into exactly 7 daily sub-goals, one for each exact day of the upcoming 7 days.
Each sub-goal MUST start EXACTLY with the day name as a prefix, followed by a colon (e.g., "${exactDays[0].split(' ')[0]}: ..."). 
You must use these exact days: ${exactDays.map(d => d.split(' ')[0]).join(', ')}.`
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
  const localKey = localStorage.getItem('OPENROUTER_API_KEY') || localStorage.getItem('GEMINI_API_KEY');
  const apiKey = localKey || import.meta.env.VITE_OPENROUTER_API_KEY;

  const timeCtx = getTimeContext(currentType);

  if (!apiKey) {
    throw new Error("Missing OpenRouter API Key. Please click the Settings (gear) icon in the top right to configure your key.");
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
    // Instead of silently falling back, throw the error so the UI can notify the user
    throw new Error(error.message || "Failed to connect to the AI service. Please check your connection or API key.");
  }
};
