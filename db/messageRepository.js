const db = require('./db');

async function storeMessageInTable(message) {
    try {
        const result = await db.one(
            `INSERT INTO messages (user_id, conversation_id, role, content, token_count)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [message.userId, message.conversationId, message.role, message.content, message.tokens]
        );
        console.log(`[ Messages Table ] - Successfully stored message from ${message.role} with content: ${message.content}`);
        return result.id;
    } catch (error) {
        console.error('[ ERROR ][ Messages Table ] - Error storing message:', error);
        throw error;
    }
}


async function getConversationHistory(conversationId) {
    try {
        const messages = await db.any(
            `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
            conversationId
        );
        console.log(`[ Messages Table ] - Successfully retrieved messages for conversation id: ${conversationId}`);
        return messages;
    } catch (error) {
        console.error('[ ERROR ][ Messages Table ] - Error retrieving messages:', error);
        throw error;
    }
}

async function updateMessageTokens(messageId, tokenCount) {
    try {
        await db.none(`
          UPDATE messages
          SET token_count = $1
          WHERE id = $2
        `, [tokenCount, messageId]);
        console.log(`[ Messages Table ] - Successfully updated token count for message: ${messageId}`);
    } catch (error) {
        console.error(`[ ERROR ][ Messages Table ] - Error updating token count for message: ${messageId}:`, error);
        throw error;
    }
}
async function getTotalTokenCount(conversationId) {
    try {
        const result = await db.oneOrNone(`
            SELECT SUM(token_count) AS total_tokens
            FROM messages
            WHERE conversation_id = $1
        `, [conversationId]);

        if(result) {
            console.log(`[ Messages Table ] - Successfully retrieved total token count of ${result} for conversation: ${conversationId}`);
            return result.total_tokens;
        }
        
        return 0;
    } catch (error) {
        console.error('[ ERROR ][ Messages Table ] - Error retrieving total token count for conversation:', error);
        throw error;
    }
}

async function deleteAllMessagesAndConversation(userId) {
    try {
        await db.tx(async t => {
            // Get conversationId based on userId from the messages table
            const conversationId = await t.oneOrNone('SELECT conversation_id FROM messages WHERE user_id = $1 LIMIT 1', userId);

            if (conversationId) {
                // Delete messages with the specified userId
                await t.none('DELETE FROM messages WHERE user_id = $1', userId);

                // Delete conversation using the obtained conversationId
                await t.none('DELETE FROM conversations WHERE id = $1', conversationId);

                console.log(`[ Messages Table ] - Successfully deleted conversation and messages for user id: ${userId}`);
            } else {
                console.log(`[ Messages Table ] - No conversation found for user id: ${userId}`);
            }
        });
    } catch (error) {
        console.error('[ ERROR ][ Messages Table ] - Error deleting conversation and messages:', error);
        throw error;
    }
}

module.exports = {
    storeMessageInTable,
    getConversationHistory,
    updateMessageTokens,
    getTotalTokenCount,
    deleteConversationAndMessages
};


module.exports = {
    storeMessageInTable,
    getConversationHistory,
    updateMessageTokens,
    getTotalTokenCount
};
