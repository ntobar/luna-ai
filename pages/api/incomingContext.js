const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const twilio = require('twilio');
const fs = require('fs-extra');
const CloudConvert = require('cloudconvert');
const path = require('path');
const db = require('../../db/db');

const userRepository = require('../../db/userRepository');
const conversationRepository = require('../../db/conversationRepository');
const messageRepository = require('../../db/messageRepository');

import { englishWelcomeMessage, spanishWelcomeMessage } from './constants';
import { GPTTokens } from 'gpt-tokens';
// import { encode, decode, encodeChat, isWithinTokenLimit, Tokenizer } from 'gpt-tokenizer/esm/model/gpt-4';
// const { encode, decode, encodeChat, isWithinTokenLimit, Tokenizer } = require('gpt-tokenizer/esm/model/gpt-4');
// const { encode, decode } = require('gpt-3-encoder'); 
// const { encodeChat } = require('gpt-tokenizer');
// import { detect } from 'langdetect';
const langdetect = require('langdetect');

require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


// START MAIN FUNCTION
module.exports = async (req, res) => {

    if (req.method === 'POST') {
        console.log("Received webhook Request, initializing... ");
        // testConnection();
        const incomingMessage = req.body.Body;
        const incomingMediaUrl = req.body.MediaUrl0;
        const fromNumber = req.body.From;
        const profileName = req.body.ProfileName;


        // Database handling
        const whatsappNumber = fromNumber.replace('whatsapp:', '');
        // Check if the user exists
        let existingUser = await userRepository.getUserByWhatsAppNumber(whatsappNumber);


        if (existingUser) {
            // User already exists, update last_seen
            await userRepository.updateLastSeen(existingUser.id);
            await sendResponse(`[ System Notification ] - Existing user: ${profileName} has interacted with Luna!`, 'whatsapp:+18572009432');
            res.status(204).end();
        } else {
            await sendResponse(`[ System Notification ] - New User ${profileName} with phone number ${whatsappNumber} has interacted with Luna!`, 'whatsapp:+18572009432');
            // User doesn't exist, create new user
            const userId = await userRepository.createUser(whatsappNumber, profileName);
            existingUser = { id: userId };
            const language = langdetect.detectOne(incomingMessage);
            let welcomeText;

            if (language) {
                console.log(`[ Incoming Request ] - Request received in language: ${language}`);
                if (language === 'en') {
                    welcomeText = englishWelcomeMessage[0].replace('{profile}', profileName);
                } else if (language === 'es') {
                    welcomeText = spanishWelcomeMessage[0].replace('{profile}', profileName);
                }
            } else {
                welcomeText = englishWelcomeMessage[0].replace('{profile}', profileName);
            }
            res.setHeader('Content-Type', 'text/xml');
            res.send(`<Response><Message>${welcomeText}</Message></Response>`);
        }

        // Commands:
        // !image
        // !vn
        // !commands
        // !tag
        // !createtag veterinario
        // !veterinario determines the type of context it has
        //  Tags, /remember, /important


        // console.log("****** REQ: ", req);
        // console.log("****** REQ BODY: ", req.body);
        console.log(`[ Incoming Request ] Received prompt: ${incomingMessage} from number ${fromNumber}`);

        // Handle voice note
        if (incomingMediaUrl) {
            console.log(`[ Audio Transcription  ] - Request received for media with url ${incomingMediaUrl}`);
            const transcription = await transcribeAudio(incomingMediaUrl);

            //res.setHeader('Content-Type', 'text/xml');
            // res.send(`<Response><Message>Transcription: ${transcription}</Message></Response>`);
            //res.status(204).end();
            await sendResponse(transcription, fromNumber);
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


            // res.setHeader('Content-Type', 'image/png');
            console.log("AFTER setting header for image content type **** ");
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
                    // res.status(200).send({ sid: message.sid });  // send a response
                })
                .catch(err => {
                    console.error(`[ ERROR ][ Image Generation ] - error sending response to twilio client: ${err}`);
                    console.error(`[ ERROR ][ Image Generation ] - error message: ${err.message}`);

                    throw new Error(err.message);
                    // res.status(500).send({ error: err.message });  // send a response
                });
        } else if (incomingMessage.toLowerCase().includes('!reset')) {

            console.log(`[ CHAT RESET ] User has requested chat reset`);

            try {
                const conversationId = await conversationRepository.getConversationId(existingUser.id);
                await conversationRepository.deleteConversation(conversationId);
            } catch (err) {
                console.log(`[ ERROR ][ CHAT RESET ] Error Resetting Chat`);

            }
            res.status(204).end();

        } else {

            const MAX_SUMMARIZATION_ITERATIONS = 5;
            let summarizationCount = 0;

            console.log(`[ Chat Completion ] - Request received with prompt: ${incomingMessage}`);


            let gpt3Response;
            let messageId;
            let conversationId;
            let usageInfo;
            let formattedHistory = [];

            // If we want context, message doesnt have !notag
            if (!incomingMessage.toLowerCase().includes('!notag')) {

                // Get existing conversation or create a new one for the user
                conversationId = await conversationRepository.getConversationId(existingUser.id);
                if (!conversationId) {
                    conversationId = await conversationRepository.createNewConversation(existingUser.id);
                }

                // Format user message for database
                const userMessage = {
                    userId: existingUser.id,
                    conversationId: conversationId,
                    role: 'user',
                    content: incomingMessage,
                    tokens: 0
                }

                // Store user message
                messageId = await messageRepository.storeMessageInTable(userMessage);

                // Fetch conversation history and format it
                let conversationHistory = await messageRepository.getConversationHistory(conversationId);
                formattedHistory = conversationHistory.map(message => ({ role: message.role, content: message.content }));

                console.log(`FORMATTED HISTORY: \n ${formattedHistory}`);
                console.log(`FORMATTED HISTORY1: \n ${JSON.stringify(formattedHistory)}`);

                /**
                 * Get PROMPT tokens (prompt + history)
                 * Used to calculate if the context tokens has not exceeded the limit
                 */
                usageInfo = new GPTTokens({
                    model: 'gpt-4',
                    messages: formattedHistory
                });

                console.table({
                    'Tokens prompt': usageInfo.promptUsedTokens,
                    'Tokens completion': usageInfo.completionUsedTokens,
                    'Tokens total': usageInfo.usedTokens,
                })

                // const usageInfo = new GPTTokens({
                //   model: 'gpt-4',
                //   messages: formattedHistory
                // })
                // let totalConversationTokenCount = await messageRepository.getTotalTokenCount(conversationId);

                // const tokenizer = new Tokenizer({ modelName: 'gpt-4-32k' });

                // let totalContextTokenCount = encodeChat(formattedHistory, "gpt-4-32k");
                // let totalContextTokenCount = encodeChat(formattedHistory, tokenizer);
                // let totalContextTokenCount = encode()

                console.log("TOTAL TOKEN COUNT LINE 194: ", usageInfo.usedTokens);
                // Perform recursive summarization. MAX_TOKENS - 132 (132 is the summarization prompt token count)
                // while (totalConversationTokenCount >= 8000 && summarizationCount < MAX_SUMMARIZATION_ITERATIONS) {
                while (usageInfo.usedTokens >= 7868 && summarizationCount < MAX_SUMMARIZATION_ITERATIONS) {

                    console.log(`[ Chat Completion ] - Conversation is over token limit, at ${usageInfo.usedTokens} tokens. Performing Summarization`);

                    formattedHistory.pop();
                    // Perform your summarization on formattedHistory here.
                    // Be sure to reassign the result back to formattedHistory.
                    formattedHistory = await summarizeHistory(formattedHistory);
                    // Increase the summarization count
                    summarizationCount++;

                    // Re-append the new user message to the summarized history.
                    formattedHistory.push({ role: 'user', content: incomingMessage });
                    console.log(`[ Summarization Loop ] - in summarizationCount: ${summarizationCount}`);
                    console.table(formattedHistory, ["role", "content"]);

                    // formattedHistory = summarizationResult.summarizedHistory;

                    // Recalculate token count after summarization
                    usageInfo = new GPTTokens({
                        model: 'gpt-4',
                        messages: formattedHistory
                    });

                    console.table({
                        'In Summarization loop': true,
                        'Tokens prompt': usageInfo.promptUsedTokens,
                        'Tokens completion': usageInfo.completionUsedTokens,
                        'Tokens total': usageInfo.usedTokens,
                    })


                    await replaceWithSummarizedConversation(existingUser.id, conversationId, formattedHistory)

                    //  TODO: REPLACE ENTIRE CONVERSATION WITH NEW SUMMARY
                }
                gpt3Response = await getGpt4Response(formattedHistory, true);
            }


            console.log("RESPONSE: ", JSON.stringify(gpt3Response));
            const textResponse = gpt3Response.choices[0].message.content;
            const promptTokens = gpt3Response.usage?.prompt_tokens;
            const completionTokens = gpt3Response.usage?.completion_tokens;
            const totalTokens = gpt3Response.usage?.total_tokens;


            console.log(`[ Chat Completion ] - OPENAI response received with ${textResponse.length} characters and ${totalTokens} token usage: ${gpt3Response}`);

            // We want to save messages if it doesnt include !notag
            if (!incomingMessage.toLowerCase().includes('!notag')) {
                // if (messageId) {
                //   await messageRepository.updateMessageTokens(messageId, usageInfo.promptTokens);
                // }
                // Store messages in db
                const aiMessage = {
                    userId: existingUser.id,
                    conversationId: conversationId,
                    role: 'assistant',
                    content: textResponse,
                    tokens: completionTokens
                }

                formattedHistory.push({ role: 'assistant', content: textResponse });


                usageInfo = new GPTTokens({
                    model: 'gpt-4',
                    messages: formattedHistory
                });

                console.table({
                    'After Getting GPT response': true,
                    'Tokens prompt': usageInfo.promptUsedTokens,
                    'Tokens completion': usageInfo.completionUsedTokens,
                    'Tokens total': usageInfo.usedTokens,
                })


                await messageRepository.storeMessageInTable(aiMessage);


                // After each interaction:
                // const conversationTokenCount = await messageRepository.getTotalTokenCount(conversationId);
                await conversationRepository.updateTokenCount(conversationId, usageInfo.usedTokens);
            }
            // res.setHeader('Content-Type', 'text/xml');
            // if (gpt3Response.length < 1500) {
            //   // Send a response back to Twilio
            //   console.log(`[ Chat Completion ] - Message length has less than 1500 characters, sending response`)
            //   res.send(`<Response><Message>${gpt3Response}</Message></Response>`);
            // } else {

            console.log(`[ Chat Completion ] - Handling response message with ${textResponse.length} characters`);
            // res.status(204).end();
            // res.send(`<Response><Message>${welcomeText}</Message></Response>`);

            await sendResponse(textResponse, fromNumber);

            // sendTwilioMessage1600Characters(gpt3Response, fromNumber);
            //}
        }
    }
};

async function summarizeHistory(formattedHistory) {
    // Combine all the conversation history into one text
    const historyText = formattedHistory.reduce((acc, message) => {
        return acc + `${message.role === 'user' ? 'User:' : 'Assistant:'} ${message.content}\n`;
    }, '').trim();  // Ensure no leading or trailing whitespace


    // ${formattedHistory.map(message => `${message.role === 'user' ? 'User:' : 'Assistant:'} ${message.content}`).join('\n')}

    //     const prompt = `
    // I have a conversation with important details that I need to be summarized concisely while preserving the key points and relevant information, specifically, 
    // I want you to please summarize this conversation and return the summarization in the exact format im providing the conversation in. The format should be in 
    // the GPT-4 api format of roles and content:
    // [{ role: 'user/assistant', content: 'message content' }, ...]
    // I want to be able to pass in this summarization
    // exactly as you return it, in the messages key of the api request to openai's GPT api. Here is the conversation:
    // ${historyText}`;

    const prompt = `
Summarize the following conversation in the format: 
"[{ role: 'user/assistant', content: 'message content' }, ...]"
Here's the conversation:
${historyText}`;



    // Create the OpenAI prompt
    // const prompt = `Please summarize the following conversation:\n${historyText}`;

    // Call the OpenAI API with the prompt
    const gptResponse = await getGpt4Response(prompt, false);

    // Extract the summary from the GPT response
    const summary = gptResponse.choices[0].message.content;

    // Convert the summary into the correct format
    // const formattedSummary = {
    //   role: 'assistant',
    //   content: summary
    // };

    // Return the formatted summary
    // return { summarizedHistory: [formattedSummary], tokenCount: gptResponse.usage?.prompt_tokens };
    return summary;
}

async function replaceWithSummarizedConversation(userId, conversationId, summarizedConversation) {
    // Step 1: Delete the entire existing conversation
    await messageRepository.deleteAllMessagesForUser(userId);


    // Step 2: Insert the newly summarized conversation
    for (const message of summarizedConversation) {
        const messageToInsert = {
            userId: userId,  // Assuming you have access to the existingUser from a higher scope
            conversationId: conversationId,
            role: message.role,
            content: message.content,
            // Note: If you're keeping track of tokens per message, you'd calculate and add them here.
        };
        await messageRepository.storeMessageInTable(messageToInsert);
    }
}


async function testConnection() {
    try {
        // Execute a simple query to retrieve data
        const result = await db.query('SELECT * FROM users LIMIT 1');
        console.log('Connection successful:', result);
    } catch (error) {
        console.error('Error connecting to the database:', error);
    } finally {
        // Close the database connection
        db.$pool.end();
    }
}

async function getGpt3Response2(prompt) {
    console.log(prompt);
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const response = await openai.createCompletion({
        model: "gpt-4-32k",
        prompt: prompt,
        max_tokens: 60,
        temperature: 0.5,
    });

    console.log(response.data.choices);
    return response.data.choices[0].text.trim();
}

async function getGpt4Response(prompt, history) {
    console.log("PROMPT **, ", JSON.stringify(prompt));
    try {
        console.log(`[ Chat Completion ] - Sending request to openai api with prompt: ${prompt}`);
        console.log("OPENAI KEY: ", process.env.OPENAI_API_KEY);
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);


        let response;
        if (!history) {
            console.log("IN HISTORY: ******");
            // response = await openai.createChatCompletion({
            //   model: "gpt-4-32k",
            //   messages: [{ role: "user", content: prompt }],
            // });
            response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo-16k",
                messages: [{ role: "user", content: prompt }],
            });
        } else {
            console.log("IN ELSE LINE 325: ");
            response = await openai.createChatCompletion({
                // model: "gpt-3.5-turbo-16k",
                model: "gpt-4",
                messages: prompt,
            });
            // response = await openai.createChatCompletion({
            //   model: "gpt-4-32k",
            //   messages: prompt,
            // });
        }

        console.log(`response  :****  ${response}`);
        console.log(`response data :****  ${JSON.stringify(response.data)}`);
        console.log(`response data choices :****  ${JSON.stringify(response.data.choices)}`);
        console.log(`response data choices message :****  ${JSON.stringify(response.data.choices[0])}`);

        return response.data;
        // return response.data.choices[0].message.content;
    } catch (err) {

        console.error(`[ ERROR ][ Chat Completion ] - Failed to get GPT-4 response, error: ${err}`);
        console.error(`[ ERROR ][ Chat Completion ] - Error message: ${err.message}`);
        return {
            error: 'Sorry, openai GPT failed, not Luna, please try again later.'
        };


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

async function sendTwilioMessage(gpt4Response, toNumber) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        const params = new URLSearchParams({
            From: 'whatsapp:+593994309557',
            To: toNumber,
            Body: gpt4Response,
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
            console.log(`[ Chat Completion ][ Twilio Callback ]: Successfully sent messages to Twilio client, Twilio response: ${JSON.stringify(json)}`);
        }

    } catch (err) {

    }
}

async function sendResponse(gpt4Response, toNumber) {
    try {
        if (gpt4Response.length < 1500) {
            console.log(`[ Chat Completion ][ Twilio Callback ]: Preparing to send response to Twilio Client`);

            await sendTwilioMessage(gpt4Response, toNumber);
        } else {
            const chunks = splitMessage(gpt4Response, 1500);

            console.log(`[ Chat Completion ][ Twilio Callback ]: Split text, preparing to send ${chunks.length} messages to Twilio Client`);

            for (const chunk of chunks) {
                console.log(`Chunk: ${chunk}`);
                await sendTwilioMessage(chunk, toNumber);
            }
            //   for (let i = 0; i < chunks.length; i++) {
            //     console.log(`Chunk ${chunks[i]}: ${chunks[i]}`);
            //     await sendTwilioMessage(chunks[i], toNumber);
            //   }
        }
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

    async function handleTag(tag) {

    }
}