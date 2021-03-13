const { MessageEmbed } = require('discord.js');
const constants = require('../constants');
/**
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').User} author
 * @param {import('node-cache')} cache
 * @param {string[]} moves
 */
module.exports = async (message, author, cache, moves) => {
    const reset = JSON.stringify(cache.get(author.id).board);

    const red = constants.emojis.red;
    const black = constants.emojis.black;
    const goal = constants.emojis.goal;
    const block = constants.emojis.block;
    const player = constants.emojis.player;
    const playerPull = constants.emojis.playerPull;

    moves.forEach(async (move, index) => {
        setTimeout(async () => {
            const game = cache.get(author.id);

            let board = game.board;
            let width = game.width;
            let height = game.height;
            let level = game.level;
            let onGoal = game.onGoal;
            let isPull = game.isPull;
            let numMoves = game.numMoves;

            let moveGoal = false;
            let win = false;
            let value;

            let location = board.indexOf(player) === -1 ? board.indexOf(playerPull) : board.indexOf(player);

            switch (move) {
                case 'Up': {
                    value = -width;
                    break;
                }

                case 'Down': {
                    value = width;
                    break;
                }

                case 'Left': {
                    value = -1;
                    break;
                }

                case 'Right': {
                    value = 1;
                    break;
                }

                case 'Pull': {
                    value = 0;
                    break;
                }
            }

            if (value !== 0) {
                if (board[location + value] === red) return;
                if (board[location + value] === goal) moveGoal = true;

                if (board[location + value] === black || board[location + value] === goal) {
                    board.splice(location + value, 1, player);

                    if (board[location - value] === block && isPull) {
                        if (onGoal) win = true;

                        board.splice(location, 1, block);
                        board.splice(location - value, 1, black);

                        isPull = false;

                    } else {
                        board.splice(location, 1, onGoal ? goal : black);
                    }
                }

                if (board[location + value] === block && board[location + (value * 2)] !== red) {
                    if (board[location + (value * 2)] === goal) win = true;

                    board.splice(location + (value * 2), 1, block);
                    board.splice(location + value, 1, player);
                    board.splice(location, 1, onGoal ? goal : black);
                }

                onGoal = moveGoal;
                numMoves++;
            
            } else {
                board.splice(location, 1, playerPull);

                isPull = true;
                numMoves++;
            }

            switch (win) {
                case true: {
                    const embed = new MessageEmbed()
                        .setAuthor(`Level ${level}`)
                        .setDescription(`${board.join('')}\n\n__**Moves:**__\n**>** ${moves.join('\n**>** ')}`)
                        .setFooter(`Number of moves: ${numMoves}`)
                        .setColor(0x77B255);

                    await message.edit(embed);

                    await message.reactions.removeAll();
                    await message.react(constants.emojis.quit);
                    await message.react(constants.emojis.continue);

                    break;
                }

                case false: {
                    const embed = new MessageEmbed()
                        .setAuthor(`Level ${level}`)
                        .setDescription(`${board.join('')}\n\n__**Moves:**__\n**>** ${moves.join('\n**>** ')}`)
                        .setFooter(`Number of moves: ${numMoves}`);

                    await message.edit(embed);

                    if ((index + 1) === moves.length) {
                        board = JSON.parse(reset);
                        numMoves = 0;
                        moves = [];
                        isPull = false;
                        onGoal = false;

                        setTimeout(async () => {
                            const embed = new MessageEmbed()
                                .setAuthor(`Level ${level}`)
                                .setDescription(`${board.join('')}\n\n__**Moves:**__\n**>**`)
                                .setFooter(`Number of moves: ${numMoves}`);

                            await message.edit(embed);

                        }, 1500);
                    }

                    break;
                }
            }

            const gameState = {
                board: board,
                width: width,
                height: height,
                level: level,
                onGoal: onGoal,
                isPull: isPull,
                numMoves: numMoves,
                reacts: moves,
                messageID: message.id
            }

            cache.set(author.id, gameState, 900);

        }, index * 1500);
    });
};
