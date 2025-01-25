  
  
  process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log("Unhandled rejection occured! Shutting down ...")
   
   server.on(() => {
   process.exit(1)
   })
  
   
  })
  
  const PORT = process.env.PORT || 7000;
  let server;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception occurred! Shutting down ...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});




const app = require("./app")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
dotenv.config({path: "./config.env" })


mongoose.connect(process.env.CONN_STR, {
    useNewUrlParser: true , useUnifiedTopology: true,         
  }).then(coon => {
    console.log("Db connection successful")
  })

  mongoose.connection.on('error', err => {
    console.error('Connection error:', err);
  });
  
  mongoose.connection.once('open', () => {
    console.log('Connected to the database');
  });


  server = app.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });