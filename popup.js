document.addEventListener('DOMContentLoaded', function() {
    const loadingDiv = document.getElementById('loading');
    const citationsDiv = document.getElementById('citations');
    const queryForm = document.getElementById('query-form');
    const queryInput = document.getElementById('query-input');

    // Show the loading message
    loadingDiv.style.display = 'block';

    // Listen for the form submission
    queryForm.addEventListener('submit', function(event) {
        // Prevent the form from being submitted
        event.preventDefault();

        // Get the user's query
        const query = queryInput.value;

        // Clear the input field
        queryInput.value = "";

        // Send a message to the background script with the user's query
        chrome.runtime.sendMessage({action: 'getUserQuery', query: query});
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'pubmedResults') {
            // Hide the loading message
            loadingDiv.style.display = 'none';

            // Clear previous results
            citationsDiv.textContent = '';

            // Display the APA citations
            for (const citation of request.data) {
                const p = document.createElement('p');
                p.textContent = citation;
                citationsDiv.appendChild(p);
            }
        } else if (request.type === 'pubmedError') {
            // Hide the loading message
            loadingDiv.style.display = 'none';

            // Show the error message
            citationsDiv.textContent = 'Error fetching citations: ' + request.error;
        } else if (request.type === 'error') {
            // Hide the loading message
            loadingDiv.style.display = 'none';

            // Show the error message
            citationsDiv.textContent = request.message;
        }
    });
});
