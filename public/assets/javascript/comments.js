/**
 * Comments Manager class
 * Handles adding, displaying, and deleting comments on posts
 * UPDATED: Added collapsible comments functionality
 * FIXED: Event delegation now properly handles dynamically loaded posts
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
     * FIXED: Set up event listeners for comment interactions
     * Using proper event delegation that works with dynamically loaded content
     */
    setupEventListeners() {
        // FIXED: Event delegation for comment form submissions
        // Use document as the parent to catch all dynamically added forms
        document.addEventListener('submit', (e) => {
            // Check if the submitted target is a comment-form or submitted from within one
            const form = e.target.classList.contains('comment-form') 
                ? e.target 
                : e.target.closest('.comment-form');
            
            if (form) {
                console.log('Comment form submitted');
                e.preventDefault();
                e.stopPropagation();
                this.handleCommentSubmit(form);
            }
        }, true); // Use capture phase to ensure we catch the event

        // FIXED: Event delegation for all click events
        document.addEventListener('click', (e) => {
            // Delete comment buttons
            if (e.target.classList.contains('delete-comment-btn')) {
                console.log('Delete comment button clicked');
                e.preventDefault();
                e.stopPropagation();
                const commentId = e.target.getAttribute('data-comment-id');
                this.deleteComment(commentId, e.target.closest('.comment'));
                return;
            }
            
            // Toggle comments buttons
            const toggleBtn = e.target.closest('.toggle-comments-btn');
            if (toggleBtn) {
                console.log('Toggle comments button clicked');
                e.preventDefault();
                e.stopPropagation();
                const postId = toggleBtn.getAttribute('data-post-id');
                this.toggleComments(postId, toggleBtn);
                return;
            }
            
            // Collapse all comments button
            if (e.target.classList.contains('collapse-all-comments-btn')) {
                console.log('Collapse all comments button clicked');
                e.preventDefault();
                e.stopPropagation();
                const postId = e.target.getAttribute('data-post-id');
                this.collapseAllComments(postId);
                return;
            }
        }, true); // Use capture phase
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
 * FIXED: Event delegation for dynamically loaded posts
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
     * FIXED: Set up event listeners for like/dislike buttons
     * Using proper event delegation
     */
    setupEventListeners() {
        // FIXED: Event delegation for like/dislike buttons
        document.addEventListener('click', (e) => {
            // Like button
            if (e.target.classList.contains('like-btn')) {
                console.log('Like button clicked, postId:', e.target.getAttribute('data-post-id'));
                e.preventDefault();
                e.stopPropagation();
                const postId = e.target.getAttribute('data-post-id');
                if (postId) {
                    this.likePost(postId, true);
                }
                return;
            }
            
            // Dislike button
            if (e.target.classList.contains('dislike-btn')) {
                console.log('Dislike button clicked, postId:', e.target.getAttribute('data-post-id'));
                e.preventDefault();
                e.stopPropagation();
                const postId = e.target.getAttribute('data-post-id');
                if (postId) {
                    this.likePost(postId, false);
                }
                return;
            }
        }, true); // Use capture phase
    }

    /**
     * Like or dislike a post
     * @param {string} postId - Post ID
     * @param {boolean} isLike - True for like, false for dislike
     */
    async likePost(postId, isLike) {
        console.log('likePost called:', { postId, isLike });
        try {
            const response = await fetch(`${this.baseURL}/posts/${postId}/like`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isLike: isLike })
            });

            console.log('Like response status:', response.status);
            const data = await response.json();
            console.log('Like response data:', data);

            if (data.success) {
                // Update UI
                console.log('Updating likes UI for postId:', postId);
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
        console.log('updateLikesUI called for postId:', postId);
        try {
            const response = await fetch(`${this.baseURL}/posts/${postId}/likes`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();
            console.log('Likes data received:', data);

            if (data.success) {
                console.log('Calling displayLikes with:', { postId, likeCount: data.likeCount, dislikeCount: data.dislikeCount, userVote: data.userVote });
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
        console.log('displayLikes called:', { postId, likeCount, dislikeCount, userVote });
        const likesContainer = document.getElementById(`likes-${postId}`);
        
        console.log('Likes container found:', likesContainer ? 'yes' : 'NO');
        
        if (!likesContainer) {
            console.error('Likes container not found for postId:', postId);
            return;
        }

        let html = `
            <div class="likes-container">
                <button class="like-btn${userVote === 'like' ? ' active' : ''}" data-post-id="${postId}">👍 ${likeCount}</button>
                <button class="dislike-btn${userVote === 'dislike' ? ' active' : ''}" data-post-id="${postId}">👎 ${dislikeCount}</button>
            </div>
        `;

        console.log('Setting innerHTML to:', html);
        console.log('Container before:', likesContainer.innerHTML);
        likesContainer.innerHTML = html;
        console.log('Container after:', likesContainer.innerHTML);
        console.log('Container element:', likesContainer);
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