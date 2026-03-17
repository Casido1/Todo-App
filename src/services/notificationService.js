/**
 * Handles Web Push Notifications and scheduling reminders.
 */

// Request permission to show notifications
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Show a local notification using the Service Worker
export async function showNotification(title, options = {}) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      ...options
    });
  } else {
    // Fallback if SW is not ready/supported
    new Notification(title, options);
  }
}

// Keep track of scheduled timeouts
const scheduledTimeouts = new Map(); // goalId -> timeoutId

// Schedule a daily reminder for a goal
// For a pure client-side app, this schedules a timeout in the current session.
// In a real app, you'd save the reminder times to IndexedDB/localStorage and check them on app load.
export function scheduleGoalReminder(goal, remindAtHour = 9, remindAtMinute = 0) {
  if (scheduledTimeouts.has(goal.id)) {
    clearTimeout(scheduledTimeouts.get(goal.id));
    scheduledTimeouts.delete(goal.id);
  }

  if (goal.completed) return;

  const now = new Date();
  const targetTime = new Date(now);
  targetTime.setHours(remindAtHour, remindAtMinute, 0, 0);

  // Try to parse the exact date from the new calendar-aware titles (e.g., "Tuesday (Mar 17): ...")
  const dateMatch = goal.title.match(/\(([A-Z][a-z]{2})\s+(\d+)\)/);
  
  if (dateMatch) {
    // Found an exact date like "(Mar 17)"
    const monthStr = dateMatch[1];
    const day = parseInt(dateMatch[2], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(monthStr);

    if (monthIndex !== -1) {
      targetTime.setMonth(monthIndex);
      targetTime.setDate(day);
      
      // If the resulting date is somehow in the past (e.g., parsing a December date in January), push to next year
      // But we shouldn't bump it if it's just earlier today.
      if (now > targetTime && targetTime.getDate() !== now.getDate()) {
        if (now.getMonth() === 11 && monthIndex === 0) {
            targetTime.setFullYear(now.getFullYear() + 1);
        }
      }
      
      // If the target is today, but the 9:00 AM time has already passed, 
      // we don't push it to tomorrow because this goal is specifically for TODAY.
      // So if it's in the past, it will fire immediately.
    }
  } else {
    // Fallback logic for old goals or goals without a specific date tag
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let targetDayOfWeek = -1;
    
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (goal.title.startsWith(daysOfWeek[i])) {
        targetDayOfWeek = i;
        break;
      }
    }

    if (targetDayOfWeek !== -1) {
      const currentDayOfWeek = now.getDay();
      let daysToAdd = targetDayOfWeek - currentDayOfWeek;
      
      if (daysToAdd < 0 || (daysToAdd === 0 && now > targetTime)) {
        daysToAdd += 7;
      }
      targetTime.setDate(targetTime.getDate() + daysToAdd);
    } else {
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }
  }

  const msUntilReminder = targetTime - now;

  console.log(`Scheduled reminder for goal "${goal.title}" in ${Math.round(msUntilReminder / 1000 / 60)} minutes.`);

  const timeoutId = setTimeout(() => {
    showNotification(`Reminder: ${goal.title}`, {
      body: 'Time to work on your daily goal!',
      tag: goal.id,
      data: { url: window.location.origin }
    });
    // Reschedule for next day after it fires
    scheduleGoalReminder(goal, remindAtHour, remindAtMinute);
  }, msUntilReminder);

  scheduledTimeouts.set(goal.id, timeoutId);
}

// Clear a scheduled reminder
export function cancelGoalReminder(goalId) {
  if (scheduledTimeouts.has(goalId)) {
    clearTimeout(scheduledTimeouts.get(goalId));
    scheduledTimeouts.delete(goalId);
  }
}
