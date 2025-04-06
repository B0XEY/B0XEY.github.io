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
                "tags": ["Platformer", "Retro", "Puzzle"]
            }
        ];
    }
}

// Function to create project cards
async function createProjectCards(statusFilter = 'all') {
    console.log(`Creating project cards with filter: ${statusFilter}`);
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.error("Project grid element not found");
        return; // Only run on pages with project grid
    }
    
    // Clear existing content including loading indicator
    projectGrid.innerHTML = '';
    
    try {
        // Load projects from JSON
        const projects = await loadProjects();
        console.log(`Loaded ${projects.length} projects`);
        
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
                return projectStatus.includes(statusFilter);
            });
        
        console.log(`Filtered to ${filteredProjects.length} projects`);
        
        // Show message if no projects match the filter
        if (filteredProjects.length === 0) {
            console.warn(`No projects match the filter: ${statusFilter}`);
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `<p>No projects with status "${statusFilter}" found.</p>`;
            projectGrid.appendChild(emptyMessage);
            return;
        }
        
        // Create a card for each project
        filteredProjects.forEach((project, index) => {
            console.log(`Creating card for project: ${project.title}, status: ${project.status}`);
            const card = document.createElement('div');
            card.className = 'project-card';
            
            // Make visible immediately to avoid animation issues
            card.classList.add('visible');
            
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
            
            // Create the HTML
            card.innerHTML = `
                <div class="card-decoration top-left"></div>
                <div class="card-decoration top-right"></div>
                <div class="project-header">
                    ${project.status ? `<span class="project-status ${statusClass}">${project.status}</span>` : ''}
                </div>
                <h3>${project.title || 'Untitled Project'}</h3>
                <p>${project.description || 'No description available.'}</p>
                ${project.tags ? `<div class="project-tags">${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                ${project.platforms ? `<div class="project-platforms">${project.platforms.map(platform => `<span class="platform">${platform}</span>`).join('')}</div>` : ''}
                <a href="${project.link || '#'}" class="project-link">Learn More</a>
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
    
    statusFilter.addEventListener('change', function() {
        createProjectCards(this.value);
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return; // Skip for home link
        
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Determine current page
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.endsWith('projects.html')) return 'projects';
    return 'home';
}

// Add subtle parallax effect to paper texture
function setupParallax() {
    const paperTexture = document.querySelector('.paper-texture');
    if (!paperTexture) return;
    
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        paperTexture.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    });
    
    // Add subtle animation to decorative elements
    document.querySelectorAll('.title-decoration, .card-decoration, .hero-decoration').forEach(el => {
        el.style.animationDelay = Math.random() * 2 + 's';
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const currentPage = getCurrentPage();
    
    // Initialize based on current page
    if (currentPage === 'projects') {
        await createProjectCards(); // Start with all projects
        setupProjectFilters();
    }
    
    // Setup parallax and animations
    setupParallax();
    
    // Add scroll-based animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}); 