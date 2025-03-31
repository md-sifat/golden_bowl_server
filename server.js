const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.MONGO_APP_NAME}`;

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
        // await client.connect();

        const userCollection = client.db(process.env.MONGO_DB_NAME).collection("users");
        const itemCollection = client.db(process.env.MONGO_DB_NAME).collection("items");
        const orderCollection = client.db(process.env.MONGO_DB_NAME).collection("orders");
        
        // all the api routes related to users , login and registration 

        app.get('/users', async (req, res) => {
            const user = await userCollection.find().toArray();
            res.send(user);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(`delete request has come`);
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        // all the routes api related to fetch and modify items 

        app.get('/items', async (req, res) => {
            const items = await itemCollection.find().toArray();
            res.send(items);
        });

        app.get('/items/:category', async (req, res) => {
            const category = req.params.category;
            const items = await itemCollection.find({ category: category }).toArray();
            res.send(items);
        });
        

        app.post('/items', async (req, res) => {
            const item = req.body;
            const result = await itemCollection.insertOne(item);
            console.log(result);
            res.send(result);
        });

        app.get('/items/:id', async (req, res) => {
            try {
                const itemID = req.params.id;
                console.log(itemID);
                const item = await itemCollection.findOne({ _id: new ObjectId(itemID) });
                console.log(item);
                if (!item) {
                    return res.status(404).json({ message: "item not found" });
                }
                res.json(item);
            } catch (error) {
                res.status(500).json({ message: "Server error" });
            }
        });

        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await itemCollection.deleteOne(query);
            res.send(result);
        });
        app.put("/items/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { _id, ...updateditem } = req.body; // Exclude _id from update

                const filter = { _id: new ObjectId(id) };
                const updateDoc = { $set: updateditem };

                const result = await itemCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "item updated successfully" });
                } else {
                    res.send({ success: false, message: "No changes made or item not found" });
                }
            } catch (error) {
                console.error("Error updating item:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });

        // all the routes api related to orders and maintain them : 

        app.post('/orders', async (req, res) => {
            const item = req.body;
            const result = await orderCollection.insertOne(item);
            console.log(result);
            res.send(result);
        });



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("golden_bowl_side is LIVE");
});

app.listen(port, () => {
    console.log(`server is running on port : ${port}`);
}
);
