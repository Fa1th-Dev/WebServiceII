const express = require('express');
const app = express();
let bodyParser = require('body-parser')
app.use(bodyParser.raw({type:"*/*"}))
const fs = require("fs")
var cors = require('cors')
app.use(cors())

let AccountDB = new Map()
let id = 0;
let tokenArray = []
let tokenDB = new Map()
let id2 = 0
let listingDB = new Map()
let cartDB = new Map()
let purchaseHistoryDB = new Map()
let messageDB = new Map()
let soldDB = new Map()
let shippingDB = new Map()
let hasBeenReviewedDB = new Map()
let reviewDB = new Map()

app.post("/signup", (req, res) => {
  let userName = JSON.parse(req.body).username
  let password = JSON.parse(req.body).password

    if (userName === undefined){
      return res.send(JSON.stringify({success:false,reason:"username field missing"}))
        return
    }
    if (password === undefined){
      return res.send(JSON.stringify({success:false,reason:"password field missing"}))
        return
    }
    if (AccountDB.has(userName)) {
        return res.send(JSON.stringify({success : false, reason: "Username exists"}))
        return
    }
    AccountDB.set(userName, {"password": password})
    return res.send(JSON.stringify({success : true}))
})

app.post("/login", (req, res)=> {
  let userName = JSON.parse(req.body).username
  let password = JSON.parse(req.body).password
        if (userName === undefined){
      return res.send(JSON.stringify({success:false,reason:"username field missing"}))
        return
    }
    if (password === undefined){
      return res.send(JSON.stringify({success:false,reason:"password field missing"}))
    }
    if (AccountDB.get(userName)===undefined){
      return res.send(JSON.stringify({success : false, reason : "User does not exist"}))
    }else if (AccountDB.get(userName).password !== password){
      return res.send(JSON.stringify({success : false, reason : "Invalid password"}))
    }
    else{
    let loginInfo = AccountDB.get(userName)
    let token = "t" +id
    loginInfo.token = token
    AccountDB.set(userName, loginInfo)
    tokenArray.push(token)
    tokenDB.set(token, {"userName": userName})
    id++
    return res.send(JSON.stringify({success:true,"token": token}))
    }
  
})

app.post("/change-password", (req, res)=> {
    let tokenHeader = (req.headers).token
    let oldPassword = JSON.parse(req.body).oldPassword
    let newPassword = JSON.parse(req.body).newPassword

  if (tokenHeader === undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
  else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  let person = tokenDB.get(tokenHeader).userName 
  if (AccountDB.get(person).password !== oldPassword){
    return res.send(JSON.stringify({success:false, reason: "Unable to authenticate"}))
  }
  else {
    AccountDB.set(person, {"password": newPassword})
    return res.send(JSON.stringify({success:true}))
  }
})

app.post("/create-listing", (req, res)=> {
      let tokenHeader = (req.headers).token
      let price = JSON.parse(req.body).price
      let description = JSON.parse(req.body).description
    if (tokenHeader === undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
    else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (price === undefined){
      return res.send(JSON.stringify({success:false,reason:"price field missing"}))
    }
    else if (description === undefined){
      return res.send(JSON.stringify({success:false,reason:"description field missing"}))
    }
  else {
    id2++
    let thisItemId = "li" + id2
    let person = tokenDB.get(tokenHeader).userName 
    listingDB.set(thisItemId, {"price": price, "description": description, "itemId": thisItemId,"sellerUsername":person})
    
    return res.send(JSON.stringify({success:true, listingId: thisItemId}))
  }
})

app.get("/listing", (req, res)=> {
  let listingId = req.query.listingId
  if (listingDB.get(listingId) === undefined){
    return res.send(JSON.stringify({success:false,reason:"Invalid listing id"}))
  }
  else{
    return res.send(JSON.stringify({success:true, listing: listingDB.get(listingId)}))
  }
})

app.post("/modify-listing", (req, res)=> {
        let tokenHeader = (req.headers).token
        let itemId = JSON.parse(req.body).itemid
        let description = JSON.parse(req.body).description
        let price = JSON.parse(req.body).price
    if (tokenHeader === undefined){
    return res.send(JSON.stringify({success:false, reason: "token field missing"}))
  }
    else if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
    else if (itemId === undefined){
    return res.send(JSON.stringify({success:false, reason: "itemid field missing"}))
  }
  else {
    let person = tokenDB.get(tokenHeader).userName 
    if(price !== undefined){
          listingDB.get(itemId).price = price
    }

    if(description !== undefined){
      listingDB.get(itemId).description = description
    }
    
        return res.send(JSON.stringify({success:true}))
  }
})

app.post("/add-to-cart", (req, res)=> {
    let tokenHeader = (req.headers).token
    let itemId = JSON.parse(req.body).itemid
    if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (itemId === undefined){
    return res.send(JSON.stringify({success:false, reason: "itemid field missing"}))
  }
  else if (listingDB.get(itemId) === undefined){
    return res.send(JSON.stringify({success:false, reason:"Item not found"}))
  }
  else{
    let person = tokenDB.get(tokenHeader).userName
    
    if (cartDB.get(person) === undefined){
      cartDB.set(person, {cartSize:0} )
    }
    
      let cartIndex = parseInt(cartDB.get(person).cartSize)
      cartIndex++
      cartDB.set(person, {cartSize:cartIndex} )
    
    let currentIndex = person + (cartDB.get(person).cartSize) +""

    
    let thisItemPrice = listingDB.get(itemId).price
    let thisItemDescription = listingDB.get(itemId).description 
    let thisItemSellerUserName = listingDB.get(itemId).sellerUsername
    
    cartDB.set(currentIndex, {price: thisItemPrice, description: thisItemDescription, itemId: itemId, sellerUsername: thisItemSellerUserName})
    
    return res.send(JSON.stringify({success:true}))
  }
})

app.get("/cart", (req, res)=> {
  let tokenHeader = (req.headers).token
  if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else {
    let person = tokenDB.get(tokenHeader).userName
    let cartSize = 0
    let returnArray = []
    for (let i = 0; i<100;i++){
      if (cartDB.get(person+i)!== undefined){
        cartSize++
      }
    }
    
    for (let j = 1;j<cartSize+1;j++){
      let currentIndex = person + j +""
      
      let thisItemPrice = cartDB.get(currentIndex).price
      let thisItemDescription = cartDB.get(currentIndex).description
      let thisItemId = cartDB.get(currentIndex).itemId
      let thisItemSellerUsername = cartDB.get(currentIndex).sellerUsername
      
      let obj = {price:thisItemPrice,
                 description:thisItemDescription,
                 itemId:thisItemId,
                 sellerUsername:thisItemSellerUsername}
      returnArray.push(obj)
    }
      

    return res.send(JSON.stringify({success:true, cart: returnArray}))
  }
  
})

app.post("/checkout", (req, res)=> {
    let tokenHeader = (req.headers).token
  if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  let person = tokenDB.get(tokenHeader).userName
  if (cartDB.get(person)=== undefined){
    return res.send(JSON.stringify({success:false, reason: "Empty cart"}))
  }
  let cartSize = 0
  let allItemsAvaliable = true
      for (let i = 0; i<100;i++){
      if (cartDB.get(person+i)!== undefined){
        cartSize++
      }
    }
  for (let j = 1;j<cartSize+1;j++){
      let currentIndex = person + j +""
      let checkingItem = cartDB.get(currentIndex).itemId
      if(listingDB.get(checkingItem) === undefined){
        allItemsAvaliable = false
      }
      }
  if (!allItemsAvaliable){
    return res.send(JSON.stringify({success:false, reason: "Item in cart no longer available"}))
  }
  else{
    for (let k = 1;k<cartSize+1;k++){
      let currentIndex = person + k +""
      let checkingItem = cartDB.get(currentIndex).itemId
      let transfer = listingDB.get(checkingItem)
      
      let freeIndex = 0
      for(let i = 0;i<100;i++){
        let testIndex = person + i +""
        if (purchaseHistoryDB.get(testIndex)=== undefined){
          freeIndex = i
          break
        }
      }
      let historyIndex = person + freeIndex +""
      let sellerId = listingDB.get(checkingItem).sellerUsername
      
      
      
      purchaseHistoryDB.set(historyIndex, transfer)
      soldDB.set(checkingItem, {id: checkingItem, sellerUsername:sellerId, buyerUsername:person})
      hasBeenReviewedDB.set(checkingItem, {hasBeenReviewed:false})
      listingDB.delete(checkingItem)
      }
    return res.send(JSON.stringify({success:true}))
  }
})
app.get("/purchase-history", (req, res)=> {
      let tokenHeader = (req.headers).token
  if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  let person = tokenDB.get(tokenHeader).userName
   let historySize = 0
      for (let i = 0; i<100;i++){
      if (purchaseHistoryDB.get(person+i)!== undefined){
        historySize++
      }
    }
  let returnArray = []
   for (let j = 0;j<historySize;j++){
      let currentIndex = person + j +""
      
      let thisItemPrice = purchaseHistoryDB.get(currentIndex).price
      let thisItemDescription = purchaseHistoryDB.get(currentIndex).description
      let thisItemId = purchaseHistoryDB.get(currentIndex).itemId
      let thisItemSellerUsername = purchaseHistoryDB.get(currentIndex).sellerUsername
      
      let obj = {price:thisItemPrice,
                 description:thisItemDescription,
                 itemId:thisItemId,
                 sellerUsername:thisItemSellerUsername}
      returnArray.push(obj)
    }
      

    return res.send(JSON.stringify({success:true, purchased: returnArray}))
  })

app.post("/chat", (req, res)=> {
  let tokenHeader = (req.headers).token
  
  if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  let destination = JSON.parse(req.body).destination
  let contents = JSON.parse(req.body).contents
  if (destination === undefined){
    return res.send(JSON.stringify({success:false, reason: "destination field missing"}))
  }
  else if (contents === undefined){
    return res.send(JSON.stringify({success:false, reason: "contents field missing"}))
  }
  else if (!AccountDB.has(destination)){
    return res.send(JSON.stringify({success:false, reason: "Destination user does not exist"}))
  }
  else {

    let person = tokenDB.get(tokenHeader).userName
    
    let personAndDestination = person + destination + ""
    let destinationAndPerson = destination + person + ""
    
    if (messageDB.get(personAndDestination) === undefined){
      messageDB.set(personAndDestination, {messageSize:0} )
    }
    if (messageDB.get(destinationAndPerson) === undefined){
      messageDB.set(destinationAndPerson, {messageSize:0} )
    }
    
    
      let messageIndex1 = parseInt(messageDB.get(personAndDestination).messageSize)
      messageIndex1++
      messageDB.set(personAndDestination, {messageSize:messageIndex1} )
    
      let messageIndex2 = parseInt(messageDB.get(destinationAndPerson).messageSize)
      messageIndex2++
      messageDB.set(destinationAndPerson, {messageSize:messageIndex2} )
    
    
    let currentIndex1 = personAndDestination + (messageDB.get(personAndDestination).messageSize) +""
    messageDB.set(currentIndex1, {from: person, contents: contents})
    
    let currentIndex2 = destinationAndPerson + (messageDB.get(destinationAndPerson).messageSize) +""
    messageDB.set(currentIndex2, {from: person, contents: contents})
    
      return res.send(JSON.stringify({success:true}))
  }
})

app.post("/chat-messages", (req, res)=> {
  let tokenHeader = (req.headers).token
  
  if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  let destination = JSON.parse(req.body).destination
  if (destination === undefined){
    return res.send(JSON.stringify({success:false, reason: "destination field missing"}))
  }
  else if (!AccountDB.has(destination)){
    return res.send(JSON.stringify({success:false, reason: "Destination user not found"}))
  }
  else{
    let person = tokenDB.get(tokenHeader).userName
    
    let messageSize1 = 0
    let personAndDestination = person + destination +""
    let returnArray = []
    
    for (let i = 0; i<100;i++){
      if (messageDB.get(personAndDestination+i)!== undefined){
        messageSize1++
      }
    }
    
    for (let j = 1;j<=messageSize1;j++){
      let currentIndex = personAndDestination + j +""
      let thisItemFrom = messageDB.get(currentIndex).from
      let thisItemContents = messageDB.get(currentIndex).contents

      let obj = {from:thisItemFrom,
                 contents:thisItemContents}
      returnArray.push(obj)
    } 

    return res.send(JSON.stringify({success:true, messages: returnArray}))

  }
})

app.post("/ship", (req, res)=> {
  let tokenHeader = (req.headers).token
  let person = tokenDB.get(tokenHeader).userName
  let itemId = JSON.parse(req.body).itemid
  if (!soldDB.has(itemId)){
    return res.send(JSON.stringify({success:false, reason: "Item was not sold"}))
  }
  else if (shippingDB.has(itemId)){
    return res.send(JSON.stringify({success:false, reason: "Item has already shipped"}))
  }
  else if (soldDB.get(itemId).sellerUsername !== person){
    return res.send(JSON.stringify({success:false, reason: "User is not selling that item"}))
  }
  else{
    shippingDB.set(itemId, {id:itemId, status:"shipped"})
     return res.send(JSON.stringify({success:true}))
  }
})

app.get("/status", (req, res)=> {
  let itemId = req.query.itemid
  
  if (!soldDB.has(itemId)){
    return res.send(JSON.stringify({success:false, reason: "Item not sold"}))
  }
  else if (shippingDB.get(itemId) === undefined){
    return res.send(JSON.stringify({success:true, status: "not-shipped"}))
  }
  else if (shippingDB.get(itemId).status !== "shipped"){
    return res.send(JSON.stringify({success:true, status: "not-shipped"}))
  }
  else {
    let status = shippingDB.get(itemId).status
    return res.send(JSON.stringify({success:true, status: status}))
  }
})

app.post("/review-seller", (req, res)=> {
let tokenHeader = (req.headers).token
let itemId = JSON.parse(req.body).itemid
let numStars = JSON.parse(req.body).numStars
let contents = JSON.parse(req.body).contents

  if (!tokenArray.includes(tokenHeader)){
    return res.send(JSON.stringify({success:false, reason: "Invalid token"}))
  }
  else if (soldDB.get(itemId) !== undefined){
    if (hasBeenReviewedDB.get(itemId).hasBeenReviewed){
    return res.send(JSON.stringify({success:false, reason: "This transaction was already reviewed"}))
    }
  }
  let person = tokenDB.get(tokenHeader).userName
  if (soldDB.get(itemId) === undefined){
    return res.send(JSON.stringify({success:false, reason: "User has not purchased this item"}))
  }
  else if (soldDB.get(itemId).buyerUsername !== person){
    return res.send(JSON.stringify({success:false, reason: "User has not purchased this item"}))
  }
  
  else {
    hasBeenReviewedDB.set(itemId, {hasBeenReviewed: true})
    let seller = soldDB.get(itemId).sellerUsername
    
    let freeIndex = 1
    
    for (let i = 0; i<100;i++){
      let testIndex = seller + freeIndex
      if (reviewDB.get(testIndex) === undefined){
        break
      }
      freeIndex++
    }
    let newIndex = seller + freeIndex +""
    reviewDB.set(newIndex, {from: person, numStars: numStars, contents: contents})
    
    
    return res.send(JSON.stringify({success:true}))
  }
})

app.get("/reviews", (req, res)=> {
  let sellerUsername = req.query.sellerUsername
  
  
  
   let messageSize1 = 1

    let returnArray = []
    
    for (let i = 1; i<100;i++){
      if (reviewDB.get(sellerUsername+i)!== undefined){
        messageSize1++
      }
    }
    console.log(messageSize1)
    for (let j = 1;j<messageSize1;j++){
      let currentIndex = sellerUsername + j +""
      
      let thisItemFrom = reviewDB.get(currentIndex).from
      let thisItemNumStars = reviewDB.get(currentIndex).numStars
      let thisItemContents = reviewDB.get(currentIndex).contents
      

      let obj = {from:thisItemFrom,
                 numStars:thisItemNumStars,
                 contents:thisItemContents}
      returnArray.push(obj)
    } 

    return res.send(JSON.stringify({success:true, reviews: returnArray}))
})

app.get("/selling", (req, res)=> {
  let sellerUsername = req.query.sellerUsername
  
  if (sellerUsername === undefined){
    return res.send(JSON.stringify({success:false, reason: "sellerUsername field missing"}))
  }
  else{
    let returnArray = []
    
    
listingDB.forEach(function(value, key) {
	console.log(key + " = " + value.sellerUsername);
  if (value.sellerUsername === sellerUsername){

      let thisItemPrice = value.price
      let thisItemDescription = value.description
      let thisItemSellerUsername = value.sellerUsername
      let thisItemItemId = value.itemId
    
          let obj = {price:thisItemPrice,
                 description:thisItemDescription,
                 sellerUsername:thisItemSellerUsername,
                    itemId:thisItemItemId}
      returnArray.push(obj)
  }
})
    return res.send(JSON.stringify({success:true, selling: returnArray}))
  }
  })

app.get("/sourcecode", (req, res) => {
res.send(require('fs').readFileSync(__filename).toString())
})

app.listen(process.env.PORT || 3000)
