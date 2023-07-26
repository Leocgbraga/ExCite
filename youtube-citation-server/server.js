const express = require('express');
const rateLimit = require("express-rate-limit");
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');
require('dotenv').config();

const limiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 10 // limit each IP to 10 requests per windowMs
  });

const { Configuration, OpenAIApi } = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.use(cors());
app.use(express.json());

const nlp = require('compromise');

app.use(limiter);

app.get('/transcript/:videoId', async (req, res) => {
    const { videoId } = req.params;
    console.log(`Video ID: ${videoId}`);

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        res.json(transcript);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching transcript');
    }
});

app.post('/analyze-transcript', async (req, res) => {
    const { transcript, user_input } = req.body;
    console.log(transcript);

    // Ensure the transcript is not empty
    if (!transcript || transcript.length === 0) {
        return res.status(400).send('Empty transcript');
    }

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-4-0613",
            messages: [
                { role: "system", content: "You are a helpful assistant."},
                { role: "user", content: transcript },
                { role: "user", content: user_input}
            ],
        });

        // Extract the assistant's message
        const response = completion.data.choices[0].message.content;

        // Return the assistant's message
        res.json(response);
    } catch (err) {
        console.log(err.response.data);
        res.status(500).send('Error using the GPT-4 API: ' + err.message);
    }    
});

app.post('/analyze-query', async (req, res) => {
    const { transcript, user_query } = req.body;
    console.log(`Transcript: ${transcript}`);
    console.log(`User Query: ${user_query}`);

    // Ensure the transcript and user_query are not empty
    if (!transcript || transcript.length === 0 || !user_query) {
        return res.status(400).send('Empty transcript or user query');
    }

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-4-0613",
            messages: [
                { role: "system", content: "You are a helpful assistant."},
                { role: "assistant", content: transcript },
                { role: "user", content: `What does the research say about ${user_query}?`}
            ],
        });
        

        // Extract the assistant's message
        const response = completion.data.choices[0].message.content;

        // Return the assistant's message
        res.json(response);
    } catch (err) {
        console.log(err.response.data);
        res.status(500).send('Error using the GPT-4 API: ' + err.message);
    }    
});

const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

app.get('/search-pubmed', async (req, res) => {
    const { query } = req.query;

    // Check if the results are in cache
    const cachedResults = myCache.get(query);
    if (cachedResults) {
        return res.json(cachedResults);
    }

    // If not in cache, make the API request
    try {
        // Log the initiation of the PubMed search request
        console.log('About to make PubMed search request');

        // Search PubMed for the query
        const searchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
            params: {
                db: 'pubmed',
                term: query,
                retmode: 'json',
                api_key: process.env.PUBMED_API_KEY,
            },
        });

        // Log the completion of the PubMed search request
        console.log('Finished making PubMed search request');

        // Fetch details of each article
        let articleDetails = [];
        for (let i = 0; i < searchResponse.data.esearchresult.idlist.length; i++) {
            const id = searchResponse.data.esearchresult.idlist[i];

            // Log the initiation of the PubMed summary request
            console.log('About to make PubMed summary request');

            const detailResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
                params: {
                    db: 'pubmed',
                    id: id,
                    retmode: 'json',
                    api_key: process.env.PUBMED_API_KEY,
                },
            });

            // Log the completion of the PubMed summary request
            console.log('Finished making PubMed summary request');

            articleDetails.push(detailResponse.data.result[id]);

            // If we're not at the last request, wait for 0.1 seconds before making the next request
            if (i !== searchResponse.data.esearchresult.idlist.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Save the results in cache
        myCache.set(query, articleDetails);

        res.json(articleDetails);
    } catch (err) {
        console.error('Error searching PubMed:', err);
        res.status(500).json({ error: 'Error searching PubMed', message: err.message });
    }
});




app.post('/extract-keywords', async (req, res) => {
    const { user_query } = req.body;
    console.log(`User Query: ${user_query}`);

    // Ensure the user_query is not empty
    if (!user_query) {
        return res.status(400).send('Empty user query');
    }

    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-002", // Use a completion model
            prompt: `Given the text "${user_query}", list the main keywords or topics separated by commas.`,
            max_tokens: 60,
            temperature: 0.5,
        });

        // Extract the completion
        const response = completion.data.choices[0].text.trim();

        // Split the response into an array of keywords and trim leading and trailing whitespace and "and"s
        const keywords = response.split(',').map(keyword => keyword.trim().replace(/^and | and$/g, ''));

        // Return the keywords
        res.json(keywords);
    } catch (err) {
        console.log(err.response.data);
        res.status(500).send('Error using the GPT-3 API: ' + err.message);
    }    
});



app.listen(3000, () => console.log('Server running on port 3000'));
