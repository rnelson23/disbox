const discord = require('discord.js');
const logger = require('@jakeyprime/logger');

const client = new discord.Client();
const games = new discord.Collection();
const messages = new discord.Collection();
const counters = new discord.Collection();
const levels = new discord.Collection();
const grabbers = new discord.Collection();
const heights = new discord.Collection();
const widths = new discord.Collection();
const onGoals = new discord.Collection();

client.on('ready', async () => {logger.info('Bot ready')});

client.on('message', async (message) => {
    const black = ':black_large_square:';
    const red = ':red_square:';
    const goal = ':negative_squared_cross_mark:';
    const block = ':brown_square:';
    const player = ':flushed:';
    const grabbing = ':weary:';

    let board;

    async function newGame(width = 6, height = 4, level = 1) {
        widths.set(message.author.id, width + 3);
        heights.set(message.author.id, height + 2);

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

            return board;
        }

        await randomize();

        const embed = new discord.MessageEmbed()
            .setAuthor(`Level ${level}`)
            .setDescription(board.join(''))
            .setFooter('Number of moves: 0');

        if (level === 1) {
            const start = await message.channel.send(embed);
            messages.set(message.author.id, start);
        
        } else {
            const gameMessage = messages.get(message.author.id);
            await gameMessage.edit(embed);
        }

        games.set(message.author.id, board);
        levels.set(message.author.id, level);
        counters.set(message.author.id, 0);
        grabbers.set(message.author.id, false);
        onGoals.set(message.author.id, false);

        logger.info('Game Start');
    }

    if (message.author.bot) return;
    if (message.content.startsWith(process.env.prefix + 'start')) newGame();

    if (games.has(message.author.id)) {
        const plays = message.content.toUpperCase().match(/[DLCQ]|(?<!N|Q)U|R(?!A)|(?<!I)G/g);
        const start = games.get(message.author.id).join('');
        const reset = JSON.stringify(games.get(message.author.id));
        await message.delete();

        plays.forEach(async (play, index) => {
            setTimeout(async () => {
                const board = games.get(message.author.id);
                const width = widths.get(message.author.id);
                const height = heights.get(message.author.id);
                const onGoal = onGoals.get(message.author.id);
                const grabbed = grabbers.get(message.author.id);
                const gameMessage = messages.get(message.author.id);
                const playerLocation = board.indexOf(player) === -1 ? board.indexOf(grabbing) : board.indexOf(player);

                let moves = counters.get(message.author.id);
                let level = levels.get(message.author.id);
                let valid = false;
                let win = false;

                switch (play) {
                    case 'U': {
                        if (board[playerLocation - width] === black) {
                            if (board[playerLocation + width] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                if (onGoal === true) win = true;
                                onGoals.set(message.author.id, false);

                                board.splice(playerLocation - width, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation + width, 1, black);
                            
                            } else {
                                board.splice(playerLocation - width, 1, player);
                                board.splice(playerLocation, 1, onGoal ? goal : black);
                                onGoals.set(message.author.id, false);
                            }
                        }

                        if (board[playerLocation - width] === goal) {
                            onGoals.set(message.author.id, true);

                            if (board[playerLocation + width] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                board.splice(playerLocation - width, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation + width, 1, black);
                            
                            } else {
                                board.splice(playerLocation - width, 1, player);
                                board.splice(playerLocation, 1, black);
                            }
                        }

                        if (board[playerLocation - width] === block && board[playerLocation - (width * 2)] !== red) {
                            if (board[playerLocation - (width * 2)] === goal) win = true;

                            board.splice(playerLocation - (width * 2), 1, block);
                            board.splice(playerLocation - width, 1, player);
                            board.splice(playerLocation, 1, onGoal ? goal : black);
                            onGoals.set(message.author.id, false);
                        }

                        valid = true;
                        moves++;
                        break;
                    }

                    case 'D': {
                        if (board[playerLocation + width] === black) {
                            if (board[playerLocation - width] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                if (onGoal === true) win = true;
                                onGoals.set(message.author.id, false);

                                board.splice(playerLocation + width, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation - width, 1, black);

                            } else {
                                board.splice(playerLocation + width, 1, player);
                                board.splice(playerLocation, 1, onGoal ? goal : black);
                                onGoals.set(message.author.id, false);
                            }
                        }

                        if (board[playerLocation + width] === goal) {
                            onGoals.set(message.author.id, true);

                            if (board[playerLocation - width] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                board.splice(playerLocation + width, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation - width, 1, black);

                            } else {
                                board.splice(playerLocation + width, 1, player);
                                board.splice(playerLocation, 1, black);
                            }
                        }

                        if (board[playerLocation + width] === block && board[playerLocation + (width * 2)] !== red) {
                            if (board[playerLocation + (width * 2)] === goal) win = true;

                            board.splice(playerLocation + (width * 2), 1, block);
                            board.splice(playerLocation + width, 1, player);
                            board.splice(playerLocation, 1, onGoal ? goal : black);
                            onGoals.set(message.author.id, false);
                        }

                        valid = true;
                        moves++
                        break;
                    }

                    case 'L': {
                        if (board[playerLocation - 1] === black) {
                            if (board[playerLocation + 1] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                if (onGoal === true) win = true;
                                onGoals.set(message.author.id, false);

                                board.splice(playerLocation - 1, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation + 1, 1, black);
                            
                            } else {
                                board.splice(playerLocation - 1, 1, player);
                                board.splice(playerLocation, 1, onGoal ? goal : black);
                                onGoals.set(message.author.id, false);
                            }
                        }

                        if (board[playerLocation - 1] === goal) {
                            onGoals.set(message.author.id, true);

                            if (board[playerLocation + 1] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                board.splice(playerLocation - 1, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation + 1, 1, black);
                            
                            } else {
                                board.splice(playerLocation - 1, 1, player);
                                board.splice(playerLocation, 1, black);
                            }
                        }

                        if (board[playerLocation - 1] === block && board[playerLocation - 2] !== red) {
                            if (board[playerLocation - 2] === goal) win = true;
            
                            board.splice(playerLocation - 2, 1, block);
                            board.splice(playerLocation - 1, 1, player);
                            board.splice(playerLocation, 1, onGoal ? goal : black);
                            onGoals.set(message.author.id, false);
                        }

                        valid = true;
                        moves++
                        break;
                    }

                    case 'R': {
                        if (board[playerLocation + 1] === black) {
                            if (board[playerLocation - 1] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                if (onGoal === true) win = true;
                                onGoals.set(message.author.id, false);

                                board.splice(playerLocation + 1, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation - 1, 1, black);
                            
                            } else {
                                board.splice(playerLocation + 1, 1, player);
                                board.splice(playerLocation, 1, onGoal ? goal : black);
                                onGoals.set(message.author.id, false);
                            }
                        }

                        if (board[playerLocation + 1] === goal) {
                            onGoals.set(message.author.id, true);

                            if (board[playerLocation - 1] === block && grabbed === true) {
                                grabbers.set(message.author.id, false);

                                board.splice(playerLocation + 1, 1, player);
                                board.splice(playerLocation, 1, block);
                                board.splice(playerLocation - 1, 1, black);
                            
                            } else {
                                board.splice(playerLocation + 1, 1, player);
                                board.splice(playerLocation, 1, black);
                            }
                        }

                        if (board[playerLocation + 1] === block && board[playerLocation + 2] !== red) {
                            if (board[playerLocation + 2] === goal) win = true;
            
                            board.splice(playerLocation + 2, 1, block);
                            board.splice(playerLocation + 1, 1, player);
                            board.splice(playerLocation, 1, onGoal ? goal : black);
                            onGoals.set(message.author.id, false);
                        }

                        valid = true;
                        moves++
                        break;
                    }

                    case 'G': {
                        grabbers.set(message.author.id, true);
                        board.splice(playerLocation, 1, grabbing);

                        valid = true;
                        moves++
                        break;
                    }

                    case 'C': {
                        const newLevel = level + 1;

                        let newHeight = height - 2;
                        let newWidth = width - 3;

                        if (newLevel < 20) {
                            newHeight = 2 * Math.floor((newLevel / 10) + 2);
                            newWidth = 3 * Math.floor((newLevel / 10) + 2);
                        }

                        heights.set(message.author.id, newHeight);
                        widths.set(message.author.id, newWidth);
                        await newGame(newWidth, newHeight, newLevel);
                        break;
                    }

                    case 'Q': {
                        games.delete(message.author.id);
                        messages.delete(message.author.id);
                        levels.delete(message.author.id);
                        widths.delete(message.author.id);
                        heights.delete(message.author.id);
                        onGoals.delete(message.author.id);
                        break;
                    }
                }

                if (valid === true && win === false) {
                    counters.set(message.author.id, moves);
                    const embed = new discord.MessageEmbed()
                        .setAuthor(`Level ${level}`)
                        .setDescription(board.join(''))
                        .setFooter(`Number of moves: ${moves}`);

                    await gameMessage.edit(embed);
                }
            
                if (win === true) {
                    const embed = new discord.MessageEmbed()
                        .setAuthor(`Level ${level}`)
                        .setDescription(board.join(''))
                        .setFooter(`Number of moves: ${moves}`)
                        .setColor(0x77B255);

                    await gameMessage.edit(embed);
                }

                setTimeout(async () => {
                    if ((index + 1) === plays.length && valid === true && win === false) {
                        games.set(message.author.id, JSON.parse(reset));
                        counters.set(message.author.id, 0);

                        const embed = new discord.MessageEmbed()
                            .setAuthor(`Level ${level}`)
                            .setDescription(start)
                            .setFooter('Number of moves: 0');

                        await gameMessage.edit(embed);
                    }

                }, 1000);

            }, index * 1500);
        });
    }
});

client.login(process.env.token);
