// create author api app
const exp = require('express')
const authorApp = exp.Router()
const expressAsyncHandler = require('express-async-handler')
const bcryptjs = require('bcryptjs')
const jwt=require('jsonwebtoken')
const verifyToken=require('../Middlewares/verifyToken')


let authorscollection;
let articlescollection;
// get authorcollection app
authorApp.use((req, res, next) => {
  authorscollection = req.app.get('authorscollection')
  articlescollection = req.app.get('articlescollection')
  next()
})

// author registration route
authorApp.post('/author', expressAsyncHandler(async(req, res) => {
  // get user resource from client
  const newUser = req.body;
  // check for duplicate user based on username
  const dbUser = await authorscollection.findOne({ username: newUser.username })
  // if user found in db
  if (dbUser !== null) {
    res.send({ message: "author existed" })
  } else {
    // hash the password
    const hashedPassword = await bcryptjs.hash(newUser.password, 6)
    // replace the password with hashed password
    newUser.password = hashedPassword
    // create user
    const dbres = await authorscollection.insertOne(newUser)
    // send res
    if (dbres.acknowledged === true) {
      res.send({ message: 'author created' })
    } else {
      res.send({ message: 'Try again, author not created' })
    }
  }
})
)

// author login route
authorApp.post('/login',expressAsyncHandler(async(req,res)=>{
  // get cred obj from client
  const userCred=req.body
  // check the user name
  const dbUser = await authorscollection.findOne({username:userCred.username})
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

// adding new article by author
authorApp.post('/article',verifyToken,expressAsyncHandler(async(req,res)=>{
  // get new article by author
  const newArticle=req.body
  // post to articles collection
  await articlescollection.insertOne(newArticle)
  // send res
  res.send({message:"New article created"})
}))

//modify artcile by author
authorApp.put('/article',verifyToken,expressAsyncHandler(async(req,res)=>{
  //get modified article from client
  const modifiedArticle=req.body;
 
  //update by article id
 let result= await articlescollection.updateOne({articleId:modifiedArticle.articleId},{$set:{...modifiedArticle}})
  let latestArticle=await articlescollection.findOne({articleId:modifiedArticle.articleId})
  res.send({message:"Article modified",article:latestArticle})
}))

//delete/restore an article by article ID
authorApp.put('/article/:articleId',verifyToken,expressAsyncHandler(async(req,res)=>{
  //get articleId from url
  const artileIdFromUrl=(+req.params.articleId);
  //get article 
  const articleToDelete=req.body;

  if(articleToDelete.status===true){
     let modifiedArt= await articlescollection.findOneAndUpdate({articleId:artileIdFromUrl},{$set:{...articleToDelete,status:false}},{returnDocument:"after"})
     res.send({message:"article deleted",payload:modifiedArt.status})
  }
  if(articleToDelete.status===false){
      let modifiedArt= await articlescollection.findOneAndUpdate({articleId:artileIdFromUrl},{$set:{...articleToDelete,status:true}},{returnDocument:"after"})
      res.send({message:"article restored",payload:modifiedArt.status})
  }
 
}))

// read articles of author
authorApp.get('/articles/:username',verifyToken,expressAsyncHandler(async(req,res)=>{
  // get author's username from url
  const authorName=req.params.username
  // get articles whose status is true
  const articlesList=await articlescollection.find({status:true,username:authorName}).toArray()
  res.send({message:"List of articles",payload:articlesList})
}))

// read deleted articles by author
authorApp.get('/deletedArticles/:username',verifyToken,expressAsyncHandler(async(req,res)=>{
  // get author's username from url
  const authorName=req.params.username
  // get articles whose status is false
  const articlesList=await articlescollection.find({status:false,username:authorName}).toArray()
  res.send({message:"List of articles",payload:articlesList})
}))

// export authorApp
module.exports = authorApp;