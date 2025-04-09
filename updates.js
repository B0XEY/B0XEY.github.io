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
            const date = values[0];
            const title = values[1];
            const content = values[2];
            
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
                    entries.push(currentEntry);
                    currentEntry = '';
                } else {
                    currentEntry += char;
                }
            }
            
            // Don't forget to push the last entry
            entries.push(currentEntry);
            
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
        // Try to parse dates, if parsing fails, use string comparison
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
            return dateB - dateA;
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
        formattedDate = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // If the date is invalid, use the original string
        if (formattedDate === 'Invalid Date') {
            formattedDate = date;
        }
    } catch (e) {
        formattedDate = date; // Use as-is if parsing fails
    }
    
    // Create the HTML for the card
    card.innerHTML = `
        <div class="update-date">${formattedDate}</div>
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