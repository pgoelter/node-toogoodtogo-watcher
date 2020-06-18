const _ = require('lodash');
const Telegraf = require('telegraf');
const { config } = require('./config');
const cache = {};
let bot;

module.exports = {
    notify
};

function notify(message){
    cache.message = message;
    if(!bot){
        createBot();
    }
    const chats = config.get('notifications.telegram.chats');
    _.forEach(chats, chat => sendMessage(chat.id, message));
}

function sendMessage(chatId, message){
    return bot.telegram
        .sendMessage(chatId, message)
        .catch(error => {
            if(error.code === 403){
                removeChat(chatId);
            } else {
                console.error(`${error.code} - ${error.description}`);
            }
        });
}

function createBot(){
    const options = config.get('notifications.telegram');
    if(!options.enabled || !options.botToken){
        return null;
    }
    bot = new Telegraf(options.botToken);
    bot.command('start', startCommand);
    bot.command('stop', stopCommand);
    bot.launch();
    return bot;
}

function startCommand(context){
    addChat(context);
    context.reply("Ich bin der TooGoodToGoBot.\n \
    Wann immer sich das Angebot deiner Favoriten ändert \
bekommst du direkt von mir Bescheid.\n \
Um meine Benachrichtigungen wieder abzustellen kannst du diese (temporär) abschalten mit:\
    /stop");
    if(cache.message){
        context.reply(cache.message);
    }
}

function stopCommand(context){
    context.reply(`Ok.. Dann werde ich erstmal nicht weiter nerven.
Du kannst meine Benachrichtigungen wieder einschalten mit:
/start`);
    removeChat(context.chat.id);
}

function addChat(context){
    const chats = config.get('notifications.telegram.chats');
    const chat = {
        id: context.chat.id,
        firstName: context.from.first_name,
        lastName: context.from.last_name
    };
    config.set('notifications.telegram.chats', _.unionBy(chats, [chat], chat => chat.id));
    console.log(`Added chat ${chat.firstName} ${chat.lastName} (${chat.id})`);
}

function removeChat(chatId){
    const chats = config.get('notifications.telegram.chats');
    const chat = _.find(chats, { id: chatId });
    if(chat){
        config.set('notifications.telegram.chats', _.pull(chats, chat));
        console.log(`Removed chat ${chat.firstName} ${chat.lastName} (${chat.id})`);
    }
}
