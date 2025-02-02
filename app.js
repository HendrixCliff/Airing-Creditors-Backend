const express = require("express")
const app = express()
const CustomError = require("./Utils/CustomError")
const globalErrorHandler = require("./controllers/errorController")
const rateLimit = require("express-rate-limit")
const sanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require("xss-clean")
const bodyParser = require('body-parser')
// const hpp = require("hpp")
const authRoute = require("./routes/authRoute")
const userRoute = require("./routes/userRoute")
// const paymentRoute = require("./routes/paymentRoute")
// const airtimeRoute = require("./routes/airtimeRoute")
const cookieParser = require('cookie-parser');
const cors = require('cors')




app.use(helmet())
const limiter = rateLimit({
    max: process.env.RATE_LIMIT_MAX || 1000,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP. Please try again after an hour."
});


app.use('/api', limiter)
app.use(cookieParser()); //Parses cookies into req.cookies
app.use( (req, res, next) => {
    console.log("Custom Middleware")
    next()
})


app.use(cors({
    origin: ['https://airing-creditors.netlify.app', 'https://8fa0-105-112-176-62.ngrok-free.app'], // Allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use((req, res, next) => {
    console.log('CORS Headers:', res.getHeaders());
    next();
});
app.options("*", cors());  

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