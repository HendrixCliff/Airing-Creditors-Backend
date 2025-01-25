const express = require("express")
const app = express()
const CustomError = require("./Utils/CustomError")
const globalErrorHandler = require("./controllers/errorController")
// const  userRouter = require("./Routes/userRoute")
const rateLimit = require("express-rate-limit")
const sanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require("xss-clean")
const bodyParser = require('body-parser');
// const hpp = require("hpp")
const authRoute = require("./routes/authRoute")
const userRoute = require("./routes/userRoute")
// const paymentRoute = require("./routes/paymentRoute")
// const airtimeRoute = require("./routes/airtimeRoute")
const cookieParser = require('cookie-parser');
const cors = require('cors')



app.use(helmet())
let limiter = rateLimit({
   max: 15,
   windowMs: 60 * 60 * 1000, //1 hour
   message: " We have received too many request from  this IP. Please try after one hour"
})

app.use('/api', limiter)
app.use(cookieParser()); //Parses cookies into req.cookies
app.use( (req, res, next) => {
    console.log("Custom Middleware")
    next()
})
const corsOptions = {
    origin: 'http://localhost:5173', // your frontend's origin
    credentials: true, // this allows the session cookie to be sent back and forth
  };

app.use(cors(corsOptions));
app.use(express.json())
app.use(bodyParser.json());


app.use("/api/v1/auth", authRoute)
app.use("/api/v1/users", userRoute)
// app.use("/api/v1/payments", paymentRoute)
// app.use('/api/v1/airtime', airtimeRoute); 








app.use(sanitize())

app.use(xss())

app.use((req,res,next) => {
    req.requestedAt = new Date().toISOString() 
    next()
 })


 app.all( "*", (req, res, next) => { 
    next(new CustomError(`Can't find ${req.originalUrl} on the server!`, 404))}) 

    app.use(globalErrorHandler)
  
    
    

module.exports = app