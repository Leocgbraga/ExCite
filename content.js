if (window.location.hostname === 'www.youtube.com' && window.location.pathname === '/watch') {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    chrome.runtime.sendMessage({type: 'videoLoaded', videoId: videoId});
}