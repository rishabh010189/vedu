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
    },

    isCorrectDateFormat : function (date) {
        var regex = /((0[1-9]|1[0-9]|2[0-9]|3[0-1])\/(0[1-9]|1[0-2])\/((19|20)\d\d))$/;
        if(date){
            return regex.test(date);
        }
        return false;
    }
}

module.exports = utility;