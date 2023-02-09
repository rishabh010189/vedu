// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    
    let conv = agent.conv();
     conv.ask(`HI, I am your travel planner.
You can ask me to book your train ticket(s) and car rental.`);
     agent.add(conv);
    conv.ask(new Card({
       title: `Book Train Tickets`,
         imageUrl: 'data:image/png;base64,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',
         text: ``,
         buttonText: 'Book Train Tickets',
         buttonUrl: 'https://assistant.google.com/'
    }));
    agent.add(conv);
    conv.ask(new Suggestion(`Nothing`));
    agent.add(conv);
    conv.ask(new Suggestion(`NA`));
    agent.add(conv);
    agent.add(new Suggestion(`Book Train Tickets`));
    agent.add(new Suggestion(`Rent Car`));
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function weatherReport(agent){
    console.log("CHeck me" + agent.parameters);
    console.log(agent.parameters.location);
    console.log('end');
  	agent.add(`HI there!! your message is received in the weather fullfilment center`);
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('weather', weatherReport);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
