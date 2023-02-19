// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {
  dialogflow,
  Permission,
  Suggestions,
} = require('actions-on-google')
const CONSTANTS = require('./common/constants');
const utility = require('./common/utility');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const nextActionList = ['change date', 'change destination', 'start over', 'custom date'];

// Create an app instance
const app = dialogflow();

let user = {name:'',location:''};
 
  function welcome(agent) {
    conv.ask('🙏 Welcome!!!');
  }
 
  function fallback(agent) {
    conv.ask(`I didn't understand`);
    conv.ask(`I'm sorry, can you try again?`);
  }

  function bookTrainTicket(conv){
    let originStation = conv.parameters.trainOriginStation;
    let destinationStation = conv.parameters.trainDestinationStation;
    if(!user.location){
      console.log('INSIDE LOCATION PERMISSISON');
      conv.ask(new Permission({
        context: 'To know your city',
        permissions: 'DEVICE_PRECISE_LOCATION',
      }))
    }
    if(!originStation){
      console.log('INSIDE ORIGIN');
      conv.ask(`What would be the origin station for this journey?`);
      if(user.location && user.location !== 'PERMISSION DENIED'){
        conv.ask(new Suggestions(`🚩 ${user.location}`));
      }
      conv.ask(new Suggestions(`New Delhi`), new Suggestions(`Prayagraj`));
    }
    else if(!destinationStation){
      let newContext = conv.contexts.get(CONSTANTS.Contexts.ShowBookTicketsData);
      if(newContext && !newContext.parameters._destinationStation){
        conv.ask(newContext.parameters.retryText);
        if(user.location && originStation != user.location && user.location !== 'PERMISSION DENIED'){
          conv.ask(new Suggestions(`🚩 ${user.location}`));
        }
        conv.ask(new Suggestions(`Start over`), new Suggestions(`Pune`));
      }else{
        conv.ask(`Can you please help me with the destination station?`);
        if(user.location && originStation != user.location && user.location !== 'PERMISSION DENIED'){
          conv.ask(new Suggestions(`🚩 ${user.location}`));
        }
        conv.ask(new Suggestions(`Patna`), new Suggestions(`Pune`));
      }
      
    }
    else if(originStation && originStation === destinationStation){
      const errorMsg = 'Sorry! Origin and destination stations cannot be same. Please select a new destination station or start again.';
      conv.contexts.set(CONSTANTS.Contexts.ShowBookTicketsData, 1, { '_originStation': originStation, '_destinationStation': '', 'retryText': errorMsg });
      conv.followup(CONSTANTS.Events.BookTicket);
    }
    else{
      const successMsg = `OK! Trying to book a train ticket from ${originStation} to ${destinationStation}...
      For when do you want to book the train tickets?`;
      conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': successMsg});
      conv.followup(CONSTANTS.Events.TravelPlan);
    }
  }

  function planTravelDates(conv){
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let originStation = context.parameters.trainOriginStation;
    let destinationStation = context.parameters.trainDestinationStation;
    
    const todayDate = new Date();
    
    const tomorrowDate = new Date((new Date).setDate(todayDate.getDate() + 1));
    const threeDaysFromNow = new Date((new Date).setDate(todayDate.getDate() + 3));
    const weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let travelDate = conv.parameters.travelDate;
    let nextAction = context.parameters.nextAction;
    console.log('conv.query');
    if(conv.query && nextActionList.indexOf(conv.query.toLowerCase()) > -1){
      nextAction = conv.query;
    }
    console.log("next action " +nextAction);
    travelDate = new Date(travelDate);
    console.log('today date'+ todayDate.toLocaleDateString());
    console.log('today date'+ tomorrowDate.toLocaleDateString());
    console.log("travel date " +travelDate.toLocaleDateString());

    if(!utility.isDateValid(travelDate) && !nextAction){
      conv.ask(context.parameters.retryText);
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(`${weekEnum[threeDaysFromNow.getDay()]} (${threeDaysFromNow.toLocaleDateString()})`));
      conv.ask(new Suggestions('Custom Date'));
    }
    else if(nextAction === 'Change Date'){
      console.log('change date function reached')
      conv.ask(`Please select a new Date.`);
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(`${weekEnum[threeDaysFromNow.getDay()]} (${threeDaysFromNow.toLocaleDateString()})`));
      conv.ask(new Suggestions('Custom'));
      conv.parameters.travelDate = null;
      conv.parameters.nextAction = null;
      conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please select a new Date.', 'travelDate': null, 'nextAction':null });
    }
    else if(nextAction === 'Change Destination'){
      console.log('change destination reached')
      conv.contexts.set(CONSTANTS.Contexts.ShowBookTicketsData, 3, { '_originStation': originStation, '_destinationStation': '' });
      conv.followup(CONSTANTS.Events.BookTicket);
    }
    else if(nextAction === 'Custom Date'){
      console.log('custom date reached')
      conv.ask('Please enter custom date (dd/mm/yyyy)');
      conv.parameters.travelDate = null;
      conv.parameters.nextAction = null;
      conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please enter custom date (dd/mm/yyyy)', 'travelDate': null, 'nextAction':null });
    }
    else if(nextAction === 'Start Over'){
      console.log('Start Over');
      for(let context of conv.contexts){
        conv.context.delete(context.name);
      }
      conv.followup('Google Assistant Welcome');
    }
    else{
      if(utility.isDateValid(travelDate) && travelDate.toLocaleDateString() === tomorrowDate.toLocaleDateString()){
        conv.ask('No trains are available for tomorrow.');
        conv.ask(new Suggestions('Change Date'));
        conv.ask(new Suggestions('Change Destination'));
        conv.ask(new Suggestions('Start Over'));
        conv.parameters.travelDate = null;
        conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please select a new Date.', 'travelDate': null });
      }
      else if(travelDate < todayDate){
        console.log("date cannot be in past");
        conv.ask('date of journey cannot be in past');
        conv.ask(new Suggestions('Change Date'));
        conv.ask(new Suggestions('Change Destination'));
        conv.ask(new Suggestions('Start Over'));
        conv.parameters.travelDate = null;
        conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please select a new Date.', 'travelDate': null });
      }
      else if(utility.isDateValid(travelDate)){
        conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': `Setting travel date for ${travelDate.toLocaleDateString()}`, 'travelDate': travelDate.toLocaleDateString() });
        conv.followup(CONSTANTS.Events.TrainClass);
      }
      
    }
  }

  function selectTravelClass(conv) {
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let travelClass = conv.parameters.travelClass;
    console.log('Finally');
    console.log(context);
    let nextAction = context.parameters.nextAction;
    if(conv.query && nextActionList.indexOf(conv.query.toLowerCase()) > -1){
      nextAction = conv.query;
    }
    if(!travelClass){
      conv.ask('Which class do you want to travel?')
      conv.ask(new Suggestions('EC'), new Suggestions('1AC', new Suggestions('2AC'), new Suggestions('3AC')));
      conv.ask(new Suggestions('Change Destination'));
      conv.ask(new Suggestions('Start Over'));
    }
    else if(nextAction === 'Change Destination'){
      console.log('change destination reached')
      conv.contexts.set(CONSTANTS.Contexts.ShowBookTicketsData, 3, { '_originStation': originStation, '_destinationStation': '' });
      conv.followup(CONSTANTS.Events.BookTicket);
    }
    else if(nextAction === 'Custom Date'){
      console.log('custom date reached')
      conv.ask('Please enter custom date (dd/mm/yyyy)');
      conv.parameters.travelDate = null;
      conv.parameters.nextAction = null;
      conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please enter custom date (dd/mm/yyyy)', 'travelDate': null, 'nextAction':null });
    }
    else if(nextAction === 'Start Over'){
      console.log('Start Over');
      for(let context of conv.contexts){
        conv.context.delete(context.name);
      }
      conv.followup('Google Assistant Welcome');
    }
    else{
      conv.ask('ab to samjho ho gaya');
      conv.close();
    }
  }

  app.intent(CONSTANTS.Intents.DefaultWelcomeIntent, welcome);
  app.intent(CONSTANTS.Intents.DefaultFallbackIntent, fallback);
  app.intent(CONSTANTS.Intents.BookTrainTicket, bookTrainTicket);
  app.intent(CONSTANTS.Intents.TrainTravelPlan, planTravelDates);
  app.intent(CONSTANTS.Intents.TrainTravelClass, selectTravelClass);

 // Create a Dialogflow intent with the `actions_intent_PERMISSION` event
  app.intent(CONSTANTS.Intents.GetLocationPermission, (conv, params, granted) => {
    // granted: inferred first (and only) argument value, boolean true if granted, false if not
    const explicit = conv.arguments.get('PERMISSION') // also retrievable w/ explicit arguments.get
    if(explicit){
      console.log('location received : '+ explicit);
      console.log(conv.device.location);
      user.location = conv.device.location.city;
    }else{
      console.log('Location permission not granted');
      user.location = 'PERMISSION DENIED';
    }
    conv.followup(CONSTANTS.Events.BookTicket);
  })


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

