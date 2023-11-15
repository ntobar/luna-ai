const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const OpenAI = require("openai");
const twilio = require('twilio');
const fs = require('fs-extra');
const CloudConvert = require('cloudconvert');
const path = require('path');
const db = require('../../db/db');
const fetch = require('node-fetch');


const userRepository = require('../../db/userRepository');
const conversationRepository = require('../../db/conversationRepository');
const messageRepository = require('../../db/messageRepository');

import { json } from 'body-parser';
import { englishWelcomeMessage, spanishWelcomeMessage, openaiErrorMessage, errorMessage } from './constants';
import { GPTTokens } from 'gpt-tokens';
import { assert } from 'console';
import { ConversationContextImpl } from 'twilio/lib/rest/conversations/v1/conversation';
// import { encode, decode, encodeChat, isWithinTokenLimit, Tokenizer } from 'gpt-tokenizer/esm/model/gpt-4';
// const { encode, decode, encodeChat, isWithinTokenLimit, Tokenizer } = require('gpt-tokenizer/esm/model/gpt-4');
// const { encode, decode } = require('gpt-3-encoder'); 
// const { encodeChat } = require('gpt-tokenizer');
// import { detect } from 'langdetect';
const langdetect = require('langdetect');

require('dotenv').config();

// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// const openaiAssistant = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//   });

// const openaiAssistant = new OpenAI()
// const visionOpenAi = new OpenAI()


// START MAIN FUNCTION
module.exports = async (req, res) => {

    if (req.method === 'POST') {
        // console.log("REQUEST: ", req);
        console.log("Received webhook Request, initializing... ");
        // testConnection();

        console.log(`${JSON.stringify(req.body)}`)
        //change to const
        let incomingMessage = req.body.Body;
        let incomingMediaUrl = req.body.MediaUrl0;
        let incomingMediaContentType = req.body.MediaContentType0;
        let fromNumber = req.body.From;
        const profileName = req.body.ProfileName;

        // if (!incomingMediaContentType) {
        //     incomingMessage = null;
        // }

        console.table({
            'User: ': profileName,
            'Incoming Message ': incomingMessage,
            'Incoming Media ': true,
            'Incoming Media Type ': incomingMediaContentType,
        })


        // DELETE!!!
        // incomingMessage = "cual es el boxeador mas famoso del mundo?";
        // incomingMediaUrl = "https://api.twilio.com/2010-04-01/Accounts/AC6d3289354e8e27b6711e450b3e055d40/Messages/MM23477af3e06d300b21b1cbf15436f80c/Media/MEd08facf75fecb3e33f214b2e68335e6e";
        // incomingMediaUrl = "https://api.twilio.com/2010-04-01/Accounts/AC6d3289354e8e27b6711e450b3e055d40/Messages/MM91c99ed67e54d9b9f93cb885f8747245/Media/MEcd4a38c3191c9cda5ba32f4dc4b8b0a"

        // incomingMediaUrl = "https://cdn.britannica.com/78/232778-050-D3701AB1/English-bulldog-dog.jpg";
        // incomingMediaUrl = "https://eu-central.storage.cloudconvert.com/tasks/dd2d63fb-61f4-4fe0-a540-895e61ba6ccd/file.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=cloudconvert-production%2F20231109%2Ffra%2Fs3%2Faws4_request&X-Amz-Date=20231109T225648Z&X-Amz-Expires=86400&X-Amz-Signature=44be6dd39bd28a6fab7d26da71d36401a13b6826427ec08031dbe779b75b11d3&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22file.mp3%22&response-content-type=audio%2Fmpeg&x-id=GetObject";
        // incomingMediaUrl = "https://api.twilio.com/2010-04-01/Accounts/AC6d3289354e8e27b6711e450b3e055d40/Messages/MMb2cf1f65ac49fdc87927858ca2aa3693/Media/ME2b93af76c6acf39c810074f7a90056be";

        // incomingMediaUrl = " https://api.twilio.com/2010-04-01/Accounts/AC6d3289354e8e27b6711e450b3e055d40/Messages/MMd5687b2d0544da6cdd01144c5ccf13a1/Media/MEe8af16ec017ed21775d1069dc32c8bf9";
        // incomingMessage = "What is this picture?"
        // fromNumber = 'whatsapp:+18572009432'

        // Database handling
        const whatsappNumber = fromNumber.replace('whatsapp:', '');
        // const whatsappNumber = '+18572009432';


        // Check if the user exists
        let existingUser = await userRepository.getUserByWhatsAppNumber(whatsappNumber);


        if (existingUser) {
            // User already exists, update last_seen
            await userRepository.updateLastSeen(existingUser.id);
            if (incomingMessage) {
                await sendResponse(`[ System Notification ] - Existing user: ${profileName} has interacted with Luna! Prompt: \n ${incomingMessage}`, 'whatsapp:+18572009432');
            } else {
                await sendResponse(`[ System Notification ] - Existing user: ${profileName} has interacted with Luna!`, 'whatsapp:+18572009432');
            }
            res.status(204).end();
        } else {
            // User doesn't exist, create new user
            const userId = await userRepository.createUser(whatsappNumber, profileName);
            existingUser = { id: userId };
            let language;
            if (!incomingMediaUrl) {
                language = langdetect.detectOne(incomingMessage);
            }
            let welcomeText = englishWelcomeMessage[0].replace('{profile}', profileName ? profileName : '');

            if (language && language != undefined) {
                console.log(`[ Incoming Request ] - Request received in language: ${language}`);
                if (language === 'en') {
                    welcomeText = englishWelcomeMessage[0].replace('{profile}', profileName ? profileName : '');
                } else if (language === 'es') {
                    welcomeText = spanishWelcomeMessage[0].replace('{profile}', profileName ? profileName : '');
                }

                if (incomingMessage) {
                    await sendResponse(`[ System Notification ] - New User ${profileName} with phone number ${whatsappNumber} has interacted with Luna! \n Welcome Text: ${welcomeText} \n Prompt: ${incomingMessage}`, 'whatsapp:+18572009432');
                } else {
                    await sendResponse(`[ System Notification ] - New User ${profileName} with phone number ${whatsappNumber} has interacted with Luna! \n Welcome Text: ${welcomeText} \n Prompt: ${incomingMessage}`, 'whatsapp:+18572009432');

                }
                res.setHeader('Content-Type', 'text/xml');
                res.send(`<Response><Message>${welcomeText}</Message></Response>`);
            }
        }

        // if (incomingMediaContentType == "audio/ogg") {

        //     incomingMediaUrl = await convertAudioFile(incomingMediaUrl);

        // }

        // incomingMediaContentType = "image/jpeg";
        // incomingMediaContentType = "audio/ogg";
        // incomingMessage = "";


        let messageResponse;
        try {
            messageResponse = await handleMessage(existingUser.id, incomingMessage, incomingMediaUrl, incomingMediaContentType, profileName);
        } catch (err) {
            console.log(`[ ERROR ][ POST REQUEST ] - ERROR handling message, going to backup api`);
            // await sendTwilioMessage(errorMessage, fromNumber)
        }
        // console.log("MESSAGE RESPONSE: ", messageResponse.content[0].text.value);
        console.log("MESSAGE RESPONSE: ", messageResponse);


        if (messageResponse) {
            if (messageResponse.type == "image") {
                const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

                await client.messages
                    .create({
                        mediaUrl: [`${messageResponse.content}`],
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
            } else if (messageResponse.type == "text") {
                const response = await sendResponse(messageResponse.content, fromNumber);
                return response;
            }

        } else {
            try {



                // return;


                // console.log("MESSAGE RESPONSE CONTENT: ", messageResponse.content[0]);

                // // const imageUrl = lastMessageForRun.content
                // console.log("MESSAGE RESPONSE CONTENT: ", messageResponse.content[0].text);

                // const messages = messageResponse.data;
                // // console.log("$$$MESSAGES: ", messages);
                // let responseToUser = '';

                // for (const message of messages) {
                //     console.log("$$ MESSAGE CONTENT: ", message.content[0]);
                // }
                // // Find the assistant's response to the specific question
                // for (const message of messages) {
                //     if (message.role === 'assistant') {
                //         // Assuming each message.content is an array with a single object containing the type and actual text
                //         const assistantMessageContent = message.content[0]; // Access the first (or only) item in content
                //         if (assistantMessageContent.type === 'text') {
                //             responseToUser = assistantMessageContent.text.value; // Extract the text answer
                //             break; // Assuming you only need the first assistant's message that answers the question
                //         }
                //     }
                // }


                // console.log(`##### RESPONSE TO USER: ${responseToUser}`);
                // await sendResponse(responseToUser, fromNumber);


                // const response = await sendResponse(messageResponse, fromNumber);
                // return response;




                console.log(`[ Incoming Request ] Received prompt: ${incomingMessage} from number ${fromNumber}`);


                // Handle media
                if (incomingMediaUrl) {

                    // Handle voice note
                    if (incomingMediaContentType == "audio/ogg") {
                        console.log(`[ Audio Transcription  ] - Request received for media with url ${incomingMediaUrl}`);

                        const transcription = await transcribeAudio(incomingMediaUrl);

                        await sendResponse(transcription, fromNumber);
                        console.log(`[ Audio Transcription ] - Response sent`);

                        // Handl image
                    } else if (incomingMediaContentType == "image/jpeg" && incomingMessage) {
                        console.log(`[ VISION API ] - Request received for media with url`);

                        const visionResponse = await visionApi(incomingMediaUrl, incomingMessage);
                        await sendResponse(visionResponse, fromNumber);
                        console.log(`[ VISION API ] - Response sent`);

                    }


                } else if (incomingMessage.toLowerCase().includes('image')) {

                    console.log(`[ Image Generation ] - Request received`);

                    // Set this to the maximum number of tokens you want the model to generate.
                    const maxTokens = 512;

                    const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

                    console.log(`[ Image Generation ] - Sending request to OPENAI API`);

                    let imageResult;
                    if (incomingMessage.toLowerCase().includes('hd')) {

                        imageResult = await generateImage(incomingMessage, true);
                        // imageResult = await openai.createImage({
                        //     model: "dall-e-3",
                        //     prompt: incomingMessage,
                        //     size: "1024x1024",
                        //     quality: "hd"
                        // });
                    } else {


                        imageResult = await generateImage(incomingMessage, false);

                        // imageResult = await openai.createImage({
                        //     model: "dall-e-3",
                        //     prompt: incomingMessage,
                        //     size: "1024x1024",
                        // });
                    }

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

                        // console.log(`FORMATTED HISTORY: \n ${formattedHistory}`);
                        // console.log(`FORMATTED HISTORY1: \n ${JSON.stringify(formattedHistory)}`);

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


                        console.log("TOTAL TOKEN COUNT LINE 194: ", usageInfo.usedTokens);
                        gpt3Response = await getGpt4Response(formattedHistory, true);
                    }


                    console.log("RESPONSE: ", JSON.stringify(gpt3Response));
                    let textResponse;
                    let promptTokens;
                    let completionTokens;
                    let totalTokens;
                    let error = false;

                    try {
                        textResponse = gpt3Response.choices[0].message.content;
                        promptTokens = gpt3Response.usage?.prompt_tokens;
                        completionTokens = gpt3Response.usage?.completion_tokens;
                        totalTokens = gpt3Response.usage?.total_tokens;
                    } catch (err) {
                        error = true;
                        textResponse = gpt3Response
                    }


                    if (!error) {
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

                    }
                    await sendResponse(textResponse, fromNumber);

                    // sendTwilioMessage1600Characters(gpt3Response, fromNumber);
                    //}
                }
            } catch (err) {
                console.log(`[ ERROR ][ BACKUP API FAILED ] - Backup api failed, sending failed response to user`);
                await sendTwilioMessage(errorMessage, fromNumber)

            }

        }


    }


};


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
    // console.log("PROMPT **, ", JSON.stringify(prompt));
    try {
        // TODO: Uncomment!
        // console.log(`[ Chat Completion ] - Sending request to openai api with prompt: ${prompt}`);
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
                // model: "gpt-3.5-turbo-16k",
                // model: "gpt-4-1106-preview",
                model: "gpt-3.5",

                messages: [{ role: "user", content: prompt }],
            });
        } else {
            console.log("IN ELSE LINE 325: ");
            response = await openai.createChatCompletion({
                // model: "gpt-3.5-turbo-16k",
                model: "gpt-3.5",
                // model: "gpt-4",
                messages: prompt,
            });
            //  ANOther idea is to summarize prompt before it reaches 8k
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
        throw err;
        // return `🚫 Oops! It seems there's a hiccup with the OpenAI GPT service right now. Luna is all good, but we rely on that service to handle some tasks. Please give it a moment and try again later. We apologize for any inconvenience and appreciate your patience!`
        return 'We apologize, the openai API is unresponsive, not Luna, please try again later.'
        return {
            error: 'Sorry, the openai GPT API failed, not Luna, please try again later.'
        };
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

        console.log(`[ ERRROR ][ Chat Completion ][ Twilio Callback ]: Failed to send messages to Twilio client, error: ${err}`);


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

async function generateImage(textPrompt, isHd) {

    try {
        console.log("GENERATE IMAGE PROMPT: ", textPrompt);
        let imageResult;
        if (isHd) {

            // imageResult = await openai.createImage({
            //     model: "dall-e-3",
            //     prompt: prompt,
            //     size: "1024x1024",
            //     quality: "hd"
            // });
            imageResult = await openai.images.generate({
                model: "dall-e-3",
                prompt: textPrompt,
                size: "1024x1024",
                quality: "hd"
            });

        } else {

            // imageResult = await openai.createImage({
            //     model: "dall-e-3",
            //     prompt: prompt,
            //     size: "1024x1024",
            // });
            imageResult = await openai.images.generate({
                model: "dall-e-3",
                prompt: textPrompt,
                size: "1024x1024",
            });
        }

        return imageResult
    } catch (err) {

        console.log(`[ ERROR ][ Image Generation ]- Failed to generate image, error: ${err}`);
        throw err;
    }
}

async function visionApi(mediaUrl, prompt, mediaType) {

    console.log(`[ VISION API ]: Sending media url to OPENAI vision api with prompt: ${prompt}`);

    try {
        // const response = await visionOpenAi.chat.completions.create({
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: mediaUrl
                        },
                    ],
                },
            ],
            max_tokens: 500,
        });

        // console.log("VISION RESPONSE: ", response);
        console.log("VISION RESPONSE CHOICES: ", JSON.stringify(response.choices));
        console.log("VISION RESPONSE CHOICES: ", JSON.stringify(response.choices[0].message.content));


        return response.choices[0].message.content;

    } catch (err) {
        console.log(`[ ERROR ][ VISION API ]: Error message: ${err.message}`);
        throw err;
    }


}

async function convertAudioFile(mediaUrl) {
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

        console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully created job ${job}`);



        while (job.status !== 'finished') {
            await new Promise(resolve => setTimeout(resolve, 1000));  // Wait for 1 second
            job = await cloudConvert.jobs.get(job.id);
        }

        console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully finished job ${job}`);


        let exportTask = job.tasks.find(task => task.name === 'export-my-file');
        const mp3FileUrl = exportTask.result.files[0].url;

        console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully converted audio file from OGA to MP3. Converted file url: ${mp3FileUrl}`);
        console.log(`[ Audio Transcription  ][ CloudConvert ] - Waiting to download converted audio file with url: ${mp3FileUrl}`);


        // Download the converted MP3 file
        // const response = await axios.get(mp3FileUrl, { responseType: 'stream' });

        return mp3FileUrl;
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
        // const mp3File = fs.createReadStream(tempFilePath);
        return tempFilePath;
        // return {
        //     mediaUrl: mp3File,
        //     tempFilePath: tempFilePath
        // }

        console.log(`[ Audio Transcription  ][ CloudConvert ] - Reading and sending file to OPENAI api`);
    } catch (err) {
        console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Error converting the file ${err}`);
        throw err;
    }
}

async function preProcessAudioFile(incomingMediaUrl) {
    const response = await axios.get(incomingMediaUrl, { responseType: 'stream' });
    console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully downloaded converted mp3 file`);

    // Ensure the directory exists
    await fs.ensureDir(path.join(__dirname, 'tmp'));

    const tempFilePath = path.join(__dirname, 'tmp', 'converted.mp3');
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve(tempFilePath));
        writer.on('error', reject);
    });


}

// async function transcribeAudio(incomingMediaUrl) {

//     console.log(`[ Audio Transcription  ][ OPENAI ] - Calling the openai Whisper-1 api for media with url: ${incomingMediaUrl}`);



//     try {


//         const transcriptionResponse = await openai.audio.transcriptions.create({
//             file: fs.createReadStream(incomingMediaUrl),
//             model: 'whisper-1'
//         });
//         console.log("TRANSCRIPTION TEXT: ", transcriptionResponse.text);
//         console.log(`[ Audio Transcription  ][ OPENAI ] - Successfully received response from OPENAI api, response: ${transcriptionResponse.text}`);


//         // Delete the temporary file
//         fs.unlink(tempFilePath, (err) => {
//             if (err) console.error('Error deleting temporary file:', err);
//         });

//         return transcriptionResponse.text;
//     } catch (err) {
//         console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Failed to transcribe audio, error: ${err}`);
//         console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Error message: ${err.message}`);
//         throw err;

//     }

// }

// async function transcribeAudio(mediaUrl) {
//     console.log(`[ Audio Transcription  ][ CloudConvert ] - Converting audio file from OGA to MP3 for media with url ${mediaUrl}`);

//     try {
//         let cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

//         let job = await cloudConvert.jobs.create({
//             tasks: {
//                 'import-my-file': {
//                     operation: 'import/url',
//                     url: mediaUrl,
//                     filename: 'file.oga'
//                 },
//                 'convert-my-file': {
//                     operation: 'convert',
//                     input: 'import-my-file',
//                     output_format: 'mp3'
//                 },
//                 'export-my-file': {
//                     operation: 'export/url',
//                     input: 'convert-my-file'
//                 }
//             }
//         });

//         while (job.status !== 'finished') {
//             await new Promise(resolve => setTimeout(resolve, 1000));  // Wait for 1 second
//             job = await cloudConvert.jobs.get(job.id);
//         }

//         console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully completed job: ${job.id}`);

//         let exportTask = job.tasks.find(task => task.name === 'export-my-file');
//         const mp3FileUrl = exportTask.result.files[0].url;
//         console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully converted audio file from OGA to MP3. Converted file url: ${mp3FileUrl}`);
//         console.log(`[ Audio Transcription  ][ CloudConvert ] - Waiting to download converted audio file with url: ${mp3FileUrl}`);


//         // Download the converted MP3 file
//         const response = await axios.get(mp3FileUrl, { responseType: 'stream' });
//         console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully downloaded converted mp3 file`);

//         // Ensure the directory exists
//         await fs.ensureDir(path.join(__dirname, 'tmp'));

//         const tempFilePath = path.join(__dirname, 'tmp', 'converted.mp3');
//         const writer = fs.createWriteStream(tempFilePath);

//         response.data.pipe(writer);

//         await new Promise((resolve, reject) => {
//             writer.on('finish', resolve);
//             writer.on('error', reject);
//         });

//         // Read the MP3 file and send it to OpenAI's transcription API
//         const mp3File = fs.createReadStream(tempFilePath);

//         console.log(`[ Audio Transcription  ][ CloudConvert ] - Reading and sending file to OPENAI api`);


//         const transcriptionResponse = await openai.audio.transcriptions.create({
//             file: fs.createReadStream(mp3File),
//             model: 'whisper-1'
//         });
//         console.log(`[ Audio Transcription  ][ CloudConvert ] - Successfully received response from OPENAI api, response: ${transcriptionResponse.data.text}`);


//         // Delete the temporary file
//         fs.unlink(tempFilePath, (err) => {
//             if (err) console.error('Error deleting temporary file:', err);
//         });

//         return transcriptionResponse.text;
//     } catch (err) {
//         console.log("ERRORL ", err);
//         console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Failed to transcribe audio, error: ${err}`);
//         console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Error message: ${err.message}`);
//         throw err;
//     }

//     async function handleTag(tag) {

//     }
// }


async function transcribeAudio(incomingMediaUrl, mediaType) {

    console.log(`[ Audio Transcription  ][ OPENAI ] - Calling the openai Whisper-1 api for media with url: ${incomingMediaUrl}`);



    try {

        const response = await axios.get(incomingMediaUrl, { responseType: 'stream' });
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

        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1'
        });
        console.log("TRANSCRIPTION TEXT: ", transcriptionResponse.text);
        console.log(`[ Audio Transcription  ][ OPENAI ] - Successfully received response from OPENAI api, response: ${transcriptionResponse.text}`);


        // Delete the temporary file
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
        });

        return transcriptionResponse.text;
    } catch (err) {
        console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Failed to transcribe audio, error: ${err}`);
        console.log(`[ ERROR ][ Audio Transcription  ][ CloudConvert ] - Error message: ${err.message}`);
        throw err;

    }

}

async function setupAssistant() {
    console.log(`[ Assistants API ][ Assistant Setup ] - Setting up new assistant...`);
    try {
        const assistant = await openai.beta.assistants.create({
            // model: "gpt-4-1106-preview", // Replace with the correct model you are using
            model: "gpt-3.5-turbo-1106", // Replace with the correct model you are using
            instructions: "This assistant can handle free-form text questions, transcribe audio, generate images, and use image-based prompts. It will determine which function to call based on user input. Only ONE function should be called per interaction. Treat all api.twilio.com urls as media that will either be an audio or an image. If a media url is provided, then its guaranteed that an action is required. For media URLs, distinguish between images and audio files. If the URL ends with a .jpeg extension or is from 'api.twilio.com', treat it as an image for analysis using the vision API. If the URL is from 'cloud convert', treat it as an audio file for transcription ",
            tools: [
                {
                    type: "function",
                    function: {
                        name: "transcribeAudio",
                        description: "Transcribe an audio from a given URL. The media url sent will be a url from twilio.",
                        parameters: {
                            type: "object",
                            properties: {
                                // mediaUrl: { type: "string", description: "URL of the audio file to transcribe" },
                                incomingMediaUrl: { type: "string", description: "The twilio audio file Media url to transcribe, its required. The incomingMediaUrl will be from api.twilio.com, and you should treat is as an audio file" },
                                mediaType: { type: "string", description: "The media type for the twilio url audio. It will be audio/ogg" }

                            },
                            required: ["incomingMediaUrl", "mediaType"]

                            // required: ["mediaUrl", "tempFilePath"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "generateImage",
                        description: "Generate an image based on a prompt",
                        parameters: {
                            type: "object",
                            properties: {
                                textPrompt: { type: "string", description: "The prompt for the image to be generated. This function should NOT be called if a media url is provided" },
                                isHd: { type: "boolean", description: "Whether to generate the image in HD" }
                            },
                            required: ["textPrompt"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "visionApi",
                        description: "Call the visionApi function to respond to the user when they send a twilio media url and a text prompt.",
                        parameters: {
                            type: "object",
                            properties: {
                                mediaUrl: { type: "string", description: "The api.twilio.com Media URL of the image, and its required. The mediaUrl will be from api.twilio.com, and you should treat is as a jpeg image." },
                                prompt: { type: "string", description: "The prompt for the vision API, and its required" },
                                mediaType: { type: "string", description: "The media type for the Twilio media url picture" }
                            },
                            required: ["mediaUrl", "prompt", "mediaType"]
                        }
                    }
                }
                // Add more functions as needed
            ]
        });

        console.log(`[ Assistants API ][ Assistant Setup ] - Successfully set up new assistant with id: ${assistant.id}`);


        return assistant;
    } catch (err) {
        console.log(`[ ERROR ][ Assistants API ][ Assistant Setup ] - Error setting up new assistant. Error: ${err}`);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}

async function setupSpecializedAssistant(mediaContentType) {
    try {
    let assistant;
    if (mediaContentType) {
        if (mediaContentType == "image/jpeg") {
            console.log(`[ Assistants API ][ Setup Assistant ] - Image Media url found, creating assistant for image/jpeg`);

            assistant = await openai.beta.assistants.create({
                // model: "gpt-4-1106-preview", // Replace with the correct model you are using
                model: "gpt-3.5-turbo-1106", // Replace with the correct model you are using
                instructions: "This assistant can handle free-form text questions, transcribe audio, generate images, and use image-based prompts. It will determine which function to call based on user input. Only ONE function should be called per interaction. Treat all api.twilio.com urls as media that will either be an audio or an image. If a media url is provided, then its guaranteed that an action is required. For media URLs, distinguish between images and audio files. If the URL ends with a .jpeg extension or is from 'api.twilio.com', treat it as an image for analysis using the vision API. If the URL is from 'cloud convert', treat it as an audio file for transcription ",
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "visionApi",
                            description: "Call the visionApi function to respond to the user when they send a twilio media url and a text prompt.",
                            parameters: {
                                type: "object",
                                properties: {
                                    mediaUrl: { type: "string", description: "The api.twilio.com Media URL of the image, and its required. The mediaUrl will be from api.twilio.com, and you should treat is as a jpeg image." },
                                    prompt: { type: "string", description: "The prompt for the vision API, and its required" },
                                    mediaType: { type: "string", description: "The media type for the Twilio media url picture" }
                                },
                                required: ["mediaUrl", "prompt", "mediaType"]
                            }
                        }
                    }
                ]
            });
        } else {
            console.log(`[ Assistants API ][ Setup Assistant ] - Image Media url found, creating assistant for audio/ogg`);

            assistant = await openai.beta.assistants.create({
                // model: "gpt-4-1106-preview", // Replace with the correct model you are using
                model: "gpt-3.5-turbo-1106", // Replace with the correct model you are using
                instructions: "This assistant can handle free-form text questions, transcribe audio, generate images, and use image-based prompts. It will determine which function to call based on user input. Only ONE function should be called per interaction. Treat all api.twilio.com urls as media that will either be an audio or an image. If a media url is provided, then its guaranteed that an action is required. For media URLs, distinguish between images and audio files. If the URL ends with a .jpeg extension or is from 'api.twilio.com', treat it as an image for analysis using the vision API. If the URL is from 'cloud convert', treat it as an audio file for transcription ",
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "transcribeAudio",
                            description: "Transcribe an audio from a given URL. The media url sent will be a url from twilio.",
                            parameters: {
                                type: "object",
                                properties: {
                                    // mediaUrl: { type: "string", description: "URL of the audio file to transcribe" },
                                    incomingMediaUrl: { type: "string", description: "The twilio audio file Media url to transcribe, its required. The incomingMediaUrl will be from api.twilio.com, and you should treat is as an audio file" },
                                    mediaType: { type: "string", description: "The media type for the twilio url audio. It will be audio/ogg" }
    
                                },
                                required: ["incomingMediaUrl", "mediaType"]
    
                                // required: ["mediaUrl", "tempFilePath"]
                            }
                        }
                    }
                ]
            });
        }
    } else {

        assistant = await openai.beta.assistants.create({
            // model: "gpt-4-1106-preview", // Replace with the correct model you are using
            model: "gpt-3.5-turbo-1106", // Replace with the correct model you are using
            instructions: "This assistant can handle free-form text questions, transcribe audio, generate images, and use image-based prompts. It will determine which function to call based on user input. Only ONE function should be called per interaction. Treat all api.twilio.com urls as media that will either be an audio or an image. If a media url is provided, then its guaranteed that an action is required. For media URLs, distinguish between images and audio files. If the URL ends with a .jpeg extension or is from 'api.twilio.com', treat it as an image for analysis using the vision API. If the URL is from 'cloud convert', treat it as an audio file for transcription ",
            tools: [
                {
                    type: "function",
                    function: {
                        name: "generateImage",
                        description: "Generate an image based on a prompt",
                        parameters: {
                            type: "object",
                            properties: {
                                textPrompt: { type: "string", description: "The prompt for the image to be generated. This function should NOT be called if a media url is provided" },
                                isHd: { type: "boolean", description: "Whether to generate the image in HD" }
                            },
                            required: ["textPrompt"]
                        }
                    }
                }
            ]
        });
        
    }

    console.log(`[ Assistants API ][ Setup Specialized Assistant ] - Successfully created new Assistant with id: ${assistant.id}`);
    return assistant;
} catch(err) {
    console.log(`[ ERROR ][ Assistants API ][ Setup Specialized Assistant ] - Failed to create new Assistant, error: ${err}}`);
    throw new AssistantResponseError(openaiErrorMessage);
}

}

async function getOrCreateThread(userId) {
    try {
        // Check if there's an existing thread ID for the given user in the storage
        let threadId = await getThreadFromStorage(userId);


        // If a thread ID does not exist, create a new thread
        if (!threadId) {
            console.log(`[ Assistants API ][ Create Thread ] - Creating a new thread for user with id ${userId}`);

            const thread = await openai.beta.threads.create();
            threadId = thread.id;

            // Save the new thread ID with the user's information in the storage
            await saveThreadToStorage(userId, threadId);
        }
        console.log(`[ Assistants API ][ Create Thread ] - Fetched existing thread for user with id ${userId}`);


        return threadId;
    } catch (err) {
        console.log(`[ ERROR ][ Assistants API ][ Create Thread ] - Error fetching/creating thread for user with id ${userId}, error: ${err}`);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}

async function getThreadFromStorage(userId) {
    const threadId = await userRepository.getUserThreadId(userId);
    return threadId;
}

async function saveThreadToStorage(userId, threadId) {
    await userRepository.updateUserThreadId(userId, threadId);
}

async function createThread() {
    // Create a Thread for the user conversation
    const thread = await openai.beta.threads.create();
    console.log(`[ Assistants API ][ Create Thread ] - Successfully created new thread: ${thread}`);
    return thread;
}

async function addMessageToThread(threadId, userMessage, mediaUrl) {
    console.log("[ Assistants API ][ Message Thread ] - Adding message to thread...");

    try {
        // If there's a user message, send it as text
        if (userMessage) {

            if(!mediaUrl) {
            await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: userMessage // content should be a string
            });
        } else {
            await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: userMessage + " "+ mediaUrl // content should be a string
            });
        }
        
        } else {

            await openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: "Please transcribe this audio: " + mediaUrl, // assuming this is a string URL to the image

                // content: `image: ${mediaUrl}`, // assuming this is a string URL to the image
            });

        }

        // // If there's a media URL, send it in a separate message
        // if (mediaUrl) {
        //     if(!userMessage) {
        //         await openai.beta.threads.messages.create(threadId, {
        //             role: "user",
        //             content: "Please transcribe this audio", // assuming this is a string URL to the image
    
        //             // content: `image: ${mediaUrl}`, // assuming this is a string URL to the image
        //         });

        //     } else {
        //     await openai.beta.threads.messages.create(threadId, {
        //         role: "user",
        //         content: "", // assuming this is a string URL to the image

        //         // content: `image: ${mediaUrl}`, // assuming this is a string URL to the image
        //     });
        // }
        // }

        console.log("[ Assistants API ][ Message Thread ] - Succesfully added message to thread...");

    } catch (err) {
        console.error(`[ ERROR ][ Assistants API ][ Message Thread ] - Error adding message to thread: ${err.message}`);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}


// async function addMessageToThread(threadId, userMessage, mediaUrl) {
//     console.log("[ Assistants API ][ Message Thread ] - Adding message to thread...");

//     try {
//         // If there's a user message, send it as text
//         if (userMessage) {
//             await openai.beta.threads.messages.create(threadId, {
//                 role: "user",
//                 content: userMessage // content should be a string
//             });
//         }

//         // If there's a media URL, send it in a separate message
//         if (mediaUrl) {
//             await openai.beta.threads.messages.create(threadId, {
//                 role: "user",
//                 content: mediaUrl, // assuming this is a string URL to the image

//                 // content: `image: ${mediaUrl}`, // assuming this is a string URL to the image
//             });
//         }

//         console.log("[ Assistants API ][ Message Thread ] - Succesfully added message to thread...");

//     } catch (err) {
//         console.error(`[ ERROR ][ Assistants API ][ Message Thread ] - Error adding message to thread: ${err.message}`);
//         throw new AssistantResponseError(openaiErrorMessage);
//     }
// }


async function createRun(threadId, assistantId, mediaUrl, mediaContentType, profileName) {
    console.log("[ Assistants API ][ Create Run ] - Creating run for thread id: ", threadId);

    try {

        let run;
        if (mediaUrl) {

            if (mediaContentType == "image/jpeg") {
                console.log(`[ Assistants API ][ Create Run ] - Image Media url found, creating run with media instructions`);


                // Create a Run to get the Assistant's response
                run = await openai.beta.threads.runs.create(threadId, {
                    assistant_id: assistantId,
                    instructions: profileName ? `Address the user as ${profileName}. You need to process the incoming media as an image for analysis` : "You need to process the incoming media as an image for analysis"
                    // instructions: `Process the input. If the URL is from 'api.twilio.com', treat it as an image for analysis.`

                    // instructions: additionalInstructions,
                });
            } else {
                console.log(`[ Assistants API ][ Create Run ] - Audio url found, creating run with media instructions`);

                run = await openai.beta.threads.runs.create(threadId, {
                    assistant_id: assistantId,
                    instructions: profileName ? `Address the user as ${profileName}. You need to process the incoming media as an audio for analysis` : "You need to process the incoming media as an audio for analysis"

                    // instructions: `Process the input. If the URL is from 'cloud convert', treat it as an audio for analysis and this run should only take care of the audio, not any images.`


                });
            }
        } else {
            run = await openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId,
                instructions: profileName ? `Address the user as ${profileName}. You need to process the text prompt and decide if an image needs to be generated or just a text response` : "You need to process the text prompt and decide if an image needs to be generated or just a text response"
            });
        }

        console.log("[ Assistants API ][ Create Run ] - Successfully created run for thread id: ", threadId);
        return run;
    } catch (err) {
        console.log("[ ERROR ][ Assistants API ][ Create Run ] - Error creating run for thread id: ", threadId);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}


async function checkRunStatus(threadId, runId) {
    try {
        // Periodically check the status of the Run
        const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log(`[ Assistants API ][ Run Status ] - Current Run Status --> ${runStatus.status}`);
        if (runStatus.status == "failed") {
            console.log("[ ERROR ][ Assistants API ][ Check Run Status ] - Run status FAILED, reason: ", runStatus.last_error);
            return runStatus.last_error;
        }
        return runStatus;
    } catch (err) {
        console.log("[ ERROR ][ Assistants API ][ Check Run Status ] - Run status retrieval FAILED, reason: ", err);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}

async function getAssistantMessages(threadId) {
    try {
        // Retrieve messages added by the Assistant to the Thread
        const messages = await openai.beta.threads.messages.list(threadId);
        return messages;
    } catch (err) {
        console.log("[ ERROR ][ Assistants API ][ Get Assistant Messages ] - Error retrieving assistant messages: ", err);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}

// async function handleMessage(userId, userMessage, mediaUrl) {
//     // Set up the Assistant
//     const assistant = await setupAssistant();

//     // Get or create a thread for the user
//     const threadId = await getOrCreateThread(userId);

//     // Add the incoming message or media to the thread
//     await addMessageToThread(threadId, userMessage, mediaUrl);

//     // Create a run to process the input
//     const run = await createRun(threadId, assistant.id);

//     // Check the run status and process accordingly
//     let runStatus = await checkRunStatus(threadId, run.id);

//     // If the assistant requires an action to be performed, handle it
//     if (runStatus.status === "requires_action") {
//         // Call handleRequiredAction with necessary parameters
//         return await handleRequiredAction(runStatus.required_action, assistant.id, run.id, threadId);
//     }

//     // If no action is required, get the assistant's messages and return them
//     const assistantMessages = await getAssistantMessages(threadId);
//     return assistantMessages;
// }

// This is a simplified high-level example and would need to be fleshed out with actual API calls and error handling.

async function directTranscriptionAndUpdate(userId, mediaUrl) {
    // Step 1 & 2: Directly transcribe audio
    const transcription = await transcribeAudio(mediaUrl);

    // Step 3: Ensure a thread exists
    const threadId = await getOrCreateThread(userId);

    // Step 4: Create a run
    const runId = await createRun(threadId);

    // Step 5 & 6: Update thread with transcription (assuming this is done through a tool output)
    await submitToolOutput(threadId, runId, transcription);

    // Step 7: Continue with conversation
    // You may return the transcription to be used in the conversation or process further messages
    return transcription;
}

async function uploadFileToOpenAI(incomingMediaUrl) {
    try {

        const file = await openai.files.create({
            file: fs.createReadStream(incomingMediaUrl),
            purpose: "assistants"
        })

        return file;
    } catch (err) {
        throw err;
    }
}

// let assistant;

async function handleMessage(userId, userMessage, mediaUrl, mediaType, profileName) {
    console.log("[ Assistants API ][ Handle Message ] - Received message request, handling user message: ", userMessage);
    if (mediaType) {

        console.log("[ Assistants API ][ Handle Message ] - Received message request with media type: ", mediaType);

    }
    const assistantResponse = new AssistantResponse();

    let visionApiAssistantId = 'asst_MR5MRKAJ5rc0qhaAsKi7WW6C';
    let transcribeAudioAssistantId = 'asst_b6asV1Td64nD71BGbEUeeb7l';
    let generateImageAndTextAssistantId = 'asst_neb0B4Ad0Exg3lzAB42egnhu';

    try {
        // Set up the Assistant
        // let assistant = await setupAssistant();

        // let assistant = await setupSpecializedAssistant(mediaType);
        // if(!assistant) {
        //     console.log("[ Assistants API ][ Assitant ] - Creating a new assistant");

        //     assistant = await setupAssistant();
        // }

        // let assistant_id = 'asst_Lbe2bp6HuYz8QErB4rogMeJj';
        let assistant_id;

        if(mediaType) {
        if (mediaType == "image/jpeg") {
            console.log("[ Assistants API ][ Handle Message ] - Media type for image found, using assistant with id ", visionApiAssistantId);
            assistant_id = visionApiAssistantId;
        } else {
            console.log("[ Assistants API ][ Handle Message ] - Media type for audio found, using assistant with id ", transcribeAudioAssistantId);

            assistant_id = transcribeAudioAssistantId;

        }
    } else {
        console.log("[ Assistants API ][ Handle Message ] - No Media type for found, using assistant for DALL-E-3 and text with id ", generateImageAndTextAssistantId);

        assistant_id = generateImageAndTextAssistantId;
    }
        // let assistant_id = 'asst_Br2fpSsagEd3LcYCP9fp2RQy';


        // Hard-coded assistant so we dont create a new one for each request
        // const assistant_id = 'asst_0O5Aqevvkh7EufeUeZgYJiHJ';


        // Get or create a thread for the user
        const threadId = await getOrCreateThread(userId);
        // const thread = await createThread();
        // const threadId = thread.id;

        // Add the incoming message or media to the thread
        await addMessageToThread(threadId, userMessage, mediaUrl);

        // Create a run to process the input. NOTE: Normally we would pass it assistant.id from above
        // but since we are using the hard-coded one, were just passing that value
        const run = await createRun(threadId, assistant_id, mediaUrl, mediaType, profileName);


        // const RUN_TIMEOUT = 15000; // Maximum time to wait for a run to complete in milliseconds.

        // // Set a timeout to cancel the run if it takes too long
        // const timeoutId = setTimeout(async () => {
        //     try {
        //         console.log(`Run ${run.id} is being cancelled due to timeout.`);
        //         await openai.beta.threads.runs.cancel(threadId, run.id);
        //     } catch (error) {
        //         console.error('Error cancelling run:', error);
        //     }
        // }, RUN_TIMEOUT);

        // Wait for the run to be completed before proceeding
        // let runStatus = await checkRunStatus(threadId, run.id);

        // Check the run status and process accordingly
        let runStatus = await checkRunStatus(threadId, run.id);
        // do {
        //     runStatus = await checkRunStatus(threadId, run.id);
        //     // If the run is completed or requires action, clear the timeout.
        //     if (runStatus.status !== 'active') {
        //         clearTimeout(timeoutId);
        //     }
        //     // Wait a short period before checking the status again
        //     await new Promise(resolve => setTimeout(resolve, 2000));
        // } while (runStatus.status === 'active');
        while (runStatus.status !== "completed" && runStatus.status !== "requires_action") {

            // Wait for a couple of seconds before checking the status again
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await checkRunStatus(threadId, run.id);
            // if (runStatus.status == "failed") {
            //     console.log("[ ERROR ][ Assistants API ][ Run Status ] - Run status failed, reason: ", run);
            //     return run.last_error;
            // }
        }

        // If the assistant requires an action to be performed, handle it
        if (runStatus.status === "requires_action") {
            console.log("[ Assistants API ][ Action Required ] - The assistant requires an action to be performed");
            console.log(`RUN: ----> ${JSON.stringify(runStatus)}`);
            // Call handleRequiredAction with necessary parameters. NOTE: Also passing in hard-coded id instead of assistant.id
            return await handleRequiredAction(runStatus.required_action, assistant_id, run.id, threadId);
        }

        // If no action is required and the run is completed, get the assistant's messages
        if (runStatus.status === "completed") {
            const assistantMessages = await getAssistantMessages(threadId);
            //new code need to delete?
            const lastMessageForRun = assistantMessages.data
                .filter(
                    (message) => message.run_id === run.id && message.role === "assistant"
                )
                .pop();
            // End new code 

            // console.log("MESSAGE RESPONSE: ", messageResponse.content[0].text.value);
            assistantResponse.setTextResponse(lastMessageForRun.content[0].text.value);

            const logs = await openai.beta.threads.runs.steps.list(threadId, run.id);
            logs.body.data.forEach(log =>  {
                console.log(`[ Assistants API ][ LOGS ] - Log step details: ${log.step_details}`);
            });
            return assistantResponse;
            // return lastMessageForRun;
            // return assistantMessages;
        }
    } catch (err) {
        console.log("[ ERROR ][ Assistants API ][ Handling Message ] - Error handling message ", err);
        // If the status is neither 'completed' nor 'requires_action', handle accordingly
        // You may want to return an error or a message indicating the run is not finished
        throw new AssistantResponseError(openaiErrorMessage);
    }
}

async function handleRequiredAction(requiredAction, assistantId, runId, threadId) {
    console.log("[ Assistants API ][ Handling Action ] - A request to handle required action has been received");

    try {
        const assistantResponse = new AssistantResponse();

        console.log(`[ ~~~~ DEBUGGING ~~~~ ] Tool call length: ${requiredAction.submit_tool_outputs.tool_calls.length}`)
        // Check if there are any tool calls and process only the first one
        if (requiredAction.submit_tool_outputs.tool_calls.length > 0) {
            const firstToolCall = requiredAction.submit_tool_outputs.tool_calls[0];
            console.log("FIRST TOOL CALL: ", firstToolCall);

            const tool_call_id = firstToolCall.id;
            const functionName = firstToolCall.function.name;
            const args = firstToolCall.function.arguments;
            const argsObject = JSON.parse(args);

            console.log("[ Assistants API ][ Handling Action ] - Action to handle: ", functionName);

            let output;
            // Determine which function to call based on the required action
            switch (functionName) {
                case 'transcribeAudio':
                    const transcriptionOutput = await transcribeAudio(argsObject.incomingMediaUrl, argsObject.mediaType);
                    assistantResponse.setTextResponse(transcriptionOutput);
                    output = JSON.stringify({ type: 'text', data: { text: transcriptionOutput } });
                    break;
                case 'generateImage':
                    const imageOutput = await generateImage(argsObject.textPrompt, argsObject.isHd);
                    assistantResponse.setImageResponse(imageOutput.data[0].url);
                    output = JSON.stringify({ type: 'image', data: { image_url: imageOutput } });
                    break;
                case 'visionApi':
                    const visionOutput = await visionApi(argsObject.mediaUrl, argsObject.prompt, argsObject.mediaType);
                    assistantResponse.setTextResponse(visionOutput);
                    output = JSON.stringify({ type: 'text', data: { text: visionOutput } });
                    break;
                default:
                    throw new Error(`Unknown function requested: ${functionName}`);
            }

            // Submit the result of the tool call back to the assistant
            await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
                tool_outputs: [{
                    tool_call_id: tool_call_id,
                    output: output,
                }],
            });

        } else {
            console.log("[ Assistants API ][ Handling Action ] - No tool calls to process.");
        }

        console.log("[ Assistants API ][ Required Action Handling ] - Successfully handled required action");
        return assistantResponse;
    } catch (err) {
        cancelRun(threadId, runId);
        console.log("[ ERROR ][ Assistants API ][ Required Action Handling ] - Error handling required action: ", err);
        throw new AssistantResponseError(openaiErrorMessage);
    }
}




// async function handleRequiredAction(requiredAction, assistantId, runId, threadId) {
//     console.log("[ Assistants API ][ Handling Action ] - A request to handle required action has been received");

//     try {
//         const assistantResponse = new AssistantResponse();


//         // Array to hold the promises for each function call that needs to be handled
//         // const toolOutputsPromises = requiredAction.submit_tool_outputs.tool_calls.map(async (toolCall) => {
//             const toolOutputsPromises = requiredAction.submit_tool_outputs.tool_calls.map(async (toolCall) => {

//             console.log("TOOLCALL!!!: ", toolCall);
//             const tool_call_id = toolCall.tool_call_id;
//             console.log("TOOLCALLID: ", tool_call_id);
//             const functionName = toolCall.function.name;
//             const args = toolCall.function.arguments;
//             const argsObject = JSON.parse(args);


//             console.log("[ Assistants API ][ Handling Action ] - Action to handle: ", functionName);

//             // Determine which function to call based on the required action
//             switch (functionName) {
//                 case 'transcribeAudio':
//                     console.log("ARGS OBJECT: ", argsObject);
//                     const transcriptionOutput = await transcribeAudio(argsObject.incomingMediaUrl, argsObject.mediaType);
//                     console.log("TRANSCRIPTION IN SWITCH: ", transcriptionOutput);
//                     assistantResponse.setTextResponse(transcriptionOutput);
//                     return {
//                         tool_call_id: toolCall.id,
//                         output: JSON.stringify({ type: 'text', data: { text: transcriptionOutput } }),
//                     };
//                 case 'generateImage':
//                     const argsObject = JSON.parse(args);
//                     console.log("Parsed ARGS: ", argsObject);
//                     console.log("Parsed ARGS.textPrompt: ", argsObject.textPrompt);

//                     const imageOutput = await generateImage(argsObject.textPrompt, argsObject.isHd);
//                     console.log("Image output inside switch: ", imageOutput);
//                     assistantResponse.setImageResponse(imageOutput.data[0].url);

//                     // return {
//                     //     tool_call_id: toolCall.id,
//                     //     output: { type: 'image', data: { image_url: imageOutput } },
//                     // };
//                     return {
//                         tool_call_id: toolCall.id,
//                         output: JSON.stringify({ type: 'image', data: { image_url: imageOutput } }), // Serialize the output to a JSON string
//                     };
//                 case 'visionApi':
//                     const argsObjectJson = JSON.parse(args);

//                     const visionOutput = await visionApi(argsObjectJson.mediaUrl, argsObjectJson.prompt, argsObjectJson.mediaType);
//                     console.log(`VISION OUTPUT: ${visionOutput}`);
//                     assistantResponse.setTextResponse(visionOutput);

//                     return {
//                         tool_call_id: toolCall.id,
//                         output: JSON.stringify({ type: 'text', data: { text: visionOutput } }),
//                     };
//                 default:
//                     throw new Error(`Unknown function requested: ${functionName}`);
//             }
//         });

//         // Wait for all tool calls to be processed
//         const toolOutputs = await Promise.all(toolOutputsPromises);

//         // Submit the results of the tool calls back to the assistant
//         // const run = await openai.beta.threads.runs.submitToolOutputs(
//         //     assistant_id: assistantId,
//         //     run_id: runId,
//         //     tool_outputs: toolOutputs,
//         // );

//         console.log("TOOL OUTPUTS: ", toolOutputs);
//         console.log("TOOL OUTPUTS DATA: ", toolOutputs.output);

//         const run = await openai.beta.threads.runs.submitToolOutputs(
//             threadId,
//             runId,
//             {
//                 tool_outputs: toolOutputs,
//             }
//         );

//         console.log("[ Assistants API ][ Required Action Handling ] - Successfully submitted tool outputs");
//         // After submitting tool outputs, get the updated assistant's messages
//         const assistantMessages = await getAssistantMessages(threadId);

//         //     let assistantMessages;
//         // let found = false;
//         // const maxAttempts = 10;
//         // let attempts = 0;

//         // while (!found && attempts < maxAttempts) {
//         //   attempts++;
//         //   assistantMessages = await getAssistantMessages(threadId);
//         //   found = assistantMessages.data.some(message => message.run_id === runId && message.role === "assistant");
//         //   console.log("FOUND!!!: ", found);
//         //   if (!found) {
//         //     console.log("NOT FOUND YET, RETRYING");
//         //     await new Promise(resolve => setTimeout(resolve, 1000)); // wait for 1 second before the next attempt
//         //   }
//         // }

//         // if (!found) {
//         //   throw new Error('Response message not found after maximum attempts.');
//         // }

//         // console.log("run id passed: ", runId);
//         // console.log("run id from run: ", run.id);

//         // for (const messages of assistantMessages.data) {
//         //     console.log("individual message: ", messages.content[0].text);
//         //     console.log("individual message: ", messages.content[0].text.value);

//         // }

//         // const lastMessageForRun = assistantMessages.data
//         //     // .filter(
//         //     //     (message) => message.run_id === run.id && message.role === "assistant"
//         //     // )
//         //     .filter(
//         //         (message) => message.role === "assistant"
//         //     )
//         //     .pop();


//         // console.log("lastMessageForRun: ", lastMessageForRun);

//         // console.log("lastMessageForRun: ", lastMessageForRun.content[0].text);

//         // const toolOutput = toolOutputs[0].output;

//         // // Parse the JSON string to an object.
//         // const parsedOutput = JSON.parse(toolOutput);
//         // console.log("PARSED OUTPUT: ", parsedOutput.data.image_url.data);

//         // // Access the URL field from the parsed JSON object.
//         // const imageUrl = parsedOutput.data.image_url.data[0].url;

//         // console.log("Image URL: ", imageUrl);

//         return assistantResponse;
//     } catch (err) {
//         console.log("[ ERROR ][ Assistants API ][ Required Action Handling ] - Error handling required action: ", err);

//         throw new AssistantResponseError(openaiErrorMessage);

//     }
//     // return imageUrl;
// }

async function generatetoolCallsTranscription(mediaUrl) {
    const responseJson = []
}

async function cancelRun(threadId, runId) {
    try {
    await openai.beta.threads.runs.cancel(threadId, runId);

    console.log(`[ Assistants API ][ Cancel Run ] - Successfully cancelled run ${runId} for thread ${threadId}, error: ${err}`);

    }catch(err) {
        console.log(`[ ERROR ][ Assistants API ][ Cancel Run ] - Error canceling run ${runId} for thread ${threadId}, error: ${err}`);
    }
}

class AssistantResponse {
    constructor() {
        this.type = null;
        this.content = null;
        this.error = null;
    }

    setResponseType(type) {
        this.type = type;
    }

    setTextResponse(text) {
        this.type = 'text';
        this.content = text;
    }

    setImageResponse(imageUrl) {
        this.type = 'image';
        this.content = imageUrl;
    }

    setTranscriptionResponse(audioUrl) {
        this.type = 'text';
        this.content = audioUrl;
    }

    setError(error) {
        this.error = error;
    }
}

class AssistantResponseError extends Error {
    constructor(message, assistantResponse = null) {
        super(message);
        this.name = `AssistantResponseError`;
        this.assistantResponse = assistantResponse;
    }
}

