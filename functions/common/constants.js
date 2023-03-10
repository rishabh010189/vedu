/**
 * CONSTANTS DECLARATIONS
 */

var CONSTANTS = {
    Intents : {
      DefaultWelcomeIntent : 'Default Welcome Intent',
      DefaultFallbackIntent : 'Default Fallback Intent',
      BookTrainTicket : 'Book.train.ticket',
      TrainTravelPlan : 'Train.travel.plan',
      TrainTravelClass : 'Train.travel.class',
      GetLocationPermission : 'Get.location.permission',
      ChangeDestination : 'Change.destination',
      StartOver: 'Start.over',
      TrainSeatSelection: 'Train.seat.selection',
      TrainTravelClass_Yes : 'Train.travel.class - yes',
      TrainTravelClass_No : 'Train.travel.class - no',
      MakePayments : 'Payments.make',
      MakePayments_Completed: 'Payments.make - completed',
      MakePayments_Completed_Yes :'Payments.make - completed - yes',
      RentCarIntent: 'Rent.car.intent',
      RentCarForUser: 'Rent.car.user',
      RentCarForGuest: 'Rent.car.guest',
      RentCarForUser_No : 'Rent.car.user - no',
      RentCarForUser_Yes :'Rent.car.user - yes',
      CarSelection : 'Car.selection'
    },
  
    Events : {
      BookTicket : 'event-book-ticket',
      TravelPlan : 'event-travel-plan',
      TrainClass : 'event-train-class',
      Welcome : 'event-default-welcome',
      ChangeDestination: 'event-change-destination',
      StartOver: 'event-start-over',
      TrainSeatSelection : 'event-seat-selection',
      MakePayments: 'event-make-payment',
      RentCarForUser: 'event-rent-car-user',
      RentCarForGuest: 'event-rent-car-guest',
      CarSelection: 'event-car-selection'
    },
  
    Contexts : {
      JourneyStationsData : 'journey-stations-data',
      ShowBookTicketsData : 'show-book-tickets-data',
      UserTicketsData : 'user-tickets-data',
      CarRentData:'car-rent-data'
    }
  }
  
  Object.freeze(CONSTANTS);

  module.exports = CONSTANTS;