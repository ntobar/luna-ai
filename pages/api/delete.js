module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const incomingMessage = req.body.Body;
    const fromNumber = req.body.From;
    const whatsappNumber = fromNumber.replace('whatsapp:', '');

    // Check if the user exists
    let existingUser = await userRepository.getUserByWhatsAppNumber(whatsappNumber);

    if (existingUser) {
      // User already exists, update last_seen
      await userRepository.updateLastSeen(existingUser.id);
    } else {
      // User doesn't exist, create new user
      const userId = await userRepository.createUser(whatsappNumber, profileName);
      existingUser = { id: userId };
    }

    console.log(`[ Incoming Request ] Received prompt: ${incomingMessage} from number ${fromNumber}`);

    if (incomingMessage.toLowerCase().includes('image')) {
      // handle image generation and sending here
    } else {
      // Retrieve or create a new conversation for the user
      let conversationId = await conversationRepository.getConversationId(existingUser.id);
      if (!conversationId) {
        conversationId = await conversationRepository.createNewConversation(existingUser.id);
      }

      // Store user's message
      const userMessage = {
        userId: existingUser.id,
        conversationId: conversationId,
        role: 'user',
        content: incomingMessage
      };
      const userTokenCount = incomingMessage.length;  // Replace with your token counting function
      await messageRepository.storeMessageInTable(userMessage, userTokenCount);

      // Fetch conversation history
      const conversationHistory = await messageRepository.getConversationHistory(conversationId);

      // Generate a response using OpenAI's GPT-4
      console.log(`[ Chat Completion ] - Request received with prompt: ${incomingMessage}`);
      const formattedHistory = conversationHistory.map(message => ({role: message.role, content: message.content}));

      const openAIPrompt = {
        "messages": formattedHistory,
        "max_tokens": 60, // Set the max tokens according to your needs
      };

      const gpt4Response = await openai.ChatCompletion.create(openAIPrompt);

      const aiMessageContent = gpt4Response.choices[0].message.content;
      const aiTokenCount = aiMessageContent.length;  // Replace with your token counting function

      // Store AI's message
      const aiMessage = {
        userId: existingUser.id,
        conversationId: conversationId,
        role: 'assistant',
        content: aiMessageContent
      };
      await messageRepository.storeMessageInTable(aiMessage, aiTokenCount);

      // Update the conversation's token count
      const totalTokenCount = userTokenCount + aiTokenCount;
      await conversationRepository.updateTokenCount(conversationId, totalTokenCount);

      console.log(`[ Chat Completion ] - OPENAI response received with ${aiMessageContent.length} characters and ${totalTokenCount} token usage: ${gpt4Response}`);

      res.setHeader('Content-Type', 'text/xml');
      res.status(204).end();
      await sendResponse(aiMessageContent, fromNumber);
    }
  }
};
