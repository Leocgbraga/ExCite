document.getElementById('getCitations').addEventListener('click', () => {
  // Send a message to the background script to get citations for the current tab.
  chrome.runtime.sendMessage({ action: 'getCitations' }, (response) => {
    console.log(response);
  
    const citationsDiv = document.getElementById('citations');
    citationsDiv.innerHTML = ''; // clear the old citations

    // For each citation, create a new paragraph and add it to the citations div
    // For simplicity, we're assuming that `response` is an array of citation strings. 
    // If it's not, you'll need to modify this to match the actual structure of `response`.
    response.forEach(citation => {
      const p = document.createElement('p');
      p.textContent = citation;
      citationsDiv.appendChild(p);
    });
  });
});
