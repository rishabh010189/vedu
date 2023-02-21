'use strict';
 
const functions = require('firebase-functions');
const {dialogflow,Permission,Suggestions, BasicCard, Button, Image} = require('actions-on-google');
const Nanoid = require('./node_modules/nanoid');

/**
 * Imports from custom modules
 * 
 */
const CONSTANTS = require('./common/constants');
const utility = require('./common/utility');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// Create an app instance
const app = dialogflow();

/**
 * global variables
 * 
 */
let user = {name:'',location:''};
let isSessionActive = false;
 
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
      conv.ask(new Permission({
        context: 'To know your city',
        permissions: 'DEVICE_PRECISE_LOCATION',
      }))
    }
    if(!originStation){
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
        conv.ask(new Suggestions(`Pune`), new Suggestions(`🔁 Start Over`));
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
      const successMsg = `OK! Trying to book a 🎫train ticket from ${originStation} to ${destinationStation}...
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
    const nextActionList = ['change date', 'custom date'];
    
    let travelDate = conv.parameters.travelDate;
    let nextAction = context.parameters.nextAction;
    if(conv.query && nextActionList.indexOf(conv.query.toLowerCase()) > -1){
      nextAction = conv.query;
    }
    travelDate = new Date(travelDate);

    if(!utility.isDateValid(travelDate) && !nextAction){
      conv.ask(context.parameters.retryText);
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(`${weekEnum[threeDaysFromNow.getDay()]} (${threeDaysFromNow.toLocaleDateString()})`));
      conv.ask(new Suggestions('Custom Date'));
    }
    else if(nextAction === 'Change Date'){
      conv.ask(`Please select a new Date.`);
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(`${weekEnum[threeDaysFromNow.getDay()]} (${threeDaysFromNow.toLocaleDateString()})`));
      conv.ask(new Suggestions('Custom'));
      conv.parameters.travelDate = null;
      conv.parameters.nextAction = null;
      conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please select a new Date.', 'travelDate': null, 'nextAction':null });
    }
    else if(nextAction === 'Custom Date'){
      conv.ask('Please enter custom date (dd/mm/yyyy)');
      conv.parameters.travelDate = null;
      conv.parameters.nextAction = null;
      conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please enter custom date (dd/mm/yyyy)', 'travelDate': null, 'nextAction':null });
    }
    else{
      if(utility.isDateValid(travelDate) && travelDate.toLocaleDateString() === tomorrowDate.toLocaleDateString()){
        conv.ask('No trains are available for tomorrow.');
        conv.ask(new Suggestions('Change Date'));
        conv.ask(new Suggestions('Change Destination'));
        conv.ask(new Suggestions('🔁 Start Over'));
        conv.parameters.travelDate = null;
        conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please select a new Date.', 'travelDate': null });
      }
      else if(travelDate.setHours(0,0,0,0) < todayDate.setHours(0,0,0,0)){
        conv.ask('date of journey cannot be in past');
        conv.ask(new Suggestions('Change Date'));
        conv.ask(new Suggestions('Change Destination'));
        conv.ask(new Suggestions('🔁 Start Over'));
        conv.parameters.travelDate = null;
        conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 3, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': 'Please select a new Date.', 'travelDate': null });
      }
      else if(utility.isDateValid(travelDate)){
        conv.contexts.set(CONSTANTS.Contexts.JourneyStationsData, 5, { '_originStation': originStation, '_destinationStation': destinationStation, 'retryText': `Setting travel date for ${travelDate.toLocaleDateString()}`, 'travelDate': travelDate.toLocaleDateString() });
        conv.followup(CONSTANTS.Events.TrainClass);
      }
      
    }
  }

  function selectTravelClass(conv) {
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let travelClass = conv.parameters.travelClass;
    if(!travelClass){
      conv.ask('Which class do you want to travel?')
      conv.ask(new Suggestions('EC'), new Suggestions('1AC'), new Suggestions('2AC'), new Suggestions('3AC'));
      conv.ask(new Suggestions('Change Destination'), new Suggestions('🔁 Start Over'));
    }
    else{
      conv.ask('Do you want to select seats 💺?');
      conv.ask(new Suggestions('Yes'), new Suggestions('No'));
    }
  }

  function changeDestination(conv){
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let originStation = context.parameters._originStation;
    conv.contexts.set(CONSTANTS.Contexts.ShowBookTicketsData, 3, { '_originStation': originStation, '_destinationStation': '', retryText: 'Can you please help me with the new destination station?' });
    conv.followup(CONSTANTS.Events.BookTicket, {trainOriginStation : originStation, trainDestinationStation:''});
  }

  function startOver(conv){
    conv.followup(CONSTANTS.Events.Welcome);
  }

  function manualSeatSelectionIntent(conv) {
    conv.followup(CONSTANTS.Events.TrainSeatSelection);
  }

  function randomSeatSelectionIntent(conv){
    conv.followup(CONSTANTS.Events.MakePayments);
  }

  function seatSelection(conv){
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let originStation = context.parameters._originStation;
    let destinationStation = context.parameters._destinationStation;
    let travelClass = context.parameters.travelClass;
    let travelDate = context.parameters.travelDate;
    let seatNumber = conv.parameters.seatNumber;
    if(!seatNumber){
      conv.ask(`Awesome! please select your seat/s for your journey from ${originStation} to ${destinationStation} for travel class : ${travelClass} scheduled on ${travelDate}.`);
      conv.ask(new Suggestions('A1'), new Suggestions('A2'), new Suggestions('B1'), new Suggestions('B2'), new Suggestions('C3'), new Suggestions('C4'));
    }else{
      conv.followup(CONSTANTS.Events.MakePayments);
    }
  }

  function makePayment(conv){
    conv.ask('Please complete payment by clicking here');
    conv.ask(new BasicCard({
      text: `Please complete payment by clicking ***here***  \n  \n`,
      subtitle: 'Payment Required',
      buttons: new Button({
        title: 'Make Payment',
        url: 'https://google.com/',
      }),
      image: new Image({
        url: 'https://cdn1.vectorstock.com/i/1000x1000/44/70/woman-make-payment-on-pos-vector-39814470.jpg',
        alt: 'Please complete payment',
      }),
      display: 'CROPPED',
    }));
    conv.ask(new Suggestions('Payment Completed'));
  }

  function paymentReceived(conv){
    let transactionId = Nanoid.nanoid();
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let originStation = context.parameters._originStation;
    let destinationStation = context.parameters._destinationStation;
    let travelClass = context.parameters.travelClass;
    let travelDate = context.parameters.travelDate;
    // setting a 20 sec timer for active session
    isSessionActive = true;
    user.journey = {
      originStation,
      destinationStation,
      travelClass,
      travelDate
    }
    setTimeout(() => {
      isSessionActive = false;
      delete user.journey;
    }, 20000);

    conv.ask(`Tickets booked with reference ID ${transactionId}`);
    conv.ask(new BasicCard({
      text: `Thank You for your payment!  \n Your tickets have been booked and your booking ID is ***${transactionId}***  \n  \n Do you want to rent a car 🚗 also?`,
      subtitle: 'Payment Received',
      image: new Image({
        url: 'https://cashfreelogo.cashfree.com/website/landings/instant-settlements/payment-done.png',
        alt: 'Payment Received',
      }),
      display: 'CROPPED',
    }));
    conv.ask(new Suggestions('Yes'), new Suggestions('No'));
  }

  function paymentReceivedYes(conv){
    let context = conv.contexts.get(CONSTANTS.Contexts.JourneyStationsData);
    let destinationStation = context.parameters._destinationStation;
    let travelDate = context.parameters.travelDate;
    conv.contexts.set(CONSTANTS.Contexts.CarRentData, 3, {rentalCity:destinationStation, rentalDate:travelDate});
    conv.followup(CONSTANTS.Events.CarSelection);
    conv.ask('Please proceed to select car type');
  }

  function rentCarFlowCheck(conv){
    if(isSessionActive && user.journey){
      // let destinationStation = context.parameters._destinationStation;
      conv.contexts.set(CONSTANTS.Contexts.UserTicketsData, 3, user.journey);
      conv.followup(CONSTANTS.Events.RentCarForUser);
    }else{
      conv.followup(CONSTANTS.Events.RentCarForGuest);
    }
  }

  function rentCarForUser(conv){
    let context = conv.contexts.get(CONSTANTS.Contexts.UserTicketsData);
    conv.ask('Eurekaaa');
    if(context){
      let destinationStation = context.parameters.destinationStation;
      conv.ask(`Do you want to rent car at your destination city 🏡 ${destinationStation}?`);
      conv.ask(new Suggestions('Yes'), new Suggestions('No'));
    }
  }

  function rentCarForGuest(conv){
    let destinationCity = conv.parameters.destinationCity;
    let rentalDate = conv.parameters.rentalDate;
    const todayDate = new Date();
    const tomorrowDate = new Date((new Date).setDate(todayDate.getDate() + 1));
    rentalDate = new Date(rentalDate);
    let customDateConstant = 'custom date (dd/mm/yyyy)';
    if(!destinationCity){
      conv.parameters.rentalDate = null;
      conv.ask('Please provide location for your car rental?');
      conv.ask(new Suggestions('Delhi'), new Suggestions('Jaipur'), new Suggestions('Lucknow'));
    }
    else if(conv.query && conv.query === customDateConstant){
      conv.parameters.rentalDate = null;
      conv.ask(`Please enter a valid date in the format dd/mm/yyyy`);
    }
    else if(!utility.isDateValid(rentalDate)){
      conv.ask('For when do you want to rent car?');
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(customDateConstant));
    }
    else if(rentalDate.setHours(0,0,0,0) < todayDate.setHours(0,0,0,0)){
      conv.parameters.rentalDate = null;
      conv.parameters.destinationCity = destinationCity;
      conv.ask("Rental date cannot be in the past, please select a new date");
      conv.ask(new Suggestions('today'), new Suggestions('tomorrow'), new Suggestions(customDateConstant));
    }
    else if(utility.isDateValid(rentalDate)){
      conv.contexts.set(CONSTANTS.Contexts.CarRentData, 5, {rentalCity:destinationCity, rentalDate});
      conv.followup(CONSTANTS.Events.CarSelection);
      conv.ask('Please proceed to select car type');
    }
    else{
      conv.parameters.rentalDate = null;
    }
  }

  function rentCarForUserActionNo(conv){
    conv.followup(CONSTANTS.Events.RentCarForGuest);
  }

  function rentCarForUserActionYes(conv){
    let carRentContext = conv.contexts.get(CONSTANTS.Contexts.UserTicketsData);
    let rentalCity = carRentContext.parameters.destinationStation;
    let rentalDate = carRentContext.parameters.travelDate;
    conv.contexts.set(CONSTANTS.Contexts.CarRentData, 5, {rentalCity, rentalDate});
    conv.followup(CONSTANTS.Events.CarSelection);
    conv.ask('Please proceed to select car type');
  }

  function selectCar(conv){
    let carRentContext = conv.contexts.get(CONSTANTS.Contexts.CarRentData);
    let rentalCity = carRentContext.parameters.rentalCity;
    let rentalDate = carRentContext.parameters.rentalDate;
    if(!utility.isDateValid(rentalDate) && rentalDate.indexOf('/') > -1){
      let dateArr = rentalDate.split('/'); //[dd/mm/yyy]
      let month = dateArr[1].length === 1 ? ('0'+dateArr[1]) : dateArr[1];
      let date = dateArr[0].length === 1 ? ('0'+dateArr[0]) : dateArr[0];
      rentalDate = new Date("'"+ month + "," + date + "," + dateArr[2] + "'").toLocaleDateString();
    }else{
      rentalDate  = new Date(carRentContext.parameters.rentalDate).toLocaleDateString();
    }
    let selectedCar = conv.parameters.carType;
    if(!selectedCar){
      conv.ask(`Please select from below available cars:`);
      conv.ask(new Suggestions('🚘 Hyundai i20'), new Suggestions('🚗 MG Hector'), new Suggestions('⚡Tata Tiago EV'), new Suggestions('🏎️ Ford Ecosport'))
    }else{
      let transactionId = Nanoid.nanoid();
      conv.ask(`Car booked with reference ID ${transactionId}`);
      conv.ask(new BasicCard({
        text: `Great! Your booking ID ***${transactionId}*** has been confirmed for ***${selectedCar}*** on ***${rentalDate}*** for driving in and around ***${rentalCity}***.  \n
        Have a great journey 🙋!`,
        subtitle: 'Booking Confirmed',
        image: new Image({
          url: 'http://unblast.com/wp-content/uploads/2020/09/Car-Rent-Vector-Illustration.jpg',
          alt: 'Booking Confirmed',
        }),
      }))
      conv.close();
    }
  }

  function getLocationPermission(conv, params, granted) {
    // granted: inferred first (and only) argument value, boolean true if granted, false if not
    const explicit = conv.arguments.get('PERMISSION') // also retrievable w/ explicit arguments.get
    if(explicit){
      user.location = conv.device.location.city;
    }else{
      user.location = 'PERMISSION DENIED';
    }
    conv.followup(CONSTANTS.Events.BookTicket);
  }

  app.intent(CONSTANTS.Intents.DefaultWelcomeIntent, welcome);
  app.intent(CONSTANTS.Intents.DefaultFallbackIntent, fallback);
  app.intent(CONSTANTS.Intents.BookTrainTicket, bookTrainTicket);
  app.intent(CONSTANTS.Intents.TrainTravelPlan, planTravelDates);
  app.intent(CONSTANTS.Intents.TrainTravelClass, selectTravelClass);
  app.intent(CONSTANTS.Intents.ChangeDestination, changeDestination);
  app.intent(CONSTANTS.Intents.StartOver, startOver);
  app.intent(CONSTANTS.Intents.TrainTravelClass_Yes, manualSeatSelectionIntent);
  app.intent(CONSTANTS.Intents.TrainTravelClass_No, randomSeatSelectionIntent);
  app.intent(CONSTANTS.Intents.TrainSeatSelection, seatSelection)
  app.intent(CONSTANTS.Intents.MakePayments, makePayment);
  app.intent(CONSTANTS.Intents.MakePayments_Completed, paymentReceived);
  app.intent(CONSTANTS.Intents.MakePayments_Completed_Yes, paymentReceivedYes);
  app.intent(CONSTANTS.Intents.RentCarIntent, rentCarFlowCheck);
  app.intent(CONSTANTS.Intents.RentCarForUser, rentCarForUser);
  app.intent(CONSTANTS.Intents.RentCarForGuest, rentCarForGuest);
  app.intent(CONSTANTS.Intents.RentCarForUser_No, rentCarForUserActionNo);
  app.intent(CONSTANTS.Intents.RentCarForUser_Yes, rentCarForUserActionYes);
  app.intent(CONSTANTS.Intents.CarSelection, selectCar);

 // Create a Dialogflow intent with the `actions_intent_PERMISSION` event
  app.intent(CONSTANTS.Intents.GetLocationPermission, getLocationPermission)


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);