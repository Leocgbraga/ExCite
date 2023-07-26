let requestQueue = [];


chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Citation Extension installed!');
});

async function fetchTranscript(videoId) {
  const url = `http://localhost:3000/transcript/${videoId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Convert the data into an array of text
    const transcriptText = data.map(item => item.text);

    // Store the transcript text in chrome.storage.local
    chrome.storage.local.set({transcript: transcriptText}, function() {
      console.log(`Transcript set to ${transcriptText}`);
    });

  } catch (err) {
    console.error('Error fetching transcript:', err);
  }
}

async function analyzeTranscript(segment) {
  const url = `http://localhost:3000/analyze-transcript`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: segment }),
    });

    const data = await response.json();
    console.log(data);  // The analyzed transcript

    // Fetch articles from PubMed using the analyzed transcript
    for (let sentence of data) {
      fetchPubMed(sentence);
    }
  } catch (err) {
    console.error('Error analyzing transcript:', err);
  }
}

// Create a queue to store the promises

let requestCount = 0;
let firstRequestTimestamp = null;

async function processQueue() {
  if (requestQueue.length === 0) {
    return;
  }

  const { resolve, reject, func } = requestQueue.shift();

  if (requestCount === 0) {
    firstRequestTimestamp = Date.now();
  }

  try {
    const result = await func();
    requestCount++;
    resolve(result);
  } catch (err) {
    reject(err);
  }

  if (Date.now() - firstRequestTimestamp >= 1000) { // Change this to 1000 for 1 second
    requestCount = 0;
    firstRequestTimestamp = Date.now(); // Reset the timestamp for the next second
  }

  // Check if there are more requests to process and if we haven't already made 10 requests in the last second
  if (requestQueue.length > 0 && requestCount < 10) {
    setTimeout(processQueue, 1000 - (Date.now() - firstRequestTimestamp));  // Process the next request after an appropriate delay
  } else if (requestCount >= 10) {
    // If we have already made 10 requests in the last second, wait until a second has passed since the first request before processing the next request
    setTimeout(processQueue, firstRequestTimestamp + 1000 - Date.now());
  }
}


async function fetchPubMed(keywords) {
  console.log(`Keywords: ${keywords}`);
  const keywordsToUse = keywords.length > 5 ? keywords.slice(0, 5) : keywords;
  console.log(`Fetching PubMed articles for query: ${keywordsToUse.join(' AND ')} AND ${keywordsToUse.join(' OR ')}`);

  const andQuery = keywordsToUse.join(' AND ');
  const orQuery = keywordsToUse.join(' OR ');

  // Fetch 'AND' articles from server
  let andData = await fetch(`http://localhost:3000/search-pubmed?query=${encodeURIComponent(andQuery)}`)
    .then(res => res.json());
  console.log(andData);

  // Fetch 'OR' articles from server
  let orData = await fetch(`http://localhost:3000/search-pubmed?query=${encodeURIComponent(orQuery)}`)
    .then(res => res.json());
  console.log(orData);

  if (!Array.isArray(andData) || !Array.isArray(orData)) {
    console.error('andData or orData is not an array');
    return;
  }

  const combinedData = [...andData, ...orData];

  const formattedCitations = combinedData.map((article) => {
    const authors = article.authors.map((author) => `${author.name}, `).join(', ');
    const year = new Date(article.pubdate).getFullYear();
    const title = article.title;
    const journal = article.source;
    const volume = article.volume;
    const issue = article.issue;
    const pages = article.pages;

    return `${authors} (${year}). ${title}. ${journal}, ${volume}(${issue}), ${pages}.`;
  });

  chrome.runtime.sendMessage({type: 'pubmedResults', data: formattedCitations});
}










chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);  // Log the request

  if (request.type === 'videoLoaded' && request.videoId !== null) {
    // Store the video ID in chrome.storage.local
    chrome.storage.local.set({videoId: request.videoId}, function() {
      console.log(`Video ID set to ${request.videoId}`);
    });
    fetchTranscript(request.videoId);
  } else if (request.action === 'setVideoId' && request.videoId !== null) {
    // Store the video ID in chrome.storage.local
    chrome.storage.local.set({videoId: request.videoId}, function() {
      console.log(`Video ID set to ${request.videoId}`);
    });
  } else if (request.action === 'getCitations') {
    // Get the video ID from chrome.storage.local
    chrome.storage.local.get(['videoId'], function(result) {
      console.log(`Getting citations for video ${result.videoId}`);
      fetchTranscript(result.videoId);
    });
  } else if (request.action === 'getUserQuery') {
    // Store the user query and analyze it
    chrome.storage.local.set({userQuery: request.query}, function() {
      console.log(`User query set to ${request.query}`);
      analyzeQuery(request.query);
    });
  }
});

async function analyzeQuery(query) {
  const url = `http://localhost:3000/analyze-query`;

  chrome.storage.local.get(['transcript'], async function(result) {
    console.log(result);  // Log the result object

    if (result.transcript) {
      const transcript = result.transcript.join(' ');  // Convert the transcript array into a string

      console.log(query);  // Log the query

      try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcript: transcript, user_query: query }),
        });

        const data = await response.json();
        console.log(data);  // The analyzed query

        console.log('Data to extract keywords:', data);
        
        const keywordsResponse = await fetch(`http://localhost:3000/extract-keywords`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_query: data }),  // Send "user_query" instead of "text"
        });

        const keywordsData = await keywordsResponse.json();
        console.log('Keywords Data:', keywordsData);  // Log the keywordsData

        // Fetch articles from PubMed using the extracted keywords
        fetchPubMed(keywordsData);
      } catch (err) {
        console.error('Error analyzing query:', err);
      }
    } else {
      console.log('Transcript is undefined');
    }
  });
}






async function findRelevantTranscriptPart(userQuery) {
  // Get the transcript from chrome.storage.local
  chrome.storage.local.get(['transcript'], function(result) {
    console.log(`Transcript set to ${result.transcript}`);

    // Extract keywords from the user query
    const queryKeywords = nlp(userQuery).nouns().out('array');

    // Find the index of the sentence in the transcript that includes any of the query keywords
    const index = result.transcript.findIndex(sentence => {
      const sentenceKeywords = nlp(sentence).nouns().out('array');
      return sentenceKeywords.some(keyword => queryKeywords.includes(keyword));
    });

    // Ensure the user query was found in the transcript
    if (index === -1) {
      console.error('User query not found in transcript');
      return;
    }

    // Get the relevant part of the transcript
    const relevantPart = result.transcript[index];

    // Analyze the relevant part of the transcript
    analyzeTranscript(relevantPart);
  });
}
