const { Client, RichPresence, CustomStatus, WebhookClient } = require("discord.js-selfbot-v13");
const moment = require('moment')
const config = require("./config.json")
const Webhook = new WebhookClient({url: config.webhook})

const client = new Client();

client.on('ready', async () => {

    Log(`${client.user.tag}`,"READY")

    function Log(message, type) {
        console.log(`[${moment().format()}][${client.user.id}][${type}]${message}`);
        Webhook.send(`\`\`\`[${moment().format()}][${client.user.id}][${type}]${message}\`\`\``);
    }
    
    process.on('unhandledRejection', (error) => Log(error.message, "ERROR"));
    process.on('uncaughtException', (error) => Log(error.message, "ERROR"));


    if(config.activity.enabled){
        const custom = new CustomStatus(client).setEmoji(config.activity.emoji).setState(config.activity.state)
        client.user.setPresence({ activities: [custom]})
    }
    
    if(config["rich-presence"].enabled){
        const getExtendURL = await RichPresence.getExternal(
            client,
            config["rich-presence"]["application-id"],
            config["rich-presence"]["assets"]["large-image"],
            config["rich-presence"]["assets"]["small-image"],
          );
        const status = new RichPresence(client)
        .setApplicationId(config["rich-presence"]["application-id"])
        .setType(config["rich-presence"].type)
        .setURL(config["rich-presence"].url)
        .setState(config["rich-presence"].state)
        .setName(config["rich-presence"].name)
        .setDetails(config["rich-presence"].details)
        .setParty({
            max: config["rich-presence"].party.max || 1,
            current: config["rich-presence"].party.size || 1
        })
        .setStartTimestamp(Date.now())
        .setAssetsLargeImage(getExtendURL[0].external_asset_path)
        .setAssetsLargeText(config["rich-presence"]["assets"]["large-text"])
        .setAssetsSmallImage(getExtendURL[1].external_asset_path)
        .setAssetsSmallText(config["rich-presence"]["assets"]["small-text"])
        .setButtons(
            { name: config["rich-presence"].buttons.primary.label, url: config["rich-presence"].buttons.primary.url},
            { name: config["rich-presence"].buttons.secondary.label, url: config["rich-presence"].buttons.secondary.url}
            )
    
        client.user.setPresence({ activities: [status]})
    }
    
    if(config["auto-dm"].enabled){
       client.on('messageCreate', (message) => {
            if(message.channel.type != "DM" || message.author.id === client.user.id || message.author.bot) return
    
            if(config["auto-dm"]["only-respond-if-new"]){
                if(message.channel.messages.cache.size === 1){
                    message.channel.send(config["auto-dm"].message)
                }
            } else {
                message.channel.send(config["auto-dm"].message)
            }
       })
    }
    
    if(config["auto-respond"].enabled){
        client.on('messageCreate', (message) => {
            if(message.author.id === client.user.id || message.author.bot) return
    
            if(message.content.toLowerCase() === config["auto-respond"].trigger.toLowerCase()){
                message.channel.send(config["auto-respond"].response)
            }
        })
    }
    
    if(config.campaign.enabled){
        for(const channel of config.campaign.channels){
            const channelObject = client.channels.cache.get(channel.id)
            if(channelObject){
                await client.channels.cache.get(channel.id).send(channel.message)
                setInterval(async () => {
                    await client.channels.cache.get(channel.id).send(channel.message)
                    Log(`[${channel.id}]`,"SENT")
                }, channel.delay); 
            } else {
                Log(`[${channel.id}]`,"NOT FOUND")
            }
        }
    }
})

client.login(config.token)