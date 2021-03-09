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

    if (message.author.bot) return;

    if (cache.has(message.author.id)) {
        const full = /(?<!\w)(U(?=P)|D(?=OWN)|L(?=EFT)|R(?=IGHT)|C(?=ONTINUE)|Q(?=UIT)|P(?=ULL (UP|DOWN|LEFT|RIGHT)))/g;

        let moves = message.content.toUpperCase().match(full);
        if (moves === null) moves = message.content.toUpperCase().match(/[UDLRPCQ]/g);

        const msg = message.channel.messages.cache.get(cache.get(message.author.id).messageID);
        if (msg.channel.id !== message.channel.id) return;

        if (moves.includes('Q')) {
            cache.del(message.author.id);
            return;
        }

        await message.delete();

        if (moves.includes('C')) {
            game.generate(message, cache, cache.get(message.author.id).level + 1);
            return;
        }

        game.move(message, cache, moves);
        return;
    }

    if (message.content.startsWith(process.env.prefix)) return;
    logger.info(`${message.channel.id} ${message.author.tag}: ${process.env.prefix}${command}`);

    if (command === 'play') {
        game.generate(message, cache);
    }
});

client.login(process.env.token);
