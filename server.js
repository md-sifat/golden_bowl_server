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
        const sessions = client.db(process.env.MONGO_DB_NAME).collection("sessions");

        app.get('/sessions/active', async (req, res) => {
            try {
                const session = await sessions.findOne({ _id: "active-session" });
                if (session) {
                    res.status(200).json(session);
                } else {
                    res.status(404).json({ message: 'No active session found' });
                }
            } catch (err) {
                res.status(500).json({ message: 'Server error', error: err.message });
            }
        });

        app.put('/sessions/active', async (req, res) => {
            const { user, role, loggedIn } = req.body;

            if (!user || !role) {
                return res.status(400).json({ message: 'User and role are required' });
            }

            try {
                const result = await sessions.updateOne(
                    { _id: 'active-session' },
                    { $set: { user, role, loggedIn, updatedAt: new Date() } },
                    { upsert: true }
                );

                res.status(200).json({ message: 'Session updated successfully', result });
            } catch (err) {
                res.status(500).json({ message: 'Server error', error: err.message });
            }
        });


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
        app.get('/users/role', async (req, res) => {
            const { email, role } = req.query;
            if (!email || !role) {
                return res.status(400).send({ message: 'Email and role are required' });
            }
            try {
                const user = await userCollection.findOne({
                    email: email,
                    role: role
                });
                if (!user) {
                    return res.status(404).send({ message: 'User not found with given email and role' });
                }
                res.status(200).send(user);
            } catch (error) {
                res.status(500).send({ message: 'Error fetching user', error });
            }
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
                const { _id, ...updatedItem } = req.body;
                const filter = { _id: new ObjectId(id) };
                const updateDoc = { $set: updatedItem };
                const result = await itemCollection.updateOne(filter, updateDoc);
                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "Item updated successfully" });
                } else {
                    res.send({ success: false, message: "No changes made or item not found" });
                }
            } catch (error) {
                console.error("Error updating item:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });

        // all the routes api related to orders and maintain them : 

        app.get('/orders', async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        });

        app.post('/orders', async (req, res) => {
            try {
                const order = req.body;
                if (!order.items || !order.totalPrice || !order.status || !order.createdAt) {
                    return res.status(400).json({ message: 'All order fields are required' });
                }

                const result = await orderCollection.insertOne(order);
                console.log('Insert result:', result);

                res.status(201).json({
                    message: 'Order created successfully',
                    orderId: result.insertedId,
                });
            } catch (err) {
                console.error('Error inserting order:', err);
                res.status(500).json({ message: 'Server error', error: err.message });
            }
        });


        app.put("/orders/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { _id, ...updatedItem } = req.body;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = { $set: updatedItem };

                const result = await orderCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "Item updated successfully" });
                } else {
                    res.send({ success: false, message: "No changes made or item not found" });
                }
            } catch (error) {
                console.error("Error updating item:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
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
