const discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const logger = require('@jakeyprime/logger');

const client = new discord.Client();
const games = new discord.Collection();
const messages = new discord.Collection();
const moves = new discord.Collection();
const levels = new discord.Collection();

client.on('ready', async () => {logger.info('Bot ready')});

client.on('message', async (message) => {
    const black = ':black_large_square:'
    const red = ':red_square:'
    const goal = ':negative_squared_cross_mark:'
    const block = ':brown_square:'
    const player = ':flushed:'

    async function newGame() {
        const board = [
            red,  red,   red,   red,   red,   red,   red,   red,  red, '\n',
            red, black, black, black, black, black, black, black, red, '\n',
            red, black, black, black, black, black, black, black, red, '\n',
            red, black, black, black, black, black, black, black, red, '\n',
            red, black, black, black, black, black, black, black, red, '\n',
            red,  red,   red,   red,   red,   red,   red,   red,  red, '\n'
        ];

        async function randomize() {
            const playerLocation = Math.floor(Math.random() * board.length);
            const goalLocation = Math.floor(Math.random() * board.length);
            const blockLocation = Math.floor(Math.random() * board.length);
        
            if (board[playerLocation] !== black) {
                randomize();
                return;
            }
        
            if (board[goalLocation] !== black) {
                randomize();
                return;
            }
        
            if (board[blockLocation] !== black) {
                randomize();
                return;
            }
        
            board.splice(playerLocation, 1, player);
            board.splice(goalLocation, 1, goal);
            board.splice(blockLocation, 1, block);
        
            return board;
        }

        await randomize();

        const embed = new MessageEmbed()
            .setAuthor(`Level 1`)
            .setDescription(board.join(''))
            .setFooter('Enter direction (w, a, s, d) or r to reset');

        const start = await message.channel.send(embed);

        games.set(message.author.id, board);
        messages.set(message.author.id, start);
        levels.set(message.author.id, 1);
        
        logger.info('Game Start');
    }

    if (message.author.bot) return;
    if (message.content.startsWith(process.env.prefix + 'start')) newGame();

    if (games.has(message.author.id)) {
        const board = games.get(message.author.id);
        const gameMessage = messages.get(message.author.id);
        const playerLocation = board.indexOf(player);

        let level = levels.get(message.author.id);
        let win = false;

        switch (message.content) {
            case 'w': {
                if (board[playerLocation - 10] === black) {
                    board.splice(playerLocation - 10, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                if (board[playerLocation - 10] === block && board[playerLocation - 20] !== red) {
                    if (board[playerLocation - 20] === goal) win = true;

                    board.splice(playerLocation - 20, 1, block);
                    board.splice(playerLocation - 10, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'a': {
                if (board[playerLocation - 1] === black) {
                    board.splice(playerLocation - 1, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                if (board[playerLocation - 1] === block && board[playerLocation - 2] !== red) {
                    if (board[playerLocation - 2] === goal) win = true;
    
                    board.splice(playerLocation - 2, 1, block);
                    board.splice(playerLocation - 1, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 's': {
                if (board[playerLocation + 10] === black) {
                    board.splice(playerLocation + 10, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                if (board[playerLocation + 10] === block && board[playerLocation + 20] !== red) {
                    if (board[playerLocation + 20] === goal) win = true;
    
                    board.splice(playerLocation + 20, 1, block);
                    board.splice(playerLocation + 10, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'd': {
                if (board[playerLocation + 1] === black) {
                    board.splice(playerLocation + 1, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                if (board[playerLocation + 1] === block && board[playerLocation + 2] !== red) {
                    if (board[playerLocation + 2] === goal) win = true;
    
                    board.splice(playerLocation + 2, 1, block);
                    board.splice(playerLocation + 1, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'W': {
                if (board[playerLocation + 10] === block && board[playerLocation - 10] === black) {
                    board.splice(playerLocation - 10, 1, player);
                    board.splice(playerLocation, 1, block);
                    board.splice(playerLocation + 10, 1, black);
                }
                
                if (board[playerLocation - 10] === black) {
                    board.splice(playerLocation - 10, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'A': {
                if (board[playerLocation + 1] === block && board[playerLocation - 1] === black) {
                    board.splice(playerLocation - 1, 1, player);
                    board.splice(playerLocation, 1, block);
                    board.splice(playerLocation + 1, 1, black);
                }

                if (board[playerLocation - 1] === black) {
                    board.splice(playerLocation - 1, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'S': {
                if (board[playerLocation - 10] === block && board[playerLocation + 10] === black) {
                    board.splice(playerLocation + 10, 1, player);
                    board.splice(playerLocation, 1, block);
                    board.splice(playerLocation - 10, 1, black);
                }

                if (board[playerLocation + 10] === black) {
                    board.splice(playerLocation + 10, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'D': {
                if (board[playerLocation - 1] === block && board[playerLocation + 1] === black) {
                    board.splice(playerLocation + 1, 1, player);
                    board.splice(playerLocation, 1, block);
                    board.splice(playerLocation - 1, 1, black);
                }

                if (board[playerLocation + 1] === black) {
                    board.splice(playerLocation + 1, 1, player);
                    board.splice(playerLocation, 1, black);
                }

                break;
            }

            case 'r': {
                newGame();
                break;
            }

            case 'c': {
                levels.set(message.author.id, level++);
                newGame();
                break;
            }

            case 'q': {
                games.delete(message.author.id);
                break;
            }
        }

        if (win === true) {
            const embed = new MessageEmbed()
                .setAuthor(`Level ${level}`)
                .setDescription(board.join(''))
                .setFooter('Enter c to continue or q to quit')
                .setColor(0x77B255);

            await gameMessage.edit(embed);
            await message.delete();

            return;
        }

        const embed = new MessageEmbed()
            .setAuthor(`Level ${level}`)
            .setDescription(board.join(''))
            .setFooter('Enter direction (w, a, s, d) or r to reset');

        await gameMessage.edit(embed);
        await message.delete();
    }
});

client.login(process.env.token);
