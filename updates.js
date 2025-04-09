// Direct URL to the published Google Sheet CSV
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqeLETcGfNIaDd0CBxO3K_hIUs5EAFccVNmIbRJI7y1kEC12-H1mBzWp31cYjpR7dGG_MseTMZhkSa/pub?output=csv';

// Fetch updates from published Google Sheet CSV
function fetchUpdates() {
    const container = document.getElementById('updates-container');
    
    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading updates...</p>
        </div>
    `;

    fetch(CSV_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csv => {
            const updates = parseCSV(csv);
            displayUpdates(updates);
        })
        .catch(error => {
            console.error('Error fetching updates:', error);
            showError('Failed to load updates. Please try again later.');
        });
}

// Parse CSV data into an array of objects, handling both comma and tab delimiters
function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    
    // Determine if the data is tab-separated or comma-separated
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Get header row for column names
    const headers = lines[0].split(delimiter);
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // For tab-separated data, simply split by tabs
        if (delimiter === '\t') {
            const values = lines[i].split('\t');
            const date = values[0]?.trim();
            const title = values[1]?.trim();
            const content = values[2]?.trim();
            
            if (date && title && content) {
                result.push({ date, title, content });
            }
        } 
        // For comma-separated, handle quoted fields
        else {
            // Handle commas within quoted strings
            const entries = [];
            let inQuotes = false;
            let currentEntry = '';
            
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    entries.push(currentEntry.trim());
                    currentEntry = '';
                } else {
                    currentEntry += char;
                }
            }
            
            // Don't forget to push the last entry
            entries.push(currentEntry.trim());
            
            // Extract date, title, content
            const date = entries[0];
            const title = entries[1];
            const content = entries[2];
            
            if (date && title && content) {
                result.push({ date, title, content });
            }
        }
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => {
        // Parse dates correctly, handling YYYY-MM-DD format
        const parseDateString = (dateStr) => {
            // If it's already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return new Date(dateStr);
            }
            
            // Try parsing with Date object
            const date = new Date(dateStr);
            if (!isNaN(date)) {
                return date;
            }
            
            // Handle format like "2024-03-15" manually
            const parts = dateStr.split(/[-\/]/);
            if (parts.length === 3) {
                // Assuming YYYY-MM-DD or similar
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
                const day = parseInt(parts[2], 10);
                
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    return new Date(year, month, day);
                }
            }
            
            // Return invalid date if all else fails
            return new Date(NaN);
        };
        
        const dateA = parseDateString(a.date);
        const dateB = parseDateString(b.date);
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
            return dateB - dateA; // Newest first
        }
        
        // Fallback to string comparison if date parsing fails
        return a.date < b.date ? 1 : -1;
    });
    
    return result;
}

// Display updates in the container
function displayUpdates(updates) {
    const container = document.getElementById('updates-container');
    container.innerHTML = '';

    if (updates.length === 0) {
        container.innerHTML = '<div class="no-updates">No updates available at the moment. Check back soon!</div>';
        return;
    }

    updates.forEach(update => {
        const updateCard = createUpdateCard(update.date, update.title, update.content);
        container.appendChild(updateCard);
    });
}

// Create an update card element
function createUpdateCard(date, title, content) {
    const card = document.createElement('div');
    card.className = 'update-card';

    // Format the date
    let formattedDate;
    try {
        // Parse date with better handling
        const parsedDate = new Date(date);
        
        if (!isNaN(parsedDate)) {
            formattedDate = parsedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            // Try parsing manually if standard parsing fails
            const parts = date.split(/[-\/]/);
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
                const day = parseInt(parts[2], 10);
                
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const manualDate = new Date(year, month, day);
                    formattedDate = manualDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    formattedDate = date; // Use original if parsing fails
                }
            } else {
                formattedDate = date; // Use original if parsing fails
            }
        }
    } catch (e) {
        formattedDate = date; // Use as-is if parsing fails completely
        console.error('Error formatting date:', e);
    }
    
    // Create the HTML for the card with improved layout
    card.innerHTML = `
        <div class="update-header">
            <div class="update-date">
                <i class="fas fa-calendar-alt"></i> ${formattedDate}
            </div>
        </div>
        <h3 class="update-title">${title}</h3>
        <div class="update-content">${content}</div>
    `;

    return card;
}

// Show error message
function showError(message) {
    const container = document.getElementById('updates-container');
    container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
}

// Load updates on page load
document.addEventListener('DOMContentLoaded', fetchUpdates); 