"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var parseString = require('xml2js').parseString;
var request = require('request');
var parseJson = require('parse-json');
var tuc = require('temp-units-conv');

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

        request('http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=77bd3b7b107f90d1879f49fb1637dd25', function (error, response, body) {

            //   console.log('error:', error); // Print the error if one occurred
            //   console.log('statusCode:', response && response.statusCode);
            console.log('body:', body); // Print the HTML for the Google homepage.
            var obj = JSON.parse(body);
            console.log(obj.main.temp);
            session.send('현재 서울 온도는 '+tuc.k2c(obj.main.temp)+'도입니다.');

        });

    }else if(session.message.text.includes("환율")){ // 환율

        request('http://earthquake.kr/exchange', function (error, response, body) {
            //   console.log('error:', error); // Print the error if one occurred
            //   console.log('statusCode:', response && response.statusCode);
            console.log('body:', body); // Print the HTML for the Google homepage.
            var obj = JSON.parse(body);
            console.log(obj.USDKRW);
            session.send('현재 미국 1달러에 대한 환율은 '+obj.USDKRW+'원입니다.');

        });
        
    }else if(session.message.text.includes("시세")){// 비트코인 시세
        
        request('https://api.korbit.co.kr/v1/ticker', function (error, response, body) {
            //   console.log('error:', error); // Print the error if one occurred
            //   console.log('statusCode:', response && response.statusCode);
            console.log('body:', body); // Print the HTML for the Google homepage.
            var obj = JSON.parse(body);
            console.log(obj.last);
            session.send('현재 비트코인의 시장가는 '+obj.last+'원입니다.');
            
        });

    }else{
        session.send("좋은 질문이네요. 하지만 저도 아직 잘 모르겠어요. 나중에 좀더 알아보도록 할께요");
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
