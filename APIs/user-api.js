// create user api app
const exp = require('express')
const userApp = exp.Router()
const bcryptjs = require('bcryptjs')
const expressAsyncHandler = require('express-async-handler')
const jwt=require('jsonwebtoken')
require('dotenv').config()
const verifyToken=require('../Middlewares/verifyToken')

let userscollection;
let articlescollection
// get userscollection app
userApp.use((req, res, next) => {
  userscollection = req.app.get('userscollection')
  articlescollection=req.app.get('articlescollection')
  next()
})

// user registration route
userApp.post('/user', expressAsyncHandler(async(req, res) => {
  // get user resource from client
  const newUser = req.body;
  // check for duplicate user based on username
  const dbUser = await userscollection.findOne({ username: newUser.username })
  // if user found in db
  if (dbUser !== null) {
    res.send({ message: "user existed" })
  } else {
    // hash the password
    const hashedPassword = await bcryptjs.hash(newUser.password, 6)
    // replace the password with hashed password
    newUser.password = hashedPassword
    // create user
    const dbres = await userscollection.insertOne(newUser)
    // send res
    if (dbres.acknowledged === true) {
      res.send({ message: 'user created' })
    } else {
      res.send({ message: 'Try again, user not created' })
    }
  }
})
)

// user login route
userApp.post('/login',expressAsyncHandler(async(req,res)=>{
  // get cred obj from client
  const userCred=req.body
  // check the user name
  const dbUser = await userscollection.findOne({username:userCred.username})
  if(dbUser===null){
    res.send({message:'Invalid username'})
  }
  // check password
  else{
    const status = await bcryptjs.compare(userCred.password,dbUser.password)
    if(status===false){
      res.send({message:'Invalid password'})
    }else{
      // create jwt web token and encode it
      const signedToken = jwt.sign({username:dbUser.username},process.env.SECRET_KEY,{expiresIn:'1d'})
      // send res
      res.send({message:'login success',token:signedToken,user:dbUser})
    }

  }
}))

// get articles of all authors
userApp.get('/articles',verifyToken,expressAsyncHandler(async(req,res)=>{
  // get articlescollection form express app
  const articlescollection=req.app.get('articlescollection')
  // get all articles
  let articlesList = await articlescollection.find({status:true}).toArray()
  // send res
  res.send({message:"articles",payload:articlesList})
}))

// post comments for an article by article id
userApp.post('/comment/:articleId',verifyToken,expressAsyncHandler(async(req,res)=>{
  // get user comment obj
  const userComment=req.body
  // get articleId by url parameter
  const articleIdFromUrl = (+req.params.articleId)
  // insert userComment object to comments array of article by id
  const result=await articlescollection.updateOne({articleId:articleIdFromUrl},{$addToSet:{Comments:userComment}})
  res.send({message:"comment posted"})
}))

// export userApp
module.exports = userApp;