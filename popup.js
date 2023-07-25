window.onload = function() {
    var getCitationsButton = document.getElementById('getCitations');
    getCitationsButton.addEventListener('click', function() {
        console.log('Button clicked in popup');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getCitations'}, function(response) {
                console.log('Received response in popup:', response);
            });
        });
    }, false);
};



  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.type === 'pubmedResults') {
          console.log('Received message from background: ', request);
          let citationData = request.data;
          for (let category of ['summary', 'references']) {
              let citations = citationData[category];
              if (citations.length === 0) {
                  document.getElementById(category + 'Citations').innerText = 'No citations found.';
              } else {
                  let citationElements = citations.map(citationId => {
                      let el = document.createElement('li');
                      el.innerText = 'PubMed ID: ' + citationId;
                      return el;
                  });
                  document.getElementById(category + 'Citations').append(...citationElements);
              }
          }
      }
  });

