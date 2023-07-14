chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Citation Extension installed!');
});

async function fetchTranscript(videoId) {
  const url = `http://localhost:3000/transcript/${videoId}`;

  fetch(url)
      .then(response => response.json())
      .then(data => {
          console.log(data);  // The transcript of the video.
          analyzeTranscript(data);
      })
      .catch(err => console.log('error', err));
}

async function analyzeTranscript(transcript) {
  const url = `http://localhost:3000/analyze-transcript`;
  fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          transcript: transcript
      })
  })
      .then(response => response.json())
      .then(data => {
          console.log(data);  // The analyzed transcript
          fetchArticles(data);
      })
      .catch(err => console.log('error', err));
}

async function fetchArticles(query) {
  const url = `http://localhost:3000/articles?query=${encodeURIComponent(query)}`;
  fetch(url)
      .then(response => response.json())
      .then(data => {
          console.log(data);  // The articles from PubMed
          analyzeArticles(data, query);
      })
      .catch(err => console.log('error', err));
}

async function analyzeArticles(articles, transcript) {
  const url = `http://localhost:3000/analyze-articles`;
  fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          articles: articles,
          transcript: transcript
      })
  })
      .then(response => response.json())
      .then(data => {
          console.log(data);  // The analyzed articles
          // Based on the responses from GPT-4, categorize the citations.
      })
      .catch(err => console.log('error', err));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'videoLoaded') {
      fetchTranscript(request.videoId);
  }
});

let videoId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
if (request.action === 'setVideoId') {
  videoId = request.videoId;
  console.log(`Video ID set to ${videoId}`);
} else if (request.action === 'getCitations') {
  console.log(`Getting citations for video ${videoId}`);
  fetchTranscript(videoId);
}
});
