const discord = require('discord.js');
const NodeCache = require('node-cache');
const logger = require('@jakeyprime/logger');

const client = new discord.Client();
const cache = new NodeCache();

client.on('ready', async () => { logger.info('Bot ready') });

client.on('message', async (message) => {
    const args = message.content.slice(process.env.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (message.author.bot) return;

    const red = ':red_square:';
    const black = ':black_large_square:';
    const goal = ':negative_squared_cross_mark:';
    const block = ':brown_square:';
    const player = ':flushed:';
    const playerGrab = ':weary:';

    if (message.content.startsWith(process.env.prefix) && command === 'play') {
        logger.info(`${message.channel.id} ${message.author.tag}: ${process.env.prefix}${command}`);
        newGame();
    }

    async function newGame(level = 1) {
        const width = level < 10 ? 6 : 9;
        const height = level < 10 ? 4 : 6;

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

        const embed = new discord.MessageEmbed()
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
            moves: 0,
            grab: false,
            onGoal: false,
            messageID: messageID
        }

        cache.set(message.author.id, game);
    }

    if (cache.has(message.author.id)) {
        const plays = message.content.toUpperCase().match(/[DLCQ]|(?<!N|Q)U|R(?!A)|(?<!I)G/g);
        const start = cache.get(message.author.id);
        const reset = JSON.stringify(start.board);
        const msg = message.channel.messages.cache.get(start.messageID);

        if (msg.channel.id !== message.channel.id) return;

        if (plays.includes('Q')) {
            cache.del(message.author.id);
            return;
        }

        await message.delete();

        plays.forEach(async (play, index) => {
            setTimeout(async () => {
                const game = cache.get(message.author.id);

                let board = game.board;
                let width = game.width;
                let height = game.height;
                let level = game.level;
                let moves = game.moves;
                let grab = game.grab;
                let onGoal = game.onGoal;

                let moveGoal = false;
                let win = false;

                let location = board.indexOf(player) === -1 ? board.indexOf(playerGrab) : board.indexOf(player);

                switch (play) {
                    case 'U': {
                        if (board[location - width] === red) return;
                        if (board[location - width] === goal) moveGoal = true;

                        if (board[location - width] === black || board[location - width] === goal) {
                            board.splice(location - width, 1, player);

                            if (board[location + width] === block && grab) {
                                if (onGoal) win = true;

                                board.splice(location, 1, block);
                                board.splice(location + width, 1, black);

                                grab = false;

                            } else {
                                board.splice(location, 1, onGoal ? goal : black);
                            }
                        }

                        if (board[location - width] === block && board[location - (width * 2)] !== red) {
                            if (board[location - (width * 2)] === goal) win = true;

                            board.splice(location - (width * 2), 1, block);
                            board.splice(location - width, 1, player);
                            board.splice(location, 1, onGoal ? goal : black);
                        }

                        onGoal = moveGoal;
                        moves++;
                        break;
                    }

                    case 'D': {
                        if (board[location + width] === red) return;
                        if (board[location + width] === goal) moveGoal = true;

                        if (board[location + width] === black || board[location + width] === goal) {
                            board.splice(location + width, 1, player);

                            if (board[location - width] === block && grab) {
                                if (onGoal) win = true;

                                board.splice(location, 1, block);
                                board.splice(location - width, 1, black);

                                grab = false;

                            } else {
                                board.splice(location, 1, onGoal ? goal : black);
                            }
                        }

                        if (board[location + width] === block && board[location + (width * 2)] !== red) {
                            if (board[location + (width * 2)] === goal) win = true;

                            board.splice(location + (width * 2), 1, block);
                            board.splice(location + width, 1, player);
                            board.splice(location, 1, onGoal ? goal : black);
                        }

                        onGoal = moveGoal;
                        moves++;
                        break;
                    }

                    case 'L': {
                        if (board[location - 1] === red) return;
                        if (board[location - 1] === goal) moveGoal = true;

                        if (board[location - 1] === black || board[location - 1] === goal) {
                            board.splice(location - 1, 1, player);

                            if (board[location + 1] === block && grab) {
                                if (onGoal) win = true;

                                board.splice(location, 1, block);
                                board.splice(location + 1, 1, black);

                                grab = false;

                            } else {
                                board.splice(location, 1, onGoal ? goal : black);
                            }
                        }

                        if (board[location - 1] === block && board[location - 2] !== red) {
                            if (board[location - 2] === goal) win = true;

                            board.splice(location - 2, 1, block);
                            board.splice(location - 1, 1, player);
                            board.splice(location, 1, onGoal ? goal : black);
                        }

                        onGoal = moveGoal;
                        moves++;
                        break;
                    }

                    case 'R': {
                        if (board[location + 1] === red) return;
                        if (board[location + 1] === goal) moveGoal = true;

                        if (board[location + 1] === black || board[location + 1] === goal) {
                            board.splice(location + 1, 1, player);

                            if (board[location - 1] === block && grab) {
                                if (onGoal) win = true;

                                board.splice(location, 1, block);
                                board.splice(location - 1, 1, black);

                                grab = false;

                            } else {
                                board.splice(location, 1, onGoal ? goal : black);
                            }
                        }

                        if (board[location + 1] === block && board[location + 2] !== red) {
                            if (board[location + 2] === goal) win = true;

                            board.splice(location + 2, 1, block);
                            board.splice(location + 1, 1, player);
                            board.splice(location, 1, onGoal ? goal : black);
                        }

                        onGoal = moveGoal;
                        moves++;
                        break;
                    }

                    case 'G': {
                        board.splice(location, 1, playerGrab);

                        grab = true;
                        moves++;
                        break;
                    }

                    case 'C': {
                        level++;
                        await newGame(level);
                        return;
                    }
                }

                switch (win) {
                    case true: {
                        const embed = new discord.MessageEmbed()
                            .setAuthor(`Level ${level}`)
                            .setDescription(board.join(''))
                            .setFooter(`Number of moves: ${moves}`)
                            .setColor(0x77B255);

                        await msg.edit(embed);
                        break;
                    }

                    case false: {
                        const embed = new discord.MessageEmbed()
                            .setAuthor(`Level ${level}`)
                            .setDescription(board.join(''))
                            .setFooter(`Number of moves: ${moves}`);

                        await msg.edit(embed);

                        if ((index + 1) === plays.length) {
                            board = JSON.parse(reset);
                            moves = 0;
                            grab = false;
                            onGoal = false;

                            setTimeout(async () => {
                                const embed = new discord.MessageEmbed()
                                    .setAuthor(`Level ${level}`)
                                    .setDescription(board.join(''))
                                    .setFooter(`Number of moves: ${moves}`);

                                await msg.edit(embed);

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
                    moves: moves,
                    grab: grab,
                    onGoal: onGoal,
                    messageID: msg.id
                }

                cache.set(message.author.id, gameState);

            }, index * 1500);
        });
    }
});

client.login(process.env.token);
