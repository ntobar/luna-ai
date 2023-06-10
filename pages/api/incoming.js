// api/incoming.js
const axios = require('axios');
// import axios from 'axios';

// // This is an API route in Next.js
// export default async function handler(req, res) {
//     console.log(req.method); // Print out the HTTP method
//     console.log(req.headers); // Print out the request headers
//   if (req.method === 'POST') {
//     // This is where you handle incoming messages
//     const incomingMessage = req.body.Body;
//     const fromNumber = req.body.From;
    
//     // Generate a response using OpenAI's GPT-3
//     const gpt3Response = await getGpt3Response(incomingMessage);
//     console.log(gpt3Response);
    
//     // Send a response back
//     res.setHeader('Content-Type', 'text/xml');
//     res.status(200).send(`<Response><Message>${gpt3Response}</Message></Response>`);
//   } else {
//     // Handle any other HTTP method
//     res.setHeader('Allow', ['POST']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }

// // Define the function to generate a response from OpenAi GPT-3
// async function getGpt3Response(prompt) {
//   const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
//     prompt: prompt,
//     max_tokens: 60
//   }, {
//     headers: {
//       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//     }
//   });

//   return response.data.choices[0].text.trim();
// }

// require('dotenv').config();

// module.exports = async (req, res) => {
//     // This is where you handle incoming messages
//     const incomingMessage = req.body.Body;
//     console.log(`PROMPT IS: `, req);
//     const fromNumber = req.body.From;
    
//     // Generate a response using OpenAI's GPT-3
//     const gpt3Response = await getGpt3Response(incomingMessage);
    
//     // Send a response back to Twilio
//     res.setHeader('Content-Type', 'text/xml');
//     res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
// };

// // Define the function to generate a response from OpenAi GPT-3
// async function getGpt3Response(prompt) {
//     console.log(prompt);
//     const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-002/completions', {
//         prompt: prompt,
//         max_tokens: 60
//     }, {
//         headers: {
//             'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//         }
//     });

    
//     console.log(response.data.choices);
//     return response.data.choices[0].text.trim();
// }

require('dotenv').config();

module.exports =  async (req, res) => {

    if (req.method === 'POST') {
    // This is where you handle incoming messages
    const incomingMessage = req.body.Body;
    console.log(`PROMPT IS: `, req);
    const fromNumber = req.body.From;
    
    // Generate a response using OpenAI's GPT-3
    const gpt3Response = await getGpt3Response(incomingMessage);
    
    // Send a response back to Twilio
    res.setHeader('Content-Type', 'text/xml');
    res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
    }
};

// Define the function to generate a response from OpenAi GPT-3
async function getGpt3Response(prompt) {
    console.log(prompt);
    // Check if the message starts with "Luna"
    // if (!prompt.startsWith("Luna")) {
    //         // If the message does not start with "Luna", do not respond
    //         return "";
    //     }
    
        // Remove "Luna" from the beginning of the message
    // const actualPrompt = prompt.replace(/^Luna\s*/i, "");
    const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-002/completions', {
        // const response = await axios.post('https://api.openai.com/v1/chat/gpt-3.5-turbo-0301/completions', {

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
