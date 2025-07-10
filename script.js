// Function to load projects from JSON file
async function loadProjects() {
    try {
        console.log("Attempting to load projects from projects.json");
        // Use a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`projects.json?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch projects.json: ${response.status} ${response.statusText}`);
            throw new Error('Failed to fetch projects.json');
        }
        
        const text = await response.text();
        console.log("Raw JSON text:", text);
        
        try {
            const data = JSON.parse(text);
            console.log("Projects loaded successfully:", data.projects);
            return data.projects;
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            throw new Error('Failed to parse projects.json');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        // Fallback projects if JSON loading fails
        console.log("Using hardcoded fallback projects");
        return [
            {
                "title": "Error",
                "description": "Error loading projects.json",
                "link": "#",
                "status": "In Development",
                "platforms": ["Windows", "macOS"],
                "tags": ["<#729fcf>Error", "<#3465a4>Loading"]
            }
        ];
    }
}

// Function to parse a tag that might contain a color code
function parseTag(tag) {
    // Check if the tag starts with a color code <#XXXXXX>
    const colorMatch = tag.match(/^<#([0-9A-Fa-f]{3,6})>(.+)$/);
    if (colorMatch) {
        // Return an object with the color and the clean tag text
        return {
            color: `#${colorMatch[1]}`,
            text: colorMatch[2].trim()
        };
    }
    // Return the original tag with no special color
    return {
        color: null,
        text: tag
    };
}

// Function to create project cards
async function createProjectCards(statusFilter = 'all') {
    console.log(`Creating project cards with filter: ${statusFilter}`);
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.error("Project grid element not found");
        return; // Only run on pages with project grid
    }
    
    // Show loading indicator
    projectGrid.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i><p>Loading projects...</p></div>';
    
    try {
        // Load projects from JSON
        const projects = await loadProjects();
        console.log(`Loaded ${projects.length} projects`);
        
        // Clear loading indicator
        projectGrid.innerHTML = '';
        
        // If no projects, show message
        if (!projects || projects.length === 0) {
            console.warn("No projects available");
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = '<p>No projects available yet. Check back soon!</p>';
            projectGrid.appendChild(emptyMessage);
            return;
        }
        
        // Filter projects by status if needed
        console.log(`Filtering projects by status: ${statusFilter}`);
        const filteredProjects = statusFilter === 'all' 
            ? projects 
            : projects.filter(project => {
                const projectStatus = project.status?.toLowerCase() || '';
                // More flexible matching - check if status contains the filter value
                return projectStatus.includes(statusFilter.toLowerCase());
            });
        
        console.log(`Filtered to ${filteredProjects.length} projects`);
        
        // Show message if no projects match the filter
        if (filteredProjects.length === 0) {
            console.warn(`No projects match the filter: ${statusFilter}`);
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <p>No projects with status "${statusFilter}" found.</p>
                <button class="reset-filter-btn">Show all projects</button>
            `;
            projectGrid.appendChild(emptyMessage);
            
            // Add event listener to reset filter button
            const resetButton = emptyMessage.querySelector('.reset-filter-btn');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    const statusFilter = document.getElementById('status-filter');
                    if (statusFilter) {
                        statusFilter.value = 'all';
                        createProjectCards('all');
                    }
                });
            }
            return;
        }
        
        // Create a card for each project
        filteredProjects.forEach((project, index) => {
            console.log(`Creating card for project: ${project.title}, status: ${project.status}`);
            const card = document.createElement('div');
            card.className = 'project-card';
            
            // Add a slight delay to each card for a staggered appearance
            setTimeout(() => {
            card.classList.add('visible');
            }, index * 150);
            
            // Get status class based on the project status
            let statusClass = '';
            if (project.status) {
                const status = project.status.toLowerCase();
                if (status.includes('concept')) statusClass = 'concept';
                else if (status.includes('planning')) statusClass = 'planning';
                else if (status.includes('development')) statusClass = 'development';
                else if (status.includes('testing')) statusClass = 'testing';
                else if (status.includes('completed')) statusClass = 'completed';
                else if (status.includes('paused')) statusClass = 'paused';
                else if (status.includes('cancelled')) statusClass = 'cancelled';
                console.log(`Status class for "${project.status}": ${statusClass}`);
            }
            
            // Parse tags if they exist
            let tagsHTML = '';
            if (project.tags && project.tags.length > 0) {
                tagsHTML = `<div class="project-tags">
                    ${project.tags.map(tag => {
                        const parsedTag = parseTag(tag);
                        const colorStyle = parsedTag.color ? `style="background-color: ${parsedTag.color}; border-color: ${parsedTag.color}; color: white;"` : '';
                        return `<span class="tag" ${colorStyle}>${parsedTag.text}</span>`;
                    }).join('')}
                </div>`;
            }
            
            // Create the HTML
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-accent"></div>
                    <div class="card-content">
                <div class="project-header">
                    ${project.status ? `<span class="project-status ${statusClass}">${project.status}</span>` : ''}
                </div>
                <h3>${project.title || 'Untitled Project'}</h3>
                <p>${project.description || 'No description available.'}</p>
                        ${tagsHTML}
                ${project.platforms ? `<div class="project-platforms">${project.platforms.map(platform => `<span class="platform">${platform}</span>`).join('')}</div>` : ''}
                <a href="${project.link || '#'}" class="project-link">Learn More</a>
                    </div>
                </div>
                <div class="card-bg"></div>
                <div class="card-decoration top-left"></div>
                <div class="card-decoration top-right"></div>
                <div class="card-decoration bottom-left"></div>
                <div class="card-decoration bottom-right"></div>
            `;
            projectGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error creating project cards:", error);
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'empty-message';
        errorMessage.innerHTML = '<p>Error loading projects. Please try again later.</p>';
        projectGrid.appendChild(errorMessage);
    }
}

// Function to setup project filter functionality
function setupProjectFilters() {
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) return; // Only run on pages with status filter
    
    // Store the previous filter value to check if it actually changed
    let previousFilter = 'all';
    
    statusFilter.addEventListener('change', function() {
        const newFilter = this.value;
        
        // Only reload if the filter actually changed
        if (newFilter !== previousFilter) {
            previousFilter = newFilter;
            
            // Fade out current projects
            const projectCards = document.querySelectorAll('.project-card');
            projectCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            });
            
            // Wait for fade out animation, then load new cards
            setTimeout(() => {
                createProjectCards(newFilter);
            }, 300);
        }
    });
    
    // Add filter reset button
    const filtersContainer = document.querySelector('.project-filters');
    if (filtersContainer) {
        const resetButton = document.createElement('button');
        resetButton.className = 'filter-reset-btn';
        resetButton.textContent = 'Reset Filter';
        resetButton.addEventListener('click', () => {
            if (statusFilter.value !== 'all') {
                statusFilter.value = 'all';
                previousFilter = 'all';
                
                // Trigger fade animation
                const projectCards = document.querySelectorAll('.project-card');
                projectCards.forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                });
                
                // Wait for fade out animation, then load new cards
                setTimeout(() => {
                    createProjectCards('all');
                }, 300);
            }
        });
        filtersContainer.appendChild(resetButton);
    }
}

// Function to load games from JSON file
async function loadGames() {
    try {
        console.log("Attempting to load games from games.json");
        // Use a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`games.json?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch games.json: ${response.status} ${response.statusText}`);
            throw new Error('Failed to fetch games.json');
        }
        
        const text = await response.text();
        console.log("Raw JSON text:", text);
        
        try {
            const data = JSON.parse(text);
            console.log("Games loaded successfully:", data.games);
            return data.games;
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            throw new Error('Failed to parse games.json');
        }
    } catch (error) {
        console.error('Error loading games:', error);
        // Fallback games if JSON loading fails
        console.log("Using hardcoded fallback games");
        return [
            {
                "title": "Error",
                "description": "Error loading games.json",
                "link": "#",
                "genre": "Adventure",
                "platforms": ["Windows", "macOS"],
                "tags": ["<#729fcf>Error", "<#3465a4>Loading"]
            }
        ];
    }
}

// Function to create game cards
async function createGameCards(searchTerm = '') {
    console.log(`Creating game cards with search: "${searchTerm}"`);
    const gamesGrid = document.querySelector('.games-grid');
    if (!gamesGrid) {
        console.error("Games grid element not found");
        return; // Only run on pages with games grid
    }
    
    // Show loading indicator
    gamesGrid.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i><p>Loading games...</p></div>';
    
    try {
        // Load games from JSON
        const games = await loadGames();
        console.log(`Loaded ${games.length} games`);
        
        // Clear loading indicator
        gamesGrid.innerHTML = '';
        
        // If no games, show message
        if (!games || games.length === 0) {
            console.warn("No games available");
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = '<p>No games available yet. Check back soon!</p>';
            gamesGrid.appendChild(emptyMessage);
            return;
        }
        
        // Whether we have a search term or not
        const hasSearch = searchTerm.trim() !== '';
        
        // Create cards for all games, but highlight or style them differently based on search
        games.forEach((game, index) => {
            console.log(`Processing game: ${game.title}`);
            
            // Check if the game matches the search criteria
            const searchLower = searchTerm.toLowerCase();
            const titleMatch = game.title?.toLowerCase().includes(searchLower) || false;
            const descMatch = game.description?.toLowerCase().includes(searchLower) || false;
            const genreMatch = game.genre?.toLowerCase().includes(searchLower) || false;
            
            // Parse tags and check if any match the search
            const parsedTags = game.tags ? game.tags.map(tag => parseTag(tag)) : [];
            const tagMatch = parsedTags.some(tag => 
                tag.text.toLowerCase().includes(searchLower)
            );
            
            // Prepare the tags HTML
            let tagsHTML = '';
            if (parsedTags.length > 0) {
                tagsHTML = `<div class="project-tags">
                    ${parsedTags.map(tag => {
                        const colorStyle = tag.color ? `style="background-color: ${tag.color}; border-color: ${tag.color}; color: white;"` : '';
                        return `<span class="tag" ${colorStyle}>${tag.text}</span>`;
                    }).join('')}
                </div>`;
            }
            
            // If we have a search term and no matches, make the card dimmed but still visible
            const isMatch = !hasSearch || titleMatch || descMatch || genreMatch || tagMatch;
            
            // Create the card
            const card = document.createElement('div');
            card.className = 'project-card game-card'; // Use same styling as project cards
            
            // Add match/no-match class
            if (hasSearch) {
                card.classList.add(isMatch ? 'search-match' : 'search-no-match');
            }
            
            // Add a slight delay to each card for a staggered appearance
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 150);
            
            // Create the HTML
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-accent"></div>
                    <div class="card-content">
                        <h3>${game.title || 'Untitled Game'}</h3>
                        <p>${game.description || 'No description available.'}</p>
                        ${tagsHTML}
                        ${game.platforms ? `<div class="project-platforms">${game.platforms.map(platform => `<span class="platform">${platform}</span>`).join('')}</div>` : ''}
                        <a href="${game.link || '#'}" class="project-link">Play Game</a>
                    </div>
                </div>
                <div class="card-bg"></div>
                <div class="card-decoration top-left"></div>
                <div class="card-decoration top-right"></div>
                <div class="card-decoration bottom-left"></div>
                <div class="card-decoration bottom-right"></div>
            `;
            gamesGrid.appendChild(card);
        });
        
        // Show a message if search has no results but still showing all games
        if (hasSearch && document.querySelectorAll('.search-match').length === 0) {
            const searchMessage = document.createElement('div');
            searchMessage.className = 'search-message';
            searchMessage.innerHTML = `<p>No exact matches for "${searchTerm}". Showing all games.</p>`;
            gamesGrid.insertBefore(searchMessage, gamesGrid.firstChild);
        }
    } catch (error) {
        console.error("Error creating game cards:", error);
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'empty-message';
        errorMessage.innerHTML = '<p>Error loading games. Please try again later.</p>';
        gamesGrid.appendChild(errorMessage);
    }
}

// Function to setup game search functionality
function setupGameSearch() {
    const searchInput = document.getElementById('game-search');
    const clearSearchBtn = document.getElementById('clear-search');
    
    if (!searchInput) return; // Only run on pages with search input
    
    // Add debounce to prevent too many reloads while typing
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        // Show/hide clear button based on input content
        if (this.value.length > 0) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        // Get the current search term
        const searchTerm = this.value.trim().toLowerCase();
        
        // Check if we're already showing all games (no need to reload)
        const gameCards = document.querySelectorAll('.game-card');
        
        if (gameCards.length > 0) {
            // First try to filter the existing cards for instant feedback
            let matchFound = false;
            
            gameCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                
                // Get tags without the color code prefixes
                const tags = Array.from(card.querySelectorAll('.tag')).map(tag => 
                    tag.textContent.toLowerCase()
                );
                
                const isMatch = searchTerm === '' || 
                    title.includes(searchTerm) || 
                    description.includes(searchTerm) || 
                    tags.some(tag => tag.includes(searchTerm));
                
                // Update card classes for styling
                card.classList.remove('search-match', 'search-no-match');
                if (searchTerm !== '') {
                    card.classList.add(isMatch ? 'search-match' : 'search-no-match');
                }
                
                if (isMatch) matchFound = true;
            });
            
            // Remove any existing search message
            const existingMessage = document.querySelector('.search-message');
            if (existingMessage) existingMessage.remove();
            
            // Add message if needed
            if (searchTerm !== '' && !matchFound) {
                const searchMessage = document.createElement('div');
                searchMessage.className = 'search-message';
                searchMessage.innerHTML = `<p>No exact matches for "${searchTerm}". Showing all games.</p>`;
                const gamesGrid = document.querySelector('.games-grid');
                gamesGrid.insertBefore(searchMessage, gamesGrid.firstChild);
            }
        } else {
            // If no cards yet, do a full reload (first load)
            // Debounce the search to avoid too many reloads
            searchTimeout = setTimeout(() => {
                createGameCards(searchTerm);
            }, 300); // Reduced debounce time for better responsiveness
        }
    });
    
    // Clear search button functionality
    if (clearSearchBtn) {
        // Initially hide the clear button
        clearSearchBtn.style.display = 'none';
        
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            
            // Clear search classes and show all games
            const gameCards = document.querySelectorAll('.game-card');
            gameCards.forEach(card => {
                card.classList.remove('search-match', 'search-no-match');
            });
            
            // Remove any search message
            const searchMessage = document.querySelector('.search-message');
            if (searchMessage) searchMessage.remove();
            
            // Focus the search input again
            searchInput.focus();
        });
    }
    
    // Add search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            
            // Apply the current search term
            const searchTerm = this.value.trim();
            if (document.querySelectorAll('.game-card').length === 0) {
                // Only reload if no cards are showing
                createGameCards(searchTerm);
            }
        }
    });
}

// Enhanced smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return; // Skip for home link
        
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Add a subtle flash effect to the target section
            target.classList.add('highlight-section');
            setTimeout(() => {
                target.classList.remove('highlight-section');
            }, 1000);
            
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Theme management
function initializeTheme() {
    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    document.body.appendChild(themeToggle);
    
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Add a subtle animation to indicate theme change
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Determine current page
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.endsWith('projects.html')) return 'projects';
    if (path.endsWith('games.html')) return 'games';
    return 'home';
}

// Enhanced parallax effect for paper texture and decorations
function setupParallax() {
    const paperTexture = document.querySelector('.paper-texture');
    if (!paperTexture) return;
    
    // Track mouse position for parallax effect
    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        // Move paper texture based on mouse position (subtle effect)
        paperTexture.style.transform = `translate(${mouseX * 15}px, ${mouseY * 15}px)`;
        
        // Apply subtle rotation to decorative elements
        document.querySelectorAll('.title-decoration').forEach(el => {
            el.style.transform = `rotate(${(mouseX - 0.5) * 5}deg)`;
        });
        
        // Move hero decorations
        document.querySelectorAll('.hero-decoration').forEach(el => {
            const isTop = el.classList.contains('top');
            el.style.transform = isTop 
                ? `scaleY(1) translateY(${mouseY * 10}px)` 
                : `scaleY(-1) translateY(${-mouseY * 10}px)`;
        });
    });
    
    // Animate section content on scroll
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionTitle = section.querySelector('.handcrafted-title');
            
            // Calculate how far the section is from the viewport center
            const distanceFromCenter = (sectionTop - scrollY - window.innerHeight / 2) / window.innerHeight;
            
            // Add subtle parallax to section titles
            if (sectionTitle) {
                sectionTitle.style.transform = `translateY(${distanceFromCenter * -40}px)`;
            }
        });
    });
}

// Add a handwritten-style cursor effect
function setupCustomCursor() {
    // Only use custom cursor on larger screens
    if (window.innerWidth < 768) return;
    
    const body = document.body;
    
    // Create custom cursor element
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    body.appendChild(cursor);
    
    // Add a trail effect
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    body.appendChild(trail);
    
    // Track mouse position with requestAnimationFrame for smoother updates
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Apply cursor position immediately for more responsiveness
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });
    
    // Use requestAnimationFrame for the trail to get smoother animation
    function updateTrail() {
        trail.style.left = mouseX + 'px';
        trail.style.top = mouseY + 'px';
        requestAnimationFrame(updateTrail);
    }
    requestAnimationFrame(updateTrail);
    
    // Change cursor appearance on clickable elements
    document.querySelectorAll('a, button, .cta-button, .project-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
            trail.classList.add('hovering');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
            trail.classList.remove('hovering');
        });
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    initializeTheme();
    
    const currentPage = getCurrentPage();
    
    // Initialize based on current page
    if (currentPage === 'projects') {
        await createProjectCards(); // Start with all projects
        setupProjectFilters();
    } else if (currentPage === 'games') {
        await createGameCards(''); // Start with all games
        setupGameSearch();
    }
    
    // Setup parallax and animations
    setupParallax();
    
    // Setup custom cursor effect
    setupCustomCursor();
    
    // Add scroll-based animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Stagger child animations
                const children = entry.target.querySelectorAll('.handcrafted-title, h2, h3, p, .cta-button, .social-link');
                children.forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('visible');
                    }, 150 * index);
                });
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
    
    // Add typewriter effect to the hero title with fallback
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        // Store the original text
        const originalText = "Crafting Unique Unity Games";
        
        // Set it as visible immediately to avoid flicker
        heroTitle.classList.add('visible');
        
        try {
            // Clear and start typing
            heroTitle.textContent = '';
            heroTitle.classList.add('typing');
            
            let i = 0;
            const typeWriter = () => {
                if (i < originalText.length) {
                    heroTitle.textContent += originalText.charAt(i);
                    i++;
                    setTimeout(typeWriter, Math.random() * 50 + 50);
                } else {
                    heroTitle.classList.remove('typing');
                }
            }
            
            // Start typing after a short delay
            setTimeout(typeWriter, 500);
        } catch (error) {
            // Fallback if typewriter effect fails
            console.error("Typewriter effect failed:", error);
            heroTitle.textContent = originalText;
            heroTitle.classList.remove('typing');
        }
        
        // Fallback timer - if after 3 seconds the title is empty, reset it
        setTimeout(() => {
            if (!heroTitle.textContent) {
                console.log("Applying fallback for empty hero title");
                heroTitle.textContent = originalText;
                heroTitle.classList.remove('typing');
            }
        }, 3000);
    }
}); 