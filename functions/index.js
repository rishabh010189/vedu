// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {
  dialogflow,
  Image,
  Suggestions,
} = require('actions-on-google')

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// Create an app instance
const app = dialogflow();
 
  function welcome(agent) {
    agent.add(' Yahooo eurekaaa!!!');
    agent.add('eurekaaa!!!');
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function bookTrainTicket(conv){
    let originStation = conv.parameters.trainOriginStation;
    let destinationStation = conv.parameters.trainDestinationStation;
    console.log('Origin: ' + originStation);
    console.log('destination: ' + destinationStation);
    if(conv.queryResult && conv.queryResult.queryText === 'Start over'){
      console.log('starting over...');
      const errorMsg = 'Ok! previous journey scrapped. Please select a new origin station to begin.';
      conv.contexts.set('show-book-tickets-data', 1, { '_originStation': '', '_destinationStation': '', 'retryText': errorMsg });
      conv.followup('event-book-ticket');
    }
    if(!originStation){
      conv.ask(`What would be the origin station for this journey?`);
      conv.ask(new Suggestions(`New Delhi`), new Suggestions(`Prayagraj`));
    }
    else if(!destinationStation){
      let newContext = conv.contexts.get('show-book-tickets-data');
      if(newContext && !newContext.parameters._destinationStation){
        conv.ask(newContext.parameters.retryText);
        conv.ask(new Suggestions(`Start over`), new Suggestions(`Pune`));
      }else{
        conv.ask(`Can you please help me with the destination station?`);
        conv.ask(new Suggestions(`Patna`), new Suggestions(`Pune`));
      }
      
    }
    else if(originStation && originStation === destinationStation){
      const errorMsg = 'Sorry! Origin and destination stations cannot be same. Please select a new destination station or start again.';
      conv.contexts.set('show-book-tickets-data', 1, { '_originStation': originStation, '_destinationStation': '', 'retryText': errorMsg });
      conv.followup('event-book-ticket');
    }
    else{
      const successMsg = `OK! Trying to book a train ticket from ${originStation} to ${destinationStation}...
      For when do you want to book the train tickets?`;
      conv.contexts.set('journey-stations-data', 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': successMsg});
      conv.followup('event-travel-plan');
    }
  }

  function planTravelDates(conv){
    let context = conv.contexts.get('journey-stations-data');
    let originStation = context.parameters.trainOriginStation;
    let destinationStation = context.parameters.trainDestinationStation;
    
    const todayDate = new Date();
    
    const tomorrowDate = new Date((new Date).setDate(todayDate.getDate() + 1));
    const threeDaysFromNow = new Date((new Date).setDate(todayDate.getDate() + 3));
    const weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let travelDate = context.parameters.travelDate;
    let nextAction = context.parameters.nextAction;
    console.log("travel date " +travelDate);
    console.log(context);
    travelDate = new Date(travelDate);
    if(!utility.isDateValid(travelDate) && !nextAction){
      conv.ask(context.parameters.retryText);
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(`${weekEnum[threeDaysFromNow.getDay()]} (${threeDaysFromNow.toLocaleDateString()})`));
      conv.ask(new Suggestions('Custom'));
    }else{
      if(utility.isDateValid(travelDate) && travelDate.toLocaleDateString() === tomorrowDate.toLocaleDateString()){
        conv.ask('No Trains are available for tomorrow.');
        conv.ask(new Suggestions('Change Date'));
        conv.ask(new Suggestions('Change Destination'));
        conv.ask(new Suggestions('Start Over'));
        conv.contexts.set('journey-stations-data', 1, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': '', travelDate: null });
      }
      else if(utility.isDateValid(travelDate)){
        conv.contexts.set('journey-stations-data', 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Setting travel date for tomorrow', travelDate: travelDate.toLocaleDateString() });
        conv.followup('event-train-class');
      }
      else if(nextAction === 'Change Date'){
        const message = `Please select a new Date.`;
        conv.contexts.set('journey-stations-data', 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': message, travelDate: null });
        conv.followup('event-travel-plan');
      }
      else if(nextAction === 'Change Destination'){
        conv.contexts.set('show-book-tickets-data', 3, { '_originStation': originStation, '_destinationStation': '' });
        conv.followup('event-book-ticket');
      }
    }
  }

  function selectTravelClass() {
    let context = conv.contexts.get('journey-stations-data');
    conv.ask('Which class do you want to travel?')
    conv.ask(new Suggestions('EC'), new Suggestions('1AC', new Suggestions('2AC'), new Suggestions('3AC')));
  }

  var utility = {
    isDateValid : function (date){
      if ( Object.prototype.toString.call(date) === "[object Date]" ) {
        if ( !isNaN(date.getTime()) ) {
          return true
        } else {
            return false;
        }
      } else {
        return false;
      }
    }
  }


  app.intent('Default Welcome Intent', welcome);
  app.intent('Default Fallback Intent', fallback);
  app.intent('Book.train.ticket', bookTrainTicket);
  app.intent('Train.travel.plan', planTravelDates);
  app.intent('Train.travel.class', selectTravelClass);
// });

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
