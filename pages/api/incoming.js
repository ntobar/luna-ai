// api/incoming.js
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const twilio = require('twilio');
const fs = require('fs');
const CloudConvert = require('cloudconvert');


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

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// START MAIN FUNCTION
module.exports =  async (req, res) => {

    if (req.method === 'POST') {
    // This is where you handle incoming messages
    const incomingMessage = req.body.Body;
    const incomingMediaUrl = req.body.MediaUrl0;
    console.log(`PROMPT IS: `, incomingMessage);
    const fromNumber = req.body.From;
    
    console.log(`From number line 98: `, fromNumber);

    // Handle voice note
    if(incomingMediaUrl) {
      const transcription = await transcribeAudio(incomingMediaUrl);

      res.setHeader('Content-Type', 'text/xml');
      res.send(`<Response><Message>Transcription: ${transcription}</Message></Response>`);
    }
    // Delete?
    if (incomingMessage.toLowerCase().includes('image')) {
        // Set this to the maximum number of tokens you want the model to generate.
        const maxTokens = 512; 


        const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        // Generate an image based on the message body
        const imageResult = await openai.createImage({
            prompt: incomingMessage,
            size: "256x256",
        });

        res.setHeader('Content-Type', 'image/png');
        console.log("IMAGEEEEE ", imageResult.data.data[0].url, " END IMAAAAGE");
        // Send the image URL back to the user
        client.messages
            .create({
                mediaUrl: [`${imageResult.data.data[0].url}`],
                from: 'whatsapp:+593994309557',
                // to: `whatsapp:${fromNumber}`
                to: fromNumber

            })
             .then(message => {
                console.log(`Message sent with SID ${message.sid}`);
                res.status(200).send({ sid: message.sid });  // send a response
              })
              .catch(err => {
                console.error(err);
                res.status(500).send({ error: err.message });  // send a response
              });
        // const twilioResponse = client.messages
        //     .create({
        //         mediaUrl: [`${imageResult.data.data[0].url}`],
        //         from: 'whatsapp:+593994309557',
        //         to: `whatsapp:${fromNumber}`
        //     })
        //     .then(message => console.log(`Message sent with SID ${message.sid}`))
        //     .catch(err => res.status(500).send({ error: err }));

        // res.send(twilioResponse)
    } else {
    //End delete
    // Generate a response using OpenAI's GPT-3
    console.log("&&&&&&&&&&&&&&&& Before awaiting gpt 4 response");
    const gpt3Response = await getGpt4Response(incomingMessage);
    
    res.setHeader('Content-Type', 'text/xml');
    if(gpt3Response.length < 1500) {
    // Send a response back to Twilio
    console.log("Message length is less than 1500 characters")
    res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
    } else {

      console.log("Message length is more than 1500 characters, splitting message");
      res.status(204).end();
      sendTwilioMessage1600Characters(gpt3Response, fromNumber);
    }
    }
}
};
// END ORIGINAL FUNCTION

// TEST VERCEL OPENAI SDK 
// import { OpenAIStream, StreamingTextResponse } from 'ai';
// export const runtime = 'edge';

// module.exports =  async (req, res) => {

//   if (req.method === 'POST') {
//   // This is where you handle incoming messages
//   const incomingMessage = req.body.Body;
//   const incomingMediaUrl = req.body.MediaUrl0;
//   console.log(`PROMPT IS: `, req);
//   const fromNumber = req.body.From;
  
//   console.log(`From numBAHHH: `, fromNumber);

//   // Handle voice note
//   if(incomingMediaUrl) {
//     const transcription = await transcribeAudio(incomingMediaUrl);

//     res.setHeader('Content-Type', 'text/xml');
//     res.send(`<Response><Message>Transcription: ${transcription}</Message></Response>`);
//   }
//   // Delete?
//   if (incomingMessage.toLowerCase().includes('image')) {
//       // Set this to the maximum number of tokens you want the model to generate.
//       const maxTokens = 512; 


//       const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//       // Generate an image based on the message body
//       const imageResult = await openai.createImage({
//           prompt: incomingMessage,
//           size: "256x256",
//       });

//       res.setHeader('Content-Type', 'image/png');
//       console.log("IMAGEEEEE ", imageResult.data.data[0].url, " END IMAAAAGE");
//       // Send the image URL back to the user
//       client.messages
//           .create({
//               mediaUrl: [`${imageResult.data.data[0].url}`],
//               from: 'whatsapp:+593994309557',
//               // to: `whatsapp:${fromNumber}`
//               to: fromNumber

//           })
//            .then(message => {
//               console.log(`Message sent with SID ${message.sid}`);
//               res.status(200).send({ sid: message.sid });  // send a response
//             })
//             .catch(err => {
//               console.error(err);
//               res.status(500).send({ error: err.message });  // send a response
//             });
//       // const twilioResponse = client.messages
//       //     .create({
//       //         mediaUrl: [`${imageResult.data.data[0].url}`],
//       //         from: 'whatsapp:+593994309557',
//       //         to: `whatsapp:${fromNumber}`
//       //     })
//       //     .then(message => console.log(`Message sent with SID ${message.sid}`))
//       //     .catch(err => res.status(500).send({ error: err }));

//       // res.send(twilioResponse)
//   } else {

//   //End delete
//   // Generate a response using OpenAI's GPT-3
//   const gpt3Response = await getGpt4ResponseStreamed(incomingMessage);
  
//   // Send a response back to Twilio
//   res.setHeader('Content-Type', 'text/xml');
//   res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
//   }
// }
// };
// END VERCEL OPENAI SDK



// ORIGINALL WORKING FUNCTION
// Define the function to generate a response from OpenAi GPT-3
// async function getGpt3Response(prompt) {
//     console.log(prompt);
//     // Check if the message starts with "Luna"
//     // if (!prompt.startsWith("Luna")) {
//     //         // If the message does not start with "Luna", do not respond
//     //         return "";
//     //     }
    
//         // Remove "Luna" from the beginning of the message
//     // const actualPrompt = prompt.replace(/^Luna\s*/i, "");
//     const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-002/completions', {
//         // const response = await axios.post('https://api.openai.com/v1/chat/gpt-3.5-turbo-0301/completions', {

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
//END OF ORIGINAL WORKING FUNCTION
async function getGpt3Response2(prompt) {
    console.log(prompt);
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 60,
      temperature: 0.5,
    });
    
    console.log(response.data.choices);
    return response.data.choices[0].text.trim();
  }

  async function getGpt4Response(prompt) {
    console.log("PROMPT IN GET GPT 4 RESPONSE FUN: ", prompt);
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{role: "user", content: prompt}],
    });
    
    console.log("Response data: ***** ", response);
    // console.log(response.data.choices);
    return response.data.choices[0].message.content;
    //return response.data.choices[0].text.trim();
  }

  function splitMessage(message, limit) {
  var chunks = [];
  while (message.length > 0) {
      var chunk = message.substr(0, limit);
      var lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace !== -1 && message.length > limit) {
          chunk = chunk.substr(0, lastSpace);
      }
      chunks.push(chunk);
      message = message.substr(chunk.length);
  }
  return chunks;
}

async function sendTwilioMessage1600Characters(gpt4Response, toNumber) {
    const chunks = splitMessage(gpt4Response, 1500);
    const responses = [];  // Array to store responses

    console.log("Chunks length: ", chunks.length);
    console.log("Chunks message: ", chunks);
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    for (let i = 0; i < chunks.length; i++) {
        const params = new URLSearchParams({
            From: 'whatsapp:+593994309557',
            To: toNumber,
            Body: chunks[i],
        }).toString();
        const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'),
            },
            body: params
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.log('Failed to send SMS: ', errorMessage);
            throw new Error('Failed to send SMS: ' + errorMessage);
        } else {
            const json = await response.json();
            console.log('Twilio response: ', json);
            responses.push(json);  // Add response to array
        }
    }
    return responses;  // Return array of responses after loop
}

  // async function getGpt4ResponseStreamed(prompt) {
  //   console.log(prompt);
  //   const configuration = new Configuration({
  //     apiKey: process.env.OPENAI_API_KEY,
  //   });
  //   const openai = new OpenAIApi(configuration);
    
  //   const response = await openai.createChatCompletion({
  //     model: "gpt-4",
  //     stream: true,
  //     messages: [{role: "user", content: prompt}],
  //   });
    
  //   const stream = OpenAIStream(response);
  //   console.log("Streaming response: ", StreamingTextResponse(stream));
  //   return new StreamingTextResponse(stream);
  //   //return response.data.choices[0].text.trim();
  // }




//   const completion = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{role: "user", content: "Hello world"}],
//   });
// async function transcribeAudio(mediaUrl) {
//   let cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

//   let job = await cloudConvert.jobs.create({
//       tasks: {
//           'import-my-file': {
//               operation: 'import/url',
//               url: mediaUrl,
//               filename: 'file.oga'
//           },
//           'convert-my-file': {
//               operation: 'convert',
//               input: 'import-my-file',
//               output_format: 'mp3'
//           },
//           'export-my-file': {
//               operation: 'export/url',
//               input: 'convert-my-file'
//           }
//       }
//   });

//   while (job.status !== 'finished') {
//     await new Promise(resolve => setTimeout(resolve, 1000));  // Wait for 1 second
//     job = await cloudConvert.jobs.get(job.id);
// }

// console.log("JOOOOOOB****: ", job);


// //job = await cloudConvert.jobs.get(job.id);
// // Get task by name
// let exportTask = job.tasks.find(task => task.name === 'export-my-file');
// console.log("EXPORT TASK****: ", exportTask);

// // Now the job should be completed, try to get the result
// const mp3FileUrl = exportTask.result.files[0].url;


//   //const mp3FileUrl = job.tasks['export-my-file'].result.files[0].url;

//   // Download the converted MP3 file
//   const response = await axios.get(mp3FileUrl, { responseType: 'stream' });

//   const tempFilePath = '/tmp/converted.mp3';
//   const writer = fs.createWriteStream(tempFilePath);
//   response.data.pipe(writer);
//   await new Promise((resolve, reject) => {
//       writer.on('finish', resolve);
//       writer.on('error', reject);
//   });

//   // Read the MP3 file and send it to OpenAI's transcription API
//   const mp3File = fs.createReadStream(tempFilePath);


//   const formData = new FormData();
//   formData.append('file', mp3File);
//   //try {
//   const transcriptionResponse = await openai.createTranscription(mp3File, 'whisper-1');
// //   if (transcriptionResponse) {
// //     console.log('Transcription:', transcriptionResponse);
// //     return transcriptionResponse;
// //   } else {
// //     console.log('No response from OpenAI API');
// //   }
// // } catch (error) {
// //   console.error('Error during transcription:', error);
// console.log("*******TRANSCRIPTION RESPONSE", transcriptionResponse.data);
// // }

//   // const transcriptionResponse = await axios.post(
//   //     'https://api.openai.com/v1/transcriptions',
//   //     formData,
//   //     {
//   //         headers: {
//   //             'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
//   //             ...formData.getHeaders(),
//   //         },
//   //     }
//   // );

//   // Delete the temporary file
//   fs.unlink(tempFilePath, (err) => {
//       if (err) console.error('Error deleting temporary file:', err);
//   });

//   return transcriptionResponse.data.text;
// }

async function transcribeAudio(mediaUrl) {
  let cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

  let job = await cloudConvert.jobs.create({
      tasks: {
          'import-my-file': {
              operation: 'import/url',
              url: mediaUrl,
              filename: 'file.oga'
          },
          'convert-my-file': {
              operation: 'convert',
              input: 'import-my-file',
              output_format: 'mp3'
          },
          'export-my-file': {
              operation: 'export/url',
              input: 'convert-my-file'
          }
      }
  });

  while (job.status !== 'finished') {
    await new Promise(resolve => setTimeout(resolve, 1000));  // Wait for 1 second
    job = await cloudConvert.jobs.get(job.id);
}

console.log("JOOOOOOB****: ", job);

// Get task by name
let exportTask = job.tasks.find(task => task.name === 'export-my-file');
console.log("EXPORT TASK****: ", exportTask);

// Now the job should be completed, try to get the result
const mp3FileUrl = exportTask.result.files[0].url;


  //const mp3FileUrl = job.tasks['export-my-file'].result.files[0].url;

  // Download the converted MP3 file
const response = await fetch(mp3FileUrl);
const stream = response.body;
  const tempFilePath = '/tmp/converted.mp3';
  const writer = fs.createWriteStream(tempFilePath);
  stream.pipe(writer);
  await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
  });

  // Read the MP3 file and send it to OpenAI's transcription API
  const mp3File = fs.createReadStream(tempFilePath);


  const formData = new FormData();
  formData.append('file', mp3File);
  //try {
  const transcriptionResponse = await openai.createTranscription(mp3File, 'whisper-1');
//   if (transcriptionResponse) {
//     console.log('Transcription:', transcriptionResponse);
//     return transcriptionResponse;
//   } else {
//     console.log('No response from OpenAI API');
//   }
// } catch (error) {
//   console.error('Error during transcription:', error);
console.log("*******TRANSCRIPTION RESPONSE", transcriptionResponse.data);
// }

  // const transcriptionResponse = await axios.post(
  //     'https://api.openai.com/v1/transcriptions',
  //     formData,
  //     {
  //         headers: {
  //             'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
  //             ...formData.getHeaders(),
  //         },
  //     }
  // );

  // Delete the temporary file
  fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
  });

  return transcriptionResponse.data.text;
}