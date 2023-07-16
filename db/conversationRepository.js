const db = require('./db');

async function getConversationId(userId) {
    try {
        const result = await db.oneOrNone(`
          SELECT id
          FROM conversations
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `, [userId]);
        if (result) {
            console.log(`[ Conversation Table ] - Successfully retrieved active conversation for user: ${userId}: ${result.id}`);
        } else {
            console.log(`[ Conversation Table ] - No active conversation found for user: ${userId}`);
        }
        return result ? result.id : null;
    } catch (error) {
        console.error('[ ERROR ][ Conversation Table ] - Error retrieving active conversation:', error);
        throw error;
    }
}

async function createNewConversation(userId) {
    try {
        const result = await db.one(`
          INSERT INTO conversations (user_id)
          VALUES ($1)
          RETURNING id
        `, [userId]);
        console.log(`[ Conversation Table ] - Successfully created new conversation for user: ${userId}. Conversation Id = ${result.id}`);
        return result.id;
    } catch (error) {
        console.error('[ ERROR ][ Conversation Table ] - Error creating new conversation:', error);
        throw error;
    }
}

async function updateTokenCount(conversationId, tokenCount) {
    try {
        await db.none(`
          UPDATE conversations
          SET token_count = token_count + $1
          WHERE id = $2
        `, [tokenCount, conversationId]);
        console.log(`[ Conversation Table ] - Successfully updated token count for conversation: ${conversationId}`);
    } catch (error) {
        console.error(`[ ERROR ][ Conversation Table ] - Error updating token count for conversation: ${conversationId}:`, error);
        throw error;
    }
}

async function deleteConversation(conversationId) {
    try {
        await db.none(`
          DELETE FROM conversations
          WHERE id = $1
        `, [conversationId]);
        console.log(`[ Conversation Table ] - Successfully deleted conversation: ${conversationId}`);
    } catch (error) {
        console.error(`[ ERROR ][ Conversation Table ] - Error deleting conversation: ${conversationId}:`, error);
        throw error;
    }
}



module.exports = {
    getConversationId,
    createNewConversation,
    updateTokenCount,
    deleteConversation
};
