const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();


const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// Define route for Twilios incoming messages
app.post('/incoming', async (req, res) => {
    // This is where you handle incoming messages
    const incomingMessage = req.body.Body;
    console.log(`PROMPT IS: `, req);
    const fromNumber = req.body.From;
    
    // Generate a response using OpenAI's GPT-3
    const gpt3Response = await getGpt3Response(incomingMessage);
    
    // Send a response back to Twilio
    res.setHeader('Content-Type', 'text/xml');
    res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
});

// Define the function to generate a response from OpenAi GPT-3
async function getGpt3Response(prompt) {
    console.log(prompt);
    const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-002/completions', {
        prompt: prompt,
        max_tokens: 60
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    console.log(response.data.choices);
    return response.data.choices[0].text.trim();
}

const port = 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
