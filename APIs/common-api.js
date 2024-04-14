const exp = require('express')
const commonApp = exp.Router()

commonApp.get('./common',(req,res)=>{
  res.send({message:'Message from common app'})
})


// export
module.exports=commonApp;