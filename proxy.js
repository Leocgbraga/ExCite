const express = require('express');
var fetch = require('node-fetch');


const app = express();

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use(limiter);

app.use('/pubmed', function(req, res) {
  var url = apiUrl + req.url;
  console.log('About to make PubMed request to', url);  // Log before the request
  fetch(url)
    .then(apiRes => apiRes.text())
    .then(body => {
      console.log('Finished making PubMed request to', url);  // Log after the request
      res.send(body);
    });
});


app.get('/pubmed/*', (req, res) => {
  const pubmedUrl = 'https://eutils.ncbi.nlm.nih.gov' + req.originalUrl;
  req.pipe(request({ qs:req.query, uri: pubmedUrl })).pipe(res);
});

app.listen(5000, () => {
  console.log('Proxy server running on port 5000');
});
