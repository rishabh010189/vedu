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
      StartOver: 'Start.over'
    },
  
    Events : {
      BookTicket : 'event-book-ticket',
      TravelPlan : 'event-travel-plan',
      TrainClass : 'event-train-class',
      Welcome : 'event-default-welcome',
      ChangeDestination: 'event-change-destination',
      StartOver: 'event-start-over'
    },
  
    Contexts : {
      JourneyStationsData : 'journey-stations-data',
      ShowBookTicketsData : 'show-book-tickets-data'
    }
  }
  
  Object.freeze(CONSTANTS);

  module.exports = CONSTANTS;