"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var parseString = require('xml2js').parseString;
var request = require('request');
var parseJson = require('parse-json');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));
bot.set('storage', tableStorage);

bot.dialog('/', function (session) {

    // 날씨
    if(session.message.text.includes("날씨")){

        request('http://www.weather.go.kr/wid/queryDFSRSS.jsp?zone=4113554500', function (error, response, body) {
            
            //   console.log('error:', error); // Print the error if one occurred
            //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            parseString(body, function (err, result) {
                wdata = result.rss.channel[0].item[0].description[0].body[0].data
                console.dir(wdata);
                for(var idx in wdata){
                    if(wdata[idx].day == 1 && wdata[idx].hour == 12){

                        console.log("오늘 " + wdata[idx].hour + "시 온도는 " + wdata[idx].temp + "도 입니다.");

                    }

                }
            });

        });

    }else if(session.message.text.includes("환율")){ // 환율

        request('http://earthquake.kr/exchange', function (error, response, body) {
            //   console.log('error:', error); // Print the error if one occurred
            //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            var obj = JSON.parse(body);
            console.log(obj.USDKRW);
            session.send('현재 미국 1달러에 대한 환율은 '+obj.USDKRW+'원입니다.');

        });
        
    }else if(session.message.text.includes("시세")){// 비트코인 시세
        
        request('https://api.korbit.co.kr/v1/ticker', function (error, response, body) {
            //   console.log('error:', error); // Print the error if one occurred
            //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            var obj = JSON.parse(body);
            console.log(obj.last);
            session.send('현재 비트코인의 시장가는 '+obj.last+'원입니다.');
            
        });

    }

});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = connector.listen();
}
