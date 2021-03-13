const discord = require('discord.js');
const NodeCache = require('node-cache');
const logger = require('@jakeyprime/logger');
const game = require('./game');

const client = new discord.Client();
const cache = new NodeCache();

client.on('ready', async () => {
    logger.info(`Bot ready in ${client.guilds.cache.array().length} guilds`);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (cache.get(user.id)?.messageID === reaction.message.id) {
        game.react(reaction, user, cache);
    }
});

client.on('message', async (message) => {
    if (message.content.startsWith(process.env.prefix + 'play') && !message.author.bot) {
        logger.info(`${message.channel.id} ${message.author.tag}: ${process.env.prefix}play`);
        game.generate(message, message.author, cache);
    }
});

client.login(process.env.token);
