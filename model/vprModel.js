// const db = require('../config/database');
const excel = require('exceljs')
const fs = require('fs')
const path = require('path')
const moment = require('moment')


function generateRandomText(length) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }
    return result;
}


module.exports = { 
    generateRandomText
};