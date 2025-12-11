/**
 * Challenges page functionality
 * Fetches and displays active challenges from DEV.to
 */

const STUDENT_ID = 'M01039337';

/**
 * Load challenges when page is opened
 */
function loadChallenges() {
    const challengesList = document.getElementById('challengesList');
    const loadingMessage = document.getElementById('challengesLoading');
    const errorMessage = document.getElementById('challengesError');
    
    // Show loading, hide error
    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    challengesList.innerHTML = '';
    
    // Fetch challenges from backend
    fetch(`/${STUDENT_ID}/challenges`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            loadingMessage.classList.add('hidden');
            
            if (data.success && data.challenges && data.challenges.length > 0) {
                displayChallenges(data.challenges);
            } else {
                challengesList.innerHTML = '<p class="no-challenges">No active challenges found at the moment.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching challenges:', error);
            loadingMessage.classList.add('hidden');
            errorMessage.classList.remove('hidden');
        });
}

/**
 * Display challenges in the grid
 */
function displayChallenges(challenges) {
    const challengesList = document.getElementById('challengesList');
    challengesList.innerHTML = '';
    
    challenges.forEach(challenge => {
        const challengeCard = document.createElement('div');
        challengeCard.className = 'challenge-card';
        
        // Create challenge image if available
        const imageHtml = challenge.image 
            ? `<img src="${escapeHtml(challenge.image)}" alt="${escapeHtml(challenge.title)}" class="challenge-image">`
            : '<div class="challenge-image-placeholder">🏆</div>';
        
        // Create badge/tag if available
        const badgeHtml = challenge.badge 
            ? `<span class="challenge-badge">${escapeHtml(challenge.badge)}</span>`
            : '';
        
        // Format deadline if available
        const deadlineHtml = challenge.deadline 
            ? `<p class="challenge-deadline">⏰ Deadline: ${escapeHtml(challenge.deadline)}</p>`
            : '';
        
        challengeCard.innerHTML = `
            ${imageHtml}
            <div class="challenge-content">
                ${badgeHtml}
                <h3 class="challenge-title">${escapeHtml(challenge.title)}</h3>
                <p class="challenge-description">${escapeHtml(challenge.description)}</p>
                ${deadlineHtml}
                <a href="${escapeHtml(challenge.url)}" target="_blank" rel="noopener noreferrer" class="challenge-link">
                    View Challenge →
                </a>
            </div>
        `;
        
        challengesList.appendChild(challengeCard);
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize challenges page when navigating to it
 */
document.addEventListener('DOMContentLoaded', function() {
    // Listen for page navigation
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            const challengesPage = document.getElementById('challenges-page');
            if (challengesPage && !challengesPage.classList.contains('hidden')) {
                // Check if challenges have already been loaded
                const challengesList = document.getElementById('challengesList');
                if (challengesList && challengesList.children.length === 0) {
                    loadChallenges();
                }
            }
        });
    });
    
    // Observe the challenges page for visibility changes
    const challengesPage = document.getElementById('challenges-page');
    if (challengesPage) {
        observer.observe(challengesPage, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});
