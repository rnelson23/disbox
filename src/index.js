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
        const full = /(?<!\w)(U(?=P\s)|D(?=OWN\s)|L(?=EFT\s)|R(?=IGHT\s)|C(?=ONTINUE\s)|Q(?=UIT\s)|P(?=ULL (UP\s|DOWN\s|LEFT\s|RIGHT\s)))/g;

        let moves = message.content.toUpperCase().match(full);
        if (moves === null) moves = message.content.toUpperCase().match(/[UDLRPCQ]/g);

        if (!message.channel.messages.cache.has(cache.get(message.author.id).messageID)) return;
        if (moves === null) return;

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

    if (!message.content.startsWith(process.env.prefix)) return;
    logger.info(`${message.channel.id} ${message.author.tag}: ${process.env.prefix}${command}`);

    if (command === 'play') {
        game.generate(message, cache);
    }
});

client.login(process.env.token);
