const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');
require('dotenv').config();

const { Configuration, OpenAIApi } = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/transcript/:videoId', async (req, res) => {
    const { videoId } = req.params;

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        res.json(transcript);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching transcript');
    }
});

app.get('/articles', async (req, res) => {
    const { query } = req.query;

    try {
        const articles = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json`);
        res.json(articles.data);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error fetching articles');
    }
});

app.post('/analyze-transcript', async (req, res) => {
    const transcript = req.body.transcript;

    console.log(transcript);

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-4-0613",
            messages: [{ role: "user", content: "What are the main points of the following transcript?" }, { role: "user", content: JSON.stringify(transcript)}],
        });
        console.log(completion.data.choices[0].message);
        res.json(completion.data.choices[0].message.content)
    } catch (err) {
        console.log(err.response.data);  // Log the error message from the OpenAI API
        res.status(500).send('Error using the GPT-4 API: ' + err.message);
    }
});

app.post('/analyze-articles', async (req, res) => {
    const { articles, transcript } = req.body;

    try {
        // For simplicity, we're only analyzing the first article. In reality, you'd want to loop over all the articles.
        const article = articles[0];
        const completion = await openai.createChatCompletion({
            model: "gpt-4-0613",
            messages: [{ role: "user", content: `Is the following article related to the following transcript?` }, { role: "assistant", content: `${article}\n\n${transcript}`}],
        });
        console.log(completion.data.choices[0].message);
        res.json(completion.data.choices[0].message.content)
    } catch (err) {
        console.log(err.response.data);  // Log the error message from the OpenAI API
        res.status(500).send('Error using the GPT-4 API: ' + err.message);
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
