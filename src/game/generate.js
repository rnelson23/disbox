const { MessageEmbed } = require('discord.js');
const constants = require('../constants');
/**
 * @param {import('discord.js').Message} message
 * @param {import('node-cache')} cache
 * @param {number} level
 */
module.exports = async (message, cache, level = 1) => {
    const width = level < 10 ? 6 : 9;
    const height = level < 10 ? 4 : 6;

    const red = constants.emojis.red;
    const black = constants.emojis.black;
    const goal = constants.emojis.goal;
    const block = constants.emojis.block;
    const player = constants.emojis.player;

    let board;

    async function randomize() {
        board = [];

        for (let i = 0; i < (width + 2); i++) {
            board.push(red);
        }

        board.push('\n');

        for (let i = 0; i < height; i++) {
            board.push(red);

            for (let i = 0; i < width; i++) {
                board.push(black);
            }

            board.push(red);
            board.push('\n');
        }

        for (let i = 0; i < (width + 2); i++) {
            board.push(red);
        }

        async function generateBarrier(amount) {
            for (let i = 0; i < amount; i++) {
                const barrierLocation = Math.floor(Math.random() * board.length);

                if (board[barrierLocation] !== black) {
                    await generateBarrier(amount - i);
                    return;
                }

                board.splice(barrierLocation, 1, red);
            }
        }

        async function generateItem(item) {
            const itemLocation = Math.floor(Math.random() * board.length);

            function blocked(location) {
                let blocked = true;

                if (board[location - (width + 3)] !== red) blocked = false; 
                if (board[location + (width + 3)] !== red) blocked = false;
                if (board[location - 1] !== red) blocked = false;
                if (board[location + 1] !== red) blocked = false;

                return blocked;
            }

            if (board[itemLocation] !== black || blocked(itemLocation) === true) {
                await generateItem(item);
                return;
            }

            board.splice(itemLocation, 1, item);
        }

        if (level > 19 && level < 30) await generateBarrier(3);
        if (level > 29 && level < 40) await generateBarrier(6);
        if (level > 39) await generateBarrier(9);

        await generateItem(goal);
        await generateItem(block);
        await generateItem(player);
    }

    await randomize();

    const embed = new MessageEmbed()
        .setAuthor(`Level ${level}`)
        .setDescription(board.join(''))
        .setFooter('Number of moves: 0');

    const ongoing = cache.get(message.author.id);
    let messageID;

    if (ongoing === undefined) {
        const msg = await message.channel.send(embed);
        messageID = msg.id;

    } else {
        const msg = message.channel.messages.cache.get(ongoing.messageID);
        await msg.edit(embed);
        messageID = msg.id;
    }

    const game = {
        board: board,
        width: width + 3,
        height: height + 2,
        level: level,
        numMoves: 0,
        onGoal: false,
        isPull: false,
        messageID: messageID
    }

     cache.set(message.author.id, game);
}
