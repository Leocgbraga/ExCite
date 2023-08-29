# ExCite: Chrome Extension for Academic Insight into Web Content

## Introduction

ExCite is a Chrome extension designed to bring academic credibility to the web content you consume. Utilizing APIs like PubMed, this extension fetches relevant academic citations that provide a scholarly perspective to the arguments and key points present in the content you're viewing.

## How It Works

ExCite integrates seamlessly into your browser experience. While reading an article or watching a video online, simply activate the extension to:

1. Scan the text content or fetch transcripts for video content.
2. Summarize the content into arguments, key points, and quotations.
3. Retrieve academic citations from PubMed to support these key points.

## Technical Features

### Chrome Extension Components

#### Background Script (background.js)
- Listens for extension activation and initializes the content script.

#### Content Script (content.js)
- Scans and processes the text content on the web page.

#### Popup Interface (popup.html & popup.js)
- Provides a user interface to activate the extension and view results.

### Backend Server (Node.js)

#### Server Logic (server.js)
- Handles API calls to PubMed and other academic databases.
  
#### API Proxy (proxy.js)
- Manages API requests and responses, ensuring data integrity and security.

## API Endpoints

- `/fetchCitations`: Retrieves relevant academic citations from PubMed based on the summarized key points.

## Installation and Usage

1. Clone the repository.
2. Load the extension into Chrome via `chrome://extensions/`.
3. Run `npm install` to install server dependencies.
4. Run the server using `node server.js`.

## Contribution Guidelines

Contributions are welcome. Please fork the repository, create your branch, make changes, and submit a pull request.

## License

This project is licensed under the MIT License.
