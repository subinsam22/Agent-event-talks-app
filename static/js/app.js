// Application State
let releaseItems = [];
let activeFilter = 'all';
let searchQuery = '';

// DOM Elements
const feedContainer = document.getElementById('feedContainer');
const mainLoader = document.getElementById('mainLoader');
const emptyState = document.getElementById('emptyState');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

// Modal Elements
const tweetModal = document.getElementById('tweetModal');
const tweetTextarea = document.getElementById('tweetTextarea');
const charCount = document.getElementById('charCount');
const submitTweetBtn = document.getElementById('submitTweetBtn');
const cancelTweetBtn = document.getElementById('cancelTweetBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search input event
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    // Filter button events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderFeed();
        });
    });

    // Tweet Modal events
    closeModalBtn.addEventListener('click', hideTweetModal);
    cancelTweetBtn.addEventListener('click', hideTweetModal);
    
    tweetTextarea.addEventListener('input', () => {
        const length = tweetTextarea.value.length;
        charCount.textContent = length;
        if (length > 280) {
            charCount.classList.add('error');
            submitTweetBtn.disabled = true;
        } else {
            charCount.classList.remove('error');
            submitTweetBtn.disabled = false;
        }
    });

    // Close modal when clicking outside
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            hideTweetModal();
        }
    });
}

// Fetch Release Notes from API
async function fetchReleaseNotes() {
    showLoader();
    hideError();
    
    try {
        const response = await fetch('/api/releases');
        const data = await response.json();
        
        if (data.success) {
            processReleaseEntries(data.entries);
            renderFeed();
        } else {
            showError(data.error || "Failed to load release notes.");
        }
    } catch (err) {
        showError("Unable to reach the server. Make sure the backend is running.");
    } finally {
        hideLoader();
    }
}

// Process XML feed entries and parse multiple sections per entry
function processReleaseEntries(entries) {
    releaseItems = [];
    const parser = new DOMParser();

    entries.forEach((entry, entryIndex) => {
        const doc = parser.parseFromString(entry.content, 'text/html');
        const children = Array.from(doc.body.children);
        
        let currentType = 'Other';
        let currentElements = [];
        let sectionCount = 0;

        function addCurrentSection() {
            if (currentElements.length > 0) {
                const tempDiv = document.createElement('div');
                currentElements.forEach(el => tempDiv.appendChild(el.cloneNode(true)));
                
                // Get clean text for summary
                const textContent = tempDiv.textContent.replace(/\s+/g, ' ').trim();
                
                releaseItems.push({
                    id: `item-${entryIndex}-${sectionCount++}`,
                    date: entry.title,
                    type: currentType,
                    contentHtml: tempDiv.innerHTML,
                    textSummary: textContent,
                    link: entry.link
                });
                currentElements = [];
            }
        }

        if (children.length === 0) {
            // If content is plain text or doesn't have child tags
            releaseItems.push({
                id: `item-${entryIndex}-0`,
                date: entry.title,
                type: 'Other',
                contentHtml: entry.content,
                textSummary: entry.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
                link: entry.link
            });
            return;
        }

        children.forEach(child => {
            if (child.tagName === 'H3') {
                // Add previous section first
                addCurrentSection();
                // Start a new section
                currentType = child.textContent.trim();
            } else {
                currentElements.push(child);
            }
        });

        // Add the last section
        addCurrentSection();
    });
}

// Render Feed items to the container based on filters & search
function renderFeed() {
    feedContainer.innerHTML = '';
    
    // Filter & Search
    const filteredItems = releaseItems.filter(item => {
        // Apply category filter
        if (activeFilter !== 'all') {
            if (activeFilter === 'feature' && item.type.toLowerCase() !== 'feature') return false;
            if (activeFilter === 'change' && item.type.toLowerCase() !== 'change') return false;
            if (activeFilter === 'deprecation' && !item.type.toLowerCase().includes('deprecat')) return false;
        }

        // Apply search query filter
        if (searchQuery) {
            const matchesDate = item.date.toLowerCase().includes(searchQuery);
            const matchesType = item.type.toLowerCase().includes(searchQuery);
            const matchesContent = item.textSummary.toLowerCase().includes(searchQuery);
            return matchesDate || matchesType || matchesContent;
        }

        return true;
    });

    if (filteredItems.length === 0) {
        feedContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    feedContainer.classList.remove('hidden');

    filteredItems.forEach(item => {
        const card = createCardElement(item);
        feedContainer.appendChild(card);
    });
}

// Create Card DOM Element
function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'release-card';
    
    const typeClass = item.type.toLowerCase();
    let badgeClass = 'other';
    if (typeClass.includes('feature')) badgeClass = 'feature';
    else if (typeClass.includes('change')) badgeClass = 'change';
    else if (typeClass.includes('deprecat')) badgeClass = 'deprecation';

    card.innerHTML = `
        <div class="card-header">
            <div class="card-meta">
                <span class="card-date">${item.date}</span>
                <span class="badge-tag ${badgeClass}">${item.type}</span>
            </div>
            <div class="card-actions">
                <button class="action-icon-btn share-tw" title="Tweet update" onclick="openTweetComposer('${item.id}')">
                    <i class="fa-brands fa-x-twitter"></i>
                </button>
                <a href="${item.link}" target="_blank" class="action-icon-btn" title="View official doc">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
        </div>
        <div class="card-body">
            ${item.contentHtml}
        </div>
    `;

    return card;
}

// Open Tweet Modal with populated template
window.openTweetComposer = function(itemId) {
    const item = releaseItems.find(i => i.id === itemId);
    if (!item) return;

    // Create a concise preview summary
    let summaryText = item.textSummary;
    if (summaryText.length > 150) {
        summaryText = summaryText.slice(0, 147) + '...';
    }

    const tweetText = `BigQuery ${item.type} (${item.date}): "${summaryText}"\n\nRead more details here: ${item.link} #GoogleCloud #BigQuery`;
    
    tweetTextarea.value = tweetText;
    charCount.textContent = tweetText.length;

    // Handle character validation
    if (tweetText.length > 280) {
        charCount.classList.add('error');
        submitTweetBtn.disabled = true;
    } else {
        charCount.classList.remove('error');
        submitTweetBtn.disabled = false;
    }

    // Set submit action
    submitTweetBtn.onclick = () => {
        const finalTweet = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalTweet)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        hideTweetModal();
    };

    showTweetModal();
}

// Modal Toggle Helpers
function showTweetModal() {
    tweetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock background scroll
}

function hideTweetModal() {
    tweetModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// UI State Management Helpers
function showLoader() {
    mainLoader.classList.remove('hidden');
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
}

function hideLoader() {
    mainLoader.classList.add('hidden');
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
}

function hideError() {
    errorAlert.classList.add('hidden');
}

window.closeAlert = function() {
    hideError();
}
