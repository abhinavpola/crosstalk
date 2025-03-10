/**
 * Conversation logging service
 * Uses localStorage to save conversation history in JSONL format
 */

// Helper function to generate a timestamp-based ID for log files
const generateLogId = () => {
  const now = new Date();
  return `conversation-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
};

// Save a log entry to the current conversation
export const logMessage = (message) => {
  try {
    // Get current log ID or generate a new one
    const currentLogId = getCurrentLogId();
    
    // Get existing logs or initialize empty array
    const logs = getLogEntries(currentLogId);
    
    // Check if we should update a previous message
    if (message.updatePrevious) {
      // Find the most recent message with matching type and side
      for (let i = logs.length - 1; i >= 0; i--) {
        if (logs[i].messageType === message.messageType && 
            logs[i].side === message.side) {
          // Update this entry
          delete message.updatePrevious; // Remove the flag
          logs[i] = {
            ...logs[i],
            ...message,
            updatedAt: new Date().toISOString()
          };
          
          // Save back to localStorage
          localStorage.setItem(`crosstalk_log_${currentLogId}`, JSON.stringify(logs));
          return true;
        }
      }
    }
    
    // If we reach here, either not updating or didn't find a matching message
    // Add timestamp to message
    const logEntry = {
      ...message,
      timestamp: new Date().toISOString()
    };
    
    // Add to logs array
    logs.push(logEntry);
    
    // Save back to localStorage
    localStorage.setItem(`crosstalk_log_${currentLogId}`, JSON.stringify(logs));
    
    // Also maintain a list of all log IDs
    const allLogIds = getAllLogIds();
    if (!allLogIds.includes(currentLogId)) {
      allLogIds.push(currentLogId);
      localStorage.setItem('crosstalk_all_logs', JSON.stringify(allLogIds));
    }
    
    return true;
  } catch (error) {
    console.error('Error logging message:', error);
    return false;
  }
};

// Get the current log ID or create a new one
export const getCurrentLogId = () => {
  const currentId = localStorage.getItem('crosstalk_current_log');
  if (currentId) {
    return currentId;
  }
  
  // Generate a new ID if none exists
  const newId = generateLogId();
  localStorage.setItem('crosstalk_current_log', newId);
  return newId;
};

// Start a new conversation log
export const startNewLog = () => {
  const newId = generateLogId();
  localStorage.setItem('crosstalk_current_log', newId);
  localStorage.setItem(`crosstalk_log_${newId}`, JSON.stringify([]));
  
  // Add to the list of all logs
  const allLogs = getAllLogIds();
  allLogs.push(newId);
  localStorage.setItem('crosstalk_all_logs', JSON.stringify(allLogs));
  
  return newId;
};

// Get all log entries for a specific log ID
export const getLogEntries = (logId) => {
  try {
    const logData = localStorage.getItem(`crosstalk_log_${logId}`);
    return logData ? JSON.parse(logData) : [];
  } catch (error) {
    console.error(`Error retrieving log ${logId}:`, error);
    return [];
  }
};

// Get a list of all log IDs
export const getAllLogIds = () => {
  try {
    const allLogs = localStorage.getItem('crosstalk_all_logs');
    return allLogs ? JSON.parse(allLogs) : [];
  } catch (error) {
    console.error('Error retrieving all log IDs:', error);
    return [];
  }
};

// Get the most recent log ID (other than the current one)
export const getMostRecentLogId = () => {
  const allLogs = getAllLogIds();
  const currentId = getCurrentLogId();
  
  // Filter out the current log and sort by newest first
  const previousLogs = allLogs
    .filter(id => id !== currentId)
    .sort()
    .reverse();
    
  return previousLogs.length > 0 ? previousLogs[0] : null;
};

// Export all conversations as a JSONL string for download
export const exportLogsAsJsonl = () => {
  const allLogs = getAllLogIds();
  let jsonlContent = '';
  
  allLogs.forEach(logId => {
    const entries = getLogEntries(logId);
    entries.forEach(entry => {
      jsonlContent += JSON.stringify({
        ...entry,
        logId
      }) + '\n';
    });
  });
  
  return jsonlContent;
};

// Download the current log as a JSONL file
export const downloadCurrentLogAsJsonl = () => {
  const currentLogId = getCurrentLogId();
  const entries = getLogEntries(currentLogId);
  let jsonlContent = '';
  
  entries.forEach(entry => {
    jsonlContent += JSON.stringify(entry) + '\n';
  });
  
  // Create a download link
  const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentLogId}.jsonl`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

// Convert a log to the format needed by the app
export const convertLogToMessages = (logId) => {
  const entries = getLogEntries(logId);
  
  // Group by chat type (user, model, directModel)
  const userMessages = [];
  const modelMessages = [];
  const directModelMessages = [];
  
  entries.forEach(entry => {
    if (entry.messageType === 'user') {
      if (entry.side === 'user') {
        userMessages.push({
          type: 'user',
          content: entry.content,
          translatedContent: entry.translatedContent
        });
      } else if (entry.side === 'model') {
        modelMessages.push({
          type: 'user',
          content: entry.content,
          translatedContent: entry.translatedContent
        });
      } else if (entry.side === 'directModel') {
        directModelMessages.push({
          type: 'user',
          content: entry.content
        });
      }
    } else if (entry.messageType === 'model') {
      if (entry.side === 'user') {
        userMessages.push({
          type: 'model',
          content: entry.content,
          translatedContent: entry.translatedContent,
          thinking: entry.thinking,
          translatedThinking: entry.translatedThinking
        });
      } else if (entry.side === 'model') {
        modelMessages.push({
          type: 'model',
          content: entry.content,
          translatedContent: entry.translatedContent,
          thinking: entry.thinking,
          translatedThinking: entry.thinking
        });
      } else if (entry.side === 'directModel') {
        directModelMessages.push({
          type: 'model',
          content: entry.content,
          thinking: entry.thinking
        });
      }
    }
  });
  
  return {
    userMessages,
    modelMessages,
    directModelMessages
  };
};