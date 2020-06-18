const notifier = require('node-notifier');
const { config } = require('./config');
const telegramBot = require('./telegram-bot');
const cache = {};

module.exports = {
    notifyIfChanged
};

function notifyIfChanged(businesses) {
    const options = config.get('notifications');
    const message = filterOnlyAvailable(createMessage(businesses));

    if(options.console.enabled){
        notifyConsole(message, options.console);
    }
    
    if(cache.message !== message){
        if(options.desktop.enabled){
            notifyDesktop(message)
        }
        if(options.telegram.enabled){
            telegramBot.notify(message);
        }
        cache.message = message;
    }
}
function filterOnlyAvailable(message){
    const a = message.split("\n");
    var filteredMessage = "Hier sind deine aktuellen Angebote:\n";
    var i;

    // Only show offers with available stock
    for(i=0; i<a.length;i++){
        number = parseInt(a[i][a[i].length-1]);
        if(number > 0){
            filteredMessage += (a[i]);
            filteredMessage += "\n";
        }
    }
    if(!filteredMessage){
        return "Zurzeit gibt es bei keinem deiner Favoriten Angebote :("
    }
    return filteredMessage;
}
function notifyConsole(message, options){

    if(options.clear){
        console.clear();
    }


    console.log(message + '\n');
}

function notifyDesktop(message){
    notifier.notify({ title: 'TooGoodToGo', message });
}

function createMessage(businesses){
    return businesses
        .map(business => `${ business.display_name } - ${business.items_available}`)
        .join('\n');
}
