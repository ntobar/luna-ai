const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const twilio = require('twilio');
const fs = require('fs-extra');
const CloudConvert = require('cloudconvert');
const path = require('path');


require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// START MAIN FUNCTION
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const incomingMessage = req.body.Body;
    const incomingMediaUrl = req.body.MediaUrl0;
    const fromNumber = req.body.From;

    console.log(`[ Incoming Request ] Received prompt: ${incomingMessage} from number ${fromNumber}`);

    // Handle voice note
    if (incomingMediaUrl) {
      console.log(`[ Audio Transcription  ] - Request received for media with url ${incomingMediaUrl}`);
      const transcription = await transcribeAudio(incomingMediaUrl);

      res.setHeader('Content-Type', 'text/xml');
      res.send(`<Response><Message>Transcription: ${transcription}</Message></Response>`);
      console.log(`[ Audio Transcription ] - Response sent`);

    } else if (incomingMessage.toLowerCase().includes('image')) {

      console.log(`[ Image Generation ] - Request received`);

      // Set this to the maximum number of tokens you want the model to generate.
      const maxTokens = 512;

      const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      console.log(`[ Image Generation ] - Sending request to OPENAI API`);

      // Generate an image based on the message body
      const imageResult = await openai.createImage({
        prompt: incomingMessage,
        size: "256x256",
      });

      console.log(`[ Image Generation ] - OPENAI response received, image url: ${imageResult.data.data[0].url}`);
      console.log(`[ Image Generation ] - Sending image to Twilio Client`);


      res.setHeader('Content-Type', 'image/png');
      // Send the image URL back to the user
      await client.messages
        .create({
          mediaUrl: [`${imageResult.data.data[0].url}`],
          from: 'whatsapp:+593994309557',
          // to: `whatsapp:${fromNumber}`
          to: fromNumber

        })
        .then(message => {
          console.log(`[ Image Generation ] Message sent with SID ${message.sid}`);
          res.status(200).send({ sid: message.sid });  // send a response
        })
        .catch(err => {
          console.error(`[ ERROR ][ Image Generation ] - error sending response to twilio client: ${err}`);
          console.error(`[ ERROR ][ Image Generation ] - error message: ${err.message}`);

          throw new Error(err.message);
          // res.status(500).send({ error: err.message });  // send a response
        });
    } else {
      //End delete
      // Generate a response using OpenAI's GPT-4
      console.log(`[ Chat Completion ] - Request received with prompt: ${incomingMessage}`);
      const gpt3Response = await getGpt4Response(incomingMessage);

      console.log(`[ Chat Completion ] - OPENAI response received with ${gpt3Response.length} characters: ${gpt3Response}`);

      res.setHeader('Content-Type', 'text/xml');
      if (gpt3Response.length < 1500) {
        // Send a response back to Twilio
        console.log(`[ Chat Completion ] - Message length has less than 1500 characters, sending response`)
        res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
      } else {

        console.log(`[ Chat Completion ] - Message length has more than 1500 characters, splitting message`)
        res.status(204).end();
        sendTwilioMessage1600Characters(gpt3Response, fromNumber);
      }
    }
  }
};

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
  try {
    console.log(`[ Chat Completion ] - Sending request to openai api with prompt: ${prompt}`);
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    // console.log(response.data.choices);
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error(`[ ERROR ][ Chat Completion ] - Failed to get GPT-4 response, error: ${err}`);
    console.error(`[ ERROR ][ Chat Completion ] - Error message: ${err.message}`);

    throw err;
  }
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
  try {
    const chunks = splitMessage(gpt4Response, 1500);
    const responses = [];  // Array to store responses

    console.log(`[ Chat Completion ][ Twilio Callback ]: Split text, preparing to send ${chunks.length} messages to Twilio Client`);
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
        console.log(`[ Chat Completion ][ Twilio Callback ]: Successfully sent messages to Twilio client, Twilio response: ${json}`);
        responses.push(json);  // Add response to array
      }
    }
    return responses;  // Return array of responses after loop
  } catch (err) {
    console.log(`[ ERROR ][ Chat Completion ][ Twilio Callback ]: Failed to send messages to Twilio client, error: ${err}`);
    console.log(`[ ERROR ][ Chat Completion ][ Twilio Callback ]: Error message: ${err.message}`);
    throw err;
  }
}

async function transcribeAudio(mediaUrl) {
  console.log(`[ Audio Transcription  ][ CloudConvert ] - Converting audio file from OGA to MP3 for media with url ${mediaUrl}`);

  try {
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

    let exportTask = job.tasks.find(task => task.name === 'export-my-file');
    const mp3FileUrl = exportTask.result.files[0].url;
    console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully converted audio file from OGA to MP3. Converted file url: ${mp3FileUrl}`);
    console.log(`[ Audio Transcription  ][ CloudConvert ] - Waiting to download converted audio file with url: ${mp3FileUrl}`);


    // Download the converted MP3 file
    const response = await axios.get(mp3FileUrl, { responseType: 'stream' });
    console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully downloaded converted mp3 file`);

    // Ensure the directory exists
    await fs.ensureDir(path.join(__dirname, 'tmp'));

    const tempFilePath = path.join(__dirname, 'tmp', 'converted.mp3');
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Read the MP3 file and send it to OpenAI's transcription API
    const mp3File = fs.createReadStream(tempFilePath);

    console.log(`[ Audio Transcription  ][ CloudConvert ] - Reading and sending file to OPENAI api`);

    const transcriptionResponse = await openai.createTranscription(mp3File, 'whisper-1');
    console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully received response from OPENAI api, response: ${transcriptionResponse.data.text}`);


    // Delete the temporary file
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    return transcriptionResponse.data.text;
  } catch (err) {
    console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Failed to transcribe audio, error: ${err}`);
    console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Error message: ${err.message}`);
    throw err;
  }
}