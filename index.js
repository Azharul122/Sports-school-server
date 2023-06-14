const express = require("express");
require('dotenv').config()
const cors = require("cors");
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

const app = express();
const port = process.env.PORT || 5000


const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}

// middleware
app.use(cors(corsOptions))
app.use(express.json());

// console.log(process.env.DB_USER);
// console.log(process.env.DB_KEY);

app.post('/jwt', (req, res) => {
  const user = req.body
  const token = jwt.sign(user, process.env.DB_ACCESS_TOKEN, { expiresIn: '1h' })
  res.send({ token })
})


app.get('/', (req, res) => {
  res.send("running")
})

app.listen(port, () => {
  console.log(`running on port :${port}`)
})


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


    const userCollecion = client.db("ass12DB").collection("users")
    const classesCollecion = client.db("ass12DB").collection("classes")
    const selectedcClassesCollecion = client.db("ass12DB").collection("selected-classes")
    const instructorsCollection = client.db("ass12DB").collection("instructors")
    const paymentsCollection = client.db("ass12DB").collection("payments")

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUsers = await userCollecion.findOne(query)
      if (existingUsers) {
        return res.send({ message: "user already exiists" })
      }
      const result = await userCollecion.insertOne(user)
    })

    app.get("/users", async (req, res) => {
      const result = await userCollecion.find().toArray();
      res.send(result)
    })

    app.get('/users/:email', async (req, res) => {
      const toyId = req.params.email;
      const query = { email: toyId };
      const result = await userCollecion.findOne(query);
      res.send(result)
    })

    app.post("/craete-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })
    app.get("/enrolled/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await paymentsCollection.find(query).toArray()
      res.send(result)
    })
    app.post("/payments", async (req, res) => {
      const payment = req.body
      const {itemId}=payment
      const result = await paymentsCollection.insertOne(payment)

      const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
      const deleteResult = await selectedcClassesCollecion.deleteMany(query)

      const incDec=await classesCollecion.updateMany
      (
        {itemId},
        {
          $inc:{
            NOS: 1,
            avilableSheets:-1
          }
        }
      )
      res.send({ result, deleteResult ,incDec})
    })


    app.get('/users/admin/:email', async (req, res) => {
      const toyId = req.params.email;
      const query = { email: toyId };
      const user = await userCollecion.findOne(query);
      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }
      const result = { admin: user?.role == 'admin' }
      console.log(result)
      res.send(result)
    })

    app.get("/classes", async (req, res) => {
      const result = await classesCollecion.find().toArray();
      res.send(result)
    })



    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result)
    })

    app.post("/selected-classes", async (req, res) => {
      const item = req.body
      const result = await selectedcClassesCollecion.insertOne(item)
      res.send(result)
    })

    app.get("/selected-classes", async (req, res) => {
      const result = await selectedcClassesCollecion.find().toArray();
      res.send(result)
    })

    app.get("/selected-classes/email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await selectedcClassesCollecion.find(query).toArray()
      res.send(result)
    })


    app.patch("/classes/approve/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDocument = {
        $set: {
          status: "approved"
        }
      }
      const result = await classesCollecion.updateOne(query, updateDocument)
      res.send(result)
    })
    app.patch("/classes/deny/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDocument = {
        $set: {
          status: "denied"
        }
      }
      const result = await classesCollecion.updateOne(query, updateDocument)
      res.send(result)
    })

    app.patch("/admin/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDocument = {
        $set: {
          role: "admin"
        }
      }
      const result = await userCollecion.updateOne(query, updateDocument)
      res.send(result)
    })

    app.patch("/instructor/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDocument = {
        $set: {
          role: "instructor"
        }
      }
      const result = await userCollecion.updateOne(query, updateDocument)
      res.send(result)
    })

    app.put("/class/feadback/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const clas = req.body
      const updateDocument = {
        $set: {
          feadBack: clas.feadBack
        }

      }
      const result = await classesCollecion.updateOne(query, updateDocument)
      res.send(result)
    })
    app.delete('/selected-classes/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await selectedcClassesCollecion.deleteOne(query)
      res.send(result)
    })

    app.post("/classes", async (req, res) => {
      const item = req.body
      const result = await classesCollecion.insertOne(item)
      res.send(result)
    })


    {/* avilableSheets,name,price,image,iname,iemail,feadBack:"",status:"pending" */ }

    app.put('/classUpadte/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      console.log(id)
      const options = { upsert: true }
      const clas = req.body;
      console.log(clas)
      const updatedClas = {
        $set: {
          name: clas.name,
          image: clas.image,
          price: clas.price,
          avilableSheets: clas.avilableSheets
        }
      }
      const result = classesCollecion.updateOne(query, updatedClas);
      res.send(result)

    })


    app.get('/clas/:id', async (req, res) => {
      const toyId = req.params.id;
      const query = { _id: new ObjectId(toyId) }
      const result = await classesCollecion.findOne(query);
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
