const discord = require('discord.js');
const NodeCache = require('node-cache');
const logger = require('@jakeyprime/logger');
const game = require('./game');

const client = new discord.Client();
const cache = new NodeCache();

client.on('ready', async () => { logger.info(`Bot ready in ${client.guilds.cache.array().length} guilds`) });

client.on('message', async (message) => {
    const args = message.content.slice(process.env.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!message.content.startsWith(process.env.prefix) || message.author.bot) return;
    logger.info(`${message.channel.id} ${message.author.tag}: ${process.env.prefix}${command}`);

    if (command === 'play') game.generate(message, message.author, cache);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (cache.has(user.id) && cache.get(user.id).messageID === reaction.message.id) {
        game.react(reaction, user, cache, game);
    }
})

client.login(process.env.token);
