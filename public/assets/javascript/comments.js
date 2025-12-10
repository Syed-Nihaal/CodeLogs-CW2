/**
 * Comments Manager class
 * Handles adding, displaying, and deleting comments on posts
 * UPDATED: Added collapsible comments functionality
 */
class CommentsManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
        // Track collapsed state of comments per post
        this.collapsedStates = new Map();
        
        this.init();
    }

    /**
     * Initialise comments manager
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for comment interactions
     */
    setupEventListeners() {
        // Event delegation for comment form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            }
        });

        // Event delegation for delete comment buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-comment-btn')) {
                e.preventDefault();
                const commentId = e.target.getAttribute('data-comment-id');
                this.deleteComment(commentId, e.target.closest('.comment'));
            }
            
            // NEW: Event delegation for collapse/expand toggle buttons
            if (e.target.classList.contains('toggle-comments-btn') || 
                e.target.closest('.toggle-comments-btn')) {
                e.preventDefault();
                const target = e.target.classList.contains('toggle-comments-btn') ? 
                    e.target : e.target.closest('.toggle-comments-btn');
                const postId = target.getAttribute('data-post-id');
                this.toggleComments(postId, target);
            }
            
            // NEW: Event delegation for collapse all comments button
            if (e.target.classList.contains('collapse-all-comments-btn')) {
                e.preventDefault();
                const postId = e.target.getAttribute('data-post-id');
                this.collapseAllComments(postId);
            }
        });
    }

    /**
     * NEW: Toggle comments visibility for a post
     * @param {string} postId - Post ID
     * @param {HTMLElement} toggleButton - Toggle button element
     */
    toggleComments(postId, toggleButton) {
        const commentsContainer = document.getElementById(`comments-${postId}`);
        const commentForm = document.querySelector(`.comment-form[data-post-id="${postId}"]`);
        const collapseAllBtn = document.querySelector(`.collapse-all-comments-btn[data-post-id="${postId}"]`);
        const commentsWrapper = document.querySelector(`.comments-collapsible[data-post-id="${postId}"]`);
        
        if (!commentsContainer) return;
        
        const isCollapsed = commentsContainer.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand comments
            commentsContainer.classList.remove('collapsed');
            commentsContainer.classList.add('expanded');
            if (commentsWrapper) {
                commentsWrapper.classList.remove('collapsed');
                commentsWrapper.classList.add('expanded');
            }
            
            // Update toggle button
            toggleButton.innerHTML = '▲ Hide Comments';
            toggleButton.setAttribute('title', 'Click to hide comments');
            
            // Show comment form if it exists
            if (commentForm) {
                commentForm.classList.remove('collapsed');
            }
            
            // Update collapse all button if it exists
            if (collapseAllBtn) {
                collapseAllBtn.textContent = 'Collapse All';
            }
            
            // Update stored state
            this.collapsedStates.set(postId, false);
            this.saveCollapsedState(postId, true);
        } else {
            // Collapse comments
            commentsContainer.classList.add('collapsed');
            commentsContainer.classList.remove('expanded');
            if (commentsWrapper) {
                commentsWrapper.classList.add('collapsed');
                commentsWrapper.classList.remove('expanded');
            }
            
            // Update toggle button
            toggleButton.innerHTML = '▼ Show Comments';
            toggleButton.setAttribute('title', 'Click to show comments');
            
            // Hide comment form if it exists
            if (commentForm) {
                commentForm.classList.add('collapsed');
            }
            
            // Update collapse all button if it exists
            if (collapseAllBtn) {
                collapseAllBtn.textContent = 'Expand All';
            }
            
            // Update stored state
            this.collapsedStates.set(postId, true);
            this.saveCollapsedState(postId, false);
        }
    }

    /**
     * NEW: Collapse all comments for a post
     * @param {string} postId - Post ID
     */
    collapseAllComments(postId) {
        const commentsContainer = document.getElementById(`comments-${postId}`);
        const toggleButton = document.querySelector(`.toggle-comments-btn[data-post-id="${postId}"]`);
        const commentForm = document.querySelector(`.comment-form[data-post-id="${postId}"]`);
        const collapseAllBtn = document.querySelector(`.collapse-all-comments-btn[data-post-id="${postId}"]`);
        const commentsWrapper = document.querySelector(`.comments-collapsible[data-post-id="${postId}"]`);
        
        if (!commentsContainer) return;
        
        const isCollapsed = commentsContainer.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand all comments
            commentsContainer.classList.remove('collapsed');
            commentsContainer.classList.add('expanded');
            if (commentsWrapper) {
                commentsWrapper.classList.remove('collapsed');
                commentsWrapper.classList.add('expanded');
            }
            
            // Update toggle button if exists
            if (toggleButton) {
                toggleButton.innerHTML = '▲ Hide Comments';
                toggleButton.setAttribute('title', 'Click to hide comments');
            }
            
            // Show comment form if exists
            if (commentForm) {
                commentForm.classList.remove('collapsed');
            }
            
            // Update collapse all button
            if (collapseAllBtn) {
                collapseAllBtn.textContent = 'Collapse All';
            }
            
            // Update stored state
            this.collapsedStates.set(postId, false);
            this.saveCollapsedState(postId, true);
        } else {
            // Collapse all comments
            commentsContainer.classList.add('collapsed');
            commentsContainer.classList.remove('expanded');
            if (commentsWrapper) {
                commentsWrapper.classList.add('collapsed');
                commentsWrapper.classList.remove('expanded');
            }
            
            // Update toggle button if exists
            if (toggleButton) {
                toggleButton.innerHTML = '▼ Show Comments';
                toggleButton.setAttribute('title', 'Click to show comments');
            }
            
            // Hide comment form if exists
            if (commentForm) {
                commentForm.classList.add('collapsed');
            }
            
            // Update collapse all button
            if (collapseAllBtn) {
                collapseAllBtn.textContent = 'Expand All';
            }
            
            // Update stored state
            this.collapsedStates.set(postId, true);
            this.saveCollapsedState(postId, false);
        }
    }

    /**
     * NEW: Save collapsed state to localStorage
     * @param {string} postId - Post ID
     * @param {boolean} isExpanded - Whether comments are expanded
     */
    saveCollapsedState(postId, isExpanded) {
        try {
            const key = `commentsCollapsed_${postId}`;
            localStorage.setItem(key, isExpanded ? 'expanded' : 'collapsed');
        } catch (error) {
            console.error('Error saving collapsed state:', error);
        }
    }

    /**
     * NEW: Load collapsed state from localStorage
     * @param {string} postId - Post ID
     * @returns {boolean} Whether comments should be expanded
     */
    loadCollapsedState(postId) {
        try {
            const key = `commentsCollapsed_${postId}`;
            const state = localStorage.getItem(key);
            return state === 'expanded';
        } catch (error) {
            console.error('Error loading collapsed state:', error);
            return false; // Default to collapsed
        }
    }

    /**
     * Handle comment form submission
     * @param {HTMLFormElement} form - Comment form element
     */
    async handleCommentSubmit(form) {
        const postId = form.getAttribute('data-post-id');
        const textArea = form.querySelector('.comment-input');
        const text = textArea.value.trim();

        if (!text) {
            alert('Please enter a comment');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/posts/${postId}/comments`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.message || 'Unable to add comment. Please log in and try again.';
                alert(msg);
                return;
            }

            if (data.success) {
                // Clear textarea
                textArea.value = '';
                
                // Reload comments for this post
                this.loadCommentsForPost(postId);
                
                // Auto-expand comments when a new comment is added
                const commentsContainer = document.getElementById(`comments-${postId}`);
                if (commentsContainer && commentsContainer.classList.contains('collapsed')) {
                    const toggleButton = document.querySelector(`.toggle-comments-btn[data-post-id="${postId}"]`);
                    if (toggleButton) {
                        this.toggleComments(postId, toggleButton);
                    }
                }
            } else {
                alert(data.message || 'Error adding comment');
            }

        } catch (error) {
            console.error('Comment submission error:', error);
            alert('Error adding comment');
        }
    }

    /**
     * Load and display comments for a post
     * @param {string} postId - Post ID
     */
    async loadCommentsForPost(postId) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${postId}/comments`, {
                credentials: 'same-origin'
            });
            const data = await response.json();

            if (data.success) {
                this.displayComments(postId, data.comments);
                
                // Apply saved collapsed state
                setTimeout(() => {
                    this.applySavedCollapsedState(postId);
                }, 100);
            }

        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    /**
     * NEW: Apply saved collapsed state to comments
     * @param {string} postId - Post ID
     */
    applySavedCollapsedState(postId) {
        const commentsContainer = document.getElementById(`comments-${postId}`);
        const toggleButton = document.querySelector(`.toggle-comments-btn[data-post-id="${postId}"]`);
        const commentForm = document.querySelector(`.comment-form[data-post-id="${postId}"]`);
        const collapseAllBtn = document.querySelector(`.collapse-all-comments-btn[data-post-id="${postId}"]`);
        const commentsWrapper = document.querySelector(`.comments-collapsible[data-post-id="${postId}"]`);
        
        if (!commentsContainer || !toggleButton) return;
        
        const shouldBeExpanded = this.loadCollapsedState(postId);
        
        if (shouldBeExpanded) {
            // Expand comments
            commentsContainer.classList.remove('collapsed');
            commentsContainer.classList.add('expanded');
            if (commentsWrapper) {
                commentsWrapper.classList.remove('collapsed');
                commentsWrapper.classList.add('expanded');
            }
            toggleButton.innerHTML = '▲ Hide Comments';
            toggleButton.setAttribute('title', 'Click to hide comments');
            if (commentForm) {
                commentForm.classList.remove('collapsed');
            }
            if (collapseAllBtn) {
                collapseAllBtn.textContent = 'Collapse All';
            }
        } else {
            // Collapse comments
            commentsContainer.classList.add('collapsed');
            commentsContainer.classList.remove('expanded');
            if (commentsWrapper) {
                commentsWrapper.classList.add('collapsed');
                commentsWrapper.classList.remove('expanded');
            }
            toggleButton.innerHTML = '▼ Show Comments';
            toggleButton.setAttribute('title', 'Click to show comments');
            if (commentForm) {
                commentForm.classList.add('collapsed');
            }
            if (collapseAllBtn) {
                collapseAllBtn.textContent = 'Expand All';
            }
        }

        // Sync form state when wrapper is collapsed by default
        if (!shouldBeExpanded && commentForm) {
            commentForm.classList.add('collapsed');
        }
    }

    /**
     * Display comments in the UI
     * @param {string} postId - Post ID
     * @param {Array} comments - Array of comment objects
     */
    displayComments(postId, comments) {
        const commentsContainer = document.getElementById(`comments-${postId}`);
        
        if (!commentsContainer) {
            return;
        }

        // Add collapsible class if not present
        if (!commentsContainer.classList.contains('collapsible-comments')) {
            commentsContainer.classList.add('collapsible-comments');
        }

        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        let html = comments.map(comment => `
            <div class="comment" data-comment-id="${comment._id}">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                <div class="comment-actions">
                    <button class="delete-comment-btn" data-comment-id="${comment._id}">Delete</button>
                </div>
            </div>
        `).join('');

        commentsContainer.innerHTML = html;
        // Keep collapsed state consistent after re-render
        commentsContainer.classList.add('collapsed');
        
        // Update comment count in toggle button
        this.updateCommentCount(postId, comments.length);
    }

    /**
     * NEW: Update comment count in toggle button
     * @param {string} postId - Post ID
     * @param {number} count - Number of comments
     */
    updateCommentCount(postId, count) {
        const toggleButton = document.querySelector(`.toggle-comments-btn[data-post-id="${postId}"]`);
        if (toggleButton) {
            const currentText = toggleButton.innerHTML;
            const isExpanded = toggleButton.innerHTML.includes('Hide Comments');
            const baseText = isExpanded ? '▲ Hide Comments' : '▼ Show Comments';
            toggleButton.innerHTML = `${baseText} (${count})`;
            toggleButton.setAttribute('data-comment-count', count);
        }
    }

    /**
     * Delete a comment
     * @param {string} commentId - Comment ID
     * @param {HTMLElement} commentElement - Comment DOM element
     */
    async deleteComment(commentId, commentElement) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (data.success) {
                commentElement.remove();
                
                // Update comment count
                const postId = commentElement.closest('.comments-section')?.querySelector('.toggle-comments-btn')?.getAttribute('data-post-id');
                if (postId) {
                    const commentsContainer = document.getElementById(`comments-${postId}`);
                    const remainingComments = commentsContainer.querySelectorAll('.comment').length;
                    this.updateCommentCount(postId, remainingComments);
                    
                    // Show "no comments" message if all comments deleted
                    if (remainingComments === 0) {
                        commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
                    }
                }
            } else {
                alert(data.message || 'Error deleting comment');
            }

        } catch (error) {
            console.error('Delete comment error:', error);
            alert('Error deleting comment');
        }
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

/**
 * Likes Manager class
 * Handles liking and disliking posts
 */
class LikesManager {
    constructor() {
        // Base URL for API calls with Student ID
        const STUDENT_ID = 'M01039337';
        this.baseURL = `/${STUDENT_ID}`;
        
        // Track current user's votes
        this.userVotes = {};
        
        this.init();
    }

    /**
     * Initialise likes manager
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for like/dislike buttons
     */
    setupEventListeners() {
        // Event delegation for like buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('like-btn')) {
                e.preventDefault();
                const postId = e.target.getAttribute('data-post-id');
                this.likePost(postId, true);
            }
            
            if (e.target.classList.contains('dislike-btn')) {
                e.preventDefault();
                const postId = e.target.getAttribute('data-post-id');
                this.likePost(postId, false);
            }
        });
    }

    /**
     * Like or dislike a post
     * @param {string} postId - Post ID
     * @param {boolean} isLike - True for like, false for dislike
     */
    async likePost(postId, isLike) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${postId}/like`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isLike: isLike })
            });

            const data = await response.json();

            if (data.success) {
                // Update UI
                this.updateLikesUI(postId);
            } else {
                // Handle not logged in
                if (response.status === 401) {
                    alert('Please login to like posts');
                } else {
                    alert(data.message || 'Error updating like');
                }
            }

        } catch (error) {
            console.error('Like error:', error);
            alert('Error updating like');
        }
    }

    /**
     * Load and update likes display for a post
     * @param {string} postId - Post ID
     */
    async updateLikesUI(postId) {
        try {
            const response = await fetch(`${this.baseURL}/posts/${postId}/likes`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();

            if (data.success) {
                this.displayLikes(postId, data.likeCount, data.dislikeCount, data.userVote);
            }

        } catch (error) {
            console.error('Error loading likes:', error);
        }
    }

    /**
     * Display like/dislike buttons and counts
     * @param {string} postId - Post ID
     * @param {number} likeCount - Number of likes
     * @param {number} dislikeCount - Number of dislikes
     * @param {string} userVote - User's current vote ('like', 'dislike', or null)
     */
    displayLikes(postId, likeCount, dislikeCount, userVote) {
        const likesContainer = document.getElementById(`likes-${postId}`);
        
        if (!likesContainer) {
            return;
        }

        let html = `
            <div class="likes-container">
                <button class="like-btn${userVote === 'like' ? ' active' : ''}" data-post-id="${postId}">👍 ${likeCount}</button>
                <button class="dislike-btn${userVote === 'dislike' ? ' active' : ''}" data-post-id="${postId}">👎 ${dislikeCount}</button>
            </div>
        `;

        likesContainer.innerHTML = html;
    }

    /**
     * Load likes for a post on page load
     * @param {string} postId - Post ID
     */
    async loadLikesForPost(postId) {
        await this.updateLikesUI(postId);
    }
}

// Create instances when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.commentsManager = new CommentsManager();
    window.likesManager = new LikesManager();
});