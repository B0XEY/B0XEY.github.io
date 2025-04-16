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
            const image = values[3]?.trim(); // Add image field
            
            if (date && title && content) {
                result.push({ date, title, content, image });
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
            
            // Extract date, title, content, and image
            const date = entries[0];
            const title = entries[1];
            const content = entries[2];
            const image = entries[3]; // Add image field
            
            if (date && title && content) {
                result.push({ date, title, content, image });
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
        const updateCard = createUpdateCard(update.date, update.title, update.content, update.image);
        container.appendChild(updateCard);
    });
}

// Create an update card element
function createUpdateCard(date, title, content, image) {
    const card = document.createElement('div');
    card.className = 'update-card';
    
    // Add card background and decoration elements
    const cardBg = document.createElement('div');
    cardBg.className = 'card-bg';
    card.appendChild(cardBg);
    
    // Add accent line
    const cardAccent = document.createElement('div');
    cardAccent.className = 'card-accent';
    card.appendChild(cardAccent);
    
    // Add decorative elements
    const topLeftDecoration = document.createElement('div');
    topLeftDecoration.className = 'card-decoration top-left';
    card.appendChild(topLeftDecoration);
    
    const topRightDecoration = document.createElement('div');
    topRightDecoration.className = 'card-decoration top-right';
    card.appendChild(topRightDecoration);
    
    const bottomLeftDecoration = document.createElement('div');
    bottomLeftDecoration.className = 'card-decoration bottom-left';
    card.appendChild(bottomLeftDecoration);
    
    const bottomRightDecoration = document.createElement('div');
    bottomRightDecoration.className = 'card-decoration bottom-right';
    card.appendChild(bottomRightDecoration);
    
    // Create inner card with 3D effect
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    
    // Create content container
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
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
            formattedDate = date; // Use original string if parsing fails
        }
    } catch (e) {
        formattedDate = date; // Use original string if parsing fails
    }
    
    // Create date element
    const dateElement = document.createElement('div');
    dateElement.className = 'update-date';
    dateElement.innerHTML = `<i class="far fa-calendar"></i>${formattedDate}`;
    
    // Create title element
    const titleElement = document.createElement('h3');
    titleElement.className = 'update-title';
    titleElement.textContent = title;
    
    // Create content element
    const contentElement = document.createElement('p');
    contentElement.textContent = content;
    
    // Add image if provided
    if (image && image.startsWith('@')) {
        const imageUrl = image.substring(1); // Remove the @ symbol
        const imageContainer = document.createElement('div');
        imageContainer.className = 'update-image-container';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = title;
        img.className = 'update-image';
        
        imageContainer.appendChild(img);
        cardContent.appendChild(imageContainer);
    }
    
    // Assemble the card
    cardContent.appendChild(dateElement);
    cardContent.appendChild(titleElement);
    cardContent.appendChild(contentElement);
    
    cardInner.appendChild(cardContent);
    card.appendChild(cardInner);
    
    return card;
}

// Create fake sample updates when real data fails to load
function createFakeUpdates() {
    const container = document.getElementById('updates-container');
    container.innerHTML = '';
    
    // Sample update data with realistic game development content
    const sampleUpdates = [
        {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            title: "New Character Animation System",
            content: `<p>Just finished implementing a completely new character animation system for my latest game project! The new system includes:</p>
                    <ul>
                        <li>Improved blending between animations</li>
                        <li>Support for procedural animation layering</li>
                        <li>Runtime retargeting for different character skeletons</li>
                    </ul>
                    <p>The character movement feels much more fluid now. Next up: working on the combat mechanics!</p>`
        },
        {
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            title: "Level Design Progress Update",
            content: `<p>Made significant progress on the first world of my platformer game this week. I've completed:</p>
                    <ul>
                        <li>Initial blockout of all 7 levels in World 1</li>
                        <li>Refined the difficulty curve based on playtester feedback</li>
                        <li>Added hidden collectibles and secret paths</li>
                    </ul>
                    <p>Really satisfied with how the level flow is working out. Each stage introduces new mechanics gradually while staying challenging for experienced players.</p>`
        },
        {
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
            title: "Art Style Finalized",
            content: `<p>After weeks of experimentation, I've finally settled on the art style for my next game project!</p>
                    <p>I'm going with a hand-painted, stylized look with a focus on vibrant colors and atmospheric lighting. This approach gives me the perfect balance between visual appeal and performance.</p>
                    <p>Created a complete asset pipeline that allows me to maintain visual consistency while speeding up production. Can't wait to share more screenshots in the coming weeks!</p>`
        }
    ];

    // Add the fake updates to the container
    sampleUpdates.forEach(update => {
        const updateCard = createUpdateCard(update.date, update.title, update.content);
        container.appendChild(updateCard);
    });
}

// Show error message
function showError(message) {
    const container = document.getElementById('updates-container');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Initialize updates when the page loads
document.addEventListener('DOMContentLoaded', fetchUpdates); 