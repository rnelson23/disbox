const logger = require('@jakeyprime/logger');
const { MessageEmbed } = require('discord.js');
const constants = require('../constants');
/**
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {import('node-cache')} cache
 * @param {import('../game')} game
 */
module.exports = async (reaction, user, cache, game) => {
    const message = reaction.message;
    const gameCache = cache.get(user.id);

    const board = gameCache.board;
    const moves = gameCache.reacts;
    const level = gameCache.level;

    switch(reaction.emoji.name) {
        case '⬆️': {
            moves.push('Up');
            await reaction.users.remove(user);
            break;
        }

        case '⬇️': {
            moves.push('Down');
            await reaction.users.remove(user);
            break;
        }

        case '⬅️': {
            moves.push('Left');
            await reaction.users.remove(user);
            break;
        }

        case '➡️': {
            moves.push('Right');
            await reaction.users.remove(user);
            break;
        }

        case '🇵': {
            moves.push('Pull');
            await reaction.users.remove(user);
            break;
        }

        case '🔂': {
            moves.pop();
            await reaction.users.remove(user);
            break;
        }

        case '🔁': {
            moves = [];
            await reaction.users.remove(user);
            break;
        }

        case '▶️': {
            moves.forEach(async move => { moves.splice(moves.indexOf(move), 1, move.charAt(0)) });
            game.move(message, user, cache, moves);
            await reaction.users.remove(user);
            return;
        }
    }

    const embed = new MessageEmbed()
        .setAuthor(`Level ${level}`)
        .setDescription(`__**Moves:**__ ${moves.join(' **>** ')}\n\n${board.join('')}`)
        .setFooter(`Number of moves: ${moves.length}`);

    await message.edit(embed);

    const gameState = {
        board: board,
        width: gameCache.width,
        height: gameCache.height,
        level: level,
        numMoves: gameCache.numMoves,
        onGoal: gameCache.onGoal,
        isPull: gameCache.isPull,
        reacts: moves,
        messageID: message.id
    }

    cache.set(user.id, gameState);
};
