const db = require('./db');

async function createUser(whatsappNumber, name) {
    try {

        const result = await db.one(
            `INSERT INTO users (whatsapp_number, name)
         VALUES ($1, $2)
         RETURNING id`,
            [whatsappNumber, name]
        );
        await updateLastSeen(result.id)
        console.log(`[ Users Table ] - Successfully created user for ${name} with number ${whatsappNumber}. User Id = ${result.id}`);
        return result.id;
    } catch (error) {
        console.error('[ ERROR ][ Users Table ] - Error creating user:', error);
        throw error;
    }
}

async function getUserByWhatsAppNumber(whatsappNumber) {
    try {
        const user = await db.oneOrNone(
            `SELECT * FROM users WHERE whatsapp_number = $1`,
            whatsappNumber
        );
        if (user) {
            console.log(`[ Users Table ] - Successfully retrieved user for number: ${whatsappNumber}: ${user}`);
        } else {
            console.log(`[ Users Table ] - No record found for a user with whatsapp number: ${whatsappNumber}`);

        }
        return user;
    } catch (error) {
        console.error('[ ERROR ][ Users Table ] - Error retrieving user:', error);
        throw error;
    }
}


async function updateLastSeen(userId) {
    try {
        await db.none(
            `UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1`,
            userId
        );
        console.log(`[ Users Table ] - Successfully updated last seen for user with id ${userId}`);
    } catch (error) {
        console.error(`[ ERROR ][ Users Table ] - Error updating last seen for user with id ${userId}: `, error);
        throw error;
    }
}

// Function to get a user's thread_id given their user_id
async function getUserThreadId(userId) {
    try {
        const result = await db.one('SELECT thread_id FROM users WHERE id = $1', [userId]);
        console.log(`[ Users Table ] - Retrieved thread_id for user_id = ${userId}`);
        return result.thread_id;
    } catch (error) {
        console.error('[ ERROR ][ Users Table ] - Error retrieving thread_id:', error);
        throw error;
    }
}

// Function to update a user's thread_id given their user_id
async function updateUserThreadId(userId, threadId) {
    try {
        const result = await db.none('UPDATE users SET thread_id = $1 WHERE id = $2', [threadId, userId]);
        console.log(`[ Users Table ] - Updated thread_id for user_id = ${userId}`);
        return true;
    } catch (error) {
        console.error('[ ERROR ][ Users Table ] - Error updating thread_id:', error);
        throw error;
    }
}


module.exports = {
    getUserByWhatsAppNumber,
    createUser,
    updateLastSeen,
    getUserThreadId,
    updateUserThreadId
};