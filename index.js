const express = require("express");
const cors = require("cors");
// const cars=require('./category.json')
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000


const corsOptions ={
  origin:'*', 
  credentials:true,
  optionSuccessStatus:200,
}

// middleware
app.use(cors(corsOptions))
app.use(express.json());

// console.log(process.env.DB_USER);
// console.log(process.env.DB_KEY);



app.get('/', (req, res) => {
    res.send("running")
})

app.listen(port,()=>{
console.log(`running on port :${port}`)
} )


// MongoDB


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.q7fc5xn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollecion=client.db("ass12DB").collection("users")
    const classesCollecion=client.db("ass12DB").collection("classes")
    const selectedcClassesCollecion=client.db("ass12DB").collection("selected-classes")
    const instructorsCollection=client.db("ass12DB").collection("instructors")
    
    app.post("/users",async(req,res)=>{
      const user=req.body;
      const query={email: user.email}
      const existingUsers=await userCollecion.findOne(query)
    if(existingUsers){
     return res.send({message:"user already exiists"})
    }
    const result=await userCollecion.insertOne(user)
    })
    
    app.get("/users",async(req,res)=>{
      const result=await userCollecion.find().toArray();
      res.send(result)
    })
 
    
    app.get("/classes",async (req,res)=>{
      const result=await classesCollecion.find().toArray();
      res.send(result)
    })
    
    app.get("/instructors",async (req,res)=>{
      const result=await instructorsCollection.find().toArray();
      res.send(result)
    })
    
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
