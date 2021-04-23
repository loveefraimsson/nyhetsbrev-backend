var express = require('express');
var router = express.Router();
const fs = require("fs");
const cors = require("cors");
let rand = require("random-key");
const app = require('../app');
const { resolveSoa } = require('dns');
let CryptoJS = require("crypto-js")

router.use(cors());


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Start-sida för inlämningsuppgiften Nyhetsbrev, för att logga in som admin, klicka på länken: https://nyhetsbrevet.herokuapp.com/admin');
});



//ROUTER FÖR ATT ÄNDRA SIN STATUS PÅ NYHETSBREVET
router.post("/change", function(req, res) {
  let newsletterChange = req.body;

  //Går in och ändrar status på newsletter
  req.app.locals.db.collection("users").updateOne({"id": newsletterChange.id}, {$set: {"newsletter": newsletterChange.newsletter}})
  .then(results => {
    res.json("Det har ändrats");
  })
})



//REGISTRERA NY ANVÄNDARE OCH LOGGA IN DEN
router.post("/new", function(req, res) {
  let newUser = req.body;

  //Söker efter användaren som har skickats från front-end
  req.app.locals.db.collection("users").find({"userName":newUser.userName}).toArray()
  .then(results => {

    //Om den inte hittar någon kan vi registrera en med användarens uppgifter
    if(results == "") {

      usersPassword = newUser.password

      //Krypterar användarens lösenord
      usersPasswordCrypt = CryptoJS.AES.encrypt(usersPassword, "saltNyckel").toString();

      newUser.password = usersPasswordCrypt;

      newUser.id = rand.generateDigits(8);

      //Lägger till användaren i databasen och skickar deras id och prenumerationsstatus till front-enden
      req.app.locals.db.collection("users").insertOne(newUser)
      .then(result => {
        res.json({"userId": newUser.id, "newsletter": newUser.newsletter});
      })
     
    }
    //Skickar error till front-enden om användarnamnet fanns och därmed var upptaget
    else {
      res.json("ERROR");
    }
  })
})


// //LOGGA IN ANVÄNDARE
router.post("/check", function(req, res) {
  let checkUser = req.body;

  //Söker efter användaren som har skickats från front-end
  req.app.locals.db.collection("users").find({"userName":checkUser.userName}).toArray()
  .then(results => {

    //Om den inte hittar användaren i databasen skickar den tillbaka error till front-end
    if(results == "") {
      res.json({"code": "Error"});
    }
    else {
      //Om användaren hittas avkrypteras lösenordet och användaren loggas in, och skickar tillbaka id och prenumerationsstatus till front-end
      let decryptPass = CryptoJS.AES.decrypt(results[0].password, "saltNyckel").toString(CryptoJS.enc.Utf8);

      if(decryptPass == checkUser.password) {
        res.json({"code": "OK", "userId": results[0].id, "newsletter": results[0].newsletter});
      }
      else {
        res.json({"code": "Error"});
      }
    }
  })
})


//Admin-login för monolit
let printAdminForm = `<p>Logga in som admin:</p>
                        <form action='/users/admin' method='post'>
                        <input type='text' id='adminLoginInput' name='adminLoginInput'></input><br>
                        <button type='submit' id='adminLoginBtn'>Logga in</button></form>`;



//PRINTAR LOGIN FÖR ADMIN
router.get("/admin", function(req, res) {
  res.send(printAdminForm);
});


//CHECKAR ATT ADMIN LOGGAR IN MED RÄTT LÖSENORD
router.post("/admin", function(req, res) {

  let adminInput = req.body.adminLoginInput;
  let adminPassword = "admin";

  if(adminInput == adminPassword) {

    //Söker efter information i databasen och printar ut det som efterfrågas
    req.app.locals.db.collection("users").find().toArray()
    .then(results => {

      let printInfo = "<section><h2>Alla användare</h2><ul>";

      for(user in results) {
        printInfo += "<li>" + results[user].userName + "</li>";
      }
      
      printInfo += "</ul></section><section><h2>Alla prenumeranter på nyhetsbrevet</h2><ul>";

      for (user in results) {
        if(results[user].newsletter == "true") {
          printInfo += "<li>" + results[user].email + "</li>";
        }
      }

      printInfo += "</ul></section>";

      res.send(printInfo);
    })
  }
  else {
    res.send(printAdminForm + "Fel lösenord. Testa igen!");
  }
})


module.exports = router;
