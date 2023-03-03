const mongoose = require("mongoose");

const isValidName = function (value) {
    if (
      typeof value === "string" &&
      value.trim().length > 0 &&
      /[a-zA-Z\D ]*$/.test(value)
    )
      return true;
    return false;
  };
  const isValidT = function (value) {   //title
    if (
      typeof value === "string" &&
      value.trim().length > 0 &&
      /[a-zA-Z0-9 ]*$/.test(value)
    )
      return true;
    return false;
  };

const isValid = function (value) {
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};

const isValidMobile = function (value) {
  if (typeof value === "string" && /^[0-9]\d{9}$/gi.test(value)) return true;
  return false;
};

const isValidpin = function (value) {
  if (/[0-9]\d{5}$/gi.test(value)) return true;
  return false;
};

const isValidEmail = function (value) {
  if (/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(value) && value.trim().length > 0) return true;
  return false;
};

const isValidPassword = function (value) {
  if ( typeof value === "string" && value.trim().length > 0 && /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(value)) return true;
  return false;
};

const isValidRequestBody = function (requestBody) {
  return Object.keys(requestBody).length > 0;
};

const isValidObjectId = function (objectId) {
  return mongoose.Types.ObjectId.isValid(objectId);  
}
const isValidPrice =(price)=>{
  return /^[1-9]\d{0,7}(?:\.\d{1,2})?$/.test(price)
}
const isValidI = function (value) {
    if (/[0-9]$/.test(value)) return true;
    return false;
  };
  const isValidAvailableSizes = function(size) {
    return ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size) == true
  }

const addressStreetRegex = function (value) {
  if (/^[a-zA-Z0-9 -\.]+$/.test(value)) return true;
  return false;
};

const addressCityRegex = function (value) {
  if (/^[a-zA-Z ]+$/.test(value)) return true;
  return false;
};

module.exports = { isValid,isValidT, isValidRequestBody, isValidObjectId, isValidEmail, isValidPassword,
    isValidName, isValidMobile, isValidpin,isValidPrice,isValidAvailableSizes,isValidI,addressCityRegex,addressStreetRegex };
